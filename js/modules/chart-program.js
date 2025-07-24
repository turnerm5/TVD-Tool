import { state } from './state.js';
import * as dom from './dom.js';
import * as utils from './utils.js';
import * as ui from './ui.js';

function updateCInteriorsSF() {
    const cInteriors = state.currentScheme.costOfWork.find(c => c.name === 'C Interiors');
    const originalPredesignScheme = state.originalData.schemes && state.originalData.schemes.find(s => s.name === 'Predesign');
    const originalCInteriors = originalPredesignScheme ? originalPredesignScheme.costOfWork.find(c => c.name === 'C Interiors') : null;

    if (cInteriors && originalCInteriors) {
        const totalFloors = state.currentScheme.floors || 0;
        const shelledFloorsCount = state.shelledFloors.filter(Boolean).length;
        const shelledPercentage = totalFloors > 0 ? (shelledFloorsCount / totalFloors) : 0;
        
        // Store previous value before changing for change tracking
        if (state.previousSquareFootage['C Interiors'] === undefined) {
            state.previousSquareFootage['C Interiors'] = cInteriors.square_footage;
        }
        
        cInteriors.square_footage = originalCInteriors.square_footage * (1 - shelledPercentage);
    }
}

function updatePhase2ProgramTable(container, render, handleSquareFootageCellChange) {
    container.html('');

    // --- SNAPSHOT BUTTON UI ---

    // Create a container for the snapshot button
    const controlsContainer = container.append('div')
        .attr('class', 'flex justify-between items-center mb-4');

    // --- CHECKBOXES UI ---
    const checkboxContainer = controlsContainer.append('div')
        .attr('class', 'flex items-center space-x-4');

    checkboxContainer.append('label')
        .attr('class', 'font-semibold text-gray-700')
        .text('Shell Floors:');

    const floors = state.currentScheme.floors || 0;

    for (let i = 0; i < floors; i++) {
        const checkboxWrapper = checkboxContainer.append('div')
            .attr('class', 'flex items-center');

        checkboxWrapper.append('input')
            .attr('type', 'checkbox')
            .attr('id', `shell-floor-${i + 1}`)
            .attr('class', 'h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500')
            .property('checked', state.shelledFloors[i])
            .on('change', function(event) {
                const floorIndex = i;
                const isChecked = event.target.checked;
                
                if (isChecked) {
                    // If checking this floor, also check all floors above it
                    for (let j = floorIndex; j < floors; j++) {
                        state.shelledFloors[j] = true;
                    }
                } else {
                    // If unchecking this floor, also uncheck all floors below it and itself
                    for (let j = 0; j <= floorIndex; j++) {
                        state.shelledFloors[j] = false;
                    }
                }
                
                updateCInteriorsSF();
                render();
            });

        checkboxWrapper.append('label')
            .attr('for', `shell-floor-${i + 1}`)
            .attr('class', 'ml-2 text-base text-gray-900')
            .text(`Floor ${i + 1}`);
    }

    // Create a container for the snapshot button
    const buttonContainer = controlsContainer.append('div');

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
                const phase2CostOfWork = state.currentScheme.costOfWork;
                const snapshotCostOfWork = phase2CostOfWork.map(c => ({
                    name: c.name,
                    target_value: c.target_value,
                    square_footage: c.square_footage
                }));
                // Create the snapshot object
                const snapshot = {
                    name: snapshotName,
                    grossSF: state.currentData.grossSF,
                    costOfWork: snapshotCostOfWork
                };
                // Add the snapshot to the state
                state.addSnapshot(snapshot);
                // Log all snapshots for debugging
                console.log('All snapshots:', state.snapshots);
                render();
            }
        });

    // --- PROGRAM TABLE ---

    const table = container.append('table')
        .attr('class', 'w-full text-base text-left text-gray-500 border border-gray-200 bg-white rounded-lg shadow-sm overflow-hidden');

    // Header
    const thead = table.append('thead');
    const headerRow = thead.append('tr')
        .attr('class', 'text-sm text-gray-700 uppercase bg-gray-50');

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

            const phaseCostOfWork = state.currentScheme.costOfWork;

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
        .attr('class', 'text-left program-table-input')
        .attr('value', d => utils.formatSquareFootageWithChange(d.square_footage, d.name))
        .attr('data-phase', 'phase2')
        .attr('data-name', d => d.name)
        .property('disabled', d => d.name === 'C Interiors')
        .on('focus', function(event, d) {
            // When focusing, show just the number for easy editing
            this.value = d.square_footage.toLocaleString('en-US');
        })
        .on('blur', function(event, d) {
            // When losing focus, show the formatted version with changes
            const cleanValue = this.value.replace(/[^0-9.,]/g, '').replace(/,/g, '');
            const newSF = parseFloat(cleanValue);
            if (!isNaN(newSF) && newSF >= 0) {
                this.value = utils.formatSquareFootageWithChange(newSF, d.name);
            } else {
                this.value = utils.formatSquareFootageWithChange(d.square_footage, d.name);
            }
        })
        .on('change', function(event, d) {
            // Clear the selected scheme when square footage is manually changed
            state.selectedSchemeName = null;
            handleSquareFootageCellChange(event);
        });

    // Target Value / SF (use current data instead of original)
    cowRows.append('td')
        .attr('class', 'px-6 py-4')
        .text(d => utils.formatCurrency(d.target_value));

    // Target Value (use current component data for calculation)
    cowRows.append('td')
        .attr('class', 'px-6 py-4')
        .html(d => {
            let valueText = utils.formatCurrencyBig(utils.calculateComponentValue(d));
            return valueText;
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
            .html(d => {
                const value = utils.calculateComponentValue(d);
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

export function renderPhase2ProgramView(render, handleSquareFootageCellChange) {
    // Clear the program view before rendering new content
    d3.select(dom.programView).html('');

    const mainContainer = d3.select(dom.programView);

    // --- SCHEME SELECTION UI (Horizontal Row) ---

    // Create a container for the scheme selection cards
    const schemesContainer = mainContainer.append('div')
        .attr('class', 'schemes-container mb-4 pb-4 bg-gray-50 rounded-lg');

    // Add a heading for the scheme selection section
    schemesContainer.append('h3')
        .attr('class', 'text-lg font-bold text-gray-800 mb-3')
        .text('Demonstration Schemes');

    // Create a horizontal grid layout for the scheme cards
    const schemeGrid = schemesContainer.append('div')
        .attr('class', 'grid grid-cols-5 gap-4')
        .style('height', '300px');

    // Get the list of available schemes from the current data
    const schemeData = state.currentData.schemes || [];

    // Render a card for each scheme
    const schemeCards = schemeGrid.selectAll('.scheme-card')
        .data(schemeData, d => d.name)
        .join('div')
        .attr('class', d => {
            const isSelected = state.selectedSchemeName === d.name;
            return `scheme-card relative rounded-lg overflow-hidden shadow-md cursor-pointer h-full ${isSelected ? 'ring-4 ring-red-500' : 'border border-gray-200'}`;
        })
        .on('click', (event, d) => {
            // When a scheme card is clicked:
            const updates = [];

            // Store current square footage values as previous before switching schemes
            state.updatePreviousSquareFootage();

            // Set the selected scheme name for visual feedback
            state.selectedSchemeName = d.name;

            // Set shelled floors based on scheme's shelledFloors property
            const shelledFloorsCount = d.shelledFloors || 0;
            const totalFloors = d.floors || 0;
            state.shelledFloors = new Array(totalFloors).fill(false);
            // Mark the top N floors as shelled (checked)
            for (let i = totalFloors - shelledFloorsCount; i < totalFloors; i++) {
                if (i >= 0 && i < totalFloors) {
                    state.shelledFloors[i] = true;
                }
            }

            // Animate Gross SF change
            const oldGrossSf = state.currentData.grossSF;
            const newGrossSf = d.grossSF;
            let grossSf_change = 'none';
            if (newGrossSf > oldGrossSf) grossSf_change = 'increase';
            else if (newGrossSf < oldGrossSf) grossSf_change = 'decrease';
            if (grossSf_change !== 'none') {
                updates.push({ name: 'Gross SF', sf_change: grossSf_change });
            }
            state.currentData.grossSF = newGrossSf;

            // Preserve current target values and square footages before switching
            const currentTargetValues = state.currentScheme.costOfWork.reduce((acc, c) => {
                acc[c.name] = {
                    target_value: c.target_value,
                    square_footage: c.square_footage
                };
                return acc;
            }, {});
            
            // Copy the new scheme
            state.currentScheme = JSON.parse(JSON.stringify(d));
            
            // Merge target values (preserve current values or use initial values)
            state.currentScheme.costOfWork.forEach(component => {
                const currentData = currentTargetValues[component.name];
                let targetValue = 0;
                
                if (currentData && currentData.target_value !== undefined) {
                    // Use current target value (may have been modified by user)
                    targetValue = Number(currentData.target_value) || 0;
                } else {
                    // Fall back to initialTargetValues
                    const targetValueData = state.originalData.initialTargetValues.find(tv => tv.name === component.name);
                    targetValue = targetValueData ? Number(targetValueData.target_value) || 0 : 0;
                }
                
                component.target_value = targetValue;
                
                // Also merge benchmark values
                const targetValueData = state.originalData.initialTargetValues.find(tv => tv.name === component.name);
                if (targetValueData) {
                    component.benchmark_low = Number(targetValueData.benchmark_low) || 0;
                    component.benchmark_high = Number(targetValueData.benchmark_high) || 0;
                } else {
                    component.benchmark_low = 0;
                    component.benchmark_high = 0;
                }
                
                // Track square footage changes for animation
                const oldSf = currentData ? currentData.square_footage : 0;
                const newSf = component.square_footage;
                let sf_change = 'none';
                if (newSf > oldSf) sf_change = 'increase';
                else if (newSf < oldSf) sf_change = 'decrease';
                if (sf_change !== 'none') {
                    updates.push({ name: component.name, sf_change });
                }
            });

            // After updating from scheme, recalculate C Interiors based on shelled state
            updateCInteriorsSF();

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
        .attr('class', 'font-semibold text-base text-gray-800 mb-1')
        .text(d => d.name);

    // Add description
    contentContainer.append('p')
        .attr('class', 'text-sm text-gray-600 mb-2 leading-tight')
        .text(d => d.description);

    // Add stats container
    const statsContainer = contentContainer.append('div')
        .attr('class', 'text-xs text-gray-700');

    // Add total SF
    statsContainer.append('div')
        .attr('class', 'mb-1')
                    .html(d => `<strong>Total SF:</strong> ${d.grossSF.toLocaleString()}`);

    

    // --- PROGRAM TABLE (Full Width) ---
    const tableContainer = mainContainer.append('div')
        .attr('class', 'program-table-container');

    updatePhase2ProgramTable(tableContainer, render, handleSquareFootageCellChange);
} 