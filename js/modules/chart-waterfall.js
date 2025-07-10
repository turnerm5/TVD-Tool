/**
 * @file chart-waterfall.js
 * @description Renders the waterfall chart view.
 */
import { state } from './state.js';

/**
 * Renders the Waterfall Chart view.
 * This chart shows how individual component absolute costs (cost * SF) add up.
 * It visualizes both 'target' and 'current' values side-by-side.
 */
export function renderWaterfallChart() {
    const container = d3.select("#waterfall-chart-container");
    container.html(""); // Clear previous chart

    // Define chart dimensions and margins
    const margin = { top: 20, right: 30, bottom: 50, left: 100 }; // Reduced bottom margin for horizontal labels
    const width = container.node().getBoundingClientRect().width - margin.left - margin.right;
    const height = 700 - margin.top - margin.bottom;

    const svg = container.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const phaseData = state.currentData.phases[state.currentPhase];
    const components = phaseData.components;
    
    // Process data for the waterfall structure.
    // We calculate two cumulative totals: one for target costs and one for current costs.
    let cumulativeTarget = 0;
    let cumulativeCurrent = 0;
    const originalPhaseData = state.originalData.phases[state.currentPhase];
    const data = components.map(c => {
        const originalComponent = originalPhaseData.components.find(oc => oc.name === c.name);
        const snapshotValue = originalComponent ? originalComponent.current_rom : 0;
        const targetValue = snapshotValue * c.square_footage;
        const currentValue = c.current_rom * c.square_footage;
        const d = {
            name: c.name,
            target_start: cumulativeTarget,
            target_end: cumulativeTarget + targetValue,
            current_start: cumulativeCurrent,
            current_end: cumulativeCurrent + currentValue,
        };
        cumulativeTarget += targetValue;
        cumulativeCurrent += currentValue;
        return d;
    });

    // --- D3 Axes ---
    // The primary X-axis for component names.
    const x0 = d3.scaleBand()
        .range([0, width])
        .domain(data.map(d => d.name))
        .padding(0.2);
    
    // The secondary X-axis to position the 'target' and 'current' bars within each component's band.
    const x1 = d3.scaleBand()
        .domain(['target', 'current'])
        .range([0, x0.bandwidth()])
        .padding(0.05);

    svg.append("g")
        .attr("class", "waterfall-axis")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x0))
        .selectAll("text")
        // Removed rotation transform
        .style("text-anchor", "middle");

    // The Y-axis for cost values. The domain is scaled to fit the largest value.
    const yMax = Math.max(cumulativeTarget, cumulativeCurrent, phaseData.totalProjectBudget);
    const y = d3.scaleLinear()
        .domain([0, yMax * 1.05]) // Add 5% padding to the top
        .range([height, 0]);

    svg.append("g")
        .attr("class", "waterfall-axis")
        .call(d3.axisLeft(y).tickFormat(d => `$${(d / 1000000).toFixed(1)}M`)); // Format ticks as millions

    // --- D3 Bar Rendering ---
    // Create a group for each component to hold the two bars.
    const componentGroups = svg.selectAll(".component-group")
        .data(data)
        .enter()
        .append("g")
        .attr("class", "component-group")
        .attr("transform", d => `translate(${x0(d.name)},0)`);

    // Render the green 'target' bars.
    componentGroups.append("rect")
        .attr("class", "waterfall-bar target")
        .attr("x", d => x1('target'))
        .attr("y", d => y(d.target_end))
        .attr("height", d => y(d.target_start) - y(d.target_end))
        .attr("width", x1.bandwidth());
        
    // Render the blue 'current' bars.
    componentGroups.append("rect")
        .attr("class", "waterfall-bar current")
        .attr("x", d => x1('current'))
        .attr("y", d => y(d.current_end))
        .attr("height", d => y(d.current_start) - y(d.current_end))
        .attr("width", x1.bandwidth());

    // --- GMP Line ---
    const gmpValue = phaseData.totalProjectBudget;
    svg.append("line")
        .attr("class", "gmp-line")
        .attr("x1", 0)
        .attr("x2", width)
        .attr("y1", y(gmpValue))
        .attr("y2", y(gmpValue));
    
    svg.append("text")
        .attr("class", "gmp-label")
        .attr("x", width)
        .attr("y", y(gmpValue))
        .attr("dy", -4)
        .attr("text-anchor", "end")
        .text("GMP");

    // --- D3 Connector Line Rendering ---
    // Render connector lines for the 'target' waterfall.
    svg.selectAll(".connector-target")
        .data(data.filter((d, i) => i < data.length - 1))
        .enter()
        .append("line")
        .attr("class", "connector")
        .attr("x1", d => x0(d.name) + x1('target') + x1.bandwidth())
        .attr("y1", d => y(d.target_end))
        .attr("x2", d => x0(data[data.indexOf(d) + 1].name) + x1('target'))
        .attr("y2", d => y(d.target_end));
        
    // Render connector lines for the 'current' waterfall.
    svg.selectAll(".connector-current")
        .data(data.filter((d, i) => i < data.length - 1))
        .enter()
        .append("line")
        .attr("class", "connector")
        .attr("x1", d => x0(d.name) + x1('current') + x1.bandwidth())
        .attr("y1", d => y(d.current_end))
        .attr("x2", d => x0(data[data.indexOf(d) + 1].name) + x1('current'))
        .attr("y2", d => y(d.current_end));
} 