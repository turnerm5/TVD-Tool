/**
 * @file state.js
 * @description Manages the global state for the TVD Tool application.
 */
import * as utils from './utils.js';

export const state = {
    currentData: null,
    originalData: null,
    lockedCostOfWork: new Set(),
    currentView: 'summary', // 'summary', 'slider', 'program'
    snapshots: [],
    indirectCostPercentages: [],
    shelledFloors: [],

    /**
     * Calculates the indirect cost percentages based on the original data.
     * This establishes a baseline for how indirect costs relate to COW.
     */
    calculateIndirectCostPercentages() {
        const phase2 = this.originalData.phase2;
        if (!phase2.indirectCosts) {
            this.indirectCostPercentages = [];
            return;
        }
        this.indirectCostPercentages = phase2.indirectCosts.map(item => ({
            name: item.Subcategory,
            percentage: item.Percentage || 0
        }));
    },

    /**
     * Resets the current data to the original loaded data, clearing any snapshots or locks.
     */
    resetToOriginal() {
        this.currentData = JSON.parse(JSON.stringify(this.originalData));
        this.snapshots = [];
        this.lockedCostOfWork.clear();
        this.calculateIndirectCostPercentages();
        this.shelledFloors = new Array(this.originalData.phase2.floors).fill(false);
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
                costOfWork: JSON.parse(JSON.stringify(this.currentData.phase2.costOfWork)),
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
    },

    /**
     * Checks if the current data has changed from the original data.
     * @returns {boolean} - True if data has changed, false otherwise.
     */
    hasDataChanged() {
        if (!this.currentData || !this.originalData) return false;

        // Check if gross SF has changed
        if (this.currentData.grossSF !== this.originalData.grossSF) return true;

        // Check if any component target_value or square_footage has changed
        const currentCostOfWork = this.currentData.phase2.costOfWork;
        const originalCostOfWork = this.originalData.phase2.costOfWork;

        for (let i = 0; i < currentCostOfWork.length; i++) {
            const current = currentCostOfWork[i];
            const original = originalCostOfWork[i];
            
            if (current.target_value !== original.target_value || 
                current.square_footage !== original.square_footage) {
                return true;
            }
        }

        // Check if shelled floors have changed
        const originalShelledFloors = new Array(this.originalData.phase2.floors || 0).fill(false);
        if (this.shelledFloors.length !== originalShelledFloors.length) return true;
        for (let i = 0; i < this.shelledFloors.length; i++) {
            if (this.shelledFloors[i] !== originalShelledFloors[i]) return true;
        }

        return false;
    },

    /**
     * Updates the Reset button's disabled state based on whether data has changed.
     */
    updateResetButtonState() {
        const resetButton = document.getElementById('reset-button');
        if (resetButton) {
            resetButton.disabled = !this.hasDataChanged();
        }
    }
}; 