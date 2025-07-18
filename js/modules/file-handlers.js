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

    const benchmarkCostsByName = {};
    data.benchmarks.forEach(proj => {
        proj.components.forEach(comp => {
            if (!benchmarkCostsByName[comp.name]) {
                benchmarkCostsByName[comp.name] = [];
            }
            benchmarkCostsByName[comp.name].push(comp.cost);
        });
    });

    // Only process components for phase2
    if (data.phases.phase2 && data.phases.phase2.components) {
        data.phases.phase2.components.forEach(c => {
            const costs = benchmarkCostsByName[c.name] || [];
            c.benchmark_low = costs.length ? Math.min(...costs) : 0;
            c.benchmark_high = costs.length ? Math.max(...costs) : 0;
        });
    }

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

    const processedData = processData(JSON.parse(JSON.stringify(data)));

    state.lockedComponents = new Set();

    // Lock components only for phase2
    if (processedData.phases.phase2 && processedData.phases.phase2.components) {
        processedData.phases.phase2.components.forEach(component => {
            if (component.current_rom === 0 || component.square_footage === 0) {
                const lockKey = `phase2-${component.name}`;
                state.lockedComponents.add(lockKey);
            }
        });
    }

    state.originalData = JSON.parse(JSON.stringify(processedData));
    state.currentData = processedData;

    // Dynamically set the Y-axis domain based on phase 2 data only
    const allComponents = processedData.phases.phase2.components;
    const maxVal = d3.max(allComponents, d => Math.max(d.benchmark_high, d.current_rom));
    state.yDomainMax = Math.ceil(maxVal / 10) * 10 + 20;
    yScale.domain([0, state.yDomainMax]);

    document.getElementById('file-name').textContent = `Using: ${fileName}`;
    state.currentPhase = 'phase1';

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

    // Only export phase 2 data
    const phaseKey = 'phase2';
    const phase = state.currentData.phases[phaseKey];
    const originalPhase = state.originalData.phases[phaseKey];

    if (phase && phase.components) {
        phase.components.forEach(component => {
            const originalComponent = originalPhase.components.find(oc => oc.name === component.name);
            const snapshotValue = originalComponent ? originalComponent.current_rom : 0;
            const row = [
                phaseKey,
                `"${component.name.replace(/"/g, '""')}"`,
                component.benchmark_low,
                component.benchmark_high,
                snapshotValue,
                component.current_rom
            ].join(",");
            csvContent += row + "\n";
        });
    }

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