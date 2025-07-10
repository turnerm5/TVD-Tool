/**
 * @file file-handlers.js
 * @description Manages file loading, parsing, and exporting for the TVD Tool.
 */

import { state } from './state.js';
import * as ui from './ui.js';
import * as utils from './utils.js';

// Forward-declare the main render function to be injected later.
let render;
export function setRender(renderFn) {
    render = renderFn;
}

// Forward-declare the yScale to be injected later.
let yScale;
export function setYScale(scale) {
    yScale = scale;
}

/**
 * Pre-processes the loaded data.
 * This function calculates the `benchmark_low` and `benchmark_high` values for each component
 * by finding the min/max of the corresponding costs from the `benchmarks` array.
 * @param {object} data - The raw data object loaded from the file.
 * @returns {object} The processed data object.
 */
function processData(data) {
    if (!data.benchmarks || !data.phases) return data;

    // Create a map of component names to an array of their costs across all benchmark projects.
    const benchmarkCostsByName = {};
    data.benchmarks.forEach(proj => {
        proj.components.forEach(comp => {
            if (!benchmarkCostsByName[comp.name]) {
                benchmarkCostsByName[comp.name] = [];
            }
            benchmarkCostsByName[comp.name].push(comp.cost);
        });
    });

    // Add benchmark_low and benchmark_high to each component in the main project data.
    Object.values(data.phases).forEach(phase => {
        phase.components.forEach(c => {
            const costs = benchmarkCostsByName[c.name] || [];
            c.benchmark_low = costs.length ? Math.min(...costs) : 0;
            c.benchmark_high = costs.length ? Math.max(...costs) : 0;
        });
    });

    return data;
}

/**
 * Loads and initializes the application with new data.
 * @param {object} data - The project data object.
 * @param {string} [fileName='Sample Data'] - The name of the file being loaded.
 */
export function loadData(data, fileName = 'Sample Data') {
    if (!data.phases || !data.phases.phase1 || !data.phases.phase2) {
        alert("Invalid JSON format. Must contain 'phases' object with 'phase1' and 'phase2' keys.");
        return;
    }

    // Make a deep copy of the data for processing, leaving the original `sampleData` object untouched.
    const processedData = processData(JSON.parse(JSON.stringify(data)));

    // Initialize the 'locked' state for all components.
    state.lockedComponents = new Set();

    // Automatically lock components that have a zero value for ROM or SF on import.
    Object.keys(processedData.phases).forEach(phaseKey => {
        processedData.phases[phaseKey].components.forEach(component => {
            if (component.current_rom === 0 || component.square_footage === 0) {
                const lockKey = `${phaseKey}-${component.name}`;
                state.lockedComponents.add(lockKey);
            }
        });
    });

    // Store deep copies for original (reset) and current (mutable) states.
    state.originalData = JSON.parse(JSON.stringify(processedData));
    state.currentData = processedData;

    // Dynamically set the Y-axis domain based on the maximum value in the data.
    const allComponents = [...state.currentData.phases.phase1.components, ...state.currentData.phases.phase2.components];
    const maxVal = d3.max(allComponents, d => Math.max(d.benchmark_high, d.current_rom));
    state.yDomainMax = Math.ceil(maxVal / 10) * 10 + 20; // Round up to the nearest 10 and add a buffer.
    yScale.domain([0, state.yDomainMax]);

    document.getElementById('file-name').textContent = `Using: ${fileName}`;
    state.currentPhase = 'phase1'; // Reset to phase 1 on new data load

    // Update the cost labels on the Benchmarks view.
    if (state.currentData.benchmarks) {
        state.currentData.benchmarks.forEach(proj => {
            const costEl = document.getElementById(`benchmark-cost-${proj.id}`);
            const sfEl = document.getElementById(`benchmark-sf-${proj.id}`);
            if (costEl) {
                costEl.textContent = `${utils.formatCurrency(proj.overall_sf_cost)} /SF`;
            }
            if (sfEl) {
                sfEl.textContent = `${utils.formatNumber(proj.square_footage)} SF`;
            }
        });
    }

    ui.showMainContent();
}

/**
 * Handles the file upload process (from either drag-drop or file input).
 * @param {File} file - The file object to be handled.
 */
export function handleFile(file) {
    if (file && file.type === 'application/json') {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const jsonData = JSON.parse(e.target.result);
                loadData(jsonData, file.name);
            } catch (error) {
                alert("Error parsing JSON file: " + error.message);
            }
        };
        reader.readAsText(file);
    } else {
        alert("Please upload a valid JSON file.");
    }
}

/**
 * Triggers a download of the JSON data template.
 */
export function downloadTemplate() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(sampleData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "tvd_template.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

/**
 * Triggers a download of the current project data as a JSON file.
 */
export function exportJSON() {
    if (!state.currentData) return;
    // Create a clean copy of the data, removing transient state properties like 'locked'.
    const dataToExport = JSON.parse(JSON.stringify(state.currentData));
    Object.values(dataToExport.phases).forEach(phase => {
        phase.components.forEach(c => delete c.locked);
    });
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataToExport, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `tvd_export_${utils.getFormattedTimestamp()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

/**
 * Triggers a download of the current project data as a CSV file.
 */
export function exportCSV() {
    if (!state.currentData) return;

    const headers = ["Phase", "Component", "Benchmark Low", "Benchmark High", "Snapshot Value", "Scenario ROM"];
    let csvContent = headers.join(",") + "\n";

    // Iterate over phases and components to build the CSV string.
    for (const phaseKey in state.currentData.phases) {
        if (state.currentData.phases.hasOwnProperty(phaseKey)) {
            const phase = state.currentData.phases[phaseKey];
            const originalPhase = state.originalData.phases[phaseKey];
            phase.components.forEach(component => {
                const originalComponent = originalPhase.components.find(oc => oc.name === component.name);
                const snapshotValue = originalComponent ? originalComponent.current_rom : 0;
                const row = [
                    phaseKey,
                    `"${component.name.replace(/"/g, '""')}"`, // Handle quotes in name
                    component.benchmark_low,
                    component.benchmark_high,
                    snapshotValue,
                    component.current_rom
                ].join(",");
                csvContent += row + "\n";
            });
        }
    }

    // Use Blob to create the file for download.
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", url);
    downloadAnchorNode.setAttribute("download", `tvd_export_${utils.getFormattedTimestamp()}.csv`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    URL.revokeObjectURL(url);
} 