import { generateMood } from "../utils";
import { BuildingItem, ImpressionItem } from "../models/types";
import { openImpressionsDrawer } from "./impressionsDrawer";
import { openAddBuildingDrawer, setBuildings, setOnBuildingAdded } from "./buildingDrawer";
import { createDrawer, isOpen, closeDrawer } from "./drawer";
import apiClient from "../services/apiClient";


let buildings: BuildingItem[] = [];
let impressions: ImpressionItem[] = [];
async function getBuildings() {
    const response = await apiClient.get('/buildings');
    return response.data;
}

async function getImpressions(buildingId: string) {
    const response = await apiClient.get(`/buildings/${buildingId}/impressions`);
    return response.data;
}

// Variables for drag functionality
let activeElement: HTMLElement | null = null;
let initialX: number, initialY: number, offsetX: number, offsetY: number;
let canvas: HTMLElement;
let temporaryMarker: HTMLElement | null = null;

// Create a building marker
export function createBuildingMarker(building: BuildingItem): HTMLElement {
    const marker = document.createElement('div');
    marker.className = 'building-marker';
    marker.id = building.id;
    marker.style.left = `${building.xcoordinate}px`;
    marker.style.top = `${building.ycoordinate}px`;
    
    // Create the X marker
    marker.textContent = '✕';
    
    // Create the info card that appears on hover
    const infoCard = document.createElement('div');
    infoCard.className = 'building-info';
    
    // Populate the info card with building details
    infoCard.innerHTML = `
        <h3>${building.title}</h3>
        <p><strong>Designer:</strong> ${building.designer}</p>
        <p><strong>Year:</strong> ${building.year}</p>
        <p><strong>neighbourhood:</strong> ${building.neighbourhood}</p>
        <p><strong>Era:</strong> ${building.era}</p>
        <div class="building-info-actions">
            <button class="view-impressions">view impressions ${generateMood('eyes')}</button>
        </div>
    `;
    
    // Add the info card to the marker
    marker.appendChild(infoCard);
    
    // Add event listeners for hover behavior
    marker.addEventListener('mouseenter', () => {
        infoCard.classList.add('hover');
    });
    
    marker.addEventListener('mouseleave', (e) => {
        // Check if the mouse is moving to the info card
        const rect = infoCard.getBoundingClientRect();
        const isInInfoCard = 
            e.clientX >= rect.left && 
            e.clientX <= rect.right && 
            e.clientY >= rect.top && 
            e.clientY <= rect.bottom;
            
        if (!isInInfoCard) {
            infoCard.classList.remove('hover');
        }
    });

    // Add event listeners for the info card
    infoCard.addEventListener('mouseenter', () => {
        infoCard.classList.add('hover');
    });
    
    infoCard.addEventListener('mouseleave', () => {
        infoCard.classList.remove('hover');
    });
    
    // Make the marker draggable
    marker.addEventListener('mousedown', dragStart);
    
    // Add click event to open full building details
    marker.addEventListener('click', (e) => {
        // Prevent triggering when clicking buttons inside the info card
        if ((e.target as HTMLElement).tagName === 'BUTTON') {
            return;
        }
        
        // Show full building details (you can implement this functionality)
        console.log(`Showing details for building: ${building.id}`);
    });
    
    // Add event listeners for the view-impressions button
    const viewButton = infoCard.querySelector('.view-impressions');
    if (viewButton) {
        viewButton.addEventListener('click', async (e) => {
            const impressions = await getImpressions(building.id);
            e.stopPropagation(); // Prevent other click handlers
            openImpressionsDrawer(building.id, building, impressions);
        });
    }
    
    // Add event listeners for the add-impression button
    const addButton = infoCard.querySelector('.add-impression');
    if (addButton) {
        addButton.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent other click handlers
            openImpressionsDrawer(building.id, building, impressions);
            // After opening the drawer, show the add impression form
            setTimeout(() => {
                const addImpressionBtn = document.querySelector('.add-impression-btn');
                if (addImpressionBtn) {
                    (addImpressionBtn as HTMLElement).click();
                }
            }, 100);
        });
    }
    
    return marker;
}

/**
 * Creates a temporary marker at the specified position
 * @param x The x-coordinate
 * @param y The y-coordinate
 */
function createTemporaryMarker(x: number, y: number): void {
    // Remove any existing temporary marker
    removeTemporaryMarker();
    
    // Create a new temporary marker
    temporaryMarker = document.createElement('div');
    temporaryMarker.className = 'building-marker temporary-marker';
    temporaryMarker.textContent = '✕';
    
    // Position the marker
    // Adjust position to center the marker on the cursor
    temporaryMarker.style.left = `${x - 10}px`; // Subtract half the marker width (20px/2)
    temporaryMarker.style.top = `${y - 10}px`;  // Subtract half the marker height (20px/2)
    
    // Add pulsing animation
    temporaryMarker.style.animation = 'pulse 1.5s infinite';
    
    // Add to canvas
    canvas.appendChild(temporaryMarker);
}

/**
 * Removes the temporary marker
 */
function removeTemporaryMarker(): void {
    if (temporaryMarker && temporaryMarker.parentNode) {
        temporaryMarker.parentNode.removeChild(temporaryMarker);
        temporaryMarker = null;
    }
}

// Drag functions
function dragStart(e: MouseEvent): void {
    // Find the draggable parent element if clicked on a child
    activeElement = e.target as HTMLElement;
    while (activeElement && !activeElement.classList.contains('building-marker')) {
        activeElement = activeElement.parentElement;
    }
    
    if (!activeElement) return;
    
    // Don't start drag if clicking on a button or inside the info card
    if ((e.target as HTMLElement).tagName === 'BUTTON' || 
        (e.target as HTMLElement).closest('.building-info')) {
        return;
    }
    
    initialX = e.clientX;
    initialY = e.clientY;
    
    // Get the current position from the element's style
    const currentLeft = parseInt(activeElement.style.left) || 0;
    const currentTop = parseInt(activeElement.style.top) || 0;
    
    // Calculate offset as the difference between mouse position and current element position
    offsetX = initialX - currentLeft;
    offsetY = initialY - currentTop;
    
    activeElement.style.zIndex = '1000';
}

function drag(e: MouseEvent): void {
    if (!activeElement) return;
    
    e.preventDefault();
    
    const currentX = e.clientX - offsetX;
    const currentY = e.clientY - offsetY;
    
    // Get canvas boundaries
    const canvasRect = canvas.getBoundingClientRect();
    const maxX = canvasRect.width - activeElement.offsetWidth;
    const maxY = canvasRect.height - activeElement.offsetHeight;
    
    // Constrain to canvas
    const boundedX = Math.max(0, Math.min(currentX, maxX));
    const boundedY = Math.max(0, Math.min(currentY, maxY));
    
    activeElement.style.left = `${boundedX}px`;
    activeElement.style.top = `${boundedY}px`;
    
    // Update the building's position in our data model
    const buildingId = activeElement.id;
    const buildingIndex = buildings.findIndex(b => b.id === buildingId);
    if (buildingIndex !== -1) {
        buildings[buildingIndex].xcoordinate = boundedX;
        buildings[buildingIndex].ycoordinate = boundedY;
    }
}

function dragEnd(): void {
    if (!activeElement) return;
    activeElement.style.zIndex = '10';
    activeElement = null;
}

/**
 * Handles double-click on the canvas to add a new building
 * @param e The mouse event
 */
function handleCanvasDoubleClick(e: MouseEvent): void {
    // Make sure we're clicking on the canvas itself, not a building marker
    if ((e.target as HTMLElement).id === 'canvas') {
        // Get the click coordinates relative to the canvas
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Create a temporary marker at the click location
        createTemporaryMarker(x, y);
        
        // Open the add building drawer with these coordinates
        openAddBuildingDrawer(x, y);
        
        // Set up a listener to remove the temporary marker when the drawer closes
        const checkDrawerStatus = setInterval(() => {
            if (!isOpen()) {
                removeTemporaryMarker();
                clearInterval(checkDrawerStatus);
            }
        }, 500);
    }
}

/**
 * Handles when a new building is added
 * @param building The new building
 */
function handleNewBuilding(building: BuildingItem): void {
    // Remove the temporary marker
    removeTemporaryMarker();
    
    // Create a marker for the new building
    const marker = createBuildingMarker(building);
    
    // Add the marker to the canvas
    canvas.appendChild(marker);
}

// Initialize draggable canvas
export async function initializeDraggableCanvas(): Promise<void> {
    canvas = document.getElementById('canvas') as HTMLElement;
    
    if (!canvas) {
        console.error('Canvas element not found');
        return;
    }
    
    // Create the drawer
    createDrawer();

    // Get buildings and impressions
    buildings = await getBuildings();
    
    // Share the buildings and impressions arrays with the drawer
    setBuildings(buildings);
    setOnBuildingAdded(handleNewBuilding);
    
    // Add building markers to canvas
    buildings.forEach(building => {
        const marker = createBuildingMarker(building);
        canvas.appendChild(marker);
    });
    
    // Add a button to add new buildings
    const addBuildingButton = document.getElementById('add-building-btn');
    if (addBuildingButton) {
        addBuildingButton.addEventListener('click', () => {
            openAddBuildingDrawer();
        });
    }
    
    // Add double-click event listener to the canvas
    canvas.addEventListener('dblclick', handleCanvasDoubleClick);
    
    // Add event listeners for drag functionality
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);
} 