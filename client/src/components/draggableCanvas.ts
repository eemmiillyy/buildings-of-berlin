import { generateMood } from "../utils";
import { BuildingItem, ImpressionItem } from "../models/types";
import { openImpressionsDrawer } from "./impressionsDrawer";
import { openAddBuildingDrawer, setBuildings, setOnBuildingAdded } from "./buildingDrawer";
import { createDrawer, isOpen, closeDrawer } from "./drawer";
import apiClient from "../services/apiClient";
import L from "leaflet";

let buildings: BuildingItem[] = [];
let map: L.Map;
let markers: { [key: string]: L.Marker } = {};
let temporaryMarker: L.Marker | null = null;
let selectedDesigners: Set<string> = new Set();

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
function createBuildingMarker(building: BuildingItem): L.Marker {
    // Create marker
    const marker = L.marker([building.ycoordinate, building.xcoordinate], {
        draggable: true,
        icon: L.divIcon({
            html: '✕',
            className: 'building-marker',
            iconSize: [20, 20]
        })
    });

    // Create popup content
    const popupContent = document.createElement('div');
    popupContent.className = 'building-popup';
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
    map = L.map('map').setView([52.52, 13.405], 13);

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
    buildings.forEach(building => {
        const marker = createBuildingMarker(building);
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
                html: '✕',
                className: 'building-marker',
                iconSize: [20, 20]  
            })
        });
        temporaryMarker.addTo(map);
        openAddBuildingDrawer(e.latlng.lng, e.latlng.lat);
    });
}

function handleNewBuilding(building: BuildingItem): void {
    const marker = createBuildingMarker(building);
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