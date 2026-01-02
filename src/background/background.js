/**
 * Background Service Worker for Bilibili Content Filter Extension
 * Handles extension lifecycle, cross-tab communication, and browser compatibility
 */

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
 * Extension lifecycle states
 */
const LIFECYCLE_STATES = {
  INSTALLING: 'installing',
  INSTALLED: 'installed',
  UPDATING: 'updating',
  UPDATED: 'updated',
  STARTUP: 'startup'
};

/**
 * Message types for cross-tab communication
 */
const MESSAGE_TYPES = {
  SETTINGS_UPDATED: 'SETTINGS_UPDATED',
  GET_SETTINGS: 'GET_SETTINGS',
  TOGGLE_FILTER: 'TOGGLE_FILTER',
  PING: 'PING',
  PONG: 'PONG'
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
 * Simple storage manager for background script
 */
class BackgroundStorageManager {
  constructor() {
    this.storageAPI = this._detectStorageAPI();
  }

  /**
   * Detect and return the appropriate storage API for the current browser
   * @private
   * @returns {Object} Browser storage API
   */
  _detectStorageAPI() {
    // Try Chrome/Edge API first
    if (typeof chrome !== 'undefined' && chrome.storage) {
      return chrome.storage;
    }
    
    // Fallback to Firefox/Safari browser API
    if (typeof browser !== 'undefined' && browser.storage) {
      return browser.storage;
    }
    
    // No storage API available - this should not happen in extension context
    throw new Error('No browser storage API available');
  }

  /**
   * Get current filter settings from storage
   * @returns {Promise<FilterSettings>} Current settings or defaults
   */
  async getSettings() {
    try {
      // Try sync storage first
      const syncResult = await this._getFromStorage('sync', 'bilibiliFilterSettings');
      if (syncResult && this._validateSettings(syncResult)) {
        return { ...DEFAULT_SETTINGS, ...syncResult };
      }

      // Fallback to local storage
      const localResult = await this._getFromStorage('local', 'bilibiliFilterSettings');
      if (localResult && this._validateSettings(localResult)) {
        return { ...DEFAULT_SETTINGS, ...localResult };
      }

      // No valid settings found, return defaults
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
      // Try sync storage first
      await this._setToStorage('sync', 'bilibiliFilterSettings', settingsToSave);
    } catch (error) {
      const errorType = this._categorizeStorageError(error);
      
      if (errorType === STORAGE_ERRORS.QUOTA_EXCEEDED || errorType === STORAGE_ERRORS.SYNC_UNAVAILABLE) {
        // Fallback to local storage
        try {
          await this._setToStorage('local', 'bilibiliFilterSettings', settingsToSave);
          console.warn('Sync storage unavailable, using local storage');
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
      const currentSettings = await this._getFromStorage('sync', 'bilibiliFilterSettings');
      
      if (!currentSettings || !this._validateSettings(currentSettings)) {
        await this.saveSettings(DEFAULT_SETTINGS);
      }
    } catch (error) {
      console.error('Error initializing defaults:', error);
      // Even if we can't save to storage, we can still return defaults
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
}

/**
 * Background service worker class
 */
class BackgroundService {
  constructor() {
    this.storageManager = new BackgroundStorageManager();
    this.activeConnections = new Map();
    this.isInitialized = false;
    
    this._setupEventListeners();
    this._initialize();
  }

  /**
   * Initialize the background service
   * @private
   */
  async _initialize() {
    try {
      console.log('Bilibili Content Filter background service initializing...');
      
      // Initialize default settings if needed
      await this.storageManager.initializeDefaults();
      
      // Setup storage change monitoring
      if (chrome.storage && chrome.storage.onChanged) {
        chrome.storage.onChanged.addListener((changes, areaName) => {
          if (areaName === 'sync' || areaName === 'local') {
            this._handleStorageChange(changes);
          }
        });
      }
      
      this.isInitialized = true;
      console.log('Background service initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize background service:', error);
    }
  }

  /**
   * Handle storage changes and broadcast updates
   * @private
   * @param {Object} changes - Storage changes object
   */
  _handleStorageChange(changes) {
    if (changes.bilibiliFilterSettings) {
      const newSettings = changes.bilibiliFilterSettings.newValue;
      if (newSettings) {
        this._broadcastSettingsUpdate(newSettings);
      }
    }
  }

  /**
   * Setup event listeners for extension lifecycle and communication
   * @private
   */
  _setupEventListeners() {
    // Extension installation and update handling
    if (chrome.runtime.onInstalled) {
      chrome.runtime.onInstalled.addListener((details) => {
        this._handleInstallation(details);
      });
    }

    // Extension startup handling
    if (chrome.runtime.onStartup) {
      chrome.runtime.onStartup.addListener(() => {
        this._handleStartup();
      });
    }

    // Message handling for cross-tab communication
    if (chrome.runtime.onMessage) {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        this._handleMessage(message, sender, sendResponse);
        return true; // Keep message channel open for async responses
      });
    }

    // Connection handling for persistent communication
    if (chrome.runtime.onConnect) {
      chrome.runtime.onConnect.addListener((port) => {
        this._handleConnection(port);
      });
    }

    // Tab updates for content script synchronization
    if (chrome.tabs && chrome.tabs.onUpdated) {
      chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
        this._handleTabUpdate(tabId, changeInfo, tab);
      });
    }
  }

  /**
   * Handle extension installation and updates
   * @private
   * @param {Object} details - Installation details
   */
  async _handleInstallation(details) {
    console.log('Extension installation event:', details.reason);
    
    try {
      switch (details.reason) {
        case 'install':
          await this._handleFirstInstall();
          break;
          
        case 'update':
          await this._handleUpdate(details.previousVersion);
          break;
          
        case 'chrome_update':
        case 'shared_module_update':
          await this._handleBrowserUpdate();
          break;
          
        default:
          console.log('Unknown installation reason:', details.reason);
      }
    } catch (error) {
      console.error('Error handling installation:', error);
    }
  }

  /**
   * Handle first-time installation
   * @private
   */
  async _handleFirstInstall() {
    console.log('First-time installation detected');
    
    try {
      // Initialize default settings
      await this.storageManager.initializeDefaults();
      
      // Set installation timestamp
      const installData = {
        installedAt: Date.now(),
        version: chrome.runtime.getManifest().version
      };
      
      await this._setInstallationData(installData);
      
      console.log('First-time installation completed successfully');
      
    } catch (error) {
      console.error('Error during first-time installation:', error);
    }
  }

  /**
   * Handle extension updates
   * @private
   * @param {string} previousVersion - Previous extension version
   */
  async _handleUpdate(previousVersion) {
    console.log(`Extension updated from ${previousVersion} to ${chrome.runtime.getManifest().version}`);
    
    try {
      // Perform any necessary migration logic here
      await this._migrateSettings(previousVersion);
      
      // Update installation data
      const installData = await this._getInstallationData();
      installData.updatedAt = Date.now();
      installData.previousVersion = previousVersion;
      installData.version = chrome.runtime.getManifest().version;
      
      await this._setInstallationData(installData);
      
      console.log('Extension update completed successfully');
      
    } catch (error) {
      console.error('Error during extension update:', error);
    }
  }

  /**
   * Handle browser updates
   * @private
   */
  async _handleBrowserUpdate() {
    console.log('Browser update detected');
    
    try {
      // Verify settings integrity after browser update
      const settings = await this.storageManager.getSettings();
      if (!settings || Object.keys(settings).length === 0) {
        await this.storageManager.initializeDefaults();
      }
      
    } catch (error) {
      console.error('Error handling browser update:', error);
    }
  }

  /**
   * Handle extension startup
   * @private
   */
  _handleStartup() {
    console.log('Extension startup detected');
    
    // Re-initialize if needed
    if (!this.isInitialized) {
      this._initialize();
    }
  }

  /**
   * Handle incoming messages from content scripts and popup
   * @private
   * @param {Object} message - Message object
   * @param {Object} sender - Message sender info
   * @param {Function} sendResponse - Response callback
   */
  async _handleMessage(message, sender, sendResponse) {
    try {
      switch (message.type) {
        case MESSAGE_TYPES.GET_SETTINGS:
          const settings = await this.storageManager.getSettings();
          sendResponse({ success: true, settings });
          break;
          
        case MESSAGE_TYPES.TOGGLE_FILTER:
          await this._handleFilterToggle(message, sendResponse);
          break;
          
        case MESSAGE_TYPES.PING:
          sendResponse({ type: MESSAGE_TYPES.PONG, timestamp: Date.now() });
          break;
          
        default:
          console.warn('Unknown message type:', message.type);
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  /**
   * Handle filter toggle requests
   * @private
   * @param {Object} message - Toggle message
   * @param {Function} sendResponse - Response callback
   */
  async _handleFilterToggle(message, sendResponse) {
    try {
      const { filterType, enabled } = message;
      
      // Get current settings
      const currentSettings = await this.storageManager.getSettings();
      
      // Update the specific filter
      const updatedSettings = {
        ...currentSettings,
        [filterType]: enabled
      };
      
      // Save updated settings
      await this.storageManager.saveSettings(updatedSettings);
      
      // Broadcast update to all tabs
      this._broadcastSettingsUpdate(updatedSettings);
      
      sendResponse({ success: true, settings: updatedSettings });
      
    } catch (error) {
      console.error('Error toggling filter:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  /**
   * Handle persistent connections from content scripts
   * @private
   * @param {Object} port - Connection port
   */
  _handleConnection(port) {
    console.log('New connection established:', port.name);
    
    // Store connection for broadcasting
    this.activeConnections.set(port.name, port);
    
    // Handle connection messages
    port.onMessage.addListener((message) => {
      this._handlePortMessage(message, port);
    });
    
    // Clean up on disconnect
    port.onDisconnect.addListener(() => {
      console.log('Connection disconnected:', port.name);
      this.activeConnections.delete(port.name);
    });
  }

  /**
   * Handle messages from persistent connections
   * @private
   * @param {Object} message - Message object
   * @param {Object} port - Connection port
   */
  async _handlePortMessage(message, port) {
    try {
      switch (message.type) {
        case MESSAGE_TYPES.GET_SETTINGS:
          const settings = await this.storageManager.getSettings();
          port.postMessage({ type: MESSAGE_TYPES.SETTINGS_UPDATED, settings });
          break;
          
        default:
          console.warn('Unknown port message type:', message.type);
      }
    } catch (error) {
      console.error('Error handling port message:', error);
      port.postMessage({ type: 'ERROR', error: error.message });
    }
  }

  /**
   * Handle tab updates for content script synchronization
   * @private
   * @param {number} tabId - Tab ID
   * @param {Object} changeInfo - Change information
   * @param {Object} tab - Tab object
   */
  _handleTabUpdate(tabId, changeInfo, tab) {
    // Only process complete page loads on Bilibili domains
    if (changeInfo.status === 'complete' && tab.url && tab.url.includes('bilibili.com')) {
      // Send current settings to the newly loaded content script
      this._sendSettingsToTab(tabId);
    }
  }

  /**
   * Send current settings to a specific tab
   * @private
   * @param {number} tabId - Tab ID
   */
  async _sendSettingsToTab(tabId) {
    try {
      const settings = await this.storageManager.getSettings();
      
      chrome.tabs.sendMessage(tabId, {
        type: MESSAGE_TYPES.SETTINGS_UPDATED,
        settings
      }).catch(error => {
        // Ignore errors for tabs that don't have content scripts
        console.debug('Could not send message to tab:', tabId, error.message);
      });
      
    } catch (error) {
      console.error('Error sending settings to tab:', error);
    }
  }

  /**
   * Broadcast settings updates to all active connections and tabs
   * @private
   * @param {Object} settings - Updated settings
   */
  _broadcastSettingsUpdate(settings) {
    console.log('Broadcasting settings update');
    
    // Send to persistent connections
    this.activeConnections.forEach((port, name) => {
      try {
        port.postMessage({
          type: MESSAGE_TYPES.SETTINGS_UPDATED,
          settings
        });
      } catch (error) {
        console.error(`Error sending to connection ${name}:`, error);
        this.activeConnections.delete(name);
      }
    });
    
    // Send to all Bilibili tabs
    this._broadcastToAllTabs(settings);
  }

  /**
   * Broadcast settings to all Bilibili tabs
   * @private
   * @param {Object} settings - Settings to broadcast
   */
  async _broadcastToAllTabs(settings) {
    try {
      const tabs = await this._queryTabs({ url: '*://*.bilibili.com/*' });
      
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          type: MESSAGE_TYPES.SETTINGS_UPDATED,
          settings
        }).catch(error => {
          // Ignore errors for tabs without content scripts
          console.debug('Could not broadcast to tab:', tab.id, error.message);
        });
      });
      
    } catch (error) {
      console.error('Error broadcasting to tabs:', error);
    }
  }

  /**
   * Query tabs with cross-browser compatibility
   * @private
   * @param {Object} queryInfo - Tab query parameters
   * @returns {Promise<Array>} Array of matching tabs
   */
  async _queryTabs(queryInfo) {
    return new Promise((resolve, reject) => {
      if (chrome.tabs && chrome.tabs.query) {
        chrome.tabs.query(queryInfo, (tabs) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(tabs || []);
          }
        });
      } else {
        resolve([]);
      }
    });
  }

  /**
   * Migrate settings from previous versions
   * @private
   * @param {string} previousVersion - Previous extension version
   */
  async _migrateSettings(previousVersion) {
    console.log(`Migrating settings from version ${previousVersion}`);
    
    try {
      const currentSettings = await this.storageManager.getSettings();
      
      // Add any version-specific migration logic here
      // For now, just ensure all required fields exist
      const migratedSettings = {
        ...DEFAULT_SETTINGS,
        ...currentSettings,
        version: chrome.runtime.getManifest().version
      };
      
      await this.storageManager.saveSettings(migratedSettings);
      console.log('Settings migration completed');
      
    } catch (error) {
      console.error('Error during settings migration:', error);
      // If migration fails, reset to defaults
      await this.storageManager.initializeDefaults();
    }
  }

  /**
   * Get installation data
   * @private
   * @returns {Promise<Object>} Installation data
   */
  async _getInstallationData() {
    try {
      return await new Promise((resolve, reject) => {
        chrome.storage.local.get(['installationData'], (result) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(result.installationData || {});
          }
        });
      });
    } catch (error) {
      console.error('Error getting installation data:', error);
      return {};
    }
  }

  /**
   * Set installation data
   * @private
   * @param {Object} data - Installation data to store
   */
  async _setInstallationData(data) {
    try {
      await new Promise((resolve, reject) => {
        chrome.storage.local.set({ installationData: data }, () => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve();
          }
        });
      });
    } catch (error) {
      console.error('Error setting installation data:', error);
    }
  }
}

// Initialize the background service
const backgroundService = new BackgroundService();

// Export for testing purposes
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BackgroundService, MESSAGE_TYPES, LIFECYCLE_STATES };
}