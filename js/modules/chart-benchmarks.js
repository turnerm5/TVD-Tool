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
 * @file chart-benchmarks.js
 * @description Renders the Benchmarks view.
 */

import { state } from './state.js';
import * as dom from './dom.js';
import * as utils from './utils.js';

/**
 * Renders the Benchmarks view.
 * This function handles the logic for displaying either the main grid of four projects
 * or the detailed view for a single selected project.
 */
export function render(render) {
    const detailContainer = document.getElementById('benchmark-detail-container');
    const benchmarkGrid = d3.select('.benchmark-grid');

    // --- Always update the main grid first ---
    const benchmarkData = state.currentData.benchmarks || [];

    const benchmarkCards = benchmarkGrid.selectAll('.benchmark-card')
        .data(benchmarkData, d => d.id)
        .join(
            enter => {
                const card = enter.append('div')
                    .attr('class', 'benchmark-card bg-white p-4 rounded-lg shadow-md border border-gray-200 cursor-pointer transition hover:shadow-lg')
                    .attr('id', d => `benchmark-card-${d.id}`);

                // Wrapper to allow expanding layout inside a single card
                const content = card.append('div')
                    .attr('class', 'card-content grid grid-cols-1 gap-4 items-start');

                // Header row that spans both columns when expanded; always visible
                const header = content.append('div')
                    .attr('class', 'card-header flex items-center gap-3 col-span-1 md:col-span-2');
                header.append('div').attr('class', 'benchmark-label-inline').text(d => d.id);
                header.append('h3').attr('class', 'font-semibold').text(d => d.name);

                const leftCol = content.append('div').attr('class', 'left-col');
                const relativeDiv = leftCol.append('div').attr('class', 'relative');
                relativeDiv.append('img')
                    .attr('src', d => d.image)
                    .attr('alt', d => d.name)
                    .attr('class', 'w-full h-auto rounded-md');
                // No over-image label; we show the inline label in the header above the image

                const caption = leftCol.append('div').attr('class', 'benchmark-caption');
                caption.append('p')
                    .attr('class', 'text-gray-600 text-base font-bold')
                    .text(d => `${utils.formatCurrency(d.overall_sf_cost)} / SF`);
                caption.append('p')
                    .attr('class', 'text-gray-600 text-base')
                    .html(d => `<b>${utils.formatNumber(d.grossSF)} SF</b>`);
                
                // Empty slot that will hold the detail view when selected
                content.append('div').attr('class', 'detail-slot');
                
                return card;
            },
            update => {
                // Update existing cards if necessary (e.g., if data changes)
                update
                    .attr('class', 'benchmark-card bg-white p-4 rounded-lg shadow-md border border-gray-200 cursor-pointer transition hover:shadow-lg');
                // Update header title text
                update.select('.card-header h4').text(d => d.name);
                update.select('img').attr('src', d => d.image).attr('alt', d => d.name);
                // Clear and re-append only the caption paragraphs
                const caption = update.select('.benchmark-caption');
                caption.selectAll('p').remove();
                caption.append('p')
                    .attr('class', 'text-gray-600 font-bold')
                    .text(d => `${utils.formatCurrency(d.overall_sf_cost)} / SF`);
                caption.append('p')
                    .attr('class', 'text-gray-600 text-base')
                    .html(d => `<b>${utils.formatNumber(d.grossSF)} SF</b>`);
                return update;
            }
        );

    // --- Handle Card Click Events ---
    benchmarkCards.on('click', function(event, d) {
        if (state.selectedBenchmark === d.id) {
            state.selectedBenchmark = null;
        } else {
            state.selectedBenchmark = d.id;
        }
        render(); // Re-render to show/hide detail view
    });


    if (state.selectedBenchmark) {
        // --- Show Detail View ---
        dom.benchmarksView.classList.add('detail-active');
        detailContainer.classList.remove('hidden');
        // Ensure detail container visually integrates with the card
        detailContainer.classList.add('p-0'); // reset padding (card already has it)

        // Highlight the selected card and fade others
        benchmarkCards.classed('selected', d => d.id === state.selectedBenchmark);
        // Make the selected card span full width
        benchmarkCards.classed('md:col-span-3', d => d.id === state.selectedBenchmark);
        // Only selected card becomes 2-column inside content; others stay single column
        benchmarkCards.select('.card-content').classed('md:grid-cols-2', d => d.id === state.selectedBenchmark);
        // Header is always visible now and provides consistent layout

        // Find data for the selected project
        const projectData = state.currentData.benchmarks.find(p => p.id === state.selectedBenchmark);
        if (!projectData) return;

        // Move the detail container inside the selected card's detail slot
        const selectedCard = document.getElementById(`benchmark-card-${state.selectedBenchmark}`);
        const detailSlot = selectedCard?.querySelector('.detail-slot');
        if (detailSlot && detailContainer.parentElement !== detailSlot) {
            detailSlot.appendChild(detailContainer);
        }

        // --- Render the detail table/content ---
        const detailContainerD3 = d3.select(detailContainer);
        detailContainerD3.html('');

        // Title is already shown on the left; keep a visually hidden heading for accessibility
        detailContainerD3.append('h3')
            .attr('class', 'sr-only')
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
            .data(['Component', 'Cost ($/SF)', 'System Details'])
            .enter()
            .append('th')
            .text(d => d);

        const tbody = table.append('tbody');
        const rows = tbody.selectAll('tr')
            .data(projectData.costOfWork)
            .enter()
            .append('tr');

        rows.append('td').text(d => d.name);
        rows.append('td').text(d => utils.formatCurrency(d.cost));
        rows.append('td').text(d => d.systemDetail || '-');

    } else {
        // --- Show Grid View ---
        dom.benchmarksView.classList.remove('detail-active');
        detailContainer.classList.add('hidden');
        benchmarkCards.classed('selected', false);
        benchmarkCards.classed('md:col-span-3', false);
        benchmarkCards.select('.card-content').classed('md:grid-cols-2', false);
        // Header remains visible in grid view as well

        // Move the detail container back to its original position
        dom.benchmarksView.appendChild(detailContainer);
    }
} 