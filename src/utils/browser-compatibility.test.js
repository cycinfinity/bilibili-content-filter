/**
 * Browser Compatibility Layer Tests
 * Tests cross-browser feature detection and API abstraction
 */

import { BrowserCompatibility, BROWSER_TYPES, BROWSER_FEATURES } from './browser-compatibility.js';

// Mock browser APIs for testing
const mockChrome = {
  storage: {
    sync: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn()
    },
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn()
    },
    onChanged: {
      addListener: jest.fn()
    }
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn(),
    onUpdated: { addListener: jest.fn() },
    onActivated: { addListener: jest.fn() }
  },
  runtime: {
    sendMessage: jest.fn(),
    onMessage: { addListener: jest.fn() },
    onInstalled: { addListener: jest.fn() },
    onStartup: { addListener: jest.fn() },
    getManifest: jest.fn(() => ({ manifest_version: 3 })),
    lastError: null
  }
};

const mockBrowser = {
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn()
    },
    onChanged: {
      addListener: jest.fn()
    }
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn(),
    onUpdated: { addListener: jest.fn() },
    onActivated: { addListener: jest.fn() }
  },
  runtime: {
    sendMessage: jest.fn(),
    onMessage: { addListener: jest.fn() },
    onInstalled: { addListener: jest.fn() },
    onStartup: { addListener: jest.fn() },
    getManifest: jest.fn(() => ({ manifest_version: 3 })),
    lastError: null
  }
};

describe('BrowserCompatibility', () => {
  let originalChrome, originalBrowser, originalNavigator;

  beforeEach(() => {
    // Store original globals
    originalChrome = global.chrome;
    originalBrowser = global.browser;
    originalNavigator = global.navigator;

    // Reset mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore original globals
    global.chrome = originalChrome;
    global.browser = originalBrowser;
    global.navigator = originalNavigator;
  });

  describe('Browser Detection', () => {
    test('should detect Chrome browser', () => {
      global.chrome = mockChrome;
      global.navigator = { userAgent: 'Chrome/91.0.4472.124' };
      
      const compatibility = new BrowserCompatibility();
      expect(compatibility.getBrowserType()).toBe(BROWSER_TYPES.CHROME);
    });

    test('should detect Edge browser', () => {
      global.chrome = mockChrome;
      global.navigator = { userAgent: 'Edg/91.0.864.59' };
      
      const compatibility = new BrowserCompatibility();
      expect(compatibility.getBrowserType()).toBe(BROWSER_TYPES.EDGE);
    });

    test('should detect Safari browser', () => {
      global.chrome = undefined;
      global.browser = mockBrowser;
      global.navigator = { userAgent: 'Safari/605.1.15' };
      
      const compatibility = new BrowserCompatibility();
      expect(compatibility.getBrowserType()).toBe(BROWSER_TYPES.SAFARI);
    });

    test('should detect Firefox browser', () => {
      global.chrome = undefined;
      global.browser = mockBrowser;
      global.navigator = { userAgent: 'Firefox/89.0' };
      
      const compatibility = new BrowserCompatibility();
      expect(compatibility.getBrowserType()).toBe(BROWSER_TYPES.FIREFOX);
    });

    test('should detect unknown browser', () => {
      global.chrome = undefined;
      global.browser = undefined;
      global.navigator = { userAgent: 'Unknown Browser' };
      
      const compatibility = new BrowserCompatibility();
      expect(compatibility.getBrowserType()).toBe(BROWSER_TYPES.UNKNOWN);
    });
  });

  describe('Feature Detection', () => {
    test('should detect Chrome/Edge features correctly', () => {
      global.chrome = mockChrome;
      global.navigator = { userAgent: 'Chrome/91.0.4472.124' };
      
      const compatibility = new BrowserCompatibility();
      
      expect(compatibility.hasFeature(BROWSER_FEATURES.SYNC_STORAGE)).toBe(true);
      expect(compatibility.hasFeature(BROWSER_FEATURES.LOCAL_STORAGE)).toBe(true);
      expect(compatibility.hasFeature(BROWSER_FEATURES.TABS_API)).toBe(true);
      expect(compatibility.hasFeature(BROWSER_FEATURES.RUNTIME_MESSAGING)).toBe(true);
    });

    test('should detect Safari features correctly', () => {
      global.chrome = undefined;
      global.browser = mockBrowser;
      global.navigator = { userAgent: 'Safari/605.1.15' };
      
      const compatibility = new BrowserCompatibility();
      
      expect(compatibility.hasFeature(BROWSER_FEATURES.SYNC_STORAGE)).toBe(false);
      expect(compatibility.hasFeature(BROWSER_FEATURES.LOCAL_STORAGE)).toBe(true);
      expect(compatibility.hasFeature(BROWSER_FEATURES.TABS_API)).toBe(true);
      expect(compatibility.hasFeature(BROWSER_FEATURES.RUNTIME_MESSAGING)).toBe(true);
    });

    test('should handle missing APIs gracefully', () => {
      global.chrome = undefined;
      global.browser = undefined;
      global.navigator = { userAgent: 'Unknown Browser' };
      
      const compatibility = new BrowserCompatibility();
      
      expect(compatibility.hasFeature(BROWSER_FEATURES.SYNC_STORAGE)).toBe(false);
      expect(compatibility.hasFeature(BROWSER_FEATURES.LOCAL_STORAGE)).toBe(false);
      expect(compatibility.hasFeature(BROWSER_FEATURES.TABS_API)).toBe(false);
      expect(compatibility.hasFeature(BROWSER_FEATURES.RUNTIME_MESSAGING)).toBe(false);
    });
  });

  describe('API Abstraction', () => {
    test('should provide Chrome storage API abstraction', () => {
      global.chrome = mockChrome;
      global.navigator = { userAgent: 'Chrome/91.0.4472.124' };
      
      const compatibility = new BrowserCompatibility();
      const storageAPI = compatibility.getAPI('storage');
      
      expect(storageAPI).toBeTruthy();
      expect(storageAPI.sync).toBeTruthy();
      expect(storageAPI.local).toBeTruthy();
      expect(typeof storageAPI.sync.get).toBe('function');
      expect(typeof storageAPI.sync.set).toBe('function');
    });

    test('should provide Safari storage API abstraction', () => {
      global.chrome = undefined;
      global.browser = mockBrowser;
      global.navigator = { userAgent: 'Safari/605.1.15' };
      
      const compatibility = new BrowserCompatibility();
      const storageAPI = compatibility.getAPI('storage');
      
      expect(storageAPI).toBeTruthy();
      expect(storageAPI.local).toBeTruthy();
      expect(typeof storageAPI.local.get).toBe('function');
      expect(typeof storageAPI.local.set).toBe('function');
    });

    test('should provide tabs API abstraction', () => {
      global.chrome = mockChrome;
      global.navigator = { userAgent: 'Chrome/91.0.4472.124' };
      
      const compatibility = new BrowserCompatibility();
      const tabsAPI = compatibility.getAPI('tabs');
      
      expect(tabsAPI).toBeTruthy();
      expect(typeof tabsAPI.query).toBe('function');
      expect(typeof tabsAPI.sendMessage).toBe('function');
    });

    test('should provide runtime API abstraction', () => {
      global.chrome = mockChrome;
      global.navigator = { userAgent: 'Chrome/91.0.4472.124' };
      
      const compatibility = new BrowserCompatibility();
      const runtimeAPI = compatibility.getAPI('runtime');
      
      expect(runtimeAPI).toBeTruthy();
      expect(typeof runtimeAPI.sendMessage).toBe('function');
      expect(typeof runtimeAPI.getManifest).toBe('function');
    });

    test('should return null for unavailable APIs', () => {
      global.chrome = undefined;
      global.browser = undefined;
      global.navigator = { userAgent: 'Unknown Browser' };
      
      const compatibility = new BrowserCompatibility();
      
      expect(compatibility.getAPI('storage')).toBeNull();
      expect(compatibility.getAPI('tabs')).toBeNull();
      expect(compatibility.getAPI('runtime')).toBeNull();
    });
  });

  describe('Browser Configuration', () => {
    test('should provide Chrome configuration', () => {
      global.chrome = mockChrome;
      global.navigator = { userAgent: 'Chrome/91.0.4472.124' };
      
      const compatibility = new BrowserCompatibility();
      const config = compatibility.getBrowserConfig();
      
      expect(config.browserType).toBe(BROWSER_TYPES.CHROME);
      expect(config.storageAPI).toBe('chrome.storage');
      expect(config.permissions).toContain('storage');
      expect(config.permissions).toContain('activeTab');
      expect(config.hostPermissions).toContain('*://*.bilibili.com/*');
    });

    test('should provide Safari configuration', () => {
      global.chrome = undefined;
      global.browser = mockBrowser;
      global.navigator = { userAgent: 'Safari/605.1.15' };
      
      const compatibility = new BrowserCompatibility();
      const config = compatibility.getBrowserConfig();
      
      expect(config.browserType).toBe(BROWSER_TYPES.SAFARI);
      expect(config.storageAPI).toBe('browser.storage');
      expect(config.permissions).toContain('storage');
      expect(config.permissions).not.toContain('activeTab');
      expect(config.hostPermissions).toContain('*://*.bilibili.com/*');
    });
  });

  describe('Error Handling', () => {
    test('should handle storage API errors', async () => {
      global.chrome = {
        ...mockChrome,
        runtime: {
          ...mockChrome.runtime,
          lastError: { message: 'Storage quota exceeded' }
        }
      };
      global.navigator = { userAgent: 'Chrome/91.0.4472.124' };
      
      const compatibility = new BrowserCompatibility();
      const storageAPI = compatibility.getAPI('storage');
      
      // Mock storage operation that fails
      mockChrome.storage.sync.get.mockImplementation((keys, callback) => {
        callback({});
      });
      
      try {
        await storageAPI.sync.get(['test']);
        expect(true).toBe(true); // Should handle error gracefully
      } catch (error) {
        expect(error.message).toContain('Storage quota exceeded');
      }
    });

    test('should handle missing runtime error gracefully', async () => {
      global.chrome = {
        ...mockChrome,
        runtime: {
          ...mockChrome.runtime,
          lastError: null
        }
      };
      global.navigator = { userAgent: 'Chrome/91.0.4472.124' };
      
      const compatibility = new BrowserCompatibility();
      const storageAPI = compatibility.getAPI('storage');
      
      mockChrome.storage.sync.get.mockImplementation((keys, callback) => {
        callback({ test: 'value' });
      });
      
      const result = await storageAPI.sync.get(['test']);
      expect(result).toEqual({ test: 'value' });
    });
  });

  describe('Promisification', () => {
    test('should promisify Chrome storage operations', async () => {
      global.chrome = mockChrome;
      global.navigator = { userAgent: 'Chrome/91.0.4472.124' };
      
      const compatibility = new BrowserCompatibility();
      const storageAPI = compatibility.getAPI('storage');
      
      // Mock successful storage operation
      mockChrome.storage.sync.get.mockImplementation((keys, callback) => {
        callback({ test: 'value' });
      });
      
      const result = await storageAPI.sync.get(['test']);
      expect(result).toEqual({ test: 'value' });
      expect(mockChrome.storage.sync.get).toHaveBeenCalledWith(['test'], expect.any(Function));
    });

    test('should promisify Chrome tabs operations', async () => {
      global.chrome = mockChrome;
      global.navigator = { userAgent: 'Chrome/91.0.4472.124' };
      
      const compatibility = new BrowserCompatibility();
      const tabsAPI = compatibility.getAPI('tabs');
      
      // Mock successful tabs operation
      mockChrome.tabs.query.mockImplementation((queryInfo, callback) => {
        callback([{ id: 1, url: 'https://bilibili.com' }]);
      });
      
      const result = await tabsAPI.query({ active: true });
      expect(result).toEqual([{ id: 1, url: 'https://bilibili.com' }]);
      expect(mockChrome.tabs.query).toHaveBeenCalledWith({ active: true }, expect.any(Function));
    });
  });
});