import './styles.css';
import { initializeDraggableCanvas } from './components/draggableCanvas';
import { BERLIN_NEIGHBORHOODS, ARCHITECTURAL_ERAS } from './constants';

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // Populate filter dropdowns
    const eraFilter = document.getElementById('era-filter');
    const neighbourhoodFilter = document.getElementById('neighbourhood-filter');

    if (eraFilter) {
        ARCHITECTURAL_ERAS.forEach(era => {
            const option = document.createElement('option');
            option.value = era.toLowerCase();
            option.textContent = era;
            eraFilter.appendChild(option);
        });
    }

    if (neighbourhoodFilter) {
        BERLIN_NEIGHBORHOODS.forEach(neighborhood => {
            const option = document.createElement('option');
            option.value = neighborhood.toLowerCase();
            option.textContent = neighborhood;
            neighbourhoodFilter.appendChild(option);
        });
    }

    // Initialize draggable canvas
    initializeDraggableCanvas();
}); 