
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
                    square_footage: c.square_footage,
                    building_efficiency: c.building_efficiency // Include building_efficiency for C Interiors
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
        'Value'
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

    const phaseCostOfWork = state.currentData.phases.phase2.costOfWork;

    // Calculate Cost of Work totals
    let cowTotalSquareFootage = 0;
    let cowTotalTargetValue = 0;

    phaseCostOfWork.forEach(d => {
        cowTotalSquareFootage += d.square_footage;
        
        // Use current component data for calculation instead of hybrid
        cowTotalTargetValue += utils.calculateComponentValue(d);
    });

    // --- COST OF WORK SECTION ---
    // Add Cost of Work subheading
    const cowSubheadRow = tbody.append('tr')
        .attr('class', 'bg-blue-50 border-b');

    cowSubheadRow.append('td')
        .attr('class', 'px-6 py-3 font-bold text-blue-900 uppercase text-sm')
        .attr('colspan', 4)
        .text('Cost of Work');

    // Add Cost of Work rows
    const cowRows = tbody.selectAll('tr.cow-row')
        .data(phaseCostOfWork)
        .enter()
        .append('tr')
        .attr('class', 'cow-row bg-white border-b hover:bg-gray-50');

    // Component Name
    cowRows.append('td')
        .attr('class', 'px-6 py-4 font-medium text-gray-900 whitespace-nowrap')
        .text(d => d.name);

    // Square Footage (editable)
    const sfCells = cowRows.append('td')
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

    // Target Value / SF (use current data instead of original)
    cowRows.append('td')
        .attr('class', 'px-6 py-4')
        .text(d => utils.formatCurrency(d.target_value));

    // Target Value (use current component data for calculation)
    cowRows.append('td')
        .attr('class', 'px-6 py-4')
        .text(d => {
            const targetValue = utils.calculateComponentValue(d);
            return utils.formatCurrencyBig(targetValue);
        });

    // Add Cost of Work subtotal row
    const cowSubtotalRow = tbody.append('tr')
        .attr('class', 'bg-blue-100 border-t border-blue-300 font-semibold');

    cowSubtotalRow.append('td')
        .attr('class', 'px-6 py-3 font-bold text-blue-900')
        .text('Cost of Work Subtotal');

    cowSubtotalRow.append('td')
        .attr('class', 'px-6 py-3 font-bold text-blue-900')
        .text('-');

    cowSubtotalRow.append('td')
        .attr('class', 'px-6 py-3 font-bold text-blue-900')
        .text('-');

    cowSubtotalRow.append('td')
        .attr('class', 'px-6 py-3 font-bold text-blue-900')
        .text(utils.formatCurrencyBig(cowTotalTargetValue));

    // --- INDIRECTS SECTION ---
    // Calculate indirect costs using current component data
    const totalCow = utils.calculateTotalCostOfWork(phaseCostOfWork);
    let indirectsTotal = 0;

    // Add Indirects subheading
    const indirectsSubheadRow = tbody.append('tr')
        .attr('class', 'bg-orange-50 border-b');

    indirectsSubheadRow.append('td')
        .attr('class', 'px-6 py-3 font-bold text-orange-900 uppercase text-sm')
        .attr('colspan', 4)
        .text('Indirects');

    // Add Indirect rows
    if (state.indirectCostPercentages && state.indirectCostPercentages.length > 0) {
        const indirectRows = tbody.selectAll('tr.indirect-row')
            .data(state.indirectCostPercentages)
            .enter()
            .append('tr')
            .attr('class', 'indirect-row bg-white border-b hover:bg-gray-50');

        // Component Name
        indirectRows.append('td')
            .attr('class', 'px-6 py-4 font-medium text-gray-900 whitespace-nowrap')
            .text(d => d.name);

        // Square Footage (empty for indirects)
        indirectRows.append('td')
            .attr('class', 'px-6 py-4 text-gray-400')
            .text('-');

        // Target Value / SF (empty for indirects)
        indirectRows.append('td')
            .attr('class', 'px-6 py-4 text-gray-400')
            .text('-');

        // Value (calculated from percentage)
        indirectRows.append('td')
            .attr('class', 'px-6 py-4')
            .text(d => {
                const value = d.percentage * totalCow;
                indirectsTotal += value;
                return utils.formatCurrencyBig(value);
            });
    }

    // --- GRAND TOTAL ROW ---
    const grandTotalRow = tbody.append('tr')
        .attr('class', 'bg-gray-200 border-t-2 border-gray-400 font-bold');

    grandTotalRow.append('td')
        .attr('class', 'px-6 py-4 font-bold text-gray-900 uppercase')
        .text('Grand Total');

    grandTotalRow.append('td')
        .attr('class', 'px-6 py-4')
        .text('-');

    grandTotalRow.append('td')
        .attr('class', 'px-6 py-4')
        .text('-');

    grandTotalRow.append('td')
        .attr('class', 'px-6 py-4 font-bold text-gray-900')
        .text(utils.formatCurrencyBig(totalCow + indirectsTotal));
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
        .text('Demonstration Schemes');

    // Create a horizontal grid layout for the scheme cards
    const schemeGrid = schemesContainer.append('div')
        .attr('class', 'grid grid-cols-4 gap-4')
        .style('height', '300px');

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

    // Add image to each card (taking up most of the height)
    schemeCards.append('img')
        .attr('src', d => d.image)
        .attr('alt', d => d.name)
        .attr('class', 'w-full object-cover')
        .style('height', '60%');

    // Add content container below the image
    const contentContainer = schemeCards.append('div')
        .attr('class', 'p-2 bg-white h-2/5 flex flex-col justify-between');

    // Add scheme name
    contentContainer.append('h4')
        .attr('class', 'font-semibold text-sm text-gray-800 mb-1')
        .text(d => d.name);

    // Add description
    contentContainer.append('p')
        .attr('class', 'text-xs text-gray-600 mb-2 leading-tight')
        .text(d => d.description);

    // Add stats container
    const statsContainer = contentContainer.append('div')
        .attr('class', 'text-xs text-gray-700');

    // Add total SF
    statsContainer.append('div')
        .attr('class', 'mb-1')
        .html(d => `<strong>Total SF:</strong> ${d.projectAreaSF.toLocaleString()}`);

    

    // --- PROGRAM TABLE (Full Width) ---
    const tableContainer = mainContainer.append('div')
        .attr('class', 'program-table-container');

    updatePhase2ProgramTable(tableContainer, true);
} 