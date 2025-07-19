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