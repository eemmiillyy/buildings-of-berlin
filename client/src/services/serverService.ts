import axios from 'axios';

const API_URL = 'http://localhost:3000';

// DOM Elements
let statusElement: HTMLElement;
let messageElement: HTMLElement;
let userMessageInput: HTMLInputElement;
let sendButton: HTMLButtonElement;
let responseElement: HTMLElement;

// Check server connection
async function checkServerStatus() {
    try {
        const response = await axios.get(`${API_URL}/status`);
        statusElement.textContent = response.data.status;
        statusElement.style.color = 'green';
    } catch (error) {
        statusElement.textContent = 'Server is offline';
        statusElement.style.color = 'red';
    }
}

// Get message from server
async function getMessage() {
    try {
        const response = await axios.get(`${API_URL}/message`);
        messageElement.textContent = response.data.message;
    } catch (error) {
        messageElement.textContent = 'Failed to load message';
    }
}

// Send message to server
async function sendMessage(message: string) {
    try {
        const response = await axios.post(`${API_URL}/echo`, { message });
        responseElement.textContent = response.data.echo;
    } catch (error) {
        responseElement.textContent = 'Failed to send message';
    }
}

// Initialize server connection
export function initializeServerConnection() {
    // Get DOM elements
    statusElement = document.getElementById('status') as HTMLElement;
    messageElement = document.getElementById('message') as HTMLElement;
    userMessageInput = document.getElementById('userMessage') as HTMLInputElement;
    sendButton = document.getElementById('sendBtn') as HTMLButtonElement;
    responseElement = document.getElementById('response') as HTMLElement;

    // Event listeners
    sendButton.addEventListener('click', () => {
        const message = userMessageInput.value.trim();
        if (message) {
            sendMessage(message);
            userMessageInput.value = '';
        }
    });

    userMessageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendButton.click();
        }
    });

    // Initialize
    checkServerStatus();
    getMessage();

    // Check server status periodically
    setInterval(checkServerStatus, 30000);
} 