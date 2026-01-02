/**
 * Tests for Error Handler and Logging System
 */

// Mock dependencies
const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  critical: jest.fn()
};

// Mock the logger import
jest.mock('./logger.js', () => ({
  logger: mockLogger,
  LOG_CATEGORIES: {
    SYSTEM: 'system',
    STORAGE: 'storage',
    DOM: 'dom',
    FILTERING: 'filtering'
  }
}));

// Import after mocking
const { ErrorHandler, ERROR_LEVELS, ERROR_CATEGORIES, RECOVERY_STRATEGIES } = require('./error-handler.js');

describe('ErrorHandler', () => {
  let errorHandler;

  beforeEach(() => {
    errorHandler = new ErrorHandler();
    jest.clearAllMocks();
    
    // Mock window for browser environment
    global.window = {
      addEventListener: jest.fn(),
      postMessage: jest.fn(),
      bilibiliFilterController: {
        initialize: jest.fn()
      }
    };
  });

  afterEach(() => {
    delete global.window;
  });

  describe('Error Normalization', () => {
    test('should normalize Error objects correctly', () => {
      const error = new Error('Test error');
      const normalized = errorHandler.normalizeError(error);

      expect(normalized).toHaveProperty('message', 'Test error');
      expect(normalized).toHaveProperty('stack');
      expect(normalized).toHaveProperty('name', 'Error');
      expect(normalized).toHaveProperty('timestamp');
      expect(typeof normalized.timestamp).toBe('number');
    });

    test('should normalize string errors correctly', () => {
      const error = 'String error message';
      const normalized = errorHandler.normalizeError(error);

      expect(normalized).toHaveProperty('message', 'String error message');
      expect(normalized).toHaveProperty('stack');
      expect(normalized).toHaveProperty('name', 'StringError');
      expect(normalized).toHaveProperty('timestamp');
    });

    test('should handle unknown error types', () => {
      const error = { unknown: 'object' };
      const normalized = errorHandler.normalizeError(error);

      expect(normalized).toHaveProperty('message', 'Unknown error occurred');
      expect(normalized).toHaveProperty('name', 'UnknownError');
      expect(normalized).toHaveProperty('originalError', error);
    });
  });

  describe('Error Handling', () => {
    test('should handle basic error correctly', () => {
      const error = new Error('Test error');
      
      errorHandler.handleError(error, {
        category: ERROR_CATEGORIES.STORAGE,
        level: ERROR_LEVELS.ERROR,
        context: 'test_context'
      });

      expect(errorHandler.logs).toHaveLength(1);
      expect(errorHandler.logs[0]).toMatchObject({
        level: ERROR_LEVELS.ERROR,
        category: ERROR_CATEGORIES.STORAGE,
        context: 'test_context',
        message: 'Test error'
      });
    });

    test('should suppress duplicate errors', () => {
      const error = new Error('Duplicate error');
      const options = {
        category: ERROR_CATEGORIES.DOM_MANIPULATION,
        level: ERROR_LEVELS.WARN,
        context: 'duplicate_test',
        suppressDuplicates: true
      };

      // First occurrence should be logged
      errorHandler.handleError(error, options);
      expect(errorHandler.logs).toHaveLength(1);

      // Simulate multiple occurrences to trigger suppression
      for (let i = 0; i < 6; i++) {
        errorHandler.handleError(error, options);
      }

      // Should not have more than 6 logs (1 + 5 before suppression)
      expect(errorHandler.logs.length).toBeLessThanOrEqual(6);
    });

    test('should attempt recovery for non-ignore strategies', async () => {
      const error = new Error('Recovery test error');
      const spy = jest.spyOn(errorHandler, 'attemptRecovery');

      errorHandler.handleError(error, {
        category: ERROR_CATEGORIES.INITIALIZATION,
        level: ERROR_LEVELS.ERROR,
        context: 'recovery_test',
        recoveryStrategy: RECOVERY_STRATEGIES.RETRY
      });

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Recovery test error' }),
        expect.objectContaining({
          strategy: RECOVERY_STRATEGIES.RETRY,
          context: 'recovery_test'
        })
      );

      spy.mockRestore();
    });
  });

  describe('Recovery Strategies', () => {
    test('should handle retry recovery strategy', async () => {
      const error = new Error('Retry test');
      
      await errorHandler.attemptRecovery(errorHandler.normalizeError(error), {
        strategy: RECOVERY_STRATEGIES.RETRY,
        context: 'initialization',
        maxRetries: 3,
        category: ERROR_CATEGORIES.INITIALIZATION
      });

      // Should have logged the retry attempt
      expect(errorHandler.logs.some(log => 
        log.message.includes('Retrying operation')
      )).toBe(true);
    });

    test('should handle fallback recovery strategy', async () => {
      const error = new Error('Fallback test');
      
      await errorHandler.attemptRecovery(errorHandler.normalizeError(error), {
        strategy: RECOVERY_STRATEGIES.FALLBACK,
        context: 'storage',
        maxRetries: 3,
        category: ERROR_CATEGORIES.STORAGE
      });

      // Should have logged the fallback attempt
      expect(errorHandler.logs.some(log => 
        log.message.includes('Performing fallback')
      )).toBe(true);
    });

    test('should handle graceful degradation strategy', async () => {
      const error = new Error('Degradation test');
      
      await errorHandler.attemptRecovery(errorHandler.normalizeError(error), {
        strategy: RECOVERY_STRATEGIES.GRACEFUL_DEGRADATION,
        context: 'filter',
        maxRetries: 3,
        category: ERROR_CATEGORIES.DOM_MANIPULATION
      });

      // Should have logged the degradation attempt
      expect(errorHandler.logs.some(log => 
        log.message.includes('Graceful degradation')
      )).toBe(true);
    });

    test('should respect max retry attempts', async () => {
      const error = new Error('Max retry test');
      const recoveryKey = 'test_context:retry';
      
      // Set recovery attempts to max
      errorHandler.recoveryAttempts.set(recoveryKey, 3);
      
      await errorHandler.attemptRecovery(errorHandler.normalizeError(error), {
        strategy: RECOVERY_STRATEGIES.RETRY,
        context: 'test_context',
        maxRetries: 3,
        category: ERROR_CATEGORIES.INITIALIZATION
      });

      // Should have logged max attempts exceeded
      expect(errorHandler.logs.some(log => 
        log.message.includes('Max recovery attempts exceeded')
      )).toBe(true);
    });
  });

  describe('Error Statistics', () => {
    test('should provide accurate error statistics', () => {
      // Add some test errors
      errorHandler.handleError(new Error('Error 1'), {
        category: ERROR_CATEGORIES.STORAGE,
        level: ERROR_LEVELS.ERROR,
        context: 'test1'
      });

      errorHandler.handleError(new Error('Error 2'), {
        category: ERROR_CATEGORIES.DOM_MANIPULATION,
        level: ERROR_LEVELS.WARN,
        context: 'test2'
      });

      errorHandler.handleError(new Error('Error 3'), {
        category: ERROR_CATEGORIES.STORAGE,
        level: ERROR_LEVELS.CRITICAL,
        context: 'test3'
      });

      const stats = errorHandler.getErrorStats();

      expect(stats.totalLogs).toBe(3);
      expect(stats.errorsByLevel[ERROR_LEVELS.ERROR]).toBe(1);
      expect(stats.errorsByLevel[ERROR_LEVELS.WARN]).toBe(1);
      expect(stats.errorsByLevel[ERROR_LEVELS.CRITICAL]).toBe(1);
      expect(stats.errorsByCategory[ERROR_CATEGORIES.STORAGE]).toBe(2);
      expect(stats.errorsByCategory[ERROR_CATEGORIES.DOM_MANIPULATION]).toBe(1);
    });

    test('should export logs correctly', () => {
      errorHandler.handleError(new Error('Export test'), {
        category: ERROR_CATEGORIES.SYSTEM,
        level: ERROR_LEVELS.INFO,
        context: 'export_test'
      });

      const exportedLogs = errorHandler.exportLogs();
      expect(Array.isArray(exportedLogs)).toBe(true);
      expect(exportedLogs).toHaveLength(1);
      expect(exportedLogs[0]).toMatchObject({
        message: 'Export test',
        category: ERROR_CATEGORIES.SYSTEM,
        level: ERROR_LEVELS.INFO
      });
    });

    test('should clear logs and reset state', () => {
      // Add some data
      errorHandler.handleError(new Error('Clear test'), {
        category: ERROR_CATEGORIES.SYSTEM,
        level: ERROR_LEVELS.INFO,
        context: 'clear_test'
      });

      errorHandler.errorCounts.set('test', 5);
      errorHandler.suppressedErrors.add('test');
      errorHandler.recoveryAttempts.set('test', 2);

      // Clear everything
      errorHandler.clearLogs();

      expect(errorHandler.logs).toHaveLength(0);
      expect(errorHandler.errorCounts.size).toBe(0);
      expect(errorHandler.suppressedErrors.size).toBe(0);
      expect(errorHandler.recoveryAttempts.size).toBe(0);
    });
  });

  describe('User Messages', () => {
    test('should show user messages for appropriate error levels', () => {
      const showUserMessageSpy = jest.spyOn(errorHandler, 'showUserMessage');

      errorHandler.handleError(new Error('Critical error'), {
        category: ERROR_CATEGORIES.INITIALIZATION,
        level: ERROR_LEVELS.CRITICAL,
        context: 'critical_test'
      });

      expect(showUserMessageSpy).toHaveBeenCalled();
      showUserMessageSpy.mockRestore();
    });

    test('should get appropriate user messages for categories', () => {
      expect(errorHandler.getUserMessage(ERROR_CATEGORIES.STORAGE))
        .toContain('Settings could not be saved');
      
      expect(errorHandler.getUserMessage(ERROR_CATEGORIES.DOM_MANIPULATION))
        .toContain('content filters may not work');
      
      expect(errorHandler.getUserMessage(ERROR_CATEGORIES.INITIALIZATION))
        .toContain('Extension failed to start');
    });
  });

  describe('Cleanup', () => {
    test('should clean up old logs', () => {
      // Add old log
      const oldLog = {
        timestamp: Date.now() - (10 * 60 * 1000), // 10 minutes ago
        level: ERROR_LEVELS.INFO,
        category: ERROR_CATEGORIES.SYSTEM,
        context: 'old_test',
        message: 'Old log'
      };

      // Add recent log
      const recentLog = {
        timestamp: Date.now(),
        level: ERROR_LEVELS.INFO,
        category: ERROR_CATEGORIES.SYSTEM,
        context: 'recent_test',
        message: 'Recent log'
      };

      errorHandler.logs.push(oldLog, recentLog);

      errorHandler.cleanupOldLogs();

      // Should only keep recent log
      expect(errorHandler.logs).toHaveLength(1);
      expect(errorHandler.logs[0].message).toBe('Recent log');
    });

    test('should clean up error counts and suppressed errors', () => {
      errorHandler.errorCounts.set('test1', 5);
      errorHandler.errorCounts.set('test2', 3);
      errorHandler.suppressedErrors.add('test1');

      errorHandler.cleanupErrorCounts();

      expect(errorHandler.errorCounts.size).toBe(0);
      expect(errorHandler.suppressedErrors.size).toBe(0);
    });
  });
});

// Test constants and exports
describe('Error Handler Constants', () => {
  test('should export all required constants', () => {
    expect(ERROR_LEVELS).toBeDefined();
    expect(ERROR_CATEGORIES).toBeDefined();
    expect(RECOVERY_STRATEGIES).toBeDefined();
    
    expect(ERROR_LEVELS.DEBUG).toBe('debug');
    expect(ERROR_LEVELS.INFO).toBe('info');
    expect(ERROR_LEVELS.WARN).toBe('warn');
    expect(ERROR_LEVELS.ERROR).toBe('error');
    expect(ERROR_LEVELS.CRITICAL).toBe('critical');
    
    expect(ERROR_CATEGORIES.STORAGE).toBe('storage');
    expect(ERROR_CATEGORIES.DOM_MANIPULATION).toBe('dom_manipulation');
    expect(ERROR_CATEGORIES.INITIALIZATION).toBe('initialization');
    
    expect(RECOVERY_STRATEGIES.RETRY).toBe('retry');
    expect(RECOVERY_STRATEGIES.FALLBACK).toBe('fallback');
    expect(RECOVERY_STRATEGIES.GRACEFUL_DEGRADATION).toBe('graceful_degradation');
  });
});