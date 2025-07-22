/**
 * @file chart-summary.js
 * @description Renders the summary chart view.
 */
import { state } from './state.js';
import * as dom from './dom.js';
import * as ui from './ui.js';
import * as utils from './utils.js';

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
            if (tspan.node().getComputedTextLength() > width) {
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
    const originalData = {
        name: "Imported Data",
        costOfWork: state.originalData.phases.phase2.costOfWork
    };
    const allSeriesData = [originalData, ...state.snapshots];
    const seriesNames = allSeriesData.map(d => d.name);
    const costOfWorkNames = state.originalData.phases.phase2.costOfWork.map(c => c.name);
    const gmpValue = state.originalData.phases.phase2.totalProjectBudget;
    
    // --- Render Left Chart ---
    renderGroupedBarChart(allSeriesData, seriesNames, costOfWorkNames);

    // --- Render Right Chart (will be implemented next) ---
    renderStackedBarChart(allSeriesData, seriesNames, costOfWorkNames, gmpValue);
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
                        d3.max(series.costOfWork, c => c.target_value * c.square_footage)
    );
    
    const y = d3.scaleLinear()
        .domain([0, yMax * 1.1]).nice()
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
        .call(wrap, x0.bandwidth());

    // --- D3 Bar Rendering ---
    const componentGroup = g.selectAll(".component-group")
        .data(costOfWorkNames)
        .enter().append("g")
        .attr("class", "component-group")
        .attr("transform", d => `translate(${x0(d)},0)`);

    const bars = componentGroup.selectAll("g.bar-group")
        .data(componentName => allSeriesData.map(series => {
            const comp = series.costOfWork.find(c => c.name === componentName);
            return {
                seriesName: series.name,
                value: comp ? comp.target_value * comp.square_footage : 0
            };
        }))
        .enter().append("g").attr("class", "bar-group");
        
    bars.append("rect")
        .attr("x", d => x1(d.seriesName))
        .attr("y", d => y(d.value))
        .attr("width", x1.bandwidth())
        .attr("height", d => height - y(d.value))
        .attr("fill", d => color(d.seriesName));

    // --- Bar Labels ---
    bars.append("text")
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
        .attr("class", "legend-item flex items-center gap-2 relative p-1 rounded")
        .on('mouseenter', function(event, d) {
            if (d !== 'Imported Data') {
                d3.select(this).classed('hover-delete', true);
            }
        })
        .on('mouseleave', function(event, d) {
             if (d !== 'Imported Data') {
                d3.select(this).classed('hover-delete', false);
            }
        })
        .on('click', async (event, d) => {
            if (d !== 'Imported Data') {
                const confirmed = await ui.showConfirmDialog(
                    "Delete Snapshot",
                    `Are you sure you want to delete the "${d}" snapshot?`,
                    "Delete",
                    "Cancel"
                );
                if (confirmed) {
                    state.deleteSnapshot(d);
                    render();
                }
            }
        });
    
    legendItems.filter(d => d !== 'Imported Data').classed('cursor-pointer', true);

    const legendContent = legendItems.append('div')
        .attr('class', 'legend-content flex items-center gap-2');

    legendContent.append("div")
        .attr("class", "w-4 h-4")
        .style("background-color", d => color(d));

    legendContent.append("span")
        .attr("class", "font-medium")
        .text(d => d);

    legendItems.filter(d => d !== 'Imported Data')
        .append('div')
        .attr('class', 'delete-overlay absolute inset-0 flex items-center justify-center font-bold text-white')
        .text('DELETE');
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

    const margin = { top: 20, right: 20, bottom: 50, left: 40 };
    const width = container.node().getBoundingClientRect().width - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;

    const svg = container.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);
        
    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // --- Data Transformation for Stacking ---
    const stackedData = allSeriesData.map(series => {
        const cowTotal = utils.calculateTotalCostOfWork(series.costOfWork);
        
        let cumulative = 0;
        // 1. Direct Cost of Work Components
        const directCostItems = series.costOfWork.map(comp => {
            const value = (comp.name === 'C Interiors' && comp.building_efficiency) 
                ? (comp.square_footage / comp.building_efficiency) * comp.target_value
                : comp.target_value * comp.square_footage;
            const start = cumulative;
            cumulative += value;
            return { name: comp.name, value, start, end: cumulative, isIndirect: false };
        });

        // 2. Indirect Cost Components
        const indirectCostItems = state.indirectCostPercentages.map(indirect => {
            const value = indirect.percentage * cowTotal;
            const start = cumulative;
            cumulative += value;
            return { name: indirect.name, value, start, end: cumulative, isIndirect: true };
        });

        return { 
            name: series.name, 
            components: [...directCostItems, ...indirectCostItems],
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

    const directColor = d3.scaleOrdinal(d3.schemeTableau10).domain(costOfWorkNames);
    const indirectColor = d3.scaleOrdinal(d3.schemeSet3).domain(state.indirectCostPercentages.map(d => d.name));

    // --- D3 Axes ---
    g.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .style("text-anchor", "middle")
        .call(wrap, x.bandwidth());

    g.append("g").call(d3.axisLeft(y).tickFormat(d => `$${d3.format("~s")(d)}`));

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
        .text(d => `${d.name}: ${utils.formatCurrency(d.value)}`);

    // --- GMP Line ---
    g.append("line")
        .attr("class", "gmp-line")
        .attr("x1", 0)
        .attr("x2", width)
        .attr("y1", y(gmpValue))
        .attr("y2", y(gmpValue));
}


/**
 * Updates the summary panel with the latest cost calculations for both phases.
 */
export function updateSummary() {
    if (state.currentView !== 'summary') return;

    const summaryPanel = dom.summaryPanel;
    summaryPanel.innerHTML = ''; // Clear previous content

    const gmp = state.originalData.phases.phase2.totalProjectBudget;

    // --- Header ---
    const header = document.createElement('div');
    header.className = 'text-center mb-4';
    header.innerHTML = `
        <h2 class="text-lg font-bold text-gray-700">Phase 2 Summary</h2>
        <p class="text-xl font-bold text-gray-800">${utils.formatCurrencyBig(gmp)} <span class="text-sm font-medium text-gray-500">Total Project Budget</span></p>
    `;
    summaryPanel.appendChild(header);

    // --- Data Series Table ---
    const originalData = {
        name: 'Imported Data',
        costOfWork: state.originalData.phases.phase2.costOfWork,
        projectAreaSF: state.originalData.projectAreaSF
    };
    const allSeries = [originalData, ...state.snapshots];

    console.log('Rendering summary table. All series data:', allSeries);

    const table = document.createElement('table');
    table.className = 'w-full text-sm text-left text-gray-500';
    
    const thead = table.createTHead();
    thead.innerHTML = `
        <tr class="text-xs text-gray-700 uppercase bg-gray-50">
            <th scope="col" class="px-6 py-3">Scenario</th>
            <th scope="col" class="px-6 py-3 text-right">Estimate</th>
            <th scope="col" class="px-6 py-3 text-right">Gross SF</th>
            <th scope="col" class="px-6 py-3 text-right">Usable SF</th>
            <th scope="col" class="px-6 py-3 text-right">$/SF</th>
            <th scope="col" class="px-6 py-3 text-right">Variance</th>
        </tr>
    `;

    const tbody = table.createTBody();
    allSeries.forEach(series => {
        const cowTotal = utils.calculateTotalCostOfWork(series.costOfWork);
        const indirectTotal = d3.sum(state.indirectCostPercentages, p => p.percentage * cowTotal);
        const totalProjectCost = cowTotal + indirectTotal;

        const grossSF = series.projectAreaSF || 0;
        const usableSF = utils.calculateUsableSF(grossSF, series.costOfWork);
        const costPerSF = grossSF > 0 ? totalProjectCost / grossSF : 0;
        const variance = totalProjectCost - gmp;
        
        const row = tbody.insertRow();
        row.className = 'bg-white border-b';
        row.innerHTML = `
            <td class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">${series.name}</td>
            <td class="px-6 py-4 text-right">${utils.formatCurrencyBig(totalProjectCost)}</td>
            <td class="px-6 py-4 text-right">${utils.formatNumber(grossSF)}</td>
            <td class="px-6 py-4 text-right">${utils.formatNumber(usableSF)}</td>
            <td class="px-6 py-4 text-right">${utils.formatCurrency(costPerSF)}</td>
            <td class="px-6 py-4 text-right font-medium ${variance > 0 ? 'text-red-600' : 'text-green-600'}">
                ${variance >= 0 ? '+' : ''}${utils.formatCurrencyBig(variance)}
            </td>
        `;
    });

    summaryPanel.appendChild(table);
} 