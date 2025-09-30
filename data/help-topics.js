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

export const helpTopics = {
    'benchmarks': {
        title: 'Benchmarks',
        content: `
            <p>Browse comparable projects to ground your targets in real data. The grid shows one card per project with an image, overall $/SF, and GSF. Clicking a card expands in place and reveals a per-system table with $/SF and system details.</p>
            <p>Benchmark indicators also appear inside the <strong>Target Values</strong> and <strong>Interiors</strong> charts as blue markers at each system's $/SF. Hover them there for project-specific context.</p>
            <p><strong>👉 Actions:</strong></p>
            <ul>
                <li>Click a card to toggle its detailed system table.</li>
                <li>Use the per-system values to sanity-check and tune your targets.</li>
            </ul>
        `
    },
    'program': {
        title: 'Massing',
        content: `
            <p>Set the gross building size and massing assumptions that drive square footage by system. Use the controls at the top to set <strong>Overall Square Footage</strong>, choose the number of <strong>Floors (1–5)</strong>, and specify <strong>Shelled Floors</strong>.</p>
            <p>The table below updates each component's SF based on these choices (e.g., <em>Roofing</em> uses footprint, <em>Enclosure</em> scales with perimeter × floors, <em>Interiors/Equipment</em> track finished floors). You can also edit per-component SF directly.</p>
            <p>Indirect costs are calculated from imported percentages. The Grand Total reflects Cost of Work + Indirects, and the header shows the variance to GMP.</p>
            <p><strong>👉 Actions:</strong></p>
            <ul>
                <li>Enter Overall SF. If you change it after data is loaded, you’ll be prompted to recompute dependent SF.</li>
                <li>Select Floors and adjust Shelled Floors to test finished vs. shelled area.</li>
                <li>Edit individual component SF cells when needed.</li>
            </ul>
        `
    },
    'interiors': {
        title: 'Interiors',
        content: `
            <p>Define classroom and lab program mix and the per-room-type $/SF that roll up into <em>C Interiors</em>, <em>D Services</em>, and <em>E Equipment and Furnishings</em>.</p>
            <p><strong>👉 Actions:</strong></p>
            <ul>
                <li>Edit $/SF rates for each room type in the <strong>Values</strong> table.</li>
                <li>Use <strong>Interiors Mix</strong> presets to quickly assign room SF.</li>
                <li>Enter or adjust SF for each room type in the <strong>Classroom Mix</strong> table.</li>
                <li>Review calculated totals, %GSF, and Building Efficiency.</li>
                <li>Check the donut charts for % by Space and % by Cost.</li>
                <li>Compare your blended mix to current targets and benchmarks in the graph.</li>
                <li>Click <strong>Update Target Values</strong> to push the blended mix into the main budget (optionally balancing to keep the estimate stable).</li>
            </ul>
        `
    },
    'chart': {
        title: 'Target Values',
        content: `
            <p>Interactively set $/SF targets per system. Drag the dark bar to change a system; unlocked systems auto-balance to maintain the overall budget. A light gray bar shows the imported baseline. Blue caps show the benchmark range, and blue markers label specific projects.</p>
            <p>Use the left sidebar to toggle locks or apply <strong>TVD Decision Examples</strong> (preset lock sets). The <strong>Balance to GMP</strong> button proportionally distributes the variance across unlocked systems considering indirects.</p>
            <p><strong>👉 Actions:</strong></p>
            <ul>
                <li>Drag a system’s bar to adjust $/SF; review delta and benchmark context.</li>
                <li><strong>Lock</strong> systems or apply a preset; then fine-tune others.</li>
                <li>Click <strong>Balance to GMP</strong> to meet the budget using unlocked systems.</li>
                <li>Click <strong>Take Snapshot</strong> in the header to compare scenarios later.</li>
            </ul>
        `
    },
    'summary': {
        title: 'Summary',
        content: `
            <p>Compare only the scenarios you’ve saved as <em>Snapshots</em>. The left chart groups by system, the right shows stacked totals (including indirects) with a GMP line. A Program Comparison below summarizes Interiors mix by room type.</p>
            <p>The legend lists your snapshots; click a name to delete it (with confirmation). The table summarizes COW, indirects, total, GSF/NSF, $/GSF, $/NSF, and budget variance.</p>
            <p><strong>👉 Actions:</strong></p>
            <ul>
                <li>Use <strong>Take Snapshot</strong> in other views; then compare here.</li>
                <li>Click a legend item to remove a snapshot you no longer need.</li>
                <li>Use <strong>Save</strong> in the header to persist your current work.</li>
            </ul>
        `
    },
    'splash-screen': {
        title: 'Welcome to the Target Value Design Tool',
        content: `
            <p>Load data to begin budgeting with targets, massing, interiors, and comparisons. You’ll land in <strong>Massing</strong> after import, and can switch views with the navigation bar.</p>
            <p><strong>👉 Actions:</strong></p>
            <ul>
                <li>Drag & drop a JSON file or click <strong>Select File</strong>.</li>
                <li>Click <strong>Workshop 1</strong> to load sample data.</li>
                <li>Click <strong>Download JSON Template</strong> to start a new dataset.</li>
            </ul>
        `
    }
}; 