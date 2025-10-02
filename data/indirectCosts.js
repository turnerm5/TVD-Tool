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

const INDIRECT_COSTS = [
    // Percentage-based indirects (applied to total Cost of Work)
    { "Type": "Indirect", "Category": "Design", "Subcategory": "Design and Preconstruction", "Amount": 7200000 },
    { "Type": "Indirect", "Category": "GCs and Insurance", "Subcategory": "Fee", "Amount": 2307653 },
    { "Type": "Indirect", "Category": "GCs and Insurance", "Subcategory": "General Conditions", "Amount": 3240000 },
    { "Type": "Indirect", "Category": "GCs and Insurance", "Subcategory": "Insurance and Bonding", "Amount": 1287000 },
    { "Type": "Indirect", "Category": "Escalation & Contingency", "Subcategory": "Contingency and Escalation", "Amount": 4600000 },
    // Fixed-dollar Cost of Work additions (direct costs)
    { "Type": "CostOfWork", "Category": "Demolition", "Subcategory": "Demo", "Amount": 5350000 },
    { "Type": "CostOfWork", "Category": "Site", "Subcategory": "Site Infrastructure", "Amount": 3000000 }
];


