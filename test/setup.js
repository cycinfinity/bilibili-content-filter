// Jest setup file for browser extension testing

// Mock browser APIs with proper callback-based implementations
global.chrome = {
  storage: {
    sync: {
      get: jest.fn((keys, callback) => {
        // Default empty response
        setTimeout(() => callback({}), 0);
      }),
      set: jest.fn((data, callback) => {
        setTimeout(() => callback(), 0);
      }),
      remove: jest.fn((keys, callback) => {
        setTimeout(() => callback(), 0);
      }),
      clear: jest.fn((callback) => {
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
      remove: jest.fn((keys, callback) => {
        setTimeout(() => callback(), 0);
      }),
      clear: jest.fn((callback) => {
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
  tabs: {
    query: jest.fn((queryInfo, callback) => {
      setTimeout(() => callback([]), 0);
    }),
    sendMessage: jest.fn()
  },
  runtime: {
    onMessage: {
      addListener: jest.fn()
    },
    onInstalled: {
      addListener: jest.fn()
    },
    onStartup: {
      addListener: jest.fn()
    },
    onConnect: {
      addListener: jest.fn()
    },
    sendMessage: jest.fn(),
    getManifest: jest.fn(() => ({ version: '1.0.0' })),
    lastError: null
  }
};

// Mock browser API for Safari compatibility
global.browser = {
  storage: {
    local: {
      get: jest.fn((keys) => Promise.resolve({})),
      set: jest.fn((data) => Promise.resolve()),
      remove: jest.fn((keys) => Promise.resolve()),
      clear: jest.fn(() => Promise.resolve())
    },
    onChanged: {
      addListener: jest.fn()
    }
  },
  tabs: {
    query: jest.fn((queryInfo) => Promise.resolve([])),
    sendMessage: jest.fn()
  },
  runtime: {
    onMessage: {
      addListener: jest.fn()
    },
    onInstalled: {
      addListener: jest.fn()
    },
    onStartup: {
      addListener: jest.fn()
    },
    sendMessage: jest.fn(),
    getManifest: jest.fn(() => ({ version: '1.0.0' }))
  }
};

// Mock DOM APIs that might not be available in jsdom
Object.defineProperty(window, 'MutationObserver', {
  writable: true,
  value: jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    disconnect: jest.fn(),
    takeRecords: jest.fn()
  }))
});

// Mock window.location properly
Object.defineProperty(window, 'location', {
  writable: true,
  value: {
    href: 'https://www.bilibili.com',
    hostname: 'www.bilibili.com',
    pathname: '/',
    search: '',
    hash: ''
  }
});

// Mock navigator
Object.defineProperty(window, 'navigator', {
  writable: true,
  value: {
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  }
});

// Mock console methods to avoid noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};