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
 * @file state.js
 * @description Manages the global state for the TVD Tool application.
 */
import * as utils from './utils.js';

export const state = {
    currentData: null,
    originalData: null,
    lockedCostOfWork: new Set(),
    currentView: 'splash-screen', // 'summary', 'slider', 'program'
    snapshots: [],
    indirectCostPercentages: [],
    shelledFloors: [],
    currentScheme: null, // The currently active scheme (starts with Predesign)
    selectedSchemeName: 'Predesign', // The name of the scheme card that should be highlighted
    previousSquareFootage: {}, // Track previous square footage values for showing changes

    /**
     * Stores current square footage values as the new "previous" values for change tracking.
     */
    updatePreviousSquareFootage() {
        if (this.currentScheme && this.currentScheme.costOfWork) {
            this.currentScheme.costOfWork.forEach(component => {
                this.previousSquareFootage[component.name] = component.square_footage;
            });
        }
    },

    /**
     * Gets the change amount for a component's square footage.
     * @param {string} componentName - The name of the component
     * @param {number} currentSF - The current square footage value
     * @returns {number} The change amount (positive for increase, negative for decrease)
     */
    getSquareFootageChange(componentName, currentSF) {
        const previousSF = this.previousSquareFootage[componentName];
        if (previousSF === undefined) return 0;
        
        // Round to avoid floating point issues
        const change = Math.round(currentSF - previousSF);
        return change;
    },

    /**
     * Calculates the indirect cost percentages based on the original data.
     * This establishes a baseline for how indirect costs relate to COW.
     */
    calculateIndirectCostPercentages() {
        if (!this.originalData.indirectCosts) {
            this.indirectCostPercentages = [];
            return;
        }
        this.indirectCostPercentages = this.originalData.indirectCosts.map(item => ({
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
        
        // Set default view to Phase 2 Program
        this.currentView = 'program';
        
        // Reset to the original Predesign scheme with initial target values
        const originalPredesignScheme = this.originalData.schemes && this.originalData.schemes.find(s => s.name === 'Predesign');
        if (originalPredesignScheme) {
            this.currentScheme = JSON.parse(JSON.stringify(originalPredesignScheme));
            
            // Merge initial target values
            this.currentScheme.costOfWork.forEach(component => {
                const targetValueData = this.originalData.initialTargetValues.find(tv => tv.name === component.name);
                if (targetValueData) {
                    component.target_value = Number(targetValueData.target_value) || 0;
                    component.benchmark_low = Number(targetValueData.benchmark_low) || 0;
                    component.benchmark_high = Number(targetValueData.benchmark_high) || 0;
                } else {
                    component.target_value = 0;
                    component.benchmark_low = 0;
                    component.benchmark_high = 0;
                }
            });
            
            // Reset shelled floors from the original predesign scheme's floorData
            if (originalPredesignScheme.floorData && Array.isArray(originalPredesignScheme.floorData)) {
                this.shelledFloors = originalPredesignScheme.floorData
                    .filter(f => f.phase === 1) // Assuming single phase for initial reset
                    .map(f => f.shelled);
            } else {
                this.shelledFloors = []; // Clear if no floor data
            }

            this.selectedSchemeName = 'Predesign'; // Set default selected scheme
            
            // Initialize previous square footage tracking
            this.previousSquareFootage = {};
            this.updatePreviousSquareFootage();
        }
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
                costOfWork: JSON.parse(JSON.stringify(this.currentScheme.costOfWork)),
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
        const originalPredesignScheme = this.originalData.schemes && this.originalData.schemes.find(s => s.name === 'Predesign');
        if (!this.currentScheme || !this.originalData.initialTargetValues || !originalPredesignScheme) return false;
        
        const currentCostOfWork = this.currentScheme.costOfWork;
        const originalTargetValues = this.originalData.initialTargetValues;
        const originalCostOfWork = originalPredesignScheme.costOfWork;

        for (let i = 0; i < currentCostOfWork.length; i++) {
            const current = currentCostOfWork[i];
            const originalTargetValue = originalTargetValues.find(tv => tv.name === current.name);
            const originalSquareFootage = originalCostOfWork.find(oc => oc.name === current.name);
            
            if (!originalTargetValue || !originalSquareFootage) continue;
            
            if (current.target_value !== originalTargetValue.target_value || 
                current.square_footage !== originalSquareFootage.square_footage) {
                return true;
            }
        }

        // Check if shelled floors have changed using floorData
        if (originalPredesignScheme.floorData && Array.isArray(originalPredesignScheme.floorData)) {
            const originalShelled = originalPredesignScheme.floorData
                .filter(f => f.phase === 1)
                .map(f => f.shelled);
            
            if (this.shelledFloors.length !== originalShelled.length) return true;
            for (let i = 0; i < this.shelledFloors.length; i++) {
                if (this.shelledFloors[i] !== originalShelled[i]) return true;
            }
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
