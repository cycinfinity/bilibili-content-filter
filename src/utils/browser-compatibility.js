/**
 * Browser Compatibility Layer for Bilibili Content Filter Extension
 * Provides feature detection and cross-browser API abstraction
 */

/**
 * Supported browser types
 */
const BROWSER_TYPES = {
  CHROME: 'chrome',
  EDGE: 'edge',
  SAFARI: 'safari',
  FIREFOX: 'firefox',
  UNKNOWN: 'unknown'
};

/**
 * Browser feature capabilities
 */
const BROWSER_FEATURES = {
  SYNC_STORAGE: 'syncStorage',
  LOCAL_STORAGE: 'localStorage',
  ACTIVE_TAB: 'activeTab',
  TABS_API: 'tabsApi',
  RUNTIME_MESSAGING: 'runtimeMessaging',
  CONTENT_SCRIPTS: 'contentScripts',
  WEB_ACCESSIBLE_RESOURCES: 'webAccessibleResources'
};

/**
 * Browser Compatibility Manager
 * Detects browser type and provides appropriate API abstractions
 */
class BrowserCompatibility {
  constructor() {
    this.browserType = this._detectBrowser();
    this.features = this._detectFeatures();
    this.apis = this._setupAPIs();
  }

  /**
   * Detect the current browser type
   * @private
   * @returns {string} Browser type constant
   */
  _detectBrowser() {
    // Check for Chrome/Chromium
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getManifest) {
      const manifest = chrome.runtime.getManifest();
      
      // Check for Edge-specific indicators
      if (navigator.userAgent.includes('Edg/')) {
        return BROWSER_TYPES.EDGE;
      }
      
      // Default to Chrome for Chromium-based browsers
      return BROWSER_TYPES.CHROME;
    }
    
    // Check for Safari
    if (typeof browser !== 'undefined' && browser.runtime && navigator.userAgent.includes('Safari')) {
      return BROWSER_TYPES.SAFARI;
    }
    
    // Check for Firefox
    if (typeof browser !== 'undefined' && browser.runtime && navigator.userAgent.includes('Firefox')) {
      return BROWSER_TYPES.FIREFOX;
    }
    
    return BROWSER_TYPES.UNKNOWN;
  }

  /**
   * Detect available browser features
   * @private
   * @returns {Object} Feature availability map
   */
  _detectFeatures() {
    const features = {};
    
    // Storage API detection
    features[BROWSER_FEATURES.SYNC_STORAGE] = this._hasStorageAPI('sync');
    features[BROWSER_FEATURES.LOCAL_STORAGE] = this._hasStorageAPI('local');
    
    // Tabs API detection
    features[BROWSER_FEATURES.TABS_API] = this._hasTabsAPI();
    features[BROWSER_FEATURES.ACTIVE_TAB] = this._hasActiveTabPermission();
    
    // Runtime messaging detection
    features[BROWSER_FEATURES.RUNTIME_MESSAGING] = this._hasRuntimeMessaging();
    
    // Content script features
    features[BROWSER_FEATURES.CONTENT_SCRIPTS] = this._hasContentScriptSupport();
    features[BROWSER_FEATURES.WEB_ACCESSIBLE_RESOURCES] = this._hasWebAccessibleResources();
    
    return features;
  }

  /**
   * Setup browser-specific API abstractions
   * @private
   * @returns {Object} Abstracted APIs
   */
  _setupAPIs() {
    const apis = {};
    
    // Storage API abstraction
    apis.storage = this._getStorageAPI();
    
    // Tabs API abstraction
    apis.tabs = this._getTabsAPI();
    
    // Runtime API abstraction
    apis.runtime = this._getRuntimeAPI();
    
    return apis;
  }

  /**
   * Check if storage API is available
   * @private
   * @param {string} type - 'sync' or 'local'
   * @returns {boolean} True if available
   */
  _hasStorageAPI(type) {
    try {
      // Chrome/Edge API
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage[type]) {
        return true;
      }
      
      // Firefox/Safari API
      if (typeof browser !== 'undefined' && browser.storage && browser.storage[type]) {
        return true;
      }
      
      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if tabs API is available
   * @private
   * @returns {boolean} True if available
   */
  _hasTabsAPI() {
    try {
      return (typeof chrome !== 'undefined' && chrome.tabs) ||
             (typeof browser !== 'undefined' && browser.tabs);
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if activeTab permission is available
   * @private
   * @returns {boolean} True if available
   */
  _hasActiveTabPermission() {
    try {
      // This is a permission check, not an API check
      // We'll assume it's available if tabs API is available
      return this._hasTabsAPI();
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if runtime messaging is available
   * @private
   * @returns {boolean} True if available
   */
  _hasRuntimeMessaging() {
    try {
      return (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) ||
             (typeof browser !== 'undefined' && browser.runtime && browser.runtime.sendMessage);
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if content script support is available
   * @private
   * @returns {boolean} True if available
   */
  _hasContentScriptSupport() {
    try {
      return (typeof chrome !== 'undefined' && chrome.scripting) ||
             (typeof browser !== 'undefined' && browser.scripting) ||
             // Fallback: assume content scripts work if we have tabs API
             this._hasTabsAPI();
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if web accessible resources are supported
   * @private
   * @returns {boolean} True if available
   */
  _hasWebAccessibleResources() {
    try {
      // This is a manifest feature, assume it's available in modern browsers
      return this.browserType !== BROWSER_TYPES.UNKNOWN;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get storage API abstraction
   * @private
   * @returns {Object} Storage API wrapper
   */
  _getStorageAPI() {
    const storageAPI = {};
    
    // Determine which API to use
    const api = (typeof chrome !== 'undefined' && chrome.storage) ? chrome.storage : 
                (typeof browser !== 'undefined' && browser.storage) ? browser.storage : null;
    
    if (!api) {
      return null;
    }
    
    // Wrap sync storage
    if (api.sync) {
      storageAPI.sync = {
        get: (keys) => this._promisifyStorageGet(api.sync, keys),
        set: (items) => this._promisifyStorageSet(api.sync, items),
        remove: (keys) => this._promisifyStorageRemove(api.sync, keys),
        clear: () => this._promisifyStorageClear(api.sync),
        onChanged: api.onChanged
      };
    }
    
    // Wrap local storage
    if (api.local) {
      storageAPI.local = {
        get: (keys) => this._promisifyStorageGet(api.local, keys),
        set: (items) => this._promisifyStorageSet(api.local, items),
        remove: (keys) => this._promisifyStorageRemove(api.local, keys),
        clear: () => this._promisifyStorageClear(api.local),
        onChanged: api.onChanged
      };
    }
    
    return storageAPI;
  }

  /**
   * Get tabs API abstraction
   * @private
   * @returns {Object} Tabs API wrapper
   */
  _getTabsAPI() {
    const api = (typeof chrome !== 'undefined' && chrome.tabs) ? chrome.tabs :
                (typeof browser !== 'undefined' && browser.tabs) ? browser.tabs : null;
    
    if (!api) {
      return null;
    }
    
    return {
      query: (queryInfo) => this._promisifyTabsQuery(api, queryInfo),
      sendMessage: (tabId, message) => this._promisifyTabsSendMessage(api, tabId, message),
      onUpdated: api.onUpdated,
      onActivated: api.onActivated
    };
  }

  /**
   * Get runtime API abstraction
   * @private
   * @returns {Object} Runtime API wrapper
   */
  _getRuntimeAPI() {
    const api = (typeof chrome !== 'undefined' && chrome.runtime) ? chrome.runtime :
                (typeof browser !== 'undefined' && browser.runtime) ? browser.runtime : null;
    
    if (!api) {
      return null;
    }
    
    return {
      sendMessage: (message) => this._promisifyRuntimeSendMessage(api, message),
      onMessage: api.onMessage,
      onInstalled: api.onInstalled,
      onStartup: api.onStartup,
      getManifest: () => api.getManifest(),
      lastError: api.lastError
    };
  }

  /**
   * Promisify storage get operation
   * @private
   */
  _promisifyStorageGet(storageArea, keys) {
    return new Promise((resolve, reject) => {
      storageArea.get(keys, (result) => {
        if (this._checkRuntimeError()) {
          reject(this._getRuntimeError());
        } else {
          resolve(result);
        }
      });
    });
  }

  /**
   * Promisify storage set operation
   * @private
   */
  _promisifyStorageSet(storageArea, items) {
    return new Promise((resolve, reject) => {
      storageArea.set(items, () => {
        if (this._checkRuntimeError()) {
          reject(this._getRuntimeError());
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Promisify storage remove operation
   * @private
   */
  _promisifyStorageRemove(storageArea, keys) {
    return new Promise((resolve, reject) => {
      storageArea.remove(keys, () => {
        if (this._checkRuntimeError()) {
          reject(this._getRuntimeError());
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Promisify storage clear operation
   * @private
   */
  _promisifyStorageClear(storageArea) {
    return new Promise((resolve, reject) => {
      storageArea.clear(() => {
        if (this._checkRuntimeError()) {
          reject(this._getRuntimeError());
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Promisify tabs query operation
   * @private
   */
  _promisifyTabsQuery(tabsAPI, queryInfo) {
    return new Promise((resolve, reject) => {
      tabsAPI.query(queryInfo, (tabs) => {
        if (this._checkRuntimeError()) {
          reject(this._getRuntimeError());
        } else {
          resolve(tabs);
        }
      });
    });
  }

  /**
   * Promisify tabs sendMessage operation
   * @private
   */
  _promisifyTabsSendMessage(tabsAPI, tabId, message) {
    return new Promise((resolve, reject) => {
      tabsAPI.sendMessage(tabId, message, (response) => {
        if (this._checkRuntimeError()) {
          reject(this._getRuntimeError());
        } else {
          resolve(response);
        }
      });
    });
  }

  /**
   * Promisify runtime sendMessage operation
   * @private
   */
  _promisifyRuntimeSendMessage(runtimeAPI, message) {
    return new Promise((resolve, reject) => {
      runtimeAPI.sendMessage(message, (response) => {
        if (this._checkRuntimeError()) {
          reject(this._getRuntimeError());
        } else {
          resolve(response);
        }
      });
    });
  }

  /**
   * Check for runtime errors
   * @private
   * @returns {boolean} True if error exists
   */
  _checkRuntimeError() {
    return (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.lastError) ||
           (typeof browser !== 'undefined' && browser.runtime && browser.runtime.lastError);
  }

  /**
   * Get runtime error
   * @private
   * @returns {Error} Runtime error
   */
  _getRuntimeError() {
    let errorMessage = 'Unknown runtime error';
    
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.lastError) {
      errorMessage = chrome.runtime.lastError.message;
    } else if (typeof browser !== 'undefined' && browser.runtime && browser.runtime.lastError) {
      errorMessage = browser.runtime.lastError.message;
    }
    
    return new Error(errorMessage);
  }

  /**
   * Get browser type
   * @returns {string} Browser type
   */
  getBrowserType() {
    return this.browserType;
  }

  /**
   * Check if a feature is supported
   * @param {string} feature - Feature to check
   * @returns {boolean} True if supported
   */
  hasFeature(feature) {
    return this.features[feature] === true;
  }

  /**
   * Get API abstraction
   * @param {string} apiName - API name ('storage', 'tabs', 'runtime')
   * @returns {Object|null} API wrapper or null if not available
   */
  getAPI(apiName) {
    return this.apis[apiName] || null;
  }

  /**
   * Get browser-specific configuration
   * @returns {Object} Browser configuration
   */
  getBrowserConfig() {
    const config = {
      browserType: this.browserType,
      features: this.features,
      manifestVersion: 3
    };

    // Browser-specific configurations
    switch (this.browserType) {
      case BROWSER_TYPES.CHROME:
        config.storageAPI = 'chrome.storage';
        config.permissions = ['storage', 'activeTab'];
        config.hostPermissions = ['*://*.bilibili.com/*'];
        break;
        
      case BROWSER_TYPES.EDGE:
        config.storageAPI = 'chrome.storage';
        config.permissions = ['storage', 'activeTab'];
        config.hostPermissions = ['*://*.bilibili.com/*'];
        break;
        
      case BROWSER_TYPES.SAFARI:
        config.storageAPI = 'browser.storage';
        config.permissions = ['storage'];
        config.hostPermissions = ['*://*.bilibili.com/*'];
        break;
        
      case BROWSER_TYPES.FIREFOX:
        config.storageAPI = 'browser.storage';
        config.permissions = ['storage', 'activeTab'];
        config.hostPermissions = ['*://*.bilibili.com/*'];
        break;
        
      default:
        config.storageAPI = 'unknown';
        config.permissions = [];
        config.hostPermissions = [];
    }

    return config;
  }

  /**
   * Log browser compatibility information
   */
  logCompatibilityInfo() {
    console.log('Browser Compatibility Info:', {
      browserType: this.browserType,
      features: this.features,
      availableAPIs: Object.keys(this.apis).filter(api => this.apis[api] !== null)
    });
  }
}

// Create singleton instance
const browserCompatibility = new BrowserCompatibility();

// Export for use in other modules
export { 
  BrowserCompatibility, 
  browserCompatibility, 
  BROWSER_TYPES, 
  BROWSER_FEATURES 
};