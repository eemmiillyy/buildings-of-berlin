import { BuildingItem, ImpressionItem } from '../models/types';

// Drawer state
let drawerElement: HTMLElement | null = null;
let overlayElement: HTMLElement | null = null;
let isDrawerOpen: boolean = false;
let currentContent: HTMLElement | null = null;
let currentTitle: string = '';

// Drawer types
export enum DrawerType {
  IMPRESSIONS = 'impressions',
  ADD_IMPRESSION = 'add-impression',
  ADD_BUILDING = 'add-building'
}

/**
 * Creates the drawer and adds it to the DOM
 */
export function createDrawer(): void {
  // Create drawer element if it doesn't exist
  if (!drawerElement) {
    drawerElement = document.createElement('div');
    drawerElement.className = 'drawer';
    drawerElement.innerHTML = `
      <div class="drawer-header">
        <h2>Drawer</h2>
        <button class="close-drawer">×</button>
      </div>
      <div class="drawer-content"></div>
    `;
    
    // Add close button functionality
    const closeButton = drawerElement.querySelector('.close-drawer');
    if (closeButton) {
      closeButton.addEventListener('click', closeDrawer);
    }
    
    document.body.appendChild(drawerElement);
  }
  
  // Create overlay element if it doesn't exist
  if (!overlayElement) {
    overlayElement = document.createElement('div');
    overlayElement.className = 'drawer-overlay';
    overlayElement.addEventListener('click', closeDrawer);
    document.body.appendChild(overlayElement);
  }
}

/**
 * Opens the drawer with the specified content
 * @param title The title to display in the drawer header
 * @param content The HTML element to display in the drawer
 */
export function openDrawer(title: string, content: HTMLElement): void {
  if (!drawerElement || !overlayElement) {
    createDrawer();
  }
  
  // Update drawer title
  const headerTitle = drawerElement?.querySelector('.drawer-header h2');
  if (headerTitle) {
    headerTitle.textContent = title;
    currentTitle = title;
  }
  
  // Update drawer content
  const drawerContent = drawerElement?.querySelector('.drawer-content');
  if (drawerContent) {
    // Clear previous content
    drawerContent.innerHTML = '';
    
    // Add new content
    drawerContent.appendChild(content);
    currentContent = content;
  }
  
  // Open the drawer
  drawerElement?.classList.add('open');
  overlayElement?.classList.add('active');
  isDrawerOpen = true;
  
  // Prevent body scrolling when drawer is open
  document.body.style.overflow = 'hidden';
}

/**
 * Updates the drawer title
 * @param title The new title
 */
export function updateDrawerTitle(title: string): void {
  if (!drawerElement || !isDrawerOpen) return;
  
  const headerTitle = drawerElement.querySelector('.drawer-header h2');
  if (headerTitle) {
    headerTitle.textContent = title;
    currentTitle = title;
  }
}

/**
 * Updates the drawer content
 * @param content The new content
 */
export function updateDrawerContent(content: HTMLElement): void {
  if (!drawerElement || !isDrawerOpen) return;
  
  const drawerContent = drawerElement.querySelector('.drawer-content');
  if (drawerContent) {
    // Clear previous content
    drawerContent.innerHTML = '';
    
    // Add new content
    drawerContent.appendChild(content);
    currentContent = content;
  }
}

/**
 * Closes the drawer
 */
export function closeDrawer(): void {
  drawerElement?.classList.remove('open');
  overlayElement?.classList.remove('active');
  isDrawerOpen = false;
  currentContent = null;
  
  // Re-enable body scrolling
  document.body.style.overflow = '';
}

/**
 * Checks if the drawer is currently open
 * @returns True if the drawer is open, false otherwise
 */
export function isOpen(): boolean {
  return isDrawerOpen;
}

/**
 * Gets the current drawer title
 * @returns The current drawer title
 */
export function getCurrentTitle(): string {
  return currentTitle;
}

/**
 * Gets the current drawer content
 * @returns The current drawer content element
 */
export function getCurrentContent(): HTMLElement | null {
  return currentContent;
}
