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
 * Formats square footage with change indication.
 * @param {number} currentSF - The current square footage value.
 * @param {string} componentName - The name of the component for change tracking.
 * @returns {string} The formatted square footage string with change indication.
 */
export function formatSquareFootageWithChange(currentSF, componentName) {
    // Round to nearest integer for display
    const roundedSF = Math.round(currentSF);
    const change = state.getSquareFootageChange(componentName, roundedSF);
    const formattedSF = roundedSF.toLocaleString('en-US');
    
    if (change === 0) {
        return `${formattedSF} SF`;
    }
    
    const changeFormatted = Math.abs(Math.round(change)).toLocaleString('en-US');
    const changeSign = change > 0 ? '+' : '-';
    return `${formattedSF} SF (${changeSign}${changeFormatted} SF)`;
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
        const totalCow = calculateTotalCostOfWork(state.currentScheme.costOfWork);
        return totalCow * (Number(component.percentage) || 0);
    }
    // Default calculation for regular "Cost of Work" items
    const targetValue = Number(component.target_value) || 0;
    const squareFootage = Number(component.square_footage) || 0;
    return targetValue * squareFootage;
}

/**
 * Creates a stable "Predesign" series using pure original data.
 * This is used as the reference point in summary charts.
 * @returns {object} The predesign data series object
 */
export function createImportedDataSeries() {
    const originalPredesignScheme = state.originalData.schemes && state.originalData.schemes.find(s => s.name === 'Predesign');
    const initialTargetValues = state.originalData.initialTargetValues || [];

    let costOfWork = [];
    if (originalPredesignScheme) {
        // Calculate the shelled floor reduction based on the 'shelledFloors' property
        const totalFloors = originalPredesignScheme.floors || 0;
        const shelledFloorsCount = originalPredesignScheme.shelledFloors || 0;
        
        const shelledPercentage = totalFloors > 0 ? (shelledFloorsCount / totalFloors) : 0;
        const componentsToAdjust = ['C Interiors', 'E Equipment and Furnishings'];

        // Merge square_footage from Predesign scheme with target_value from initialTargetValues
        costOfWork = originalPredesignScheme.costOfWork.map(component => {
            const targetValueData = initialTargetValues.find(tv => tv.name === component.name);
            let sf = Number(component.square_footage) || 0;

            // If this is a component that needs adjustment, calculate its shelled value
            if (componentsToAdjust.includes(component.name)) {
                const originalComponentData = originalPredesignScheme.costOfWork.find(c => c.name === component.name);
                const originalSF = originalComponentData ? originalComponentData.square_footage : 0;
                sf = originalSF * (1 - shelledPercentage);
            }

            return {
                name: component.name,
                square_footage: sf,
                target_value: targetValueData ? Number(targetValueData.target_value) || 0 : 0,
                benchmark_low: targetValueData ? Number(targetValueData.benchmark_low) || 0 : 0,
                benchmark_high: targetValueData ? Number(targetValueData.benchmark_high) || 0 : 0
            };
        });
    }
    
    return {
        name: "Predesign",
        color: "#9ca3af", // gray-400
        costOfWork: costOfWork,
        grossSF: state.originalData.grossSF
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