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
 * @file persistence.js
 * @description Lightweight session persistence for current view and snapshots.
 */

const STORAGE_KEY = 'tvd_tool_session_v2';
const COOKIE_NAME = 'tvd_session_v2';
const PREVIOUS_STORAGE_KEYS = ['tvd_tool_session_v1'];
const PREVIOUS_COOKIE_NAMES = ['tvd_session'];

// On module load, if an old session key exists and new one doesn't, clear the old keys to avoid stale state
try {
    const hasNew = localStorage.getItem(STORAGE_KEY);
    if (!hasNew) {
        PREVIOUS_STORAGE_KEYS.forEach(k => localStorage.removeItem(k));
        PREVIOUS_COOKIE_NAMES.forEach(name => {
            document.cookie = `${name}=; Max-Age=0; path=/; samesite=lax`;
        });
    }
} catch (e) {
    // ignore storage errors
}

/**
 * Saves the minimal session state to localStorage and sets a presence cookie.
 * @param {object} state - The global application state
 */
export function save(state) {
    try {
        const payload = {
            currentView: state.currentView,
            snapshots: Array.isArray(state.snapshots) ? state.snapshots : []
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        // Cookie presence flag (1 year)
        document.cookie = `${COOKIE_NAME}=1; path=/; max-age=31536000; samesite=lax`;
    } catch (e) {
        console.warn('Failed to persist session:', e);
    }
}

/**
 * Loads the persisted session from localStorage.
 * @returns {object|null}
 */
export function load() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch (e) {
        console.warn('Failed to load persisted session:', e);
        return null;
    }
}

/**
 * Applies the persisted session to the provided state.
 * @param {object} state
 * @returns {boolean} True if applied, false otherwise
 */
export function apply(state) {
    const persisted = load();
    if (!persisted) return false;
    if (Array.isArray(persisted.snapshots)) {
        state.snapshots = JSON.parse(JSON.stringify(persisted.snapshots));
    }
    if (persisted.currentView) {
        state.currentView = persisted.currentView;
    }
    return true;
}

/**
 * Clears persisted session from both localStorage and cookie.
 */
export function clear() {
    try {
        localStorage.removeItem(STORAGE_KEY);
        document.cookie = `${COOKIE_NAME}=; Max-Age=0; path=/; samesite=lax`;
    } catch (e) {
        console.warn('Failed to clear persisted session:', e);
    }
}

/**
 * Checks if any persisted session exists (localStorage or presence cookie).
 * @returns {boolean}
 */
export function hasSession() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return true;
    } catch (e) {
        // ignore
    }
    try {
        const cookieStr = document.cookie || '';
        const exists = cookieStr.split(';').some(c => c.trim().startsWith(`${COOKIE_NAME}=`));
        return exists;
    } catch (e) {
        return false;
    }
}


