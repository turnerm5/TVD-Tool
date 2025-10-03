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
    { "Type": "Indirect", "Category": "Design", "Subcategory": "Design and Preconstruction", "Percentage": 0.1200 },
    { "Type": "Indirect", "Category": "GCs and Insurance", "Subcategory": "Fee", "Percentage": 0.0384 },
    { "Type": "Indirect", "Category": "GCs and Insurance", "Subcategory": "General Conditions", "Percentage": 0.054 },
    { "Type": "Indirect", "Category": "GCs and Insurance", "Subcategory": "Insurance and Bonding", "Percentage": 0.02145 },
    { "Type": "Indirect", "Category": "Escalation & Contingency", "Subcategory": "Contingency and Escalation", "Percentage": 0.07666666667 },


    // Fixed-dollar indirects (applied to total Cost of Work)
    // Fixed-dollar Cost of Work additions (direct costs)
    { "Type": "CostOfWork", "Category": "Demolition", "Subcategory": "Demo", "Amount": 5350000 },
    { "Type": "CostOfWork", "Category": "Site", "Subcategory": "Site Infrastructure", "Amount": 3000000 }
];


