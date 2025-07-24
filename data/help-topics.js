export const helpTopics = {
    'benchmarks': {
        title: 'Benchmarks View',
        content: `
            <p>This view compares the Integrated Sciences Building against historical data from other contemporary laboratory buildings in the region. Each card represents a past project with key metrics, providing a basis for cost comparison.</p>
            <p>We selected benchmarks like the <strong>University of Washington Nano-engineering Sciences</strong>, <strong>University of Oregon Knight Campus</strong>, and <strong>Washington State University Spark</strong> because they share similar program types, structural systems, and research-intensive functions. These projects provide relevant cost data for enclosure, services, and superstructure systems that are comparable to the Integrated Sciences Building.</p>
            <p><strong>👉 Actions:</strong></p>
            <ul>
                <li>Click on a benchmark card to see a detailed breakdown of its costs by building system.</li>
                <li>Use this information to inform the initial target values for the Integrated Sciences Building.</li>
            </ul>
        `
    },
    'phase1': {
        title: 'Phase 1 Costs',
        content: `
            <p>This view visualizes the initial cost distribution for the Integrated Sciences Building based on the conceptual design. It uses a Sankey diagram to show how high-level costs flow into more detailed sub-categories.</p>
            <p>For the Integrated Sciences Building, early critical cost drivers include the <strong>demolition of existing structures</strong> on site and the extensive <strong>site utility work</strong> required to support a modern laboratory facility. This chart helps the team understand how these initial investments impact the overall budget before moving into more detailed design phases.</p>
        `
    },
    'program': {
        title: 'Phase 2 Program',
        content: `
            <p>This view is for defining and adjusting the programmatic requirements of the Integrated Sciences Building to develop a more detailed cost estimate. The table shows different space types, their sizes, and their costs.</p>
            <p>The team can test different scenarios by adjusting the square footage for various programs. For example, you can explore the cost implications of adding a <strong>shell floor</strong> for future expansion or modifying the allocation between lab and office space. The schemes available (e.g., Pavilion, Hub, Max Floor) will auto-populate the table with different starting configurations based on design studies.</p>
            <p><strong>👉 Actions:</strong></p>
            <ul>
                <li>Adjust the values in the table to reflect the desired program areas and quantities. The chart will update to show the impact of your changes on the overall project cost.</li>
                <li>Once you have a scenario you like, take a <strong>snapshot</strong> to save it. This allows you to compare different program options in the Summary view.</li>
            </ul>
        `
    },
    'chart': {
        title: 'Target Values',
        content: `
            <p>This is the primary view for setting and adjusting the target values for the Integrated Sciences Building's different systems. This interactive chart is where the team collaborates to align the project budget with the design.</p>
            <p>You can use the sliders to adjust cost targets for each system. The total cost of the current scenario will always remain the same; adjusting one slider will automatically balance the costs across the other unlocked systems. This feature allows for real-time "what-if" analysis. For example, if the team decides to invest more in the building enclosure, you can see the immediate impact on funds available for interior finishes or mechanical systems.</p>
            <p><strong>👉 Actions:</strong></p>
            <ul>
                <li>Use the sliders to adjust the cost targets for each system.</li>
                <li><strong>Lock</strong> values when you receive firm pricing from a trade partner or want to exclude a system from automatic balancing. Locked values will not change when other sliders are adjusted.</li>
                <li>Click <strong>'Balance to GMP'</strong> to automatically distribute any budget variance across all unlocked values to meet the Guaranteed Maximum Price (GMP).</li>
                <li>Take a <strong>snapshot</strong> to save the current scenario. This is crucial for comparing different cost strategies in the Summary view.</li>
            </ul>
        `
    },
    'summary': {
        title: 'Summary View',
        content: `
            <p>This view provides a high-level overview of the cost scenarios developed for the Integrated Sciences Building. It's designed to compare different budget strategies the team has saved as snapshots.</p>
            <p>The charts at the top offer two ways to visualize the data:
                <ul>
                    <li>The <strong>side-by-side bar chart</strong> allows for a direct comparison of the cost of each building system across different scenarios.</li>
                    <li>The <strong>stacked bar chart</strong> shows the total project cost for each scenario and how the different systems contribute to that total.</li>
                </ul>
            </p>
            <p>Below the charts, a detailed <strong>summary table</strong> provides the precise cost data for each system in every scenario, allowing for a granular analysis of the differences. This view is essential for decision-making and for communicating the financial status of the project to stakeholders.</p>
            <p><strong>👉 Actions:</strong></p>
            <ul>
                <li>Compare different saved scenarios to evaluate cost strategies.</li>
                <li>Export your data and summary reports for presentations and records.</li>
            </ul>
        `
    },
    'splash-screen': {
        title: 'Welcome to the Target Value Design Tool',
        content: `
            <p>This tool helps manage the Integrated Sciences Building's budget by visualizing cost distribution and allowing the team to set and adjust target values for various building systems.</p>
            <p><strong>👉 Actions:</strong></p>
            <ul>
                <li>Upload project data in JSON format.</li>
                <li>Use the sample data for the Integrated Sciences Building to explore the tool's features.</li>
                <li>Download a JSON template to structure new project data.</li>
            </ul>
        `
    }
}; 