/**
 * @file chart-slider.js
 * @description Renders the main interactive slider chart and handles its interactions.
 */

import { state } from './state.js';
import * as dom from './dom.js';
import * as utils from './utils.js';

// Forward-declare dependencies
let render, renderProgramView, updateSummary, yScale;
export function setDependencies(fns) {
    render = fns.render;
    renderProgramView = fns.renderProgramView;
    updateSummary = fns.updateSummary;
    yScale = fns.yScale;
}

/**
 * Distributes cost changes across unlocked components.
 * When a component's value is changed, this function calculates the delta
 * and distributes the inverse of that delta proportionally across all other unlocked components.
 * @param {object} changedComponent - The component object that was directly modified.
 * @param {number} newValue - The new `current_rom` value for the changed component.
 * @param {string} phaseKey - The key for the current phase ('phase1' or 'phase2').
 */
function applyChangeAndBalance(changedComponent, newValue, phaseKey) {
    const phase = state.currentData.phases[phaseKey];

    // 1. Calculate the initial change in absolute cost from the user's action.
    const originalRom = changedComponent.current_rom;
    const newRom = Math.max(0, newValue); // Ensure new value isn't negative
    const initialCostChange = (newRom - originalRom) * changedComponent.square_footage;

    if (Math.abs(initialCostChange) < 0.01) return;

    // 2. Identify which components can absorb the change.
    const unlockedComponents = phase.components.filter(c => {
        const key = `${phaseKey}-${c.name}`;
        return c !== changedComponent && !state.lockedComponents.has(key) && c.square_footage > 0
    });

    // If no components can absorb the change, just apply it and let the total cost drift.
    if (unlockedComponents.length === 0) {
        changedComponent.current_rom = newRom;
        render();
        return;
    }

    // 3. Set the target component to its new value.
    changedComponent.current_rom = newRom;

    // 4. Calculate the total cost that needs to be absorbed by the other components.
    const costToAbsorb = -initialCostChange;

    // 5. Distribute this cost change, handling cases where components bottom out at 0.
    // This loop ensures that if one component hits $0/SF, the remaining cost is
    // redistributed among the other available components.
    let remainingCostToAbsorb = costToAbsorb;
    let componentsAvailableToAbsorb = [...unlockedComponents];
    let iterations = 0; // Safety break to prevent infinite loops

    while (Math.abs(remainingCostToAbsorb) > 0.01 && componentsAvailableToAbsorb.length > 0 && iterations < 10) {
        const costShare = remainingCostToAbsorb / componentsAvailableToAbsorb.length;
        remainingCostToAbsorb = 0; // Reset for this iteration

        const nextComponentsAvailable = [];

        componentsAvailableToAbsorb.forEach(comp => {
            const currentCompRom = comp.current_rom;
            const sf = comp.square_footage;
            const romChangeForComp = costShare / sf;
            const newCompRom = currentCompRom + romChangeForComp;

            if (newCompRom < 0) {
                // This component can't absorb its full share. Absorb what it can down to 0.
                const absorbedCost = -currentCompRom * sf;
                remainingCostToAbsorb += (costShare - absorbedCost); // Add the un-absorbed amount to the remainder.
                comp.current_rom = 0;
            } else {
                // This component can absorb its full share for this iteration.
                comp.current_rom = newCompRom;
                nextComponentsAvailable.push(comp); // This component is still available for future adjustments.
            }
        });
        
        componentsAvailableToAbsorb = nextComponentsAvailable;
        iterations++;
    }

    // 6. If any cost remains un-absorbed (because all other components hit 0),
    // apply it back to the originally changed component to maintain the total budget.
    if (Math.abs(remainingCostToAbsorb) > 0.01 && changedComponent.square_footage > 0) {
        const leftoverRomChange = remainingCostToAbsorb / changedComponent.square_footage;
        changedComponent.current_rom += leftoverRomChange;
        changedComponent.current_rom = Math.max(0, changedComponent.current_rom);
    }

    render();
}


/**
 * Renders the main interactive slider chart using D3.js.
 * This function uses the D3 enter/update/exit pattern to create and update the component columns.
 */
export function renderChart() {
    const phaseComponents = state.currentData.phases[state.currentPhase].components;
    // Set the number of columns in the CSS grid layout.
    dom.chartContainer.style("grid-template-columns", `repeat(${phaseComponents.length}, 1fr)`);
    // Set the output range for the y-scale based on the container's current height.
    yScale.range([dom.chartContainer.node().clientHeight - parseFloat(dom.chartContainer.style("padding-bottom")), 0]);
    
    // Bind data to the component columns. The key function (d.name) helps D3 track objects.
    const components = dom.chartContainer.selectAll(".component-column").data(phaseComponents, d => d.name);
    
    // Remove any columns that are no longer in the data.
    components.exit().remove();

    // --- Create new elements for new data (the 'enter' selection) ---
    const enterGroup = components.enter().append("div").attr("class", "component-column");
    enterGroup.append("div").attr("class", "y-axis"); // The central grey line
    enterGroup.append("svg").attr("class", "benchmark-indicator-svg"); // SVG container for benchmark indicators
    enterGroup.append("div").attr("class", "benchmark-range"); // The light blue line indicating the benchmark range
    enterGroup.append("div").attr("class", "benchmark-cap benchmark-cap-low");
    enterGroup.append("div").attr("class", "benchmark-cap benchmark-cap-high");
    // enterGroup.append("div").attr("class", "target-value"); // The green target line - REMOVED
    enterGroup.append("div").attr("class", "ghost-rom"); // The semi-transparent bar showing the original value
    // The draggable "current ROM" bar.
    enterGroup.append("div").attr("class", "current-rom").call(d3.drag().on("start", dragStarted).on("drag", dragged).on("end", dragEnded));
    enterGroup.append("div").attr("class", "component-label");
    const valueLabelGroup = enterGroup.append("div").attr("class", "value-label-group");
    valueLabelGroup.append("div").attr("class", "current-value-label");
    valueLabelGroup.append("div").attr("class", "delta-label");
    enterGroup.append("div").attr("class", "lock-icon");

    // Merge the enter selection with the update selection.
    // All subsequent operations apply to both new and existing elements.
    const updateGroup = enterGroup.merge(components);
    
    // --- Update positions and styles of all elements ---
    updateGroup.select(".benchmark-range")
        .style("top", d => Math.min(yScale(d.benchmark_low), yScale(d.benchmark_high)) + "px")
        .style("height", d => Math.abs(yScale(d.benchmark_low) - yScale(d.benchmark_high)) + "px")
        .style("bottom", null);

    updateGroup.select(".benchmark-cap-low").style("top", d => yScale(d.benchmark_low) + "px").style("bottom", null);
    updateGroup.select(".benchmark-cap-high").style("top", d => yScale(d.benchmark_high) + "px").style("bottom", null);
    // updateGroup.select(".target-value").style("top", d => yScale(d.target_value) + "px").style("bottom", null); // REMOVED
    
    updateGroup.select(".current-rom")
        .style("top", d => yScale(d.current_rom) - 3 + "px")
        .style("bottom", null)
        .each(function(d) {
            const bar = d3.select(this);
            const isOutsideBenchmark = d.current_rom < d.benchmark_low || d.current_rom > d.benchmark_high;

            if (d.current_rom === 0) {
                bar.style("background", "none")
                   .style("border", "2px dashed #9ca3af") // gray-400
                   .classed('zero-rom-bar', true);
            } else {
                bar.style("background", isOutsideBenchmark ? '#dc2626' : '#1f2937') // Red if outside, dark grey if inside
                   .style("border", "none")
                   .classed('zero-rom-bar', false);
            }
        });
    
    // Create a map of original component values for quick lookup.
    const originalComponents = state.originalData.phases[state.currentPhase].components.reduce((acc, val) => ({ ...acc, [val.name]: val }), {});
    
    // Update labels and ghost bars for each component.
    updateGroup.each(function(d) {
        const original = originalComponents[d.name];
        if (!original) return;
        
        // Update the value labels
        const valueGroup = d3.select(this).select(".value-label-group");
        valueGroup.select(".current-value-label").text(utils.formatCurrency(d.current_rom));
        valueGroup.style("top", yScale(d.current_rom) - 10 + "px").style("bottom", null);

        // Position the ghost bar
        const ghostBar = d3.select(this).select(".ghost-rom");
        ghostBar.style("top", yScale(original.current_rom) - 3 + "px").style("bottom", null);

        // Show/hide and update the delta label
        const deltaLabel = valueGroup.select(".delta-label");
        if (d.current_rom !== original.current_rom) {
            ghostBar.style("display", "block");
            const delta = d.current_rom - original.current_rom;
            const isOutsideBenchmark = d.current_rom < d.benchmark_low || d.current_rom > d.benchmark_high;
            deltaLabel.style("display", "block")
                .text(`${delta > 0 ? '+' : ''}${utils.formatCurrency(delta)}`)
                .style("color", isOutsideBenchmark ? '#dc2626' : '#16a34a'); // Red if outside, green if inside
        } else {
            ghostBar.style("display", "none");
            deltaLabel.style("display", "none");
        }
    });

    updateGroup.select(".component-label").text(d => d.name);
    updateGroup.select(".lock-icon")
        .style('display', 'block')
        .style('opacity', d => {
            const key = `${state.currentPhase}-${d.name}`;
            return state.lockedComponents.has(key) ? 1 : 0.5;
        })
        .text(d => {
            const key = `${state.currentPhase}-${d.name}`;
            return state.lockedComponents.has(key) ? '🔒' : '🔓';
        })
        .on('click', (event, d) => {
            event.stopPropagation();
            const key = `${state.currentPhase}-${d.name}`;
            if (state.lockedComponents.has(key)) {
                state.lockedComponents.delete(key);
            } else {
                state.lockedComponents.add(key);
            }
            render();
        });

    // --- Render the benchmark indicators (A, B, C, D) within each column's SVG ---
    updateGroup.each(function(componentData) {
        const group = d3.select(this);
        const svg = group.select('.benchmark-indicator-svg');
        const benchmarkProjects = state.currentData.benchmarks || [];

        const indicators = svg.selectAll('.benchmark-indicator-group')
            .data(benchmarkProjects.filter(p => p.components.some(c => c.name === componentData.name)));

        indicators.exit().remove();

        const enterIndicators = indicators.enter().append('g')
            .attr('class', 'benchmark-indicator-group');
        
        enterIndicators.append('line').attr('class', 'benchmark-indicator-line');
        enterIndicators.append('circle').attr('class', 'benchmark-indicator-circle');
        enterIndicators.append('text').attr('class', 'benchmark-indicator-label');

        const mergedIndicators = enterIndicators.merge(indicators);

        mergedIndicators.each(function(d) {
            const benchmarkComp = d.components.find(c => c.name === componentData.name);
            if (!benchmarkComp) return;

            const yPos = yScale(benchmarkComp.cost);
            
            d3.select(this).select('.benchmark-indicator-line').attr('x1', '20%').attr('x2', '10%').attr('y1', yPos).attr('y2', yPos);
            d3.select(this).select('.benchmark-indicator-circle').attr('cx', '10%').attr('cy', yPos).attr('r', 6);
            d3.select(this).select('.benchmark-indicator-label').attr('x', '10%').attr('y', yPos).attr('dy', '0.35em').text(d.id);
        });
    });
}

/**
 * Renders the Y-axis labels for the main slider chart.
 */
export function renderYAxisLabels() {
    dom.yAxisLabelsContainer.html('');
    const ticks = yScale.ticks(10);
    ticks.forEach(tick => {
        dom.yAxisLabelsContainer.append('div')
            .style('position', 'absolute')
            .style('top', `${yScale(tick)}px`)
            .style('transform', 'translateY(-50%)')
            .text(`$${tick}`);
    });
}

/**
 * Handles the 'change' event from the editable cells in the main data table.
 * @param {Event} event - The input change event.
 */
export function handleCurrentRomCellChange(event) {
    const input = event.target;
    const newValue = parseFloat(input.value);
    const phaseKey = input.dataset.phase;
    const componentName = input.dataset.name;

    const component = state.currentData.phases[phaseKey].components.find(c => c.name === componentName);
    if (component) {
        applyChangeAndBalance(component, newValue, phaseKey);
    }
}

/**
 * Handles changes to the square footage inputs in the Program View table.
 * @param {Event} event - The input change event.
 */
export function handleSquareFootageCellChange(event) {
    const input = event.target;
    // Remove commas before parsing to handle formatted numbers.
    const newValue = parseFloat(input.value.replace(/,/g, ''));
    const phaseKey = input.dataset.phase;
    const componentName = input.dataset.name;

    const component = state.currentData.phases[phaseKey].components.find(c => c.name === componentName);
    if (component) {
        component.square_footage = newValue;
        render(); // Rerender to update dependent views like the waterfall chart.
    }
}


// --- DRAG-AND-DROP LOGIC ---

/**
 * d3.drag 'start' event handler.
 * When dragging starts, it locks the component being dragged so it doesn't auto-balance.
 * @param {Event} event - The d3 drag event.
 * @param {object} d - The data object for the dragged element.
 */
function dragStarted(event, d) { 
    d3.select(this).raise().classed("active", true); 
    const key = `${state.currentPhase}-${d.name}`;
    if (!state.lockedComponents.has(key)) { 
        state.lockedComponents.add(key);
        render(); // Re-render to show the lock immediately
    } 
}

/**
 * d3.drag 'drag' event handler.
 * As the user drags, it converts the mouse's Y position to a new ROM value and applies the change.
 * @param {Event} event - The d3 drag event.
 * @param {object} d - The data object for the dragged element.
 */
function dragged(event, d) {
    const newRomValue = Math.max(0, Math.min(state.yDomainMax, yScale.invert(event.y)));
    applyChangeAndBalance(d, newRomValue, state.currentPhase);
}

/**
 * d3.drag 'end' event handler.
 * @param {Event} event - The d3 drag event.
 * @param {object} d - The data object for the dragged element.
 */
function dragEnded() { d3.select(this).classed("active", false); }

/**
 * Balances the budget by adjusting unlocked components.
 * Proportionally adjusts the 'current_rom' of all unlocked components in the current phase
 * to make the total 'Scenario  ROM' equal to the 'Total Project Budget' (with a small buffer).
 * This function works whether the current total is over or under budget.
 */
export function balanceToGmp() {
    const phaseData = state.currentData.phases[state.currentPhase];
    const budget = phaseData.totalProjectBudget;
    const currentTotalCost = d3.sum(phaseData.components, d => d.current_rom * d.square_footage);

    // If we are already at the target (within the $1 buffer), do nothing.
    if (Math.abs(budget - currentTotalCost) <= 1) {
        console.log("Scenario ROM is already balanced to GMP. No action taken.");
        return;
    }

    // Subtract a small buffer ($100.00) to prevent rounding errors from exceeding the budget.
    const delta = budget - currentTotalCost - 150;
    const unlockedComponents = phaseData.components.filter(c => {
        const key = `${state.currentPhase}-${c.name}`;
        return !state.lockedComponents.has(key);
    });

    if (unlockedComponents.length === 0) {
        console.warn("No unlocked components to adjust.");
        // We could add a user-facing alert here if desired.
        return;
    }

    const unlockedTotalCost = d3.sum(unlockedComponents, d => d.current_rom * d.square_footage);

    // Avoid division by zero if unlocked components have no cost.
    if (unlockedTotalCost <= 0) {
        console.warn("Unlocked components have a total cost of zero, cannot proportionally adjust.");
        return;
    }

    // Calculate the scaling factor and apply it to each unlocked component.
    const scalingFactor = 1 + (delta / unlockedTotalCost);
    unlockedComponents.forEach(component => {
        // We round the result to 2 decimal places to avoid floating point inaccuracies.
        component.current_rom = parseFloat((component.current_rom * scalingFactor).toFixed(2));
    });

    // Refresh the UI to reflect the changes.
    renderChart();
    updateSummary();
    if (document.getElementById('program-view').style.display !== 'none') {
        renderProgramView();
    }
    // After adjusting, the "Reset to Original" button should be enabled.
    document.getElementById('reset-button').disabled = false;
} 