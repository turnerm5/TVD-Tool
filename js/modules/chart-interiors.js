/**
 * @file chart-interiors.js
 * @description Renders the interiors breakdown view and handles its interactions.
 */

import { state } from './state.js';
import * as dom from './dom.js';
import * as utils from './utils.js';

let render, handleInteriorsSfChange;
export function setDependencies(fns) {
    render = fns.render;
    handleInteriorsSfChange = fns.handleInteriorsSfChange;
}

export function renderInteriorsView() {
    const interiorsData = state.currentData.phases.phase2.components.find(c => c.name === 'C - Interiors');
    const originalInteriorsData = state.originalData.phases.phase2.components.find(c => c.name === 'C - Interiors');

    if (!interiorsData || !interiorsData.breakdown) {
        dom.interiorsView.innerHTML = `<div class="p-4"><p>No interiors data available.</p></div>`;
        return;
    }

    interiorsData.square_footage = state.currentData.projectAreaSF * interiorsData.building_efficiency;
    interiorsData.breakdown.forEach(item => {
        item.sf = interiorsData.square_footage * item.percentage;
    });

    const totalSf = interiorsData.square_footage;
    const totalCost = interiorsData.breakdown.reduce((acc, item) => acc + item.sf * item.cost, 0);

    const container = d3.select(dom.interiorsView);
    container.html(''); 

    const grid = container.append('div').attr('class', 'grid grid-cols-12 gap-8 p-4');

    const leftPanel = grid.append('div').attr('class', 'col-span-2');
    leftPanel.append('h3').attr('class', 'text-lg font-bold mb-4').text('Filters');
    
    leftPanel.append('label').attr('class', 'block text-sm font-medium text-gray-700').text('Building Size');
    leftPanel.append('input')
        .attr('type', 'text')
        .attr('id', 'building-size-input')
        .attr('class', 'mt-1 p-2 w-full bg-white rounded-md border')
        .attr('value', state.currentData.projectAreaSF.toLocaleString('en-US'))
        .on('change', function() {
            const newSize = +this.value.replace(/,/g, '');
            if (!isNaN(newSize)) {
                state.currentData.projectAreaSF = newSize;
                recalculateAndUpdate();
            }
        });

    leftPanel.append('label').attr('class', 'block text-sm font-medium text-gray-700 mt-4').text('Building Efficiency');
    leftPanel.append('div')
        .attr('class', 'flex items-center mt-1')
        .append('input')
            .attr('type', 'number')
            .attr('id', 'building-efficiency-input')
            .attr('class', 'p-2 w-full bg-white rounded-md border')
            .attr('value', (interiorsData.building_efficiency * 100).toFixed(2))
            .attr('min', 0)
            .attr('max', 100)
            .attr('step', 1)
            .on('change', function() {
                const newEfficiency = +this.value / 100;
                interiorsData.building_efficiency = newEfficiency;
                recalculateAndUpdate();
            })
        .select(function() { return this.parentNode; }) // get the parent flex container
        .append('span')
            .attr('class', 'ml-2 text-gray-500')
            .text('%');

    const targetBudget = originalInteriorsData.current_rom * totalSf;
    leftPanel.append('label').attr('class', 'block text-sm font-medium text-gray-700 mt-4').text('Initial Target Budget');
    leftPanel.append('div')
        .attr('id', 'target-budget-display')
        .attr('class', 'mt-1 p-2 bg-gray-100 rounded-md border')
        .text(utils.formatCurrency(targetBudget));

    leftPanel.append('h3').attr('class', 'text-lg font-bold my-4').text('Space Type Breakouts');
    const breakoutGrid = leftPanel.append('div').attr('class', 'grid grid-cols-1 gap-y-4');
    interiorsData.breakdown.forEach(item => {
        const itemContainer = breakoutGrid.append('div');
        const labelContainer = itemContainer.append('div').attr('class', 'flex items-center justify-between');
        labelContainer.append('label').attr('class', 'block text-sm font-medium').text(item.name);
        
        const lockIcon = labelContainer.append('div')
            .attr('class', 'lock-icon-interiors text-lg')
            .style('cursor', 'pointer')
            .style('opacity', state.lockedInteriorsBreakdown.has(item.name) ? 1 : 0.5)
            .text(state.lockedInteriorsBreakdown.has(item.name) ? '🔒' : '🔓')
            .on('click', () => {
                if (state.lockedInteriorsBreakdown.has(item.name)) {
                    state.lockedInteriorsBreakdown.delete(item.name);
                } else {
                    state.lockedInteriorsBreakdown.add(item.name);
                }
                renderInteriorsView();
            });

        const controls = itemContainer.append('div').attr('class', 'flex items-center gap-2');
        controls.append('span')
            .attr('class', 'w-16 text-right')
            .text(`${(item.percentage * 100).toFixed(2)}%`);

        controls.append('input')
            .attr('type', 'range')
            .attr('min', 0)
            .attr('max', 100)
            .attr('step', 0.01)
            .property('disabled', state.lockedInteriorsBreakdown.has(item.name))
            .attr('value', item.percentage * 100)
            .attr('class', 'w-full')
            .attr('data-name', item.name);
            
        const infoContainer = itemContainer.append('div')
            .attr('class', 'text-xs text-gray-500 text-right flex items-center justify-end gap-1');
            
        infoContainer.append('span')
            .text(`${utils.formatCurrencyBig(item.cost)}/SF |`);

        infoContainer.append('input')
            .attr('type', 'text')
            .attr('class', 'w-16 text-right bg-transparent')
            .attr('value', item.sf.toLocaleString('en-US', { maximumFractionDigits: 0 }))
            .on('change', function() {
                const newSf = parseFloat(this.value.replace(/,/g, ''));
                if (!isNaN(newSf) && handleInteriorsSfChange) {
                    handleInteriorsSfChange(item.name, newSf);
                }
            });
            
        infoContainer.append('span').text('Total SF');
    });

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
    rightPanel.append('h3').attr('class', 'text-lg font-bold mb-4 text-center').text('Target ($) vs Selected ($)');

    const targetSelectedGrid = rightPanel.append('div').attr('class', 'grid grid-cols-2 gap-4 text-center mb-8');
    const selectedContainer = targetSelectedGrid.append('div');
    selectedContainer.append('div').attr('class', 'font-bold').text('Selected');
    selectedContainer.append('div').attr('class', 'p-4 bg-green-200 text-green-800 rounded-lg mt-2')
        .html(`<div class="text-xl font-bold">${utils.formatCurrency(totalSf > 0 ? totalCost / totalSf : 0)}</div><div class="text-sm">$/SQFT</div>`);
    
    const targetContainer = targetSelectedGrid.append('div');
    targetContainer.append('div').attr('class', 'font-bold').text('Target');
    const targetCostPerSf = totalSf > 0 ? targetBudget / totalSf : 0;
     targetContainer.append('div').attr('class', 'p-4 bg-gray-800 text-white rounded-lg mt-2')
        .html(`<div class="text-xl font-bold">${utils.formatCurrency(targetCostPerSf, 0)}</div><div class="text-sm">$/SQFT</div>`);
    
    const stackedBarContainer = rightPanel.append('div').attr('id', 'interiors-stacked-bar');
    
    requestAnimationFrame(() => {
        const sbcNode = d3.select('#interiors-stacked-bar').node();
        if (sbcNode) {
            renderStackedBar(interiorsData.breakdown, sbcNode, targetBudget);
        }
    });
        
    container.selectAll('input[type="range"]').on('change', function() {
        handleSliderChange(this, interiorsData);
    });
}

function handleSliderChange(slider, interiorsData) {
    const componentName = slider.dataset.name;
    const newPercentage = +slider.value / 100;

    const changedItem = interiorsData.breakdown.find(d => d.name === componentName);
    const unlockedItems = interiorsData.breakdown.filter(d => !state.lockedInteriorsBreakdown.has(d.name) && d.name !== componentName);
    
    const oldPercentage = changedItem.percentage;
    const delta = newPercentage - oldPercentage;
    changedItem.percentage = newPercentage;

    const totalUnlockedPercentage = unlockedItems.reduce((acc, item) => acc + item.percentage, 0);

    if (totalUnlockedPercentage > 0) {
        unlockedItems.forEach(item => {
            const proportion = item.percentage / totalUnlockedPercentage;
            item.percentage -= delta * proportion;
            if (item.percentage < 0) item.percentage = 0;
        });
    }
    
    const currentTotalPercentage = interiorsData.breakdown.reduce((acc, item) => acc + item.percentage, 0);
    if (currentTotalPercentage > 0) {
        const normalizationFactor = 1 / currentTotalPercentage;
        interiorsData.breakdown.forEach(item => {
            item.percentage *= normalizationFactor;
        });
    }
    
    recalculateAndUpdate();
}

function recalculateAndUpdate() {
    const interiorsData = state.currentData.phases.phase2.components.find(c => c.name === 'C - Interiors');
    
    interiorsData.square_footage = state.currentData.projectAreaSF * interiorsData.building_efficiency;
    interiorsData.breakdown.forEach(item => {
        item.sf = interiorsData.square_footage * item.percentage;
    });

    const newTotalCost = interiorsData.breakdown.reduce((acc, item) => acc + (item.sf * item.cost), 0);
    if (interiorsData.square_footage > 0) {
        interiorsData.current_rom = newTotalCost / interiorsData.square_footage;
    }

    renderInteriorsView();
    if(render) render();
}

function renderTreemapChart(interiorsData, container) {
    d3.select(container).select('svg').remove();

    const data = {
        name: 'C - Interiors',
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
