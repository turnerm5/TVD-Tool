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
 * @file chart-summary.js
 * @description Renders the summary chart view.
 */
import { state } from './state.js?v=2.0.1';
import * as dom from './dom.js?v=2.0.1';
import * as ui from './ui.js?v=2.0.1';
import * as utils from './utils.js?v=2.0.1';
import * as persistence from './persistence.js?v=2.0.1';

let render;
export function setRender(fn) {
    render = fn;
}

/**
 * Wraps long SVG text labels.
 * @param {d3.Selection} text - The d3 selection of text elements.
 * @param {number} width - The maximum width for the text.
 */
function wrap(text, width) {
    text.each(function () {
        var text = d3.select(this),
            words = text.text().split(/\s+/).reverse(),
            word,
            line = [],
            lineNumber = 0,
            lineHeight = 1.1, // ems
            y = text.attr("y"),
            dy = parseFloat(text.attr("dy")) || 0,
            tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
        while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(" "));
            if (tspan.node().getComputedTextLength() > width && line.length > 1) {
                line.pop();
                tspan.text(line.join(" "));
                line = [word];
                tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
            }
        }
    });
}

/**
 * Renders the new Summary view, including the grouped and stacked bar charts.
 */
export function renderSummaryCharts() {
    // --- 1. Data Preparation ---
    // Do not include a baseline series; only show user snapshots
    const allSeriesData = [...state.snapshots];
    
    // Check if no schemes are present (empty state)
    if (allSeriesData.length === 0) {
        renderEmptyState();
        return;
    }
    
    // Remove any lingering empty-state placeholders while preserving chart containers and title
    const summaryGrid = d3.select("#summary-chart-container");
    summaryGrid
        .selectAll(':scope > *')
        .filter(function() {
            const id = this.id;
            return id !== 'summary-bar-chart-container' && id !== 'summary-stacked-chart-container' && id !== 'summary-chart-title';
        })
        .remove();
    
    const seriesNames = allSeriesData.map(d => d.name);
            const originalPredesignScheme = utils.getBaselineScheme();
            // Prefer names from the snapshot data; fallback to initialTargetValues if needed
            const costOfWorkNames = (allSeriesData[0]?.costOfWork?.map(c => c.name)) || (originalPredesignScheme
                ? originalPredesignScheme.costOfWork.map(c => c.name)
                : ((state.originalData && Array.isArray(state.originalData.initialTargetValues))
                    ? state.originalData.initialTargetValues.map(c => c.name)
                    : []));
        const gmpValue = state.originalData.phase2.totalProjectBudget;
    
    // --- Render Left Chart ---
    renderGroupedBarChart(allSeriesData, seriesNames, costOfWorkNames);

    // --- Render Right Chart ---
    renderStackedBarChart(allSeriesData, seriesNames, costOfWorkNames, gmpValue);

    // --- Render Program Comparison ---
    renderProgramComparison(allSeriesData);
}

/**
 * Renders an empty state message when no schemes are present.
 */
function renderEmptyState() {
    // Clear both chart containers
    d3.select("#summary-bar-chart-container").html("");
    d3.select("#summary-stacked-chart-container").html("");
    
    // Clear legend
    const legendContainer = d3.select(dom.summaryLegend);
    legendContainer.html("");

    // Hide Program Comparison section if present
    if (dom.programComparison) {
        dom.programComparison.classList.add('hidden');
    }
    
    // Ensure we do not duplicate the empty-state placeholder on re-renders
    const container = d3.select("#summary-chart-container");
    container.select('#summary-empty-state').remove();
    
    // Render empty state message spanning the full grid width (top area)
    container.append("div")
        .attr("id", "summary-empty-state")
        .attr("class", "w-full flex col-span-5 items-center justify-center h-96 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg")
        .append("div")
        .attr("class", "text-center w-full")
        .html(`
            <div class="text-gray-400 mb-4">
                <svg class="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            </div>
            <h3 class="text-lg font-medium text-gray-900 mb-2">No Snapshots Available</h3>
            <p class="text-gray-500">Please take a snapshot to begin.</p>
        `);
}

/**
 * Renders the grouped bar chart (left side).
 * @param {Array} allSeriesData - The array of all data series (original + snapshots).
 * @param {Array} seriesNames - The names of the series.
 * @param {Array} costOfWorkNames - The names of the components.
 */
function renderGroupedBarChart(allSeriesData, seriesNames, costOfWorkNames) {
    const container = d3.select("#summary-bar-chart-container");
    container.html("");

    const margin = { top: 20, right: 20, bottom: 50, left: 60 };
    const width = container.node().getBoundingClientRect().width - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;

    const svg = container.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);
        
    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // --- D3 Scales ---
    const x0 = d3.scaleBand()
        .domain(costOfWorkNames)
        .range([0, width])
        .padding(0.2);

    const x1 = d3.scaleBand()
        .domain(seriesNames)
        .range([0, x0.bandwidth()])
        .padding(0.05);
    
    const yMax = d3.max(allSeriesData, series => 
                        d3.max(series.costOfWork, c => utils.calculateComponentValue(c))
    );
    const safeYMax = (Number.isFinite(yMax) && yMax > 0) ? yMax : 1;
    
    const y = d3.scaleLinear()
        .domain([0, safeYMax * 1.1]).nice()
        .range([height, 0]);
        
    const color = d3.scaleOrdinal()
        .domain(seriesNames)
        .range(['#2563eb', '#db2777', '#f97316', '#84cc16']);

    // --- D3 Axes ---
    g.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x0))
        .selectAll("text")
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .call(wrap, x0.bandwidth());

    // --- D3 Bar Rendering ---
    const componentGroup = g.selectAll(".component-group")
        .data(costOfWorkNames)
        .enter().append("g")
        .attr("class", "component-group")
        .attr("transform", d => `translate(${x0(d)},0)`);

    const barGroups = componentGroup.selectAll("g.bar-group")
        .data(componentName => allSeriesData.map(series => {
            const comp = series.costOfWork.find(c => c.name === componentName);
            return {
                seriesName: series.name,
                value: comp ? utils.calculateComponentValue(comp) : 0
            };
        }))
        .enter().append("g")
        .attr("class", "bar-group");

    barGroups.append("rect")
        .attr("x", d => x1(d.seriesName))
        .attr("y", d => y(d.value))
        .attr("width", x1.bandwidth())
        .attr("height", d => height - y(d.value))
        .attr("fill", d => color(d.seriesName));

    // --- Bar Labels ---
    barGroups.append("text")
        .attr("class", "bar-label")
        .attr("x", d => x1(d.seriesName) + x1.bandwidth() / 2)
        .attr("y", d => y(d.value) - 5)
        .text(d => d.value > 0 ? utils.formatCurrencySmall(d.value) : "");
        
    // --- Legend ---
    const legendContainer = d3.select(dom.summaryLegend);
    legendContainer.html(""); // Clear existing legend
    
    const legendItems = legendContainer.selectAll(".legend-item")
        .data(seriesNames)
        .enter()
        .append("div")
        .attr("class", "legend-item flex items-center gap-2 relative p-1 rounded cursor-pointer")
        .on('click', async (event, d) => {
            // If there are unsaved changes, warn user before restore
            const hasChanges = state.hasDataChanged && state.hasDataChanged();
            const choice = await ui.showDialog({
                title: `Snapshot: ${d}`,
                message: hasChanges ? 'You have unsaved changes. Restoring will overwrite the working state.' : 'Choose an action for this snapshot.',
                confirmText: 'Restore',
                cancelText: 'Delete'
            });
            if (choice === null) {
                // Dismissed
                return;
            }
            if (choice === true) {
                // Restore
                const restored = state.restoreSnapshotByName(d);
                if (restored) {
                    persistence.save(state);
                    render();
                }
                return;
            }
            if (choice === false) {
                // Delete path via separate confirmation
                const confirmed = await ui.showConfirmDialog(
                    "Delete Snapshot",
                    `Are you sure you want to delete the "${d}" snapshot?`,
                    "Delete",
                    "Cancel"
                );
                if (confirmed) {
                    state.deleteSnapshot(d);
                    persistence.save(state);
                    render();
                }
                return;
            }
            // Otherwise (string or unexpected), no-op
        });
    
    legendItems.classed('cursor-pointer', true);

    const legendContent = legendItems.append('div')
        .attr('class', 'legend-content flex items-center gap-2');

    legendContent.append("div")
        .attr("class", "w-4 h-4")
        .style("background-color", d => color(d));

    legendContent.append("span")
        .attr("class", "font-medium")
        .text(d => d);

    // Remove old hover delete overlay
}

/**
 * Renders the stacked bar chart (right side).
 * @param {Array} allSeriesData - The array of all data series (original + snapshots).
 * @param {Array} seriesNames - The names of the series.
 * @param {Array} costOfWorkNames - The names of the components.
 * @param {number} gmpValue - The total project budget.
 */
function renderStackedBarChart(allSeriesData, seriesNames, costOfWorkNames, gmpValue) {
    const container = d3.select("#summary-stacked-chart-container");
    container.html("");

    const margin = { top: 20, right: 20, bottom: 50, left: 60 };
    const width = container.node().getBoundingClientRect().width - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;

    const svg = container.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);
        
    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // --- Data Transformation for Stacking ---
    const stackedData = allSeriesData.map(series => {
        const cowTotal = utils.calculateTotalCostOfWork(series.costOfWork, series.costOfWorkFixedAdditions);
        
        let cumulative = 0;
        // 1. Direct Cost of Work Components
        const directCostItems = series.costOfWork.map(comp => {
            const value = utils.calculateComponentValue(comp);
            const start = cumulative;
            cumulative += value;
            return { name: comp.name, value, start, end: cumulative, isIndirect: false };
        });

        // 1b. Fixed COW additions (from state)
        const fixedCowItems = (series.costOfWorkFixedAdditions || state.costOfWorkFixedAdditions || []).map(item => {
            const value = Number(item.amount) || 0;
            const start = cumulative;
            cumulative += value;
            return { name: item.name, value, start, end: cumulative, isIndirect: false };
        });

        // 2. Fixed-dollar indirects (all indirects are now fixed amounts)
        const fixedIndirectItems = ((series.indirectCostFixed) || state.indirectCostFixed || []).map(ind => {
            const value = Number(ind.amount) || 0;
            const start = cumulative;
            cumulative += value;
            return { name: ind.name, value, start, end: cumulative, isIndirect: true };
        });

        return { 
            name: series.name, 
            components: [...directCostItems, ...fixedCowItems, ...fixedIndirectItems],
            total: cumulative 
        };
    });

    // --- D3 Scales ---
    const x = d3.scaleBand()
        .domain(seriesNames)
        .range([0, width])
        .padding(0.3);

    const yMax = d3.max([gmpValue, d3.max(stackedData, d => d.total)]);
    const y = d3.scaleLinear()
        .domain([0, yMax * 1.1]).nice()
        .range([height, 0]);

    const directColor = d3.scaleOrdinal(d3.schemeTableau10).domain([...costOfWorkNames, ...(state.costOfWorkFixedAdditions || []).map(d => d.name)]);
    const indirectColor = d3.scaleOrdinal(d3.schemeSet3).domain([...(state.indirectCostFixed || []).map(d => d.name)]);

    // --- D3 Axes ---
    g.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .call(wrap, x.bandwidth());

    g.append("g")
        .call(d3.axisLeft(y).tickFormat(d => `$${d3.format("~s")(d)}`))
        .selectAll("text")
        .style("font-size", "14px");

    // --- D3 Bar Rendering ---
    const seriesGroup = g.selectAll(".series-group")
        .data(stackedData)
        .enter().append("g")
        .attr("class", "series-group")
        .attr("transform", d => `translate(${x(d.name)},0)`);

    seriesGroup.selectAll("rect")
        .data(d => d.components)
        .enter().append("rect")
        .attr("y", d => y(d.end))
        .attr("height", d => Math.max(0, y(d.start) - y(d.end)))
        .attr("width", x.bandwidth())
        .attr("fill", d => d.isIndirect ? indirectColor(d.name) : directColor(d.name))
        .attr("stroke", d => d.isIndirect ? "#a3a3a3" : "none")
        .attr("stroke-dasharray", d => d.isIndirect ? "3, 3" : "none")
        .attr("fill-opacity", d => d.isIndirect ? 0.7 : 1.0)
        .append("title")
        .text(d => `${d.name}: ${utils.formatCurrency(d.value, 2)}`);

    // --- GMP Line ---
    g.append("line")
        .attr("class", "gmp-line")
        .attr("x1", 0)
        .attr("x2", width)
        .attr("y1", y(gmpValue))
        .attr("y2", y(gmpValue));
}



/**
 * Renders Program Comparison stacked bars per snapshot with Interiors donut colors and legend.
 * Shows total SF label on top of each bar.
 */
function renderProgramComparison(allSeriesData) {
    if (!dom.programComparison || !dom.programComparisonBars) return;

    // Show or hide container based on snapshots presence
    if (!allSeriesData || allSeriesData.length === 0) {
        dom.programComparison.classList.add('hidden');
        return;
    }
    dom.programComparison.classList.remove('hidden');

    const barsContainer = d3.select(dom.programComparisonBars);
    barsContainer.html('');

    // Determine room types from first snapshot's saved interiors (fallback to its mix keys)
    const first = allSeriesData[0] || {};
    const firstTargets = Array.isArray(first?.interiors?.targetValues) ? first.interiors.targetValues : [];
    let displayedRoomTypes = firstTargets.length > 0
        ? firstTargets.filter(rt => rt.includeInNSF !== false).map(rt => rt.name)
        : Object.keys(first?.interiors?.mixSF || {});

    // Build data for each snapshot; values are SF per room type
    const seriesData = allSeriesData.map(series => {
        const mixSF = (series.interiors && series.interiors.mixSF) ? series.interiors.mixSF : {};
        const items = displayedRoomTypes.map(name => ({ name, value: Number(mixSF[name]) || 0 }));
        const total = d3.sum(items, d => d.value);
        return { name: series.name, items, total };
    });

    // Color palette identical to Interiors donuts
    const palette = (d3.schemeTableau10 || d3.schemeCategory10);
    const color = d3.scaleOrdinal().domain(displayedRoomTypes).range(palette);

    // Layout
    const margin = { top: 10, right: 30, bottom: 40, left: 20 };
    const width = barsContainer.node().getBoundingClientRect().width - margin.left - margin.right;
    const height = 640 - margin.top - margin.bottom;

    const x = d3.scaleBand().domain(seriesData.map(d => d.name)).range([0, width]).padding(0.3);
    const yMax = d3.max(seriesData, d => d.total) || 1;
    const y = d3.scaleLinear().domain([0, yMax * 1.1]).range([height, 0]).nice();

    const svg = barsContainer.append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Axes
    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll('text')
        .style('font-size', '14px');

    // Stacks per series
    const seriesGroups = svg.selectAll('.series-group')
        .data(seriesData)
        .enter()
        .append('g')
        .attr('class', 'series-group')
        .attr('transform', d => `translate(${x(d.name)},0)`);

    seriesGroups.each(function(d) {
        const g = d3.select(this);

        // Per-snapshot placeholder when total interior SF is zero
        if (!Number.isFinite(d.total) || d.total <= 0) {
            g.append('rect')
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', x.bandwidth())
                .attr('height', height)
                .attr('fill', '#f9fafb')
                .attr('stroke', '#d1d5db')
                .attr('stroke-dasharray', '2,4')
                .attr('rx', 6)
                .attr('ry', 6);

            g.append('text')
                .attr('x', x.bandwidth() / 2)
                .attr('y', height / 2)
                .attr('text-anchor', 'middle')
                .attr('dominant-baseline', 'middle')
                .style('font-size', '12px')
                .style('fill', '#9ca3af')
                .text('No Interior Spaces');
            return;
        }

        let cumulative = 0;
        d.items.forEach(item => {
            const start = cumulative;
            const end = cumulative + item.value;
            const yStart = y(start);
            const yEnd = y(end);
            const segHeight = Math.max(0, yStart - yEnd);

            // Segment rect
            g.append('rect')
                .attr('x', 0)
                .attr('y', yEnd)
                .attr('width', x.bandwidth())
                .attr('height', segHeight)
                .attr('fill', color(item.name))
                .append('title')
                .text(`${item.name}: ${d3.format(',')(Math.round(item.value))} sf`);

            // Per-segment label: single line "Name: X,XXX sf"
            const placeInside = segHeight >= 18;
            const labelY = placeInside ? (yEnd + segHeight / 2 + 4) : (yEnd - 6);
            g.append('text')
                .attr('x', x.bandwidth() / 2)
                .attr('y', labelY)
                .attr('text-anchor', 'middle')
                .style('font-size', '12px')
                .style('fill', placeInside ? '#ffffff' : '#000000')
                .text(`${item.name}: ${d3.format(',')(Math.round(item.value))} sf`);

            cumulative = end;
        });
    });
}


/**
 * Updates the summary panel with the latest cost calculations for both phases.
 */
export function updateSummary() {
    if (state.currentView !== 'summary') return;

    const summaryPanel = dom.summaryPanel;
    summaryPanel.innerHTML = ''; // Clear previous content

    const gmp = state.originalData.phase2.totalProjectBudget;

    // If there are no snapshots, do not render the summary panel (avoid bottom placeholder)
    const allSeries = [...state.snapshots];
    if (allSeries.length === 0) {
        // Hide the summary panel when no snapshots exist
        if (summaryPanel && !summaryPanel.classList.contains('hidden')) {
            summaryPanel.classList.add('hidden');
        }
        return;
    }
    // Ensure the summary panel is visible when snapshots exist
    if (summaryPanel && summaryPanel.classList.contains('hidden')) {
        summaryPanel.classList.remove('hidden');
    }

    // --- Header ---
    const header = document.createElement('div');
    header.className = 'text-center mb-4';
    header.innerHTML = `
        <h2 class="text-lg text-left font-bold text-gray-700">Cost Per Square Foot Comparison</span></h2>
    `;
    summaryPanel.appendChild(header);

    // --- Data Series Table ---
    // Do not include a baseline series in the table; only show snapshots

    const table = document.createElement('table');
    table.className = 'w-full text-base text-left text-gray-500';
    
    const thead = table.createTHead();
    thead.innerHTML = `
        <tr class="text-xs text-gray-700 uppercase bg-gray-50">
            <th scope="col" class="px-6 py-3">Scenario</th>
            <th scope="col" class="px-6 py-3 text-right">COW</th>
            <th scope="col" class="px-6 py-3 text-right">Indirects</th>
            <th scope="col" class="px-6 py-3 text-right">Total</th>
            <th scope="col" class="px-6 py-3 text-right">GSF</th>
            <th scope="col" class="px-6 py-3 text-right">NSF</th>
            <th scope="col" class="px-6 py-3 text-right">$/GSF</th>
            <th scope="col" class="px-6 py-3 text-right">$/NSF</th>
            <th scope="col" class="px-6 py-3 text-right">Budget &#x0394;</th>
        </tr>
    `;

    const tbody = table.createTBody();
    allSeries.forEach(series => {
        const totals = utils.calculateSeriesTotal(series);
        const { cowTotal, indirectTotal, totalProjectCost } = totals;

        const grossSF = series.grossSF || 0;

        // Assignable SF (ASF) = sum of Interiors Classroom Mix SF for NSF-included types
            const assignedSF = (() => {
            const interiors = series.interiors || {};
            const mixSF = interiors.mixSF || {};
            const targetValues = Array.isArray(interiors.targetValues) ? interiors.targetValues : [];
            if (targetValues.length === 0) {
                // Fallback: sum all mixSF values if targetValues not available
                return Math.round(Object.values(mixSF).reduce((sum, v) => sum + (Number(v) || 0), 0));
            }
            const nsfSum = targetValues.reduce((sum, rt) => {
                const include = (rt.includeInNSF !== false);
                const sf = Number(mixSF[rt.name]) || 0;
                return include ? sum + sf : sum;
            }, 0);
            return Math.round(nsfSum);
        })();

        const costPerGSF = grossSF > 0 ? totalProjectCost / grossSF : 0;
        const costPerASF = assignedSF > 0 ? totalProjectCost / assignedSF : 0;
        const variance = totalProjectCost - gmp;
        
        const row = tbody.insertRow();
        row.className = 'bg-white border-b';
        row.innerHTML = `
            <td class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">${series.name}</td>
            <td class="px-6 py-4 text-right">${utils.formatCurrency(cowTotal, 0)}</td>
            <td class="px-6 py-4 text-right">${utils.formatCurrency(indirectTotal, 0)}</td>
            <td class="px-6 py-4 text-right font-semibold">${utils.formatCurrency(totalProjectCost, 0)}</td>
            <td class="px-6 py-4 text-right">${utils.formatNumber(grossSF)}</td>
            <td class="px-6 py-4 text-right">${utils.formatNumber(assignedSF)}</td>
            <td class="px-6 py-4 text-right">${utils.formatCurrency(costPerGSF, 0)}</td>
            <td class="px-6 py-4 text-right">${utils.formatCurrency(costPerASF, 0)}</td>
            <td class="px-6 py-4 text-right font-medium ${variance > 0 ? 'text-red-600' : 'text-green-600'}">
                ${variance >= 0 ? '+' : ''}${utils.formatCurrency(variance, 0)}
            </td>
        `;
    });

    summaryPanel.appendChild(table);
} 