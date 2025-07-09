# Interactive Target Value Design (TVD) Tool

An interactive web-based tool for visualizing, adjusting, and analyzing project budgets using Target Value Design (TVD) principles. This tool allows teams to collaboratively explore cost scenarios, compare against benchmark data, and maintain alignment with the project's target value.

## Key Features

- **Multiple Views:**
    - **Slider View:** An interactive bar chart for visually adjusting component costs. Drag the "Current ROM" bar to see real-time cost balancing across unlocked components.
    - **Table View:** A detailed tabular breakdown of all components, allowing for precise numerical input and at-a-glance comparison.
    - **Benchmarks View:** A gallery of benchmark projects used for comparison, displaying their overall cost per square foot.

- **Dynamic Data Visualization:**
    - **Component Sliders:** Each component is represented by a vertical bar, showing its relationship to benchmark ranges and the target value.
    - **Benchmark Indicators:** On the sliders, circular markers (A, B, C, D) pinpoint the exact cost of each benchmark project for that component.
    - **Conditional Formatting:** In both the slider and table views, the "Current ROM" turns red if it falls outside the established low/high benchmark range, providing an immediate visual warning.
    - **Delta Values:** When a cost is adjusted, a "ghost bar" shows the original value and a label displays the positive (green) or negative (red) cost delta.

- **Data & Project Management:**
    - **Phase Selection:** Toggle between "Phase 1" and "Phase 2" components in the Slider View.
    - **Lock/Unlock Components:** Lock specific components in either view to prevent their values from changing during auto-balancing adjustments.
    - **Dynamic Summary Panel:** A header panel provides a real-time summary of the total budget, target cost, current cost, and variance for each phase.

- **File Handling:**
    - **JSON Data Upload:** Upload a project data file to visualize a custom budget.
    - **Sample Data:** Load built-in sample data for a quick demonstration.
    - **Export to JSON/CSV:** Export the current state of the project data to either a JSON or CSV file. Filenames are timestamped for uniqueness.
    - **Download Template:** Get a clean JSON template file to structure your own project data.

## Usage

1.  **Open `TVD.html`** in a modern web browser.
2.  On the splash screen, either **upload a JSON file** or click **"Use Sample Data"**.
3.  Navigate between the **Slider, Table, and Benchmarks views** using the buttons at the top.
4.  **Interact with the data:**
    - In **Slider View**, drag the dark grey "Current ROM" bars up or down.
    - In **Table View**, type new values directly into the "Current" column.
    - Click the lock icon (🔓/🔒) in either view to toggle a component's lock state.
5.  Use the buttons in the header to **Export**, **Reset to Original**, or **Start Over**.

## JSON Data Format

The tool uses a structured JSON file. A top-level `benchmarks` array defines the comparison projects, and the `phases` object contains the primary project's data, split into `phase1` and `phase2`.

```json
{
  "benchmarks": [
    {
      "id": "A",
      "name": "OSU Huang Collaborative Innovation Complex",
      "overall_sf_cost": 1050,
      "components": [
        { "name": "General Conditions", "cost": 33.50 },
        { "name": "Sitework", "cost": 65.00 }
      ]
    }
  ],
  "phases": {
    "phase1": {
      "totalProjectBudget": 25000000,
      "projectAreaSF": 32000,
      "components": [
        { "name": "General Conditions", "target_value": 30, "current_rom": 29 },
        { "name": "Demo", "target_value": 25, "current_rom": 26 }
      ]
    },
    "phase2": {
        "totalProjectBudget": 50000000,
        "projectAreaSF": 60000,
        "components": []
    }
  }
}
```
*Note: The `benchmark_low` and `benchmark_high` values for each component are calculated automatically from the `benchmarks` data upon loading.*

## Project Structure

```
.
├── TVD.html
├── README.md
├── data
│   └── sampleData.js
├── img
│   ├── hoffman.svg
│   ├── osu.jpg
│   ├── spark.jpg
│   ├── wsu.svg
│   ├── wsue.jpg
│   ├── wsutc.jpg
│   └── zgf.svg
├── js
│   └── tvd.js
└── styles
    └── tvd.css
```

## License

This tool is for internal use and demonstration purposes. 