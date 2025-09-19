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
            .attr('class', 'text-left program-table-input w-20 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500')
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
        .attr('class', 'w-40 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500')
        .attr('value', utils.formatNumber(state.currentData?.grossSF || 0))
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
            this.value = utils.formatNumber(numeric);
            renderMixTable();
            renderInteriorsGraph();
        })
        .on('blur', function() {
            const numeric = Number(this.value.replace(/[^0-9]/g, '')) || 0;
            this.value = utils.formatNumber(numeric);
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
        .attr('class', 'w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500')
        .attr('value', d => {
            const v = state.interiors.mixSF[d.name] || 0;
            return Number(v).toLocaleString('en-US');
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
            renderMixTable();
            renderInteriorsGraph();
        })
        .on('blur', function(event, d) {
            const numeric = Number(this.value.replace(/[^0-9]/g, '')) || 0;
            this.value = numeric.toLocaleString('en-US');
            this.classList.remove('border-red-500');
            this.classList.remove('ring-red-500');
        });

    // Calculation table
    const tableContainer = container.append('div');
    const messageContainer = container.append('div').attr('class', 'mt-2');

    function computeNSF() {
        // NSF is the sum of the square footages of all classroom types
        return roomTypes.reduce((sum, rt) => sum + (Number(state.interiors.mixSF[rt.name]) || 0), 0);
    }

    function renderMixTable() {
        tableContainer.html('');
        messageContainer.html('');

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
            const pctNSF = nsf > 0 ? (sf / nsf) : 0;
            return {
                name: rt.name,
                sf,
                interiorsCost,
                servicesCost,
                equipmentCost,
                totalCost,
                pctGSF,
                pctNSF
            };
        });

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
        headerRow.append('th').attr('class', 'px-4 py-2 text-right').text('% NSF');
        headerRow.append('th').attr('class', 'px-4 py-2 text-right').text('Interiors');
        headerRow.append('th').attr('class', 'px-4 py-2 text-right').text('Services');
        headerRow.append('th').attr('class', 'px-4 py-2 text-right').text('Equipment');
        headerRow.append('th').attr('class', 'px-4 py-2 text-right').text('Total');

        const tbody = table.append('tbody');
        const tr = tbody.selectAll('tr.mix-row')
            .data(rows, d => d.name)
            .enter()
            .append('tr')
            .attr('class', 'bg-white border-b hover:bg-gray-50 mix-row');

        tr.append('td').attr('class', 'px-4 py-2 text-gray-900').text(d => d.name);
        tr.append('td').attr('class', 'px-4 py-2 text-right').text(d => d.sf.toLocaleString('en-US'));
        tr.append('td').attr('class', 'px-4 py-2 text-right').text(d => `${(d.pctGSF * 100).toFixed(1)}%`);
        tr.append('td').attr('class', 'px-4 py-2 text-right').text(d => `${(d.pctNSF * 100).toFixed(1)}%`);
        tr.append('td').attr('class', 'px-4 py-2 text-right').text(d => utils.formatCurrencySmall(d.interiorsCost));
        tr.append('td').attr('class', 'px-4 py-2 text-right').text(d => utils.formatCurrencySmall(d.servicesCost));
        tr.append('td').attr('class', 'px-4 py-2 text-right').text(d => utils.formatCurrencySmall(d.equipmentCost));
        tr.append('td').attr('class', 'px-4 py-2 text-right font-semibold').text(d => utils.formatCurrencySmall(d.totalCost));

        // Totals row with coverage highlighting
        const tfoot = table.append('tfoot');

        const coverage = totalGSF > 0 ? (totals.sf / totalGSF) : 0;
        let highlightClass = 'bg-blue-50';
        if (coverage >= 0.75 && coverage < 0.85) {
            highlightClass = 'bg-yellow-100';
        } else if (coverage >= 0.85 && coverage <= 1.0) {
            highlightClass = 'bg-orange-100';
        } else if (coverage > 1.0) {
            highlightClass = 'bg-red-100';
        }

        const totalRow = tfoot.append('tr').attr('class', `${highlightClass} border-t`);
        totalRow.append('td').attr('class', 'px-4 py-2 font-bold text-blue-900').text('Total');
        totalRow.append('td').attr('class', 'px-4 py-2 text-right font-bold text-blue-900').text(totals.sf.toLocaleString('en-US'));
        totalRow.append('td').attr('class', 'px-4 py-2 text-right font-bold text-blue-900').text(() => {
            const totalGSF = Number(state.currentData?.grossSF) || 0;
            const pct = totalGSF > 0 ? (totals.sf / totalGSF) * 100 : 0;
            return `${pct.toFixed(1)}%`;
        });
        totalRow.append('td').attr('class', 'px-4 py-2 text-right font-bold text-blue-900').text(() => {
            const nsf = computeNSF();
            const pct = nsf > 0 ? (totals.sf / nsf) * 100 : 0;
            return `${pct.toFixed(1)}%`;
        });
        totalRow.append('td').attr('class', 'px-4 py-2 text-right font-bold text-blue-900').text(utils.formatCurrencySmall(totals.interiorsCost));
        totalRow.append('td').attr('class', 'px-4 py-2 text-right font-bold text-blue-900').text(utils.formatCurrencySmall(totals.servicesCost));
        totalRow.append('td').attr('class', 'px-4 py-2 text-right font-bold text-blue-900').text(utils.formatCurrencySmall(totals.equipmentCost));
        totalRow.append('td').attr('class', 'px-4 py-2 text-right font-bold text-blue-900').text(utils.formatCurrencySmall(totals.totalCost));

        // Over-coverage or warning messages
        if (coverage > 1.0) {
            const overBy = totals.sf - totalGSF;
            const overPct = (coverage - 1.0) * 100;
            messageContainer
                .append('div')
                .attr('class', 'text-sm text-red-600 flex items-center gap-1')
                .html(`<span class="inline-block align-middle" style="font-size:1.1em;">&#9888;&#65039;</span> Entered classroom SF exceeds Gross SF by ${overBy.toLocaleString('en-US')} SF (${overPct.toFixed(1)}%).`);
        } else if (coverage >= 0.75 && coverage <= 1.0) {
            // Show warning for unrealistic building efficiency
            messageContainer
                .append('div')
                .attr('class', 'text-sm text-orange-600 flex items-center gap-1')
                .html(`<span class="inline-block align-middle" style="font-size:1.1em;">&#9888;&#65039;</span> Warning: Building Efficiency is Unrealistic (Classroom SF is ${Math.round(coverage * 100)}% of Gross SF).`);
        }
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
        .style('top', d => Math.min(yScale(d.benchmark_low), yScale(d.benchmark_high)) + 'px')
        .style('height', d => Math.abs(yScale(d.benchmark_low) - yScale(d.benchmark_high)) + 'px');
    cols.append('div').attr('class', 'benchmark-cap benchmark-cap-low')
        .style('top', d => yScale(d.benchmark_low) + 'px');
    cols.append('div').attr('class', 'benchmark-cap benchmark-cap-high')
        .style('top', d => yScale(d.benchmark_high) + 'px');

    // Current target (light gray) - using ghost-rom visuals
    cols.append('div').attr('class', 'ghost-rom')
        .style('top', d => (yScale(d.currentTarget) - 3) + 'px');

    // Blended target (dark bar) - read only
    cols.append('div')
        .attr('class', 'current-rom')
        .style('top', d => (yScale(d.blendedTarget) - 3) + 'px');

    // Labels
    cols.append('div')
        .attr('class', 'component-label')
        .text(d => d.name);

    // Benchmark indicators (blue circles + short line) with hover tooltip
    const svg = cols.append('svg').attr('class', 'benchmark-indicator-svg');

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
