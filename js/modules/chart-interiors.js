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
 * @file chart-interiors.js
 * @description Placeholder renderer for the Interiors view.
 */

import * as dom from './dom.js';
import { state } from './state.js';
import * as utils from './utils.js';

/**
 * Renders a simple placeholder inside the Interiors view.
 */
export function renderPlaceholder() {
    const container = dom.interiorsView;
    if (!container) return;
}

/**
 * Renders the Values table for Interiors using state.interiors.targetValues.
 * Flexible to any number of room types and value keys.
 */
export function renderValuesTable() {
    if (!dom.interiorsValues) return;
    const wrapper = d3.select(dom.interiorsValues);
    // Clear previous table content but keep header
    wrapper.selectAll('table').remove();

    const data = state.interiors?.targetValues || [];
    if (!Array.isArray(data) || data.length === 0) return;

    const table = wrapper.append('table')
        .attr('class', 'w-full text-sm text-left text-gray-600 border border-gray-200 rounded-lg overflow-hidden');

    // Header
    const thead = table.append('thead');
    const headerRow = thead.append('tr').attr('class', 'bg-gray-50 text-xs uppercase text-gray-700');
    headerRow.append('th').attr('class', 'px-4 py-2 w-2/3').text('Name');
    headerRow.append('th').attr('class', 'px-4 py-2 w-1/3').text('$/SF');

    const tbody = table.append('tbody');

    // For each room type (by 'name'), render a subhead and rows for each category key
    data.forEach(room => {
        // Subhead row for this room type
        const subhead = tbody.append('tr').attr('class', 'bg-blue-50 border-b');
        subhead.append('td')
            .attr('class', 'px-4 py-2 font-bold text-blue-900 uppercase text-sm')
            .attr('colspan', 2)
            .text(room.name);

        // Extract value keys dynamically (exclude 'name')
        const valueEntries = Object.entries(room).filter(([k, v]) => k !== 'name' && typeof v === 'number');

        const tr = tbody.selectAll(`tr.row-${cssSafe(room.name)}`)
            .data(valueEntries, d => room.name + '-' + d[0])
            .enter()
            .append('tr')
            .attr('class', 'bg-white border-b hover:bg-gray-50');

        tr.append('td')
            .attr('class', 'px-4 py-2 font-medium text-gray-900')
            .text(d => d[0]);
        tr.append('td')
            .attr('class', 'px-4 py-2')
            .text(d => utils.formatCurrency(Number(d[1]) || 0));
    });
}

function cssSafe(str) {
    return String(str).replace(/[^a-zA-Z0-9_-]/g, '_');
}
