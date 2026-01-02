/**
 * Bilibili Content Filter - Content Script
 * 
 * This script runs on Bilibili pages to apply content filtering
 * based on user preferences stored in browser storage.
 * 
 * Injected at document_start to ensure early DOM manipulation
 * and prevent flash of unfiltered content.
 */

import { filterManager } from './filter.js';
import { logger, LOG_CATEGORIES } from '../utils/logger.js';
import { errorHandler, ERROR_CATEGORIES, RECOVERY_STRATEGIES } from '../utils/error-handler.js';
import { gracefulDegradationManager } from '../utils/graceful-degradation.js';

/**
 * Content Script Controller
 * Manages the integration between storage, filtering, and user preferences
 * Handles cross-browser compatibility and error recovery
 */
class ContentScriptController {
  constructor() {
    this.isInitialized = false;
    this.currentSettings = null;
    this.initializationRetries = 0;
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 second
  }

  /**
   * Initialize the content script with retry logic
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      logger.info(LOG_CATEGORIES.INITIALIZATION, 'Starting content script initialization');

      // Ensure DOM is ready for manipulation
      await this.waitForDOM();

      // Initialize the filter manager
      filterManager.initialize();
      logger.debug(LOG_CATEGORIES.INITIALIZATION, 'Filter manager initialized');

      // Load and apply current settings
      await this.loadAndApplySettings();

      // Listen for settings changes from popup
      this.setupMessageListener();

      // Listen for storage changes
      this.setupStorageListener();

      // Setup error recovery
      this.setupErrorRecovery();

      this.isInitialized = true;
      logger.info(LOG_CATEGORIES.INITIALIZATION, 'Bilibili Content Filter initialized successfully');
      
    } catch (error) {
      logger.error(LOG_CATEGORIES.INITIALIZATION, 'Failed to initialize Bilibili Content Filter', error);
      
      errorHandler.handleError(error, {
        category: ERROR_CATEGORIES.INITIALIZATION,
        context: 'content_script_init',
        recoveryStrategy: RECOVERY_STRATEGIES.RETRY,
        userMessage: 'Extension failed to start properly. Retrying...'
      });
      
      // Retry initialization if not at max retries
      if (this.initializationRetries < this.maxRetries) {
        this.initializationRetries++;
        logger.warn(LOG_CATEGORIES.INITIALIZATION, 
          `Retrying initialization (attempt ${this.initializationRetries}/${this.maxRetries})`);
        setTimeout(() => this.initialize(), this.retryDelay * this.initializationRetries);
      } else {
        logger.critical(LOG_CATEGORIES.INITIALIZATION, 
          'Max initialization retries reached. Extension may not function properly.');
        
        errorHandler.handleError(new Error('Max initialization retries reached'), {
          category: ERROR_CATEGORIES.INITIALIZATION,
          context: 'content_script_init_failed',
          recoveryStrategy: RECOVERY_STRATEGIES.GRACEFUL_DEGRADATION,
          userMessage: 'Extension initialization failed. Some features may not work.'
        });
        
        // Apply default filters as fallback
        this.applyDefaultFilters();
      }
    }
  }

  /**
   * Wait for DOM to be ready for manipulation
   */
  async waitForDOM() {
    return new Promise((resolve) => {
      if (document.body) {
        resolve();
      } else {
        const observer = new MutationObserver((mutations, obs) => {
          if (document.body) {
            obs.disconnect();
            resolve();
          }
        });
        observer.observe(document.documentElement, {
          childList: true,
          subtree: true
        });
        
        // Fallback timeout
        setTimeout(() => {
          observer.disconnect();
          resolve();
        }, 5000);
      }
    });
  }

  /**
   * Load settings from storage and apply filters with error handling
   */
  async loadAndApplySettings() {
    try {
      logger.debug(LOG_CATEGORIES.STORAGE, 'Loading settings from storage');
      
      // Try to get settings from browser storage
      const settings = await this.getStorageSettings();
      
      if (settings) {
        this.currentSettings = settings;
        this.applyFiltersFromSettings(this.currentSettings);
        logger.info(LOG_CATEGORIES.STORAGE, 'Loaded settings from storage', this.currentSettings);
      } else {
        // No settings found, use defaults
        logger.warn(LOG_CATEGORIES.STORAGE, 'No settings found in storage, using defaults');
        this.applyDefaultSettings();
      }
    } catch (error) {
      logger.error(LOG_CATEGORIES.STORAGE, 'Failed to load settings from storage', error);
      
      errorHandler.handleError(error, {
        category: ERROR_CATEGORIES.STORAGE,
        context: 'load_settings',
        recoveryStrategy: RECOVERY_STRATEGIES.FALLBACK,
        userMessage: 'Settings could not be loaded. Using default settings.'
      });
      
      // Apply default settings on error
      this.applyDefaultSettings();
    }
  }

  /**
   * Get settings from browser storage with cross-browser compatibility
   */
  async getStorageSettings() {
    return new Promise((resolve) => {
      try {
        const storageAPI = this.getStorageAPI();
        if (!storageAPI) {
          logger.warn(LOG_CATEGORIES.STORAGE, 'No storage API available');
          resolve(null);
          return;
        }

        storageAPI.get(['bilibiliFilterSettings'], (result) => {
          if (chrome.runtime.lastError) {
            logger.warn(LOG_CATEGORIES.STORAGE, 'Storage error', chrome.runtime.lastError);
            resolve(null);
          } else {
            const settings = result.bilibiliFilterSettings || null;
            logger.debug(LOG_CATEGORIES.STORAGE, 'Retrieved settings from storage', settings);
            resolve(settings);
          }
        });
      } catch (error) {
        logger.error(LOG_CATEGORIES.STORAGE, 'Error accessing storage', error);
        
        errorHandler.handleError(error, {
          category: ERROR_CATEGORIES.STORAGE,
          context: 'get_storage_settings',
          recoveryStrategy: RECOVERY_STRATEGIES.GRACEFUL_DEGRADATION
        });
        
        resolve(null);
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
   * Apply default settings when storage is unavailable
   */
  applyDefaultSettings() {
    const defaultSettings = {
      homeRecommendations: true,
      rankingTrending: false,
      rightSidebar: false,
      comments: false,
      relatedVideos: false,
      version: '1.0.0',
      lastUpdated: Date.now()
    };

    this.currentSettings = defaultSettings;
    this.applyFiltersFromSettings(this.currentSettings);
    console.log('Applied default settings:', this.currentSettings);
  }

  /**
   * Apply filters based on settings object with error handling
   * @param {Object} settings - Filter settings
   */
  applyFiltersFromSettings(settings) {
    if (!settings || typeof settings !== 'object') {
      logger.warn(LOG_CATEGORIES.FILTERING, 'Invalid settings object, applying defaults');
      this.applyDefaultFilters();
      return;
    }

    logger.debug(LOG_CATEGORIES.FILTERING, 'Applying filters from settings', settings);

    Object.entries(settings).forEach(([filterType, enabled]) => {
      if (typeof enabled === 'boolean') {
        try {
          if (enabled) {
            const success = filterManager.applyFilter(filterType);
            if (!success) {
              // Try graceful degradation
              gracefulDegradationManager.applyGracefulFiltering(filterType, true);
            }
          } else {
            filterManager.removeFilter(filterType);
          }
          
          logger.debug(LOG_CATEGORIES.FILTERING, 
            `Filter ${filterType} ${enabled ? 'applied' : 'removed'} successfully`);
            
        } catch (error) {
          logger.error(LOG_CATEGORIES.FILTERING, 
            `Error applying filter ${filterType}`, error);
          
          errorHandler.handleError(error, {
            category: ERROR_CATEGORIES.DOM_MANIPULATION,
            context: `apply_filter_${filterType}`,
            recoveryStrategy: RECOVERY_STRATEGIES.GRACEFUL_DEGRADATION
          });
        }
      }
    });
  }

  /**
   * Apply default filters (only home recommendations enabled) with error handling
   */
  applyDefaultFilters() {
    try {
      filterManager.applyFilter('homeRecommendations');
      console.log('Applied default filter: homeRecommendations');
    } catch (error) {
      console.error('Error applying default filters:', error);
    }
  }

  /**
   * Setup message listener for communication with popup with enhanced error handling
   */
  setupMessageListener() {
    try {
      // Listen for messages from popup or background script
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
          this.handleMessage(message, sender, sendResponse);
          return true; // Keep message channel open for async response
        });
      } else if (typeof browser !== 'undefined' && browser.runtime && browser.runtime.onMessage) {
        browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
          this.handleMessage(message, sender, sendResponse);
          return true;
        });
      } else {
        console.warn('Runtime messaging API not available');
      }
    } catch (error) {
      console.error('Error setting up message listener:', error);
    }
  }

  /**
   * Handle messages from popup or background script with comprehensive error handling
   * @param {Object} message - Message object
   * @param {Object} sender - Message sender
   * @param {Function} sendResponse - Response callback
   */
  async handleMessage(message, sender, sendResponse) {
    try {
      if (!message || !message.type) {
        const error = new Error('Invalid message format');
        logger.warn(LOG_CATEGORIES.COMMUNICATION, 'Received invalid message', { message, sender });
        sendResponse({ success: false, error: error.message });
        return;
      }

      logger.debug(LOG_CATEGORIES.COMMUNICATION, `Handling message: ${message.type}`, message);

      switch (message.type) {
        case 'TOGGLE_FILTER':
          const toggleResult = await this.handleToggleFilter(message);
          sendResponse({ success: true, ...toggleResult });
          break;

        case 'GET_FILTER_STATUS':
          const status = filterManager.getFilterStatus();
          sendResponse({ success: true, status });
          break;

        case 'SETTINGS_UPDATED':
          if (message.settings) {
            this.applyFiltersFromSettings(message.settings);
            this.currentSettings = message.settings;
            logger.info(LOG_CATEGORIES.COMMUNICATION, 'Settings updated via message', message.settings);
            sendResponse({ success: true });
          } else {
            const error = new Error('No settings provided');
            logger.warn(LOG_CATEGORIES.COMMUNICATION, 'Settings update message missing settings');
            sendResponse({ success: false, error: error.message });
          }
          break;

        case 'APPLY_SETTINGS':
          if (message.settings) {
            this.applyFiltersFromSettings(message.settings);
            this.currentSettings = message.settings;
            logger.info(LOG_CATEGORIES.COMMUNICATION, 'Settings applied via message', message.settings);
            sendResponse({ success: true });
          } else {
            const error = new Error('No settings provided');
            logger.warn(LOG_CATEGORIES.COMMUNICATION, 'Apply settings message missing settings');
            sendResponse({ success: false, error: error.message });
          }
          break;

        case 'TEST_ROUND_TRIP':
          const testResults = filterManager.testAllRoundTripConsistency();
          logger.info(LOG_CATEGORIES.SYSTEM, 'Round trip test completed', testResults);
          sendResponse({ success: true, results: testResults });
          break;

        case 'GET_CURRENT_SETTINGS':
          sendResponse({ success: true, settings: this.currentSettings });
          break;

        case 'RELOAD_FILTERS':
          await this.loadAndApplySettings();
          logger.info(LOG_CATEGORIES.FILTERING, 'Filters reloaded via message');
          sendResponse({ success: true });
          break;

        case 'GET_ERROR_LOGS':
          const logs = logger.getLogs({ level: 'WARN', limit: 100 });
          sendResponse({ success: true, logs });
          break;

        case 'GET_DEGRADATION_STATUS':
          const degradationStatus = gracefulDegradationManager.getStatus();
          sendResponse({ success: true, status: degradationStatus });
          break;

        default:
          const error = new Error(`Unknown message type: ${message.type}`);
          logger.warn(LOG_CATEGORIES.COMMUNICATION, 'Unknown message type received', { type: message.type });
          sendResponse({ success: false, error: error.message });
      }
    } catch (error) {
      logger.error(LOG_CATEGORIES.COMMUNICATION, 'Error handling message', error);
      
      errorHandler.handleError(error, {
        category: ERROR_CATEGORIES.UNKNOWN_PAGE_STRUCTURE,
        context: 'message_handling',
        recoveryStrategy: RECOVERY_STRATEGIES.GRACEFUL_DEGRADATION
      });
      
      sendResponse({ success: false, error: error.message });
    }
  }

  /**
   * Handle filter toggle request with validation, immediate application, and enhanced feedback
   * @param {Object} message - Toggle message
   */
  async handleToggleFilter(message) {
    const { filterType, enabled } = message;
    
    if (!filterType || typeof enabled !== 'boolean') {
      throw new Error('Invalid toggle filter message format');
    }

    // Validate filter type
    const validFilterTypes = ['homeRecommendations', 'rankingTrending', 'rightSidebar', 'comments', 'relatedVideos'];
    if (!validFilterTypes.includes(filterType)) {
      throw new Error(`Invalid filter type: ${filterType}`);
    }

    try {
      // Get current state for verification
      const currentStatus = filterManager.getFilterStatus();
      const wasEnabled = currentStatus[filterType];
      
      // Use the enhanced toggle method for immediate application
      const success = filterManager.toggleFilter(filterType, enabled);
      
      if (!success) {
        throw new Error(`Failed to toggle filter ${filterType}`);
      }

      // Verify the change was applied
      const newStatus = filterManager.getFilterStatus();
      const isNowEnabled = newStatus[filterType];
      
      if (isNowEnabled !== enabled) {
        throw new Error(`Filter ${filterType} state verification failed: expected ${enabled}, got ${isNowEnabled}`);
      }

      // Update current settings
      if (this.currentSettings) {
        this.currentSettings[filterType] = enabled;
        this.currentSettings.lastUpdated = Date.now();
      }

      console.log(`Filter ${filterType} ${enabled ? 'enabled' : 'disabled'} successfully (was ${wasEnabled ? 'enabled' : 'disabled'})`);
      
      // Return success with state information for verification
      return {
        success: true,
        filterType,
        enabled,
        previousState: wasEnabled,
        currentState: isNowEnabled
      };
      
    } catch (error) {
      console.error(`Error toggling filter ${filterType}:`, error);
      throw error;
    }
  }

  /**
   * Setup storage change listener with enhanced error handling
   */
  setupStorageListener() {
    try {
      const storageAPI = this.getStorageAPI();
      
      if (storageAPI && storageAPI.onChanged) {
        storageAPI.onChanged.addListener((changes, areaName) => {
          if (areaName === 'sync' || areaName === 'local') {
            this.handleStorageChange(changes);
          }
        });
        console.log('Storage change listener set up successfully');
      } else {
        console.warn('Storage change listener not available');
      }
    } catch (error) {
      console.error('Error setting up storage listener:', error);
    }
  }

  /**
   * Handle storage changes with validation
   * @param {Object} changes - Storage changes object
   */
  handleStorageChange(changes) {
    try {
      if (changes.bilibiliFilterSettings && changes.bilibiliFilterSettings.newValue) {
        const newSettings = changes.bilibiliFilterSettings.newValue;
        
        // Validate settings structure
        if (typeof newSettings === 'object' && newSettings !== null) {
          this.applyFiltersFromSettings(newSettings);
          this.currentSettings = newSettings;
          console.log('Applied settings from storage change:', newSettings);
        } else {
          console.warn('Invalid settings structure in storage change');
        }
      }
    } catch (error) {
      console.error('Error handling storage change:', error);
    }
  }

  /**
   * Setup error recovery mechanisms
   */
  setupErrorRecovery() {
    logger.debug(LOG_CATEGORIES.SYSTEM, 'Setting up error recovery mechanisms');
    
    // Global error handler for unhandled errors
    window.addEventListener('error', (event) => {
      if (event.error && event.error.message && event.error.message.includes('bilibili-filter')) {
        logger.error(LOG_CATEGORIES.SYSTEM, 'Bilibili Filter error caught', event.error);
        
        errorHandler.handleError(event.error, {
          category: ERROR_CATEGORIES.UNKNOWN_PAGE_STRUCTURE,
          context: 'global_error_handler',
          recoveryStrategy: RECOVERY_STRATEGIES.GRACEFUL_DEGRADATION
        });
        
        // Attempt to reinitialize if critical error
        if (!this.isInitialized) {
          setTimeout(() => this.initialize(), 2000);
        }
      }
    });

    // Periodic health check
    setInterval(() => {
      this.performHealthCheck();
    }, 30000); // Every 30 seconds
    
    logger.info(LOG_CATEGORIES.SYSTEM, 'Error recovery mechanisms set up successfully');
  }

  /**
   * Perform health check and recovery
   */
  performHealthCheck() {
    try {
      logger.debug(LOG_CATEGORIES.SYSTEM, 'Performing health check');
      
      // Check if filter manager is still functional
      if (!filterManager || typeof filterManager.getFilterStatus !== 'function') {
        logger.warn(LOG_CATEGORIES.SYSTEM, 'Filter manager appears to be corrupted, attempting recovery');
        
        errorHandler.handleError(new Error('Filter manager corrupted'), {
          category: ERROR_CATEGORIES.INITIALIZATION,
          context: 'health_check_filter_manager',
          recoveryStrategy: RECOVERY_STRATEGIES.RETRY
        });
        
        this.initialize();
        return;
      }

      // Check if DOM observer is still active
      if (!filterManager.observer) {
        logger.warn(LOG_CATEGORIES.DOM, 'DOM observer is inactive, reinitializing filter manager');
        
        errorHandler.handleError(new Error('DOM observer inactive'), {
          category: ERROR_CATEGORIES.DOM_MANIPULATION,
          context: 'health_check_dom_observer',
          recoveryStrategy: RECOVERY_STRATEGIES.RETRY
        });
        
        filterManager.initialize();
      }

      // Verify active filters are still applied
      const status = filterManager.getFilterStatus();
      if (this.currentSettings) {
        Object.entries(this.currentSettings).forEach(([filterType, enabled]) => {
          if (typeof enabled === 'boolean' && status[filterType] !== enabled) {
            logger.warn(LOG_CATEGORIES.FILTERING, 
              `Filter ${filterType} state mismatch, reapplying`);
            
            try {
              if (enabled) {
                const success = filterManager.applyFilter(filterType);
                if (!success) {
                  gracefulDegradationManager.applyGracefulFiltering(filterType, true);
                }
              } else {
                filterManager.removeFilter(filterType);
              }
            } catch (error) {
              logger.error(LOG_CATEGORIES.FILTERING, 
                `Failed to reapply filter ${filterType}`, error);
              
              errorHandler.handleError(error, {
                category: ERROR_CATEGORIES.DOM_MANIPULATION,
                context: `health_check_reapply_${filterType}`,
                recoveryStrategy: RECOVERY_STRATEGIES.GRACEFUL_DEGRADATION
              });
            }
          }
        });
      }
      
      logger.debug(LOG_CATEGORIES.SYSTEM, 'Health check completed successfully');
      
    } catch (error) {
      logger.error(LOG_CATEGORIES.SYSTEM, 'Error during health check', error);
      
      errorHandler.handleError(error, {
        category: ERROR_CATEGORIES.UNKNOWN_PAGE_STRUCTURE,
        context: 'health_check',
        recoveryStrategy: RECOVERY_STRATEGIES.GRACEFUL_DEGRADATION
      });
    }
  }
}

/**
 * Check if we're on a Bilibili domain with enhanced validation
 */
function isBilibiliDomain() {
  try {
    const hostname = window.location.hostname.toLowerCase();
    const bilibiliDomains = [
      'bilibili.com',
      'www.bilibili.com',
      'space.bilibili.com',
      'live.bilibili.com',
      'search.bilibili.com',
      'bangumi.bilibili.com',
      'manga.bilibili.com'
    ];
    
    const isValidDomain = bilibiliDomains.some(domain => 
      hostname === domain || hostname.endsWith('.' + domain)
    );
    
    logger.debug(LOG_CATEGORIES.INITIALIZATION, 
      `Domain check: ${hostname} - ${isValidDomain ? 'valid' : 'invalid'}`);
    
    return isValidDomain;
  } catch (error) {
    logger.error(LOG_CATEGORIES.INITIALIZATION, 'Error checking domain', error);
    
    errorHandler.handleError(error, {
      category: ERROR_CATEGORIES.BROWSER_COMPATIBILITY,
      context: 'domain_check',
      recoveryStrategy: RECOVERY_STRATEGIES.GRACEFUL_DEGRADATION
    });
    
    return false;
  }
}

/**
 * Initialize content script when DOM is ready with enhanced timing
 */
function initializeWhenReady() {
  if (!isBilibiliDomain()) {
    logger.info(LOG_CATEGORIES.INITIALIZATION, 'Not on Bilibili domain, skipping initialization');
    return;
  }

  logger.info(LOG_CATEGORIES.INITIALIZATION, 
    `Initializing Bilibili Content Filter on: ${window.location.hostname}`);
  
  const controller = new ContentScriptController();
  
  // Store controller globally for error recovery
  window.bilibiliFilterController = controller;
  
  // Initialize immediately if possible, or wait for appropriate event
  if (document.readyState === 'loading') {
    logger.debug(LOG_CATEGORIES.INITIALIZATION, 'DOM still loading, waiting for DOMContentLoaded');
    
    // DOM is still loading, wait for DOMContentLoaded
    document.addEventListener('DOMContentLoaded', () => {
      logger.debug(LOG_CATEGORIES.INITIALIZATION, 'DOMContentLoaded event fired');
      controller.initialize();
    });
    
    // Fallback: also try when document becomes interactive
    document.addEventListener('readystatechange', () => {
      if (document.readyState === 'interactive' && !controller.isInitialized) {
        logger.debug(LOG_CATEGORIES.INITIALIZATION, 'Document became interactive');
        controller.initialize();
      }
    });
  } else {
    // DOM is already ready (interactive or complete)
    logger.debug(LOG_CATEGORIES.INITIALIZATION, 
      `DOM already ready (${document.readyState}), initializing immediately`);
    controller.initialize();
  }
  
  // Additional fallback for SPA navigation
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      logger.info(LOG_CATEGORIES.COMPATIBILITY, 'URL changed, reapplying filters', { 
        oldUrl: lastUrl, 
        newUrl: url 
      });
      
      // Small delay to allow new content to load
      setTimeout(() => {
        if (controller.isInitialized && controller.currentSettings) {
          controller.applyFiltersFromSettings(controller.currentSettings);
        }
      }, 500);
    }
  }).observe(document, { subtree: true, childList: true });
  
  logger.info(LOG_CATEGORIES.INITIALIZATION, 'Content script initialization setup complete');
}

// Start initialization
initializeWhenReady();