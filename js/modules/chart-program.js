
import { state } from './state.js';
import * as dom from './dom.js';
import * as utils from './utils.js';
import * as ui from './ui.js';

// Forward-declare dependencies
let handleSquareFootageCellChange, handleCurrentRomCellChange, render, handleGrossSfCellChange;
export function setDependencies(fns) {
    handleSquareFootageCellChange = fns.handleSquareFootageCellChange;
    handleCurrentRomCellChange = fns.handleCurrentRomCellChange;
    render = fns.render;
    handleGrossSfCellChange = fns.handleGrossSfCellChange;
}


export function renderPhase2ProgramView() {
    // Clear the program view before rendering new content
    d3.select(dom.programView).html('');

    const twoColumnLayout = d3.select(dom.programView).append('div')
        .attr('class', 'flex gap-4');

    const leftColumn = twoColumnLayout.append('div')
        .attr('class', 'w-2/3');
    
    const rightColumn = twoColumnLayout.append('div')
        .attr('class', 'w-1/3');

    // --- SCHEME SELECTION UI ---

    // Create a container for the scheme selection cards
    const schemesContainer = leftColumn.append('div')
        .attr('class', 'schemes-container mb-4 p-4 bg-gray-50 rounded-lg');

    // Add a heading for the scheme selection section
    schemesContainer.append('h3')
        .attr('class', 'text-xl font-bold text-gray-800 mb-4')
        .text('Select a Scheme');

    // Create a grid layout for the scheme cards
    const schemeGrid = schemesContainer.append('div')
        .attr('class', 'grid grid-cols-2 gap-4');

    // Get the list of available schemes from the current data
    const schemeData = state.currentData.schemes || [];

    // Render a card for each scheme
    const schemeCards = schemeGrid.selectAll('.scheme-card')
        .data(schemeData, d => d.name)
        .join('div')
        .attr('class', 'scheme-card relative rounded-lg overflow-hidden shadow-md cursor-pointer')
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

            // Determine changes before applying them
            state.currentData.phases.phase2.components.forEach(component => {
                const schemeComponent = d.components.find(c => c.name === component.name);
                if (schemeComponent) {
                    const old_sf = component.square_footage;
                    const new_sf = schemeComponent.square_footage;
                    const old_rom = component.current_rom;
                    const new_rom = schemeComponent.current_rom;
                    
                    let sf_change = 'none';
                    if (new_sf > old_sf) sf_change = 'increase';
                    else if (new_sf < old_sf) sf_change = 'decrease';

                    if (sf_change !== 'none') {
                        updates.push({ name: component.name, sf_change });
                    }

                    // Update the component's square footage and ROM value
                    component.square_footage = new_sf;
                    component.current_rom = new_rom;
                }
            });

            // Re-render the program view to reflect the new scheme selection
            renderPhase2ProgramView();

            // After rendering, apply animations
            // Use a brief timeout to ensure the DOM is updated before we select elements
            setTimeout(() => {
                updates.forEach(update => {
                    // Find row for component
                    const row = d3.select(dom.programView).selectAll('tbody tr').filter(d_row => d_row && d_row.name === update.name);
                    if (!row.empty()) {
                        if (update.sf_change !== 'none') {
                            const cell = row.select(update.name === 'Gross SF' ? 'td:nth-child(2)' : 'td:nth-child(2)');
                            if (!cell.empty()) {
                                const className = `value-${update.sf_change}`;
                                // Remove any existing animation classes before adding the new one
                                cell.classed('value-increase', false).classed('value-decrease', false);
                                // Add the new class to trigger the animation
                                cell.classed(className, true);
                            }
                        }
                    }
                });
            }, 100);
        });

    // Add the scheme image to each card
    schemeCards.append('img')
        .attr('src', d => d.image)
        .attr('alt', d => d.name)
        .attr('class', 'w-full h-60 object-cover');

    // Add the scheme name overlay to each card
    schemeCards.append('div')
        .attr('class', 'absolute bottom-0 left-0 w-full p-2 bg-black bg-opacity-50 text-white font-semibold')
        .text(d => d.name);

    // --- SNAPSHOT BUTTON UI ---

    // Create a container for the snapshot button
    const buttonContainer = rightColumn.append('div')
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
                const phase2Components = state.currentData.phases.phase2.components;
                const snapshotComponents = phase2Components.map(c => ({
                    name: c.name,
                    current_rom: c.current_rom,
                    square_footage: c.square_footage
                }));
                // Create the snapshot object
                const snapshot = {
                    name: snapshotName,
                    projectAreaSF: state.currentData.projectAreaSF,
                    components: snapshotComponents
                };
                // Add the snapshot to the state
                state.addSnapshot(snapshot);
                // Log all snapshots for debugging
                console.log('All snapshots:', state.snapshots);
            }
        });

    // --- TABLE DATA PREPARATION ---

    // Prepare the data for the program table
    const tableData = [];

    // Add Gross SF row data
    tableData.push({
        type: 'gross-sf',
        name: 'Gross SF',
        value: state.currentData.projectAreaSF || 0
    });

    // Sort phase 2 components alphabetically by name
    const p2Components = state.currentData.phases.phase2.components.sort((a, b) => a.name.localeCompare(b.name));
    if (p2Components.length > 0) {
        // Add each component to the table data array, tagging with type and phase
        p2Components.forEach(c => tableData.push({ ...c, type: 'component', dataPhase: 'phase2' }));
    }

    // Create Table
    const table = rightColumn.append('table').attr('class', 'min-w-full divide-y divide-gray-200');

    // Create Header
    const thead = table.append('thead').attr('class', 'bg-gray-50');
    thead.append('tr').selectAll('th')
        .data(['Component', 'Square Footage'])
        .enter().append('th')
        .attr('class', 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider')
        .text(d => d);

    // Create Body
    const tbody = table.append('tbody');
    const rows = tbody.selectAll('tr').data(tableData).enter().append('tr');

    rows.each(function(d) {
        const row = d3.select(this);
        if (d.type === 'gross-sf') {
            row.attr('class', 'bg-white font-bold');
            row.append('td')
                .attr('class', 'px-6 py-4 whitespace-nowrap text-sm text-gray-900')
                .text(d.name);
            row.append('td')
                .attr('class', 'px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center editable-cell')
                .append('input').attr('type', 'text').attr('class', 'w-full text-center')
                .attr('value', d.value.toLocaleString('en-US'))
                .on('change', handleGrossSfCellChange);
        } else if (d.type === 'header') {
            row.attr('class', 'bg-gray-100');
            row.append('td').attr('colspan', 2).attr('class', 'py-2 px-6 text-sm font-bold text-gray-700').text(d.name);
        } else {
            if (d.current_rom === 0 || d.square_footage === 0) {
                row.attr('class', 'zero-value-row');
            } else {
                row.attr('class', 'bg-white');
            }

            row.append('td').attr('class', 'py-4 px-6 text-sm font-medium text-gray-900 whitespace-nowrap').text(d.name);
            
            // Square Footage (editable)
            row.append('td').attr('class', 'py-4 px-6 text-sm text-gray-500 whitespace-nowrap editable-cell')
                .append('input').attr('type', 'text').attr('class', 'w-full text-center')
                .attr('value', d.square_footage.toLocaleString('en-US'))
                .attr('data-phase', d.dataPhase)
                .attr('data-name', d.name)
                .on('change', handleSquareFootageCellChange);
        }
    });
} 