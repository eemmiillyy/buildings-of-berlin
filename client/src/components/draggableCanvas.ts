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

async function getBuildings() {
    const response = await apiClient.get('/buildings');
    return response.data;
}

async function getImpressions(buildingId: string) {
    const response = await apiClient.get(`/buildings/${buildingId}/impressions`);
    return response.data;
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

    // Get buildings
    buildings = await getBuildings();
    
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