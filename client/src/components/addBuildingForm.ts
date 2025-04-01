import { BuildingItem } from '../models/types';
import { BERLIN_NEIGHBORHOODS, ARCHITECTURAL_ERAS } from '../constants';
import apiClient from '../services/apiClient';
import { convertFileToBase64 } from '../utils';
let formElement: HTMLElement | null = null;
let onSubmitCallback: ((building: Omit<BuildingItem, 'id'>) => void) | null = null;
let onCancelCallback: (() => void) | null = null;

// Track both the files and their uploaded URLs
interface SelectedImage {
    file: File;
    filename: string;
}

let selectedImages: SelectedImage[] = [];
const MAX_IMAGES = 3;
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB in bytes

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
    
    formElement.innerHTML = `
        <h3>Add New Building</h3>
        <form id="building-form">
            <div class="form-group">
                <label for="building-title">Building Title</label>
                <input type="text" id="building-title" name="title" required>
            </div>
            
            <div class="form-group">
                <label for="building-images">Images</label>
                <input type="file" id="building-images" name="images" multiple accept="image/*">
                <small class="helper-text">Maximum 2MB per file</small>
                <div class="image-preview"></div>
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
                <label for="building-neighbourhood">Neighbourhood</label>
                <select id="building-neighbourhood" name="neighbourhood" required>
                    <option value="">Select a neighbourhood</option>
                    ${BERLIN_NEIGHBORHOODS.map(n => `<option value="${n.toLowerCase()}">${n}</option>`).join('')}
                </select>
            </div>
            
            <div class="form-group">
                <label for="building-era">Era</label>
                <select id="building-era" name="era" required>
                    <option value="">Select an era</option>
                    ${ARCHITECTURAL_ERAS.map(e => `<option value="${e.toLowerCase()}">${e}</option>`).join('')}
                </select>
            </div>
            
            <div class="form-actions">
                <button type="button" id="cancel-building">Cancel</button>
                <button type="submit">Add Building</button>
            </div>
        </form>
    `;
    
    // Re-add existing previews
    const previewDiv = formElement.querySelector('.image-preview');
    if (previewDiv) {
        selectedImages.forEach(image => addImagePreview(image.file, image.filename, image.filename, previewDiv as HTMLDivElement));
    }
    
    attachEventListeners();
    
    // Update input state
    const imageInput = formElement.querySelector('#building-images') as HTMLInputElement;
    if (imageInput) {
        updateImageInputState(imageInput);
    }
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
            // If there are any images uploaded, delete them
            // TODO this logic should also be triggered when the user presses x on the drawer before submitting
            if (selectedImages.length > 0) {
                selectedImages.forEach(async (image) => {
                    await removeImage(image, previewDiv);
                });
            }
            if (onCancelCallback) {
                onCancelCallback();
            }
        });
    }
    
    const imageInput = formElement.querySelector('#building-images') as HTMLInputElement;
    const previewDiv = formElement.querySelector('.image-preview') as HTMLDivElement;
    
    if (imageInput) {
        imageInput.addEventListener('change', async () => {
            if (!previewDiv || !imageInput.files) return;
            
            // Show loading state
            previewDiv.classList.add('loading');
            
            // Process each new file
            for (const file of Array.from(imageInput.files)) {
                if (selectedImages.length >= MAX_IMAGES) {
                    alert(`Maximum ${MAX_IMAGES} images allowed`);
                    break;
                }
                
                if (file.size > MAX_FILE_SIZE) {
                    alert(`File "${file.name}" exceeds 2MB limit`);
                    continue;
                }
                
                try {
                    // Upload to blob storage immediately
                    const formData = await convertFileToBase64(file)
                    const response = await apiClient.post('/upload/image', formData.imageData);
                    
                    // Add to selected images
                    selectedImages.push({ file, filename: response.data.filename });
                    
                    // Add preview
                    addImagePreview(file, response.data.filename, response.data.filename, previewDiv);
                    
                } catch (error) {
                    console.error('Failed to upload image:', error);
                    alert(`Failed to upload "${file.name}". Please try again.`);
                }
            }
            
            // Reset input and update state
            imageInput.value = '';
            updateImageInputState(imageInput);
            previewDiv.classList.remove('loading');
        });
    }
    
    // Form submission
    const form = formElement.querySelector('#building-form');
    if (form) {
        form.addEventListener('submit', handleSubmit);
    }
}

async function removeImage(image: SelectedImage, previewContainer: HTMLElement): Promise<void> {
    try {
        // Remove from blob storage
        const response = await apiClient.delete('/delete/image', {
            data: { filename: image.filename }
        });
        
        if (!response.data.message) { 
            throw new Error('Failed to delete image from storage');
        }
        
        // Remove from selected images
        const index = selectedImages.findIndex(img => img.filename === image.filename);
        if (index > -1) {
            selectedImages.splice(index, 1);
        }
        
        // Remove preview
        previewContainer.remove();
        
        // Update input state
        const imageInput = formElement?.querySelector('#building-images') as HTMLInputElement;
        if (imageInput) {
            updateImageInputState(imageInput);
        }
        
    } catch (error) {
        console.error('Error removing image:', error);
        alert('Failed to remove image. Please try again.');
    }
}

function addImagePreview(file: File, url: string, filename: string, previewDiv: HTMLDivElement): void {
    const previewContainer = document.createElement('div');
    previewContainer.className = 'image-preview-container';
    
    const img = document.createElement('img');
    // Create a temporary URL from the File object for preview
    const previewUrl = URL.createObjectURL(file);
    img.src = previewUrl;
    img.style.height = '100px';
    
    const removeButton = document.createElement('button');
    removeButton.className = 'remove-image';
    removeButton.innerHTML = '✕';
    removeButton.onclick = async (e) => {
        e.preventDefault();
        const image = selectedImages.find(img => img.filename === filename);
        if (image) {
            // Clean up the temporary URL
            URL.revokeObjectURL(previewUrl);
            await removeImage(image, previewContainer);
        }
    };
    
    previewContainer.appendChild(img);
    previewContainer.appendChild(removeButton);
    previewDiv.appendChild(previewContainer);
}

function updateImageInputState(imageInput: HTMLInputElement): void {
    if (selectedImages.length >= MAX_IMAGES) {
        imageInput.disabled = true;
        imageInput.parentElement?.classList.add('max-images');
    } else {
        imageInput.disabled = false;
        imageInput.parentElement?.classList.remove('max-images');
    }
}

/**
 * Opens the add building form
 * @param onSubmit Callback function when form is submitted
 * @param onCancel Callback function when form is cancelled
 */
export function openAddBuildingForm(
    onSubmit: (building: Omit<BuildingItem, 'id'>, images?: File[]) => void,
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
    selectedImages = [];
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

function handleSubmit(event: Event) {
    event.preventDefault();
    
    try {
        const form = event.target as HTMLFormElement;
        form.classList.add('loading');
        
        const titleElement = formElement!.querySelector('#building-title') as HTMLInputElement;
        const designerElement = formElement!.querySelector('#building-designer') as HTMLInputElement;
        const yearElement = formElement!.querySelector('#building-year') as HTMLInputElement;
        const neighbourhoodElement = formElement!.querySelector('#building-neighbourhood') as HTMLSelectElement;
        const eraElement = formElement!.querySelector('#building-era') as HTMLSelectElement;
        
        // Use the already uploaded image URLs
        const imageUrls = selectedImages.map(img => img.filename);
        
        const building: Omit<BuildingItem, 'id'> = {
            title: titleElement.value.trim(),
            designer: designerElement.value.trim(),
            year: yearElement.value.trim(),
            neighbourhood: neighbourhoodElement.value,
            era: eraElement.value,
            createdAt: new Date().toISOString(),
            xcoordinate: 200,
            ycoordinate: 200,
            images: imageUrls
        };
        
        if (onSubmitCallback) {
            onSubmitCallback(building);
        }
    } catch (error) {
        console.error('Error:', error);
        // TODO optionally remove the uploaded images
        // or have an orphan cleanup script run periodically
        alert('Failed to submit form. Please try again.');
    } 
}
