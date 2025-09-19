/*
 * © 2025 Hoffman Construction
 *
 * This software is the property of Hoffman Construction.
 * All rights reserved.
 *
 * Unauthorized duplication or distribution of this software,
 * in whole or in part, is strictly prohibited.
 *
 * Author: Marshall Turner
 */

/**
 * @file ui.js
 * @description Handles general UI updates and view management for the TVD Tool.
 */

import * as dom from './dom.js';
import { state } from './state.js';
import * as utils from './utils.js';
import { helpTopics } from '../../data/help-topics.js';

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
 * A generic dialog function that can be configured for different use cases.
 * @param {object} config - The configuration object for the dialog.
 * @param {string} config.title - The dialog title.
 * @param {string} [config.message] - A message to display (for confirm dialogs).
 * @param {string} [config.placeholder] - Placeholder for an input field (for modal dialogs).
 * @param {string} config.confirmText - Text for the confirm button.
 * @param {string} config.cancelText - Text for the cancel button.
 * @param {boolean} [config.isConfirmation=false] - If true, shows a red confirm button.
 * @returns {Promise<string|boolean|null>} - The result of the dialog interaction.
 */
function showDialog(config) {
    return new Promise((resolve) => {
        const { title, message, placeholder, confirmText, cancelText, isConfirmation } = config;

        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';

        const modal = document.createElement('div');
        modal.className = 'bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4';

        const confirmButtonClass = isConfirmation 
            ? 'bg-red-600 hover:bg-red-700' 
            : 'bg-blue-600 hover:bg-blue-700';

        let contentHtml = `
            <div class="mb-4">
                <h3 class="text-lg font-semibold text-gray-900">${title}</h3>
            </div>
        `;

        if (message) {
            contentHtml += `<div class="mb-6"><p class="text-gray-700">${message}</p></div>`;
        }

        if (placeholder) {
            contentHtml += `
                <div class="mb-6">
                    <input type="text" 
                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                           placeholder="${placeholder}"
                           id="modal-input">
                </div>
            `;
        }

        contentHtml += `
            <div class="flex justify-end space-x-3">
        `;
        if (cancelText) {
            contentHtml += `
                <button class="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors" id="modal-cancel">
                    ${cancelText}
                </button>
            `;
        }
        contentHtml += `
                <button class="px-4 py-2 text-white rounded-md transition-colors ${confirmButtonClass}" id="modal-confirm">
                    ${confirmText}
                </button>
            </div>
        `;

        modal.innerHTML = contentHtml;
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        const input = modal.querySelector('#modal-input');
        if (input) {
            input.focus();
        }

        const confirmBtn = modal.querySelector('#modal-confirm');
        const cancelBtn = modal.querySelector('#modal-cancel');

        const cleanup = () => {
            confirmBtn.removeEventListener('click', handleConfirm);
            if (cancelBtn) cancelBtn.removeEventListener('click', handleCancel);
            if (input) input.removeEventListener('keydown', handleKeyPress);
            else document.removeEventListener('keydown', handleKeyPress);
            overlay.removeEventListener('click', handleOverlayClick);
            document.body.removeChild(overlay);
        };

        const handleConfirm = () => {
            const value = input ? input.value.trim() : true;
            if (placeholder && !value) return;
            cleanup();
            resolve(placeholder ? value : true);
        };

        const handleCancel = () => {
            cleanup();
            resolve(placeholder ? null : false);
        };

        const handleKeyPress = (e) => {
            if (e.key === 'Enter' && input) {
                handleConfirm();
            } else if (e.key === 'Escape') {
                handleCancel();
            }
        };

        const handleOverlayClick = (e) => {
            if (e.target === overlay) {
                handleCancel();
            }
        };

        confirmBtn.addEventListener('click', handleConfirm);
        if (cancelBtn) cancelBtn.addEventListener('click', handleCancel);
        if (input) {
            input.addEventListener('keydown', handleKeyPress);
        } else {
            document.addEventListener('keydown', handleKeyPress);
        }
        overlay.addEventListener('click', handleOverlayClick);
    });
}


/**
 * Sets the current phase of the application (e.g., 'phase2').
 * @param {string} phase - The phase to set as active.
 */
export function setCurrentPhase(phase) {
    state.currentPhase = phase;
    render();
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
    return showDialog({
        title,
        placeholder,
        confirmText,
        cancelText,
        isConfirmation: false
    });
}

/**
 * Shows a simple alert dialog with a title, message, and an OK button.
 * @param {string} title - The dialog title.
 * @param {string} message - The message to display.
 * @param {string} [confirmText='OK'] - The text for the confirm button.
 * @returns {Promise<boolean>} - Resolves when the dialog is closed.
 */
export function showAlert(title, message, confirmText = 'OK') {
    return showDialog({
        title,
        message,
        confirmText,
        cancelText: null,
        isConfirmation: false
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
    return showDialog({
        title,
        message,
        confirmText,
        cancelText,
        isConfirmation: true
    });
}

/**
 * Updates the help modal content based on the current view.
 */
function updateHelpContent() {
    const currentView = state.currentView || 'splash-screen';
    const topic = helpTopics[currentView];

    if (topic) {
        dom.helpTitle.textContent = topic.title;
        dom.helpContent.innerHTML = topic.content;
    } else {
        dom.helpTitle.textContent = 'Help';
        dom.helpContent.innerHTML = '<p>Select a view to see relevant help information.</p>';
    }
}

/**
 * Shows the help modal.
 */
function showHelpModal() {
    updateHelpContent();
    dom.helpModal.classList.remove('hidden');
}

/**
 * Hides the help modal.
 */
function hideHelpModal() {
    dom.helpModal.classList.add('hidden');
}

/**
 * Initializes the help modal functionality.
 */
export function initializeHelpModal() {
    dom.helpButton.addEventListener('click', showHelpModal);
    dom.closeHelpModal.addEventListener('click', hideHelpModal);
    // Hide modal on escape key press
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !dom.helpModal.classList.contains('hidden')) {
            hideHelpModal();
        }
    });
    // Hide modal on overlay click
    dom.helpModal.addEventListener('click', (e) => {
        if (e.target === dom.helpModal) {
            hideHelpModal();
        }
    });
} 