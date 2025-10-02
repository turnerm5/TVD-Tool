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

import { state } from './state.js?v=2.0.1';
import * as dom from './dom.js?v=2.0.1';
import * as utils from './utils.js?v=2.0.1';
import * as ui from './ui.js?v=2.0.1';

// Estimates total cost for a given grossSF using current target values,
// number of floors, and shelled floors. Mirrors updateProgramSF geometry.
function estimateTotalFor(grossSF, floors, shelledFloors) {
    const perFloorSF = floors > 0 ? grossSF / floors : 0;
    const finishedFloors = Math.max(0, floors - Math.min(Math.max(shelledFloors || 0, 0), floors));
    const finishedSF = finishedFloors * perFloorSF;

    let cowDirect = 0;
    const floorToFloor = 16;
    state.currentScheme.costOfWork.forEach(component => {
        const name = component.name;
        let sf = 0;
        if (name === 'C Interiors' || name === 'E Equipment and Furnishings') {
            sf = finishedSF;
        } else if (name === 'B30 Roofing') {
            sf = perFloorSF;
        } else if (name === 'B20 Enclosure') {
            const A = perFloorSF;
            const a = Math.sqrt(A / 1.6);
            const b = 1.6 * a;
            const perimeter = 2 * (a + b);
            let enclosureArea = perimeter * floorToFloor * floors;
            // Add penthouse enclosure if dimensions provided
            const ph = state.penthouse || { width: 0, length: 0, height: 0 };
            const phW = Number(ph.width) || 0;
            const phL = Number(ph.length) || 0;
            const phH = Number(ph.height) || 0;
            if (phW > 0 && phL > 0 && phH > 0) {
                const phPerimeter = 2 * (phW + phL);
                enclosureArea += phPerimeter * phH;
            }
            sf = enclosureArea;
        } else if (name === 'A Substructure') {
            sf = perFloorSF;
        } else if (name === 'B10 Superstructure') {
            sf = grossSF;
        } else if (name === 'D Services' || name === 'F Special Construction') {
            sf = grossSF;
        } else if (name === 'G Building Sitework') {
            sf = Math.max(0, 80000 - perFloorSF);
        } else {
            sf = grossSF;
        }
        const value = (Number(component.target_value) || 0) * Math.max(0, Number(sf) || 0);
        cowDirect += value;
    });

    const fixedCow = d3.sum((state.costOfWorkFixedAdditions || []), i => Number(i.amount) || 0);
    const cowTotal = cowDirect + fixedCow;
    const indirectPercent = d3.sum((state.indirectCostPercentages || []), p => (Number(p.percentage) || 0) * cowTotal);
    const indirectFixed = d3.sum((state.indirectCostFixed || []), i => Number(i.amount) || 0);
    const total = cowTotal + indirectPercent + indirectFixed;
    return { total, cowTotal };
}

async function maximizeGrossSFToBudget(render) {
    const targetBudget = Number(state.originalData?.phase2?.totalProjectBudget) || 0;
    const floors = Math.min(Math.max(Number(state.numFloors) || 1, 1), 5);
    const shelled = Math.min(Math.max(Number(state.shelledFloorsCount) || 0, 0), floors);
    let currentGross = Number(state.currentData?.grossSF) || 0;
    if (targetBudget <= 0 || floors <= 0) {
        await ui.showAlert('Cannot Maximize', 'Missing or invalid GMP or floor configuration.');
        return;
    }

    const f = (gsf) => estimateTotalFor(gsf, floors, shelled).total;
    let low = 0;
    let high = Math.max(currentGross, 1);
    let current = f(currentGross);

    // If current is under budget, grow high until at/above target
    if (current < targetBudget) {
        low = currentGross;
        while (f(high) < targetBudget && high < currentGross * 100) {
            high *= 2;
        }
    } else { // current over budget, shrink low until below target
        high = currentGross;
        low = 0;
        // Optional: find a positive low that is below budget for better precision
        let probe = high / 2;
        while (probe > 1 && f(probe) > targetBudget) {
            high = probe;
            probe /= 2;
        }
        low = Math.max(0, probe);
    }

    const epsilon = 1; // dollars tolerance
    for (let i = 0; i < 40; i++) {
        const mid = (low + high) / 2;
        const val = f(mid);
        if (Math.abs(val - targetBudget) <= epsilon) {
            currentGross = mid;
            break;
        }
        if (val < targetBudget) {
            low = mid;
        } else {
            high = mid;
        }
        currentGross = mid;
    }

    state.currentData.grossSF = Math.max(0, Math.round(currentGross));
    updateProgramSF();
    render();
    ui.renderGlobalEstimate();
}

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
            const A = perFloorSF; // footprint
            const a = Math.sqrt(A / 1.6);
            const b = 1.6 * a;
            const perimeter = 2 * (a + b);
            const floorToFloor = 16;
            let enclosureArea = perimeter * floorToFloor * floors;
            // Add penthouse enclosure if dimensions provided
            const ph = state.penthouse || { width: 0, length: 0, height: 0 };
            const phW = Number(ph.width) || 0;
            const phL = Number(ph.length) || 0;
            const phH = Number(ph.height) || 0;
            if (phW > 0 && phL > 0 && phH > 0) {
                const phPerimeter = 2 * (phW + phL);
                enclosureArea += phPerimeter * phH;
            }
            sf = enclosureArea;
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
        .text(d => utils.formatCurrency(d.target_value, 0));

    cowRows.append('td')
        .attr('class', 'px-6 py-4')
        .html(d => utils.formatCurrency(utils.calculateComponentValue(d), 0));

    // Render fixed COW additions below the other components but above the subtotal
    const fixedCowAdditions = state.costOfWorkFixedAdditions || [];
    let fixedCowAmountTotal = 0;
    if (fixedCowAdditions.length > 0) {
        const fixedCowHeader = tbody.append('tr').attr('class', 'bg-blue-50 border-b');
        fixedCowHeader.append('td')
            .attr('class', 'px-6 py-3 font-bold text-blue-900 uppercase text-sm')
            .attr('colspan', 4)
            .text('Cost of Work – Fixed Additions');

        const fixedCowRows = tbody.selectAll('tr.fixed-cow-row')
            .data(fixedCowAdditions)
            .enter()
            .append('tr')
            .attr('class', 'fixed-cow-row bg-white border-b hover:bg-gray-50');
        fixedCowRows.append('td').attr('class', 'px-6 py-4 font-medium text-gray-900 whitespace-nowrap').text(d => d.name);
        fixedCowRows.append('td').attr('class', 'px-6 py-4 text-gray-400').text('-');
        fixedCowRows.append('td').attr('class', 'px-6 py-4 text-gray-400').text('-');
        // Value column with editable input for amount
        fixedCowRows.append('td')
            .attr('class', 'px-6 py-4')
            .each(function(d) {
                const input = d3.select(this)
                    .append('input')
                    .attr('type', 'text')
                    .attr('inputmode', 'numeric')
                    .attr('pattern', '[0-9,]*')
                    .attr('class', 'text-right program-table-input editable-input')
                    .attr('value', utils.formatCurrency(Number(d.amount) || 0, 0))
                    .on('focus', function() {
                        const numeric = Number(d.amount) || 0;
                        this.value = numeric.toLocaleString('en-US');
                        this.select();
                    })
                    .on('change', function() {
                        const parsed = utils.parseNumberFromInput(String(this.value));
                        d.amount = Math.max(0, parsed);
                        render();
                        ui.renderGlobalEstimate();
                    })
                    .on('blur', function() {
                        const numeric = Number(d.amount) || 0;
                        this.value = utils.formatCurrency(numeric, 0);
                    });
            });
        fixedCowAmountTotal = d3.sum(fixedCowAdditions, i => Number(i.amount) || 0);
    }

    const grossSFForCalcs = Number(state.currentData?.grossSF) || 0;
    const cowSubtotalTotal = cowTotalTargetValue + fixedCowAmountTotal;
    const cowPerSFDisplay = grossSFForCalcs > 0 ? utils.formatCurrency(cowSubtotalTotal / grossSFForCalcs, 2) : '-';
    const cowSubtotalRow = tbody.append('tr').attr('class', 'bg-blue-100 border-t border-blue-300 font-semibold');
    cowSubtotalRow.append('td').attr('class', 'px-6 py-3 font-bold text-blue-900').text('Cost of Work Subtotal');
    cowSubtotalRow.append('td').attr('class', 'px-6 py-3 font-bold text-blue-900').text('-');
    cowSubtotalRow.append('td').attr('class', 'px-6 py-3 font-bold text-blue-900').text(cowPerSFDisplay);
    cowSubtotalRow.append('td').attr('class', 'px-6 py-3 font-bold text-blue-900').text(utils.formatCurrency(cowSubtotalTotal, 0));

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
            return utils.formatCurrency(value, 0);
        });
    }

    // Render fixed-dollar indirects
    if (state.indirectCostFixed && state.indirectCostFixed.length > 0) {
        const fixedIndirectRows = tbody.selectAll('tr.indirect-fixed-row')
            .data(state.indirectCostFixed)
            .enter()
            .append('tr')
            .attr('class', 'indirect-fixed-row bg-white border-b hover:bg-gray-50');
        fixedIndirectRows.append('td').attr('class', 'px-6 py-4 font-medium text-gray-900 whitespace-nowrap').text(d => d.name);
        fixedIndirectRows.append('td').attr('class', 'px-6 py-4 text-gray-400').text('-');
        fixedIndirectRows.append('td').attr('class', 'px-6 py-4 text-gray-400').text('-');
        // Editable input for fixed-dollar indirect amount (e.g., Design)
        fixedIndirectRows.append('td')
            .attr('class', 'px-6 py-4')
            .each(function(d) {
                d3.select(this)
                    .append('input')
                    .attr('type', 'text')
                    .attr('inputmode', 'numeric')
                    .attr('pattern', '[0-9,]*')
                    .attr('class', 'text-right program-table-input editable-input')
                    .attr('value', utils.formatCurrency(Number(d.amount) || 0, 0))
                    .on('focus', function() {
                        const numeric = Number(d.amount) || 0;
                        this.value = numeric.toLocaleString('en-US');
                        this.select();
                    })
                    .on('change', function() {
                        const parsed = utils.parseNumberFromInput(String(this.value));
                        d.amount = Math.max(0, parsed);
                        render();
                        ui.renderGlobalEstimate();
                    })
                    .on('blur', function() {
                        const numeric = Number(d.amount) || 0;
                        this.value = utils.formatCurrency(numeric, 0);
                    });
            });
        indirectsTotal += d3.sum(state.indirectCostFixed, i => Number(i.amount) || 0);
    }

    const grandTotal = totalCow + indirectsTotal;
    const grandPerSFDisplay = grossSFForCalcs > 0 ? utils.formatCurrency(grandTotal / grossSFForCalcs, 2) : '-';
    const grandTotalRow = tbody.append('tr').attr('class', 'bg-gray-200 border-t-2 border-gray-400 font-bold');
    grandTotalRow.append('td').attr('class', 'px-6 py-4 font-bold text-gray-900 uppercase').text('Grand Total');
    grandTotalRow.append('td').attr('class', 'px-6 py-4').text('-');
    grandTotalRow.append('td').attr('class', 'px-6 py-4').text(grandPerSFDisplay);
    grandTotalRow.append('td').attr('class', 'px-6 py-4 font-bold text-gray-900').text(utils.formatCurrency(grandTotal, 0));
}

export function renderPhase2ProgramView(render, handleSquareFootageCellChange) {
    d3.select(dom.programView).html('');
    const mainContainer = d3.select(dom.programView);

    // Top layout: Overall SF (1/6) on the left, Floors (5/6) on the right
    const topLayout = mainContainer.append('div')
        .attr('class', 'grid grid-cols-6 gap-4 mb-4');

    // Overall Square Footage card (left 1/6)
    const overallCard = topLayout.append('div')
        .attr('class', 'col-span-1 bg-white p-4 rounded-lg shadow-md border border-gray-200');

    overallCard.append('h3')
        .attr('class', 'font-semibold text-gray-700 mb-3')
        .text('Overall Square Footage');

    const overallSFContainer = overallCard.append('div')
        .attr('class', 'flex items-center gap-3');

    const overallSFInputGroup = overallSFContainer.append('div')
        .attr('class', 'flex flex-col');

    // Keep an accessible label but hide it visually
    overallSFInputGroup.append('label')
        .attr('for', 'overall-sf-input')
        .attr('class', 'sr-only')
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

    // Add Maximize button under the input
    overallCard.append('div')
        .attr('class', 'mt-3')
        .append('button')
        .attr('class', 'bg-indigo-600 text-white py-1 px-3 text-sm rounded-md font-medium hover:bg-indigo-700 transition')
        .text('Maximize')
        .on('click', async () => {
            await maximizeGrossSFToBudget(render);
        });

    // Floors card (right 5/6)
    const schemesContainer = topLayout.append('div')
        .attr('class', 'col-span-5 schemes-container bg-white p-4 rounded-lg shadow-md border border-gray-200');
    
    // Create header with title, estimate display, and button
    const headerContainer = schemesContainer.append('div')
        .attr('class', 'flex justify-between items-center mb-3');
    
    headerContainer.append('h3')
        .attr('class', 'font-semibold text-gray-800')
        .text('Floors');
    
    // Add estimate display and button container
    const rightContainer = headerContainer.append('div')
        .attr('class', 'flex items-center gap-4');
    
    // Removed inline program estimate element; using global header estimate instead
        
    const schemeGrid = schemesContainer.append('div')
        .attr('class', 'grid grid-cols-7 gap-4')
        .style('height', '108px');

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
        .attr('class', 'p-2 text-center font-semibold text-white text-xl flex items-center justify-center h-full')
        .text(d => `${d}`);

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
            const step = 0.5;
            const next = (Number(state.shelledFloorsCount) || 0) - step;
            state.shelledFloorsCount = Math.max(0, Math.round(next * 2) / 2);
            updateProgramSF();
            render();
            ui.renderGlobalEstimate();
            shelledDisplay.text(`${Number(state.shelledFloorsCount || 0).toFixed(1)}`);
        });

    const shelledDisplay = shellControls.append('div')
        .attr('class', 'text-lg font-semibold text-gray-800 w-12 text-center')
        .text(() => `${Number(state.shelledFloorsCount || 0).toFixed(1)}`);

    shellControls.append('button')
        .attr('class', 'px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 transition')
        .text('+')
        .on('click', async () => {
            const step = 0.5;
            const nextCount = Math.min(state.numFloors || 1, (Number(state.shelledFloorsCount) || 0) + step);
            const willIncrease = nextCount > (state.shelledFloorsCount || 0);
            if (willIncrease && state.interiors?.hasAssignedSF) {
                const confirmed = await ui.showConfirmDialog(
                    'Shelling Floors With Assigned Program SF',
                    'You have room square footage assigned in Interiors. Shelling floors reduces finished area and may not fit the assigned program SF. Do you want to proceed?',
                    'Proceed',
                    'Cancel'
                );
                if (!confirmed) {
                    return;
                }
            }
            state.shelledFloorsCount = Math.round(nextCount * 2) / 2;
            updateProgramSF();
            render();
            ui.renderGlobalEstimate();
            shelledDisplay.text(`${Number(state.shelledFloorsCount || 0).toFixed(1)}`);
        });

    // Seventh card for Penthouse dimensions
    const penthouseCard = schemeGrid.append('div')
        .attr('class', 'bg-white rounded-lg overflow-hidden shadow-md border border-gray-200 h-full flex flex-col');

    penthouseCard.append('div')
        .attr('class', 'bg-gray-100 p-2 text-center font-semibold text-gray-800 border-b border-gray-200')
        .text('Penthouse (W/L/H)');

    const phControls = penthouseCard.append('div')
        .attr('class', 'flex-1 flex items-center justify-center gap-1 px-1');

    function createPhInput(key, placeholder) {
        return phControls.append('input')
            .attr('type', 'text')
            .attr('inputmode', 'numeric')
            .attr('pattern', '[0-9,]*')
            .attr('class', 'w-10 px-1 py-0.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 editable-input text-center text-xs')
            .attr('placeholder', placeholder)
            .attr('value', `${utils.formatNumber(Number(state.penthouse?.[key]) || 0)}`)
            .on('focus', function() {
                const val = Number(state.penthouse?.[key]) || 0;
                this.value = val.toString();
                this.select();
            })
            .on('change', function() {
                const numeric = Number(String(this.value).replace(/,/g, '')) || 0;
                if (!state.penthouse) state.penthouse = { width: 0, length: 0, height: 0 };
                state.penthouse[key] = Math.max(0, numeric);
                updateProgramSF();
                render();
                ui.renderGlobalEstimate();
            })
            .on('blur', function() {
                const val = Number(state.penthouse?.[key]) || 0;
                this.value = utils.formatNumber(val);
            });
    }

    createPhInput('width', 'W');
    createPhInput('length', 'L');
    createPhInput('height', 'H');

    const tableCard = mainContainer.append('div')
        .attr('class', 'bg-white p-4 rounded-lg shadow-md border border-gray-200');

    const tableContainer = tableCard.append('div')
        .attr('class', 'program-table-container');
    updatePhase2ProgramTable(tableContainer, render, handleSquareFootageCellChange);
    
    // Update global estimate after initial render
    ui.renderGlobalEstimate();
}
