/**
 * Bilibili Content Filter - Popup Interface
 * 
 * Provides user interface for controlling content filters
 * with real-time communication to content scripts and storage persistence.
 */

/**
 * Popup Controller Class
 * Manages the popup interface, settings synchronization, and user interactions
 */
class PopupController {
  constructor() {
    this.currentSettings = null;
    this.isLoading = false;
    this.storageManager = null;
    this.activeTab = null;
    
    // DOM elements
    this.elements = {
      container: null,
      statusDot: null,
      statusText: null,
      errorMessage: null,
      toggles: new Map()
    };
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initialize());
    } else {
      this.initialize();
    }
  }

  /**
   * Initialize the popup controller
   */
  async initialize() {
    try {
      this.cacheElements();
      this.setupEventListeners();
      await this.initializeStorageManager();
      await this.loadCurrentSettings();
      await this.getActiveTab();
      this.updateStatus('ready', 'Ready');
      
      console.log('Popup controller initialized successfully');
    } catch (error) {
      console.error('Failed to initialize popup controller:', error);
      this.showError('Failed to initialize extension');
      this.updateStatus('error', 'Error');
    }
  }

  /**
   * Cache DOM elements for efficient access
   */
  cacheElements() {
    this.elements.container = document.querySelector('.popup-container');
    this.elements.statusDot = document.querySelector('.status-dot');
    this.elements.statusText = document.querySelector('.status-text');
    this.elements.errorMessage = document.querySelector('.error-message');
    
    // Cache all toggle inputs
    const toggleInputs = document.querySelectorAll('.toggle-input');
    toggleInputs.forEach(input => {
      const filterType = input.dataset.filter;
      if (filterType) {
        this.elements.toggles.set(filterType, input);
      }
    });
  }

  /**
   * Setup event listeners for user interactions
   */
  setupEventListeners() {
    // Toggle switch event listeners
    this.elements.toggles.forEach((input, filterType) => {
      input.addEventListener('change', (event) => {
        this.handleToggleChange(filterType, event.target.checked);
      });
      
      // Keyboard accessibility
      input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          input.checked = !input.checked;
          this.handleToggleChange(filterType, input.checked);
        }
      });
    });

    // Error message dismiss
    if (this.elements.errorMessage) {
      this.elements.errorMessage.addEventListener('click', () => {
        this.hideError();
      });
    }
  }

  /**
   * Initialize storage manager with dynamic import
   */
  async initializeStorageManager() {
    try {
      // Import storage manager (adjust path as needed for extension context)
      const { StorageManager } = await import('../storage/storage.js');
      this.storageManager = new StorageManager();
      
      // Listen for storage changes
      this.storageManager.onSettingsChange((settings) => {
        this.handleStorageChange(settings);
      });
    } catch (error) {
      console.error('Failed to initialize storage manager:', error);
      // Fallback to direct browser storage API
      this.storageManager = null;
    }
  }

  /**
   * Load current settings from storage
   */
  async loadCurrentSettings() {
    this.setLoading(true);
    
    try {
      let settings;
      
      if (this.storageManager) {
        settings = await this.storageManager.getSettings();
      } else {
        // Fallback to direct storage access
        settings = await this.getSettingsFromStorage();
      }
      
      this.currentSettings = settings;
      this.updateUI(settings);
      
      console.log('Loaded current settings:', settings);
    } catch (error) {
      console.error('Failed to load settings:', error);
      this.showError('Failed to load settings');
      
      // Use default settings as fallback
      this.currentSettings = this.getDefaultSettings();
      this.updateUI(this.currentSettings);
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Get settings from browser storage (fallback method)
   */
  async getSettingsFromStorage() {
    return new Promise((resolve) => {
      try {
        const storageAPI = this.getStorageAPI();
        if (!storageAPI) {
          resolve(this.getDefaultSettings());
          return;
        }

        storageAPI.get(['bilibiliFilterSettings'], (result) => {
          if (chrome.runtime.lastError) {
            console.warn('Storage error:', chrome.runtime.lastError);
            resolve(this.getDefaultSettings());
          } else {
            const settings = result.bilibiliFilterSettings || this.getDefaultSettings();
            resolve(settings);
          }
        });
      } catch (error) {
        console.error('Error accessing storage:', error);
        resolve(this.getDefaultSettings());
      }
    });
  }

  /**
   * Get appropriate storage API for current browser
   */
  getStorageAPI() {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
      return chrome.storage.sync;
    } else if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      return chrome.storage.local;
    } else if (typeof browser !== 'undefined' && browser.storage && browser.storage.sync) {
      return browser.storage.sync;
    } else if (typeof browser !== 'undefined' && browser.storage && browser.storage.local) {
      return browser.storage.local;
    }
    return null;
  }

  /**
   * Get default settings
   */
  getDefaultSettings() {
    return {
      hideHeadChannel: false,
      rightSidebar: false,
      comments: false,
      relatedVideos: false,
      version: '1.0.0',
      lastUpdated: Date.now()
    };
  }

  /**
   * Get active tab for communication with content script
   */
  async getActiveTab() {
    try {
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        const tabs = await new Promise((resolve) => {
          chrome.tabs.query({ active: true, currentWindow: true }, resolve);
        });
        this.activeTab = tabs[0];
      } else if (typeof browser !== 'undefined' && browser.tabs) {
        const tabs = await browser.tabs.query({ active: true, currentWindow: true });
        this.activeTab = tabs[0];
      }
    } catch (error) {
      console.error('Failed to get active tab:', error);
    }
  }

  /**
   * Handle toggle switch changes with enhanced error handling and immediate application
   */
  async handleToggleChange(filterType, enabled) {
    if (this.isLoading) {
      return;
    }

    try {
      this.setLoading(true);
      this.updateStatus('loading', 'Updating...');

      // Update current settings optimistically
      const previousValue = this.currentSettings[filterType];
      this.currentSettings[filterType] = enabled;
      this.currentSettings.lastUpdated = Date.now();

      // First, apply the change immediately to content script for instant feedback
      let contentScriptSuccess = false;
      try {
        await this.sendMessageToContentScript({
          type: 'TOGGLE_FILTER',
          filterType: filterType,
          enabled: enabled
        });
        contentScriptSuccess = true;
      } catch (contentError) {
        console.warn('Content script toggle failed, continuing with background save:', contentError);
      }

      // Then save to storage via background script for persistence and cross-tab sync
      try {
        await this.sendMessageToBackground({
          type: 'TOGGLE_FILTER',
          filterType: filterType,
          enabled: enabled
        });
      } catch (backgroundError) {
        console.error('Background script toggle failed:', backgroundError);
        
        // If background save failed but content script succeeded, try to revert content script
        if (contentScriptSuccess) {
          try {
            await this.sendMessageToContentScript({
              type: 'TOGGLE_FILTER',
              filterType: filterType,
              enabled: previousValue
            });
          } catch (revertError) {
            console.error('Failed to revert content script change:', revertError);
          }
        }
        
        throw backgroundError;
      }

      this.updateStatus('ready', 'Ready');
      console.log(`Filter ${filterType} ${enabled ? 'enabled' : 'disabled'} successfully`);
      
    } catch (error) {
      console.error(`Failed to toggle filter ${filterType}:`, error);
      this.showError(`Failed to update ${filterType} filter`);
      this.updateStatus('error', 'Error');
      
      // Revert settings and UI state on error
      this.currentSettings[filterType] = !enabled;
      const toggle = this.elements.toggles.get(filterType);
      if (toggle) {
        toggle.checked = !enabled;
      }
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Send message to background script
   */
  async sendMessageToBackground(message) {
    try {
      let response;
      
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        response = await new Promise((resolve) => {
          chrome.runtime.sendMessage(message, (response) => {
            if (chrome.runtime.lastError) {
              console.warn('Background message error:', chrome.runtime.lastError);
              resolve(null);
            } else {
              resolve(response);
            }
          });
        });
      } else if (typeof browser !== 'undefined' && browser.runtime) {
        response = await browser.runtime.sendMessage(message);
      }

      if (response && !response.success) {
        throw new Error(response.error || 'Unknown error from background script');
      }

      return response;
    } catch (error) {
      console.error('Failed to send message to background script:', error);
      throw error;
    }
  }

  /**
   * Save settings to storage
   */
  async saveSettings(settings) {
    if (this.storageManager) {
      await this.storageManager.saveSettings(settings);
    } else {
      // Fallback to direct storage access
      await this.saveSettingsToStorage(settings);
    }
  }

  /**
   * Save settings to browser storage (fallback method)
   */
  async saveSettingsToStorage(settings) {
    return new Promise((resolve, reject) => {
      try {
        const storageAPI = this.getStorageAPI();
        if (!storageAPI) {
          reject(new Error('No storage API available'));
          return;
        }

        storageAPI.set({ bilibiliFilterSettings: settings }, () => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve();
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Send message to content script
   */
  async sendMessageToContentScript(message) {
    if (!this.activeTab) {
      console.warn('No active tab available for messaging');
      return;
    }

    try {
      let response;
      
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        response = await new Promise((resolve) => {
          chrome.tabs.sendMessage(this.activeTab.id, message, (response) => {
            if (chrome.runtime.lastError) {
              console.warn('Message sending error:', chrome.runtime.lastError);
              resolve(null);
            } else {
              resolve(response);
            }
          });
        });
      } else if (typeof browser !== 'undefined' && browser.tabs) {
        response = await browser.tabs.sendMessage(this.activeTab.id, message);
      }

      if (response && !response.success) {
        throw new Error(response.error || 'Unknown error from content script');
      }

      return response;
    } catch (error) {
      console.error('Failed to send message to content script:', error);
      throw error;
    }
  }

  /**
   * Update UI with current settings
   */
  updateUI(settings) {
    if (!settings) {
      return;
    }

    // Update toggle states
    this.elements.toggles.forEach((input, filterType) => {
      if (typeof settings[filterType] === 'boolean') {
        input.checked = settings[filterType];
      }
    });

    console.log('UI updated with settings:', settings);
  }

  /**
   * Handle storage changes from other sources
   */
  handleStorageChange(newSettings) {
    if (!newSettings) {
      return;
    }

    console.log('Handling storage change:', newSettings);
    this.currentSettings = newSettings;
    this.updateUI(newSettings);
  }

  /**
   * Set loading state
   */
  setLoading(loading) {
    this.isLoading = loading;
    
    if (this.elements.container) {
      if (loading) {
        this.elements.container.classList.add('loading');
      } else {
        this.elements.container.classList.remove('loading');
      }
    }

    // Disable/enable toggles during loading
    this.elements.toggles.forEach((input) => {
      input.disabled = loading;
    });
  }

  /**
   * Update status indicator
   */
  updateStatus(type, text) {
    if (this.elements.statusDot) {
      this.elements.statusDot.className = `status-dot ${type}`;
    }
    
    if (this.elements.statusText) {
      this.elements.statusText.textContent = text;
    }
  }

  /**
   * Show error message
   */
  showError(message) {
    if (this.elements.errorMessage) {
      this.elements.errorMessage.textContent = message;
      this.elements.errorMessage.classList.add('show');
      
      // Auto-hide after 5 seconds
      setTimeout(() => {
        this.hideError();
      }, 5000);
    }
  }

  /**
   * Test round-trip consistency via content script
   * @returns {Promise<Object>} Test results from content script
   */
  async testContentScriptRoundTrip() {
    try {
      const response = await this.sendMessageToContentScript({
        type: 'TEST_ROUND_TRIP'
      });
      
      if (response && response.success) {
        console.log('Content script round-trip test results:', response.results);
        return response.results;
      } else {
        throw new Error('Content script round-trip test failed');
      }
    } catch (error) {
      console.error('Error testing content script round-trip:', error);
      throw error;
    }
  }

  /**
   * Test round-trip consistency for all filters
   * This method can be called for debugging or validation purposes
   * @returns {Promise<Object>} Test results for each filter type
   */
  async testRoundTripConsistency() {
    const results = {};
    const filterTypes = ['hideHeadChannel', 'rightSidebar', 'comments', 'relatedVideos'];
    
    console.log('Starting round-trip consistency test...');
    
    for (const filterType of filterTypes) {
      try {
        // Get initial state
        const initialSettings = await this.getSettingsFromStorage();
        const initialState = initialSettings[filterType];
        
        // Toggle to opposite state
        await this.handleToggleChange(filterType, !initialState);
        
        // Wait a moment for changes to propagate
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Check that state changed
        const intermediateSettings = await this.getSettingsFromStorage();
        const intermediateState = intermediateSettings[filterType];
        
        if (intermediateState !== !initialState) {
          results[filterType] = {
            success: false,
            error: 'State did not change as expected',
            initial: initialState,
            intermediate: intermediateState
          };
          continue;
        }
        
        // Toggle back to original state
        await this.handleToggleChange(filterType, initialState);
        
        // Wait a moment for changes to propagate
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Check that we're back to original state
        const finalSettings = await this.getSettingsFromStorage();
        const finalState = finalSettings[filterType];
        
        if (finalState !== initialState) {
          results[filterType] = {
            success: false,
            error: 'Failed to restore original state',
            initial: initialState,
            intermediate: intermediateState,
            final: finalState
          };
        } else {
          results[filterType] = {
            success: true,
            initial: initialState,
            intermediate: intermediateState,
            final: finalState
          };
        }
        
      } catch (error) {
        results[filterType] = {
          success: false,
          error: error.message
        };
      }
    }
    
    console.log('Round-trip consistency test results:', results);
    return results;
  }

  /**
   * Hide error message
   */
  hideError() {
    if (this.elements.errorMessage) {
      this.elements.errorMessage.classList.remove('show');
    }
  }
}

// Initialize popup controller
new PopupController();