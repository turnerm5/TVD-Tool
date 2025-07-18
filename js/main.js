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
import * as waterfall from './modules/chart-waterfall.js';
import * as views from './modules/views.js';

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

    // --- 1. Hide all views and deactivate all buttons ---
    dom.mainChart.classList.add('hidden');
    dom.programView.classList.add('hidden');
    dom.phase1View.classList.add('hidden');
    dom.benchmarksView.classList.add('hidden');
    dom.waterfallView.classList.add('hidden');
    dom.phaseSelector.classList.add('hidden');
    dom.legend.classList.add('hidden');
    dom.waterfallLegend.classList.add('hidden');
    dom.maximizeBtn.classList.add('hidden');

    dom.chartViewBtn.classList.remove('active');
    dom.programViewBtn.classList.remove('active');
    dom.phase1ViewBtn.classList.remove('active');
    dom.benchmarksViewBtn.classList.remove('active');
    dom.waterfallViewBtn.classList.remove('active');

    // --- 2. Show the active view and call its render function ---
    if (state.currentView === 'chart') {
        dom.mainChart.classList.remove('hidden');
        // dom.phaseSelector.classList.remove('hidden');
        dom.legend.classList.remove('hidden');
        dom.maximizeBtn.classList.remove('hidden');
        dom.chartViewBtn.classList.add('active');
        slider.renderChart();
        slider.renderYAxisLabels();
    } else if (state.currentView === 'program') {
        dom.programView.classList.remove('hidden');
        dom.programViewBtn.classList.add('active');
        views.renderPhase2ProgramView();
    } else if (state.currentView === 'phase1') {
        dom.phase1View.classList.remove('hidden');
        dom.phase1ViewBtn.classList.add('active');
        views.renderPhase1View();
    } else if (state.currentView === 'benchmarks') {
        dom.benchmarksView.classList.remove('hidden');
        dom.benchmarksViewBtn.classList.add('active');
        views.renderBenchmarksView(render);
    } else if (state.currentView === 'waterfall') {
        dom.waterfallView.classList.remove('hidden');
        // dom.phaseSelector.classList.remove('hidden');
        dom.waterfallLegend.classList.remove('hidden');
        dom.waterfallViewBtn.classList.add('active');
        waterfall.renderWaterfallChart();
    }

    // --- 3. Update Phase button styles ---
    if (state.currentPhase === 'phase1') {
        dom.phase1Btn.classList.add('bg-blue-600', 'text-white');
        dom.phase1Btn.classList.remove('bg-gray-300', 'text-gray-700', 'hover:bg-gray-400');
        dom.phase2Btn.classList.add('bg-gray-300', 'text-gray-700', 'hover:bg-gray-400');
        dom.phase2Btn.classList.remove('bg-blue-600', 'text-white');
    } else {
        dom.phase2Btn.classList.add('bg-blue-600', 'text-white');
        dom.phase2Btn.classList.remove('bg-gray-300', 'text-gray-700', 'hover:bg-gray-400');
        dom.phase1Btn.classList.add('bg-gray-300', 'text-gray-700', 'hover:bg-gray-400');
        dom.phase1Btn.classList.remove('bg-blue-600', 'text-white');
    }
    
    // --- 4. Update summary panel and reset button state ---
    ui.updateSummary(); 
    dom.resetButton.disabled = JSON.stringify(state.originalData) === JSON.stringify(state.currentData);
}

// --- DEPENDENCY INJECTION ---
// Pass functions and variables between modules to avoid circular dependencies.
ui.setRender(render);
fileHandlers.setRender(render);
fileHandlers.setYScale(yScale);
slider.setDependencies({
    render: render,
    renderProgramView: views.renderPhase2ProgramView,
    updateSummary: ui.updateSummary,
    yScale: yScale
});
views.setDependencies({
    render: render,
    handleSquareFootageCellChange: slider.handleSquareFootageCellChange,
    handleCurrentRomCellChange: slider.handleCurrentRomCellChange
});


// --- GLOBAL EVENT LISTENERS ---

/**
 * Main entry point. This event listener runs when the DOM is fully loaded.
 * It sets up all the click handlers for buttons and file drop zone events.
 */
document.addEventListener('DOMContentLoaded', () => {
    // --- Button Click Handlers ---
    dom.useSampleDataBtn.addEventListener('click', () => fileHandlers.loadData(sampleData));
    dom.downloadTemplateBtn.addEventListener('click', fileHandlers.downloadTemplate);
    dom.startOverBtn.addEventListener('click', ui.showSplashScreen);
    dom.exportJsonBtn.addEventListener('click', fileHandlers.exportJSON);
    dom.exportCsvBtn.addEventListener('click', fileHandlers.exportCSV);
    dom.resetButton.addEventListener('click', () => {
        // Reload original data to reset all changes
        fileHandlers.loadData(JSON.parse(JSON.stringify(state.originalData)));
    });
    dom.maximizeBtn.addEventListener('click', slider.balanceToGmp);
    
    // --- Phase and View Selector Handlers ---
    dom.phase1Btn.addEventListener('click', () => { state.currentPhase = 'phase1'; render(); });
    dom.phase2Btn.addEventListener('click', () => { state.currentPhase = 'phase2'; render(); });
    dom.chartViewBtn.addEventListener('click', () => { state.currentView = 'chart'; state.currentPhase = 'phase2'; render(); });
    dom.programViewBtn.addEventListener('click', () => { state.currentView = 'program'; render(); });
    dom.phase1ViewBtn.addEventListener('click', () => { state.currentView = 'phase1'; render(); });
    dom.benchmarksViewBtn.addEventListener('click', () => { state.currentView = 'benchmarks'; state.selectedBenchmark = null; render(); });
    dom.waterfallViewBtn.addEventListener('click', () => { state.currentView = 'waterfall'; state.currentPhase = 'phase2'; render(); });

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