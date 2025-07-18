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
    // --- Phase 2 calculations ---
    const p2_current = state.currentData.phases.phase2;
    const p2_original = state.originalData.phases.phase2;
    const snapshotRomP2 = d3.sum(p2_original.components, d => d.current_rom * d.square_footage);
    const snapshotVarianceP2 = snapshotRomP2 - p2_original.totalProjectBudget;
    const currentRomEstimateP2 = d3.sum(p2_current.components, d => d.current_rom * d.square_footage);
    const varianceP2 = currentRomEstimateP2 - p2_current.totalProjectBudget;
    document.getElementById('total-budget-p2').textContent = utils.formatCurrencyBig(p2_current.totalProjectBudget);
    document.getElementById('snapshot-rom-p2').textContent = utils.formatCurrencyBig(snapshotRomP2);
    const snapshotVarianceElP2 = document.getElementById('snapshot-variance-p2');
    snapshotVarianceElP2.textContent = `${snapshotVarianceP2 >= 0 ? '+' : ''}${utils.formatCurrencyBig(snapshotVarianceP2)}`;
    snapshotVarianceElP2.classList.toggle('text-red-600', snapshotVarianceP2 > 0);
    snapshotVarianceElP2.classList.toggle('text-green-600', snapshotVarianceP2 <= 0);
    document.getElementById('current-rom-estimate-p2').textContent = utils.formatCurrencyBig(currentRomEstimateP2);
    const varianceElP2 = document.getElementById('variance-p2');
    varianceElP2.textContent = `${varianceP2 >= 0 ? '+' : ''}${utils.formatCurrencyBig(varianceP2)}`;
    varianceElP2.classList.toggle('text-red-600', varianceP2 > 0);
    varianceElP2.classList.toggle('text-green-600', varianceP2 <= 0);
} 