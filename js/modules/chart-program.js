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

import { state } from './state.js';
import * as dom from './dom.js';
import * as utils from './utils.js';
import * as ui from './ui.js';

export function updateProgramSF() {
    if (!state.currentScheme || !state.currentScheme.name) return;

    const originalScheme = state.originalData.schemes.find(s => s.name === state.currentScheme.name);
    if (!originalScheme || !originalScheme.floorData || !originalScheme.costOfWork) return;

    let activeGrossSF = 0;
    let nonShelledActiveSF = 0;

    state.currentScheme.floorData.forEach(f => {
        if (state.activePhases.includes(f.phase)) {
            activeGrossSF += f.sf;
            if (!f.shelled) {
                nonShelledActiveSF += f.sf;
            }
        }
    });

    state.currentData.grossSF = activeGrossSF;

    state.currentScheme.costOfWork.forEach(currentComponent => {
        const originalComponent = originalScheme.costOfWork.find(c => c.name === currentComponent.name);
        if (!originalComponent) return;

        let newSF = 0;
        const componentName = currentComponent.name;

        if (componentName === 'C Interiors' || componentName === 'E Equipment and Furnishings') {
            newSF = nonShelledActiveSF;
        } else {
            if (Array.isArray(originalComponent.square_footage)) {
                state.activePhases.forEach(phase => {
                    const phaseIndex = phase - 1;
                    if (phaseIndex < originalComponent.square_footage.length) {
                        newSF += originalComponent.square_footage[phaseIndex];
                    }
                });
            } else {
                if (state.activePhases.includes(1)) { // Single phase schemes are phase 1
                    newSF = originalComponent.square_footage;
                }
            }
        }
        currentComponent.square_footage = Math.round(newSF);
    });
}

function updatePhase2ProgramTable(container, render, handleSquareFootageCellChange) {
    container.html('');

    const topControlsContainer = container.append('div')
        .attr('class', 'flex justify-between items-center mb-4');

    const togglesContainer = topControlsContainer.append('div')
        .attr('class', 'flex items-start space-x-6');

    if (state.currentScheme.phases > 1) {
        const phaseContainer = togglesContainer.append('div')
            .attr('class', 'flex items-center space-x-4');
        
        phaseContainer.append('label')
            .attr('class', 'font-semibold text-gray-700 mt-1')
            .text('Phases:');

        for (let i = 1; i <= state.currentScheme.phases; i++) {
            const checkboxWrapper = phaseContainer.append('div')
                .attr('class', 'flex items-center');

            checkboxWrapper.append('input')
                .attr('type', 'checkbox')
                .attr('id', `phase-${i}`)
                .attr('class', 'h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500')
                .property('checked', state.activePhases.includes(i))
                .on('change', function(event) {
                    const phaseNum = i;
                    const isChecked = event.target.checked;
                    if (isChecked) {
                        if (!state.activePhases.includes(phaseNum)) state.activePhases.push(phaseNum);
                    } else {
                        const phaseIndex = state.activePhases.indexOf(phaseNum);
                        if (phaseIndex > -1) state.activePhases.splice(phaseIndex, 1);
                    }
                    state.activePhases.sort();
                    updateProgramSF();
                    render();
                });
            
            checkboxWrapper.append('label')
                .attr('for', `phase-${i}`)
                .attr('class', 'ml-2 text-base text-gray-900')
                .text(`Phase ${i}`);
        }
    }

    const shellContainer = togglesContainer.append('div')
        .attr('class', 'flex flex-col space-y-2');

    state.activePhases.forEach(phase => {
        const phaseShellContainer = shellContainer.append('div')
            .attr('class', 'flex items-center space-x-4');
        
        phaseShellContainer.append('label')
            .attr('class', 'font-semibold text-gray-700')
            .text(`Shell Floors (Phase ${phase}):`);
        
        const floorsInPhase = state.currentScheme.floorData.filter(f => f.phase === phase);
        
        floorsInPhase.forEach(floor => {
            const checkboxWrapper = phaseShellContainer.append('div')
                .attr('class', 'flex items-center');

            checkboxWrapper.append('input')
                .attr('type', 'checkbox')
                .attr('id', `shell-floor-${floor.floor}-phase-${phase}`)
                .attr('class', 'h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500')
                .property('checked', floor.shelled)
                .on('change', function(event) {
                    floor.shelled = event.target.checked;
                    updateProgramSF();
                    render();
                });

            checkboxWrapper.append('label')
                .attr('for', `shell-floor-${floor.floor}-phase-${phase}`)
                .attr('class', 'ml-2 text-base text-gray-900')
                .text(`Floor ${floor.floor}`);
        });
    });

    const buttonContainer = topControlsContainer.append('div');
    buttonContainer.append('button')
        .attr('id', 'program-view-snapshot-btn')
        .attr('class', 'bg-blue-600 text-white py-2 px-4 rounded-md font-semibold hover:bg-blue-700 transition')
        .text('Take Snapshot')
        .on('click', async () => {
            if (state.snapshots.length >= 3) {
                ui.showAlert("Snapshot Limit Reached", "You can only save up to 3 snapshots.");
                return;
            }
            const snapshotName = await ui.showModalDialog("Take Snapshot", "Enter a name for this snapshot", "Create Snapshot", "Cancel");
            if (snapshotName) {
                const snapshotCostOfWork = state.currentScheme.costOfWork.map(c => ({
                    name: c.name,
                    target_value: c.target_value,
                    square_footage: c.square_footage
                }));
                const snapshot = {
                    name: snapshotName,
                    grossSF: state.currentData.grossSF,
                    costOfWork: snapshotCostOfWork,
                    floorData: JSON.parse(JSON.stringify(state.currentScheme.floorData)),
                    activePhases: [...state.activePhases]
                };
                state.addSnapshot(snapshot);
                render();
            }
        });

    const table = container.append('table')
        .attr('class', 'w-full text-base text-left text-gray-500 border border-gray-200 bg-white rounded-lg shadow-sm overflow-hidden');

    const thead = table.append('thead');
    const headerRow = thead.append('tr')
        .attr('class', 'text-sm text-gray-700 uppercase bg-gray-50');

    const headers = ['Component', 'Square Footage', 'Target Value / SF', 'Value'];
    headerRow.selectAll('th')
        .data(headers)
        .enter()
        .append('th')
        .attr('scope', 'col')
        .attr('class', 'px-6 py-3')
        .text(d => d);

    const tbody = table.append('tbody');
    const phaseCostOfWork = state.currentScheme.costOfWork;
    let cowTotalTargetValue = 0;
    phaseCostOfWork.forEach(d => {
        cowTotalTargetValue += utils.calculateComponentValue(d);
    });

    const cowSubheadRow = tbody.append('tr').attr('class', 'bg-blue-50 border-b');
    cowSubheadRow.append('td')
        .attr('class', 'px-6 py-3 font-bold text-blue-900 uppercase text-sm')
        .attr('colspan', 4)
        .text('Cost of Work');

    const cowRows = tbody.selectAll('tr.cow-row')
        .data(phaseCostOfWork)
        .enter()
        .append('tr')
        .attr('class', 'cow-row bg-white border-b hover:bg-gray-50');

    cowRows.append('td')
        .attr('class', 'px-6 py-4 font-medium text-gray-900 whitespace-nowrap')
        .text(d => d.name);

    const sfCells = cowRows.append('td').attr('class', 'px-6 py-4');
    sfCells.append('input')
        .attr('type', 'text')
        .attr('class', 'text-left program-table-input')
        .attr('value', d => utils.formatSquareFootageWithChange(d.square_footage, d.name))
        .attr('data-phase', 'phase2')
        .attr('data-name', d => d.name)
        .property('disabled', true);

    cowRows.append('td')
        .attr('class', 'px-6 py-4')
        .text(d => utils.formatCurrency(d.target_value));

    cowRows.append('td')
        .attr('class', 'px-6 py-4')
        .html(d => utils.formatCurrencyBig(utils.calculateComponentValue(d)));

    const cowSubtotalRow = tbody.append('tr').attr('class', 'bg-blue-100 border-t border-blue-300 font-semibold');
    cowSubtotalRow.append('td').attr('class', 'px-6 py-3 font-bold text-blue-900').text('Cost of Work Subtotal');
    cowSubtotalRow.append('td').attr('class', 'px-6 py-3 font-bold text-blue-900').text('-');
    cowSubtotalRow.append('td').attr('class', 'px-6 py-3 font-bold text-blue-900').text('-');
    cowSubtotalRow.append('td').attr('class', 'px-6 py-3 font-bold text-blue-900').text(utils.formatCurrencyBig(cowTotalTargetValue));

    const totalCow = utils.calculateTotalCostOfWork(phaseCostOfWork);
    let indirectsTotal = 0;
    const indirectsSubheadRow = tbody.append('tr').attr('class', 'bg-orange-50 border-b');
    indirectsSubheadRow.append('td')
        .attr('class', 'px-6 py-3 font-bold text-orange-900 uppercase text-sm')
        .attr('colspan', 4)
        .text('Indirects');

    if (state.indirectCostPercentages && state.indirectCostPercentages.length > 0) {
        const indirectRows = tbody.selectAll('tr.indirect-row')
            .data(state.indirectCostPercentages)
            .enter()
            .append('tr')
            .attr('class', 'indirect-row bg-white border-b hover:bg-gray-50');
        indirectRows.append('td').attr('class', 'px-6 py-4 font-medium text-gray-900 whitespace-nowrap').text(d => d.name);
        indirectRows.append('td').attr('class', 'px-6 py-4 text-gray-400').text('-');
        indirectRows.append('td').attr('class', 'px-6 py-4 text-gray-400').text('-');
        indirectRows.append('td').attr('class', 'px-6 py-4').html(d => {
            const value = utils.calculateComponentValue(d);
            indirectsTotal += value;
            return utils.formatCurrencyBig(value);
        });
    }

    const grandTotalRow = tbody.append('tr').attr('class', 'bg-gray-200 border-t-2 border-gray-400 font-bold');
    grandTotalRow.append('td').attr('class', 'px-6 py-4 font-bold text-gray-900 uppercase').text('Grand Total');
    grandTotalRow.append('td').attr('class', 'px-6 py-4').text('-');
    grandTotalRow.append('td').attr('class', 'px-6 py-4').text('-');
    grandTotalRow.append('td').attr('class', 'px-6 py-4 font-bold text-gray-900').text(utils.formatCurrencyBig(totalCow + indirectsTotal));
}

export function renderPhase2ProgramView(render, handleSquareFootageCellChange) {
    d3.select(dom.programView).html('');
    const mainContainer = d3.select(dom.programView);

    const schemesContainer = mainContainer.append('div')
        .attr('class', 'schemes-container mb-4 pb-4 bg-gray-50 rounded-lg');
    schemesContainer.append('h3')
        .attr('class', 'text-lg font-bold text-gray-800 mb-3')
        .text('Demonstration Schemes');
    const schemeGrid = schemesContainer.append('div')
        .attr('class', 'grid grid-cols-6 gap-4')
        .style('height', '350px');
    const schemeData = state.currentData.schemes || [];

    const schemeCards = schemeGrid.selectAll('.scheme-card')
        .data(schemeData, d => d.name)
        .join('div')
        .attr('class', d => `scheme-card bg-white relative rounded-lg overflow-hidden shadow-md cursor-pointer h-full ${state.selectedSchemeName === d.name ? 'ring-4 ring-red-500' : 'border border-gray-200'}`)
        .on('click', (event, d) => {
            state.updatePreviousSquareFootage();
            state.selectedSchemeName = d.name;
            state.activePhases = [1];
            state.currentScheme = JSON.parse(JSON.stringify(d));
            
            // Re-merge initialTargetValues to ensure they are present
            state.currentScheme.costOfWork.forEach(component => {
                const targetValueData = state.originalData.initialTargetValues.find(tv => tv.name === component.name);
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
            
            updateProgramSF();
            render();
        });

    schemeCards.append('img')
        .attr('src', d => d.image)
        .attr('alt', d => d.name)
        .attr('class', 'w-full object-cover')
        .style('height', '40%');
    const contentContainer = schemeCards.append('div')
        .attr('class', 'p-2 bg-white h-2/5 flex flex-col justify-between');
    contentContainer.append('h4')
        .attr('class', 'font-semibold text-base text-gray-800 mb-1')
        .text(d => d.name);
    contentContainer.append('p')
        .attr('class', 'text-sm text-gray-600 mb-2 leading-tight')
        .html(d => d.description);
    const statsContainer = contentContainer.append('div')
        .attr('class', 'text-sm text-gray-700');
    statsContainer.append('div')
        .attr('class', 'mb-1')
        .html(d => `<strong>Floors:</strong> ${d.floors}<br><strong>Total SF:</strong> ${d.grossSF.toLocaleString()}`);

    const tableContainer = mainContainer.append('div')
        .attr('class', 'program-table-container');
    updatePhase2ProgramTable(tableContainer, render, handleSquareFootageCellChange);
}
