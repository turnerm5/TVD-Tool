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
const tableViewBtn = document.getElementById('table-view-btn');
const benchmarksViewBtn = document.getElementById('benchmarks-view-btn');
const programViewBtn = document.getElementById('program-view-btn');
const waterfallViewBtn = document.getElementById('waterfall-view-btn');
const mainChart = document.getElementById('main-chart');
const tableView = document.getElementById('table-view');
const benchmarksView = document.getElementById('benchmarks-view');
const programView = document.getElementById('program-view');
const waterfallView = document.getElementById('waterfall-view');
const phaseSelector = document.getElementById('phase-selector');
const summaryPanel = document.getElementById('summary-panel');
const legend = document.getElementById('legend');
const waterfallLegend = document.getElementById('waterfall-legend');

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
    tableView.classList.add('hidden');
    benchmarksView.classList.add('hidden');
    programView.classList.add('hidden');
    waterfallView.classList.add('hidden');
    phaseSelector.classList.add('hidden');
    legend.classList.add('hidden');
    waterfallLegend.classList.add('hidden');

    chartViewBtn.classList.remove('active');
    tableViewBtn.classList.remove('active');
    benchmarksViewBtn.classList.remove('active');
    programViewBtn.classList.remove('active');
    waterfallViewBtn.classList.remove('active');

    // --- 2. Show the active view and call its render function ---
    if (currentView === 'chart') {
        mainChart.classList.remove('hidden');
        phaseSelector.classList.remove('hidden');
        legend.classList.remove('hidden');
        chartViewBtn.classList.add('active');
        renderChart();
        renderYAxisLabels();
    } else if (currentView === 'table') {
        tableView.classList.remove('hidden');
        tableViewBtn.classList.add('active');
        renderTable();
    } else if (currentView === 'benchmarks') {
        benchmarksView.classList.remove('hidden');
        benchmarksViewBtn.classList.add('active');
        renderBenchmarksView();
    } else if (currentView === 'program') {
        programView.classList.remove('hidden');
        programViewBtn.classList.add('active');
        renderProgramView();
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
    enterGroup.append("div").attr("class", "target-value"); // The green target line
    enterGroup.append("div").attr("class", "ghost-rom"); // The semi-transparent bar showing the original value
    // The draggable "current ROM" bar.
    enterGroup.append("div").attr("class", "current-rom").call(d3.drag().on("start", dragStarted).on("drag", dragged).on("end", dragEnded));
    enterGroup.append("div").attr("class", "component-label");
    const valueLabelGroup = enterGroup.append("div").attr("class", "value-label-group");
    valueLabelGroup.append("div").attr("class", "current-value-label");
    valueLabelGroup.append("div").attr("class", "delta-label");
    enterGroup.append("div").attr("class", "lock-icon").on("click", toggleLock);

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
    updateGroup.select(".target-value").style("top", d => yScale(d.target_value) + "px").style("bottom", null);
    
    updateGroup.select(".current-rom")
        .style("top", d => yScale(d.current_rom) - 3 + "px")
        .style("bottom", null)
        .style("background-color", d => {
            const isOutsideBenchmark = d.current_rom < d.benchmark_low || d.current_rom > d.benchmark_high;
            return isOutsideBenchmark ? '#dc2626' : '#1f2937'; // Red if outside, dark grey if inside
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
        .style('opacity', d => d.locked ? 1 : 0.5)
        .text(d => d.locked ? '🔒' : '🔓');

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
            .data(projectData.components.sort((a, b) => b.cost - a.cost))
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
function handleProgramCellChange(event) {
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
    const data = components.map(c => {
        const targetValue = c.target_value * c.square_footage;
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
 * Renders the Program View, which is a simple table showing component square footages.
 */
function renderProgramView() {
    const tableData = [];
    
    // Flatten the data from both phases into a single array for table rendering.
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

    const programViewContainer = d3.select(programView);
    programViewContainer.html(''); 
    
    const tableContainer = programViewContainer.append('div').attr('class', 'max-w-3xl mx-auto');
    const table = tableContainer.append('table').attr('class', 'min-w-full divide-y divide-gray-200');
    
    // Create Header
    const thead = table.append('thead').attr('class', 'bg-gray-50');
    const headerRow = thead.append('tr');
    headerRow.append('th').attr('class', 'py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider').style('width', '70%').text('Component');
    headerRow.append('th').attr('class', 'py-3 px-6 text-center text-xs font-medium text-gray-500 uppercase tracking-wider').style('width', '30%').text('Square Footage');
    
    // Create Body
    const tbody = table.append('tbody');
    const rows = tbody.selectAll('tr').data(tableData).enter().append('tr');

    rows.each(function(d) {
        const row = d3.select(this);
        if (d.type === 'header') {
            row.attr('class', 'bg-gray-100');
            row.append('td').attr('colspan', 2).attr('class', 'py-2 px-6 text-sm font-bold text-gray-700').text(d.name);
        } else {
            row.attr('class', 'bg-white');
            row.append('td').attr('class', 'py-4 px-6 text-sm font-medium text-gray-900 whitespace-nowrap').text(d.name);
            
            // Render square footage as an editable input field.
            row.append('td').attr('class', 'py-4 px-6 text-sm text-gray-500 whitespace-nowrap editable-cell')
                .append('input').attr('type', 'text').attr('class', 'w-full text-center')
                .attr('value', d.square_footage.toLocaleString('en-US'))
                .attr('data-phase', d.dataPhase)
                .attr('data-name', d.name)
                .on('change', handleProgramCellChange);
        }
    });
}

/**
 * Renders the main data table view with detailed component information.
 */
function renderTable() {
    const tableData = [];
    
    // Flatten data from both phases.
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

    d3.select(tableView).select('table').remove();
    const table = d3.select(tableView).append('table').attr('class', 'min-w-full divide-y divide-gray-200');
    
    // Create Header
    const thead = table.append('thead').attr('class', 'bg-gray-50');
    const headerRow = thead.append('tr');
    headerRow.append('th').attr('class', 'py-3 px-1 text-center text-xs font-medium text-gray-500 uppercase tracking-wider').style('width', '5%');
    headerRow.append('th').attr('class', 'py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider').style('width', '30%').text('Component');
    headerRow.append('th').attr('class', 'py-3 px-6 text-center text-xs font-medium text-gray-500 uppercase tracking-wider').style('width', '15%').text('Benchmark Low');
    headerRow.append('th').attr('class', 'py-3 px-6 text-center text-xs font-medium text-gray-500 uppercase tracking-wider').style('width', '15%').text('Benchmark High');
    headerRow.append('th').attr('class', 'py-3 px-6 text-center text-xs font-medium text-gray-500 uppercase tracking-wider').style('width', '17.5%').text('Target');
    headerRow.append('th').attr('class', 'py-3 px-6 text-center text-xs font-medium text-gray-500 uppercase tracking-wider').style('width', '17.5%').text('Current');
    
    // Create Body
    const tbody = table.append('tbody');
    const rows = tbody.selectAll('tr').data(tableData).enter().append('tr');

    rows.each(function(d) {
        const row = d3.select(this);
        if (d.type === 'header') {
            row.attr('class', 'bg-gray-100');
            row.append('td').attr('colspan', 6).attr('class', 'py-2 px-6 text-sm font-bold text-gray-700').text(d.name);
        } else {
            const isOutsideBenchmark = d.current_rom < d.benchmark_low || d.current_rom > d.benchmark_high;
            row.attr('class', 'bg-white').classed('benchmark-warning', isOutsideBenchmark);

            row.append('td').attr('class', 'py-4 px-2 text-center text-sm align-middle')
                .append('span').attr('class', 'lock-icon cursor-pointer')
                .style('opacity', d.locked ? 1 : 0.5)
                .text(d.locked ? '🔒' : '🔓')
                .on('click', (event, d_inner) => toggleComponentLock(d_inner.name));
            
            row.append('td').attr('class', 'py-4 px-6 text-sm font-medium text-gray-900 whitespace-nowrap').text(d.name);
            row.append('td').attr('class', 'py-4 px-6 text-sm text-gray-500 whitespace-nowrap text-center').text(formatCurrency(d.benchmark_low));
            row.append('td').attr('class', 'py-4 px-6 text-sm text-gray-500 whitespace-nowrap text-center').text(formatCurrency(d.benchmark_high));
            row.append('td').attr('class', 'py-4 px-6 text-sm text-gray-500 whitespace-nowrap text-center').text(formatCurrency(d.target_value));
            
            // Render the 'Current ROM' as an editable input.
            row.append('td').attr('class', 'py-4 px-6 text-sm text-gray-500 whitespace-nowrap editable-cell')
                .append('input').attr('type', 'number').attr('class', 'w-full text-center')
                .attr('value', d.current_rom.toFixed(2))
                .attr('step', 0.01)
                .attr('data-phase', d.dataPhase)
                .attr('data-name', d.name)
                .on('change', handleTableCellChange);
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
    const originalValue = changedComponent.current_rom;
    const romChange = newValue - originalValue;

    if (Math.abs(romChange) < 0.01) return; // Ignore trivial changes

    const unlockedComponents = phase.components.filter(c => c !== changedComponent && !c.locked);
    const totalUnlockedWeight = d3.sum(unlockedComponents, c => c.current_rom);

    if (unlockedComponents.length === 0 || totalUnlockedWeight <= 0) {
        // If no other components are unlocked, just apply the change directly.
        changedComponent.current_rom = newValue;
    } else {
        let remainingChange = -romChange;
        changedComponent.current_rom = Math.max(0, originalValue + romChange);

        // Distribute the change proportionally.
        let distributedChange = 0;
        unlockedComponents.forEach(comp => {
            const proportion = totalUnlockedWeight > 0 ? comp.current_rom / totalUnlockedWeight : 1 / unlockedComponents.length;
            let adjustment = remainingChange * proportion;
            
            // Prevent a component's value from going below zero.
            if (comp.current_rom + adjustment < 0) {
                adjustment = -comp.current_rom;
            }
            distributedChange += adjustment;
            comp.current_rom += adjustment;
        });
        
        // If the full change couldn't be distributed (e.g., all other bars hit 0),
        // adjust the originally changed bar to absorb the remainder.
        const undistributed = remainingChange - distributedChange;
        if(Math.abs(undistributed) > 0.01) {
            changedComponent.current_rom += undistributed;
        }
    }
    render(); // Trigger a re-render to show the changes.
}

/**
 * Handles the 'change' event from the editable cells in the main data table.
 * @param {Event} event - The input change event.
 */
function handleTableCellChange(event) {
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
    if (!d.locked) { 
        toggleComponentLock(d.name, true); // Force lock
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
 * Click handler for the lock icon on the slider chart.
 * @param {Event} event - The click event.
 * @param {object} d - The data object for the clicked element.
 */
function toggleLock(event, d) {
    toggleComponentLock(d.name);
}

/**
 * Toggles the 'locked' state of a component.
 * It ensures that if a component exists in both phases, its lock state is consistent.
 * @param {string} componentName - The name of the component to lock/unlock.
 * @param {boolean} [forceState] - Optional. If provided, forces the lock state to true or false.
 */
function toggleComponentLock(componentName, forceState) {
    const p1Comp = currentData.phases.phase1.components.find(c => c.name === componentName);
    const p2Comp = currentData.phases.phase2.components.find(c => c.name === componentName);

    const component = p1Comp || p2Comp;
    if (!component) return;

    // If forceState is not provided, toggle the current state.
    const newLockState = (forceState === undefined) ? !component.locked : forceState;

    if (p1Comp) p1Comp.locked = newLockState;
    if (p2Comp) p2Comp.locked = newLockState;
    
    render();
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
    const p1 = currentData.phases.phase1;
    const totalTargetP1 = d3.sum(p1.components, d => d.target_value);
    const totalCurrentP1 = d3.sum(p1.components, d => d.current_rom);
    const varianceP1 = totalCurrentP1 - totalTargetP1;
    document.getElementById('total-budget-p1').textContent = `$${p1.totalProjectBudget.toLocaleString()}`;
    document.getElementById('target-cost-p1').textContent = formatCurrency(totalTargetP1);
    document.getElementById('current-cost-p1').textContent = formatCurrency(totalCurrentP1);
    const varianceElP1 = document.getElementById('variance-p1');
    varianceElP1.textContent = `${varianceP1 > 0 ? '+' : ''}${formatCurrency(varianceP1)}`;
    varianceElP1.classList.toggle('text-red-600', varianceP1 > 0);
    varianceElP1.classList.toggle('text-green-600', varianceP1 <= 0);

    // --- Phase 2 calculations ---
    const p2 = currentData.phases.phase2;
    const totalTargetP2 = d3.sum(p2.components, d => d.target_value);
    const totalCurrentP2 = d3.sum(p2.components, d => d.current_rom);
    const varianceP2 = totalCurrentP2 - totalTargetP2;
    document.getElementById('total-budget-p2').textContent = `$${p2.totalProjectBudget.toLocaleString()}`;
    document.getElementById('target-cost-p2').textContent = formatCurrency(totalTargetP2);
    document.getElementById('current-cost-p2').textContent = formatCurrency(totalCurrentP2);
    const varianceElP2 = document.getElementById('variance-p2');
    varianceElP2.textContent = `${varianceP2 > 0 ? '+' : ''}${formatCurrency(varianceP2)}`;
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
    Object.values(processedData.phases).forEach(phase => phase.components.forEach(c => c.locked = false));
    
    // Store deep copies for original (reset) and current (mutable) states.
    originalData = JSON.parse(JSON.stringify(processedData));
    currentData = processedData;
    
    // Dynamically set the Y-axis domain based on the maximum value in the data.
    const allComponents = [...currentData.phases.phase1.components, ...currentData.phases.phase2.components];
    const maxVal = d3.max(allComponents, d => Math.max(d.benchmark_high, d.target_value, d.current_rom));
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

    const headers = ["Phase", "Component", "Benchmark Low", "Benchmark High", "Target Value", "Current ROM"];
    let csvContent = headers.join(",") + "\n";

    // Iterate over phases and components to build the CSV string.
    for (const phaseKey in currentData.phases) {
        if (currentData.phases.hasOwnProperty(phaseKey)) {
            const phase = currentData.phases[phaseKey];
            phase.components.forEach(component => {
                const row = [
                    phaseKey,
                    `"${component.name.replace(/"/g, '""')}"`, // Handle quotes in name
                    component.benchmark_low,
                    component.benchmark_high,
                    component.target_value,
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
        if (originalData) { 
            loadData(JSON.parse(JSON.stringify(originalData)), fileNameDisplay.textContent.replace('Using: ', '')); 
        } 
    });
    
    // --- Phase and View Selector Handlers ---
    phase1Btn.addEventListener('click', () => { currentPhase = 'phase1'; render(); });
    phase2Btn.addEventListener('click', () => { currentPhase = 'phase2'; render(); });
    chartViewBtn.addEventListener('click', () => { currentView = 'chart'; render(); });
    tableViewBtn.addEventListener('click', () => { currentView = 'table'; render(); });
    benchmarksViewBtn.addEventListener('click', () => { currentView = 'benchmarks'; selectedBenchmark = null; render(); });
    programViewBtn.addEventListener('click', () => { currentView = 'program'; render(); });
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
}); 