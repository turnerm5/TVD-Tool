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
let updateProgramSF;
export function setUpdateProgramSF(fn) {
    updateProgramSF = fn;
}

/**
 * Pre-processes the loaded data.
 * This function calculates the `benchmark_low` and `benchmark_high` values for each component
 * by finding the min/max of the corresponding costs from the `benchmarks` array.
 * @param {object} data - The raw data object loaded from the file.
 * @returns {object} The processed data object.
 */
function processData(data) {
    if (!data.benchmarks) return data;

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

export function loadData(data, fileName = 'Workshop 1') {
    if (!data.phase2) {
        alert("Invalid JSON format. Must contain a 'phase2' object at the top level.");
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
            // Snapshots in saved files are already full snapshot objects; add them directly
            state.addSnapshot(snapshot);
        });
    }

    state.lockedCostOfWork = new Set();

    // Initialize state containers
    state.originalData = JSON.parse(JSON.stringify(processedData));
    state.currentData = processedData;
    
    // Initialize grossSF default to 55,000 if not provided
    state.originalData.grossSF = Number(state.originalData.grossSF) || 55000;
    state.currentData.grossSF = Number(state.currentData.grossSF) || 55000;
    
    // Initialize new floor model defaults
    state.numFloors = 3;
    state.shelledFloorsCount = 0;
    
    // Load interiors target values into state for editing in Interiors view
    state.interiors.targetValues = Array.isArray(processedData.interiorTargetValues)
        ? JSON.parse(JSON.stringify(processedData.interiorTargetValues))
        : [];
    // Load interior mix schemes for quick selection in Interiors view
    state.currentData.interiorMixSchemes = Array.isArray(processedData.interiorMixSchemes)
        ? JSON.parse(JSON.stringify(processedData.interiorMixSchemes))
        : [];
    
    // Initialize the current scheme from target values (no predefined schemes)
    state.currentScheme = {
        name: 'Custom',
        phases: 1,
        floorData: [],
        costOfWork: processedData.initialTargetValues.map(tv => ({
            name: tv.name,
            square_footage: 0,
            target_value: Number(tv.target_value) || 0,
            benchmark_low: Number(tv.benchmark_low) || 0,
            benchmark_high: Number(tv.benchmark_high) || 0
        }))
    };
    
    // Calculate indirect cost percentages now that originalData is set
    state.calculateIndirectCostPercentages();

    // Initialize active phases
    state.activePhases = [1];
    
    // Initialize previous square footage tracking
    state.previousSquareFootage = {};
    
    // Update component SF based on initial shelled floors and active phases
    if (updateProgramSF) {
        updateProgramSF();
    }

    // Set the initial baseline for all components
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

    // Clean up any transient properties for phase2.
    if (dataToExport.phase2 && dataToExport.phase2.costOfWork) {
        dataToExport.phase2.costOfWork.forEach(c => delete c.locked);
    }

    // Replace the snapshots in the exported data with the current session's snapshots.
    if (state.snapshots.length > 0) {
        dataToExport.snapshots = JSON.parse(JSON.stringify(state.snapshots));
    } else {
        delete dataToExport.snapshots;
    }

    // Persist current grossSF
    dataToExport.grossSF = Number(state.currentData?.grossSF) || Number(dataToExport.grossSF) || 0;

    // Persist current target values into initialTargetValues so re-import restores the latest session
    if (state.currentScheme && Array.isArray(state.currentScheme.costOfWork)) {
        const originalByName = {};
        (state.originalData.initialTargetValues || []).forEach(tv => { originalByName[tv.name] = tv; });
        dataToExport.initialTargetValues = state.currentScheme.costOfWork.map(c => ({
            name: c.name,
            target_value: Number(c.target_value) || 0,
            benchmark_low: Number(originalByName[c.name]?.benchmark_low) || 0,
            benchmark_high: Number(originalByName[c.name]?.benchmark_high) || 0
        }));
    }

    // Persist current Interiors target values (per-room $/SF and flags)
    if (state.interiors && Array.isArray(state.interiors.targetValues) && state.interiors.targetValues.length > 0) {
        dataToExport.interiorTargetValues = JSON.parse(JSON.stringify(state.interiors.targetValues));
    }

    // If interior mix schemes were modified during the session, persist current copy
    if (state.currentData && Array.isArray(state.currentData.interiorMixSchemes)) {
        dataToExport.interiorMixSchemes = JSON.parse(JSON.stringify(state.currentData.interiorMixSchemes));
    }
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataToExport, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `tvd_save_${utils.getFormattedTimestamp()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}
