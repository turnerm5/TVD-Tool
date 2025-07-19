/**
 * @file views.js
 * @description Renders the different views of the application like the program table and benchmarks grid.
 */

import { state } from './state.js';
import * as dom from './dom.js';
import * as utils from './utils.js';
import * as ui from './ui.js';

// Forward-declare dependencies
let handleSquareFootageCellChange, handleCurrentRomCellChange;
export function setDependencies(fns) {
    handleSquareFootageCellChange = fns.handleSquareFootageCellChange;
    handleCurrentRomCellChange = fns.handleCurrentRomCellChange;
}

/**
 * Renders the Benchmarks view.
 * This function handles the logic for displaying either the main grid of four projects
 * or the detailed view for a single selected project.
 */
export function renderBenchmarksView(render) {
    const detailContainer = document.getElementById('benchmark-detail-container');
    const benchmarkGrid = d3.select('.benchmark-grid');

    // --- Always update the main grid first ---
    const benchmarkData = state.currentData.benchmarks || [];

    const benchmarkCards = benchmarkGrid.selectAll('.benchmark-card')
        .data(benchmarkData, d => d.id)
        .join(
            enter => {
                const card = enter.append('div')
                    .attr('class', 'benchmark-card')
                    .attr('id', d => `benchmark-card-${d.id}`);

                const relativeDiv = card.append('div').attr('class', 'relative');
                relativeDiv.append('img')
                    .attr('src', d => d.image)
                    .attr('alt', d => d.name)
                    .attr('class', 'w-full h-auto rounded-lg shadow-md');
                relativeDiv.append('div').attr('class', 'benchmark-label').text(d => d.id);

                const caption = card.append('div').attr('class', 'benchmark-caption');
                caption.append('h4').attr('class', 'font-semibold').text(d => d.name);
                caption.append('p').attr('class', 'text-gray-600 text-sm').text(d => `${utils.formatCurrency(d.overall_sf_cost)} /SF`);
                caption.append('p').attr('class', 'text-gray-600 text-sm').text(d => `${utils.formatNumber(d.square_footage)} SF`);
                
                return card;
            },
            update => {
                // Update existing cards if necessary (e.g., if data changes)
                update.select('h4').text(d => d.name);
                update.select('img').attr('src', d => d.image).attr('alt', d => d.name);
                update.selectAll('p').remove(); // Clear and re-append to be simple
                const caption = update.select('.benchmark-caption');
                caption.append('p').attr('class', 'text-gray-600 text-sm').text(d => `${utils.formatCurrency(d.overall_sf_cost)} /SF`);
                caption.append('p').attr('class', 'text-gray-600 text-sm').text(d => `${utils.formatNumber(d.square_footage)} SF`);
                return update;
            }
        );

    // --- Handle Card Click Events ---
    benchmarkCards.on('click', function(event, d) {
        if (state.selectedBenchmark === d.id) {
            state.selectedBenchmark = null;
        } else {
            state.selectedBenchmark = d.id;
        }
        render(); // Re-render to show/hide detail view
    });


    if (state.selectedBenchmark) {
        // --- Show Detail View ---
        dom.benchmarksView.classList.add('detail-active');
        detailContainer.classList.remove('hidden');

        // Move the detail container inside the grid to become a flex item
        benchmarkGrid.node().appendChild(detailContainer);

        // Highlight the selected card and fade others
        benchmarkCards.classed('selected', d => d.id === state.selectedBenchmark);


        // Find data for the selected project
        const projectData = state.currentData.benchmarks.find(p => p.id === state.selectedBenchmark);
        if (!projectData) return;

        // --- Render the detail table ---
        const detailContainerD3 = d3.select(detailContainer);
        detailContainerD3.html(''); // Clear previous content

        detailContainerD3.append('h3')
            .attr('class', 'text-2xl font-bold text-gray-800')
            .text(projectData.name);

        detailContainerD3.append('button')
            .attr('class', 'absolute top-0 right-0 mt-2 mr-2 text-2xl font-bold text-gray-500 hover:text-gray-800')
            .html('&times;')
            .on('click', () => {
                state.selectedBenchmark = null;
                render();
            });

        const table = detailContainerD3.append('table')
            .attr('class', 'benchmark-detail-table');

        const thead = table.append('thead');
        thead.append('tr').selectAll('th')
            .data(['Component', 'Cost ($/SF)'])
            .enter()
            .append('th')
            .text(d => d);

        const tbody = table.append('tbody');
        const rows = tbody.selectAll('tr')
            .data(projectData.components)
            .enter()
            .append('tr');

        rows.append('td').text(d => d.name);
        rows.append('td').text(d => utils.formatCurrency(d.cost));

    } else {
        // --- Show Grid View ---
        dom.benchmarksView.classList.remove('detail-active');
        detailContainer.classList.add('hidden');
        benchmarkCards.classed('selected', false);

        // Move the detail container back to its original position
        dom.benchmarksView.appendChild(detailContainer);
    }
}


/**
 * Renders the main data program view with detailed component information.
 */
export function renderPhase1View() {
    // This function now only ensures the view is visible.
    // The Sankey chart is rendered by main.js into the existing container.
    dom.phase1View.classList.remove('hidden');
}

export function renderPhase2ProgramView() {
    // Clear the program view before rendering new content
    d3.select(dom.programView).html('');

    // --- SCHEME SELECTION UI ---

    // Create a container for the scheme selection cards
    const schemesContainer = d3.select(dom.programView).append('div')
        .attr('class', 'schemes-container mb-4 p-4 bg-gray-50 rounded-lg');

    // Add a heading for the scheme selection section
    schemesContainer.append('h3')
        .attr('class', 'text-xl font-bold text-gray-800 mb-4')
        .text('Select a Scheme');

    // Create a grid layout for the scheme cards
    const schemeGrid = schemesContainer.append('div')
        .attr('class', 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4');

    // Get the list of available schemes from the current data
    const schemeData = state.currentData.schemes || [];

    // Render a card for each scheme
    const schemeCards = schemeGrid.selectAll('.scheme-card')
        .data(schemeData, d => d.name)
        .join('div')
        .attr('class', 'scheme-card relative rounded-lg overflow-hidden shadow-md cursor-pointer')
        .on('click', (event, d) => {
            // When a scheme card is clicked:
            // Update the phase 2 components with the selected scheme's data
            state.currentData.phases.phase2.components.forEach(component => {
                // Find the matching component in the selected scheme
                const schemeComponent = d.components.find(c => c.name === component.name);
                if (schemeComponent) {
                    // Update the component's square footage and ROM value
                    component.square_footage = schemeComponent.square_footage;
                    component.current_rom = schemeComponent.current_rom;
                }
            });
            // Re-render the program view to reflect the new scheme selection
            renderPhase2ProgramView();
        });

    // Add the scheme image to each card
    schemeCards.append('img')
        .attr('src', d => d.image)
        .attr('alt', d => d.name)
        .attr('class', 'w-full h-40 object-cover');

    // Add the scheme name overlay to each card
    schemeCards.append('div')
        .attr('class', 'absolute bottom-0 left-0 w-full p-2 bg-black bg-opacity-50 text-white font-semibold')
        .text(d => d.name);

    // --- SNAPSHOT BUTTON UI ---

    // Create a container for the snapshot button
    const buttonContainer = d3.select(dom.programView).append('div')
        .attr('class', 'flex justify-end mb-4');

    // Add the "Take Snapshot" button
    buttonContainer.append('button')
        .attr('id', 'program-view-snapshot-btn')
        .attr('class', 'bg-blue-600 text-white py-2 px-4 rounded-md font-semibold hover:bg-blue-700 transition')
        .text('Take Snapshot')
        .on('click', async () => {
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

    // Sort phase 2 components alphabetically by name
    const p2Components = state.currentData.phases.phase2.components.sort((a, b) => a.name.localeCompare(b.name));
    if (p2Components.length > 0) {
        // Add each component to the table data array, tagging with type and phase
        p2Components.forEach(c => tableData.push({ ...c, type: 'component', dataPhase: 'phase2' }));
    }

    // Create Table
    const table = d3.select(dom.programView).append('table').attr('class', 'min-w-full divide-y divide-gray-200');

    // Create Header
    const thead = table.append('thead').attr('class', 'bg-gray-50');
    thead.append('tr').selectAll('th')
        .data(['Lock', 'Component', 'Square Footage', 'Benchmark Low ($/sf)', 'Benchmark High ($/sf)', 'Starting ROM ($/sf)', 'Scenario ROM ($/sf)'])
        .enter().append('th')
        .attr('class', 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider')
        .text(d => d);

    // Create Body
    const tbody = table.append('tbody');
    const rows = tbody.selectAll('tr').data(tableData).enter().append('tr');

    rows.each(function(d) {
        const row = d3.select(this);
        if (d.type === 'header') {
            row.attr('class', 'bg-gray-100');
            row.append('td').attr('colspan', 7).attr('class', 'py-2 px-6 text-sm font-bold text-gray-700').text(d.name);
        } else {
            const isOutsideBenchmark = d.current_rom < d.benchmark_low || d.current_rom > d.benchmark_high;
            
            if (d.current_rom === 0 || d.square_footage === 0) {
                row.attr('class', 'zero-value-row');
            } else {
                row.attr('class', 'bg-white').classed('benchmark-warning', isOutsideBenchmark);
            }

            const lockKey = `${d.dataPhase}-${d.name}`;
            row.append('td').attr('class', 'py-4 px-2 text-center text-sm align-middle')
                .append('span').attr('class', 'lock-icon cursor-pointer')
                .style('opacity', state.lockedComponents.has(lockKey) ? 1 : 0.5)
                .text(state.lockedComponents.has(lockKey) ? '🔒' : '🔓')
                .on('click', (event, d_inner) => {
                    const key = `${d_inner.dataPhase}-${d_inner.name}`;
                    if (state.lockedComponents.has(key)) {
                        state.lockedComponents.delete(key);
                    } else {
                        state.lockedComponents.add(key);
                    }
                    render();
                });

            row.append('td').attr('class', 'py-4 px-6 text-sm font-medium text-gray-900 whitespace-nowrap').text(d.name);
            
            // Square Footage (editable)
            row.append('td').attr('class', 'py-4 px-6 text-sm text-gray-500 whitespace-nowrap editable-cell')
                .append('input').attr('type', 'text').attr('class', 'w-full text-center')
                .attr('value', d.square_footage.toLocaleString('en-US'))
                .attr('data-phase', d.dataPhase)
                .attr('data-name', d.name)
                .on('change', handleSquareFootageCellChange);

            row.append('td').attr('class', 'py-4 px-6 text-sm text-gray-500 whitespace-nowrap text-center').text(utils.formatCurrency(d.benchmark_low));
            row.append('td').attr('class', 'py-4 px-6 text-sm text-gray-500 whitespace-nowrap text-center').text(utils.formatCurrency(d.benchmark_high));
            
            // Snapshot
            const originalComponent = state.originalData.phases[d.dataPhase].components.find(c => c.name === d.name);
            const snapshotValue = originalComponent ? originalComponent.current_rom : 0;
            row.append('td').attr('class', 'py-4 px-6 text-sm text-gray-500 whitespace-nowrap text-center').text(utils.formatCurrency(snapshotValue));

            // Current (editable)
            row.append('td').attr('class', 'py-4 px-6 text-sm text-gray-500 whitespace-nowrap editable-cell')
                .append('input').attr('type', 'number').attr('class', 'w-full text-center')
                .attr('value', d.current_rom.toFixed(2))
                .attr('step', 0.01)
                .attr('data-phase', d.dataPhase)
                .attr('data-name', d.name)
                .on('change', handleCurrentRomCellChange);
        }
    });
} 