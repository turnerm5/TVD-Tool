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
    headerRow.append('th').attr('class', 'px-4 py-2 w-4/5').text('Name');
    headerRow.append('th').attr('class', 'px-4 py-2 w-1/5').text('$/SF');

    const tbody = table.append('tbody');

    // For each room type (by 'name'), render a subhead and rows for each category key
    data.forEach(room => {
        // Subhead row for this room type
        const subhead = tbody.append('tr').attr('class', 'bg-blue-50 border-b');
        subhead.append('td')
            .attr('class', 'px-4 py-2 font-bold text-blue-900 uppercase text-xs')
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
            .attr('class', 'px-4 py-2 text-xs text-gray-900')
            .text(d => d[0]);
        const valueCells = tr.append('td').attr('class', 'font-xs px-4 py-2');
        valueCells.append('input')
            .attr('type', 'text')
            .attr('inputmode', 'decimal')
            .attr('pattern', '[0-9,\\.]*')
            .attr('class', 'text-left program-table-input w-20 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500')
            .attr('data-room', room.name)
            .attr('data-category', d => d[0])
            .attr('value', d => utils.formatCurrency(Number(d[1]) || 0))
            .on('focus', function(event, entry) {
                const numeric = Number(entry[1]) || 0;
                this.value = numeric.toString();
                this.select();
            })
            .on('input', function(event, entry) {
                const current = parseNumberFromInput(this.value);
                const isValid = !isNaN(current) && isFinite(current) && current >= 0;
                this.classList.toggle('border-red-500', !isValid);
                this.classList.toggle('ring-red-500', !isValid);
            })
            .on('change', function(event, entry) {
                const [category] = entry;
                const newNumeric = parseNumberFromInput(this.value);
                const roomObj = state.interiors.targetValues.find(r => r.name === room.name);
                if (roomObj) {
                    roomObj[category] = newNumeric;
                }
            })
            .on('blur', function(event, entry) {
                const cleaned = parseNumberFromInput(this.value);
                this.value = utils.formatCurrency(cleaned || 0);
                this.classList.remove('border-red-500');
                this.classList.remove('ring-red-500');
            })
            .on('keydown', function(event) {
                const key = event.key;
                if (key === 'Enter' || key === 'ArrowDown' || key === 'ArrowUp') {
                    event.preventDefault();
                    // Commit current value to state
                    const roomName = this.dataset.room;
                    const category = this.dataset.category;
                    const cleaned = parseNumberFromInput(this.value);
                    const roomObj = state.interiors.targetValues.find(r => r.name === roomName);
                    if (roomObj && category) {
                        roomObj[category] = cleaned;
                    }
                    // Format current cell
                    this.value = utils.formatCurrency(cleaned || 0);
                    // Move focus
                    const inputs = wrapper.selectAll('input.program-table-input').nodes();
                    const idx = inputs.indexOf(this);
                    let nextIdx = idx;
                    if (key === 'Enter' || key === 'ArrowDown') nextIdx = Math.min(inputs.length - 1, idx + 1);
                    if (key === 'ArrowUp') nextIdx = Math.max(0, idx - 1);
                    if (inputs[nextIdx]) {
                        inputs[nextIdx].focus();
                        inputs[nextIdx].select();
                    }
                }
            });
    });
}

function cssSafe(str) {
    return String(str).replace(/[^a-zA-Z0-9_-]/g, '_');
}

function parseNumberFromInput(value) {
    if (typeof value !== 'string') return 0;
    const cleaned = value.replace(/[$,\s]/g, '');
    const num = Number(cleaned);
    return isNaN(num) ? 0 : num;
}
