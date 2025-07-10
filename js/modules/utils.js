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
 * Formats a number to a string with thousands separators.
 * @param {number} d - The number to format.
 * @returns {string} The formatted number string.
 */
export const formatNumber = (d) => d.toLocaleString('en-US');

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