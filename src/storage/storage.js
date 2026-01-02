/**
 * Storage Management System for Bilibili Content Filter Extension
 * Provides cross-browser compatible storage abstraction with error handling
 */

import { browserCompatibility, BROWSER_FEATURES } from '../utils/browser-compatibility.js';

/**
 * Default filter settings with recommendations filter enabled by default
 * @type {FilterSettings}
 */
const DEFAULT_SETTINGS = {
  homeRecommendations: true,    // Default: enabled as per requirements
  rankingTrending: false,       // Default: disabled
  rightSidebar: false,          // Default: disabled
  comments: false,              // Default: disabled
  relatedVideos: false,         // Default: disabled
  version: '1.0.0',            // Settings schema version
  lastUpdated: Date.now()       // Timestamp for sync resolution
};

/**
 * Storage quota limits for different storage types
 */
const STORAGE_LIMITS = {
  SYNC_QUOTA_BYTES: 102400,     // Chrome sync storage limit
  LOCAL_QUOTA_BYTES: 5242880,   // Chrome local storage limit
  ITEM_MAX_SIZE: 8192           // Max size per item
};

/**
 * Storage error types for consistent error handling
 */
const STORAGE_ERRORS = {
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  SYNC_UNAVAILABLE: 'SYNC_UNAVAILABLE',
  CORRUPTED_DATA: 'CORRUPTED_DATA',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};

/**
 * Cross-browser storage abstraction layer
 */
class StorageManager {
  constructor() {
    this.browserCompatibility = browserCompatibility;
    this.storageAPI = this.browserCompatibility.getAPI('storage');
    this.changeListeners = new Set();
    this._setupChangeListener();
    
    // Log compatibility info for debugging
    if (process.env.NODE_ENV !== 'production') {
      this.browserCompatibility.logCompatibilityInfo();
    }
  }

  /**
   * Detect and return the appropriate storage API for the current browser
   * @private
   * @returns {Object} Browser storage API
   * @deprecated Use browserCompatibility.getAPI('storage') instead
   */
  _detectStorageAPI() {
    return this.storageAPI;
  }

  /**
   * Setup storage change listener for cross-tab synchronization
   * @private
   */
  _setupChangeListener() {
    if (this.storageAPI && this.storageAPI.sync && this.storageAPI.sync.onChanged) {
      this.storageAPI.sync.onChanged.addListener((changes, areaName) => {
        if (areaName === 'sync' || areaName === 'local') {
          this._notifyChangeListeners(changes);
        }
      });
    } else if (this.storageAPI && this.storageAPI.local && this.storageAPI.local.onChanged) {
      // Fallback for browsers that don't support sync storage change events
      this.storageAPI.local.onChanged.addListener((changes, areaName) => {
        if (areaName === 'local') {
          this._notifyChangeListeners(changes);
        }
      });
    }
  }

  /**
   * Notify all registered change listeners
   * @private
   * @param {Object} changes - Storage changes object
   */
  _notifyChangeListeners(changes) {
    if (changes.bilibiliFilterSettings) {
      const newSettings = changes.bilibiliFilterSettings.newValue;
      this.changeListeners.forEach(callback => {
        try {
          callback(newSettings);
        } catch (error) {
          console.error('Error in storage change listener:', error);
        }
      });
    }
  }

  /**
   * Validate settings object structure and types
   * @private
   * @param {Object} settings - Settings to validate
   * @returns {boolean} True if valid
   */
  _validateSettings(settings) {
    if (!settings || typeof settings !== 'object') {
      return false;
    }

    const requiredFields = ['homeRecommendations', 'rankingTrending', 'rightSidebar', 'comments', 'relatedVideos'];
    
    for (const field of requiredFields) {
      if (typeof settings[field] !== 'boolean') {
        return false;
      }
    }

    return true;
  }

  /**
   * Get current filter settings from storage
   * @returns {Promise<FilterSettings>} Current settings or defaults
   */
  async getSettings() {
    try {
      // Check if sync storage is available
      if (this.browserCompatibility.hasFeature(BROWSER_FEATURES.SYNC_STORAGE)) {
        const syncResult = await this.storageAPI.sync.get(['bilibiliFilterSettings']);
        const settings = syncResult.bilibiliFilterSettings;
        
        if (settings && this._validateSettings(settings)) {
          return { ...DEFAULT_SETTINGS, ...settings };
        }
      }

      // Fallback to local storage
      if (this.browserCompatibility.hasFeature(BROWSER_FEATURES.LOCAL_STORAGE)) {
        const localResult = await this.storageAPI.local.get(['bilibiliFilterSettings']);
        const settings = localResult.bilibiliFilterSettings;
        
        if (settings && this._validateSettings(settings)) {
          return { ...DEFAULT_SETTINGS, ...settings };
        }
      }

      // No valid settings found, initialize defaults
      await this.initializeDefaults();
      return { ...DEFAULT_SETTINGS };

    } catch (error) {
      console.error('Error getting settings:', error);
      return { ...DEFAULT_SETTINGS };
    }
  }

  /**
   * Save filter settings to storage
   * @param {FilterSettings} settings - Settings to save
   * @returns {Promise<void>}
   */
  async saveSettings(settings) {
    if (!this._validateSettings(settings)) {
      throw new Error('Invalid settings object');
    }

    const settingsToSave = {
      ...settings,
      lastUpdated: Date.now()
    };

    try {
      // Try sync storage first if available
      if (this.browserCompatibility.hasFeature(BROWSER_FEATURES.SYNC_STORAGE)) {
        await this.storageAPI.sync.set({ bilibiliFilterSettings: settingsToSave });
        return;
      }
      
      // Fallback to local storage
      if (this.browserCompatibility.hasFeature(BROWSER_FEATURES.LOCAL_STORAGE)) {
        await this.storageAPI.local.set({ bilibiliFilterSettings: settingsToSave });
        console.warn('Sync storage unavailable, using local storage');
        return;
      }
      
      throw new Error('No storage API available');
      
    } catch (error) {
      const errorType = this._categorizeStorageError(error);
      
      if (errorType === STORAGE_ERRORS.QUOTA_EXCEEDED || errorType === STORAGE_ERRORS.SYNC_UNAVAILABLE) {
        // Fallback to local storage
        try {
          if (this.browserCompatibility.hasFeature(BROWSER_FEATURES.LOCAL_STORAGE)) {
            await this.storageAPI.local.set({ bilibiliFilterSettings: settingsToSave });
            console.warn('Sync storage unavailable, using local storage');
          } else {
            throw new Error('No fallback storage available');
          }
        } catch (localError) {
          throw new Error(`Storage operation failed: ${localError.message}`);
        }
      } else {
        throw error;
      }
    }
  }

  /**
   * Initialize default settings in storage
   * @returns {Promise<void>}
   */
  async initializeDefaults() {
    try {
      // Check sync storage first if available
      if (this.browserCompatibility.hasFeature(BROWSER_FEATURES.SYNC_STORAGE)) {
        const syncResult = await this.storageAPI.sync.get(['bilibiliFilterSettings']);
        const currentSettings = syncResult.bilibiliFilterSettings;
        
        if (!currentSettings || !this._validateSettings(currentSettings)) {
          await this.saveSettings(DEFAULT_SETTINGS);
        }
        return;
      }
      
      // Check local storage
      if (this.browserCompatibility.hasFeature(BROWSER_FEATURES.LOCAL_STORAGE)) {
        const localResult = await this.storageAPI.local.get(['bilibiliFilterSettings']);
        const currentSettings = localResult.bilibiliFilterSettings;
        
        if (!currentSettings || !this._validateSettings(currentSettings)) {
          await this.saveSettings(DEFAULT_SETTINGS);
        }
        return;
      }
      
    } catch (error) {
      console.error('Error initializing defaults:', error);
      // Even if we can't save to storage, we can still return defaults
    }
  }

  /**
   * Register a callback for settings changes
   * @param {Function} callback - Function to call when settings change
   */
  onSettingsChange(callback) {
    if (typeof callback === 'function') {
      this.changeListeners.add(callback);
    }
  }

  /**
   * Unregister a settings change callback
   * @param {Function} callback - Function to remove
   */
  offSettingsChange(callback) {
    this.changeListeners.delete(callback);
  }

  /**
   * Get data from specified storage area
   * @private
   * @param {string} area - 'sync' or 'local'
   * @param {string} key - Storage key
   * @returns {Promise<any>} Stored data
   */
  async _getFromStorage(area, key) {
    return new Promise((resolve, reject) => {
      this.storageAPI[area].get([key], (result) => {
        if (this._checkForStorageError()) {
          reject(this._getLastStorageError());
        } else {
          resolve(result[key]);
        }
      });
    });
  }

  /**
   * Set data to specified storage area
   * @private
   * @param {string} area - 'sync' or 'local'
   * @param {string} key - Storage key
   * @param {any} value - Data to store
   * @returns {Promise<void>}
   */
  async _setToStorage(area, key, value) {
    return new Promise((resolve, reject) => {
      this.storageAPI[area].set({ [key]: value }, () => {
        if (this._checkForStorageError()) {
          reject(this._getLastStorageError());
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Check if there was a storage error
   * @private
   * @returns {boolean} True if error occurred
   */
  _checkForStorageError() {
    // Chrome/Edge API
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.lastError) {
      return true;
    }
    
    // Firefox/Safari API
    if (typeof browser !== 'undefined' && browser.runtime && browser.runtime.lastError) {
      return true;
    }
    
    return false;
  }

  /**
   * Get the last storage error
   * @private
   * @returns {Error} Last error that occurred
   */
  _getLastStorageError() {
    let errorMessage = 'Unknown storage error';
    
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.lastError) {
      errorMessage = chrome.runtime.lastError.message;
    } else if (typeof browser !== 'undefined' && browser.runtime && browser.runtime.lastError) {
      errorMessage = browser.runtime.lastError.message;
    }
    
    return new Error(errorMessage);
  }

  /**
   * Categorize storage errors for appropriate handling
   * @private
   * @param {Error} error - Error to categorize
   * @returns {string} Error category
   */
  _categorizeStorageError(error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('quota') || message.includes('exceeded')) {
      return STORAGE_ERRORS.QUOTA_EXCEEDED;
    }
    
    if (message.includes('sync') || message.includes('unavailable')) {
      return STORAGE_ERRORS.SYNC_UNAVAILABLE;
    }
    
    if (message.includes('permission') || message.includes('denied')) {
      return STORAGE_ERRORS.PERMISSION_DENIED;
    }
    
    if (message.includes('corrupt') || message.includes('invalid')) {
      return STORAGE_ERRORS.CORRUPTED_DATA;
    }
    
    return STORAGE_ERRORS.UNKNOWN_ERROR;
  }

  /**
   * Clear all stored settings (for testing/reset purposes)
   * @returns {Promise<void>}
   */
  async clearSettings() {
    try {
      await this._removeFromStorage('sync', 'bilibiliFilterSettings');
    } catch (error) {
      // Try local storage if sync fails
      await this._removeFromStorage('local', 'bilibiliFilterSettings');
    }
  }

  /**
   * Remove data from specified storage area
   * @private
   * @param {string} area - 'sync' or 'local'
   * @param {string} key - Storage key
   * @returns {Promise<void>}
   */
  async _removeFromStorage(area, key) {
    return new Promise((resolve, reject) => {
      this.storageAPI[area].remove([key], () => {
        if (this._checkForStorageError()) {
          reject(this._getLastStorageError());
        } else {
          resolve();
        }
      });
    });
  }
}

// Export for use in other modules
export { StorageManager, DEFAULT_SETTINGS, STORAGE_ERRORS };