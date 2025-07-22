
import { state } from './state.js';
import * as ui from './ui.js';

/**
 * Renders the Sankey chart.
 * This function will be responsible for creating and displaying the Sankey diagram.
 * @param {object} data - The data to be visualized.
 */
export function renderSankeyChart(data) {
    const phase1Data = data.phases.phase1;
    const { totalProjectBudget, costOfWork } = phase1Data;

    // Filter out items with a total of 0
    const filteredCostOfWork = costOfWork.filter(c => c.Total > 0);

    // --- 1. Create Nodes ---
    // Using a Set to ensure uniqueness for categories
    const categoryNames = [...new Set(filteredCostOfWork.map(c => c.Category))];
    const subCategoryNames = filteredCostOfWork.map(c => c.Subcategory);

    // Calculate category sum and check for a remainder to be used as "Available COW"
    const categorySum = filteredCostOfWork.reduce((sum, item) => sum + item.Total, 0);
    const difference = totalProjectBudget - categorySum;

    if (difference > 0) {
        categoryNames.push("Available COW");
        // Add a corresponding sub-category node to make it stop in the middle
        subCategoryNames.push("Unallocated");
    }

    const nodes = [
        { name: "Total Project Budget" },
        ...categoryNames.map(name => ({ name })),
        ...subCategoryNames.map(name => ({ name }))
    ];

    // Create a map for quick node lookup by name
    const nodeMap = new Map(nodes.map((node, i) => [node.name, i]));

    // --- 2. Create Links ---
    const links = [];

    // Aggregate totals for each category
    const categoryTotals = new Map();
    for (const item of filteredCostOfWork) {
        const currentTotal = categoryTotals.get(item.Category) || 0;
        categoryTotals.set(item.Category, currentTotal + item.Total);
    }

    // If there's a difference, add it as a separate category
    if (difference > 0) {
        categoryTotals.set("Available COW", difference);
    }

    // Links from "Total Project Budget" to each Category
    for (const [categoryName, total] of categoryTotals.entries()) {
        links.push({
            source: nodeMap.get("Total Project Budget"),
            target: nodeMap.get(categoryName),
            value: total
        });
    }

    // Links from each Category to its Subcategories
    for (const item of filteredCostOfWork) {
        links.push({
            source: nodeMap.get(item.Category),
            target: nodeMap.get(item.Subcategory),
            value: item.Total
        });
    }

    // Add link for "Available COW" to its sub-category if it exists
    if (difference > 0) {
        links.push({
            source: nodeMap.get("Available COW"),
            target: nodeMap.get("Unallocated"),
            value: difference
        });
    }

    // --- 3. Render Chart ---
    const container = d3.select("#sankey-chart-container");
    container.selectAll("*").remove(); // Clear previous chart

    const width = container.node() ? container.node().getBoundingClientRect().width : 0;
    if (width === 0) {
        // console.warn("Sankey chart container is not visible. Skipping render.");
        return;
    }
    const height = 600;

    const sankey = d3.sankey()
        .nodeWidth(20) // Increased node width
        .nodePadding(20) // Adjusted node padding
        .extent([[1, 1], [width - 1, height - 5]]);

    const { nodes: graphNodes, links: graphLinks } = sankey({
        nodes: nodes.map(d => Object.assign({}, d)),
        links: links.map(d => Object.assign({}, d))
    });

    const svg = container.append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`);

    // --- Assign colors to nodes based on link gradients ---

    // 1. Assign colors to nodes based on their role in the Sankey
    // We'll use the same logic for both links and nodes, so colors match.
    const color = d3.scaleOrdinal(d3.schemeTableau10);

    // Helper to get node color
    function getNodeColor(node) {
        if (node.name === 'Total Project Budget') return "#FBBF24"; // Amber-400
        if (node.name === 'Unallocated') return "#981e32"; // WSU Crimson
        if (node.depth === 1) return color(node.name);
        // For subcategories, inherit from parent if possible
        if (node.depth === 2 && node.targetLinks && node.targetLinks.length > 0) {
            // Use the color of the first parent category
            const parent = node.targetLinks[0].source;
            return parent.color || color(parent.name);
        }
        // Fallback
        return "#A8A29E";
    }

    // Assign color property to all nodes
    graphNodes.forEach(node => {
        node.color = getNodeColor(node);
    });

    // 2. Draw links with gradients that match node colors
    svg.append("g")
        .attr("fill", "none")
        .attr("stroke-opacity", 0.5)
        .selectAll("g")
        .data(graphLinks)
        .join("g")
        .style("mix-blend-mode", "multiply")
        .append("path")
        .attr("d", d3.sankeyLinkHorizontal())
        .attr("stroke", function(d, i) {
            // Use node colors for gradient
            const gradientId = `sankey-gradient-${i}`;
            const svgEl = d3.select(this.ownerSVGElement);

            // Remove any existing gradient with this id (for rerenders)
            svgEl.select(`#${gradientId}`).remove();

            // Use assigned node colors
            let sourceColor = d.source.color;
            let targetColor = d.target.color;

            // Add the gradient definition to the SVG's <defs>
            const defs = svgEl.select("defs").empty() ? svgEl.insert("defs", ":first-child") : svgEl.select("defs");
            const grad = defs.append("linearGradient")
                .attr("id", gradientId)
                .attr("gradientUnits", "userSpaceOnUse")
                .attr("x1", d.source.x1)
                .attr("x2", d.target.x0)
                .attr("y1", (d.source.y0 + d.source.y1) / 2)
                .attr("y2", (d.target.y0 + d.target.y1) / 2);

            grad.append("stop")
                .attr("offset", "0%")
                .attr("stop-color", sourceColor);

            grad.append("stop")
                .attr("offset", "100%")
                .attr("stop-color", targetColor);

            return `url(#${gradientId})`;
        })
        .attr("stroke-width", d => Math.max(1, d.width))
        .append("title") // Add tooltip for links
        .text(d => `${d.source.name} → ${d.target.name}\n${d3.format("$,.0f")(d.value)}`);

    // 3. Draw nodes using the same color as the gradient start/end
    svg.append("g")
        .attr("stroke", "#000")
        .selectAll("rect")
        .data(graphNodes)
        .join("rect")
        .attr("x", d => d.x0)
        .attr("y", d => d.y0)
        .attr("height", d => d.y1 - d.y0)
        .attr("width", d => d.x1 - d.x0)
        .attr("fill", d => d.color)
        .append("title") // Add tooltip for nodes
        .text(d => `${d.name}\n${d3.format("$,.0f")(d.value)}`);

    // Add labels
    svg.append("g")
        .attr("font-family", "sans-serif")
        .attr("font-size", 12)
        .selectAll("text")
        .data(graphNodes)
        .join("text")
        .attr("x", d => d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6)
        .attr("y", d => (d.y1 + d.y0) / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", d => d.x0 < width / 2 ? "start" : "end")
        .text(d => `${d.name} (${d3.format("$,.0f")(d.value)})`);
} 