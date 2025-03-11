import { ImpressionItem, BuildingItem } from '../models/types';
import { generateMood } from '../utils';
import { openAddImpressionForm, resetForm } from './addImpressionForm';
import { openDrawer, closeDrawer, updateDrawerTitle, updateDrawerContent } from './drawer';

let currentBuildingId: string | null = null;
let currentBuilding: BuildingItem | null = null;
let allImpressions: ImpressionItem[] = [];
let isAddingImpression: boolean = false;

/**
 * Opens the drawer and displays impressions for the given building
 * @param buildingId The ID of the building to show impressions for
 * @param building The building object
 * @param impressions Array of impression items
 */
export function openImpressionsDrawer(
    buildingId: string, 
    building: BuildingItem, 
    impressions: ImpressionItem[]
): void {
    currentBuildingId = buildingId;
    currentBuilding = building;
    allImpressions = impressions;
    isAddingImpression = false;
    
    // Create the impressions list content
    const content = createImpressionsListContent(building, impressions);
    
    // Open the drawer with the impressions list
    openDrawer(`Impressions: ${building.title}`, content);
}

/**
 * Creates the content for the impressions list
 * @param building The building object
 * @param impressions Array of impression items
 * @returns HTML element with the impressions list
 */
function createImpressionsListContent(building: BuildingItem, impressions: ImpressionItem[]): HTMLElement {
    const content = document.createElement('div');
    content.className = 'impressions-list';
    
    // Filter impressions for this building
    const buildingImpressions = impressions.filter(imp => imp.buildingId === building.id);
    
    // Add the "Add New Impression" button
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'drawer-actions';
    
    const addButton = document.createElement('button');
    addButton.className = 'add-impression-btn';
    addButton.textContent = '+ Add New Impression';
    addButton.addEventListener('click', () => {
        showAddImpressionForm();
    });
    
    actionsDiv.appendChild(addButton);
    content.appendChild(actionsDiv);
    
    // Add impressions or "no impressions" message
    if (buildingImpressions.length === 0) {
        const noImpressionsDiv = document.createElement('div');
        noImpressionsDiv.className = 'no-impressions';
        noImpressionsDiv.innerHTML = `
            <p>No impressions yet for this building.</p>
            <p>Be the first to add your impression!</p>
        `;
        content.appendChild(noImpressionsDiv);
    } else {
        buildingImpressions.forEach(impression => {
            const impressionDiv = document.createElement('div');
            impressionDiv.className = 'impression-item';
            impressionDiv.dataset.id = impression.id;
            
            const contentDiv = document.createElement('div');
            contentDiv.className = 'impression-content';
            contentDiv.textContent = impression.content;
            
            const metaDiv = document.createElement('div');
            metaDiv.className = 'impression-meta';
            
            const dateSpan = document.createElement('span');
            dateSpan.textContent = `posted ${formatDate(impression.createdAt)}`;
            
            metaDiv.appendChild(dateSpan);
            
            if (impression.photos.length > 0) {
                const photosSpan = document.createElement('span');
                photosSpan.textContent = `${impression.photos.length} photos`;
                metaDiv.appendChild(photosSpan);
            }
            
            if (impression.moods.length > 0) {
                const moodsSpan = document.createElement('span');
                moodsSpan.innerHTML = impression.moods.map(mood => generateMood(mood)).join(' ');
                metaDiv.appendChild(moodsSpan);
            }
            
            impressionDiv.appendChild(contentDiv);
            impressionDiv.appendChild(metaDiv);
            
            if (impression.hyperlinks.length > 0) {
                const linksDiv = document.createElement('div');
                linksDiv.className = 'impression-links';
                
                impression.hyperlinks.forEach((link, index) => {
                    const linkElement = document.createElement('a');
                    linkElement.href = link;
                    linkElement.target = '_blank';
                    linkElement.rel = 'noopener noreferrer';
                    linkElement.textContent = formatLink(link);
                    
                    linksDiv.appendChild(linkElement);
                    
                    if (index < impression.hyperlinks.length - 1) {
                        linksDiv.appendChild(document.createElement('br'));
                    }
                });
                
                impressionDiv.appendChild(linksDiv);
            }
            
            content.appendChild(impressionDiv);
        });
    }
    
    return content;
}

/**
 * Shows the add impression form
 */
function showAddImpressionForm(): void {
    if (!currentBuildingId || !currentBuilding) return;
    
    isAddingImpression = true;
    
    // Update drawer title
    updateDrawerTitle(`Add Impression: ${currentBuilding.title}`);
    
    // Create the form
    const form = openAddImpressionForm(
        currentBuildingId,
        handleImpressionSubmit,
        handleImpressionCancel
    );
    
    // Update drawer content
    updateDrawerContent(form);
}

/**
 * Handles the submission of a new impression
 * @param impression The new impression data
 */
function handleImpressionSubmit(impression: Omit<ImpressionItem, 'id'>): void {
    // Generate a unique ID for the impression
    const newImpression: ImpressionItem = {
        ...impression,
        id: `impression${Date.now()}`
    };
    
    // Add the impression to the list
    allImpressions.push(newImpression);
 
    // Show the updated list
    isAddingImpression = false;
    
    // Create updated content
    const content = createImpressionsListContent(currentBuilding!, allImpressions);
    
    // Update drawer title and content
    updateDrawerTitle(`Impressions: ${currentBuilding!.title}`);
    updateDrawerContent(content);
    
    // Reset the form for next use
    resetForm();
}

/**
 * Handles cancellation of adding a new impression
 */
function handleImpressionCancel(): void {
    isAddingImpression = false;
    
    // Create updated content
    const content = createImpressionsListContent(currentBuilding!, allImpressions);
    
    // Update drawer title and content
    updateDrawerTitle(`Impressions: ${currentBuilding!.title}`);
    updateDrawerContent(content);
}

/**
 * Formats a date string for display
 * @param dateString ISO date string
 * @returns Formatted date string
 */
function formatDate(dateString: string): string {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString();
    } catch (e) {
        return dateString;
    }
}

/**
 * Formats a URL for display
 * @param url The URL to format
 * @returns Formatted URL string
 */
function formatLink(url: string): string {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname;
    } catch (e) {
        return url;
    }
} 