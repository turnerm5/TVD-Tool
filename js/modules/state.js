/**
 * @file state.js
 * @description Manages the global state for the TVD Tool application.
 */
import * as utils from './utils.js';

export const state = {
    currentData: null,
    originalData: null,
    lockedCostOfWork: new Set(),
    currentView: 'summary', // 'summary', 'slider', 'interiors', 'program'
    interiorsEntryState: null,
    snapshots: [],
    indirectCostPercentages: [],

    /**
     * Initializes the application state.
     * @param {object} data - The initial data loaded from sampleData.js.
     */
    init(data) {
        this.originalData = data;
        this.currentData = JSON.parse(JSON.stringify(data)); // Deep copy
        this.snapshots = [];
        this.lockedCostOfWork.clear();
        this.calculateIndirectCostPercentages();
    },

    /**
     * Calculates the indirect cost percentages based on the original data.
     * This establishes a baseline for how indirect costs relate to COW.
     */
    calculateIndirectCostPercentages() {
        const phase2 = this.originalData.phases.phase2;
        if (!phase2.indirectCosts || !phase2.costOfWork) {
            this.indirectCostPercentages = [];
            return;
        }
        const totalCow = utils.calculateTotalCostOfWork(phase2.costOfWork);
        this.indirectCostPercentages = phase2.indirectCosts.map(item => ({
            name: item.Subcategory,
            percentage: totalCow > 0 ? item.Total / totalCow : 0
        }));
    },

    /**
     * Resets the current data to the original loaded data, clearing any snapshots or locks.
     */
    resetToOriginal() {
        this.currentData = JSON.parse(JSON.stringify(this.originalData));
        this.snapshots = [];
        this.lockedCostOfWork.clear();
        // Recalculating percentages isn't strictly necessary if they are based on original data,
        // but it's good practice to ensure consistency.
        this.calculateIndirectCostPercentages();
    },

    /**
     * Adds a new snapshot of the current data state.
     * Accepts either a name string or a full snapshot object.
     * @param {string|object} snapshotOrName - The name for the new snapshot, or a snapshot object.
     */
    addSnapshot(snapshotOrName) {
        if (this.snapshots.length >= 3) {
            // Maybe show a user notification here in a real app
            console.warn("Maximum number of snapshots (3) reached.");
            return;
        }
        let snapshot;
        if (typeof snapshotOrName === 'string') {
            snapshot = {
                name: snapshotOrName,
                costOfWork: JSON.parse(JSON.stringify(this.currentData.phases.phase2.costOfWork)),
                grossSF: this.currentData.grossSF
            };
        } else if (typeof snapshotOrName === 'object' && snapshotOrName !== null) {
            snapshot = snapshotOrName;
        } else {
            console.warn('Invalid argument to addSnapshot:', snapshotOrName);
            return;
        }
        this.snapshots.push(snapshot);
    },

    /**
     * Deletes a snapshot by its name.
     * @param {string} snapshotName - The name of the snapshot to delete.
     */
    deleteSnapshot(snapshotName) {
        this.snapshots = this.snapshots.filter(s => s.name !== snapshotName);
    },

    /**
     * Clears all snapshots from the state.
     */
    clearSnapshots() {
        this.snapshots = [];
    }
}; 