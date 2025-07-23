/**
 * @file utils.js
 * @description Utility and helper functions for the TVD Tool.
 */

import { state } from './state.js';

/**
 * Formats a number into a currency string (e.g., $123.45).
 * @param {number} d - The number to format.
 * @returns {string} The formatted currency string.
 */
export const formatCurrency = (d) => `$${d.toFixed(2)}`;

/**
 * Formats a large number into a currency string with no decimal places (e.g., $1,234,567).
 * @param {number} d - The number to format.
 * @returns {string} The formatted currency string.
 */
export const formatCurrencyBig = (d) => `$${Math.round(d).toLocaleString('en-US')}`;

/**
 * Formats a large number into a smallcurrency string with no decimal places (e.g., $1.2M or $200k).
 * @param {number} d - The number to format.
 * @returns {string} The formatted currency string.
 */
export const formatCurrencySmall = (d) => {
    if (d >= 1000000) {
        return `$${(d / 1000000).toFixed(1)}M`;
    } else if (d >= 1000) {
        return `$${(d / 1000).toFixed(0)}k`;
    }
    return `$${d.toFixed(2)}`;
};

/**
 * Formats a number with commas as thousands separators.
 * @param {number} num - The number to format.
 * @returns {string} The formatted number string.
 */
export function formatNumber(num) {
    if (num === undefined || num === null) return 'N/A';
    return num.toLocaleString('en-US');
}

/**
 * Generates a formatted timestamp string (e.g., "2023-10-27_15-30").
 * @returns {string} The formatted timestamp.
 */
export function getFormattedTimestamp() {
    const now = new Date();
    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const time = `${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
    return `${date}_${time}`;
}

/**
 * Calculates the total usable square footage based on building efficiency.
 * @param {number} grossSF - The gross square footage.
 * @param {Array} costOfWorkItems - The array of cost of work items.
 * @returns {number} The calculated usable square footage.
 */
export function calculateUsableSF(grossSF, costOfWorkItems) {
    return grossSF * 0.8; // Default if not found or no efficiency specified
}

/**
 * Calculates the total cost of work for a given set of components.
 * It accounts for the special case of 'C Interiors'.
 * @param {Array} costOfWorkItems - Array of cost of work objects.
 * @returns {number} The total cost of work.
 */
export function calculateTotalCostOfWork(costOfWorkItems) {
    return d3.sum(costOfWorkItems, c => {
        // Ensure we only sum items that have a target_value and square_footage,
        // effectively excluding indirect costs which are calculated differently.
        if (c.target_value && c.square_footage) {
            return c.target_value * c.square_footage;
        }
        return 0;
    });
}

/**
 * Calculates the value for a single component using the same logic as calculateTotalCostOfWork.
 * @param {object} component - A cost of work component object.
 * @returns {number} The calculated value for this component.
 */
export function calculateComponentValue(component) {
    // Check if the component is an indirect cost by looking for a 'percentage' property
    if (component.hasOwnProperty('percentage')) {
        const totalCow = calculateTotalCostOfWork(state.currentData.phases.phase2.costOfWork);
        return totalCow * (component.percentage || 0);
    }
    // Default calculation for regular "Cost of Work" items
    return (component.target_value || 0) * (component.square_footage || 0);
}

/**
 * Creates a stable "Baseline" series using pure original data.
 * This is used as the reference point in summary charts.
 * @returns {object} The baseline data series object
 */
export function createImportedDataSeries() {
    return {
        name: "Baseline",
        color: "#9ca3af", // gray-400
        costOfWork: state.originalData.phases.phase2.costOfWork,
        grossSF: state.originalData.phases.phase2.grossSF
    };
}

/**
 * Calculates the total project cost including indirects for a given series.
 * @param {object} series - A data series with costOfWork array
 * @param {Array} indirectCostPercentages - Array of indirect cost percentage objects
 * @returns {object} Object with cowTotal, indirectTotal, and totalProjectCost
 */
export function calculateSeriesTotal(series, indirectCostPercentages) {
    const cowTotal = calculateTotalCostOfWork(series.costOfWork);
    const indirectTotal = d3.sum(indirectCostPercentages, p => p.percentage * cowTotal);
    const totalProjectCost = cowTotal + indirectTotal;
    
    return {
        cowTotal,
        indirectTotal,
        totalProjectCost
    };
}