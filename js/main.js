/**
 * @file main.js
 * @description Core script for the Interactive Target Value Design (TVD) Tool.
 * This script handles all application logic, including data loading, state management,
 * D3.js chart and table rendering, user interactions (drag, click, input), and file exports.
 */

// --- MODULE IMPORTS ---
import { state } from './modules/state.js';
import * as dom from './modules/dom.js';
import * as ui from './modules/ui.js';
import * as fileHandlers from './modules/file-handlers.js';
import * as slider from './modules/chart-slider.js';
import * as summary from './modules/chart-summary.js';
import * as sankey from './modules/chart-sankey.js';
import * as program from './modules/chart-program.js';
import * as benchmarks from './modules/chart-benchmarks.js';

// --- D3 SCALES ---
const yScale = d3.scaleLinear().domain([0, state.yDomainMax]);

// --- MAIN RENDER FUNCTION ---

/**
 * The core rendering function for the application. It is called whenever the state changes.
 * It manages which view is visible and calls the appropriate rendering function for that view.
 * It also updates the phase selector buttons and the summary panel.
 */
function render() {
    if (!state.currentData) return;

    // Update yScale domain based on current data
    if (state.yDomainMax) {
        yScale.domain([0, state.yDomainMax]);
    }

    // Update Reset button state based on whether data has changed
    state.updateResetButtonState();

    // --- 1. Hide all views and deactivate all buttons ---
    dom.mainChart.classList.add('hidden');
    dom.programView.classList.add('hidden');
    dom.phase1View.classList.add('hidden');
    dom.benchmarksView.classList.add('hidden');
    dom.summaryView.classList.add('hidden');
    dom.legend.classList.add('hidden');
    dom.summaryLegend.classList.add('hidden');
    dom.maximizeBtn.classList.add('hidden');
    dom.takeSnapshotBtn.classList.add('hidden');

    dom.chartViewBtn.classList.remove('active');
    dom.programViewBtn.classList.remove('active');
    dom.phase1ViewBtn.classList.remove('active');
    dom.benchmarksViewBtn.classList.remove('active');
    dom.summaryViewBtn.classList.remove('active');

    // --- 2. Show the active view and call its render function ---
    if (state.currentView === 'chart') {
        dom.mainChart.classList.remove('hidden');
        // dom.phaseSelector.classList.remove('hidden');
        dom.legend.classList.remove('hidden');
        dom.maximizeBtn.classList.remove('hidden');
        dom.takeSnapshotBtn.classList.remove('hidden');
        dom.chartViewBtn.classList.add('active');
        slider.renderChart();
        slider.renderYAxisLabels();
    } else if (state.currentView === 'program') {
        dom.programView.classList.remove('hidden');
        dom.programViewBtn.classList.add('active');
        program.renderPhase2ProgramView(render, slider.handleSquareFootageCellChange);
    } else if (state.currentView === 'phase1') {
        dom.phase1View.classList.remove('hidden');
        dom.phase1ViewBtn.classList.add('active');
        requestAnimationFrame(() => {
            sankey.renderSankeyChart(state.currentData);
        });
    } else if (state.currentView === 'benchmarks') {
        dom.benchmarksView.classList.remove('hidden');
        dom.benchmarksViewBtn.classList.add('active');
        benchmarks.render(render);
    } else if (state.currentView === 'summary') {
        dom.summaryView.classList.remove('hidden');
        // dom.phaseSelector.classList.remove('hidden');
        dom.summaryLegend.classList.remove('hidden');
        dom.summaryViewBtn.classList.add('active');
        // Ensure the view is painted before trying to measure its dimensions
        requestAnimationFrame(() => {
            summary.renderSummaryCharts();
            summary.updateSummary();
        });
    }
}

// --- DEPENDENCY INJECTION ---
// Pass functions and variables between modules to avoid circular dependencies.
ui.setRender(render);
fileHandlers.setRender(render);
fileHandlers.setYScale(yScale);
slider.setDependencies({
    render: render,
    yScale: yScale
});
summary.setRender(render);


// --- GLOBAL EVENT LISTENERS ---

/**
 * Main entry point. This event listener runs when the DOM is fully loaded.
 * It sets up all the click handlers for buttons and file drop zone events.
 */
document.addEventListener('DOMContentLoaded', () => {
    // --- Button Click Handlers ---
    dom.useSampleDataBtn.addEventListener('click', () => fileHandlers.loadData(sampleData));
    dom.downloadTemplateBtn.addEventListener('click', fileHandlers.downloadTemplate);
    dom.startOverBtn.addEventListener('click', async () => {
        const confirmed = await ui.showConfirmDialog(
            "Confirm Start Over",
            "Are you sure you want to start over? All unsaved changes will be lost.",
            "Yes, Start Over",
            "Cancel"
        );
        if (confirmed) {
            ui.showSplashScreen();
        }
    });
    dom.exportJsonBtn.addEventListener('click', fileHandlers.exportJSON);
    dom.resetButton.addEventListener('click', async () => {
        const confirmed = await ui.showConfirmDialog(
            "Confirm Reset",
            "Are you sure you want to reset all values to their original imported state? All unsaved changes will be lost.",
            "Yes, Reset",
            "Cancel"
        );
        if (confirmed) {
            fileHandlers.loadData(state.originalData);
            // Reset button state will be updated by the loadData function's call to updateResetButtonState
        }
    });
    dom.maximizeBtn.addEventListener('click', slider.balanceToGmp);
    dom.takeSnapshotBtn.addEventListener('click', async () => {
        if (state.snapshots.length >= 3) {
            ui.showAlert(
                "Snapshot Limit Reached",
                "You can only save up to 3 snapshots. Please delete an existing snapshot to save a new one."
            );
            return;
        }
        const snapshotName = await ui.showModalDialog(
            "Take Snapshot",
            "Enter a name for this snapshot",
            "Create Snapshot",
            "Cancel"
        );
        if (snapshotName) {
            const phase2CostOfWork = state.currentScheme.costOfWork;
            const snapshotCostOfWork = phase2CostOfWork.map(c => ({
                name: c.name,
                target_value: c.target_value,
                square_footage: c.square_footage
            }));
            const snapshot = {
                name: snapshotName,
                grossSF: state.currentData.grossSF,
                costOfWork: snapshotCostOfWork
            };
            state.addSnapshot(snapshot);
            console.log('All snapshots:', state.snapshots);
            render(); // Re-render to update the summary view
        }
    });
    
    // --- View Selector Handlers ---
    dom.chartViewBtn.addEventListener('click', () => { state.currentView = 'chart'; state.currentPhase = 'phase2'; render(); });
    dom.programViewBtn.addEventListener('click', () => { state.currentView = 'program'; render(); });
    dom.phase1ViewBtn.addEventListener('click', () => { state.currentView = 'phase1'; render(); });
    dom.benchmarksViewBtn.addEventListener('click', () => { state.currentView = 'benchmarks'; state.selectedBenchmark = null; render(); });
    dom.summaryViewBtn.addEventListener('click', () => { state.currentView = 'summary'; state.currentPhase = 'phase2'; render(); });

    // --- File Drop Zone Handlers ---
    dom.fileInput.addEventListener('change', (e) => fileHandlers.handleFile(e.target.files[0]));
    dom.fileDropZone.addEventListener('click', () => dom.fileInput.click());
    dom.fileDropZone.addEventListener('dragover', (e) => { e.preventDefault(); dom.fileDropZone.classList.add('dragover'); });
    dom.fileDropZone.addEventListener('dragleave', () => dom.fileDropZone.classList.remove('dragover'));
    dom.fileDropZone.addEventListener('drop', (e) => { e.preventDefault(); dom.fileDropZone.classList.remove('dragover'); fileHandlers.handleFile(e.dataTransfer.files[0]); });
    
    // Re-render on window resize to ensure charts are responsive.
    window.addEventListener('resize', render);

    // Initial load
}); 