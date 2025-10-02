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
import * as utils from './utils.js?v=2.0.1';

export const state = {
    currentData: null,
    originalData: null,
    // Currently selected lock set in the Slider view (for UI highlighting only)
    selectedLockSetName: null,
    interiors: {
        targetValues: [],
        // Stores user-entered square footage by room/classroom type name
        mixSF: {},
        selectedMixScheme: null,
        // Flag indicating Interiors Classroom Mix or $/SF values changed without updating targets
        unsavedMix: false,
        // Flag indicating any Interiors SF has been assigned (manual entry or preset)
        hasAssignedSF: false
    },
    lockedCostOfWork: new Set(),
    currentView: 'splash-screen', // 'summary', 'slider', 'program'
    snapshots: [],
    indirectCostPercentages: [],
    indirectCostFixed: [],
    costOfWorkFixedAdditions: [],
    shelledFloors: [],
    activePhases: [1],
    currentScheme: null, // The currently active scheme (starts with baseline scheme)
    selectedSchemeName: 'Predesign', // The name of the scheme card that should be highlighted
    previousSquareFootage: {}, // Track previous square footage values for showing changes
    predesignDeleted: false, // Track if the Predesign scheme has been deleted
    // New floor-based program inputs
    numFloors: 3,
    shelledFloorsCount: 0,
    // Penthouse dimensions (ft); when all are > 0, contributes to enclosure
    penthouse: {
        width: 0,
        length: 0,
        height: 0
    },

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
     * Parses indirect and fixed-dollar costs from original data.
     * Supports legacy format where only percentage indirects were present.
     */
    calculateIndirectCostPercentages() {
        this.indirectCostPercentages = [];
        this.indirectCostFixed = [];
        this.costOfWorkFixedAdditions = [];
        const items = Array.isArray(this.originalData?.indirectCosts) ? this.originalData.indirectCosts : [];
        items.forEach(item => {
            const type = item.Type || 'Indirect';
            const name = item.Subcategory || item.name || '';
            const hasPercentage = typeof item.Percentage === 'number';
            const hasAmount = typeof item.Amount === 'number';
            if (type === 'Indirect') {
                if (hasPercentage) {
                    this.indirectCostPercentages.push({ name, percentage: item.Percentage });
                } else if (hasAmount) {
                    this.indirectCostFixed.push({ name, amount: item.Amount });
                }
            } else if (type === 'CostOfWork') {
                if (hasAmount) {
                    this.costOfWorkFixedAdditions.push({ name, amount: item.Amount });
                }
            }
        });
    },

    /**
     * Resets the current data to the original loaded data, clearing any snapshots or locks.
     */
    resetToOriginal() {
        this.currentData = JSON.parse(JSON.stringify(this.originalData));
        this.snapshots = [];
        this.lockedCostOfWork.clear();
        this.selectedLockSetName = null;
        this.predesignDeleted = false;
        this.calculateIndirectCostPercentages();
        
        // Set default view to Phase 2 Program
        this.currentView = 'program';
        
        // Reset to the original baseline scheme with initial target values
        const originalPredesignScheme = utils.getBaselineScheme();
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
            
            // Reset shelled floors from the original baseline scheme's floorData
            if (originalPredesignScheme.floorData && Array.isArray(originalPredesignScheme.floorData)) {
                this.shelledFloors = originalPredesignScheme.floorData
                    .filter(f => f.phase === 1) // Assuming single phase for initial reset
                    .map(f => f.shelled);
            } else {
                this.shelledFloors = []; // Clear if no floor data
            }

            this.selectedSchemeName = utils.getBaselineName(); // Set default selected scheme
            this.activePhases = [1];
            
            // Initialize previous square footage tracking
            this.previousSquareFootage = {};
            this.updatePreviousSquareFootage();

            // Reset interiors flags
            if (this.interiors) {
                this.interiors.unsavedMix = false;
                this.interiors.hasAssignedSF = false;
                this.interiors.selectedMixScheme = null;
                this.interiors.mixSF = {};
            }
        }
    },

    /**
     * Adds a new snapshot of the current data state.
     * Accepts either a name string or a full snapshot object.
     * @param {string|object} snapshotOrName - The name for the new snapshot, or a snapshot object.
     */
    addSnapshot(snapshotOrName) {
        if (this.snapshots.length > 5) {
            // Maybe show a user notification here in a real app
            console.warn("Maximum number of snapshots (5) reached.");
            return;
        }
        let snapshot;
        if (typeof snapshotOrName === 'string') {
            snapshot = {
                name: snapshotOrName,
                costOfWork: JSON.parse(JSON.stringify(this.currentScheme.costOfWork)),
                grossSF: this.currentData.grossSF,
                floorData: [],
                numFloors: Number(this.numFloors) || 1,
                shelledFloorsCount: Number(this.shelledFloorsCount) || 0,
                penthouse: this.penthouse
                    ? {
                        width: Number(this.penthouse.width) || 0,
                        length: Number(this.penthouse.length) || 0,
                        height: Number(this.penthouse.height) || 0
                      }
                    : { width: 0, length: 0, height: 0 }
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
     * Restores a snapshot by name into the working state.
     * @param {string} snapshotName
     * @returns {boolean} True if restored
     */
    restoreSnapshotByName(snapshotName) {
        const snap = this.snapshots.find(s => s.name === snapshotName);
        if (!snap) return false;
        // Restore core values
        this.currentData.grossSF = Number(snap.grossSF) || 0;
        if (Array.isArray(snap.costOfWork)) {
            this.currentScheme.costOfWork = JSON.parse(JSON.stringify(snap.costOfWork));
        }
        if (typeof snap.numFloors === 'number' && isFinite(snap.numFloors)) {
            this.numFloors = Math.max(1, Math.min(5, Math.round(snap.numFloors)));
        } else if (Array.isArray(snap.floorData) && snap.floorData.length > 0) {
            this.numFloors = Math.max(1, Math.min(5, snap.floorData.length));
        }
        if (typeof snap.shelledFloorsCount === 'number' && isFinite(snap.shelledFloorsCount)) {
            this.shelledFloorsCount = Math.max(0, Math.min(this.numFloors, Number(snap.shelledFloorsCount)));
        } else if (Array.isArray(snap.floorData) && snap.floorData.length > 0) {
            const shelled = snap.floorData.filter(f => f.shelled).length;
            this.shelledFloorsCount = Math.max(0, Math.min(this.numFloors, shelled));
        }
        if (snap.penthouse && typeof snap.penthouse === 'object') {
            this.penthouse = {
                width: Number(snap.penthouse.width) || 0,
                length: Number(snap.penthouse.length) || 0,
                height: Number(snap.penthouse.height) || 0
            };
        }
        if (Array.isArray(snap.costOfWorkFixedAdditions)) {
            this.costOfWorkFixedAdditions = JSON.parse(JSON.stringify(snap.costOfWorkFixedAdditions));
        }
        if (Array.isArray(snap.indirectCostFixed)) {
            this.indirectCostFixed = JSON.parse(JSON.stringify(snap.indirectCostFixed));
        }
        if (snap.interiors) {
            if (snap.interiors.mixSF) {
                this.interiors.mixSF = JSON.parse(JSON.stringify(snap.interiors.mixSF));
                this.interiors.hasAssignedSF = Object.values(this.interiors.mixSF).some(v => Number(v) > 0);
            }
            if (Array.isArray(snap.interiors.targetValues)) {
                this.interiors.targetValues = JSON.parse(JSON.stringify(snap.interiors.targetValues));
            }
        }
        this.updatePreviousSquareFootage();
        return true;
    },

    /**
     * Deletes a snapshot by its name.
     * @param {string} snapshotName - The name of the snapshot to delete.
     */
    deleteSnapshot(snapshotName) {
        const baselineName = utils.getBaselineName();
        if (snapshotName === baselineName) {
            // Check if there's a user-created snapshot named equal to baseline
            const baselineSnapshot = this.snapshots.find(s => s.name === baselineName);
            if (baselineSnapshot) {
                // Delete the user-created snapshot with baseline name
                this.snapshots = this.snapshots.filter(s => s.name !== snapshotName);
            } else {
                // Hide the imported baseline series from summary
                this.predesignDeleted = true;
            }
        } else {
            this.snapshots = this.snapshots.filter(s => s.name !== snapshotName);
        }
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
        const originalPredesignScheme = utils.getBaselineScheme();
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

// Centralized logging for view changes: wrap currentView with a getter/setter
(() => {
    let currentViewInternal = state.currentView;
    Object.defineProperty(state, 'currentView', {
        get() { return currentViewInternal; },
        set(newView) {
            const previousView = currentViewInternal;
            currentViewInternal = newView;
            if (previousView !== newView) {
                console.log(`[view] ${previousView} -> ${newView}`);
            }
        },
        enumerable: true,
        configurable: true
    });
})();
