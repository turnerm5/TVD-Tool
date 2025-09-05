# Interactive Target Value Design (TVD) Tool

**September 5, 2025**  
This is the version of the Interactive Target Value Design (TVD) Tool presented at the interactive meeting.


An interactive web-based tool for visualizing, adjusting, and analyzing project budgets using Target Value Design (TVD) principles. This tool allows teams to collaboratively explore cost scenarios, compare against benchmark data, and maintain alignment with the project's target value.

## Key Features

- **Multiple Views:**
    - **Sankey Chart:** Visualizes the budget flow from the total project budget down through categories and subcategories for Phase 1.
    - **Slider View:** An interactive bar chart for visually adjusting component costs. Drag the "Current ROM" bar to see real-time cost balancing across unlocked components.
    - **Program View:** A detailed tabular breakdown of all Phase 2 components, allowing for precise numerical input and at-a-glance comparison.
    - **Benchmarks View:** A gallery of benchmark projects used for comparison, displaying their overall cost per square foot.
    - **Summary View:** A comprehensive summary table and charts that compare the baseline data against various "what-if" scenarios (snapshots).

- **Dynamic Data Visualization:**
    - **Component Sliders:** Each component is represented by a vertical bar, showing its relationship to benchmark ranges and the target value.
    - **Benchmark Indicators:** On the sliders, circular markers (A, B, C, D) pinpoint the exact cost of each benchmark project for that component.
    - **Conditional Formatting:** In both the slider and table views, the "Current ROM" turns red if it falls outside the established low/high benchmark range, providing an immediate visual warning.
    - **Delta Values:** When a cost is adjusted, a "ghost bar" shows the original value and a label displays the positive (green) or negative (red) cost delta.

- **Data & Project Management:**
    - **Lock/Unlock Components:** Lock specific components in either view to prevent their values from changing during auto-balancing adjustments.
    - **Take Snapshots:** Capture up to three "snapshots" of the current budget scenario. These scenarios are saved with the project and can be compared in the Summary View.
    - **Dynamic Summary Panel:** A header panel provides a real-time summary of the total budget, target cost, current cost, and variance for each phase.

- **File Handling:**
    - **Load Project Data:** Upload a project data file (JSON) to visualize a custom budget.
    - **Save Project State:** Save the current session to a JSON file. This file preserves the originally imported data and includes any snapshots you have taken, allowing you to resume your work later. The saved file is timestamped for uniqueness.
    - **Sample Data:** Load built-in sample data for a quick demonstration.
    - **Download Template:** Get a clean JSON template file to structure your own project data.

## Usage

1.  **Open `index.html`** in a modern web browser (live server recommended).
2.  On the splash screen, either **upload a JSON file** or click **"Use Sample Data"**.
3.  Navigate between the views using the buttons at the top.
4.  **Interact with the data:**
    - In **Slider View**, drag the dark grey "Current ROM" bars up or down.
    - In the **Program View**, type new values directly into the editable cells.
    - Click the lock icon (🔓/🔒) in either view to toggle a component's lock state.
    - Click **"Take Snapshot"** in the Chart or Program views to save a scenario.
5.  Use the buttons in the header to **Save**, **Reset to Original**, or **Start Over**. The **Reset** button will be disabled if no changes have been made.

## JavaScript Modules

The application's logic is modularized to separate concerns and improve maintainability.

-   **`main.js`**: The core application script. It initializes the application, orchestrates the different modules, and contains the main `render()` loop that is called whenever the state changes.
-   **`modules/state.js`**: Manages the global application state, including the currently loaded data, original data snapshot, active view/phase, snapshots, and locked components.
-   **`modules/dom.js`**: Caches selections for frequently accessed DOM elements to avoid repeated queries.
-   **`modules/ui.js`**: Handles general UI updates, such as the splash screen visibility, button states, and all modal/confirmation dialogs.
-   **`modules/file-handlers.js`**: Contains all logic for file operations: loading and parsing user-uploaded JSON, saving project state to JSON, and downloading the template.
-   **`modules/views.js`**: Responsible for rendering the non-chart views, including the Phase 1 table and the benchmarks grid/detail views.
-   **`modules/utils.js`**: A collection of helper functions for common tasks like formatting currencies and numbers.
-   **`modules/chart-program.js`**: Renders and manages all interactions for the detailed tabular program view for Phase 2.
-   **`modules/chart-slider.js`**: Renders and manages all interactions for the interactive slider chart view for Phase 2.
-   **`modules/chart-summary.js`**: Renders the summary view, including the comparison table and associated charts.
-   **`modules/chart-sankey.js`**: Renders the Sankey chart for the Phase 1 budget breakdown.

## Project Structure

```
.
├── index.html
├── README.md
├── data/
│   └── sampleData.js
├── img/
│   └── (project images and logos)
├── js/
│   ├── main.js
│   └── modules/
│       ├── chart-program.js
│       ├── chart-sankey.js
│       ├── chart-slider.js
│       ├── chart-summary.js
│       ├── chart-waterfall.js
│       ├── dom.js
│       ├── file-handlers.js
│       ├── state.js
│       ├── ui.js
│       ├── utils.js
│       └── views.js
├── styles/
│   └── tvd.css
```

## Author

**Marshall Turner**
For questions, feedback,or support, please contact [marshall-turner@hoffmancorp.com](mailto:marshall-turner@hoffmancorp.com).

## License

&copy; 2025 Hoffman Construction Company - All Rights Reserved