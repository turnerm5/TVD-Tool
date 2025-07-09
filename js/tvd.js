// --- INITIAL SETUP AND SAMPLE DATA ---
let originalData = null, currentData = null, yDomainMax = 100, currentPhase = 'phase1', currentView = 'chart';

// --- DOM ELEMENT REFERENCES ---
const splashScreen = document.getElementById('splash-screen'), mainContent = document.getElementById('main-content');
const chartContainer = d3.select("#chart-container"), yAxisLabelsContainer = d3.select("#y-axis-labels-container");
const resetButton = document.getElementById('reset-button'), startOverBtn = document.getElementById('start-over-btn');
const exportJsonBtn = document.getElementById('export-json-btn'), useSampleDataBtn = document.getElementById('use-sample-data-btn');
const exportCsvBtn = document.getElementById('export-csv-btn');
const downloadTemplateBtn = document.getElementById('download-template-btn'), fileDropZone = document.getElementById('file-drop-zone');
const fileInput = document.getElementById('file-input'), fileNameDisplay = document.getElementById('file-name');
const phase1Btn = document.getElementById('phase1-btn'), phase2Btn = document.getElementById('phase2-btn');
const chartViewBtn = document.getElementById('chart-view-btn'), tableViewBtn = document.getElementById('table-view-btn');
const mainChart = document.getElementById('main-chart'), tableView = document.getElementById('table-view');
const phaseSelector = document.getElementById('phase-selector');
const summaryPanel = document.getElementById('summary-panel');
const legend = document.getElementById('legend');

// --- SCALES AND FORMATTERS ---
const yScale = d3.scaleLinear().domain([0, yDomainMax]);
const formatCurrency = (d) => `$${d.toFixed(2)}`;

// --- VIEW MANAGEMENT ---
function showSplashScreen() { mainContent.style.display = 'none'; splashScreen.style.display = 'flex'; }
function showMainContent() { splashScreen.style.display = 'none'; mainContent.style.display = 'block'; window.requestAnimationFrame(render); }

// --- MAIN RENDER FUNCTION ---
function render() {
    if (!currentData) return;

    // Update View
    if (currentView === 'chart') {
        mainChart.classList.remove('hidden');
        tableView.classList.add('hidden');
        phaseSelector.classList.remove('hidden');
        legend.classList.remove('hidden');
        chartViewBtn.classList.add('active');
        tableViewBtn.classList.remove('active');
        renderChart();
        renderYAxisLabels();
    } else {
        mainChart.classList.add('hidden');
        tableView.classList.remove('hidden');
        phaseSelector.classList.add('hidden');
        legend.classList.add('hidden');
        chartViewBtn.classList.remove('active');
        tableViewBtn.classList.add('active');
        renderTable();
    }

    // Update Phase buttons
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
    
    updateSummary(); 
    resetButton.disabled = JSON.stringify(originalData) === JSON.stringify(currentData);
}

// --- CHART RENDERING ---
function renderChart() {
    const phaseComponents = currentData.phases[currentPhase].components;
    chartContainer.style("grid-template-columns", `repeat(${phaseComponents.length}, 1fr)`);
    yScale.range([chartContainer.node().clientHeight - parseFloat(chartContainer.style("padding-bottom")), 0]);
    
    const components = chartContainer.selectAll(".component-column").data(phaseComponents, d => d.name);
    components.exit().remove();

    const enterGroup = components.enter().append("div").attr("class", "component-column");
    enterGroup.append("div").attr("class", "y-axis");
    enterGroup.append("div").attr("class", "benchmark-range");
    enterGroup.append("div").attr("class", "benchmark-cap benchmark-cap-low");
    enterGroup.append("div").attr("class", "benchmark-cap benchmark-cap-high");
    enterGroup.append("div").attr("class", "target-value");
    enterGroup.append("div").attr("class", "ghost-rom");
    enterGroup.append("div").attr("class", "current-rom").call(d3.drag().on("start", dragStarted).on("drag", dragged).on("end", dragEnded));
    enterGroup.append("div").attr("class", "component-label");
    const valueLabelGroup = enterGroup.append("div").attr("class", "value-label-group");
    valueLabelGroup.append("div").attr("class", "current-value-label");
    valueLabelGroup.append("div").attr("class", "delta-label");
    enterGroup.append("div").attr("class", "lock-icon").on("click", toggleLock);

    const updateGroup = enterGroup.merge(components);
    
    // FIX: Correctly position benchmark range using top/height
    updateGroup.select(".benchmark-range")
        .style("top", d => Math.min(yScale(d.benchmark_low), yScale(d.benchmark_high)) + "px")
        .style("height", d => Math.abs(yScale(d.benchmark_low) - yScale(d.benchmark_high)) + "px")
        .style("bottom", null); // remove conflicting style

    updateGroup.select(".benchmark-cap-low")
        .style("top", d => yScale(d.benchmark_low) + "px")
        .style("bottom", null);

    updateGroup.select(".benchmark-cap-high")
        .style("top", d => yScale(d.benchmark_high) + "px")
        .style("bottom", null);

    updateGroup.select(".target-value").style("top", d => yScale(d.target_value) + "px").style("bottom", null);
    updateGroup.select(".current-rom").style("top", d => yScale(d.current_rom) - 3 + "px").style("bottom", null);
    
    const originalComponents = originalData.phases[currentPhase].components.reduce((acc, val) => ({ ...acc, [val.name]: val }), {});
    updateGroup.each(function(d) {
        const original = originalComponents[d.name];
        if (!original) return; // Safeguard if a component name changes or is missing
        const valueGroup = d3.select(this).select(".value-label-group");
        valueGroup.select(".current-value-label").text(formatCurrency(d.current_rom));
        valueGroup.style("top", yScale(d.current_rom) - 10 + "px").style("bottom", null);

        const ghostBar = d3.select(this).select(".ghost-rom");
        ghostBar.style("top", yScale(original.current_rom) - 3 + "px").style("bottom", null);

        const deltaLabel = valueGroup.select(".delta-label");
        if (d.current_rom !== original.current_rom) {
            ghostBar.style("display", "block");
            const delta = d.current_rom - original.current_rom;
            deltaLabel.style("display", "block").text(`${delta > 0 ? '+' : ''}${formatCurrency(delta)}`).style("color", delta > 0 ? '#16a34a' : '#dc2626');
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
}

// --- TABLE RENDERING ---
function renderTable() {
    // Create a flattened data structure with phase headers
    const tableData = [];
    
    // Phase 1
    const p1Components = currentData.phases.phase1.components.sort((a, b) => a.name.localeCompare(b.name));
    if (p1Components.length > 0) {
        tableData.push({ type: 'header', name: 'Phase 1' });
        p1Components.forEach(c => tableData.push({ ...c, type: 'component', dataPhase: 'phase1' }));
    }

    // Phase 2
    const p2Components = currentData.phases.phase2.components.sort((a, b) => a.name.localeCompare(b.name));
    if (p2Components.length > 0) {
        tableData.push({ type: 'header', name: 'Phase 2' });
        p2Components.forEach(c => tableData.push({ ...c, type: 'component', dataPhase: 'phase2' }));
    }

    // Clear previous table and build new one with D3
    d3.select(tableView).select('table').remove();

    const table = d3.select(tableView).append('table').attr('class', 'min-w-full divide-y divide-gray-200');
    
    // Create Header
    const thead = table.append('thead').attr('class', 'bg-gray-50');
    const headerRow = thead.append('tr');
    headerRow.append('th').attr('class', 'py-3 px-1 text-center text-xs font-medium text-gray-500 uppercase tracking-wider').style('width', '5%'); // Lock
    headerRow.append('th').attr('class', 'py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider').style('width', '50%').text('Component');
    headerRow.append('th').attr('class', 'py-3 px-6 text-center text-xs font-medium text-gray-500 uppercase tracking-wider').style('width', '22.5%').text('Target');
    headerRow.append('th').attr('class', 'py-3 px-6 text-center text-xs font-medium text-gray-500 uppercase tracking-wider').style('width', '22.5%').text('Current');
    
    // Create Body
    const tbody = table.append('tbody');
    const rows = tbody.selectAll('tr').data(tableData).enter().append('tr');

    // Style rows based on type (header or component)
    rows.each(function(d) {
        const row = d3.select(this);
        if (d.type === 'header') {
            row.attr('class', 'bg-gray-100');
            row.append('td')
                .attr('colspan', 4)
                .attr('class', 'py-2 px-6 text-sm font-bold text-gray-700')
                .text(d.name);
        } else {
            row.attr('class', 'bg-white');
            // Lock Icon
            row.append('td').attr('class', 'py-4 px-2 text-center text-sm align-middle')
                .append('span').attr('class', 'lock-icon cursor-pointer')
                .style('opacity', d.locked ? 1 : 0.5)
                .text(d.locked ? '🔒' : '🔓')
                .on('click', (event, d_inner) => toggleComponentLock(d_inner.name));
            
            // Component Name
            row.append('td').attr('class', 'py-4 px-6 text-sm font-medium text-gray-900 whitespace-nowrap').text(d.name);
            
            // Target
            row.append('td').attr('class', 'py-4 px-6 text-sm text-gray-500 whitespace-nowrap text-center').text(formatCurrency(d.target_value));
            
            // Current (editable)
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

function renderYAxisLabels() {
    yAxisLabelsContainer.html('');
    const ticks = yScale.ticks(10);
    ticks.forEach(tick => {
        yAxisLabelsContainer.append('div')
            .style('position', 'absolute')
            .style('top', `${yScale(tick)}px`)
            .style('transform', 'translateY(-50%)')
            .text(tick);
    });
}

// --- CORE LOGIC ---
function applyChangeAndBalance(changedComponent, newValue, phaseKey) {
    const phase = currentData.phases[phaseKey];
    const originalValue = changedComponent.current_rom;
    const romChange = newValue - originalValue;

    if (Math.abs(romChange) < 0.01) return;

    const unlockedComponents = phase.components.filter(c => c !== changedComponent && !c.locked);
    const totalUnlockedWeight = d3.sum(unlockedComponents, c => c.current_rom);

    if (unlockedComponents.length === 0 || totalUnlockedWeight <= 0) {
        changedComponent.current_rom = newValue;
    } else {
        let remainingChange = -romChange;
        changedComponent.current_rom = Math.max(0, originalValue + romChange);

        // Distribute change, handling edge cases where a component might go below zero
        let distributedChange = 0;
        unlockedComponents.forEach(comp => {
            const proportion = totalUnlockedWeight > 0 ? comp.current_rom / totalUnlockedWeight : 1 / unlockedComponents.length;
            let adjustment = remainingChange * proportion;
            
            if (comp.current_rom + adjustment < 0) {
                adjustment = -comp.current_rom; // Adjust only by what's possible
            }
            distributedChange += adjustment;
            comp.current_rom += adjustment;
        });
        
        // If the full change couldn't be distributed (e.g., all other bars hit 0), adjust the source bar
        const undistributed = remainingChange - distributedChange;
        if(Math.abs(undistributed) > 0.01) {
            changedComponent.current_rom += undistributed;
        }
    }
    render();
}

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

// --- DRAG LOGIC ---
function dragStarted(event, d) { 
    d3.select(this).raise().classed("active", true); 
    if (!d.locked) { 
        toggleComponentLock(d.name, true);
    } 
}
function dragged(event, d) {
    const newRomValue = Math.max(0, Math.min(yDomainMax, yScale.invert(event.y)));
    applyChangeAndBalance(d, newRomValue, currentPhase);
}
function dragEnded() { d3.select(this).classed("active", false); }
function toggleLock(event, d) {
    toggleComponentLock(d.name);
}

function toggleComponentLock(componentName, forceState) {
    const p1Comp = currentData.phases.phase1.components.find(c => c.name === componentName);
    const p2Comp = currentData.phases.phase2.components.find(c => c.name === componentName);

    const component = p1Comp || p2Comp; // Get a reference component to check current lock state
    if (!component) return;

    const newLockState = (forceState === undefined) ? !component.locked : forceState;

    if (p1Comp) p1Comp.locked = newLockState;
    if (p2Comp) p2Comp.locked = newLockState;
    
    render();
}

// --- SUMMARY & FILE HANDLING ---
function updateSummary() {
    // Phase 1
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

    // Phase 2
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

function loadData(data, fileName = 'Sample Data') {
    if (!data.phases || !data.phases.phase1 || !data.phases.phase2) { alert("Invalid JSON format. Must contain phase1 and phase2 data."); return; }
    
    Object.values(data.phases).forEach(phase => phase.components.forEach(c => c.locked = false));
    originalData = JSON.parse(JSON.stringify(data));
    currentData = data;
    
    const allComponents = [...data.phases.phase1.components, ...data.phases.phase2.components];
    const maxVal = d3.max(allComponents, d => Math.max(d.benchmark_high, d.target_value, d.current_rom));
    yDomainMax = Math.ceil(maxVal / 10) * 10 + 20;
    yScale.domain([0, yDomainMax]); // 0 at bottom, max at top
    fileNameDisplay.textContent = `Using: ${fileName}`;
    currentPhase = 'phase1'; // Reset to phase 1 on new data load
    showMainContent();
}

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
    } else { alert("Please upload a valid JSON file."); }
}

function downloadTemplate() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(sampleData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "tvd_template.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

function exportJSON() {
    if (!currentData) return;
    const dataToExport = JSON.parse(JSON.stringify(currentData));
    Object.values(dataToExport.phases).forEach(phase => {
        phase.components.forEach(c => delete c.locked);
    });
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataToExport, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `tvd_export_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

function exportCSV() {
    if (!currentData) return;

    const headers = ["Phase", "Component", "Benchmark Low", "Benchmark High", "Target Value", "Current ROM"];
    let csvContent = headers.join(",") + "\n";

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

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", url);
    downloadAnchorNode.setAttribute("download", `tvd_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    URL.revokeObjectURL(url);
}

// --- EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', () => {
    useSampleDataBtn.addEventListener('click', () => loadData(sampleData));
    downloadTemplateBtn.addEventListener('click', downloadTemplate);
    startOverBtn.addEventListener('click', showSplashScreen);
    exportJsonBtn.addEventListener('click', exportJSON);
    exportCsvBtn.addEventListener('click', exportCSV);
    resetButton.addEventListener('click', () => { if (originalData) { loadData(JSON.parse(JSON.stringify(originalData)), fileNameDisplay.textContent.replace('Using: ', '')); } });
    
    phase1Btn.addEventListener('click', () => { currentPhase = 'phase1'; render(); });
    phase2Btn.addEventListener('click', () => { currentPhase = 'phase2'; render(); });

    chartViewBtn.addEventListener('click', () => { currentView = 'chart'; render(); });
    tableViewBtn.addEventListener('click', () => { currentView = 'table'; render(); });

    fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));
    fileDropZone.addEventListener('click', () => fileInput.click());
    fileDropZone.addEventListener('dragover', (e) => { e.preventDefault(); fileDropZone.classList.add('dragover'); });
    fileDropZone.addEventListener('dragleave', () => fileDropZone.classList.remove('dragover'));
    fileDropZone.addEventListener('drop', (e) => { e.preventDefault(); fileDropZone.classList.remove('dragover'); handleFile(e.dataTransfer.files[0]); });
    window.addEventListener('resize', render);
}); 