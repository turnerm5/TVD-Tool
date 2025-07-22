/**
 * @file dom.js
 * @description Caches and exports references to all DOM elements used in the application.
 */

// Caching DOM elements for performance and easier access.
export const splashScreen = document.getElementById('splash-screen');
export const mainContent = document.getElementById('main-content');
export const chartContainer = d3.select("#chart-container");
export const yAxisLabelsContainer = d3.select("#y-axis-labels-container");
export const resetButton = document.getElementById('reset-button');
export const startOverBtn = document.getElementById('start-over-btn');
export const exportJsonBtn = document.getElementById('export-json-btn');
export const useSampleDataBtn = document.getElementById('use-sample-data-btn');
export const downloadTemplateBtn = document.getElementById('download-template-btn');
export const fileDropZone = document.getElementById('file-drop-zone');
export const fileInput = document.getElementById('file-input');
export const fileNameDisplay = document.getElementById('file-name');
export const chartViewBtn = document.getElementById('chart-view-btn');
export const programViewBtn = document.getElementById('program-view-btn');
export const benchmarksViewBtn = document.getElementById('benchmarks-view-btn');
export const summaryViewBtn = document.getElementById('summary-view-btn');
export const phase1ViewBtn = document.getElementById('phase1-view-btn');

// Views
export const mainChart = document.getElementById('main-chart');
export const programView = document.getElementById('program-view');
export const benchmarksView = document.getElementById('benchmarks-view');
export const summaryView = document.getElementById('summary-view');
export const phase1View = document.getElementById('phase1-view');
export const interiorsView = document.getElementById('interiors-view');

export const summaryPanel = document.getElementById('summary-panel');
export const legend = document.getElementById('legend');
export const summaryLegend = document.getElementById('summary-legend');
export const maximizeBtn = document.getElementById('maximize-gmp-btn');
export const takeSnapshotBtn = document.getElementById('take-snapshot-btn'); 