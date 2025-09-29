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

/**
 * @file chart-interiors.js
 * @description Placeholder renderer for the Interiors view.
 */

import * as dom from './dom.js';
import { state } from './state.js';
import * as utils from './utils.js';
import * as ui from './ui.js';

/**
 * Renders a simple placeholder inside the Interiors view.
 */
export function renderPlaceholder() {
    const container = dom.interiorsView;
    if (!container) return;
}

/**
 * Renders the Values table for Interiors using state.interiors.targetValues.
 * Flexible to any number of room types and value keys.
 */
export function renderValuesTable() {
    if (!dom.interiorsValues) return;
    const wrapper = d3.select(dom.interiorsValues);
    // Clear previous table content but keep header
    wrapper.selectAll('table').remove();

    const data = state.interiors?.targetValues || [];
    if (!Array.isArray(data) || data.length === 0) return;

    const table = wrapper.append('table')
        .attr('class', 'w-full text-sm text-left text-gray-600 border border-gray-200 rounded-lg overflow-hidden');

    // Header
    const thead = table.append('thead');
    const headerRow = thead.append('tr').attr('class', 'bg-gray-50 text-xs uppercase text-gray-700');
    headerRow.append('th').attr('class', 'px-4 py-2 w-4/5').text('Name');
    headerRow.append('th').attr('class', 'px-4 py-2 w-1/5').text('$/SF');

    const tbody = table.append('tbody');

    // For each room type (by 'name'), render a subhead and rows for each category key
    data.forEach(room => {
        // Subhead row for this room type
        const subhead = tbody.append('tr').attr('class', 'bg-blue-50 border-b');
        subhead.append('td')
            .attr('class', 'px-4 py-2 font-bold text-blue-900 uppercase text-xs')
            .attr('colspan', 2)
            .text(room.name);

        // Extract value keys dynamically (exclude 'name')
        const valueEntries = Object.entries(room).filter(([k, v]) => k !== 'name' && typeof v === 'number');

        const tr = tbody.selectAll(`tr.row-${cssSafe(room.name)}`)
            .data(valueEntries, d => room.name + '-' + d[0])
            .enter()
            .append('tr')
            .attr('class', 'bg-white border-b hover:bg-gray-50');

        tr.append('td')
            .attr('class', 'px-4 py-2 text-xs text-gray-900')
            .text(d => d[0]);
        const valueCells = tr.append('td').attr('class', 'font-xs px-4 py-2');
        valueCells.append('input')
            .attr('type', 'text')
            .attr('inputmode', 'decimal')
            .attr('pattern', '[0-9,\\.]*')
            .attr('class', 'text-left program-table-input editable-input w-20 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500')
            .attr('data-room', room.name)
            .attr('data-category', d => d[0])
            .attr('value', d => utils.formatCurrency(Number(d[1]) || 0))
            .on('focus', function(event, entry) {
                const numeric = Number(entry[1]) || 0;
                this.value = numeric.toString();
                this.select();
            })
            .on('input', function(event, entry) {
                const current = parseNumberFromInput(this.value);
                const isValid = !isNaN(current) && isFinite(current) && current >= 0;
                this.classList.toggle('border-red-500', !isValid);
                this.classList.toggle('ring-red-500', !isValid);
            })
            .on('change', function(event, entry) {
                const [category] = entry;
                const newNumeric = parseNumberFromInput(this.value);
                const roomObj = state.interiors.targetValues.find(r => r.name === room.name);
                if (roomObj) {
                    roomObj[category] = newNumeric;
                }
            })
            .on('blur', function(event, entry) {
                const cleaned = parseNumberFromInput(this.value);
                this.value = utils.formatCurrency(cleaned || 0);
                this.classList.remove('border-red-500');
                this.classList.remove('ring-red-500');
            })
            .on('keydown', function(event) {
                const key = event.key;
                if (key === 'Enter' || key === 'ArrowDown' || key === 'ArrowUp') {
                    event.preventDefault();
                    // Commit current value to state
                    const roomName = this.dataset.room;
                    const category = this.dataset.category;
                    const cleaned = parseNumberFromInput(this.value);
                    const roomObj = state.interiors.targetValues.find(r => r.name === roomName);
                    if (roomObj && category) {
                        roomObj[category] = cleaned;
                    }
                    // Format current cell
                    this.value = utils.formatCurrency(cleaned || 0);
                    // Move focus
                    const inputs = wrapper.selectAll('input.program-table-input').nodes();
                    const idx = inputs.indexOf(this);
                    let nextIdx = idx;
                    if (key === 'Enter' || key === 'ArrowDown') nextIdx = Math.min(inputs.length - 1, idx + 1);
                    if (key === 'ArrowUp') nextIdx = Math.max(0, idx - 1);
                    if (inputs[nextIdx]) {
                        inputs[nextIdx].focus();
                        inputs[nextIdx].select();
                    }
                } else if (key === 'Tab') {
                    // Commit and cycle focus within the table
                    const roomName = this.dataset.room;
                    const category = this.dataset.category;
                    const cleaned = parseNumberFromInput(this.value);
                    const roomObj = state.interiors.targetValues.find(r => r.name === roomName);
                    if (roomObj && category) {
                        roomObj[category] = cleaned;
                    }
                    this.value = utils.formatCurrency(cleaned || 0);
                    const inputs = wrapper.selectAll('input.program-table-input').nodes();
                    const idx = inputs.indexOf(this);
                    let nextIdx;
                    if (event.shiftKey) {
                        nextIdx = idx === 0 ? inputs.length - 1 : idx - 1;
                    } else {
                        nextIdx = idx === inputs.length - 1 ? 0 : idx + 1;
                    }
                    event.preventDefault();
                    if (inputs[nextIdx]) {
                        inputs[nextIdx].focus();
                        inputs[nextIdx].select();
                    }
                }
            });
    });
}

function cssSafe(str) {
    return String(str).replace(/[^a-zA-Z0-9_-]/g, '_');
}

function parseNumberFromInput(value) {
    if (typeof value !== 'string') return 0;
    const cleaned = value.replace(/[$,\s]/g, '');
    const num = Number(cleaned);
    return isNaN(num) ? 0 : num;
}

/**
 * Renders the Classroom Mix inputs and calculations in the middle panel.
 * - Inputs: per classroom type SF
 * - Table: costs and % of GSF/NSF per type, plus totals
 */
export function renderClassroomMix() {
    if (!dom.interiorsBreakouts) return;
    const container = d3.select(dom.interiorsBreakouts);
    container.html('');

    // Program scheme quick-select buttons (Max Lab, Mix, Max Student Success)
    const schemesBar = container.append('div')
        .attr('class', 'mb-3 flex flex-wrap items-center gap-2');

    const schemes = Array.isArray(state.currentData?.interiorMixSchemes)
        ? state.currentData.interiorMixSchemes
        : [];

    schemesBar.selectAll('button.scheme-btn')
        .data(schemes, d => d.key)
        .enter()
        .append('button')
        .attr('class', d => `scheme-btn px-3 py-1.5 text-xs rounded-md font-medium border ${state.interiors.selectedMixScheme === d.key ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`)
        .text(d => d.label)
        .on('click', (event, d) => {
            const roomTypes = state.interiors?.targetValues || [];
            const next = {};
            roomTypes.forEach(rt => {
                next[rt.name] = Number(d.values[rt.name]) || 0;
            });
            state.interiors.mixSF = next;
            state.interiors.selectedMixScheme = d.key;
            renderClassroomMix();
            renderInteriorsGraph();
        });

    // Ensure we have a container for the Overall SF input
    const overallSFContainer = container.append('div')
        .attr('class', 'mb-3');

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
            const current = Number(state.currentData?.grossSF || 0);
            this.value = current.toString();
            this.select();
        })
        .on('input', function() {
            const cleaned = this.value.replace(/[^0-9]/g, '');
            const isValid = cleaned === '' || !isNaN(Number(cleaned));
            this.classList.toggle('border-red-500', !isValid);
            this.classList.toggle('ring-red-500', !isValid);
        })
        .on('change', function() {
            const cleaned = this.value.replace(/[^0-9]/g, '');
            const numeric = Number(cleaned) || 0;
            if (!state.currentData) return;
            state.currentData.grossSF = numeric;
            this.value = `${utils.formatNumber(numeric)} sf`;
            renderMixTable();
            renderInteriorsGraph();
        })
        .on('blur', function() {
            const numeric = Number(this.value.replace(/[^0-9]/g, '')) || 0;
            this.value = `${utils.formatNumber(numeric)} sf`;
            this.classList.remove('border-red-500');
            this.classList.remove('ring-red-500');
        });

    const roomTypes = state.interiors?.targetValues || [];
    if (!Array.isArray(roomTypes) || roomTypes.length === 0) return;

    // Inputs for SF per classroom type
    const inputsWrapper = container.append('div')
        .attr('class', 'grid grid-cols-2 gap-3 mb-4');

    const inputCards = inputsWrapper.selectAll('.mix-input')
        .data(roomTypes, d => d.name)
        .enter()
        .append('div')
        .attr('class', 'mix-input');

    inputCards.append('div')
        .attr('class', 'text-xs font-semibold text-gray-700 mb-1')
        .text(d => d.name);

    inputCards.append('input')
        .attr('type', 'text')
        .attr('inputmode', 'numeric')
        .attr('pattern', '[0-9,]*')
        .attr('class', 'w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 editable-input')
        .attr('value', d => {
            const v = state.interiors.mixSF[d.name] || 0;
            return `${Number(v).toLocaleString('en-US')} sf`;
        })
        .on('focus', function(event, d) {
            const current = Number(state.interiors.mixSF[d.name] || 0) || 0;
            this.value = current.toString();
            this.select();
        })
        .on('input', function() {
            const cleaned = this.value.replace(/[^0-9]/g, '');
            const isValid = cleaned === '' || !isNaN(Number(cleaned));
            this.classList.toggle('border-red-500', !isValid);
            this.classList.toggle('ring-red-500', !isValid);
        })
        .on('change', function(event, d) {
            const cleaned = this.value.replace(/[^0-9]/g, '');
            const numeric = Number(cleaned) || 0;
            state.interiors.mixSF[d.name] = numeric;
            this.value = `${numeric.toLocaleString('en-US')} sf`;
            renderMixTable();
            renderInteriorsGraph();
        })
        .on('blur', function(event, d) {
            const numeric = Number(this.value.replace(/[^0-9]/g, '')) || 0;
            this.value = `${numeric.toLocaleString('en-US')} sf`;
            this.classList.remove('border-red-500');
            this.classList.remove('ring-red-500');
        })
        .on('keydown', function(event, d) {
            if (event.key === 'Tab') {
                const cleaned = this.value.replace(/[^0-9]/g, '');
                const numeric = Number(cleaned) || 0;
                state.interiors.mixSF[d.name] = numeric;
                this.value = `${numeric.toLocaleString('en-US')} sf`;
                const inputs = inputsWrapper.selectAll('div.mix-input input.editable-input').nodes();
                const idx = inputs.indexOf(this);
                let nextIdx;
                if (event.shiftKey) {
                    nextIdx = idx === 0 ? inputs.length - 1 : idx - 1;
                } else {
                    nextIdx = idx === inputs.length - 1 ? 0 : idx + 1;
                }
                event.preventDefault();
                if (inputs[nextIdx]) {
                    inputs[nextIdx].focus();
                    inputs[nextIdx].select();
                }
            }
        });

    // Calculation table
    const tableContainer = container.append('div');
    const messageContainer = container.append('div').attr('class', 'mt-2');
    const donutsContainer = container.append('div').attr('id', 'interiors-donuts');

    function computeNSF() {
        // NSF is the sum of SF for room types flagged includeInNSF
        return roomTypes.reduce((sum, rt) => {
            const include = (rt.includeInNSF !== false);
            const sf = Number(state.interiors.mixSF[rt.name]) || 0;
            return include ? sum + sf : sum;
        }, 0);
    }

    function renderMixTable() {
        tableContainer.html('');
        messageContainer.html('');
        donutsContainer.html('');

        const totalGSF = Number(state.currentData?.grossSF) || 0;
        const nsf = computeNSF();

        // Build rows data
        const rows = roomTypes.map(rt => {
            const sf = Number(state.interiors.mixSF[rt.name] || 0);
            const interiorsCost = Number(rt['C Interiors'] || 0) * sf;
            const servicesCost = Number(rt['D Services'] || 0) * sf;
            const equipmentCost = Number(rt['E Equipment and Furnishings'] || 0) * sf;
            const totalCost = interiorsCost + servicesCost + equipmentCost;
            const pctGSF = totalGSF > 0 ? (sf / totalGSF) : 0;
            const includeInNSF = (rt.includeInNSF !== false);
            const pctNSF = (includeInNSF && nsf > 0) ? (sf / nsf) : null;
            return {
                name: rt.name,
                sf,
                interiorsCost,
                servicesCost,
                equipmentCost,
                totalCost,
                pctGSF,
                pctNSF,
                includeInNSF
            };
        });

        // Merge auto-calculated circulation SF into the Circulation/Support row, if present
        const circulationRoomType = roomTypes.find(rt => (rt.includeInNSF === false) && /circulation|support/i.test(rt.name));
        const circulationName = circulationRoomType ? circulationRoomType.name : null;
        const programTotalSF = rows
            .filter(r => r.name !== circulationName)
            .reduce((sum, r) => sum + r.sf, 0);
        const circulationSF = Math.max(0, totalGSF - programTotalSF);
        const includeCirculation = totalGSF > 0;
        if (circulationName) {
            const idx = rows.findIndex(r => r.name === circulationName);
            if (idx !== -1) {
                const rateInteriors = Number(circulationRoomType['C Interiors'] || 0);
                const rateServices = Number(circulationRoomType['D Services'] || 0);
                const rateEquipment = Number(circulationRoomType['E Equipment and Furnishings'] || 0);
                const newSf = includeCirculation ? circulationSF : 0;
                const newInteriors = rateInteriors * newSf;
                const newServices = rateServices * newSf;
                const newEquipment = rateEquipment * newSf;
                const newTotal = newInteriors + newServices + newEquipment;
                rows[idx] = {
                    ...rows[idx],
                    sf: newSf,
                    interiorsCost: newInteriors,
                    servicesCost: newServices,
                    equipmentCost: newEquipment,
                    totalCost: newTotal,
                    pctGSF: totalGSF > 0 ? (newSf / totalGSF) : 0,
                    pctNSF: null,
                    includeInNSF: false
                };
            }
        }

        const totals = rows.reduce((acc, r) => {
            acc.sf += r.sf;
            acc.interiorsCost += r.interiorsCost;
            acc.servicesCost += r.servicesCost;
            acc.equipmentCost += r.equipmentCost;
            acc.totalCost += r.totalCost;
            return acc;
        }, { sf: 0, interiorsCost: 0, servicesCost: 0, equipmentCost: 0, totalCost: 0 });

        const table = tableContainer.append('table')
            .attr('class', 'w-full text-sm text-left text-gray-600 border border-gray-200 rounded-lg overflow-hidden');

        const thead = table.append('thead');
        const headerRow = thead.append('tr').attr('class', 'bg-gray-50 text-xs uppercase text-gray-700');
        headerRow.append('th').attr('class', 'px-4 py-2').text('Classroom Type');
        headerRow.append('th').attr('class', 'px-4 py-2 text-right').text('SF');
        headerRow.append('th').attr('class', 'px-4 py-2 text-right').text('% GSF');
        headerRow.append('th').attr('class', 'px-4 py-2 text-right').text('Interiors');
        headerRow.append('th').attr('class', 'px-4 py-2 text-right').text('Services');
        headerRow.append('th').attr('class', 'px-4 py-2 text-right').text('Equipment');
        headerRow.append('th').attr('class', 'px-4 py-2 text-right').text('Total');

        const tbody = table.append('tbody');
        const tableRows = includeCirculation && circulationName
            ? rows
            : rows.filter(r => r.name !== circulationName);
        const tr = tbody.selectAll('tr.mix-row')
            .data(tableRows, d => d.name)
            .enter()
            .append('tr')
            .attr('class', 'bg-white border-b hover:bg-gray-50 mix-row');

        tr.append('td').attr('class', 'px-4 py-2 text-gray-900').text(d => d.name);
        tr.append('td').attr('class', 'px-4 py-2 text-right').text(d => d.sf.toLocaleString('en-US'));
        tr.append('td').attr('class', 'px-4 py-2 text-right').text(d => `${(d.pctGSF * 100).toFixed(1)}%`);
        tr.append('td').attr('class', 'px-4 py-2 text-right').text(d => d.totalCost === 0 ? '-' : utils.formatCurrencySmall(d.interiorsCost));
        tr.append('td').attr('class', 'px-4 py-2 text-right').text(d => d.totalCost === 0 ? '-' : utils.formatCurrencySmall(d.servicesCost));
        tr.append('td').attr('class', 'px-4 py-2 text-right').text(d => d.totalCost === 0 ? '-' : utils.formatCurrencySmall(d.equipmentCost));
        tr.append('td').attr('class', 'px-4 py-2 text-right font-semibold').text(d => d.totalCost === 0 ? '-' : utils.formatCurrencySmall(d.totalCost));

        // Totals row with highlighting
        const tfoot = table.append('tfoot');

        // Building Efficiency is NSF / GSF where NSF sums only includeInNSF room types
        const buildingEfficiency = totalGSF > 0 ? (nsf / totalGSF) : 0;
        let highlightClass = 'bg-blue-50';
        if (buildingEfficiency >= 0.75 && buildingEfficiency < 0.85) {
            highlightClass = 'bg-yellow-100';
        } else if (buildingEfficiency >= 0.85 && buildingEfficiency <= 1.0) {
            highlightClass = 'bg-orange-100';
        } else if (buildingEfficiency > 1.0) {
            highlightClass = 'bg-red-100';
        }

        const totalRow = tfoot.append('tr').attr('class', `${highlightClass} border-t`);
        totalRow.append('td').attr('class', 'px-4 py-2 font-bold text-blue-900').text('Total');
        totalRow.append('td').attr('class', 'px-4 py-2 text-right font-bold text-blue-900').text(() => totals.sf.toLocaleString('en-US'));
        totalRow.append('td').attr('class', 'px-4 py-2 text-right font-bold text-blue-900').text(() => {
            const totalGSF = Number(state.currentData?.grossSF) || 0;
            const pct = totalGSF > 0 ? (totals.sf / totalGSF) * 100 : 0;
            return `${pct.toFixed(1)}%`;
        });
        totalRow.append('td').attr('class', 'px-4 py-2 text-right font-bold text-blue-900').text(utils.formatCurrencySmall(totals.interiorsCost));
        totalRow.append('td').attr('class', 'px-4 py-2 text-right font-bold text-blue-900').text(utils.formatCurrencySmall(totals.servicesCost));
        totalRow.append('td').attr('class', 'px-4 py-2 text-right font-bold text-blue-900').text(utils.formatCurrencySmall(totals.equipmentCost));
        totalRow.append('td').attr('class', 'px-4 py-2 text-right font-bold text-blue-900').text(utils.formatCurrencySmall(totals.totalCost));

        // Building Efficiency row (NSF / GSF)
        const beRow = tfoot.append('tr').attr('class', 'border-t');
        beRow.append('td').attr('class', 'px-4 py-2 font-bold text-blue-900').text('Building Efficiency');
        beRow.append('td').attr('class', 'px-4 py-2 text-right font-bold text-blue-900').text(() => {
            const pct = buildingEfficiency * 100;
            return `${pct.toFixed(1)}%`;
        });
        beRow.append('td').attr('class', 'px-4 py-2 text-right font-bold text-blue-900').text('-');
        beRow.append('td').attr('class', 'px-4 py-2 text-right font-bold text-blue-900').text('-');
        beRow.append('td').attr('class', 'px-4 py-2 text-right font-bold text-blue-900').text('-');
        beRow.append('td').attr('class', 'px-4 py-2 text-right font-bold text-blue-900').text('-');
        beRow.append('td').attr('class', 'px-4 py-2 text-right font-bold text-blue-900').text('-');

        // Warnings tied to Building Efficiency
        if (buildingEfficiency > 1.0) {
            const overBy = Math.max(0, nsf - totalGSF);
            const overPct = (buildingEfficiency - 1.0) * 100;
            messageContainer
                .append('div')
                .attr('class', 'text-sm text-red-600 flex items-center gap-1')
                .html(`<span class="inline-block align-middle" style="font-size:1.1em;">&#9888;&#65039;</span> Entered NSF exceeds Gross SF by ${overBy.toLocaleString('en-US')} SF (${overPct.toFixed(1)}%).`);
        } else if (buildingEfficiency >= 0.75 && buildingEfficiency <= 1.0) {
            messageContainer
                .append('div')
                .attr('class', 'text-sm text-orange-600 flex items-center gap-1')
                .html(`<span class="inline-block align-middle" style="font-size:1.1em;">&#9888;&#65039;</span> Warning: Building Efficiency is Unrealistic (Building Efficiency is ${Math.round(buildingEfficiency * 100)}%).`);
        }

        // Donut charts: % by Space and % by Cost
        const donutWrapper = donutsContainer
            .append('div')
            .attr('class', 'mt-4 grid grid-cols-1 md:grid-cols-2 gap-4');

        const widthAvailable = donutsContainer.node() ? donutsContainer.node().clientWidth : 400;
        const palette = (d3.schemeTableau10 || d3.schemeCategory10);
        const color = d3.scaleOrdinal()
            .domain(rows.map(r => r.name))
            .range(palette);

        const spaceData = rows
            .filter(r => r.sf > 0)
            .map(r => ({ name: r.name, value: r.sf }));
        const costData = rows
            .filter(r => r.totalCost > 0)
            .map(r => ({ name: r.name, value: r.totalCost }));

        const size = Math.max(200, Math.min(320, Math.floor((widthAvailable - 16) / 2)));
        const radius = Math.floor(size / 2);
        const innerRadius = Math.floor(radius * 0.6);

        drawDonut(donutWrapper.append('div'), spaceData, '% by Space', radius, innerRadius, size, color);
        drawDonut(donutWrapper.append('div'), costData, '% by Cost', radius, innerRadius, size, color);
    }

    renderMixTable();

}

/**
 * Renders a read-only slider-like graph for Interiors, Services, Equipment
 * showing current target vs. classroom mix blended targets with benchmark indicators.
 */
export function renderInteriorsGraph() {
    if (!dom.interiorsGraph) return;

    // Ensure a wrapper exists so we can place the action button directly under the white box
    const graphNode = dom.interiorsGraph;
    let wrapperNode = graphNode.parentNode;
    if (!(wrapperNode && wrapperNode.id === 'interiors-graph-wrapper')) {
        const parentNode = wrapperNode; // original parent
        const newWrapper = document.createElement('div');
        newWrapper.id = 'interiors-graph-wrapper';
        parentNode.insertBefore(newWrapper, graphNode);
        newWrapper.appendChild(graphNode);
        wrapperNode = newWrapper;
    }
    const wrapperSel = d3.select(wrapperNode);

    const container = d3.select(dom.interiorsGraph);
    container.html('');

    const categories = ['C Interiors', 'D Services', 'E Equipment and Furnishings'];

    // Prepare data for the three categories
    const currentComponents = (state.currentScheme?.costOfWork || []).filter(c => categories.includes(c.name));

    const roomTypes = state.interiors?.targetValues || [];
    const totalMixSf = roomTypes.reduce((sum, rt) => sum + (Number(state.interiors.mixSF[rt.name]) || 0), 0);

    const blendedByCategory = {};
    categories.forEach(cat => {
        if (totalMixSf > 0) {
            const weighted = roomTypes.reduce((sum, rt) => sum + ((Number(state.interiors.mixSF[rt.name]) || 0) * (Number(rt[cat]) || 0)), 0);
            blendedByCategory[cat] = weighted / totalMixSf;
        } else {
            blendedByCategory[cat] = 0;
        }
    });

    const data = currentComponents.map(c => ({
        name: c.name,
        currentTarget: Number(c.target_value) || 0,
        blendedTarget: blendedByCategory[c.name] || 0,
        benchmark_low: Number(c.benchmark_low) || 0,
        benchmark_high: Number(c.benchmark_high) || 0
    }));

    // Determine layout, paddings, and y-scale domain
    const graphHeight = 700;
    const paddingTop = 20;
    const paddingBottom = 125; // leave room for labels
    container
        .style('position', 'relative')
        .style('height', graphHeight + 'px')
        .style('padding-top', paddingTop + 'px')
        .style('padding-bottom', paddingBottom + 'px');

    const chartHeight = container.node().clientHeight;

    const yDomainMax = state.yDomainMax || d3.max([
        d3.max(data, d => Math.max(d.currentTarget, d.blendedTarget, d.benchmark_high)),
        0
    ]) || 100;

    const yScale = d3.scaleLinear().domain([0, yDomainMax]).range([chartHeight - paddingBottom, paddingTop]);

    // Optional header/legend
    const legend = container.append('div').attr('class', 'flex items-center gap-4 mb-2');
    legend.append('div').attr('class', 'flex items-center gap-2')
        .html('<span style="display:inline-block;width:16px;height:6px;background:#d1d5db;border-radius:2px"></span><span class="text-xs text-gray-700">Current Target</span>');
    legend.append('div').attr('class', 'flex items-center gap-2')
        .html('<span style="display:inline-block;width:16px;height:6px;background:#1f2937;border-radius:2px"></span><span class="text-xs text-gray-700">Classroom Mix</span>');

    const grid = container.append('div')
        .attr('class', 'grid')
        .style('grid-template-columns', `repeat(${data.length}, 1fr)`)
        .style('height', (chartHeight - paddingTop - paddingBottom) + 'px');

    const cols = grid.selectAll('.component-column')
        .data(data, d => d.name)
        .enter()
        .append('div')
        .attr('class', 'component-column')
        .style('position', 'relative');

    // Y-axis line per column
    cols.append('div').attr('class', 'y-axis');

    // Benchmark range and caps
    cols.append('div').attr('class', 'benchmark-range')
        .style('top', d => (Math.min(yScale(d.benchmark_low), yScale(d.benchmark_high)) - paddingTop) + 'px')
        .style('height', d => Math.abs(yScale(d.benchmark_low) - yScale(d.benchmark_high)) + 'px');
    cols.append('div').attr('class', 'benchmark-cap benchmark-cap-low')
        .style('top', d => (yScale(d.benchmark_low) - paddingTop) + 'px');
    cols.append('div').attr('class', 'benchmark-cap benchmark-cap-high')
        .style('top', d => (yScale(d.benchmark_high) - paddingTop) + 'px');

    // Current target (light gray) - using ghost-rom visuals
    cols.append('div').attr('class', 'ghost-rom')
        .style('top', d => (yScale(d.currentTarget) - paddingTop - 3) + 'px');

    // Blended target (dark bar) - read only
    cols.append('div')
        .attr('class', 'current-rom')
        .style('top', d => (yScale(d.blendedTarget) - paddingTop - 3) + 'px');

    // Labels
    cols.append('div')
        .attr('class', 'component-label')
        .text(d => d.name);

    // Benchmark indicators (blue circles + short line) with hover tooltip
    const svg = cols
        .append('svg')
        .attr('class', 'benchmark-indicator-svg')
        // Align SVG overlay exactly with the chart content area
        .style('top', `-${paddingTop}px`)
        .style('height', `calc(100% + ${paddingTop + paddingBottom}px)`);

    const benchProjects = state.currentData?.benchmarks || [];

    svg.each(function(componentData) {
        const s = d3.select(this);
        const indicators = s.selectAll('.benchmark-indicator-group')
            .data(benchProjects.filter(p => p.costOfWork.some(c => c.name === componentData.name)));

        const enterIndicators = indicators.enter().append('g')
            .attr('class', 'benchmark-indicator-group');

        enterIndicators.append('line').attr('class', 'benchmark-indicator-line');
        enterIndicators.append('circle').attr('class', 'benchmark-indicator-circle');
        enterIndicators.append('text').attr('class', 'benchmark-indicator-label');

        const merged = enterIndicators.merge(indicators);

        merged.each(function(d) {
            const benchmarkComp = d.costOfWork.find(c => c.name === componentData.name);
            if (!benchmarkComp) return;
            const yPos = yScale(benchmarkComp.cost);
            d3.select(this).select('.benchmark-indicator-line').attr('x1', '20%').attr('x2', '10%').attr('y1', yPos).attr('y2', yPos);
            d3.select(this).select('.benchmark-indicator-circle').attr('cx', '10%').attr('cy', yPos).attr('r', 8);
            d3.select(this).select('.benchmark-indicator-label').attr('x', '10%').attr('y', yPos).attr('dy', '0.35em').text(d.id);
        });

        let hoverTimeout;
        merged
            .on('mouseenter', function(event, d) {
                clearTimeout(hoverTimeout);
                hoverTimeout = setTimeout(() => {
                    showBenchmarkTooltipForInteriors(event, d, componentData);
                }, 200);
            })
            .on('mouseleave', function() {
                clearTimeout(hoverTimeout);
                hideBenchmarkTooltipForInteriors();
            });
    });

    let actions = wrapperSel.select('#interiors-graph-actions');
    if (actions.empty()) {
        actions = wrapperSel.append('div').attr('id', 'interiors-graph-actions');
    }
    actions
        .attr('class', 'mt-2');

    const disabled = totalMixSf === 0;
    actions.html('');
    actions.append('button')
        .attr('class', `w-full px-3 py-2 text-sm rounded-md font-medium ${disabled ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 transition'}`)
        .attr('id', 'update-targets-btn')
        .property('disabled', disabled)
        .text('Update Target Values')
        .on('click', async function() {
            if (totalMixSf === 0) return;
            const confirmed = await ui.showConfirmDialog(
                'Update Target Values',
                'Would you like to update the overall target values to match this new room type mix?',
                'Yes, Update',
                'Cancel'
            );
            if (!confirmed) return;

            const toUpdate = ['C Interiors', 'D Services', 'E Equipment and Furnishings'];
            const components = state.currentScheme?.costOfWork || [];

            // Capture current total Cost of Work before updates
            const preCow = utils.calculateTotalCostOfWork(components);

            // Apply blended targets to the three categories
            components.forEach(c => {
                if (toUpdate.includes(c.name)) {
                    c.target_value = Math.max(0, Number(blendedByCategory[c.name]) || 0);
                }
            });

            // Ask whether to keep the total identical by adjusting other categories
            const keepBudgetSame = await ui.showConfirmDialog(
                'Keep Budget the Same?',
                'Update the other categories so the current estimate stays identical?',
                'Yes, Keep Budget Same',
                'No, Only Update These Three'
            );

            if (keepBudgetSame) {
                const postCowUnbalanced = utils.calculateTotalCostOfWork(components);
                const deltaCow = postCowUnbalanced - preCow; // positive if we increased cost
                if (Math.abs(deltaCow) > 0.01) {
                    const others = components.filter(c => !toUpdate.includes(c.name) && Number(c.square_footage) > 0);
                    const othersCow = others.reduce((sum, c) => sum + (Number(c.target_value) * Number(c.square_footage)), 0);
                    if (othersCow > 0) {
                        // Scale other categories proportionally to absorb delta
                        let factor = (othersCow - deltaCow) / othersCow;
                        if (!isFinite(factor)) factor = 1;
                        if (factor < 0) factor = 0; // clamp to zero to avoid negatives
                        others.forEach(c => {
                            const newTv = (Number(c.target_value) || 0) * factor;
                            c.target_value = Math.max(0, newTv);
                        });
                    }
                }
            }

            // Trigger render via UI helper without changing view
            ui.setCurrentPhase(state.currentPhase || 'phase2');
            await ui.showAlert('Target Values Updated', keepBudgetSame
                ? 'Updated three categories and adjusted others to keep the estimate the same.'
                : 'Updated three categories. Overall estimate may have changed.');
        });


    function showBenchmarkTooltipForInteriors(event, benchmarkData, componentData) {
        hideBenchmarkTooltipForInteriors();
        const benchmarkComponent = benchmarkData.costOfWork.find(c => c.name === componentData.name);
        const tooltip = d3.select('body').append('div').attr('class', 'benchmark-tooltip');
        const imageSource = (benchmarkComponent && benchmarkComponent.image) ? benchmarkComponent.image : benchmarkData.image;
        tooltip.append('img').attr('src', imageSource);
        const content = tooltip.append('div').attr('class', 'benchmark-tooltip-content');
        content.append('div').attr('class', 'benchmark-tooltip-name').text(benchmarkData.name);
        if (benchmarkComponent) {
            if (typeof benchmarkComponent.cost === 'number') {
                content.append('div').attr('class', 'text-base benchmark-tooltip-cost').style('margin-top', '8px').text(`Cost: $${benchmarkComponent.cost.toFixed(2)}/SF`);
            }
            if (benchmarkComponent.systemDetail && benchmarkComponent.systemDetail !== 'Detail needed.') {
                content.append('div').attr('class', 'benchmark-tooltip-detail').style('margin-top', '8px').text(benchmarkComponent.systemDetail);
            }
            if (benchmarkComponent.pros) {
                const prosDiv = content.append('div').attr('class', 'benchmark-tooltip-pros').style('margin-top', '8px');
                prosDiv.append('span').style('font-weight', 'bold').text('✅ Pros: ');
                prosDiv.append('span').text(benchmarkComponent.pros);
            }
            if (benchmarkComponent.cons) {
                const consDiv = content.append('div').attr('class', 'benchmark-tooltip-cons').style('margin-top', '4px');
                consDiv.append('span').style('font-weight', 'bold').text('❌ Cons: ');
                consDiv.append('span').text(benchmarkComponent.cons);
            }
        }
        const tooltipNode = tooltip.node();
        const tooltipWidth = tooltipNode.offsetWidth;
        const tooltipHeight = tooltipNode.offsetHeight;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        let left = event.pageX + 15;
        let top = event.pageY + 15;
        if (left + tooltipWidth > viewportWidth) left = event.pageX - tooltipWidth - 15;
        if (top + tooltipHeight > viewportHeight) top = event.pageY - tooltipHeight - 15;
        tooltip.style('left', left + 'px').style('top', top + 'px');
    }

    function hideBenchmarkTooltipForInteriors() {
        d3.select('.benchmark-tooltip').remove();
    }
}


// Draw a single donut chart with legend
function drawDonut(containerSel, items, title, radius, innerRadius, size, color) {
    const total = d3.sum(items, d => d.value);
    const pie = d3.pie().sort(null).value(d => d.value);
    const arc = d3.arc().innerRadius(innerRadius).outerRadius(radius);

    const wrap = containerSel
        .append('div')
        .attr('class', 'bg-white rounded-md border border-gray-200 p-3');

    wrap.append('div')
        .attr('class', 'text-sm font-semibold text-gray-700 mb-2')
        .text(title);

    const svg = wrap.append('svg')
        .attr('width', size)
        .attr('height', size)
        .append('g')
        .attr('transform', `translate(${Math.floor(size / 2)},${Math.floor(size / 2)})`);

    if (!items || items.length === 0 || total <= 0) {
        // Placeholder donut: four equal slices, white fill with light gray dotted outlines and placeholder % labels
        const placeholderData = [20, 40, 30, 10];
        const placeholderPie = d3.pie().sort(null);
        const placeholderArc = d3.arc().innerRadius(innerRadius).outerRadius(radius);

        svg.selectAll('path.placeholder-slice')
            .data(placeholderPie(placeholderData))
            .enter()
            .append('path')
            .attr('class', 'placeholder-slice')
            .attr('d', placeholderArc)
            .attr('fill', '#ffffff')
            .attr('stroke', '#cbd5e1')
            .attr('stroke-width', 3)
            .attr('stroke-dasharray', '4 4');

        // Add centered text
        svg.append('text')
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .attr('fill', '#64748b') // Tailwind slate-500
            .attr('font-size', Math.floor(radius * 0.16))
            .attr('font-weight', 500)
            .attr('y', 0)
            .text('Enter room square footages to begin')
            .call(function(text) {
                // Optionally wrap text if too long
                const width = radius * 1.5;
                const words = 'Enter room square footages to begin'.split(' ');
                let line = [];
                let lineNumber = 0;
                const lineHeight = 1.2; // ems
                let tspan = text.text(null)
                    .append('tspan')
                    .attr('x', 0)
                    .attr('y', 0)
                    .attr('dy', 0 + 'em');
                for (let i = 0; i < words.length; i++) {
                    line.push(words[i]);
                    tspan.text(line.join(' '));
                    if (tspan.node().getComputedTextLength() > width && line.length > 1) {
                        line.pop();
                        tspan.text(line.join(' '));
                        line = [words[i]];
                        tspan = text.append('tspan')
                            .attr('x', 0)
                            .attr('y', 0)
                            .attr('dy', ++lineNumber * lineHeight + 'em')
                            .text(words[i]);
                    }
                }
            });

        return;
    }

    svg.selectAll('path')
        .data(pie(items))
        .enter()
        .append('path')
        .attr('d', arc)
        .attr('fill', d => color(d.data.name));

    // Legend
    const legend = wrap.append('div').attr('class', 'mt-3 space-y-1');
    const legendItems = legend.selectAll('div')
        .data(items)
        .enter()
        .append('div')
        .attr('class', 'flex items-center justify-between text-xs');

    const left = legendItems.append('div').attr('class', 'flex items-center gap-2');
    left.append('span')
        .attr('class', 'inline-block rounded-sm')
        .style('width', '10px')
        .style('height', '10px')
        .style('background-color', d => color(d.name));
    left.append('span').text(d => d.name);

    legendItems.append('span')
        .attr('class', 'tabular-nums text-gray-700')
        .text(d => total > 0 ? d3.format('.0%')(d.value / total) : '0%');
}
