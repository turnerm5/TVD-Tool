# Target Value Design Tool

This is an interactive web tool for visualizing and adjusting project budgets using Target Value Design (TVD) principles. It is branded for the WSU Integrated Science Building project.

## Features
- **Interactive Chart:** Drag to adjust component ROM values, with real-time feedback and auto-balancing.
- **Lock/Unlock Bars:** Lock specific components to prevent them from changing during adjustments.
- **Benchmark Visualization:** See project benchmarks, target values, and current ROMs for each component.
- **File Upload:** Upload your own JSON data file to visualize your project's budget.
- **Sample Data:** Use built-in sample data for quick demonstration.
- **Export/Import:** Download your current data as JSON or reset to the original state.
- **Branding:** Displays Hoffman and ZGF logos above the project title.

## Usage
1. **Open `TVD.html` in your browser.**
2. **Upload a JSON file** with your project data, or use the sample data provided.
3. **Interact with the chart:**
   - Drag the black bars to adjust ROM values.
   - Click the lock icon below a bar to lock/unlock it.
   - View benchmarks, targets, and deltas in real time.
4. **Export your data** or reset as needed using the buttons in the header.

## JSON Data Format
Your JSON file should look like this:
```json
{
  "totalProjectBudget": 20000000,
  "projectAreaSF": 30000,
  "components": [
    { "name": "General Conditions", "benchmark_low": 20, "benchmark_high": 35, "target_value": 30, "current_rom": 29 },
    { "name": "Demo", "benchmark_low": 22, "benchmark_high": 28, "target_value": 25, "current_rom": 26 }
    // ... more components ...
  ]
}
```

## Customization
- **Branding:** Replace `img/hoffman.svg` and `img/zgf.svg` with your own SVGs for different branding.
- **Project Title:** Edit the title in the header section of `TVD.html`.
- **Sample Data:** Modify the `sampleData` object in `TVD.html` for your own default dataset.

## Requirements
- Modern web browser (Chrome, Edge, Firefox, Safari)
- No server or build step required; all logic is in `TVD.html`.

## Folder Structure
```
├── TVD.html         # Main application file
├── img/
│   ├── hoffman.svg  # Hoffman logo
│   └── zgf.svg      # ZGF logo
└── README.md        # This file
```

## License
This tool is for internal use and demonstration purposes. Contact the authors for reuse or adaptation. 