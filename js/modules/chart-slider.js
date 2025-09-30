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
 * @file chart-slider.js
 * @description Renders the main interactive slider chart and handles its interactions.
 */

import { state } from './state.js';
import * as dom from './dom.js';
import * as utils from './utils.js';
import * as ui from './ui.js';

let render, yScale;

export function setDependencies(fns) {
    render = fns.render;
    yScale = fns.yScale;
}

/**
 * Calculates the effective square footage for a component, accounting for building efficiency.
 * @param {object} component - The component data.
 * @returns {number} The effective square footage.
 */
function getEffectiveSf(component) {
    return component.square_footage;
}


/**
 * Distributes cost changes across unlocked components.
 * When a component's value is changed, this function calculates the delta
 * and distributes the inverse of that delta proportionally across all other unlocked components.
 * @param {object} changedComponent - The component object that was directly modified.
 * @param {number} newValue - The new `target_value` value for the changed component.
 * @param {string} phaseKey - The key for the current phase ('phase2').
 */
function applyChangeAndBalance(changedComponent, newValue, phaseKey) {
    // For phase2, use the current scheme data
    const phase = { costOfWork: state.currentScheme.costOfWork };

    // 1. Calculate the initial change in absolute cost from the user's action.
    const originalRom = changedComponent.target_value;
    const newRom = Math.max(0, newValue); // Ensure new value isn't negative
    const changedComponentEffectiveSf = getEffectiveSf(changedComponent);
    const initialCostChange = (newRom - originalRom) * changedComponentEffectiveSf;

    if (Math.abs(initialCostChange) < 0.01) return;

    // 2. Identify which components can absorb the change.
    const unlockedCostOfWork = phase.costOfWork.filter(c => {
        const key = `${phaseKey}-${c.name}`;
        return c !== changedComponent && !state.lockedCostOfWork.has(key) && c.square_footage > 0
    });

    // If no components can absorb the change, just apply it and let the total cost drift.
    if (unlockedCostOfWork.length === 0) {
        changedComponent.target_value = newRom;
        render();
        return;
    }

    // 3. Set the target component to its new value.
            changedComponent.target_value = newRom;

    // 4. Calculate the total cost that needs to be absorbed by the other components.
    const costToAbsorb = -initialCostChange;

    // 5. Distribute this cost change proportionally, handling cases where components bottom out at 0.
    let remainingCostToAbsorb = costToAbsorb;
    let componentsAvailableToAbsorb = [...unlockedCostOfWork];
    let iterations = 0; // Safety break to prevent infinite loops

    while (Math.abs(remainingCostToAbsorb) > 0.01 && componentsAvailableToAbsorb.length > 0 && iterations < 10) {
        
        // Calculate the total cost of all components available to absorb the change.
        const totalCostOfAvailableComponents = componentsAvailableToAbsorb.reduce((sum, comp) => {
            return sum + (comp.target_value * getEffectiveSf(comp));
        }, 0);

        if (totalCostOfAvailableComponents < 0.01) {
            // No cost left in components to absorb the change. Stop here.
            break;
        }

        const costToDistributeThisIteration = remainingCostToAbsorb;
        remainingCostToAbsorb = 0;
        const nextComponentsAvailable = [];

        componentsAvailableToAbsorb.forEach(comp => {
            const effectiveSf = getEffectiveSf(comp);
            if (effectiveSf === 0) return; 

            const currentCompCost = comp.target_value * effectiveSf;

            // Calculate this component's proportional share of the cost to absorb.
            const proportion = totalCostOfAvailableComponents > 0 ? currentCompCost / totalCostOfAvailableComponents : (1 / componentsAvailableToAbsorb.length);
            const costChangeForComp = costToDistributeThisIteration * proportion;
            
            const newCompCost = currentCompCost + costChangeForComp;

            if (newCompCost < 0) {
                // This component can't absorb its full share. Absorb what it can down to 0.
                const absorbedCost = -currentCompCost; // The amount of cost it can actually absorb.
                remainingCostToAbsorb += (costChangeForComp - absorbedCost); // Add un-absorbed amount to remainder.
                comp.target_value = 0;
            } else {
                // This component can absorb its share.
                const newRom = newCompCost / effectiveSf;
                comp.target_value = newRom;
                nextComponentsAvailable.push(comp);
            }
        });
        
        componentsAvailableToAbsorb = nextComponentsAvailable;
        iterations++;
    }

    // 6. If any cost remains un-absorbed (because all other components hit 0),
    // apply it back to the originally changed component to maintain the total budget.
    if (Math.abs(remainingCostToAbsorb) > 0.01 && changedComponentEffectiveSf > 0) {
        const leftoverRomChange = remainingCostToAbsorb / changedComponentEffectiveSf;
        changedComponent.target_value += leftoverRomChange;
        changedComponent.target_value = Math.max(0, changedComponent.target_value);
    }

    render();
}


/**
 * Renders the main interactive slider chart using D3.js.
 * This function uses the D3 enter/update/exit pattern to create and update the component columns.
 */
export function renderChart() {
    // Ensure the main slider area is wrapped in a white card like the rest of the app
    if (dom.mainChart) {
        dom.mainChart.classList.add('bg-white', 'p-4', 'rounded-lg', 'shadow-md', 'border', 'border-gray-200');
    }
            const phaseCostOfWork = state.currentScheme.costOfWork;
    // Set the number of columns in the CSS grid layout.
    dom.chartContainer.style("grid-template-columns", `repeat(${phaseCostOfWork.length}, 1fr)`);
    // Set the output range for the y-scale based on the container's current height.
    const paddingBottom = parseFloat(dom.chartContainer.style("padding-bottom"));
    const paddingTop = parseFloat(dom.chartContainer.style("padding-top"));
    const chartHeight = dom.chartContainer.node().clientHeight;
    yScale.range([chartHeight - paddingBottom, paddingTop]);
    
    // Bind data to the component columns. The key function (d.name) helps D3 track objects.
    const components = dom.chartContainer.selectAll(".component-column").data(phaseCostOfWork, d => d.name);
    
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
    
    // Merge the enter selection with the update selection.
    // All subsequent operations apply to both new and existing elements.
    const updateGroup = enterGroup.merge(components);
    
    // --- Update opacity for locked components ---
    updateGroup.style('opacity', d => {
        const key = `phase2-${d.name}`;
        return state.lockedCostOfWork.has(key) ? 0.4 : 1;
    });

    // --- Update positions and styles of all elements ---
    updateGroup.select(".benchmark-range")
        .style("top", d => Math.min(yScale(d.benchmark_low), yScale(d.benchmark_high)) + "px")
        .style("height", d => Math.abs(yScale(d.benchmark_low) - yScale(d.benchmark_high)) + "px")
        .style("bottom", null);

    updateGroup.select(".benchmark-cap-low").style("top", d => yScale(d.benchmark_low) + "px").style("bottom", null);
    updateGroup.select(".benchmark-cap-high").style("top", d => yScale(d.benchmark_high) + "px").style("bottom", null);
    // updateGroup.select(".target-value").style("top", d => yScale(d.target_value) + "px").style("bottom", null); // REMOVED
    
    updateGroup.select(".current-rom")
        .style("top", d => yScale(d.target_value) - 3 + "px")
        .style("bottom", null)
        .each(function(d) {
            const bar = d3.select(this);
            const isOutsideBenchmark = d.target_value < d.benchmark_low || d.target_value > d.benchmark_high;

            bar.classed('zero-rom-bar', d.target_value === 0);
            bar.classed('outside-benchmark', isOutsideBenchmark && d.target_value !== 0);
            
            if (d.target_value !== 0) {
                bar.style("background", isOutsideBenchmark ? null : '#1f2937');
                bar.style("border", null);
            } else {
                bar.style("background", null);
                bar.style("border", null);
            }
        });
    
    // Create a map of original component values for quick lookup.
            const originalPredesignScheme = utils.getBaselineScheme();
            const originalTargetValues = state.originalData.initialTargetValues || [];
            
            // Merge original square footage with original target values
            const originalComponents = {};
            if (originalPredesignScheme) {
                originalPredesignScheme.costOfWork.forEach(component => {
                    const targetValueData = originalTargetValues.find(tv => tv.name === component.name);
                                         originalComponents[component.name] = {
                        name: component.name,
                        square_footage: Number(component.square_footage) || 0,
                        target_value: targetValueData ? Number(targetValueData.target_value) || 0 : 0,
                        benchmark_low: targetValueData ? Number(targetValueData.benchmark_low) || 0 : 0,
                        benchmark_high: targetValueData ? Number(targetValueData.benchmark_high) || 0 : 0
                    };
                });
            }
    
    // Update labels and ghost bars for each component.
    updateGroup.each(function(d) {
        const original = originalComponents[d.name];
        
        // Always update the current value label and position it to the right of the black bar
        const valueGroup = d3.select(this).select(".value-label-group");
        valueGroup.select(".current-value-label").text(utils.formatCurrency(d.target_value));
        valueGroup.style("top", yScale(d.target_value) - 10 + "px").style("bottom", null);

        const ghostBar = d3.select(this).select(".ghost-rom");
        const deltaLabel = valueGroup.select(".delta-label");

        if (original) {
            // Position the ghost bar at the original value
            ghostBar.style("top", yScale(original.target_value) - 3 + "px").style("bottom", null);

            // Show/hide and update the delta label
            if (d.target_value !== original.target_value) {
                ghostBar.style("display", "block");
                const delta = d.target_value - original.target_value;
                const isOutsideBenchmark = d.target_value < d.benchmark_low || d.target_value > d.benchmark_high;
                deltaLabel.style("display", "block")
                    .text(`${delta > 0 ? '+' : ''}${utils.formatCurrency(delta)}`)
                    .classed('outside-benchmark', isOutsideBenchmark)
                    .classed('inside-benchmark', !isOutsideBenchmark);
            } else {
                ghostBar.style("display", "none");
                deltaLabel.style("display", "none");
            }
        } else {
            // No original baseline available; hide ghost and delta, but keep current value label visible
            ghostBar.style("display", "none");
            deltaLabel.style("display", "none");
        }
    });

    updateGroup.select(".component-label").text(d => d.name);

    ui.renderGlobalEstimate();
    renderLockControls();

    // --- Render the benchmark indicators (A, B, C, D) within each column's SVG ---
    updateGroup.each(function(componentData) {
        const group = d3.select(this);
        const svg = group.select('.benchmark-indicator-svg');
        const benchmarkProjects = state.currentData.benchmarks || [];

        const indicators = svg.selectAll('.benchmark-indicator-group')
            .data(benchmarkProjects.filter(p => p.costOfWork.some(c => c.name === componentData.name)));

        indicators.exit().remove();

        const enterIndicators = indicators.enter().append('g')
            .attr('class', 'benchmark-indicator-group');
        
        enterIndicators.append('line').attr('class', 'benchmark-indicator-line');
        enterIndicators.append('circle').attr('class', 'benchmark-indicator-circle');
        enterIndicators.append('text').attr('class', 'benchmark-indicator-label');

        const mergedIndicators = enterIndicators.merge(indicators);

        mergedIndicators.each(function(d) {
            const benchmarkComp = d.costOfWork.find(c => c.name === componentData.name);
            if (!benchmarkComp) return;

            const paddingTop = parseFloat(dom.chartContainer.style("padding-top"));
            const yPos = yScale(benchmarkComp.cost) + paddingTop;
            
            d3.select(this).select('.benchmark-indicator-line').attr('x1', '20%').attr('x2', '10%').attr('y1', yPos).attr('y2', yPos);
            d3.select(this).select('.benchmark-indicator-circle').attr('cx', '10%').attr('cy', yPos).attr('r', 8);
            d3.select(this).select('.benchmark-indicator-label').attr('x', '10%').attr('y', yPos).attr('dy', '0.35em').text(d.id);
        });
        
        // --- Benchmark Hover Tooltip Logic ---
        let benchmarkHoverTimeout;
        mergedIndicators
            .on('mouseenter', function(event, d) {
                clearTimeout(benchmarkHoverTimeout);
                benchmarkHoverTimeout = setTimeout(() => {
                    showBenchmarkTooltip(event, d, componentData);
                }, 200);
            })
            .on('mouseleave', function() {
                clearTimeout(benchmarkHoverTimeout);
                hideBenchmarkTooltip();
            });
    });
}

/**
 * Shows a tooltip with benchmark project details.
 * @param {MouseEvent} event - The mouse event for positioning.
 * @param {object} benchmarkData - The data for the benchmark project.
 * @param {object} componentData - The data for the component column being hovered.
 */
function showBenchmarkTooltip(event, benchmarkData, componentData) {
    hideBenchmarkTooltip(); // Ensure no duplicates

    // Find the specific component within the benchmark data that matches the current column
    const benchmarkComponent = benchmarkData.costOfWork.find(c => c.name === componentData.name);

    const tooltip = d3.select('body').append('div')
        .attr('class', 'benchmark-tooltip');

    // Use component-specific image if available, otherwise fall back to general project image
    const imageSource = (benchmarkComponent && benchmarkComponent.image) ? benchmarkComponent.image : benchmarkData.image;
    
    tooltip.append('img')
        .attr('src', imageSource);

    // Create content container for the text on the right side
    const contentContainer = tooltip.append('div')
        .attr('class', 'benchmark-tooltip-content');

    contentContainer.append('div')
        .attr('class', 'benchmark-tooltip-name')
        .text(benchmarkData.name);
    
    // Add system details and cost/sf if they exist
    if (benchmarkComponent) {
        // Add cost per square foot if available
        if (typeof benchmarkComponent.cost === 'number') {
            contentContainer.append('div')
                .attr('class', 'text-base benchmark-tooltip-cost')
                .style('margin-top', '8px')
                .text(`Cost: $${benchmarkComponent.cost.toFixed(2)}/SF`);
        }
        if (benchmarkComponent.systemDetail && benchmarkComponent.systemDetail !== "Detail needed.") {
            contentContainer.append('div')
                .attr('class', 'benchmark-tooltip-detail')
                .style('margin-top', '8px')
                .text(benchmarkComponent.systemDetail);
        }
        if (benchmarkComponent.pros) {
            const prosDiv = contentContainer.append('div').attr('class', 'benchmark-tooltip-pros').style('margin-top', '8px');
            prosDiv.append('span').style('font-weight', 'bold').text('✅ Pros: ');
            prosDiv.append('span').text(benchmarkComponent.pros);
        }
        if (benchmarkComponent.cons) {
            const consDiv = contentContainer.append('div').attr('class', 'benchmark-tooltip-cons').style('margin-top', '4px');
            consDiv.append('span').style('font-weight', 'bold').text('❌ Cons: ');
            consDiv.append('span').text(benchmarkComponent.cons);
        }
    }
    
    const tooltipNode = tooltip.node();
    const tooltipWidth = tooltipNode.offsetWidth;
    const tooltipHeight = tooltipNode.offsetHeight;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let left = event.pageX + 15;
    let top = event.pageY + 15;

    // If the tooltip would go off the right edge, display it to the left of the cursor.
    if (left + tooltipWidth > viewportWidth) {
        left = event.pageX - tooltipWidth - 15;
    }

    // If the tooltip would go off the bottom edge, display it above the cursor.
    if (top + tooltipHeight > viewportHeight) {
        top = event.pageY - tooltipHeight - 15;
    }
    
    // Position the tooltip
    tooltip.style('left', left + 'px')
           .style('top', top + 'px');
}

/**
 * Hides the benchmark tooltip.
 */
function hideBenchmarkTooltip() {
    d3.select('.benchmark-tooltip').remove();
}

/**
 * Renders the Y-axis labels for the main slider chart.
 */
export function renderYAxisLabels() {
    dom.yAxisLabelsContainer.html(''); // Clear previous labels and line

    // Add the vertical axis line
    const yRange = yScale.range();
    dom.yAxisLabelsContainer.append('div')
        .style('position', 'absolute')
        .style('right', '0')
        .style('top', `${yRange[1]}px`)
        .style('width', '1px')
        .style('height', `${yRange[0] - yRange[1]}px`)
        .style('background-color', 'currentColor'); // Use text color

    const ticks = yScale.ticks(10);
    ticks.forEach(tick => {
        const label = dom.yAxisLabelsContainer.append('div')
            .attr('class', 'y-axis-label')
            .text(`$${tick}`);
        
        label.style('position', 'absolute')
             .style('top', `${yScale(tick)}px`)
             .style('transform', 'translateY(-50%)');
    });
}

/**
 * Handles changes to the square footage inputs in the Program View table.
 */
export function handleSquareFootageCellChange(event) {
    const input = event.target;
    // Extract just the number from the input value (removing "SF" and change indicators)
    const cleanValue = input.value.replace(/[^0-9.,]/g, '').replace(/,/g, '');
    let newSF = parseFloat(cleanValue);
    const componentName = input.dataset.name;
    const phaseKey = 'phase2';

    if (isNaN(newSF) || newSF < 0) {
        // Find the original value to revert to if input is invalid
        const originalPredesignScheme = utils.getBaselineScheme();
        const originalComponent = originalPredesignScheme ? originalPredesignScheme.costOfWork.find(c => c.name === componentName) : null;
        const revertValue = originalComponent ? originalComponent.square_footage : 0;
        // Don't format here - let the blur event handle formatting
        input.value = revertValue.toLocaleString('en-US');
        return;
    }

    // For phase2, use the current scheme data
    const component = state.currentScheme.costOfWork.find(c => c.name === componentName);

    if (component) {
        // Store the previous value before changing it
        if (state.previousSquareFootage[componentName] === undefined) {
            state.previousSquareFootage[componentName] = component.square_footage;
        }
        
        component.square_footage = newSF;
        // Don't format the input here - let the blur event handle formatting
        // A change in square footage affects the total budget, so re-render everything.
        render();
    }
}

/**
 * Handles changes to the gross square footage input in the program view.
 * @param {Event} event - The input change event.
 */
export function handleGrossSfCellChange(event) {
    const newValue = parseFloat(event.target.value.replace(/,/g, ''));
    if (!isNaN(newValue)) {
        state.currentData.grossSF = newValue;
        render();
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
}

/**
 * Renders the total estimated cost display.
 */
// Removed local renderTotalEstimate; use ui.renderGlobalEstimate instead


/**
 * d3.drag 'drag' event handler.
 * As the user drags, it converts the mouse's Y position to a new ROM value and applies the change.
 * @param {Event} event - The d3 drag event.
 * @param {object} d - The data object for the dragged element.
 */
function dragged(event, d) {
    const newRom = yScale.invert(event.y);
    applyChangeAndBalance(d, newRom, 'phase2');
    ui.renderGlobalEstimate();
}

/**
 * d3.drag 'end' event handler.
 * @param {Event} event - The d3 drag event.
 * @param {object} d - The data object for the dragged element.
 */
function dragEnded(event, d) {
    d3.select(this).classed("active", false);
}

/**
 * Renders the lock controls table in the sidebar.
 */
function renderLockControls() {
    const phaseKey = 'phase2';
    // For phase2, use the current scheme data
    const costOfWork = state.currentScheme.costOfWork;
    const lockSets = state.currentData.lockSets || [];

    // Clear existing controls
    dom.lockControls.html('');

    // --- Lock Set Buttons ---
    if (lockSets.length > 0) {
        const lockSetContainer = dom.lockControls.append('div')
            .attr('class', 'mb-4');

        lockSetContainer.append('h4')
            .attr('class', 'font-bold text-sm mb-2')
            .text('TVD Decision Examples');

        lockSetContainer.selectAll('button.lock-set-btn')
            .data(lockSets)
            .enter()
            .append('button')
            .attr('class', d => {
                const isSelected = state.selectedLockSetName === d.name;
                return `lock-set-btn w-full text-left text-sm px-3 py-1.5 rounded-md font-medium border mb-1 ${isSelected ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`;
            })
            .text(d => d.name)
            .on('click', (event, d) => {
                const allComponentNames = costOfWork.map(c => c.name);
                const unlockedSet = new Set(d.unlocked);

                state.lockedCostOfWork.clear();

                allComponentNames.forEach(name => {
                    if (!unlockedSet.has(name)) {
                        const key = `${phaseKey}-${name}`;
                        state.lockedCostOfWork.add(key);
                    }
                });

                state.selectedLockSetName = d.name;
                render();
            });
    }


    // Create locked components section
    const lockedSection = dom.lockControls.append('div')
        .attr('class', 'mb-4');

    lockedSection.append('h4')
        .attr('class', 'font-semibold text-sm mb-2')
        .text('Locked');

    const componentButtons = lockedSection.selectAll('.component-btn')
        .data(costOfWork, d => d.name)
        .enter()
        .append('button')
        .attr('class', d => {
            const key = `${phaseKey}-${d.name}`;
            const isLocked = state.lockedCostOfWork.has(key);
            return `component-btn w-full text-left text-sm px-3 py-1.5 rounded-md font-medium border mb-1 ${
                isLocked
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`;
        })
        .text(d => d.name)
        .on('click', (event, d) => {
            const key = `${phaseKey}-${d.name}`;
            if (state.lockedCostOfWork.has(key)) {
                state.lockedCostOfWork.delete(key);
            } else {
                state.lockedCostOfWork.add(key);
            }
            // Manual toggles clear any selected lock set highlight
            state.selectedLockSetName = null;
            render();
        });

    // --- Toggle Lock/Unlock All Button ---
    const anyLocked = costOfWork.some(c => state.lockedCostOfWork.has(`${phaseKey}-${c.name}`));

    dom.lockControls.append('div')
        .attr('class', 'mt-4') // Add some space above the button
        .append('button')
        .attr('class', 'w-full text-sm px-3 py-1.5 rounded-md font-medium border bg-white text-gray-700 border-gray-300 hover:bg-gray-50 transition')
        .text(anyLocked ? 'Unlock All' : 'Lock All')
        .on('click', () => {
            const currentlyAnyLocked = costOfWork.some(c => state.lockedCostOfWork.has(`${phaseKey}-${c.name}`));

            if (currentlyAnyLocked) {
                // Unlock all components
                costOfWork.forEach(c => state.lockedCostOfWork.delete(`${phaseKey}-${c.name}`));
            } else {
                // Lock all components
                costOfWork.forEach(c => state.lockedCostOfWork.add(`${phaseKey}-${c.name}`));
            }
            // Clear selected lock set when bulk toggling
            state.selectedLockSetName = null;
            render(); // Re-render the chart and controls
        });
}


/**
 * Automatically adjusts all unlocked components to meet the total project budget.
 * This function calculates the current total scenario ROM, compares it to the target budget,
 * and distributes the difference proportionally across all unlocked components.
 */
export function balanceToGmp() {
    const phaseKey = 'phase2';
    // For phase2, use the current scheme data
    const phase = { costOfWork: state.currentScheme.costOfWork };
    const unlockedComponents = phase.costOfWork.filter(c => {
        const key = `${phaseKey}-${c.name}`;
        return !state.lockedCostOfWork.has(key) && c.square_footage > 0
    });

    if (unlockedComponents.length === 0) {
        alert("No unlocked components with square footage to adjust.");
        return;
    }

    const totalIndirectPercentage = d3.sum(state.indirectCostPercentages, p => p.percentage);
    const totalCow = utils.calculateTotalCostOfWork(phase.costOfWork);
    const currentIndirectCosts = totalCow * totalIndirectPercentage;
    const currentTotalCost = totalCow + currentIndirectCosts;
    const targetBudget = state.originalData.phase2.totalProjectBudget;
    const difference = targetBudget - currentTotalCost;

    if (Math.abs(difference) < 1) {
        alert("Already balanced to GMP.");
        return;
    }

    // We need to find the change in COW that will result in the desired total cost change.
    // Let deltaCOW be the change needed in the total Cost of Work.
    // newTotalCost = (totalCow + deltaCOW) + (totalCow + deltaCOW) * totalIndirectPercentage
    // newTotalCost = (totalCow + deltaCOW) * (1 + totalIndirectPercentage)
    // We want newTotalCost to be targetBudget.
    // targetBudget = (totalCow + deltaCOW) * (1 + totalIndirectPercentage)
    // targetBudget / (1 + totalIndirectPercentage) = totalCow + deltaCOW
    // deltaCOW = (targetBudget / (1 + totalIndirectPercentage)) - totalCow
    const requiredCowTotal = targetBudget / (1 + totalIndirectPercentage);
    const cowDifference = requiredCowTotal - totalCow;


    // Now distribute cowDifference across unlocked components
    const totalUnlockedSf = unlockedComponents.reduce((acc, c) => acc + getEffectiveSf(c), 0);

    if (totalUnlockedSf === 0) {
        alert("Cannot balance: total square footage of unlocked components is zero.");
        return;
    }

    const costChangePerEffectiveSf = cowDifference / totalUnlockedSf;

    let costRemainingToDistribute = cowDifference;

    const componentsAvailable = [...unlockedComponents];
    let iterations = 0;
    while(Math.abs(costRemainingToDistribute) > 1 && iterations < 5) {
        const sfAvailable = componentsAvailable.reduce((acc, c) => acc + getEffectiveSf(c), 0);
        if (sfAvailable === 0) break;
        
        const costPerSf = costRemainingToDistribute / sfAvailable;

        costRemainingToDistribute = 0;
        const componentsForNextRound = [];

        componentsAvailable.forEach(c => {
            const effectiveSf = getEffectiveSf(c);
            
            const romChange = costPerSf; // change in $/SF
            const newRom = c.target_value + romChange;
            
            if (newRom < 0) {
                const costToMakeZero = -c.target_value * effectiveSf;
                costRemainingToDistribute += (costPerSf * effectiveSf - costToMakeZero);
                c.target_value = 0;
            } else {
                c.target_value = newRom;
                componentsForNextRound.push(c);
            }
        });
        componentsAvailable.splice(0, componentsAvailable.length, ...componentsForNextRound);
        iterations++;
    }

    render();
} 