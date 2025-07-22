
import { state } from './state.js';
import * as dom from './dom.js';
import * as utils from './utils.js';
import * as ui from './ui.js';

// Forward-declare dependencies
let handleSquareFootageCellChange, render, handleGrossSfCellChange;
export function setDependencies(fns) {
    handleSquareFootageCellChange = fns.handleSquareFootageCellChange;
    render = fns.render;
    handleGrossSfCellChange = fns.handleGrossSfCellChange;
}


function updatePhase2ProgramTable(container, initialRender = false) {
    container.html('');

    // --- SNAPSHOT BUTTON UI ---

    // Create a container for the snapshot button
    const buttonContainer = container.append('div')
        .attr('class', 'flex justify-end mb-4');

    // Add the "Take Snapshot" button
    buttonContainer.append('button')
        .attr('id', 'program-view-snapshot-btn')
        .attr('class', 'bg-blue-600 text-white py-2 px-4 rounded-md font-semibold hover:bg-blue-700 transition')
        .text('Take Snapshot')
        .on('click', async () => {
            if (state.snapshots.length >= 3) {
                ui.showAlert(
                    "Snapshot Limit Reached",
                    "You can only save up to 3 snapshots. Please delete an existing snapshot to save a new one."
                );
                return;
            }
            // Show a nice modal dialog for the snapshot name
            const snapshotName = await ui.showModalDialog(
                "Take Snapshot",
                "Enter a name for this snapshot",
                "Create Snapshot",
                "Cancel"
            );
            
            if (snapshotName) {
                // Gather the current phase 2 component data for the snapshot
                const phase2CostOfWork = state.currentData.phases.phase2.costOfWork;
                const snapshotCostOfWork = phase2CostOfWork.map(c => ({
                    name: c.name,
                    target_value: c.target_value,
                    square_footage: c.square_footage
                }));
                // Create the snapshot object
                const snapshot = {
                    name: snapshotName,
                    projectAreaSF: state.currentData.projectAreaSF,
                    costOfWork: snapshotCostOfWork
                };
                // Add the snapshot to the state
                state.addSnapshot(snapshot);
                // Log all snapshots for debugging
                console.log('All snapshots:', state.snapshots);
            }
        });

    // --- PROGRAM TABLE ---

    const table = container.append('table')
        .attr('class', 'w-full text-sm text-left text-gray-500 border border-gray-200 bg-white rounded-lg shadow-sm overflow-hidden');

    // Header
    const thead = table.append('thead');
    const headerRow = thead.append('tr')
        .attr('class', 'text-xs text-gray-700 uppercase bg-gray-50');

    // Define the headers
    const headers = [
        'Component',
        'Square Footage',
        'Target Value / SF',
        'Target Value'
    ];

    headerRow.selectAll('th')
        .data(headers)
        .enter()
        .append('th')
        .attr('scope', 'col')
        .attr('class', 'px-6 py-3')
        .text(d => d);

    // Body
    const tbody = table.append('tbody');

    // Calculate totals for the footer
    let totalSquareFootage = 0;
    let totalTargetValue = 0;

    const phaseCostOfWork = state.currentData.phases.phase2.costOfWork;
    const originalCostOfWork = state.originalData.phases.phase2.costOfWork;

    // Calculate totals first
    phaseCostOfWork.forEach(d => {
        totalSquareFootage += d.square_footage;
        
        const originalComponent = originalCostOfWork.find(c => c.name === d.name);
        if (originalComponent) {
            totalTargetValue += (originalComponent.target_value * d.square_footage);
        }
    });

    const rows = tbody.selectAll('tr')
        .data(phaseCostOfWork)
        .enter()
        .append('tr')
        .attr('class', 'bg-white border-b hover:bg-gray-50');

    // Component Name
    rows.append('td')
        .attr('class', 'px-6 py-4 font-medium text-gray-900 whitespace-nowrap')
        .text(d => d.name);

    // Square Footage (editable)
    const sfCells = rows.append('td')
        .attr('class', 'px-6 py-4');

    sfCells.append('input')
        .attr('type', 'text')
        .attr('class', 'program-table-input')
        .attr('value', d => d.square_footage.toLocaleString('en-US'))
        .attr('data-phase', 'phase2')
        .attr('data-name', d => d.name)
        .on('change', function(event, d) {
            handleSquareFootageCellChange(event);
        });

    // Target Value / SF (from original data)
    rows.append('td')
        .attr('class', 'px-6 py-4')
        .text(d => {
            const originalComponent = originalCostOfWork.find(c => c.name === d.name);
            return originalComponent ? utils.formatCurrency(originalComponent.target_value) : '-';
        });

    // Target Value (Target Value/SF * Square Footage)
    rows.append('td')
        .attr('class', 'px-6 py-4')
        .text(d => {
            const originalComponent = originalCostOfWork.find(c => c.name === d.name);
            if (originalComponent) {
                const targetValue = originalComponent.target_value * d.square_footage;
                return utils.formatCurrencyBig(targetValue);
            }
            return '-';
        });

    // Add totals row
    const totalsRow = tbody.append('tr')
        .attr('class', 'bg-gray-100 border-t-2 border-gray-300 font-semibold');

    // Component Name (Total label)
    totalsRow.append('td')
        .attr('class', 'px-6 py-4 font-bold text-gray-900')
        .text('TOTALS');

    // Total Square Footage
    totalsRow.append('td')
        .attr('class', 'px-6 py-4 font-bold')
        .text(totalSquareFootage.toLocaleString('en-US'));

    // Target Value / SF (empty for totals)
    totalsRow.append('td')
        .attr('class', 'px-6 py-4')
        .text('-');

    // Total Target Value
    totalsRow.append('td')
        .attr('class', 'px-6 py-4 font-bold')
        .text(utils.formatCurrencyBig(totalTargetValue));
}

export function renderPhase2ProgramView() {
    // Clear the program view before rendering new content
    d3.select(dom.programView).html('');

    const mainContainer = d3.select(dom.programView);

    // --- SCHEME SELECTION UI (Horizontal Row) ---

    // Create a container for the scheme selection cards
    const schemesContainer = mainContainer.append('div')
        .attr('class', 'schemes-container mb-4 p-4 bg-gray-50 rounded-lg');

    // Add a heading for the scheme selection section
    schemesContainer.append('h3')
        .attr('class', 'text-lg font-bold text-gray-800 mb-3')
        .text('Select a Scheme');

    // Create a horizontal grid layout for the scheme cards
    const schemeGrid = schemesContainer.append('div')
        .attr('class', 'grid grid-cols-4 gap-4')
        .style('height', '200px');

    // Get the list of available schemes from the current data
    const schemeData = state.currentData.schemes || [];

    // Render a card for each scheme
    const schemeCards = schemeGrid.selectAll('.scheme-card')
        .data(schemeData, d => d.name)
        .join('div')
        .attr('class', 'scheme-card relative rounded-lg overflow-hidden shadow-md cursor-pointer h-full')
        .on('click', (event, d) => {
            // When a scheme card is clicked:
            const updates = [];

            // Animate Gross SF change
            const oldGrossSf = state.currentData.projectAreaSF;
            const newGrossSf = d.projectAreaSF;
            let grossSf_change = 'none';
            if (newGrossSf > oldGrossSf) grossSf_change = 'increase';
            else if (newGrossSf < oldGrossSf) grossSf_change = 'decrease';
            if (grossSf_change !== 'none') {
                updates.push({ name: 'Gross SF', sf_change: grossSf_change });
            }
            state.currentData.projectAreaSF = newGrossSf;

            // Animate each component's square footage change
            d.costOfWork.forEach(schemeComponent => {
                const currentComponent = state.currentData.phases.phase2.costOfWork.find(c => c.name === schemeComponent.name);
                if (currentComponent) {
                    const oldSf = currentComponent.square_footage;
                    const newSf = schemeComponent.square_footage;
                    let sf_change = 'none';
                    if (newSf > oldSf) sf_change = 'increase';
                    else if (newSf < oldSf) sf_change = 'decrease';
                    if (sf_change !== 'none') {
                        updates.push({ name: currentComponent.name, sf_change });
                    }
                    currentComponent.square_footage = newSf;
                }
            });

            render();
        });

    // Add image to each card
    schemeCards.append('img')
        .attr('src', d => d.image)
        .attr('alt', d => d.name)
        .attr('class', 'w-full h-full object-cover');

    // Add title overlay
    schemeCards.append('div')
        .attr('class', 'absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white p-2 text-center')
        .append('h4')
        .attr('class', 'font-semibold text-sm')
        .text(d => d.name);

    // --- PROGRAM TABLE (Full Width) ---
    const tableContainer = mainContainer.append('div')
        .attr('class', 'program-table-container');

    updatePhase2ProgramTable(tableContainer, true);
} 