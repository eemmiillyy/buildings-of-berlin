import './styles.css';
import { initializeServerConnection } from './services/serverService';
import { initializeDraggableCanvas } from './components/draggableCanvas';

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // Initialize server connection
    // initializeServerConnection();
    
    // Initialize draggable canvas
    initializeDraggableCanvas();
}); 