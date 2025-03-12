import { BuildingItem } from '../models/types';
import { openDrawer, closeDrawer } from './drawer';
import { openAddBuildingForm, resetBuildingForm } from './addBuildingForm';
import apiClient from '../services/apiClient';
import { v4 as uuidv4 } from 'uuid';
let allBuildings: BuildingItem[] = [];
let onBuildingAdded: ((building: BuildingItem) => void) | null = null;
let xcoordinate: number | null = null;
let ycoordinate: number | null = null;

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
export function openAddBuildingDrawer(x: number, y: number): void {
  // Store the coordinates
  xcoordinate = x;
  ycoordinate = y;
  
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
async function handleBuildingSubmit(building: Omit<BuildingItem, 'id'>): Promise<void> {
  // Generate a unique ID for the building
  const newBuilding: BuildingItem = {
    ...building,
    id: uuidv4(),
    // Adjust coordinates to center the marker (subtract half of marker width/height - 20px/2)
    xcoordinate: xcoordinate!,
    ycoordinate: ycoordinate!,
  };

  await apiClient.post('/buildings', newBuilding);
  
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
  xcoordinate = null;
  ycoordinate = null;
}

/**
 * Handles cancellation of adding a new building
 */
function handleBuildingCancel(): void {
  // Close the drawer
  closeDrawer();
  
  // Reset the stored coordinates
  xcoordinate = null;
  ycoordinate = null;
} 