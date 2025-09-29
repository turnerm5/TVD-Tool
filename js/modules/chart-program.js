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
    if (!state.currentScheme || !Array.isArray(state.currentScheme.costOfWork)) return;

    const grossSF = Number(state.currentData?.grossSF) || 0;
    const floors = Math.min(Math.max(Number(state.numFloors) || 1, 1), 5); // clamp 1-5
    const shelled = Math.min(Math.max(Number(state.shelledFloorsCount) || 0, 0), floors);

    const perFloorSF = floors > 0 ? grossSF / floors : 0;
    const finishedFloors = floors - shelled;
    const finishedSF = Math.max(0, finishedFloors) * perFloorSF;

    // Geometry assumptions: ideal rectangle 1.6:1, perimeter drives enclosure; roofing equals footprint area.
    // Foundation and superstructure scale with grossSF; interiors and equipment scale with finishedSF.
    // Sitework keep proportional to grossSF.

    state.currentScheme.costOfWork.forEach(component => {
        const name = component.name;
        let sf = 0;
        if (name === 'C Interiors' || name === 'E Equipment and Furnishings') {
            sf = finishedSF;
        } else if (name === 'B30 Roofing') {
            // Roofing equals building footprint (one roof) which is perFloorSF
            sf = perFloorSF;
        } else if (name === 'B20 Enclosure') {
            // Approximate enclosure area as perimeter * floor height * floors.
            // For a rectangle with ratio 1.6:1 and area A, sides: a = sqrt(A/1.6), b = 1.6a -> perimeter P = 2(a+b)
            // Use floor-to-floor height 15 ft.
            const A = perFloorSF; // footprint
            const a = Math.sqrt(A / 1.6);
            const b = 1.6 * a;
            const perimeter = 2 * (a + b);
            const floorToFloor = 15;
            sf = perimeter * floorToFloor * floors;
        } else if (name === 'A Substructure') {
            // Foundation equals footprint area per requirements for single floor; for multi-floor, keep footprint
            sf = perFloorSF;
        } else if (name === 'B10 Superstructure') {
            // Superstructure scales with total grossSF
            sf = grossSF;
        } else if (name === 'D Services' || name === 'F Special Construction') {
            // Services and special construction should not change with shelling; use grossSF
            sf = grossSF;
        } else if (name === 'G Building Sitework') {
            // Sitework = 80,000 sf minus floor plate (footprint)
            sf = Math.max(0, 80000 - perFloorSF);
        } else {
            // Default to grossSF if unknown
            sf = grossSF;
        }
        component.square_footage = Math.round(sf);
    });
}

/**
 * Renders the total estimated cost display for the Program View.
 */
// Removed program-specific estimate rendering; use ui.renderGlobalEstimate

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
        .attr('value', d => `${utils.formatNumber(Math.round(Number(d.square_footage) || 0))} sf`)
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
                const numericValue = Math.round(Number(component.square_footage) || 0);
                this.value = `${utils.formatNumber(numericValue)} sf`;
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
        .text('Floors');
    
    // Add estimate display and button container
    const rightContainer = headerContainer.append('div')
        .attr('class', 'flex items-center gap-4');
    
    // Removed inline program estimate element; using global header estimate instead
        
    const schemeGrid = schemesContainer.append('div')
        .attr('class', 'grid grid-cols-6 gap-4')
        .style('height', '180px');

    // Five floor cards (1-5)
    const floorCardsData = [1, 2, 3, 4, 5];
    const floorCards = schemeGrid.selectAll('.floor-card')
        .data(floorCardsData)
        .join('div')
        .attr('class', 'floor-card rounded-lg shadow-md border border-gray-200 h-full flex flex-col cursor-pointer')
        .style('background-color', d => {
            const total = state.numFloors || 1;
            const shelled = Math.min(state.shelledFloorsCount || 0, total);
            const finished = Math.max(0, total - shelled);
            return d <= finished ? '#22c55e' : (d <= total ? '#f59e0b' : '#ef4444');
        })
        .on('click', (event, d) => {
            state.numFloors = d;
            state.shelledFloorsCount = Math.min(state.shelledFloorsCount || 0, state.numFloors);
            updateProgramSF();
            render();
            ui.renderGlobalEstimate();
        });

    floorCards.append('div')
        .attr('class', 'p-2 text-center font-semibold text-white')
        .text(d => `Floor ${d}`);

    // Sixth card for shelled floors count
    const shellCard = schemeGrid.append('div')
        .attr('class', 'bg-white rounded-lg overflow-hidden shadow-md border border-gray-200 h-full flex flex-col');

    shellCard.append('div')
        .attr('class', 'bg-gray-100 p-2 text-center font-semibold text-gray-800 border-b border-gray-200')
        .text('Shelled Floors');

    const shellControls = shellCard.append('div')
        .attr('class', 'flex-1 flex items-center justify-center gap-2');

    shellControls.append('button')
        .attr('class', 'px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 transition')
        .text('-')
        .on('click', () => {
            state.shelledFloorsCount = Math.max(0, (state.shelledFloorsCount || 0) - 1);
            updateProgramSF();
            render();
            ui.renderGlobalEstimate();
        });

    shellControls.append('div')
        .attr('class', 'text-lg font-semibold text-gray-800 w-8 text-center')
        .text(() => `${state.shelledFloorsCount || 0}`);

    shellControls.append('button')
        .attr('class', 'px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 transition')
        .text('+')
        .on('click', () => {
            state.shelledFloorsCount = Math.min(state.numFloors || 1, (state.shelledFloorsCount || 0) + 1);
            updateProgramSF();
            render();
            ui.renderGlobalEstimate();
        });

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
        .attr('value', `${utils.formatNumber(state.currentData?.grossSF || 0)} sf`)
        .on('focus', function() {
            const numericValue = Number(state.currentData?.grossSF) || 0;
            this.value = numericValue.toString();
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
                // Whether scaling or keeping as-is, recompute based on the new inputs
                updateProgramSF();
                render();
                renderProgramEstimate();
                return;
            }
            // Set display with unit when not re-rendering above
            this.value = `${utils.formatNumber(newGross)} sf`;
            // Always recompute in case oldGross was 0 previously
            updateProgramSF();
            render();
            renderProgramEstimate();
        })
        .on('blur', function() {
            const numeric = Number(String(this.value).replace(/,/g, '')) || 0;
            state.currentData.grossSF = numeric;
            this.value = `${utils.formatNumber(numeric)} sf`;
            updateProgramSF();
            render();
            renderProgramEstimate();
        });

    const tableContainer = mainContainer.append('div')
        .attr('class', 'program-table-container');
    updatePhase2ProgramTable(tableContainer, render, handleSquareFootageCellChange);
    
    // Update global estimate after initial render
    ui.renderGlobalEstimate();
}
