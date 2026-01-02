/**
 * Tests for Background Service Worker
 */

// Mock chrome APIs for testing
const mockChrome = {
  storage: {
    sync: {
      get: jest.fn((keys, callback) => {
        setTimeout(() => callback({}), 0);
      }),
      set: jest.fn((data, callback) => {
        setTimeout(() => callback(), 0);
      }),
      onChanged: {
        addListener: jest.fn()
      }
    },
    local: {
      get: jest.fn((keys, callback) => {
        setTimeout(() => callback({}), 0);
      }),
      set: jest.fn((data, callback) => {
        setTimeout(() => callback(), 0);
      }),
      onChanged: {
        addListener: jest.fn()
      }
    },
    onChanged: {
      addListener: jest.fn()
    }
  },
  runtime: {
    onInstalled: {
      addListener: jest.fn()
    },
    onStartup: {
      addListener: jest.fn()
    },
    onMessage: {
      addListener: jest.fn()
    },
    onConnect: {
      addListener: jest.fn()
    },
    getManifest: jest.fn(() => ({ version: '1.0.0' })),
    lastError: null
  },
  tabs: {
    onUpdated: {
      addListener: jest.fn()
    },
    query: jest.fn((queryInfo, callback) => {
      setTimeout(() => callback([]), 0);
    }),
    sendMessage: jest.fn()
  }
};

// Set up global chrome object
global.chrome = mockChrome;

describe('Background Service Worker', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Reset chrome.runtime.lastError
    mockChrome.runtime.lastError = null;
    
    // Mock successful storage operations
    mockChrome.storage.sync.get.mockImplementation((keys, callback) => {
      setTimeout(() => callback({}), 0);
    });
    
    mockChrome.storage.sync.set.mockImplementation((data, callback) => {
      setTimeout(() => callback(), 0);
    });
    
    mockChrome.storage.local.get.mockImplementation((keys, callback) => {
      setTimeout(() => callback({}), 0);
    });
    
    mockChrome.storage.local.set.mockImplementation((data, callback) => {
      setTimeout(() => callback(), 0);
    });
    
    mockChrome.tabs.query.mockImplementation((queryInfo, callback) => {
      setTimeout(() => callback([]), 0);
    });
  });

  test('should initialize background service without errors', () => {
    // Import and initialize the background script
    expect(() => {
      require('./background.js');
    }).not.toThrow();
  });

  test('should set up event listeners during initialization', (done) => {
    // Import the background script
    require('./background.js');
    
    // Give the async initialization time to complete
    setTimeout(() => {
      try {
        // Verify that event listeners are set up
        expect(mockChrome.runtime.onInstalled.addListener).toHaveBeenCalled();
        expect(mockChrome.runtime.onStartup.addListener).toHaveBeenCalled();
        expect(mockChrome.runtime.onMessage.addListener).toHaveBeenCalled();
        expect(mockChrome.runtime.onConnect.addListener).toHaveBeenCalled();
        expect(mockChrome.tabs.onUpdated.addListener).toHaveBeenCalled();
        expect(mockChrome.storage.onChanged.addListener).toHaveBeenCalled();
        done();
      } catch (error) {
        done(error);
      }
    }, 100);
  });

  test('should handle storage operations gracefully', (done) => {
    // Import the background script
    require('./background.js');
    
    // Give the async initialization time to complete
    setTimeout(() => {
      try {
        // Verify storage initialization was attempted
        expect(mockChrome.storage.sync.get).toHaveBeenCalled();
        done();
      } catch (error) {
        done(error);
      }
    }, 100);
  });

  test('should handle storage errors gracefully', () => {
    // Set up storage error
    mockChrome.runtime.lastError = { message: 'Storage error' };
    
    // Import should not throw even with storage errors
    expect(() => {
      require('./background.js');
    }).not.toThrow();
  });
});