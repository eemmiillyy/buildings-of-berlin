import { BuildingItem } from '../models/types';

let formElement: HTMLElement | null = null;
let onSubmitCallback: ((building: Omit<BuildingItem, 'id'>) => void) | null = null;
let onCancelCallback: (() => void) | null = null;

/**
 * Creates the add building form
 */
export function createAddBuildingForm(): HTMLElement {
    if (!formElement) {
        formElement = document.createElement('div');
        formElement.className = 'add-building-form';
        
        // Initialize the form with empty fields
        updateFormContent();
    }
    
    return formElement;
}

/**
 * Updates the form content with the current state
 */
function updateFormContent(): void {
    if (!formElement) return;
    
    const neighbourhoods = ['Kreuzberg', 'Mitte', 'Charlottenburg', 'Neukölln', 'Prenzlauer Berg', 'Wedding'];
    const eras = ['Modernism', 'Postmodernism', 'Baroque', 'Contemporary', 'Brutalism', 'Art Nouveau'];
    
    formElement.innerHTML = `
        <h3>Add New Building</h3>
        <form id="building-form">
            <div class="form-group">
                <label for="building-title">Building Title</label>
                <input type="text" id="building-title" name="title" required>
            </div>
            
            <div class="form-group">
                <label for="building-designer">Designer/Architect</label>
                <input type="text" id="building-designer" name="designer" required>
            </div>
            
            <div class="form-group">
                <label for="building-year">Year</label>
                <input type="text" id="building-year" name="year" required>
            </div>
            
            <div class="form-group">
                <label for="building-neighbourhood">neighbourhood</label>
                <select id="building-neighbourhood" name="neighbourhood" required>
                    <option value="">Select a neighbourhood</option>
                    ${neighbourhoods.map(n => `<option value="${n.toLowerCase()}">${n}</option>`).join('')}
                </select>
            </div>
            
            <div class="form-group">
                <label for="building-era">Era</label>
                <select id="building-era" name="era" required>
                    <option value="">Select an era</option>
                    ${eras.map(e => `<option value="${e.toLowerCase()}">${e}</option>`).join('')}
                </select>
            </div>
            
            <div class="form-actions">
                <button type="button" id="cancel-building">Cancel</button>
                <button type="submit">Add Building</button>
            </div>
        </form>
    `;
    
    // Add event listeners
    attachEventListeners();
}

/**
 * Attaches event listeners to form elements
 */
function attachEventListeners(): void {
    if (!formElement) return;
    
    // Cancel button
    const cancelBtn = formElement.querySelector('#cancel-building');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            if (onCancelCallback) {
                onCancelCallback();
            }
        });
    }
    
    // Form submission
    const form = formElement.querySelector('#building-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Get form data
            const titleElement = formElement!.querySelector('#building-title') as HTMLInputElement;
            const designerElement = formElement!.querySelector('#building-designer') as HTMLInputElement;
            const yearElement = formElement!.querySelector('#building-year') as HTMLInputElement;
            const neighbourhoodElement = formElement!.querySelector('#building-neighbourhood') as HTMLSelectElement;
            const eraElement = formElement!.querySelector('#building-era') as HTMLSelectElement;
            
            const title = titleElement.value.trim();
            const designer = designerElement.value.trim();
            const year = yearElement.value.trim();
            const neighbourhood = neighbourhoodElement.value;
            const era = eraElement.value;
            
            // Generate random position for the new building
            // We'll place it in the center of the canvas
            const canvas = document.getElementById('canvas');
            let x = 200;
            let y = 200;
            
            if (canvas) {
                const rect = canvas.getBoundingClientRect();
                x = Math.floor(rect.width / 2);
                y = Math.floor(rect.height / 2);
            }
            
            // Create building object
            const building: Omit<BuildingItem, 'id'> = {
                title,
                designer,
                year,
                neighbourhood,
                era,
                createdAt: new Date().toISOString(),
                xcoordinate: x,
                ycoordinate: y
            };
            
            // Call the submit callback
            if (onSubmitCallback) {
                onSubmitCallback(building);
            }
        });
    }
}

/**
 * Opens the add building form
 * @param onSubmit Callback function when form is submitted
 * @param onCancel Callback function when form is cancelled
 */
export function openAddBuildingForm(
    onSubmit: (building: Omit<BuildingItem, 'id'>) => void,
    onCancel: () => void
): HTMLElement {
    onSubmitCallback = onSubmit;
    onCancelCallback = onCancel;
    
    const form = createAddBuildingForm();
    updateFormContent();
    
    return form;
}

/**
 * Resets the form to its initial state
 */
export function resetBuildingForm(): void {
    if (!formElement) return;
    
    const titleElement = formElement.querySelector('#building-title') as HTMLInputElement;
    const designerElement = formElement.querySelector('#building-designer') as HTMLInputElement;
    const yearElement = formElement.querySelector('#building-year') as HTMLInputElement;
    const neighbourhoodElement = formElement.querySelector('#building-neighbourhood') as HTMLSelectElement;
    const eraElement = formElement.querySelector('#building-era') as HTMLSelectElement;
    
    if (titleElement) titleElement.value = '';
    if (designerElement) designerElement.value = '';
    if (yearElement) yearElement.value = '';
    if (neighbourhoodElement) neighbourhoodElement.value = '';
    if (eraElement) eraElement.value = '';
    
    // Reattach event listeners
    attachEventListeners();
} 