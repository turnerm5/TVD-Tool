/**
 * @file state.js
 * @description Manages the global state for the TVD Tool application.
 * This includes the core data, UI state, and user selections.
 * State is exposed via getters and setters to control mutations.
 */

let _originalData = null;
let _currentData = null;
let _yDomainMax = 100;
let _currentPhase = 'phase1';
let _currentView = 'benchmarks';
let _selectedBenchmark = null;
let _lockedComponents = new Set();
let _snapshots = [];

export const state = {
    get originalData() { return _originalData; },
    set originalData(data) { _originalData = data; },

    get currentData() { return _currentData; },
    set currentData(data) { _currentData = data; },

    get yDomainMax() { return _yDomainMax; },
    set yDomainMax(value) { _yDomainMax = value; },

    get currentPhase() { return _currentPhase; },
    set currentPhase(phase) { _currentPhase = phase; },

    get currentView() { return _currentView; },
    set currentView(view) { _currentView = view; },

    get selectedBenchmark() { return _selectedBenchmark; },
    set selectedBenchmark(id) { _selectedBenchmark = id; },

    get lockedComponents() { return _lockedComponents; },
    set lockedComponents(components) { _lockedComponents = components; },

    get snapshots() { return _snapshots; },
    addSnapshot(snapshot) {
        if (_snapshots.length < 3) {
            _snapshots.push(snapshot);
        }
    },
    clearSnapshots() {
        _snapshots = [];
    }
}; 