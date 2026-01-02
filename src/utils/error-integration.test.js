/**
 * Integration tests for Error Handling and Logging System
 * Tests the integration with existing extension components
 */

// Mock the filter manager
const mockFilterManager = {
  initialize: jest.fn(),
  applyFilter: jest.fn(() => true),
  removeFilter: jest.fn(),
  getFilterStatus: jest.fn(() => ({})),
  observer: { disconnect: jest.fn() }
};

// Mock graceful degradation manager
const mockGracefulDegradationManager = {
  applyGracefulFiltering: jest.fn(() => true),
  getStatus: jest.fn(() => ({
    pageType: 'HOME',
    confidenceLevel: 'high',
    fallbackStrategy: 'standard_filtering'
  }))
};

// Mock the imports
jest.mock('../content/filter.js', () => ({
  filterManager: mockFilterManager
}));

jest.mock('./graceful-degradation.js', () => ({
  gracefulDegradationManager: mockGracefulDegradationManager
}));

// Import the modules after mocking
const { errorHandler, ERROR_CATEGORIES, RECOVERY_STRATEGIES } = require('./error-handler.js');
const { logger, LOG_CATEGORIES } = require('./logger.js');

describe('Error Handling Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup DOM environment
    global.window = {
      location: { 
        hostname: 'www.bilibili.com',
        href: 'https://www.bilibili.com'
      },
      addEventListener: jest.fn(),
      postMessage: jest.fn(),
      bilibiliFilterController: {
        initialize: jest.fn()
      }
    };
    
    global.document = {
      readyState: 'complete',
      body: document.createElement('body'),
      querySelector: jest.fn(),
      querySelectorAll: jest.fn(() => []),
      addEventListener: jest.fn()
    };
    
    // Mock browser APIs
    global.chrome = {
      storage: {
        sync: {
          get: jest.fn((keys, callback) => callback({ bilibiliFilterSettings: null })),
          set: jest.fn((data, callback) => callback && callback())
        }
      },
      runtime: {
        lastError: null
      }
    };
  });

  afterEach(() => {
    delete global.window;
    delete global.document;
    delete global.chrome;
    
    // Clear error handler state
    errorHandler.clearLogs();
  });

  describe('Storage Error Handling', () => {
    test('should handle storage unavailable gracefully', async () => {
      // Simulate storage error
      global.chrome.storage.sync.get = jest.fn((keys, callback) => {
        global.chrome.runtime.lastError = { message: 'Storage unavailable' };
        callback({});
      });

      // Simulate a storage operation that would fail
      const error = new Error('Storage unavailable');
      errorHandler.handleError(error, {
        category: ERROR_CATEGORIES.STORAGE,
        context: 'test_storage_error',
        recoveryStrategy: RECOVERY_STRATEGIES.FALLBACK
      });

      // Should have logged the error
      expect(errorHandler.logs.length).toBeGreaterThan(0);
      const storageError = errorHandler.logs.find(log => 
        log.category === ERROR_CATEGORIES.STORAGE
      );
      expect(storageError).toBeDefined();
      expect(storageError.message).toContain('Storage unavailable');

      // Should have attempted recovery
      const recoveryLog = errorHandler.logs.find(log => 
        log.message.includes('Performing fallback')
      );
      expect(recoveryLog).toBeDefined();
    });

    test('should enable session-only mode when storage fails', async () => {
      const error = new Error('Storage quota exceeded');
      
      await errorHandler.attemptRecovery(errorHandler.normalizeError(error), {
        strategy: RECOVERY_STRATEGIES.FALLBACK,
        context: 'storage',
        maxRetries: 3,
        category: ERROR_CATEGORIES.STORAGE
      });

      // Should have enabled session-only mode
      expect(global.window.bilibiliFilterSessionOnly).toBe(true);
    });
  });

  describe('DOM Manipulation Error Handling', () => {
    test('should handle DOM manipulation failures gracefully', () => {
      // Simulate DOM manipulation error
      const error = new Error('Cannot read property of null');
      
      errorHandler.handleError(error, {
        category: ERROR_CATEGORIES.DOM_MANIPULATION,
        context: 'apply_filter_test',
        recoveryStrategy: RECOVERY_STRATEGIES.GRACEFUL_DEGRADATION
      });

      // Should have logged the error
      const domError = errorHandler.logs.find(log => 
        log.category === ERROR_CATEGORIES.DOM_MANIPULATION
      );
      expect(domError).toBeDefined();

      // Should have attempted graceful degradation
      const degradationLog = errorHandler.logs.find(log => 
        log.message.includes('Graceful degradation')
      );
      expect(degradationLog).toBeDefined();
    });

    test('should enable simplified filtering when DOM manipulation fails', async () => {
      const error = new Error('DOM manipulation failed');
      
      await errorHandler.attemptRecovery(errorHandler.normalizeError(error), {
        strategy: RECOVERY_STRATEGIES.GRACEFUL_DEGRADATION,
        context: 'dom',
        maxRetries: 3,
        category: ERROR_CATEGORIES.DOM_MANIPULATION
      });

      // Should have enabled simplified filtering
      expect(global.window.bilibiliFilterSimplified).toBe(true);
    });
  });

  describe('Initialization Error Handling', () => {
    test('should handle initialization failures with retry', async () => {
      const error = new Error('Initialization failed');
      
      errorHandler.handleError(error, {
        category: ERROR_CATEGORIES.INITIALIZATION,
        context: 'content_script_init',
        recoveryStrategy: RECOVERY_STRATEGIES.RETRY
      });

      // Should have logged the error
      const initError = errorHandler.logs.find(log => 
        log.category === ERROR_CATEGORIES.INITIALIZATION
      );
      expect(initError).toBeDefined();
    });

    test('should trigger re-initialization on retry', async () => {
      const error = new Error('Init retry test');
      
      await errorHandler.attemptRecovery(errorHandler.normalizeError(error), {
        strategy: RECOVERY_STRATEGIES.RETRY,
        context: 'initialization',
        maxRetries: 3,
        category: ERROR_CATEGORIES.INITIALIZATION
      });

      // Should have attempted to reinitialize
      expect(global.window.bilibiliFilterController.initialize).toHaveBeenCalled();
    });
  });

  describe('Filter Application Error Handling', () => {
    test('should fall back to graceful degradation when filter application fails', () => {
      // Mock filter manager to fail
      mockFilterManager.applyFilter.mockReturnValue(false);

      const error = new Error('Filter application failed');
      
      errorHandler.handleError(error, {
        category: ERROR_CATEGORIES.DOM_MANIPULATION,
        context: 'apply_filter_comments',
        recoveryStrategy: RECOVERY_STRATEGIES.GRACEFUL_DEGRADATION
      });

      // Should have logged the error
      const filterError = errorHandler.logs.find(log => 
        log.context === 'apply_filter_comments'
      );
      expect(filterError).toBeDefined();
    });

    test('should disable problematic filters when degradation is needed', async () => {
      const error = new Error('Filter degradation test');
      
      await errorHandler.attemptRecovery(errorHandler.normalizeError(error), {
        strategy: RECOVERY_STRATEGIES.GRACEFUL_DEGRADATION,
        context: 'filter',
        maxRetries: 3,
        category: ERROR_CATEGORIES.DOM_MANIPULATION
      });

      // Should have enabled basic-only mode
      expect(global.window.bilibiliFilterBasicOnly).toBe(true);
    });
  });

  describe('Browser Compatibility Error Handling', () => {
    test('should handle browser API unavailability', () => {
      // Remove chrome API to simulate incompatible browser
      delete global.chrome;

      const error = new Error('chrome is not defined');
      
      errorHandler.handleError(error, {
        category: ERROR_CATEGORIES.BROWSER_COMPATIBILITY,
        context: 'browser_api_access',
        recoveryStrategy: RECOVERY_STRATEGIES.GRACEFUL_DEGRADATION
      });

      // Should have logged the compatibility error
      const compatError = errorHandler.logs.find(log => 
        log.category === ERROR_CATEGORIES.BROWSER_COMPATIBILITY
      );
      expect(compatError).toBeDefined();
    });

    test('should enable compatibility mode for browser issues', async () => {
      const error = new Error('Browser compatibility issue');
      
      await errorHandler.attemptRecovery(errorHandler.normalizeError(error), {
        strategy: RECOVERY_STRATEGIES.GRACEFUL_DEGRADATION,
        context: 'browser_api',
        maxRetries: 3,
        category: ERROR_CATEGORIES.BROWSER_COMPATIBILITY
      });

      // Should have enabled compatibility mode
      expect(global.window.bilibiliFilterCompatibilityMode).toBe(true);
    });
  });

  describe('Error Suppression and Rate Limiting', () => {
    test('should suppress repeated errors', () => {
      const error = new Error('Repeated error');
      const options = {
        category: ERROR_CATEGORIES.DOM_MANIPULATION,
        context: 'repeated_test',
        recoveryStrategy: RECOVERY_STRATEGIES.IGNORE,
        suppressDuplicates: true
      };

      // Generate multiple identical errors
      for (let i = 0; i < 10; i++) {
        errorHandler.handleError(error, options);
      }

      // Should not have logged all 10 errors due to suppression
      const repeatedErrors = errorHandler.logs.filter(log => 
        log.message === 'Repeated error'
      );
      expect(repeatedErrors.length).toBeLessThan(10);
    });

    test('should respect max recovery attempts', async () => {
      const error = new Error('Max attempts test');
      const recoveryOptions = {
        strategy: RECOVERY_STRATEGIES.RETRY,
        context: 'max_attempts_test',
        maxRetries: 2,
        category: ERROR_CATEGORIES.INITIALIZATION
      };

      // Set recovery attempts to max
      errorHandler.recoveryAttempts.set('max_attempts_test:retry', 2);

      await errorHandler.attemptRecovery(errorHandler.normalizeError(error), recoveryOptions);

      // Should have logged max attempts exceeded
      const maxAttemptsLog = errorHandler.logs.find(log => 
        log.message.includes('Max recovery attempts exceeded')
      );
      expect(maxAttemptsLog).toBeDefined();
    });
  });

  describe('Logging Integration', () => {
    test('should log errors through logger system', () => {
      const initialLogCount = logger.logs.length;
      
      logger.error(LOG_CATEGORIES.STORAGE, 'Test error message', { test: 'data' });

      expect(logger.logs.length).toBe(initialLogCount + 1);
      const logEntry = logger.logs[logger.logs.length - 1];
      expect(logEntry).toMatchObject({
        level: 'ERROR',
        category: LOG_CATEGORIES.STORAGE,
        message: 'Test error message',
        data: { test: 'data' }
      });
    });

    test('should integrate logger with error handler', () => {
      const initialErrorCount = errorHandler.logs.length;
      
      logger.critical(LOG_CATEGORIES.INITIALIZATION, 'Critical system error');

      // Should have logged to both systems
      expect(logger.logs.length).toBeGreaterThan(0);
      expect(errorHandler.logs.length).toBeGreaterThan(initialErrorCount);
    });
  });

  describe('User Message Integration', () => {
    test('should show user messages for critical errors', () => {
      const error = new Error('Critical user-facing error');
      
      errorHandler.handleError(error, {
        category: ERROR_CATEGORIES.INITIALIZATION,
        level: 'critical',
        context: 'user_message_test',
        userMessage: 'Extension failed to start properly'
      });

      // Should have stored the error for user display
      expect(global.window.bilibiliFilterLastError).toBeDefined();
      expect(global.window.bilibiliFilterLastError.message).toContain('Extension failed to start properly');
    });

    test('should post messages for UI integration', () => {
      const error = new Error('UI integration test');
      
      errorHandler.showUserMessage('Test user message', 'error');

      expect(global.window.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'BILIBILI_FILTER_ERROR',
          message: 'Test user message',
          level: 'error'
        }),
        '*'
      );
    });
  });

  describe('Health Check Integration', () => {
    test('should detect and recover from corrupted filter manager', () => {
      // Simulate corrupted filter manager
      mockFilterManager.getFilterStatus = undefined;

      const error = new Error('Filter manager corrupted');
      
      errorHandler.handleError(error, {
        category: ERROR_CATEGORIES.INITIALIZATION,
        context: 'health_check_test',
        recoveryStrategy: RECOVERY_STRATEGIES.RETRY
      });

      // Should have logged the corruption detection
      const corruptionLog = errorHandler.logs.find(log => 
        log.message.includes('corrupted') || log.context.includes('health_check')
      );
      expect(corruptionLog).toBeDefined();
    });
  });
});

describe('Error Handler Performance', () => {
  test('should handle high volume of errors efficiently', () => {
    const startTime = Date.now();
    
    // Generate many errors
    for (let i = 0; i < 1000; i++) {
      errorHandler.handleError(new Error(`Error ${i}`), {
        category: ERROR_CATEGORIES.PERFORMANCE,
        context: 'performance_test',
        recoveryStrategy: RECOVERY_STRATEGIES.IGNORE
      });
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Should complete within reasonable time (less than 1 second)
    expect(duration).toBeLessThan(1000);
    
    // Should respect max log entries
    expect(errorHandler.logs.length).toBeLessThanOrEqual(errorHandler.maxLogEntries);
  });

  test('should clean up resources periodically', () => {
    // Add old data
    errorHandler.errorCounts.set('old_error', 5);
    errorHandler.suppressedErrors.add('old_error');
    errorHandler.recoveryAttempts.set('old_recovery', 2);

    // Trigger cleanup
    errorHandler.cleanupErrorCounts();
    errorHandler.cleanupRecoveryAttempts();

    expect(errorHandler.errorCounts.size).toBe(0);
    expect(errorHandler.suppressedErrors.size).toBe(0);
    expect(errorHandler.recoveryAttempts.size).toBe(0);
  });
});