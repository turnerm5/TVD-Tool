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
    { "Type": "Indirect", "Category": "GCs and Insurance", "Subcategory": "SGCs, CA, and Fee", "Percentage": 0.094 },
    { "Type": "Indirect", "Category": "Escalation & Contingency", "Subcategory": "Design and Escalation Contingency", "Percentage": 0.076 },
    { "Type": "Indirect", "Category": "Escalation & Contingency", "Subcategory": "Construction Contingency", "Percentage": 0.04 },
    { "Type": "Indirect", "Category": "GCs and Insurance", "Subcategory": "Insurance", "Percentage": 0.022 },
    { "Type": "Indirect", "Category": "Permits", "Subcategory": "Building Permit", "Percentage": 0.003 },

    // Fixed-dollar indirects
    { "Type": "Indirect", "Category": "Design & Preconstruction", "Subcategory": "Design", "Amount": 5000000 },

    // Fixed-dollar Cost of Work additions (direct costs)
    { "Type": "CostOfWork", "Category": "Demolition", "Subcategory": "Demo", "Amount": 5000000 },
    { "Type": "CostOfWork", "Category": "Site", "Subcategory": "Site Infrastructure", "Amount": 3000000 }
];


