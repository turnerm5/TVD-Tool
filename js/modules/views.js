/**
 * @file views.js
 * @description Renders the different views of the application like the program table and benchmarks grid.
 */

import { state } from './state.js';
import * as dom from './dom.js';
import * as utils from './utils.js';

// Forward-declare dependencies
let render, handleSquareFootageCellChange, handleCurrentRomCellChange;
export function setDependencies(fns) {
    render = fns.render;
    handleSquareFootageCellChange = fns.handleSquareFootageCellChange;
    handleCurrentRomCellChange = fns.handleCurrentRomCellChange;
}

/**
 * Renders the Benchmarks view.
 * This function handles the logic for displaying either the main grid of four projects
 * or the detailed view for a single selected project.
 */
export function renderBenchmarksView() {
    const detailContainer = document.getElementById('benchmark-detail-container');
    const benchmarkGrid = document.querySelector('.benchmark-grid');
    const benchmarkCards = d3.selectAll('.benchmark-card');

    if (state.selectedBenchmark) {
        // --- Show Detail View ---
        dom.benchmarksView.classList.add('detail-active');
        detailContainer.classList.remove('hidden');

        // Move the detail container inside the grid to become a flex item
        benchmarkGrid.appendChild(detailContainer);

        // Highlight the selected card and fade others
        benchmarkCards.classed('selected', false); // Clear all selections first
        d3.select(`#benchmark-card-${state.selectedBenchmark}`).classed('selected', true);


        // Find data for the selected project
        const projectData = state.currentData.benchmarks.find(p => p.id === state.selectedBenchmark);
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
                state.selectedBenchmark = null;
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
        rows.append('td').text(d => utils.formatCurrency(d.cost));

    } else {
        // --- Show Grid View ---
        dom.benchmarksView.classList.remove('detail-active');
        detailContainer.classList.add('hidden');
        benchmarkCards.classed('selected', false);

        // Move the detail container back to its original position
        dom.benchmarksView.appendChild(detailContainer);
    }
}


/**
 * Renders the main data program view with detailed component information.
 */
export function renderPhase1View() {
    google.charts.load('current', { 'packages': ['sankey'] });
    google.charts.setOnLoadCallback(drawChart);

    function drawChart() {
        const phase1Data = state.currentData.phases.phase1;
        const totalBudget = phase1Data.totalProjectBudget;
        const categories = phase1Data.categories;

        const data = new google.visualization.DataTable();
        data.addColumn('string', 'From');
        data.addColumn('string', 'To');
        data.addColumn('number', 'Value');

        const nodeTotals = {};
        const links = [];

        // Calculate totals for all nodes
        let totalAllocated = 0;
        categories.forEach(item => {
            if (item.Total > 0) {
                const category = item.Category;
                const subcategory = item.Subcategory;
                const value = item.Total;

                nodeTotals[category] = (nodeTotals[category] || 0) + value;
                nodeTotals[subcategory] = (nodeTotals[subcategory] || 0) + value;
                totalAllocated += value;
            }
        });

        const remainingBudget = totalBudget - totalAllocated;
        if (remainingBudget > 0) {
            nodeTotals['Additional COW'] = remainingBudget;
        }
        nodeTotals['Total Project Budget'] = totalBudget;
        
        // --- Create Links with Formatted Labels ---
        const formatValue = (value) => {
            if (value >= 1000000) {
                return `$${(value / 1000000).toFixed(1)}M`;
            } else {
                return `$${Math.round(value / 1000)}k`;
            }
        };

        categories.forEach(item => {
            if (item.Total > 0) {
                const category = item.Category;
                const subcategory = item.Subcategory;
                const value = item.Total;
                
                const fromLabel = `${category}: ${formatValue(nodeTotals[category])}`;
                const toLabel = `${subcategory}: ${formatValue(nodeTotals[subcategory])}`;
                links.push([fromLabel, toLabel, value]);
            }
        });

        Object.keys(nodeTotals).forEach(node => {
            if (node !== 'Total Project Budget' && !categories.some(c => c.Subcategory === node)) {
                const fromLabel = `Total Project Budget: ${formatValue(totalBudget)}`;
                const toLabel = `${node}: ${formatValue(nodeTotals[node])}`;
                links.push([fromLabel, toLabel, nodeTotals[node]]);
            }
        });

        if (remainingBudget > 0) {
            const fromLabel = `Additional COW: ${formatValue(remainingBudget)}`;
            const toLabel = `Additional COW : ${formatValue(remainingBudget)}`;
            links.push([fromLabel, toLabel, remainingBudget]);
        }

        data.addRows(links);

        const colors = ['#a6cee3', '#1f78b4', '#b2df8a', '#33a02c', '#fb9a99', '#e31a1c', '#fdbf6f', '#ff7f00', '#cab2d6', '#6a3d9a'];

        const options = {
            height: 600,
            sankey: {
                node: {
                    colors: colors,
                    width: 30,
                    nodePadding: 20,
                    label: {
                        fontSize: 14,
                        color: '#000',
                        bold: false
                    }
                },
                link: {
                    colorMode: 'gradient',
                    colors: colors
                },
                tooltip: {
                    isHtml: true,
                    trigger: 'focus'
                }
            },
            tooltip: {
                isHtml: true,
                trigger: 'focus',
                formatter: function(dataTable, dataRow) {
                    const row = dataTable.getValue(dataRow, 0);
                    const col = dataTable.getValue(dataRow, 1);
                    const value = dataTable.getValue(dataRow, 2);
                    
                    // Format the value
                    let formattedValue;
                    if (value >= 1000000) {
                        formattedValue = `$${(value / 1000000).toFixed(1)}M`;
                    } else {
                        formattedValue = `$${Math.round(value / 1000)}k`;
                    }
                    
                    return `<div style="padding: 8px;">
                        <strong>${row}</strong><br>
                        <strong>${col}</strong><br>
                    </div>`;
                }
            }
        };

        const chart = new google.visualization.Sankey(document.getElementById('phase1-view'));
        chart.draw(data, options);
    }
}

export function renderPhase2ProgramView() {
    d3.select(dom.programView).select('table').remove();

    const tableData = [];

    const p2Components = state.currentData.phases.phase2.components.sort((a, b) => a.name.localeCompare(b.name));
    if (p2Components.length > 0) {
        p2Components.forEach(c => tableData.push({ ...c, type: 'component', dataPhase: 'phase2' }));
    }

    // Create Table
    const table = d3.select(dom.programView).append('table').attr('class', 'min-w-full divide-y divide-gray-200');

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
                .style('opacity', state.lockedComponents.has(lockKey) ? 1 : 0.5)
                .text(state.lockedComponents.has(lockKey) ? '🔒' : '🔓')
                .on('click', (event, d_inner) => {
                    const key = `${d_inner.dataPhase}-${d_inner.name}`;
                    if (state.lockedComponents.has(key)) {
                        state.lockedComponents.delete(key);
                    } else {
                        state.lockedComponents.add(key);
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

            row.append('td').attr('class', 'py-4 px-6 text-sm text-gray-500 whitespace-nowrap text-center').text(utils.formatCurrency(d.benchmark_low));
            row.append('td').attr('class', 'py-4 px-6 text-sm text-gray-500 whitespace-nowrap text-center').text(utils.formatCurrency(d.benchmark_high));
            
            // Snapshot
            const originalComponent = state.originalData.phases[d.dataPhase].components.find(c => c.name === d.name);
            const snapshotValue = originalComponent ? originalComponent.current_rom : 0;
            row.append('td').attr('class', 'py-4 px-6 text-sm text-gray-500 whitespace-nowrap text-center').text(utils.formatCurrency(snapshotValue));

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