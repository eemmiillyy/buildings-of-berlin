import { Mood, generateMood } from '../utils';
import { ImpressionItem } from '../models/types';

let formElement: HTMLElement | null = null;
let currentBuildingId: string | null = null;
let onSubmitCallback: ((impression: Omit<ImpressionItem, 'id'>) => void) | null = null;
let onCancelCallback: (() => void) | null = null;

/**
 * Creates the add impression form
 */
export function createAddImpressionForm(): HTMLElement {
    if (!formElement) {
        formElement = document.createElement('div');
        formElement.className = 'add-impression-form';
        
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
    
    const allMoods: Mood[] = [
        'happy', 'sad', 'angry', 'surprised', 'confused', 
        'excited', 'tired', 'cool', 'love', 'neutral', 
        'worried', 'scared', 'evil', 'silly', 'crying', 
        'wink', 'thinking', 'rolling', 'suspicious', 
        'eye', 'eyes', 'spiral'
    ];
    
    formElement.innerHTML = `
        <h3>Add Your Impression</h3>
        <form id="impression-form">
            <div class="form-group">
                <label for="impression-content">Your Impression</label>
                <textarea id="impression-content" name="content" required></textarea>
            </div>
            
            <div class="form-group">
                <label>Mood (select up to 3)</label>
                <div class="mood-selector">
                    ${allMoods.map(mood => `
                        <div class="mood-option" data-mood="${mood}">
                            <span>${generateMood(mood)}</span> ${mood}
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="form-group">
                <label>Hyperlinks (optional)</label>
                <div class="link-list" id="hyperlinks-container">
                    <div class="link-item">
                        <input type="url" name="hyperlink" placeholder="https://...">
                        <button type="button" class="remove-link">×</button>
                    </div>
                </div>
                <button type="button" class="add-link-btn" id="add-hyperlink">+ Add another link</button>
            </div>
            
            <div class="form-actions">
                <button type="button" id="cancel-impression">Cancel</button>
                <button type="submit">Submit Impression</button>
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
    
    // Mood selection
    const moodOptions = formElement.querySelectorAll('.mood-option');
    moodOptions.forEach(option => {
        option.addEventListener('click', () => {
            const selectedMoods = formElement!.querySelectorAll('.mood-option.selected');
            
            if (option.classList.contains('selected')) {
                option.classList.remove('selected');
            } else if (selectedMoods.length < 3) {
                option.classList.add('selected');
            }
        });
    });
    
    // Add hyperlink button
    const addLinkBtn = formElement.querySelector('#add-hyperlink');
    if (addLinkBtn) {
        addLinkBtn.addEventListener('click', () => {
            const container = formElement!.querySelector('#hyperlinks-container');
            if (container) {
                const newLink = document.createElement('div');
                newLink.className = 'link-item';
                newLink.innerHTML = `
                    <input type="url" name="hyperlink" placeholder="https://...">
                    <button type="button" class="remove-link">×</button>
                `;
                container.appendChild(newLink);
                
                // Add event listener to the remove button
                const removeBtn = newLink.querySelector('.remove-link');
                if (removeBtn) {
                    removeBtn.addEventListener('click', () => {
                        container.removeChild(newLink);
                    });
                }
            }
        });
    }
    
    // Remove hyperlink buttons
    const removeLinkBtns = formElement.querySelectorAll('.remove-link');
    removeLinkBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const linkItem = btn.closest('.link-item');
            const container = formElement!.querySelector('#hyperlinks-container');
            if (linkItem && container) {
                container.removeChild(linkItem);
            }
        });
    });
    
    // Cancel button
    const cancelBtn = formElement.querySelector('#cancel-impression');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            if (onCancelCallback) {
                onCancelCallback();
            }
        });
    }
    
    // Form submission
    const form = formElement.querySelector('#impression-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Get form data
            const contentElement = formElement!.querySelector('#impression-content') as HTMLTextAreaElement;
            const content = contentElement.value.trim();
            
            // Get selected moods
            const selectedMoodElements = formElement!.querySelectorAll('.mood-option.selected');
            const moods: Mood[] = [];
            selectedMoodElements.forEach(el => {
                const mood = el.getAttribute('data-mood') as Mood;
                if (mood) {
                    moods.push(mood);
                }
            });
            
            // Get hyperlinks
            const hyperlinkInputs = formElement!.querySelectorAll('input[name="hyperlink"]');
            const hyperlinks: string[] = [];
            hyperlinkInputs.forEach(input => {
                const value = (input as HTMLInputElement).value.trim();
                if (value) {
                    hyperlinks.push(value);
                }
            });
            
            // Create impression object
            const impression: Omit<ImpressionItem, 'id'> = {
                buildingId: currentBuildingId!,
                content,
                moods,
                hyperlinks,
                photos: [], // Photos not implemented in this form
                createdAt: new Date().toISOString()
            };
            
            // Call the submit callback
            if (onSubmitCallback) {
                onSubmitCallback(impression);
            }
        });
    }
}

/**
 * Opens the add impression form for a specific building
 * @param buildingId The ID of the building to add an impression for
 * @param onSubmit Callback function when form is submitted
 * @param onCancel Callback function when form is cancelled
 */
export function openAddImpressionForm(
    buildingId: string,
    onSubmit: (impression: Omit<ImpressionItem, 'id'>) => void,
    onCancel: () => void
): HTMLElement {
    currentBuildingId = buildingId;
    onSubmitCallback = onSubmit;
    onCancelCallback = onCancel;
    
    const form = createAddImpressionForm();
    updateFormContent();
    
    return form;
}

/**
 * Resets the form to its initial state
 */
export function resetForm(): void {
    if (!formElement) return;
    
    const contentElement = formElement.querySelector('#impression-content') as HTMLTextAreaElement;
    if (contentElement) {
        contentElement.value = '';
    }
    
    // Reset mood selection
    const selectedMoods = formElement.querySelectorAll('.mood-option.selected');
    selectedMoods.forEach(mood => {
        mood.classList.remove('selected');
    });
    
    // Reset hyperlinks
    const hyperlinksContainer = formElement.querySelector('#hyperlinks-container');
    if (hyperlinksContainer) {
        hyperlinksContainer.innerHTML = `
            <div class="link-item">
                <input type="url" name="hyperlink" placeholder="https://...">
                <button type="button" class="remove-link">×</button>
            </div>
        `;
    }
    
    // Reattach event listeners
    attachEventListeners();
} 