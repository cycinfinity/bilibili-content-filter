/**
 * Tests for Logger System
 */

// Mock the error handler to avoid circular dependency
const mockErrorHandler = {
  handleError: jest.fn()
};

jest.mock('./error-handler.js', () => ({
  errorHandler: mockErrorHandler,
  ERROR_LEVELS: {
    DEBUG: 'debug',
    INFO: 'info',
    WARN: 'warn',
    ERROR: 'error',
    CRITICAL: 'critical'
  },
  ERROR_CATEGORIES: {
    STORAGE: 'storage',
    DOM_MANIPULATION: 'dom_manipulation',
    INITIALIZATION: 'initialization'
  }
}));

const { Logger, LOG_LEVELS, LOG_CATEGORIES } = require('./logger.js');

describe('Logger', () => {
  let logger;

  beforeEach(() => {
    logger = new Logger({
      enableConsoleOutput: false, // Disable console output for tests
      persistLogs: false // Disable storage for tests
    });
    
    jest.clearAllMocks();
    
    // Mock browser storage
    global.chrome = {
      storage: {
        local: {
          get: jest.fn((keys, callback) => callback({})),
          set: jest.fn((data, callback) => callback && callback())
        }
      },
      runtime: {
        lastError: null
      }
    };
  });

  afterEach(() => {
    delete global.chrome;
  });

  describe('Initialization', () => {
    test('should initialize with default configuration', () => {
      const defaultLogger = new Logger();
      
      expect(defaultLogger.config.minLevel).toBe(LOG_LEVELS.INFO.value);
      expect(defaultLogger.config.maxLogEntries).toBe(1000);
      expect(defaultLogger.config.enableConsoleOutput).toBe(true);
      expect(defaultLogger.logs).toEqual([]);
    });

    test('should initialize with custom configuration', () => {
      const customLogger = new Logger({
        minLevel: LOG_LEVELS.ERROR.value,
        maxLogEntries: 500,
        enableConsoleOutput: false
      });
      
      expect(customLogger.config.minLevel).toBe(LOG_LEVELS.ERROR.value);
      expect(customLogger.config.maxLogEntries).toBe(500);
      expect(customLogger.config.enableConsoleOutput).toBe(false);
    });

    test('should detect execution context', () => {
      // Mock different contexts
      global.window = { location: { href: 'https://www.bilibili.com' } };
      const contentLogger = new Logger();
      expect(contentLogger.context).toBe('content_script');
      
      global.window.location.href = 'chrome-extension://test/popup.html';
      const popupLogger = new Logger();
      expect(popupLogger.context).toBe('popup');
      
      delete global.window;
      const backgroundLogger = new Logger();
      expect(backgroundLogger.context).toBe('background');
    });
  });

  describe('Log Entry Creation', () => {
    test('should create log entry with correct structure', () => {
      const entry = logger.createLogEntry('INFO', LOG_CATEGORIES.SYSTEM, 'Test message', { test: 'data' });
      
      expect(entry).toHaveProperty('id');
      expect(entry).toHaveProperty('timestamp');
      expect(entry).toHaveProperty('sessionId');
      expect(entry).toHaveProperty('context');
      expect(entry).toHaveProperty('level', 'INFO');
      expect(entry).toHaveProperty('levelValue', LOG_LEVELS.INFO.value);
      expect(entry).toHaveProperty('category', LOG_CATEGORIES.SYSTEM);
      expect(entry).toHaveProperty('message', 'Test message');
      expect(entry).toHaveProperty('data', { test: 'data' });
      expect(typeof entry.timestamp).toBe('number');
      expect(typeof entry.id).toBe('string');
    });

    test('should include stack trace when requested', () => {
      const entry = logger.createLogEntry('ERROR', LOG_CATEGORIES.SYSTEM, 'Error message', null, { includeStack: true });
      
      expect(entry).toHaveProperty('stack');
      expect(typeof entry.stack).toBe('string');
      expect(entry.stack).toContain('Error');
    });

    test('should handle invalid log levels gracefully', () => {
      const entry = logger.createLogEntry('INVALID_LEVEL', LOG_CATEGORIES.SYSTEM, 'Test message');
      
      expect(entry.level).toBe('INFO'); // Should default to INFO
      expect(entry.levelValue).toBe(LOG_LEVELS.INFO.value);
    });
  });

  describe('Log Level Filtering', () => {
    test('should respect minimum log level', () => {
      logger.config.minLevel = LOG_LEVELS.WARN.value;
      
      logger.debug(LOG_CATEGORIES.SYSTEM, 'Debug message');
      logger.info(LOG_CATEGORIES.SYSTEM, 'Info message');
      logger.warn(LOG_CATEGORIES.SYSTEM, 'Warn message');
      logger.error(LOG_CATEGORIES.SYSTEM, 'Error message');
      
      expect(logger.logs).toHaveLength(2); // Only warn and error should be logged
      expect(logger.logs[0].level).toBe('WARN');
      expect(logger.logs[1].level).toBe('ERROR');
    });

    test('should log all levels when minimum is DEBUG', () => {
      logger.config.minLevel = LOG_LEVELS.DEBUG.value;
      
      logger.debug(LOG_CATEGORIES.SYSTEM, 'Debug message');
      logger.info(LOG_CATEGORIES.SYSTEM, 'Info message');
      logger.warn(LOG_CATEGORIES.SYSTEM, 'Warn message');
      logger.error(LOG_CATEGORIES.SYSTEM, 'Error message');
      logger.critical(LOG_CATEGORIES.SYSTEM, 'Critical message');
      
      expect(logger.logs).toHaveLength(5);
    });
  });

  describe('Log Management', () => {
    test('should limit log entries to maximum', () => {
      logger.config.maxLogEntries = 3;
      
      for (let i = 0; i < 5; i++) {
        logger.info(LOG_CATEGORIES.SYSTEM, `Message ${i}`);
      }
      
      expect(logger.logs).toHaveLength(3);
      // Should keep the most recent entries
      expect(logger.logs[0].message).toBe('Message 2');
      expect(logger.logs[1].message).toBe('Message 3');
      expect(logger.logs[2].message).toBe('Message 4');
    });

    test('should clean up old logs', () => {
      const oldTimestamp = Date.now() - (2 * 60 * 60 * 1000); // 2 hours ago
      const recentTimestamp = Date.now();
      
      // Add old log manually
      logger.logs.push({
        id: 'old-1',
        timestamp: oldTimestamp,
        level: 'INFO',
        message: 'Old message'
      });
      
      // Add recent log
      logger.info(LOG_CATEGORIES.SYSTEM, 'Recent message');
      
      logger.cleanupOldLogs();
      
      expect(logger.logs).toHaveLength(1);
      expect(logger.logs[0].message).toBe('Recent message');
    });
  });

  describe('Logging Methods', () => {
    test('should log debug messages correctly', () => {
      logger.debug(LOG_CATEGORIES.SYSTEM, 'Debug message', { debug: true });
      
      expect(logger.logs).toHaveLength(1);
      expect(logger.logs[0]).toMatchObject({
        level: 'DEBUG',
        category: LOG_CATEGORIES.SYSTEM,
        message: 'Debug message',
        data: { debug: true }
      });
    });

    test('should log info messages correctly', () => {
      logger.info(LOG_CATEGORIES.FILTERING, 'Info message');
      
      expect(logger.logs).toHaveLength(1);
      expect(logger.logs[0]).toMatchObject({
        level: 'INFO',
        category: LOG_CATEGORIES.FILTERING,
        message: 'Info message'
      });
    });

    test('should log warnings correctly', () => {
      logger.warn(LOG_CATEGORIES.STORAGE, 'Warning message');
      
      expect(logger.logs).toHaveLength(1);
      expect(logger.logs[0]).toMatchObject({
        level: 'WARN',
        category: LOG_CATEGORIES.STORAGE,
        message: 'Warning message'
      });
    });

    test('should log errors and call error handler', () => {
      logger.error(LOG_CATEGORIES.DOM, 'Error message', { error: 'data' });
      
      expect(logger.logs).toHaveLength(1);
      expect(logger.logs[0]).toMatchObject({
        level: 'ERROR',
        category: LOG_CATEGORIES.DOM,
        message: 'Error message',
        data: { error: 'data' }
      });
      
      expect(mockErrorHandler.handleError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          level: 'error',
          context: 'logger_dom'
        })
      );
    });

    test('should log critical messages and call error handler', () => {
      logger.critical(LOG_CATEGORIES.INITIALIZATION, 'Critical message');
      
      expect(logger.logs).toHaveLength(1);
      expect(logger.logs[0]).toMatchObject({
        level: 'CRITICAL',
        category: LOG_CATEGORIES.INITIALIZATION,
        message: 'Critical message'
      });
      
      expect(mockErrorHandler.handleError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          level: 'critical',
          context: 'logger_init'
        })
      );
    });
  });

  describe('Specialized Logging Methods', () => {
    test('should log performance metrics', () => {
      logger.performance('test_operation', 150, { extra: 'data' });
      
      expect(logger.logs).toHaveLength(1);
      expect(logger.logs[0]).toMatchObject({
        level: 'INFO',
        category: LOG_CATEGORIES.PERFORMANCE,
        message: 'test_operation completed',
        data: {
          duration: 150,
          extra: 'data'
        }
      });
    });

    test('should log user actions', () => {
      logger.userAction('toggle_filter', { filterType: 'comments', enabled: true });
      
      expect(logger.logs).toHaveLength(1);
      expect(logger.logs[0]).toMatchObject({
        level: 'INFO',
        category: LOG_CATEGORIES.USER_ACTION,
        message: 'User action: toggle_filter',
        data: { filterType: 'comments', enabled: true }
      });
    });
  });

  describe('Log Filtering and Export', () => {
    beforeEach(() => {
      // Add test logs
      logger.debug(LOG_CATEGORIES.SYSTEM, 'Debug message');
      logger.info(LOG_CATEGORIES.FILTERING, 'Info message');
      logger.warn(LOG_CATEGORIES.STORAGE, 'Warning message');
      logger.error(LOG_CATEGORIES.DOM, 'Error message');
    });

    test('should filter logs by level', () => {
      const errorLogs = logger.getLogs({ level: 'ERROR' });
      
      expect(errorLogs).toHaveLength(1);
      expect(errorLogs[0].level).toBe('ERROR');
    });

    test('should filter logs by category', () => {
      const storageLogs = logger.getLogs({ category: LOG_CATEGORIES.STORAGE });
      
      expect(storageLogs).toHaveLength(1);
      expect(storageLogs[0].category).toBe(LOG_CATEGORIES.STORAGE);
    });

    test('should filter logs by timestamp', () => {
      const since = Date.now() - 1000; // 1 second ago
      const recentLogs = logger.getLogs({ since });
      
      expect(recentLogs.length).toBeGreaterThan(0);
      recentLogs.forEach(log => {
        expect(log.timestamp).toBeGreaterThanOrEqual(since);
      });
    });

    test('should limit returned logs', () => {
      const limitedLogs = logger.getLogs({ limit: 2 });
      
      expect(limitedLogs).toHaveLength(2);
    });

    test('should export logs as JSON', () => {
      const exported = logger.exportLogs({ level: 'INFO' });
      
      expect(typeof exported).toBe('string');
      const parsed = JSON.parse(exported);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBeGreaterThan(0);
    });
  });

  describe('Statistics', () => {
    beforeEach(() => {
      logger.info(LOG_CATEGORIES.SYSTEM, 'System message');
      logger.warn(LOG_CATEGORIES.STORAGE, 'Storage warning');
      logger.error(LOG_CATEGORIES.DOM, 'DOM error');
      logger.info(LOG_CATEGORIES.SYSTEM, 'Another system message');
    });

    test('should provide accurate statistics', () => {
      const stats = logger.getStats();
      
      expect(stats.totalLogs).toBe(4);
      expect(stats.sessionId).toBe(logger.sessionId);
      expect(stats.context).toBe(logger.context);
      expect(stats.logsByLevel.INFO).toBe(2);
      expect(stats.logsByLevel.WARN).toBe(1);
      expect(stats.logsByLevel.ERROR).toBe(1);
      expect(stats.logsByCategory[LOG_CATEGORIES.SYSTEM]).toBe(2);
      expect(stats.logsByCategory[LOG_CATEGORIES.STORAGE]).toBe(1);
      expect(stats.logsByCategory[LOG_CATEGORIES.DOM]).toBe(1);
      expect(typeof stats.oldestLog).toBe('number');
      expect(typeof stats.newestLog).toBe('number');
    });
  });

  describe('Configuration Updates', () => {
    test('should update configuration', () => {
      const newConfig = {
        minLevel: LOG_LEVELS.ERROR.value,
        enableConsoleOutput: false
      };
      
      logger.updateConfig(newConfig);
      
      expect(logger.config.minLevel).toBe(LOG_LEVELS.ERROR.value);
      expect(logger.config.enableConsoleOutput).toBe(false);
      expect(logger.config.maxLogEntries).toBe(1000); // Should keep existing values
    });

    test('should log configuration update', () => {
      const initialLogCount = logger.logs.length;
      
      logger.updateConfig({ minLevel: LOG_LEVELS.DEBUG.value });
      
      expect(logger.logs.length).toBe(initialLogCount + 1);
      expect(logger.logs[logger.logs.length - 1]).toMatchObject({
        level: 'INFO',
        category: LOG_CATEGORIES.SYSTEM,
        message: 'Logger configuration updated'
      });
    });
  });

  describe('Clear Functionality', () => {
    test('should clear all logs', () => {
      logger.info(LOG_CATEGORIES.SYSTEM, 'Test message');
      expect(logger.logs).toHaveLength(1);
      
      logger.clearLogs();
      
      expect(logger.logs).toHaveLength(1); // Should have the "logs cleared" message
      expect(logger.logs[0].message).toBe('All logs cleared');
    });
  });
});

// Test constants
describe('Logger Constants', () => {
  test('should export all required constants', () => {
    expect(LOG_LEVELS).toBeDefined();
    expect(LOG_CATEGORIES).toBeDefined();
    
    expect(LOG_LEVELS.DEBUG).toMatchObject({ name: 'DEBUG', value: 0 });
    expect(LOG_LEVELS.INFO).toMatchObject({ name: 'INFO', value: 1 });
    expect(LOG_LEVELS.WARN).toMatchObject({ name: 'WARN', value: 2 });
    expect(LOG_LEVELS.ERROR).toMatchObject({ name: 'ERROR', value: 3 });
    expect(LOG_LEVELS.CRITICAL).toMatchObject({ name: 'CRITICAL', value: 4 });
    
    expect(LOG_CATEGORIES.INITIALIZATION).toBe('init');
    expect(LOG_CATEGORIES.STORAGE).toBe('storage');
    expect(LOG_CATEGORIES.FILTERING).toBe('filtering');
    expect(LOG_CATEGORIES.DOM).toBe('dom');
    expect(LOG_CATEGORIES.UI).toBe('ui');
  });
});