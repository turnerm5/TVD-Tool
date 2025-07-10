/**
 * @file tvd.js
 * @description Core script for the Interactive Target Value Design (TVD) Tool.
 * This script handles all application logic, including data loading, state management,
 * D3.js chart and table rendering, user interactions (drag, click, input), and file exports.
 */

// --- GLOBAL STATE AND CONSTANTS ---

/** @type {object | null} - Stores the original, unmodified data loaded from the file. Used for the 'Reset' functionality. */
let originalData = null;
/** @type {object | null} - Stores the current, potentially modified data that the user is interacting with. */
let currentData = null;
/** @type {number} - The maximum value for the Y-axis on the slider chart, calculated dynamically from the data. */
let yDomainMax = 100;
/** @type {('phase1'|'phase2')} - The currently selected project phase. */
let currentPhase = 'phase1';
/** @type {('benchmarks'|'program'|'chart'|'table'|'waterfall')} - The currently active view. */
let currentView = 'benchmarks';
/** @type {string | null} - The ID of the selected benchmark project for the detail view. */
let selectedBenchmark = null;

/** @type {Set<string>} - Stores unique keys for locked components (e.g., "phase1-General Conditions"). */
let lockedComponents = new Set();

// --- DOM ELEMENT REFERENCES ---
// Caching DOM elements for performance and easier access.
const splashScreen = document.getElementById('splash-screen');
const mainContent = document.getElementById('main-content');
const chartContainer = d3.select("#chart-container");
const yAxisLabelsContainer = d3.select("#y-axis-labels-container");
const resetButton = document.getElementById('reset-button');
const startOverBtn = document.getElementById('start-over-btn');
const exportJsonBtn = document.getElementById('export-json-btn');
const useSampleDataBtn = document.getElementById('use-sample-data-btn');
const exportCsvBtn = document.getElementById('export-csv-btn');
const downloadTemplateBtn = document.getElementById('download-template-btn');
const fileDropZone = document.getElementById('file-drop-zone');
const fileInput = document.getElementById('file-input');
const fileNameDisplay = document.getElementById('file-name');
const phase1Btn = document.getElementById('phase1-btn');
const phase2Btn = document.getElementById('phase2-btn');
const chartViewBtn = document.getElementById('chart-view-btn');
const programViewBtn = document.getElementById('program-view-btn');
const benchmarksViewBtn = document.getElementById('benchmarks-view-btn');
const waterfallViewBtn = document.getElementById('waterfall-view-btn');
const mainChart = document.getElementById('main-chart');
const programView = document.getElementById('program-view');
const benchmarksView = document.getElementById('benchmarks-view');
const waterfallView = document.getElementById('waterfall-view');
const phaseSelector = document.getElementById('phase-selector');
const summaryPanel = document.getElementById('summary-panel');
const legend = document.getElementById('legend');
const waterfallLegend = document.getElementById('waterfall-legend');
const maximizeBtn = document.getElementById('maximize-gmp-btn');

// --- D3 SCALES AND FORMATTERS ---

/**
 * D3 linear scale for the Y-axis of the slider chart.
 * The domain is set dynamically in `loadData`. The range is set in `renderChart`.
 */
const yScale = d3.scaleLinear().domain([0, yDomainMax]);

/**
 * Formats a number into a currency string (e.g., $123.45).
 * @param {number} d - The number to format.
 * @returns {string} The formatted currency string.
 */
const formatCurrency = (d) => `$${d.toFixed(2)}`;

/**
 * Formats a large number into a currency string with no decimal places (e.g., $1,234,567).
 * @param {number} d - The number to format.
 * @returns {string} The formatted currency string.
 */
const formatCurrencyBig = (d) => `$${Math.round(d).toLocaleString('en-US')}`;

/**
 * Formats a number to a string with thousands separators.
 * @param {number} d - The number to format.
 * @returns {string} The formatted number string.
 */
const formatNumber = (d) => d.toLocaleString('en-US');

// --- VIEW MANAGEMENT ---

/**
 * Hides the main application content and shows the splash screen.
 */
function showSplashScreen() {
    mainContent.style.display = 'none';
    splashScreen.style.display = 'flex';
}

/**
 * Hides the splash screen and shows the main application content, then triggers a render.
 */
function showMainContent() {
    splashScreen.style.display = 'none';
    mainContent.style.display = 'block';
    // Use requestAnimationFrame to ensure the layout is painted before rendering D3 charts.
    window.requestAnimationFrame(render);
}

// --- MAIN RENDER FUNCTION ---

/**
 * The core rendering function for the application. It is called whenever the state changes.
 * It manages which view is visible and calls the appropriate rendering function for that view.
 * It also updates the phase selector buttons and the summary panel.
 */
function render() {
    if (!currentData) return;

    // --- 1. Hide all views and deactivate all buttons ---
    mainChart.classList.add('hidden');
    programView.classList.add('hidden');
    benchmarksView.classList.add('hidden');
    waterfallView.classList.add('hidden');
    phaseSelector.classList.add('hidden');
    legend.classList.add('hidden');
    waterfallLegend.classList.add('hidden');
    maximizeBtn.classList.add('hidden');

    chartViewBtn.classList.remove('active');
    programViewBtn.classList.remove('active');
    benchmarksViewBtn.classList.remove('active');
    waterfallViewBtn.classList.remove('active');

    // --- 2. Show the active view and call its render function ---
    if (currentView === 'chart') {
        mainChart.classList.remove('hidden');
        phaseSelector.classList.remove('hidden');
        legend.classList.remove('hidden');
        maximizeBtn.classList.remove('hidden');
        chartViewBtn.classList.add('active');
        renderChart();
        renderYAxisLabels();
    } else if (currentView === 'program') {
        programView.classList.remove('hidden');
        programViewBtn.classList.add('active');
        renderProgramView();
    } else if (currentView === 'benchmarks') {
        benchmarksView.classList.remove('hidden');
        benchmarksViewBtn.classList.add('active');
        renderBenchmarksView();
    } else if (currentView === 'waterfall') {
        waterfallView.classList.remove('hidden');
        phaseSelector.classList.remove('hidden');
        waterfallLegend.classList.remove('hidden');
        waterfallViewBtn.classList.add('active');
        renderWaterfallChart();
    }

    // --- 3. Update Phase button styles ---
    if (currentPhase === 'phase1') {
        phase1Btn.classList.add('bg-blue-600', 'text-white');
        phase1Btn.classList.remove('bg-gray-300', 'text-gray-700', 'hover:bg-gray-400');
        phase2Btn.classList.add('bg-gray-300', 'text-gray-700', 'hover:bg-gray-400');
        phase2Btn.classList.remove('bg-blue-600', 'text-white');
    } else {
        phase2Btn.classList.add('bg-blue-600', 'text-white');
        phase2Btn.classList.remove('bg-gray-300', 'text-gray-700', 'hover:bg-gray-400');
        phase1Btn.classList.add('bg-gray-300', 'text-gray-700', 'hover:bg-gray-400');
        phase1Btn.classList.remove('bg-blue-600', 'text-white');
    }
    
    // --- 4. Update summary panel and reset button state ---
    updateSummary(); 
    resetButton.disabled = JSON.stringify(originalData) === JSON.stringify(currentData);
}

// --- SLIDER CHART RENDERING ---

/**
 * Renders the main interactive slider chart using D3.js.
 * This function uses the D3 enter/update/exit pattern to create and update the component columns.
 */
function renderChart() {
    const phaseComponents = currentData.phases[currentPhase].components;
    // Set the number of columns in the CSS grid layout.
    chartContainer.style("grid-template-columns", `repeat(${phaseComponents.length}, 1fr)`);
    // Set the output range for the y-scale based on the container's current height.
    yScale.range([chartContainer.node().clientHeight - parseFloat(chartContainer.style("padding-bottom")), 0]);
    
    // Bind data to the component columns. The key function (d.name) helps D3 track objects.
    const components = chartContainer.selectAll(".component-column").data(phaseComponents, d => d.name);
    
    // Remove any columns that are no longer in the data.
    components.exit().remove();

    // --- Create new elements for new data (the 'enter' selection) ---
    const enterGroup = components.enter().append("div").attr("class", "component-column");
    enterGroup.append("div").attr("class", "y-axis"); // The central grey line
    enterGroup.append("svg").attr("class", "benchmark-indicator-svg"); // SVG container for benchmark indicators
    enterGroup.append("div").attr("class", "benchmark-range"); // The light blue line indicating the benchmark range
    enterGroup.append("div").attr("class", "benchmark-cap benchmark-cap-low");
    enterGroup.append("div").attr("class", "benchmark-cap benchmark-cap-high");
    // enterGroup.append("div").attr("class", "target-value"); // The green target line - REMOVED
    enterGroup.append("div").attr("class", "ghost-rom"); // The semi-transparent bar showing the original value
    // The draggable "current ROM" bar.
    enterGroup.append("div").attr("class", "current-rom").call(d3.drag().on("start", dragStarted).on("drag", dragged).on("end", dragEnded));
    enterGroup.append("div").attr("class", "component-label");
    const valueLabelGroup = enterGroup.append("div").attr("class", "value-label-group");
    valueLabelGroup.append("div").attr("class", "current-value-label");
    valueLabelGroup.append("div").attr("class", "delta-label");
    enterGroup.append("div").attr("class", "lock-icon");

    // Merge the enter selection with the update selection.
    // All subsequent operations apply to both new and existing elements.
    const updateGroup = enterGroup.merge(components);
    
    // --- Update positions and styles of all elements ---
    updateGroup.select(".benchmark-range")
        .style("top", d => Math.min(yScale(d.benchmark_low), yScale(d.benchmark_high)) + "px")
        .style("height", d => Math.abs(yScale(d.benchmark_low) - yScale(d.benchmark_high)) + "px")
        .style("bottom", null);

    updateGroup.select(".benchmark-cap-low").style("top", d => yScale(d.benchmark_low) + "px").style("bottom", null);
    updateGroup.select(".benchmark-cap-high").style("top", d => yScale(d.benchmark_high) + "px").style("bottom", null);
    // updateGroup.select(".target-value").style("top", d => yScale(d.target_value) + "px").style("bottom", null); // REMOVED
    
    updateGroup.select(".current-rom")
        .style("top", d => yScale(d.current_rom) - 3 + "px")
        .style("bottom", null)
        .each(function(d) {
            const bar = d3.select(this);
            const isOutsideBenchmark = d.current_rom < d.benchmark_low || d.current_rom > d.benchmark_high;

            if (d.current_rom === 0) {
                bar.style("background", "none")
                   .style("border", "2px dashed #9ca3af") // gray-400
                   .classed('zero-rom-bar', true);
            } else {
                bar.style("background", isOutsideBenchmark ? '#dc2626' : '#1f2937') // Red if outside, dark grey if inside
                   .style("border", "none")
                   .classed('zero-rom-bar', false);
            }
        });
    
    // Create a map of original component values for quick lookup.
    const originalComponents = originalData.phases[currentPhase].components.reduce((acc, val) => ({ ...acc, [val.name]: val }), {});
    
    // Update labels and ghost bars for each component.
    updateGroup.each(function(d) {
        const original = originalComponents[d.name];
        if (!original) return;
        
        // Update the value labels
        const valueGroup = d3.select(this).select(".value-label-group");
        valueGroup.select(".current-value-label").text(formatCurrency(d.current_rom));
        valueGroup.style("top", yScale(d.current_rom) - 10 + "px").style("bottom", null);

        // Position the ghost bar
        const ghostBar = d3.select(this).select(".ghost-rom");
        ghostBar.style("top", yScale(original.current_rom) - 3 + "px").style("bottom", null);

        // Show/hide and update the delta label
        const deltaLabel = valueGroup.select(".delta-label");
        if (d.current_rom !== original.current_rom) {
            ghostBar.style("display", "block");
            const delta = d.current_rom - original.current_rom;
            const isOutsideBenchmark = d.current_rom < d.benchmark_low || d.current_rom > d.benchmark_high;
            deltaLabel.style("display", "block")
                .text(`${delta > 0 ? '+' : ''}${formatCurrency(delta)}`)
                .style("color", isOutsideBenchmark ? '#dc2626' : '#16a34a'); // Red if outside, green if inside
        } else {
            ghostBar.style("display", "none");
            deltaLabel.style("display", "none");
        }
    });

    updateGroup.select(".component-label").text(d => d.name);
    updateGroup.select(".lock-icon")
        .style('display', 'block')
        .style('opacity', d => {
            const key = `${currentPhase}-${d.name}`;
            return lockedComponents.has(key) ? 1 : 0.5;
        })
        .text(d => {
            const key = `${currentPhase}-${d.name}`;
            return lockedComponents.has(key) ? '🔒' : '🔓';
        })
        .on('click', (event, d) => {
            event.stopPropagation();
            const key = `${currentPhase}-${d.name}`;
            if (lockedComponents.has(key)) {
                lockedComponents.delete(key);
            } else {
                lockedComponents.add(key);
            }
            render();
        });

    // --- Render the benchmark indicators (A, B, C, D) within each column's SVG ---
    updateGroup.each(function(componentData) {
        const group = d3.select(this);
        const svg = group.select('.benchmark-indicator-svg');
        const benchmarkProjects = currentData.benchmarks || [];

        const indicators = svg.selectAll('.benchmark-indicator-group')
            .data(benchmarkProjects.filter(p => p.components.some(c => c.name === componentData.name)));

        indicators.exit().remove();

        const enterIndicators = indicators.enter().append('g')
            .attr('class', 'benchmark-indicator-group');
        
        enterIndicators.append('line').attr('class', 'benchmark-indicator-line');
        enterIndicators.append('circle').attr('class', 'benchmark-indicator-circle');
        enterIndicators.append('text').attr('class', 'benchmark-indicator-label');

        const mergedIndicators = enterIndicators.merge(indicators);

        mergedIndicators.each(function(d) {
            const benchmarkComp = d.components.find(c => c.name === componentData.name);
            if (!benchmarkComp) return;

            const yPos = yScale(benchmarkComp.cost);
            
            d3.select(this).select('.benchmark-indicator-line').attr('x1', '20%').attr('x2', '10%').attr('y1', yPos).attr('y2', yPos);
            d3.select(this).select('.benchmark-indicator-circle').attr('cx', '10%').attr('cy', yPos).attr('r', 6);
            d3.select(this).select('.benchmark-indicator-label').attr('x', '10%').attr('y', yPos).attr('dy', '0.35em').text(d.id);
        });
    });
}

/**
 * Renders the Benchmarks view.
 * This function handles the logic for displaying either the main grid of four projects
 * or the detailed view for a single selected project.
 */
function renderBenchmarksView() {
    const detailContainer = document.getElementById('benchmark-detail-container');
    const benchmarkGrid = document.querySelector('.benchmark-grid');
    const benchmarkCards = d3.selectAll('.benchmark-card');

    if (selectedBenchmark) {
        // --- Show Detail View ---
        benchmarksView.classList.add('detail-active');
        detailContainer.classList.remove('hidden');

        // Move the detail container inside the grid to become a flex item
        benchmarkGrid.appendChild(detailContainer);

        // Highlight the selected card and fade others
        benchmarkCards.classed('selected', false); // Clear all selections first
        d3.select(`#benchmark-card-${selectedBenchmark}`).classed('selected', true);


        // Find data for the selected project
        const projectData = currentData.benchmarks.find(p => p.id === selectedBenchmark);
        if (!projectData) return;

        // --- Render the detail table ---
        const detailContainerD3 = d3.select(detailContainer);
        detailContainerD3.html(''); // Clear previous content

        detailContainerD3.append('h3')
            .attr('class', 'text-2xl font-bold text-gray-800')
            .text(projectData.name);

        detailContainerD3.append('button')
            .attr('class', 'absolute top-0 right-0 mt-2 mr-2 text-2xl font-bold text-gray-500 hover:text-gray-800')
            .html('&times;')
            .on('click', () => {
                selectedBenchmark = null;
                render();
            });

        const table = detailContainerD3.append('table')
            .attr('class', 'benchmark-detail-table');

        const thead = table.append('thead');
        thead.append('tr').selectAll('th')
            .data(['Component', 'Cost ($/SF)'])
            .enter()
            .append('th')
            .text(d => d);

        const tbody = table.append('tbody');
        const rows = tbody.selectAll('tr')
            .data(projectData.components)
            .enter()
            .append('tr');

        rows.append('td').text(d => d.name);
        rows.append('td').text(d => formatCurrency(d.cost));

    } else {
        // --- Show Grid View ---
        benchmarksView.classList.remove('detail-active');
        detailContainer.classList.add('hidden');
        benchmarkCards.classed('selected', false);

        // Move the detail container back to its original position
        benchmarksView.appendChild(detailContainer);
    }
}


// --- UI EVENT HANDLERS ---

/**
 * Handles changes to the square footage inputs in the Program View table.
 * @param {Event} event - The input change event.
 */
function handleSquareFootageCellChange(event) {
    const input = event.target;
    // Remove commas before parsing to handle formatted numbers.
    const newValue = parseFloat(input.value.replace(/,/g, ''));
    const phaseKey = input.dataset.phase;
    const componentName = input.dataset.name;

    const component = currentData.phases[phaseKey].components.find(c => c.name === componentName);
    if (component) {
        component.square_footage = newValue;
        render(); // Rerender to update dependent views like the waterfall chart.
    }
}

// --- D3 CHART RENDERING FUNCTIONS ---

/**
 * Renders the Waterfall Chart view.
 * This chart shows how individual component absolute costs (cost * SF) add up.
 * It visualizes both 'target' and 'current' values side-by-side.
 */
function renderWaterfallChart() {
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

    const phaseData = currentData.phases[currentPhase];
    const components = phaseData.components;
    
    // Process data for the waterfall structure.
    // We calculate two cumulative totals: one for target costs and one for current costs.
    let cumulativeTarget = 0;
    let cumulativeCurrent = 0;
    const originalPhaseData = originalData.phases[currentPhase];
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

/**
 * Renders the main data program view with detailed component information.
 */
function renderProgramView() {
    d3.select(programView).select('table').remove();

    const tableData = [];
    
    // Flatten data from both phases into a single structure for the table.
    const p1Components = currentData.phases.phase1.components.sort((a, b) => a.name.localeCompare(b.name));
    if (p1Components.length > 0) {
        tableData.push({ type: 'header', name: 'Phase 1' });
        p1Components.forEach(c => tableData.push({ ...c, type: 'component', dataPhase: 'phase1' }));
    }

    const p2Components = currentData.phases.phase2.components.sort((a, b) => a.name.localeCompare(b.name));
    if (p2Components.length > 0) {
        tableData.push({ type: 'header', name: 'Phase 2' });
        p2Components.forEach(c => tableData.push({ ...c, type: 'component', dataPhase: 'phase2' }));
    }

    // Create Table
    const table = d3.select(programView).append('table').attr('class', 'min-w-full divide-y divide-gray-200');

    // Create Header
    const thead = table.append('thead').attr('class', 'bg-gray-50');
    thead.append('tr').selectAll('th')
        .data(['Lock', 'Component', 'Square Footage', 'Benchmark Low ($/sf)', 'Benchmark High ($/sf)', 'Starting ROM ($/sf)', 'Scenario ROM ($/sf)'])
        .enter().append('th')
        .attr('class', 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider')
        .text(d => d);

    // Create Body
    const tbody = table.append('tbody');
    const rows = tbody.selectAll('tr').data(tableData).enter().append('tr');

    rows.each(function(d) {
        const row = d3.select(this);
        if (d.type === 'header') {
            row.attr('class', 'bg-gray-100');
            row.append('td').attr('colspan', 7).attr('class', 'py-2 px-6 text-sm font-bold text-gray-700').text(d.name);
        } else {
            const isOutsideBenchmark = d.current_rom < d.benchmark_low || d.current_rom > d.benchmark_high;
            
            if (d.current_rom === 0 || d.square_footage === 0) {
                row.attr('class', 'zero-value-row');
            } else {
                row.attr('class', 'bg-white').classed('benchmark-warning', isOutsideBenchmark);
            }

            const lockKey = `${d.dataPhase}-${d.name}`;
            row.append('td').attr('class', 'py-4 px-2 text-center text-sm align-middle')
                .append('span').attr('class', 'lock-icon cursor-pointer')
                .style('opacity', lockedComponents.has(lockKey) ? 1 : 0.5)
                .text(lockedComponents.has(lockKey) ? '🔒' : '🔓')
                .on('click', (event, d_inner) => {
                    const key = `${d_inner.dataPhase}-${d_inner.name}`;
                    if (lockedComponents.has(key)) {
                        lockedComponents.delete(key);
                    } else {
                        lockedComponents.add(key);
                    }
                    render();
                });

            row.append('td').attr('class', 'py-4 px-6 text-sm font-medium text-gray-900 whitespace-nowrap').text(d.name);
            
            // Square Footage (editable)
            row.append('td').attr('class', 'py-4 px-6 text-sm text-gray-500 whitespace-nowrap editable-cell')
                .append('input').attr('type', 'text').attr('class', 'w-full text-center')
                .attr('value', d.square_footage.toLocaleString('en-US'))
                .attr('data-phase', d.dataPhase)
                .attr('data-name', d.name)
                .on('change', handleSquareFootageCellChange);

            row.append('td').attr('class', 'py-4 px-6 text-sm text-gray-500 whitespace-nowrap text-center').text(formatCurrency(d.benchmark_low));
            row.append('td').attr('class', 'py-4 px-6 text-sm text-gray-500 whitespace-nowrap text-center').text(formatCurrency(d.benchmark_high));
            
            // Snapshot
            const originalComponent = originalData.phases[d.dataPhase].components.find(c => c.name === d.name);
            const snapshotValue = originalComponent ? originalComponent.current_rom : 0;
            row.append('td').attr('class', 'py-4 px-6 text-sm text-gray-500 whitespace-nowrap text-center').text(formatCurrency(snapshotValue));

            // Current (editable)
            row.append('td').attr('class', 'py-4 px-6 text-sm text-gray-500 whitespace-nowrap editable-cell')
                .append('input').attr('type', 'number').attr('class', 'w-full text-center')
                .attr('value', d.current_rom.toFixed(2))
                .attr('step', 0.01)
                .attr('data-phase', d.dataPhase)
                .attr('data-name', d.name)
                .on('change', handleCurrentRomCellChange);
        }
    });
}

/**
 * Renders the Y-axis labels for the main slider chart.
 */
function renderYAxisLabels() {
    yAxisLabelsContainer.html('');
    const ticks = yScale.ticks(10);
    ticks.forEach(tick => {
        yAxisLabelsContainer.append('div')
            .style('position', 'absolute')
            .style('top', `${yScale(tick)}px`)
            .style('transform', 'translateY(-50%)')
            .text(`$${tick}`);
    });
}

// --- CORE LOGIC & DATA MANIPULATION ---

/**
 * Distributes cost changes across unlocked components.
 * When a component's value is changed, this function calculates the delta
 * and distributes the inverse of that delta proportionally across all other unlocked components.
 * @param {object} changedComponent - The component object that was directly modified.
 * @param {number} newValue - The new `current_rom` value for the changed component.
 * @param {string} phaseKey - The key for the current phase ('phase1' or 'phase2').
 */
function applyChangeAndBalance(changedComponent, newValue, phaseKey) {
    const phase = currentData.phases[phaseKey];

    // 1. Calculate the initial change in absolute cost from the user's action.
    const originalRom = changedComponent.current_rom;
    const newRom = Math.max(0, newValue); // Ensure new value isn't negative
    const initialCostChange = (newRom - originalRom) * changedComponent.square_footage;

    if (Math.abs(initialCostChange) < 0.01) return;

    // 2. Identify which components can absorb the change.
    const unlockedComponents = phase.components.filter(c => {
        const key = `${phaseKey}-${c.name}`;
        return c !== changedComponent && !lockedComponents.has(key) && c.square_footage > 0
    });

    // If no components can absorb the change, just apply it and let the total cost drift.
    if (unlockedComponents.length === 0) {
        changedComponent.current_rom = newRom;
        render();
        return;
    }

    // 3. Set the target component to its new value.
    changedComponent.current_rom = newRom;

    // 4. Calculate the total cost that needs to be absorbed by the other components.
    const costToAbsorb = -initialCostChange;

    // 5. Distribute this cost change, handling cases where components bottom out at 0.
    // This loop ensures that if one component hits $0/SF, the remaining cost is
    // redistributed among the other available components.
    let remainingCostToAbsorb = costToAbsorb;
    let componentsAvailableToAbsorb = [...unlockedComponents];
    let iterations = 0; // Safety break to prevent infinite loops

    while (Math.abs(remainingCostToAbsorb) > 0.01 && componentsAvailableToAbsorb.length > 0 && iterations < 10) {
        const costShare = remainingCostToAbsorb / componentsAvailableToAbsorb.length;
        remainingCostToAbsorb = 0; // Reset for this iteration

        const nextComponentsAvailable = [];

        componentsAvailableToAbsorb.forEach(comp => {
            const currentCompRom = comp.current_rom;
            const sf = comp.square_footage;
            const romChangeForComp = costShare / sf;
            const newCompRom = currentCompRom + romChangeForComp;

            if (newCompRom < 0) {
                // This component can't absorb its full share. Absorb what it can down to 0.
                const absorbedCost = -currentCompRom * sf;
                remainingCostToAbsorb += (costShare - absorbedCost); // Add the un-absorbed amount to the remainder.
                comp.current_rom = 0;
            } else {
                // This component can absorb its full share for this iteration.
                comp.current_rom = newCompRom;
                nextComponentsAvailable.push(comp); // This component is still available for future adjustments.
            }
        });
        
        componentsAvailableToAbsorb = nextComponentsAvailable;
        iterations++;
    }

    // 6. If any cost remains un-absorbed (because all other components hit 0),
    // apply it back to the originally changed component to maintain the total budget.
    if (Math.abs(remainingCostToAbsorb) > 0.01 && changedComponent.square_footage > 0) {
        const leftoverRomChange = remainingCostToAbsorb / changedComponent.square_footage;
        changedComponent.current_rom += leftoverRomChange;
        changedComponent.current_rom = Math.max(0, changedComponent.current_rom);
    }

    render();
}

/**
 * Handles the 'change' event from the editable cells in the main data table.
 * @param {Event} event - The input change event.
 */
function handleCurrentRomCellChange(event) {
    const input = event.target;
    const newValue = parseFloat(input.value);
    const phaseKey = input.dataset.phase;
    const componentName = input.dataset.name;

    const component = currentData.phases[phaseKey].components.find(c => c.name === componentName);
    if (component) {
        applyChangeAndBalance(component, newValue, phaseKey);
    }
}

// --- DRAG-AND-DROP LOGIC ---

/**
 * d3.drag 'start' event handler.
 * When dragging starts, it locks the component being dragged so it doesn't auto-balance.
 * @param {Event} event - The d3 drag event.
 * @param {object} d - The data object for the dragged element.
 */
function dragStarted(event, d) { 
    d3.select(this).raise().classed("active", true); 
    const key = `${currentPhase}-${d.name}`;
    if (!lockedComponents.has(key)) { 
        lockedComponents.add(key);
        render(); // Re-render to show the lock immediately
    } 
}

/**
 * d3.drag 'drag' event handler.
 * As the user drags, it converts the mouse's Y position to a new ROM value and applies the change.
 * @param {Event} event - The d3 drag event.
 * @param {object} d - The data object for the dragged element.
 */
function dragged(event, d) {
    const newRomValue = Math.max(0, Math.min(yDomainMax, yScale.invert(event.y)));
    applyChangeAndBalance(d, newRomValue, currentPhase);
}

/**
 * d3.drag 'end' event handler.
 * @param {Event} event - The d3 drag event.
 * @param {object} d - The data object for the dragged element.
 */
function dragEnded() { d3.select(this).classed("active", false); }

/**
 * Balances the budget by adjusting unlocked components.
 * Proportionally adjusts the 'current_rom' of all unlocked components in the current phase
 * to make the total 'Scenario  ROM' equal to the 'Total Project Budget' (with a small buffer).
 * This function works whether the current total is over or under budget.
 */
function balanceToGmp() {
    const phaseData = currentData.phases[currentPhase];
    const budget = phaseData.totalProjectBudget;
    const currentTotalCost = d3.sum(phaseData.components, d => d.current_rom * d.square_footage);

    // If we are already at the target (within the $1 buffer), do nothing.
    if (Math.abs(budget - currentTotalCost) <= 1) {
        console.log("Scenario ROM is already balanced to GMP. No action taken.");
        return;
    }

    // Subtract a small buffer ($100.00) to prevent rounding errors from exceeding the budget.
    const delta = budget - currentTotalCost - 150;
    const unlockedComponents = phaseData.components.filter(c => {
        const key = `${currentPhase}-${c.name}`;
        return !lockedComponents.has(key);
    });

    if (unlockedComponents.length === 0) {
        console.warn("No unlocked components to adjust.");
        // We could add a user-facing alert here if desired.
        return;
    }

    const unlockedTotalCost = d3.sum(unlockedComponents, d => d.current_rom * d.square_footage);

    // Avoid division by zero if unlocked components have no cost.
    if (unlockedTotalCost <= 0) {
        console.warn("Unlocked components have a total cost of zero, cannot proportionally adjust.");
        return;
    }

    // Calculate the scaling factor and apply it to each unlocked component.
    const scalingFactor = 1 + (delta / unlockedTotalCost);
    unlockedComponents.forEach(component => {
        // We round the result to 2 decimal places to avoid floating point inaccuracies.
        component.current_rom = parseFloat((component.current_rom * scalingFactor).toFixed(2));
    });

    // Refresh the UI to reflect the changes.
    renderChart();
    updateSummary();
    if (document.getElementById('program-view').style.display !== 'none') {
        renderProgramView();
    }
    // After adjusting, the "Reset to Original" button should be enabled.
    document.getElementById('reset-button').disabled = false;
}

/**
 * Sets the current phase of the application (e.g., 'phase1' or 'phase2').
 * @param {string} phase - The phase to set as active.
 */
function setCurrentPhase(phase) {
    currentPhase = phase;
    render();
}

/**
 * Switches the active view of the application (e.g., 'chart', 'table', 'benchmarks', 'program', 'waterfall').
 * @param {string} viewId - The ID of the button that was clicked.
 */
function switchView(viewId) {
    // Hide all views and deactivate all buttons
    mainChart.style.display = 'none';
    tableView.style.display = 'none';
    programView.style.display = 'none';
    waterfallView.style.display = 'none';
    benchmarksView.style.display = 'none';
    legend.style.display = 'none';
    waterfallLegend.style.display = 'none';
    document.getElementById('maximize-gmp-btn').style.display = 'none';
    phaseSelector.style.display = 'flex'; // Always show phase selector for now
    summaryPanel.style.display = 'none'; // Hide summary panel by default

    // Deactivate all view buttons
    chartViewBtn.classList.remove('active');
    tableViewBtn.classList.remove('active');
    benchmarksViewBtn.classList.remove('active');
    programViewBtn.classList.remove('active');
    waterfallViewBtn.classList.remove('active');

    // Show the selected view and its specific controls
    switch (viewId) {
        case 'chart-view-btn':
            mainChart.style.display = 'block';
            legend.style.display = 'flex';
            document.getElementById('maximize-gmp-btn').style.display = 'block';
            renderChart();
            break;
        case 'table-view-btn':
            tableView.style.display = 'block';
            renderTable();
            break;
        case 'benchmarks-view-btn':
            benchmarksView.style.display = 'block';
            renderBenchmarksView();
            break;
        case 'program-view-btn':
            programView.style.display = 'block';
            renderProgramView();
            break;
        case 'waterfall-view-btn':
            waterfallView.style.display = 'block';
            renderWaterfallChart();
            break;
    }
}

// --- SUMMARY & FILE HANDLING ---

/**
 * Generates a formatted timestamp string (e.g., "2023-10-27_15-30").
 * @returns {string} The formatted timestamp.
 */
function getFormattedTimestamp() {
    const now = new Date();
    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const time = `${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
    return `${date}_${time}`;
}

/**
 * Updates the summary panel with the latest cost calculations for both phases.
 */
function updateSummary() {
    // --- Phase 1 calculations ---
    const p1_current = currentData.phases.phase1;
    const p1_original = originalData.phases.phase1;
    const snapshotRomP1 = d3.sum(p1_original.components, d => d.current_rom * d.square_footage);
    const snapshotVarianceP1 = snapshotRomP1 - p1_original.totalProjectBudget;
    const currentRomEstimateP1 = d3.sum(p1_current.components, d => d.current_rom * d.square_footage);
    const varianceP1 = currentRomEstimateP1 - p1_current.totalProjectBudget;
    document.getElementById('total-budget-p1').textContent = formatCurrencyBig(p1_current.totalProjectBudget);
    document.getElementById('snapshot-rom-p1').textContent = formatCurrencyBig(snapshotRomP1);
    const snapshotVarianceElP1 = document.getElementById('snapshot-variance-p1');
    snapshotVarianceElP1.textContent = `${snapshotVarianceP1 >= 0 ? '+' : ''}${formatCurrencyBig(snapshotVarianceP1)}`;
    snapshotVarianceElP1.classList.toggle('text-red-600', snapshotVarianceP1 > 0);
    snapshotVarianceElP1.classList.toggle('text-green-600', snapshotVarianceP1 <= 0);
    document.getElementById('current-rom-estimate-p1').textContent = formatCurrencyBig(currentRomEstimateP1);
    const varianceElP1 = document.getElementById('variance-p1');
    varianceElP1.textContent = `${varianceP1 >= 0 ? '+' : ''}${formatCurrencyBig(varianceP1)}`;
    varianceElP1.classList.toggle('text-red-600', varianceP1 > 0);
    varianceElP1.classList.toggle('text-green-600', varianceP1 <= 0);

    // --- Phase 2 calculations ---
    const p2_current = currentData.phases.phase2;
    const p2_original = originalData.phases.phase2;
    const snapshotRomP2 = d3.sum(p2_original.components, d => d.current_rom * d.square_footage);
    const snapshotVarianceP2 = snapshotRomP2 - p2_original.totalProjectBudget;
    const currentRomEstimateP2 = d3.sum(p2_current.components, d => d.current_rom * d.square_footage);
    const varianceP2 = currentRomEstimateP2 - p2_current.totalProjectBudget;
    document.getElementById('total-budget-p2').textContent = formatCurrencyBig(p2_current.totalProjectBudget);
    document.getElementById('snapshot-rom-p2').textContent = formatCurrencyBig(snapshotRomP2);
    const snapshotVarianceElP2 = document.getElementById('snapshot-variance-p2');
    snapshotVarianceElP2.textContent = `${snapshotVarianceP2 >= 0 ? '+' : ''}${formatCurrencyBig(snapshotVarianceP2)}`;
    snapshotVarianceElP2.classList.toggle('text-red-600', snapshotVarianceP2 > 0);
    snapshotVarianceElP2.classList.toggle('text-green-600', snapshotVarianceP2 <= 0);
    document.getElementById('current-rom-estimate-p2').textContent = formatCurrencyBig(currentRomEstimateP2);
    const varianceElP2 = document.getElementById('variance-p2');
    varianceElP2.textContent = `${varianceP2 >= 0 ? '+' : ''}${formatCurrencyBig(varianceP2)}`;
    varianceElP2.classList.toggle('text-red-600', varianceP2 > 0);
    varianceElP2.classList.toggle('text-green-600', varianceP2 <= 0);
}

/**
 * Pre-processes the loaded data.
 * This function calculates the `benchmark_low` and `benchmark_high` values for each component
 * by finding the min/max of the corresponding costs from the `benchmarks` array.
 * @param {object} data - The raw data object loaded from the file.
 * @returns {object} The processed data object.
 */
function processData(data) {
    if (!data.benchmarks || !data.phases) return data;

    // Create a map of component names to an array of their costs across all benchmark projects.
    const benchmarkCostsByName = {};
    data.benchmarks.forEach(proj => {
        proj.components.forEach(comp => {
            if (!benchmarkCostsByName[comp.name]) {
                benchmarkCostsByName[comp.name] = [];
            }
            benchmarkCostsByName[comp.name].push(comp.cost);
        });
    });

    // Add benchmark_low and benchmark_high to each component in the main project data.
    Object.values(data.phases).forEach(phase => {
        phase.components.forEach(c => {
            const costs = benchmarkCostsByName[c.name] || [];
            c.benchmark_low = costs.length ? Math.min(...costs) : 0;
            c.benchmark_high = costs.length ? Math.max(...costs) : 0;
        });
    });

    return data;
}

/**
 * Loads and initializes the application with new data.
 * @param {object} data - The project data object.
 * @param {string} [fileName='Sample Data'] - The name of the file being loaded.
 */
function loadData(data, fileName = 'Sample Data') {
    if (!data.phases || !data.phases.phase1 || !data.phases.phase2) { 
        alert("Invalid JSON format. Must contain 'phases' object with 'phase1' and 'phase2' keys."); 
        return; 
    }
    
    // Make a deep copy of the data for processing, leaving the original `sampleData` object untouched.
    const processedData = processData(JSON.parse(JSON.stringify(data)));

    // Initialize the 'locked' state for all components.
    lockedComponents = new Set();
    
    // Store deep copies for original (reset) and current (mutable) states.
    originalData = JSON.parse(JSON.stringify(processedData));
    currentData = processedData;
    
    // Dynamically set the Y-axis domain based on the maximum value in the data.
    const allComponents = [...currentData.phases.phase1.components, ...currentData.phases.phase2.components];
    const maxVal = d3.max(allComponents, d => Math.max(d.benchmark_high, d.current_rom));
    yDomainMax = Math.ceil(maxVal / 10) * 10 + 20; // Round up to the nearest 10 and add a buffer.
    yScale.domain([0, yDomainMax]);
    
    fileNameDisplay.textContent = `Using: ${fileName}`;
    currentPhase = 'phase1'; // Reset to phase 1 on new data load

    // Update the cost labels on the Benchmarks view.
    if (currentData.benchmarks) {
        currentData.benchmarks.forEach(proj => {
            const costEl = document.getElementById(`benchmark-cost-${proj.id}`);
            const sfEl = document.getElementById(`benchmark-sf-${proj.id}`);
            if (costEl) {
                costEl.textContent = `${formatCurrency(proj.overall_sf_cost)} /SF`;
            }
            if (sfEl) {
                sfEl.textContent = `${formatNumber(proj.square_footage)} SF`;
            }
        });
    }

    showMainContent();
}

/**
 * Handles the file upload process (from either drag-drop or file input).
 * @param {File} file - The file object to be handled.
 */
function handleFile(file) {
    if (file && file.type === 'application/json') {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const jsonData = JSON.parse(e.target.result);
                loadData(jsonData, file.name);
            } catch (error) {
                alert("Error parsing JSON file: " + error.message);
            }
        };
        reader.readAsText(file);
    } else { 
        alert("Please upload a valid JSON file."); 
    }
}

/**
 * Triggers a download of the JSON data template.
 */
function downloadTemplate() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(sampleData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "tvd_template.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

/**
 * Triggers a download of the current project data as a JSON file.
 */
function exportJSON() {
    if (!currentData) return;
    // Create a clean copy of the data, removing transient state properties like 'locked'.
    const dataToExport = JSON.parse(JSON.stringify(currentData));
    Object.values(dataToExport.phases).forEach(phase => {
        phase.components.forEach(c => delete c.locked);
    });
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataToExport, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `tvd_export_${getFormattedTimestamp()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

/**
 * Triggers a download of the current project data as a CSV file.
 */
function exportCSV() {
    if (!currentData) return;

    const headers = ["Phase", "Component", "Benchmark Low", "Benchmark High", "Snapshot Value", "Scenario ROM"];
    let csvContent = headers.join(",") + "\n";

    // Iterate over phases and components to build the CSV string.
    for (const phaseKey in currentData.phases) {
        if (currentData.phases.hasOwnProperty(phaseKey)) {
            const phase = currentData.phases[phaseKey];
            const originalPhase = originalData.phases[phaseKey];
            phase.components.forEach(component => {
                const originalComponent = originalPhase.components.find(oc => oc.name === component.name);
                const snapshotValue = originalComponent ? originalComponent.current_rom : 0;
                const row = [
                    phaseKey,
                    `"${component.name.replace(/"/g, '""')}"`, // Handle quotes in name
                    component.benchmark_low,
                    component.benchmark_high,
                    snapshotValue,
                    component.current_rom
                ].join(",");
                csvContent += row + "\n";
            });
        }
    }

    // Use Blob to create the file for download.
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", url);
    downloadAnchorNode.setAttribute("download", `tvd_export_${getFormattedTimestamp()}.csv`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    URL.revokeObjectURL(url);
}

// --- GLOBAL EVENT LISTENERS ---

/**
 * Main entry point. This event listener runs when the DOM is fully loaded.
 * It sets up all the click handlers for buttons and file drop zone events.
 */
document.addEventListener('DOMContentLoaded', () => {
    // --- Button Click Handlers ---
    useSampleDataBtn.addEventListener('click', () => loadData(sampleData));
    downloadTemplateBtn.addEventListener('click', downloadTemplate);
    startOverBtn.addEventListener('click', showSplashScreen);
    exportJsonBtn.addEventListener('click', exportJSON);
    exportCsvBtn.addEventListener('click', exportCSV);
    resetButton.addEventListener('click', () => {
        // Reload original data to reset all changes
        loadData(JSON.parse(JSON.stringify(originalData)));
    });
    maximizeBtn.addEventListener('click', balanceToGmp);
    
    // --- Phase and View Selector Handlers ---
    phase1Btn.addEventListener('click', () => { currentPhase = 'phase1'; render(); });
    phase2Btn.addEventListener('click', () => { currentPhase = 'phase2'; render(); });
    chartViewBtn.addEventListener('click', () => { currentView = 'chart'; render(); });
    programViewBtn.addEventListener('click', () => { currentView = 'program'; render(); });
    benchmarksViewBtn.addEventListener('click', () => { currentView = 'benchmarks'; selectedBenchmark = null; render(); });
    waterfallViewBtn.addEventListener('click', () => { currentView = 'waterfall'; render(); });

    // --- File Drop Zone Handlers ---
    fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));
    fileDropZone.addEventListener('click', () => fileInput.click());
    fileDropZone.addEventListener('dragover', (e) => { e.preventDefault(); fileDropZone.classList.add('dragover'); });
    fileDropZone.addEventListener('dragleave', () => fileDropZone.classList.remove('dragover'));
    fileDropZone.addEventListener('drop', (e) => { e.preventDefault(); fileDropZone.classList.remove('dragover'); handleFile(e.dataTransfer.files[0]); });
    
    // --- Benchmark Card Click Handlers ---
    d3.selectAll('.benchmark-card').on('click', function() {
        const id = this.id.split('-').pop();
        
        // If the clicked card is already selected, deselect it (reset view). Otherwise, select it.
        if (selectedBenchmark === id) {
            selectedBenchmark = null;
        } else {
            selectedBenchmark = id;
        }
        render();
    });

    // Re-render on window resize to ensure charts are responsive.
    window.addEventListener('resize', render);

    // Initial load
}); 