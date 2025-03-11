import { BuildingItem } from '../models/types';
import { openDrawer, updateDrawerTitle, updateDrawerContent, closeDrawer } from './drawer';
import { openAddBuildingForm, resetBuildingForm } from './addBuildingForm';

let allBuildings: BuildingItem[] = [];
let onBuildingAdded: ((building: BuildingItem) => void) | null = null;
let initialX: number | null = null;
let initialY: number | null = null;

/**
 * Sets the buildings array reference
 * @param buildings Array of building items
 */
export function setBuildings(buildings: BuildingItem[]): void {
  allBuildings = buildings;
}

/**
 * Sets the callback for when a building is added
 * @param callback Function to call when a building is added
 */
export function setOnBuildingAdded(callback: (building: BuildingItem) => void): void {
  onBuildingAdded = callback;
}

/**
 * Opens the drawer to add a new building
 * @param x Optional x-coordinate for the new building
 * @param y Optional y-coordinate for the new building
 */
export function openAddBuildingDrawer(x?: number, y?: number): void {
  // Store the coordinates
  initialX = x !== undefined ? x : null;
  initialY = y !== undefined ? y : null;
  
  // Update drawer title
  const title = 'Add New Building';
  
  // Create the form
  const form = openAddBuildingForm(
    handleBuildingSubmit,
    handleBuildingCancel
  );
  
  // Open the drawer with the form
  openDrawer(title, form);
}

/**
 * Handles the submission of a new building
 * @param building The new building data
 */
function handleBuildingSubmit(building: Omit<BuildingItem, 'id'>): void {
  // Generate a unique ID for the building
  const newBuilding: BuildingItem = {
    ...building,
    id: `building${Date.now()}`,
    createdAt: new Date().toISOString(),
    // Use the stored coordinates if available, otherwise use the ones from the form
    xcoordinate: initialX !== null ? initialX : building.xcoordinate,
    ycoordinate: initialY !== null ? initialY : building.ycoordinate
  };
  
  // Add the building to the list
  allBuildings.push(newBuilding);
  
  // Call the onBuildingAdded callback
  if (onBuildingAdded) {
    onBuildingAdded(newBuilding);
  }
  
  // Close the drawer
  closeDrawer();
  
  // Reset the form for next use
  resetBuildingForm();
  
  // Reset the stored coordinates
  initialX = null;
  initialY = null;
}

/**
 * Handles cancellation of adding a new building
 */
function handleBuildingCancel(): void {
  // Close the drawer
  closeDrawer();
  
  // Reset the stored coordinates
  initialX = null;
  initialY = null;
} 