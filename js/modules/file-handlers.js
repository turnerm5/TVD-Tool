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

// Forward-declare the updateSFForShelledFloors to be injected later.
let updateSFForShelledFloors;
export function setUpdateSFForShelledFloors(fn) {
    updateSFForShelledFloors = fn;
}

/**
 * Pre-processes the loaded data.
 * This function calculates the `benchmark_low` and `benchmark_high` values for each component
 * by finding the min/max of the corresponding costs from the `benchmarks` array.
 * @param {object} data - The raw data object loaded from the file.
 * @returns {object} The processed data object.
 */
function processData(data) {
    if (!data.benchmarks || (!data.phase1 && !data.phase2)) return data;

    const benchmarkCostsByName = {};
    data.benchmarks.forEach(proj => {
        proj.costOfWork.forEach(comp => {
            if (!benchmarkCostsByName[comp.name]) {
                benchmarkCostsByName[comp.name] = [];
            }
            benchmarkCostsByName[comp.name].push(comp.cost);
        });
    });

    // Process components using initialTargetValues for benchmark calculations
    if (data.initialTargetValues && Array.isArray(data.initialTargetValues)) {
        data.initialTargetValues.forEach(c => {
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
    if (!data.phase1 || !data.phase2) {
        alert("Invalid JSON format. Must contain 'phase1' and 'phase2' objects at the top level.");
        return;
    }
    
    // Find the Predesign scheme which contains the initial cost of work data
    const predesignScheme = data.schemes && data.schemes.find(s => s.name === 'Predesign');
    if (!predesignScheme || !predesignScheme.costOfWork) {
        alert("Invalid JSON format. Must contain a 'Predesign' scheme with costOfWork data.");
        return;
    }
    
    // Validate that initialTargetValues exists
    if (!data.initialTargetValues || !Array.isArray(data.initialTargetValues)) {
        alert("Invalid JSON format. Must contain 'initialTargetValues' array.");
        return;
    }

    const processedData = processData(JSON.parse(JSON.stringify(data)));

    state.clearSnapshots();
    if (data.snapshots && Array.isArray(data.snapshots)) {
        data.snapshots.forEach(snapshot => {
            const processedSnapshot = processData({ ...data, phases: { phase2: snapshot } });
            state.addSnapshot(processedSnapshot.phase2);
        });
    }

    state.lockedCostOfWork = new Set();

    // Lock components based on Predesign scheme data
    const processedPredesignScheme = processedData.schemes && processedData.schemes.find(s => s.name === 'Predesign');
    if (processedPredesignScheme && processedPredesignScheme.costOfWork) {
        processedPredesignScheme.costOfWork.forEach(component => {
            if (component.target_value === 0 || component.square_footage === 0) {
                const lockKey = `phase2-${component.name}`;
                state.lockedCostOfWork.add(lockKey);
            }
        });
    }

    state.originalData = JSON.parse(JSON.stringify(processedData));
    state.originalData.grossSF = predesignScheme.grossSF || 0;
    state.currentData = processedData;
    state.currentData.grossSF = predesignScheme.grossSF || 0;
    
    // Initialize the current scheme with the Predesign scheme + target values
    state.currentScheme = JSON.parse(JSON.stringify(predesignScheme));
    
    // Merge initialTargetValues into the current scheme
    state.currentScheme.costOfWork.forEach(component => {
        const targetValueData = processedData.initialTargetValues.find(tv => tv.name === component.name);
        if (targetValueData) {
            component.target_value = Number(targetValueData.target_value) || 0;
            component.benchmark_low = Number(targetValueData.benchmark_low) || 0;
            component.benchmark_high = Number(targetValueData.benchmark_high) || 0;
        } else {
            component.target_value = 0;
            component.benchmark_low = 0;
            component.benchmark_high = 0;
        }
    });
    
    // Calculate indirect cost percentages now that originalData is set
    state.calculateIndirectCostPercentages();
    
    // Set shelled floors based on the predesign scheme's setting
    const floorCount = predesignScheme.floors || 0;
    const shelledFloorsCount = predesignScheme.shelledFloors || 0;
    state.shelledFloors = new Array(floorCount).fill(false);
    // Mark the top N floors as shelled (checked)
    for (let i = floorCount - shelledFloorsCount; i < floorCount; i++) {
        if (i >= 0 && i < floorCount) {
            state.shelledFloors[i] = true;
        }
    }
    
    // Initialize previous square footage tracking
    state.previousSquareFootage = {};
    
    // Update C Interiors SF based on initial shelled floors
    if (updateSFForShelledFloors) {
        updateSFForShelledFloors();
    }

    // Now that C Interiors is adjusted, set the initial baseline for all components
    state.updatePreviousSquareFootage();
            
    console.log('Data loaded. Original Gross SF:', state.originalData.grossSF, 'Current Gross SF:', state.currentData.grossSF);

    // Dynamically set the Y-axis domain based on initialTargetValues AND benchmark data
    const maxTargetValue = d3.max(processedData.initialTargetValues, d => d.target_value);
    
    // Also consider benchmark values to ensure they fit in the chart
    const allBenchmarkValues = [];
    
    // Add benchmark_high and benchmark_low values from initialTargetValues
    processedData.initialTargetValues.forEach(c => {
        if (c.benchmark_high) allBenchmarkValues.push(c.benchmark_high);
        if (c.benchmark_low) allBenchmarkValues.push(c.benchmark_low);
    });
    
    // Add individual benchmark project costs
    if (processedData.benchmarks) {
        processedData.benchmarks.forEach(benchmark => {
            if (benchmark.costOfWork) {
                benchmark.costOfWork.forEach(comp => {
                    if (comp.cost) allBenchmarkValues.push(comp.cost);
                });
            }
        });
    }
    
    const maxBenchmarkValue = allBenchmarkValues.length > 0 ? d3.max(allBenchmarkValues) : 0;
    const overallMax = Math.max(maxTargetValue || 0, maxBenchmarkValue || 0);
    state.yDomainMax = Math.ceil(overallMax / 10) * 10;

    // Update UI
    document.getElementById('file-name').textContent = fileName;
    
    // Set default view to Phase 2 Program
    state.currentView = 'program';
    
    ui.showMainContent();
    
    // Update Reset button state since we just loaded fresh data
    state.updateResetButtonState();
    
    render();
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
    if (!state.originalData) return;

    // Start with a clean copy of the original data to preserve the imported values.
    const dataToExport = JSON.parse(JSON.stringify(state.originalData));

    // Clean up any transient properties.
            [dataToExport.phase1, dataToExport.phase2].forEach(phase => {
        if (phase.costOfWork) {
            phase.costOfWork.forEach(c => delete c.locked);
        }
    });

    // Replace the snapshots in the exported data with the current session's snapshots.
    if (state.snapshots.length > 0) {
        dataToExport.snapshots = JSON.parse(JSON.stringify(state.snapshots));
    } else {
        delete dataToExport.snapshots;
    }
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataToExport, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `tvd_save_${utils.getFormattedTimestamp()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
} 