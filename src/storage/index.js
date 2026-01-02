/**
 * Storage module entry point
 * Provides a singleton instance of StorageManager for use across the extension
 */

import { StorageManager, DEFAULT_SETTINGS, STORAGE_ERRORS } from './storage.js';

// Singleton instance
let storageManagerInstance = null;

/**
 * Get the singleton StorageManager instance
 * @returns {StorageManager} Storage manager instance
 */
export function getStorageManager() {
  if (!storageManagerInstance) {
    storageManagerInstance = new StorageManager();
  }
  return storageManagerInstance;
}

/**
 * Initialize storage with default settings
 * Should be called when the extension starts
 * @returns {Promise<void>}
 */
export async function initializeStorage() {
  const manager = getStorageManager();
  await manager.initializeDefaults();
}

/**
 * Get current filter settings
 * @returns {Promise<FilterSettings>} Current settings
 */
export async function getFilterSettings() {
  const manager = getStorageManager();
  return await manager.getSettings();
}

/**
 * Save filter settings
 * @param {FilterSettings} settings - Settings to save
 * @returns {Promise<void>}
 */
export async function saveFilterSettings(settings) {
  const manager = getStorageManager();
  await manager.saveSettings(settings);
}

/**
 * Register for settings change notifications
 * @param {Function} callback - Function to call when settings change
 */
export function onSettingsChange(callback) {
  const manager = getStorageManager();
  manager.onSettingsChange(callback);
}

/**
 * Unregister settings change notifications
 * @param {Function} callback - Function to remove
 */
export function offSettingsChange(callback) {
  const manager = getStorageManager();
  manager.offSettingsChange(callback);
}

// Export constants for use by other modules
export { DEFAULT_SETTINGS, STORAGE_ERRORS };