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
 * Returns the baseline scheme from original data, preferring name 'Predesign' if present,
 * otherwise falling back to the first scheme in the array.
 * @returns {object|null} baseline scheme object or null
 */
export function getBaselineScheme() {
    if (!state.originalData || !Array.isArray(state.originalData.schemes)) return null;
    const predesign = state.originalData.schemes.find(s => s.name === 'Predesign');
    return predesign || state.originalData.schemes[0] || null;
}

/**
 * Returns the baseline scheme name for UI labels and series naming.
 * @returns {string} baseline scheme name
 */
export function getBaselineName() {
    const scheme = getBaselineScheme();
    return scheme && scheme.name ? scheme.name : 'Baseline';
}

/**
 * Formats a number into a currency string with commas as thousands separators (e.g., $1,234.56).
 * @param {number} d - The number to format.
 * @returns {string} The formatted currency string.
 */
export const formatCurrency = (d) => `$${d.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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
 * Parses a numeric value from a currency-like input string.
 * Removes currency symbols, commas, and whitespace; returns 0 if parsing fails.
 * Examples:
 *  - "$1,234.50" -> 1234.5
 *  - " 2 500 " -> 2500
 *  - "abc" -> 0
 * @param {string} value
 * @returns {number}
 */
export function parseNumberFromInput(value) {
    if (typeof value !== 'string') return 0;
    const cleaned = value.replace(/[$,\s]/g, '');
    const num = Number(cleaned);
    return isNaN(num) ? 0 : num;
}

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
 * Converts an arbitrary string to a CSS-safe token by replacing unsafe characters with underscores.
 * @param {string} str
 * @returns {string}
 */
export function cssSafe(str) {
    return String(str).replace(/[^a-zA-Z0-9_-]/g, '_');
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
        return `${formattedSF} sf`;
    }
    
    const changeFormatted = Math.abs(Math.round(change)).toLocaleString('en-US');
    const changeSign = change > 0 ? '+' : '-';
    return `${formattedSF} sf (${changeSign}${changeFormatted} sf)`;
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
 * Computes blended target $/SF for Interiors categories based on the current Classroom Mix.
 * Includes auto-calculated Circulation/Support to fill to Gross SF.
 * @returns {{ blendedByCategory: Record<string, number>, totalEffectiveSf: number }}
 */
export function computeBlendedInteriorsTargetsFromCurrentMix() {
    const categories = ['C Interiors', 'D Services', 'E Equipment and Furnishings'];
    const roomTypes = state.interiors && Array.isArray(state.interiors.targetValues)
        ? state.interiors.targetValues
        : [];
    const totalGSF = Number(state.currentData?.grossSF) || 0;

    // Build effective SF by room (include Circulation/Support as the remainder to GSF)
    const includeInNSF = (rt) => (rt.includeInNSF !== false);
    const programSF = roomTypes.reduce((sum, rt) => {
        const sf = Number(state.interiors?.mixSF?.[rt.name]) || 0;
        return includeInNSF(rt) ? sum + sf : sum;
    }, 0);
    const circulationRoomType = roomTypes.find(rt => (rt.includeInNSF === false) && /circulation|support/i.test(rt.name));
    const circulationSF = Math.max(0, totalGSF - programSF);
    const effectiveMixByRoom = new Map();
    roomTypes.forEach(rt => {
        let sf = 0;
        if (includeInNSF(rt)) {
            sf = Number(state.interiors?.mixSF?.[rt.name]) || 0;
        } else if (circulationRoomType && rt.name === circulationRoomType.name) {
            sf = circulationSF;
        }
        effectiveMixByRoom.set(rt.name, sf);
    });

    const totalEffectiveSf = Array.from(effectiveMixByRoom.values()).reduce((a, b) => a + b, 0);
    const blendedByCategory = {};
    if (totalEffectiveSf > 0) {
        categories.forEach(cat => {
            const weighted = roomTypes.reduce((sum, rt) => {
                const sf = effectiveMixByRoom.get(rt.name) || 0;
                const rate = Number(rt[cat]) || 0;
                return sum + (sf * rate);
            }, 0);
            blendedByCategory[cat] = weighted / totalEffectiveSf;
        });
    } else {
        categories.forEach(cat => { blendedByCategory[cat] = 0; });
    }

    return { blendedByCategory, totalEffectiveSf };
}

/**
 * Applies blended Interiors targets to the current scheme and optionally keeps budget constant.
 * Prompts the user whether to keep the budget the same.
 * @param {Record<string, number>} blendedByCategory - Map of category name to blended $/SF
 * @param {Array} components - state.currentScheme.costOfWork array
 * @param {object} ui - UI module for confirmations
 * @param {boolean} [askKeepBudgetSame=true] - Whether to prompt to keep budget constant
 * @returns {Promise<boolean>} - Resolves to whether "Keep Budget Same" was chosen
 */
export async function applyInteriorsTargetsUpdateFromBlended(blendedByCategory, components, ui, askKeepBudgetSame = true) {
    const toUpdate = ['C Interiors', 'D Services', 'E Equipment and Furnishings'];
    const preCow = calculateTotalCostOfWork(components);

    components.forEach(c => {
        if (toUpdate.includes(c.name)) {
            c.target_value = Math.max(0, Number(blendedByCategory[c.name]) || 0);
        }
    });

    let keepBudgetSame = false;
    if (askKeepBudgetSame) {
        keepBudgetSame = await ui.showConfirmDialog(
            'Keep Budget the Same?',
            'Update the other categories so the current estimate stays identical?',
            'Yes, Keep Budget Same',
            'No, Only Update These Three'
        );

        if (keepBudgetSame) {
            const postCowUnbalanced = calculateTotalCostOfWork(components);
            const deltaCow = postCowUnbalanced - preCow;
            if (Math.abs(deltaCow) > 0.01) {
                const others = components.filter(c => !toUpdate.includes(c.name) && Number(c.square_footage) > 0);
                const othersCow = others.reduce((sum, c) => sum + ((Number(c.target_value) || 0) * (Number(c.square_footage) || 0)), 0);
                if (othersCow > 0) {
                    let factor = (othersCow - deltaCow) / othersCow;
                    if (!isFinite(factor)) factor = 1;
                    if (factor < 0) factor = 0;
                    others.forEach(c => {
                        const newTv = (Number(c.target_value) || 0) * factor;
                        c.target_value = Math.max(0, newTv);
                    });
                }
            }
        }
    }

    clearUnsavedMixFlag();
    return keepBudgetSame;
}

/**
 * Marks Interiors mix as saved by clearing the unsaved flag.
 */
function clearUnsavedMixFlag() {
    if (state && state.interiors) {
        state.interiors.unsavedMix = false;
    }
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
    const originalPredesignScheme = getBaselineScheme();
    const initialTargetValues = state.originalData.initialTargetValues || [];

    let costOfWork = [];
    if (originalPredesignScheme) {
        // Calculate the finished square footage for cost calculation, accounting for shelled floors
        let finishedSF = originalPredesignScheme.grossSF; // Default to full GSF if no floor data
        if (originalPredesignScheme.floorData && originalPredesignScheme.floorData.length > 0) {
            finishedSF = originalPredesignScheme.floorData
                .filter(f => !f.shelled)
                .reduce((sum, f) => sum + f.sf, 0);
        }

        const componentsToAdjust = ['C Interiors', 'E Equipment and Furnishings'];

        // Merge square_footage from Predesign scheme with target_value from initialTargetValues
        costOfWork = originalPredesignScheme.costOfWork.map(component => {
            const targetValueData = initialTargetValues.find(tv => tv.name === component.name);
            let sf = Number(component.square_footage) || 0;

            // Adjust SF for components affected by shelled areas
            if (componentsToAdjust.includes(component.name)) {
                sf = finishedSF;
            }

            return {
                name: component.name,
                square_footage: sf,
                target_value: targetValueData ? Number(targetValueData.target_value) || 0 : 0,
                benchmark_low: targetValueData ? Number(targetValueData.benchmark_low) || 0 : 0,
                benchmark_high: targetValueData ? Number(targetValueData.benchmark_high) || 0 : 0
            };
        });
    } else if (state.currentScheme && Array.isArray(state.currentScheme.costOfWork)) {
        // Fallback: synthesize baseline from current working scheme so charts render pre-snapshot
        costOfWork = state.currentScheme.costOfWork.map(component => {
            const targetValueData = initialTargetValues.find(tv => tv.name === component.name);
            return {
                name: component.name,
                square_footage: Number(component.square_footage) || 0,
                target_value: targetValueData ? Number(targetValueData.target_value) || 0 : (Number(component.target_value) || 0),
                benchmark_low: targetValueData ? Number(targetValueData.benchmark_low) || 0 : (Number(component.benchmark_low) || 0),
                benchmark_high: targetValueData ? Number(targetValueData.benchmark_high) || 0 : (Number(component.benchmark_high) || 0)
            };
        });
    }
    
    return {
        name: getBaselineName(),
        color: "#9ca3af", // gray-400
        costOfWork: costOfWork,
        grossSF: state.originalData.grossSF || state.currentData?.grossSF || 0
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

/**
 * Handles taking a snapshot of the current state
 * @param {object} state - The application state
 * @param {object} ui - The UI module for dialogs and alerts
 * @param {function} renderCallback - Callback function to re-render after snapshot
 */

export async function takeSnapshot(state, ui, renderCallback) {
    if (state.snapshots.length >= 4) {
        ui.showAlert(
            "Snapshot Limit Reached",
            "You can only save up to 4 snapshots. Please delete an existing snapshot to save a new one."
        );
        return;
    }
    // If the user is on the Interiors view and has unsaved mix changes, warn and offer to update
    if (state.currentView === 'interiors' && state.interiors?.unsavedMix) {
        const confirmUpdate = await ui.showConfirmDialog(
            'Unsaved Classroom Mix',
            'You have changed the Classroom Mix but have not updated the Target Values. Update them now before taking a snapshot?',
            'Yes, Update',
            'No, Continue'
        );

        if (confirmUpdate) {
            const { blendedByCategory, totalEffectiveSf } = computeBlendedInteriorsTargetsFromCurrentMix();
            if (totalEffectiveSf > 0) {
                const components = state.currentScheme?.costOfWork || [];
                await applyInteriorsTargetsUpdateFromBlended(blendedByCategory, components, ui, true);
            }
        }
    }

    const snapshotName = await ui.showDialog({
        title: "Take Snapshot",
        placeholder: "Enter a name for this snapshot",
        confirmText: "Create Snapshot",
        cancelText: "Cancel",
        isConfirmation: false
    });
    
    if (snapshotName) {
        const phase2CostOfWork = state.currentScheme.costOfWork;
        const snapshotCostOfWork = phase2CostOfWork.map(c => ({
            name: c.name,
            target_value: c.target_value,
            square_footage: c.square_footage
        }));
        // Compute floorData from current floor settings so snapshots persist shelled floors
        const floors = Math.min(Math.max(Number(state.numFloors) || 1, 1), 5);
        const shelled = Math.min(Math.max(Number(state.shelledFloorsCount) || 0, 0), floors);
        const perFloorSF = floors > 0 ? (Number(state.currentData?.grossSF) || 0) / floors : 0;
        const floorData = Array.from({ length: floors }, (_, idx) => ({
            phase: 1,
            sf: perFloorSF,
            // Treat highest-numbered floors as shelled based on count
            shelled: idx >= (floors - shelled)
        }));

        const snapshot = {
            name: snapshotName,
            grossSF: state.currentData.grossSF,
            costOfWork: snapshotCostOfWork,
            floorData,
            interiors: {
                // Persist the user's Interiors SF inputs and $/SF categories
                mixSF: state.interiors && state.interiors.mixSF
                    ? JSON.parse(JSON.stringify(state.interiors.mixSF))
                    : {},
                targetValues: state.interiors && Array.isArray(state.interiors.targetValues)
                    ? JSON.parse(JSON.stringify(state.interiors.targetValues))
                    : []
            }
        };
        
        state.addSnapshot(snapshot);
        console.log('All snapshots:', state.snapshots);
        renderCallback(); // Re-render to update the summary view
    }
}