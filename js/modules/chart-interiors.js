/**
 * @file chart-interiors.js
 * @description Renders the interiors breakdown view and handles its interactions.
 */

import { state } from './state.js';
import * as dom from './dom.js';
import * as utils from './utils.js';
import * as ui from './ui.js';

let render;
export function setDependencies(fns) {
    render = fns.render;
}

export function renderInteriorsView() {
    const interiorsData = state.currentData.phases.phase2.costOfWork.find(c => c.name === 'C Interiors');
    const originalInteriorsData = state.originalData.phases.phase2.costOfWork.find(c => c.name === 'C Interiors');

    if (!interiorsData || !interiorsData.breakdown) {
        dom.interiorsView.innerHTML = `<div class="p-4"><p>No interiors data available.</p></div>`;
        return;
    }

    // Calculate square footage from the breakdown items directly
    const totalSf = interiorsData.breakdown.reduce((acc, item) => acc + item.sf, 0);
    interiorsData.square_footage = totalSf;
    
    const totalCost = interiorsData.breakdown.reduce((acc, item) => acc + item.sf * item.cost, 0);

    const container = d3.select(dom.interiorsView);
    container.html(''); 

    // Add back button
    const headerContainer = container.append('div').attr('class', 'flex items-center justify-between p-4 bg-gray-50 border-b');
    headerContainer.append('button')
        .attr('class', 'flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition')
        .html('← Back to Chart')
        .on('click', async () => {
            // Show confirmation dialog
            const confirmed = await ui.showConfirmDialog(
                "Save Scenario as New Target?",
                "Would you like to save your current program mix scenario as the new target value for the C Interiors component? This will update the slider value in the main chart view. If you select 'No', your changes will be discarded.",
                "Yes, Save as Target",
                "No, Discard Changes"
            );
            
            if (confirmed) {
                // Save the current scenario as the new target
                // The current data is already updated, so we just need to go back
                state.currentView = 'chart';
                render();
            } else {
                // Discard changes - restore the entry state
                if (state.interiorsEntryState) {
                    const interiorsData = state.currentData.phases.phase2.costOfWork.find(c => c.name === 'C Interiors');
                    if (interiorsData) {
                        Object.assign(interiorsData, JSON.parse(JSON.stringify(state.interiorsEntryState)));
                    }
                }
                state.currentView = 'chart';
                render();
            }
        });
    
    headerContainer.append('h2')
        .attr('class', 'text-xl font-bold text-gray-800')
        .text('Detailed Interiors Analysis');

    const grid = container.append('div').attr('class', 'grid grid-cols-12 gap-8 p-4');

    const leftPanel = grid.append('div').attr('class', 'col-span-2');
    leftPanel.append('h3').attr('class', 'text-lg font-bold mb-4').text('Program Mix');
    
    // Create simple table
    const table = leftPanel.append('table').attr('class', 'w-full text-sm');
    
    // Table header
    const thead = table.append('thead');
    thead.append('tr')
        .selectAll('th')
        .data(['Space Type', 'Square Feet'])
        .enter()
        .append('th')
        .attr('class', 'text-left py-2 px-1 font-medium text-gray-700 border-b')
        .text(d => d);
    
    // Table body with space types
    const tbody = table.append('tbody');
    
    interiorsData.breakdown.forEach(item => {
        const row = tbody.append('tr');
        
        // Space type name
        row.append('td')
            .attr('class', 'py-2 px-1 border-b')
            .text(item.name);
        
        // Editable square footage
        row.append('td')
            .attr('class', 'py-2 px-1 border-b')
            .append('input')
            .attr('type', 'text')
            .attr('class', 'w-full p-1 text-right bg-white rounded border text-sm')
            .attr('value', item.sf.toLocaleString('en-US', { maximumFractionDigits: 0 }))
            .on('change', function() {
                const newSf = parseFloat(this.value.replace(/,/g, ''));
                if (!isNaN(newSf) && newSf >= 0) {
                    item.sf = newSf;
                    // Recalculate percentage and efficiency
                    const totalSf = interiorsData.breakdown.reduce((acc, i) => acc + i.sf, 0);
                    interiorsData.breakdown.forEach(i => {
                        i.percentage = totalSf > 0 ? i.sf / totalSf : 0;
                    });
                    recalculateAndUpdate();
                }
            });
    });
    
    // Add efficiency row
    const efficiencyRow = tbody.append('tr').attr('class', 'border-t-2');
    efficiencyRow.append('td')
        .attr('class', 'py-2 px-1 font-medium')
        .text('Efficiency');
    
    const efficiencyCell = efficiencyRow.append('td')
        .attr('class', 'py-2 px-1');
    
    const efficiencyInput = efficiencyCell.append('div')
        .attr('class', 'flex items-center')
        .append('input')
        .attr('type', 'number')
        .attr('class', 'w-20 p-1 text-right bg-white rounded border text-sm')
        .attr('value', (interiorsData.building_efficiency * 100).toFixed(1))
        .attr('min', 0)
        .attr('max', 100)
        .attr('step', 0.1)
        .on('change', function() {
            const newEfficiency = +this.value / 100;
            if (!isNaN(newEfficiency) && newEfficiency >= 0 && newEfficiency <= 1) {
                interiorsData.building_efficiency = newEfficiency;
                recalculateAndUpdate();
            }
        });
    
    efficiencyInput.select(function() { return this.parentNode; })
        .append('span')
        .attr('class', 'ml-1 text-gray-500')
        .text('%');
    
    // Add calculated gross SF display
    const grossSfRow = tbody.append('tr').attr('class', 'border-t');
    grossSfRow.append('td')
        .attr('class', 'py-2 px-1 font-medium')
        .text('Gross SF');
    
    grossSfRow.append('td')
        .attr('class', 'py-2 px-1 font-medium text-blue-600')
        .text(state.currentData.projectAreaSF.toLocaleString('en-US'));

    const centerPanel = grid.append('div').attr('class', 'col-span-7');
    centerPanel.append('h3').attr('class', 'text-lg font-bold mb-4 text-center').text('Interiors Breakdown');
    const treeContainer = centerPanel.append('div').attr('id', 'interiors-tree-chart').style('height', '600px');
    
    requestAnimationFrame(() => {
        const tcNode = d3.select('#interiors-tree-chart').node();
        if (tcNode) {
            renderTreemapChart(interiorsData, tcNode);
        }
    });

    const rightPanel = grid.append('div').attr('class', 'col-span-2');
    
    // Move target budget here - use the value from when we entered the detail view
    rightPanel.append('label').attr('class', 'block text-sm font-medium text-gray-700 mb-2').text('Starting Target Budget');
    const entryInteriorsData = state.interiorsEntryState || originalInteriorsData;
            const targetBudget = entryInteriorsData.target_value * entryInteriorsData.square_footage;
    rightPanel.append('div')
        .attr('id', 'target-budget-display')
        .attr('class', 'mb-6 p-3 bg-gray-100 rounded-md border text-lg font-semibold')
        .text(utils.formatCurrencyBig(targetBudget));
    
    rightPanel.append('h3').attr('class', 'text-lg font-bold mb-4 text-center').text('Target ($) vs Scenario ($)');

    const targetSelectedGrid = rightPanel.append('div').attr('class', 'grid grid-cols-2 gap-4 text-center mb-8');
    const selectedContainer = targetSelectedGrid.append('div');
    selectedContainer.append('div').attr('class', 'font-bold').text('Scenario');
    selectedContainer.append('div').attr('class', 'p-4 bg-green-200 text-green-800 rounded-lg mt-2')
        .html(`<div class="text-xl font-bold">${utils.formatCurrency(totalSf > 0 ? totalCost / totalSf : 0)}</div><div class="text-sm">$/SQFT</div>`);
    
    const targetContainer = targetSelectedGrid.append('div');
    targetContainer.append('div').attr('class', 'font-bold').text('Target');
    const targetCostPerSf = entryInteriorsData.square_footage > 0 ? targetBudget / entryInteriorsData.square_footage : 0;
    targetContainer.append('div').attr('class', 'p-4 bg-gray-800 text-white rounded-lg mt-2')
        .html(`<div class="text-xl font-bold">${utils.formatCurrency(targetCostPerSf, 0)}</div><div class="text-sm">$/SQFT</div>`);
    
    const stackedBarContainer = rightPanel.append('div').attr('id', 'interiors-stacked-bar');
    
    requestAnimationFrame(() => {
        const sbcNode = d3.select('#interiors-stacked-bar').node();
        if (sbcNode) {
            renderStackedBar(interiorsData.breakdown, sbcNode, targetBudget);
        }
    });
}

function recalculateAndUpdate() {
    const interiorsData = state.currentData.phases.phase2.costOfWork.find(c => c.name === 'C Interiors');
    
    // Calculate total space type SF
    const totalSpaceTypeSf = interiorsData.breakdown.reduce((acc, item) => acc + item.sf, 0);
    
    // Calculate gross SF from efficiency if efficiency is being used to drive the calculation
    if (interiorsData.building_efficiency > 0) {
        const calculatedGrossSf = totalSpaceTypeSf / interiorsData.building_efficiency;
        state.currentData.projectAreaSF = calculatedGrossSf;
    }
    
    // Update the actual interiors square footage (this should equal totalSpaceTypeSf for our new simplified model)
    interiorsData.square_footage = totalSpaceTypeSf;

    const newTotalCost = interiorsData.breakdown.reduce((acc, item) => acc + (item.sf * item.cost), 0);
    if (interiorsData.square_footage > 0) {
        interiorsData.target_value = newTotalCost / interiorsData.square_footage;
    }

    renderInteriorsView();
    if(render) render();
}

function renderTreemapChart(interiorsData, container) {
    d3.select(container).select('svg').remove();

    const data = {
        name: 'C Interiors',
        children: interiorsData.breakdown.filter(d => d.sf > 0)
    };

    const containerWidth = container.getBoundingClientRect().width;
    if (containerWidth === 0) return;
    const height = 600;
    const width = containerWidth;

    const color = d3.scaleOrdinal(data.children.map(d => d.name), d3.schemeTableau10);

    const treemap = d3.treemap()
        .size([width, height])
        .padding(3)
        .round(true);

    const root = d3.hierarchy(data)
        .sum(d => d.sf)
        .sort((a, b) => b.value - a.value);

    treemap(root);

    const svg = d3.select(container)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .style('font', '16px sans-serif');

    const leaf = svg.selectAll("g")
        .data(root.leaves())
        .join("g")
        .attr("transform", d => `translate(${d.x0},${d.y0})`);

    leaf.append("rect")
        .attr("fill", d => color(d.data.name))
        .attr("fill-opacity", 0.7)
        .attr("width", d => d.x1 - d.x0)
        .attr("height", d => d.y1 - d.y0);

    const fo = leaf.append("foreignObject")
        .attr('x', 5)
        .attr('y', 5)
        .attr("width", d => d.x1 - d.x0 - 10)
        .attr("height", d => d.y1 - d.y0 - 10)
        .style("overflow", "hidden")
        .style("display", d => (d.x1 - d.x0 < 60 || d.y1 - d.y0 < 40) ? "none" : "block");

    fo.append("xhtml:div")
        .style("color", "white")
        .style("text-shadow", "1px 1px 2px black")
        .html(d => `
            <div style="font-weight: bold; margin-bottom: 4px;">${d.data.name}</div>
            <div>${d.data.sf.toLocaleString('en-US', { maximumFractionDigits: 0 })} SF</div>
            <div>${utils.formatCurrencyBig(d.data.sf * d.data.cost)}</div>
        `);
}

function renderStackedBar(data, container, targetBudget) {
    d3.select(container).select('svg').remove();
    
    const totalCost = data.reduce((acc, d) => acc + d.sf * d.cost, 0);

    const margin = { top: 20, right: 20, bottom: 30, left: 60 };
    const containerWidth = container.getBoundingClientRect().width;
    if (containerWidth === 0) return;
    const width = containerWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3.select(container)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

    const y = d3.scaleLinear()
        .domain([0, Math.max(totalCost, targetBudget) * 1.1])
        .range([height, 0]);

    svg.append("g").call(d3.axisLeft(y).ticks(5).tickFormat(d => utils.formatCurrencyBig(d)));

    const color = d3.scaleOrdinal(d3.schemeTableau10);
    const stack = d3.stack().keys(data.map(d => d.name));
    
    let y_pos = height;
    data.forEach((d, i) => {
        const cost = d.sf * d.cost;
        const barHeight = height - y(cost);
        svg.append('rect')
           .attr('x', width / 2)
           .attr('y', y_pos - barHeight)
           .attr('height', barHeight)
           .attr('width', 50)
           .attr('fill', color(i));
        y_pos -= barHeight;
    });

    // Target line
    svg.append('line')
       .attr('x1', 0)
       .attr('x2', width)
       .attr('y1', y(targetBudget))
       .attr('y2', y(targetBudget))
       .attr('stroke', 'red')
       .attr('stroke-dasharray', '4');
       
    svg.append('text')
        .attr('x', width)
        .attr('y', y(targetBudget))
        .attr('dy', -4)
        .attr('text-anchor', 'end')
        .attr('fill', 'red')
        .attr('font-size', '12px')
        .text(`Target: ${utils.formatCurrencyBig(targetBudget)}`);
}
