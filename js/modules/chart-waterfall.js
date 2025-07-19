/**
 * @file chart-waterfall.js
 * @description Renders the waterfall chart view.
 */
import { state } from './state.js';
import * as dom from './dom.js';
import * as ui from './ui.js';

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
            dy = parseFloat(text.attr("dy")),
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
 * Renders the Waterfall Chart view.
 * This chart shows how individual component absolute costs (cost * SF) add up.
 * It visualizes the original data and up to three snapshots side-by-side.
 */
export function renderWaterfallChart() {
    // Select the container for the waterfall chart and clear any previous SVG/chart content
    const container = d3.select("#waterfall-chart-container");
    container.html(""); // Clear previous chart

    // Set up chart margins and calculate the inner width and height for the drawing area
    const margin = { top: 20, right: 30, bottom: 80, left: 100 };
    const width = container.node().getBoundingClientRect().width - margin.left - margin.right;
    const height = 700 - margin.top - margin.bottom;

    // Create the SVG element and a group <g> translated by the margins
    const svg = container.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // --- Data Preparation ---

    // Compose the "Imported Data" series from the original phase 2 components
    const originalData = {
        name: "Imported Data",
        components: state.originalData.phases.phase2.components
    };

    // Combine the original data and all user-created snapshots into a single array of series
    const allSeriesData = [originalData, ...state.snapshots];

    // Extract the names of all series (e.g., "Imported Data", "Snapshot 1", etc.)
    const seriesNames = allSeriesData.map(d => d.name);

    // --- Main Data Structure for Rendering ---
    // For each component, build an array of values (one per series) with cumulative start/end for stacking
    const finalComponentData = [];
    let cumulativeValues = seriesNames.map(() => 0); // Track running totals for each series

    state.originalData.phases.phase2.components.forEach(c => {
        const component = { name: c.name, values: [] };
        seriesNames.forEach((seriesName, i) => {
            // Find the current series and the matching component by name
            const series = allSeriesData.find(s => s.name === seriesName);
            const compData = series.components.find(sc => sc.name === c.name);
            // Calculate the absolute cost for this component in this series
            const cost = compData.current_rom * compData.square_footage;
            // Store the start and end positions for the bar segment
            component.values.push({
                series: seriesName,
                start: cumulativeValues[i],
                end: cumulativeValues[i] + cost,
            });
            // Update the cumulative total for this series
            cumulativeValues[i] += cost;
        });
        finalComponentData.push(component);
    });

    // --- D3 Scales ---
    const x0 = d3.scaleBand()
        .range([0, width])
        .domain(finalComponentData.map(d => d.name))
        .padding(0.2);

    const x1 = d3.scaleBand()
        .domain(seriesNames)
        .range([0, x0.bandwidth()])
        .padding(0.05);

    const yMax = d3.max([d3.max(cumulativeValues), state.originalData.phases.phase2.totalProjectBudget]);
    const y = d3.scaleLinear()
        .domain([0, yMax * 1.05])
        .range([height, 0]);

    const color = d3.scaleOrdinal()
        .domain(seriesNames)
        .range(['#2563eb', '#db2777', '#f97316', '#84cc16']); // Blue, Pink, Orange, Green

    // --- D3 Axes ---
    svg.append("g")
        .attr("class", "waterfall-axis")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x0))
        .selectAll(".tick text")
        .call(wrap, x0.bandwidth());

    svg.append("g")
        .attr("class", "waterfall-axis")
        .call(d3.axisLeft(y).tickFormat(d => `$${(d / 1000000).toFixed(1)}M`));

    // --- D3 Bar Rendering ---
    const componentGroups = svg.selectAll(".component-group")
        .data(finalComponentData)
        .enter()
        .append("g")
        .attr("class", "component-group")
        .attr("transform", d => `translate(${x0(d.name)},0)`);

    componentGroups.selectAll("rect")
        .data(d => d.values)
        .enter().append("rect")
        .attr("class", "waterfall-bar")
        .attr("x", d => x1(d.series))
        .attr("y", d => y(d.end))
        .attr("height", d => y(d.start) - y(d.end))
        .attr("width", x1.bandwidth())
        .attr("fill", d => color(d.series));

    // --- D3 Connector Line Rendering ---
    seriesNames.forEach((seriesName, i) => {
        const seriesData = finalComponentData.map(d => d.values[i]);
        svg.selectAll(`.connector-${i}`)
            .data(seriesData.filter((d, j) => j < seriesData.length - 1))
            .enter()
            .append("line")
            .attr("class", "connector")
            .attr("x1", (d, j) => x0(finalComponentData[j].name) + x1(d.series) + x1.bandwidth())
            .attr("y1", d => y(d.end))
            .attr("x2", (d, j) => x0(finalComponentData[j + 1].name) + x1(d.series))
            .attr("y2", d => y(d.end))
            .style("stroke", color(seriesName));
    });

    // --- GMP Line ---
    const gmpValue = state.originalData.phases.phase2.totalProjectBudget;
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

    // --- Legend ---
    const legendContainer = d3.select(dom.waterfallLegend);
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
                    renderWaterfallChart();
                }
            }
        });
    
    legendItems.filter(d => d !== 'Imported Data').classed('cursor-pointer', true);

    // Content inside legend item (color and text)
    const legendContent = legendItems.append('div')
        .attr('class', 'legend-content flex items-center gap-2');

    legendContent.append("div")
        .attr("class", "w-4 h-4")
        .style("background-color", d => color(d));

    legendContent.append("span")
        .attr("class", "font-medium")
        .text(d => d);

    // Delete overlay for deletable items
    legendItems.filter(d => d !== 'Imported Data')
        .append('div')
        .attr('class', 'delete-overlay absolute inset-0 flex items-center justify-center font-bold text-white')
        .text('DELETE');
} 