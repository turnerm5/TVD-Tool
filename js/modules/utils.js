/**
 * @file utils.js
 * @description Utility and helper functions for the TVD Tool.
 */

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
 * Calculates the total cost for a given set of components.
 * @param {Array} components - An array of component objects.
 * @param {string} key - The key to use for the cost calculation (e.g., 'current_rom').
 * @returns {number} The total calculated cost.
 */
export function calculateTotal(components, key) {
    return components.reduce((acc, c) => acc + (c[key] * c.square_footage), 0);
} 