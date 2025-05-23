import { generateMood } from "../utils";
import { BuildingItem } from "../models/types";
import { openImpressionsDrawer } from "./impressionsDrawer";
import { openAddBuildingDrawer, setBuildings, setOnBuildingAdded } from "./buildingDrawer";
import { createDrawer } from "./drawer";
import apiClient from "../services/apiClient";
import L from "leaflet";
import { ImageCarousel } from './imageCarousel';

let buildings: BuildingItem[] = [];
let map: L.Map;
let markers: { [key: string]: L.Marker } = {};
let temporaryMarker: L.Marker | null = null;
let selectedDesigners: Set<string> = new Set();
const imageCarousel = new ImageCarousel();

async function getBuildings() {
    const response = await apiClient.get('/buildings');
    return response.data;
}

async function getImpressions(buildingId: string) {
    const response = await apiClient.get(`/buildings/${buildingId}/impressions`);
    return response.data;
}

async function getDesigners(): Promise<string[]> {
    const response = await apiClient.get('/designers');
    return response.data;
}

function filterMarkersByDesigner() {
    buildings.forEach(building => {
        const marker = markers[building.id];
        if (selectedDesigners.size === 0 || 
            selectedDesigners.has(building.designer.toLowerCase())) {
            marker.addTo(map);
        } else {
            marker.remove();
        }
    });
}

function createDesignerButtons(designers: string[]): HTMLElement {
    const container = document.createElement('div');
    container.className = 'designer-buttons';
    
    // Create mobile select
    const mobileSelect = document.getElementById('mobile-designer-filter') as HTMLSelectElement;
    if (mobileSelect) {
        designers.forEach(designer => {
            const option = document.createElement('option');
            option.value = designer.toLowerCase();
            option.textContent = designer;
            mobileSelect.appendChild(option);
        });

        mobileSelect.addEventListener('change', (e) => {
            const target = e.target as HTMLSelectElement;
            selectedDesigners.clear();
            if (target.value !== 'all') {
                selectedDesigners.add(target.value);
            }
            filterMarkersByDesigner();
        });
    }
    
    // Create regular buttons for desktop
    designers.forEach(designer => {
        const button = document.createElement('button');
        button.className = 'designer-button';
        button.textContent = designer.charAt(0).toUpperCase() + designer.slice(1);
        button.addEventListener('click', () => {
            if (selectedDesigners.has(designer.toLowerCase())) {
                selectedDesigners.delete(designer.toLowerCase());
                button.classList.remove('active');
            } else {
                selectedDesigners.add(designer.toLowerCase());
                button.classList.add('active');
            }
            filterMarkersByDesigner();
        });
        container.appendChild(button);
    });
    
    return container;
}

// Create a building marker
async function createBuildingMarker(building: BuildingItem): Promise<L.Marker> {
    // Create marker
    const marker = L.marker([building.ycoordinate, building.xcoordinate], {
        icon: L.divIcon({
            html: '📍',
            className: 'building-marker',
            iconSize: [20, 20]
        })
    });

    // Create popup content
    const popupContent = document.createElement('div');
    popupContent.className = 'building-popup';

    // Create image gallery container
    const imageGallery = document.createElement('div');
    imageGallery.className = 'building-images';
    
    // Fetch and display images if they exist
    if (building.images && building.images.length > 0) {
        const images: HTMLImageElement[] = [];
        
        // Create loading placeholders first
        building.images.forEach(() => {
            const placeholder = document.createElement('div');
            placeholder.className = 'image-loading-placeholder';
            placeholder.innerHTML = `
                <div class="loading-spinner"></div>
                <p>Loading...</p>
            `;
            imageGallery.appendChild(placeholder);
        });
            
        building.images.forEach(async (filename, index) => {
            try {
                const response = await apiClient.get(`/image/${building.images[index]}`);                    
                const img = document.createElement('img');
                img.src = response.data;
                img.className = 'building-popup-image';
                img.style.cursor = 'pointer';
        
                // Store the image element in our array
                images.push(img);
        
                img.onclick = () => {
                    // Show all images in the carousel, starting at this image's index
                    imageCarousel.show(images, images.indexOf(img));
                };
            
                // Replace the placeholder with the actual image
                const placeholder = imageGallery.children[index];
                if (placeholder) {
                    imageGallery.replaceChild(img, placeholder);
                }
            } catch (error) {
                console.error('Failed to load image:', error);
                // Replace placeholder with error message
                const placeholder = imageGallery.children[index];
                if (placeholder) {
                    placeholder.innerHTML = '<p>Failed to load image</p>';
                    placeholder.className = 'image-loading-error';
                }
            }
        });
    }

    popupContent.innerHTML = `
        <h3>${building.title}</h3>
        <p><strong>Designer:</strong> ${building.designer}</p>
        <p><strong>Year:</strong> ${building.year}</p>
        <p><strong>Neighbourhood:</strong> ${building.neighbourhood}</p>
        <p><strong>Era:</strong> ${building.era}</p>
        <div class="building-popup-actions">
            <button class="view-impressions">view impressions ${generateMood('eyes')}</button>
        </div>
    `;

    // Insert image gallery after title
    const title = popupContent.querySelector('h3');
    if (title) {
        title.after(imageGallery);
    }

    // Add click handler for view impressions button
    const viewButton = popupContent.querySelector('.view-impressions');
    if (viewButton) {
        viewButton.addEventListener('click', async () => {
            const impressions = await getImpressions(building.id);
            openImpressionsDrawer(building.id, building, impressions);
        });
    }

    // Bind popup to marker
    marker.bindPopup(popupContent);

    // Handle marker drag end
    marker.on('dragend', async () => {
        const pos = marker.getLatLng();
        building.xcoordinate = pos.lng;
        building.ycoordinate = pos.lat;
        
        // Update building position in database
        try {
            await apiClient.put(`/buildings/${building.id}`, {
                xcoordinate: pos.lng,
                ycoordinate: pos.lat
            });
        } catch (error) {
            console.error('Failed to update building position:', error);
        }
    });

    return marker;
}

// Initialize map
export async function initializeDraggableCanvas(): Promise<void> {
    // Create map centered on Berlin
    map = L.map('map').setView([52.52, 13.405], 12);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Create the drawer
    createDrawer();

    // Get buildings and designers
    buildings = await getBuildings();
    const designers = await getDesigners();
    
    // Create and add designer filter buttons to sidebar
    const designerButtons = createDesignerButtons(designers);
    const designerFilter = document.getElementById('designer-filter');
    if (designerFilter && designerFilter.parentNode) {
        designerFilter.parentNode.replaceChild(designerButtons, designerFilter);
    }
    
    // Share the buildings array with the drawer
    setBuildings(buildings);
    setOnBuildingAdded(handleNewBuilding);
    
    // Add building markers to map
    buildings.forEach(async (building) => {
        const marker = await createBuildingMarker(building);
        markers[building.id] = marker;
        marker.addTo(map);
    });

    // Handle double-click to add new building
    map.on('dblclick', (e) => {
        // Remove any existing temporary marker
        if (temporaryMarker) {
            temporaryMarker.remove();
        }
        
        // Create new temporary marker
        temporaryMarker = L.marker(e.latlng, {
            draggable: true,
            icon: L.divIcon({
                html: '📍',
                className: 'building-marker',
                iconSize: [20, 20]  
            })
        });
        temporaryMarker.addTo(map);
        openAddBuildingDrawer(e.latlng.lng, e.latlng.lat);
    });
}

async function handleNewBuilding(building: BuildingItem): Promise<void> {
    const marker = await createBuildingMarker(building);
    markers[building.id] = marker;
    marker.addTo(map);
}

// Add cleanup function
export function cleanupTemporaryMarker(): void {
    if (temporaryMarker) {
        temporaryMarker.remove();
        temporaryMarker = null;
    }
} 