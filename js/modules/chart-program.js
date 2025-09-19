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

/**
 * Renders the total estimated cost display for the Program View.
 */
function renderProgramEstimate() {
    const programEstimateDisplay = document.getElementById('program-estimate-display');
    if (!programEstimateDisplay) return;

    const { costOfWork } = state.currentScheme;
    const { indirectCostPercentages } = state;
    
    const cowTotal = utils.calculateTotalCostOfWork(costOfWork);
    const indirectTotal = d3.sum(indirectCostPercentages, p => p.percentage * cowTotal);
    const totalProjectCost = cowTotal + indirectTotal;

    const gmp = state.originalData.phase2.totalProjectBudget;
    const variance = totalProjectCost - gmp;

    programEstimateDisplay.innerHTML = `
        <div class="text-sm font-semibold">
            <span class="text-gray-600">Total Estimate: </span>
            <span class="text-gray-900">${utils.formatCurrencyBig(totalProjectCost)}</span>
        </div>
        <div class="text-xs font-medium ${variance > 0 ? 'text-red-600' : 'text-green-600'}">
            <span>Budget &Delta;: </span>
            <span>${variance >= 0 ? '+' : ''}${utils.formatCurrencyBig(variance)}</span>
        </div>
    `;
}

function updatePhase2ProgramTable(container, render, handleSquareFootageCellChange) {
    container.html('');

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
        .attr('inputmode', 'numeric')
        .attr('pattern', '[0-9,]*')
        .attr('class', 'text-left program-table-input editable-input')
        .attr('value', d => utils.formatSquareFootageWithChange(d.square_footage, d.name))
        .attr('data-phase', 'phase2')
        .attr('data-name', d => d.name)
        .on('focus', function(event, d) {
            const numericValue = Number(d.square_footage) || 0;
            this.value = numericValue.toLocaleString('en-US');
            this.select();
        })
        .on('change', handleSquareFootageCellChange)
        .on('blur', function(event, d) {
            const component = state.currentScheme.costOfWork.find(c => c.name === d.name);
            if (component) {
                this.value = utils.formatSquareFootageWithChange(component.square_footage, component.name);
            }
        });

    cowRows.append('td')
        .attr('class', 'px-6 py-4')
        .text(d => utils.formatCurrency(d.target_value));

    cowRows.append('td')
        .attr('class', 'px-6 py-4')
        .html(d => utils.formatCurrencyBig(utils.calculateComponentValue(d)));

    const grossSFForCalcs = Number(state.currentData?.grossSF) || 0;
    const cowPerSFDisplay = grossSFForCalcs > 0 ? utils.formatCurrency(cowTotalTargetValue / grossSFForCalcs) : '-';
    const cowSubtotalRow = tbody.append('tr').attr('class', 'bg-blue-100 border-t border-blue-300 font-semibold');
    cowSubtotalRow.append('td').attr('class', 'px-6 py-3 font-bold text-blue-900').text('Cost of Work Subtotal');
    cowSubtotalRow.append('td').attr('class', 'px-6 py-3 font-bold text-blue-900').text('-');
    cowSubtotalRow.append('td').attr('class', 'px-6 py-3 font-bold text-blue-900').text(cowPerSFDisplay);
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

    const grandTotal = totalCow + indirectsTotal;
    const grandPerSFDisplay = grossSFForCalcs > 0 ? utils.formatCurrency(grandTotal / grossSFForCalcs) : '-';
    const grandTotalRow = tbody.append('tr').attr('class', 'bg-gray-200 border-t-2 border-gray-400 font-bold');
    grandTotalRow.append('td').attr('class', 'px-6 py-4 font-bold text-gray-900 uppercase').text('Grand Total');
    grandTotalRow.append('td').attr('class', 'px-6 py-4').text('-');
    grandTotalRow.append('td').attr('class', 'px-6 py-4').text(grandPerSFDisplay);
    grandTotalRow.append('td').attr('class', 'px-6 py-4 font-bold text-gray-900').text(utils.formatCurrencyBig(grandTotal));
}

export function renderPhase2ProgramView(render, handleSquareFootageCellChange) {
    d3.select(dom.programView).html('');
    const mainContainer = d3.select(dom.programView);

    const schemesContainer = mainContainer.append('div')
        .attr('class', 'schemes-container mb-4 pb-4 bg-gray-50 rounded-lg');
    
    // Create header with title, estimate display, and button
    const headerContainer = schemesContainer.append('div')
        .attr('class', 'flex justify-between items-center mb-3');
    
    headerContainer.append('h3')
        .attr('class', 'text-lg font-bold text-gray-800')
        .text('Potential Opportunities');
    
    // Add estimate display and button container
    const rightContainer = headerContainer.append('div')
        .attr('class', 'flex items-center gap-4');
    
    rightContainer.append('div')
        .attr('id', 'program-estimate-display')
        .attr('class', 'text-center');
    
    rightContainer.append('button')
        .attr('id', 'program-take-snapshot-btn')
        .attr('class', 'bg-blue-600 text-white py-1 px-3 text-sm rounded-md font-medium hover:bg-blue-700 transition')
        .text('Take Snapshot');
        
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
            // Ensure Overall Square Footage field loads the scheme's GSF on selection
            state.currentData.grossSF = d.grossSF || 0;
            render();
            renderProgramEstimate();
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

    // Add Shell Control Card (Column 5)
    const shellCard = schemeGrid.append('div')
        .attr('class', 'bg-white rounded-lg overflow-hidden shadow-md border border-gray-200 h-full flex flex-col');
    
    // Header with title
    const shellHeader = shellCard.append('div')
        .attr('class', 'bg-gray-100 p-2 flex items-center justify-center border-b border-gray-200')
        .style('height', '50px');
    
    shellHeader.append('h4')
        .attr('class', 'font-semibold text-sm text-gray-800 text-center')
        .text('Shell a Floor?');
    
    // Building visualization container
    const buildingContainer = shellCard.append('div')
        .attr('class', 'flex-grow flex')
        .style('height', '300px');

    if (state.currentScheme.phases > 1) {
        // Multi-phase layout: side-by-side columns
        state.activePhases.forEach((phase, phaseIndex) => {
            // Use custom phase name if available, otherwise default to "Phase X"
            const phaseName = state.currentScheme.phaseNames && state.currentScheme.phaseNames[phase-1] 
                ? state.currentScheme.phaseNames[phase-1] 
                : `Phase ${phase}`;
            
            const phaseColumn = buildingContainer.append('div')
                .attr('class', 'flex-1 flex flex-col border-r border-gray-300')
                .style('border-right', phaseIndex === state.activePhases.length - 1 ? 'none' : '1px solid #d1d5db');
            
            // Phase header
            phaseColumn.append('div')
                .attr('class', 'bg-gray-50 border-b border-gray-300 p-1 text-center')
                .style('height', '30px')
                .append('div')
                .attr('class', 'text-xs font-semibold text-gray-700')
                .text(phaseName);
            
            // Get floors for this phase and sort them (top floor first)
            const floorsInPhase = state.currentScheme.floorData
                .filter(f => f.phase === phase)
                .sort((a, b) => b.floor - a.floor);
            
            // Calculate height for each floor rectangle (subtract header height)
            const availableHeight = 270; // 300px - 30px header
            const floorHeight = floorsInPhase.length > 0 ? availableHeight / floorsInPhase.length : availableHeight;
            
            // Create floor rectangles for this phase
            floorsInPhase.forEach((floor, floorIndex) => {
                const floorRect = phaseColumn.append('div')
                    .attr('class', 'border-b border-gray-300 flex items-center justify-center cursor-pointer transition-colors duration-200 hover:opacity-80')
                    .style('height', `${floorHeight}px`)
                    .style('background-color', floor.shelled ? '#ef4444' : '#22c55e') // Red for shelled, green for non-shelled
                    .style('border-bottom', floorIndex === floorsInPhase.length - 1 ? 'none' : '1px solid #d1d5db')
                    .on('click', function() {
                        floor.shelled = !floor.shelled;
                        updateProgramSF();
                        render();
                        renderProgramEstimate();
                    });
                
                floorRect.append('div')
                    .attr('class', 'text-white font-semibold text-xs text-center drop-shadow-sm')
                    .text(`Floor ${floor.floor}`);
            });
        });
    } else {
        // Single phase layout: single column (original behavior)
        const singleColumn = buildingContainer.append('div')
            .attr('class', 'flex-1 flex flex-col');
        
        // Get all floors and sort them (top floor first)
        const allFloors = state.currentScheme.floorData
            .filter(f => state.activePhases.includes(f.phase))
            .sort((a, b) => b.floor - a.floor);
        
        // Calculate height for each floor rectangle
        const floorHeight = allFloors.length > 0 ? 300 / allFloors.length : 300;
        
        // Create floor rectangles
        allFloors.forEach((floor, floorIndex) => {
            const floorRect = singleColumn.append('div')
                .attr('class', 'border-b border-gray-300 flex items-center justify-center cursor-pointer transition-colors duration-200 hover:opacity-80')
                .style('height', `${floorHeight}px`)
                .style('background-color', floor.shelled ? '#ef4444' : '#22c55e') // Red for shelled, green for non-shelled
                .style('border-bottom', floorIndex === allFloors.length - 1 ? 'none' : '1px solid #d1d5db')
                .on('click', function() {
                    floor.shelled = !floor.shelled;
                    updateProgramSF();
                    render();
                    renderProgramEstimate();
                });
            
            floorRect.append('div')
                .attr('class', 'text-white font-semibold text-xs text-center drop-shadow-sm')
                .text(`Floor ${floor.floor}`);
        });
    }

    // Add Phase Control Card (Column 6) - only if multi-phase
    if (state.currentScheme.phases > 1) {
        const phaseCard = schemeGrid.append('div')
            .attr('class', 'bg-white rounded-lg overflow-hidden shadow-md border border-gray-200 h-full flex flex-col');
        
        phaseCard.append('div')
            .attr('class', 'bg-blue-100 h-[40%] flex items-center justify-center')
            .append('div')
            .attr('class', 'text-blue-700 font-bold text-xl')
            .text('📋');
        
        const phaseContent = phaseCard.append('div')
            .attr('class', 'p-3 flex flex-col justify-between h-[60%]');
        
        phaseContent.append('h4')
            .attr('class', 'font-semibold text-base text-gray-800 mb-2')
            .text('Active Phases');
        
        const phasesContainer = phaseContent.append('div')
            .attr('class', 'flex flex-col space-y-2 flex-grow');

        for (let i = 1; i <= state.currentScheme.phases; i++) {
            const checkboxWrapper = phasesContainer.append('div')
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
                    renderProgramEstimate();
                });
            
            // Use custom phase name if available, otherwise default to "Phase X"
            const phaseName = state.currentScheme.phaseNames && state.currentScheme.phaseNames[i-1] 
                ? state.currentScheme.phaseNames[i-1] 
                : `Phase ${i}`;
            
            checkboxWrapper.append('label')
                .attr('for', `phase-${i}`)
                .attr('class', 'ml-2 text-sm text-gray-900')
                .text(phaseName);
        }
    }

    // Overall Square Footage input above the main table
    const overallSFContainer = mainContainer.append('div')
        .attr('class', 'mb-3 flex items-center gap-3');

    const overallSFInputGroup = overallSFContainer.append('div')
        .attr('class', 'flex flex-col');

    overallSFInputGroup.append('label')
        .attr('for', 'overall-sf-input')
        .attr('class', 'text-xs font-semibold text-gray-700 mb-1')
        .text('Overall Square Footage');

    overallSFInputGroup.append('input')
        .attr('id', 'overall-sf-input')
        .attr('type', 'text')
        .attr('inputmode', 'numeric')
        .attr('pattern', '[0-9,]*')
        .attr('class', 'w-40 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 editable-input')
        .attr('value', utils.formatNumber(state.currentData?.grossSF || 0))
        .on('focus', function() {
            const numericValue = Number(state.currentData?.grossSF) || 0;
            this.value = numericValue.toLocaleString('en-US');
            this.select();
        })
        .on('change', async function() {
            const newGross = Number(String(this.value).replace(/,/g, '')) || 0;
            const oldGross = Number(state.currentData?.grossSF) || 0;
            state.currentData.grossSF = newGross;

            if (oldGross > 0 && newGross >= 0 && newGross !== oldGross) {
                const scaleRatio = newGross / oldGross;
                const confirmed = await ui.showConfirmDialog(
                    'Scale Square Footages',
                    `Would you like to scale all component square footages by ${(scaleRatio * 100).toFixed(1)}% to match the new Overall SF? Note: Keeping the square footage values as-is can result in misalignment with the overall $/SF calculations.`,
                    'Scale',
                    'Keep As-Is'
                );
                if (confirmed) {
                    state.currentScheme.costOfWork.forEach(component => {
                        const currentSF = Number(component.square_footage) || 0;
                        component.square_footage = Math.round(currentSF * scaleRatio);
                    });
                    // Re-render to reflect scaled values
                    render();
                    renderProgramEstimate();
                    return;
                }
            }
        })
        .on('blur', function() {
            const numeric = Number(String(this.value).replace(/,/g, '')) || 0;
            state.currentData.grossSF = numeric;
            this.value = utils.formatNumber(numeric);
        });

    const tableContainer = mainContainer.append('div')
        .attr('class', 'program-table-container');
    updatePhase2ProgramTable(tableContainer, render, handleSquareFootageCellChange);
    
    // Initial render of the estimate display
    renderProgramEstimate();
}
