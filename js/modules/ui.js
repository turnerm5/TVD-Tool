/**
 * @file ui.js
 * @description Handles general UI updates and view management for the TVD Tool.
 */

import * as dom from './dom.js';
import { state } from './state.js';
import * as utils from './utils.js';

// Forward declare render function to avoid circular dependencies
// This is a common pattern when modules depend on each other.
let render;
export function setRender(renderFn) {
    render = renderFn;
}

/**
 * Hides the main application content and shows the splash screen.
 */
export function showSplashScreen() {
    dom.mainContent.style.display = 'none';
    dom.splashScreen.style.display = 'flex';
}

/**
 * Hides the splash screen and shows the main application content, then triggers a render.
 */
export function showMainContent() {
    dom.splashScreen.style.display = 'none';
    dom.mainContent.style.display = 'block';
    // Use requestAnimationFrame to ensure the layout is painted before rendering D3 charts.
    window.requestAnimationFrame(render);
}

/**
 * Sets the current phase of the application (e.g., 'phase1' or 'phase2').
 * @param {string} phase - The phase to set as active.
 */
export function setCurrentPhase(phase) {
    state.currentPhase = phase;
    render();
}

/**
 * Updates the summary panel with the latest cost calculations for both phases.
 */
export function updateSummary() {
    if (state.currentView !== 'waterfall') return;

    const summaryPanel = document.getElementById('summary-panel');
    summaryPanel.innerHTML = ''; // Clear previous content

    const gmp = state.originalData.phases.phase2.totalProjectBudget;

    // --- Header ---
    const header = document.createElement('div');
    header.className = 'text-center mb-4';
    header.innerHTML = `
        <h2 class="text-lg font-bold text-gray-700">Phase 2 Summary</h2>
        <p class="text-xl font-bold text-gray-800">${utils.formatCurrencyBig(gmp)} <span class="text-sm font-medium text-gray-500">Total Project Budget</span></p>
    `;
    summaryPanel.appendChild(header);

    // --- Data Series Table ---
    const originalData = {
        name: 'Imported Data',
        components: state.originalData.phases.phase2.components
    };
    const allSeries = [originalData, ...state.snapshots];

    const table = document.createElement('table');
    table.className = 'w-full text-sm text-left text-gray-500';
    
    const thead = table.createTHead();
    thead.innerHTML = `
        <tr class="text-xs text-gray-700 uppercase bg-gray-50">
            <th scope="col" class="px-6 py-3">Scenario</th>
            <th scope="col" class="px-6 py-3 text-right">Scenario ROM</th>
            <th scope="col" class="px-6 py-3 text-right">Variance</th>
        </tr>
    `;

    const tbody = table.createTBody();
    allSeries.forEach(series => {
        const totalRom = d3.sum(series.components, c => c.current_rom * c.square_footage);
        const variance = totalRom - gmp;
        const row = tbody.insertRow();
        row.className = 'bg-white border-b';
        row.innerHTML = `
            <td class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">${series.name}</td>
            <td class="px-6 py-4 text-right">${utils.formatCurrencyBig(totalRom)}</td>
            <td class="px-6 py-4 text-right font-medium ${variance > 0 ? 'text-red-600' : 'text-green-600'}">
                ${variance >= 0 ? '+' : ''}${utils.formatCurrencyBig(variance)}
            </td>
        `;
    });

    summaryPanel.appendChild(table);
}

/**
 * Shows a modal dialog with a title, input field, and action buttons.
 * @param {string} title - The modal title
 * @param {string} placeholder - Placeholder text for the input field
 * @param {string} confirmText - Text for the confirm button
 * @param {string} cancelText - Text for the cancel button
 * @returns {Promise<string|null>} - Returns the input value if confirmed, null if cancelled
 */
export function showModalDialog(title, placeholder, confirmText = 'OK', cancelText = 'Cancel') {
    return new Promise((resolve) => {
        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        
        // Create modal container
        const modal = document.createElement('div');
        modal.className = 'bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4';
        
        // Create modal content
        modal.innerHTML = `
            <div class="mb-4">
                <h3 class="text-lg font-semibold text-gray-900">${title}</h3>
            </div>
            <div class="mb-6">
                <input type="text" 
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                       placeholder="${placeholder}"
                       id="modal-input">
            </div>
            <div class="flex justify-end space-x-3">
                <button class="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors" id="modal-cancel">
                    ${cancelText}
                </button>
                <button class="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors" id="modal-confirm">
                    ${confirmText}
                </button>
            </div>
        `;
        
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        // Focus the input field
        const input = modal.querySelector('#modal-input');
        input.focus();
        
        // Handle confirm button
        const confirmBtn = modal.querySelector('#modal-confirm');
        const handleConfirm = () => {
            const value = input.value.trim();
            if (value) {
                cleanup();
                resolve(value);
            }
        };
        
        // Handle cancel button
        const cancelBtn = modal.querySelector('#modal-cancel');
        const handleCancel = () => {
            cleanup();
            resolve(null);
        };
        
        // Handle Enter key
        const handleKeyPress = (e) => {
            if (e.key === 'Enter') {
                handleConfirm();
            } else if (e.key === 'Escape') {
                handleCancel();
            }
        };
        
        // Handle overlay click (close modal)
        const handleOverlayClick = (e) => {
            if (e.target === overlay) {
                handleCancel();
            }
        };
        
        // Add event listeners
        confirmBtn.addEventListener('click', handleConfirm);
        cancelBtn.addEventListener('click', handleCancel);
        input.addEventListener('keydown', handleKeyPress);
        overlay.addEventListener('click', handleOverlayClick);
        
        // Cleanup function
        const cleanup = () => {
            confirmBtn.removeEventListener('click', handleConfirm);
            cancelBtn.removeEventListener('click', handleCancel);
            input.removeEventListener('keydown', handleKeyPress);
            overlay.removeEventListener('click', handleOverlayClick);
            document.body.removeChild(overlay);
        };
    });
}

/**
 * Shows a confirmation dialog with Yes/No buttons.
 * @param {string} title - The modal title
 * @param {string} message - The confirmation message
 * @param {string} confirmText - Text for the confirm button (default: 'Yes')
 * @param {string} cancelText - Text for the cancel button (default: 'No')
 * @returns {Promise<boolean>} - Returns true if confirmed, false if cancelled
 */
export function showConfirmDialog(title, message, confirmText = 'Yes', cancelText = 'No') {
    return new Promise((resolve) => {
        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        
        // Create modal container
        const modal = document.createElement('div');
        modal.className = 'bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4';
        
        // Create modal content
        modal.innerHTML = `
            <div class="mb-4">
                <h3 class="text-lg font-semibold text-gray-900">${title}</h3>
            </div>
            <div class="mb-6">
                <p class="text-gray-700">${message}</p>
            </div>
            <div class="flex justify-end space-x-3">
                <button class="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors" id="modal-cancel">
                    ${cancelText}
                </button>
                <button class="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors" id="modal-confirm">
                    ${confirmText}
                </button>
            </div>
        `;
        
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        // Handle confirm button
        const confirmBtn = modal.querySelector('#modal-confirm');
        const handleConfirm = () => {
            cleanup();
            resolve(true);
        };
        
        // Handle cancel button
        const cancelBtn = modal.querySelector('#modal-cancel');
        const handleCancel = () => {
            cleanup();
            resolve(false);
        };
        
        // Handle Escape key
        const handleKeyPress = (e) => {
            if (e.key === 'Escape') {
                handleCancel();
            }
        };
        
        // Handle overlay click (close modal)
        const handleOverlayClick = (e) => {
            if (e.target === overlay) {
                handleCancel();
            }
        };
        
        // Add event listeners
        confirmBtn.addEventListener('click', handleConfirm);
        cancelBtn.addEventListener('click', handleCancel);
        document.addEventListener('keydown', handleKeyPress);
        overlay.addEventListener('click', handleOverlayClick);
        
        // Cleanup function
        const cleanup = () => {
            confirmBtn.removeEventListener('click', handleConfirm);
            cancelBtn.removeEventListener('click', handleCancel);
            document.removeEventListener('keydown', handleKeyPress);
            overlay.removeEventListener('click', handleOverlayClick);
            document.body.removeChild(overlay);
        };
    });
} 