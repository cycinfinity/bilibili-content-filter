/**
 * Logging System for Bilibili Content Filter Extension
 * 
 * Provides structured logging with different levels, categories,
 * and browser extension specific features like storage persistence
 * and cross-context communication.
 */

import { errorHandler, ERROR_LEVELS, ERROR_CATEGORIES } from './error-handler.js';

/**
 * Log levels with numeric values for filtering
 */
const LOG_LEVELS = {
  DEBUG: { name: 'DEBUG', value: 0, color: '#888' },
  INFO: { name: 'INFO', value: 1, color: '#007acc' },
  WARN: { name: 'WARN', value: 2, color: '#ff8c00' },
  ERROR: { name: 'ERROR', value: 3, color: '#dc3545' },
  CRITICAL: { name: 'CRITICAL', value: 4, color: '#8b0000' }
};

/**
 * Log categories for better organization
 */
const LOG_CATEGORIES = {
  INITIALIZATION: 'init',
  STORAGE: 'storage',
  FILTERING: 'filtering',
  DOM: 'dom',
  UI: 'ui',
  COMMUNICATION: 'comm',
  PERFORMANCE: 'perf',
  COMPATIBILITY: 'compat',
  USER_ACTION: 'user',
  SYSTEM: 'system'
};

/**
 * Logger configuration
 */
const DEFAULT_CONFIG = {
  minLevel: LOG_LEVELS.INFO.value,
  maxLogEntries: 1000,
  persistLogs: true,
  enableConsoleOutput: true,
  enableTimestamps: true,
  enableStackTrace: false,
  colorizeOutput: true
};

/**
 * Enhanced Logger Class
 */
class Logger {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.logs = [];
    this.context = this.detectContext();
    this.sessionId = this.generateSessionId();
    
    // Initialize storage for log persistence
    this.initializeStorage();
    
    // Setup periodic log cleanup
    this.startLogCleanup();
  }

  /**
   * Detect the current execution context
   * @returns {string} Context type
   */
  detectContext() {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      if (chrome.runtime.getManifest) {
        return 'extension';
      }
    }
    
    if (typeof window !== 'undefined') {
      if (window.location && window.location.href.includes('bilibili.com')) {
        return 'content_script';
      } else if (window.location && window.location.protocol === 'chrome-extension:') {
        return 'popup';
      }
      return 'web_page';
    }
    
    return 'background';
  }

  /**
   * Generate unique session ID
   * @returns {string} Session ID
   */
  generateSessionId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Initialize storage for log persistence
   */
  async initializeStorage() {
    if (!this.config.persistLogs) {
      return;
    }

    try {
      // Load existing logs from storage
      const stored = await this.getStoredLogs();
      if (stored && Array.isArray(stored)) {
        this.logs = stored.slice(-this.config.maxLogEntries);
      }
    } catch (error) {
      console.warn('Failed to load stored logs:', error);
    }
  }

  /**
   * Get stored logs from browser storage
   * @returns {Promise<Array>} Stored logs
   */
  async getStoredLogs() {
    return new Promise((resolve) => {
      try {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          chrome.storage.local.get(['bilibiliFilterLogs'], (result) => {
            if (chrome.runtime.lastError) {
              resolve([]);
            } else {
              resolve(result.bilibiliFilterLogs || []);
            }
          });
        } else {
          resolve([]);
        }
      } catch (error) {
        resolve([]);
      }
    });
  }

  /**
   * Store logs to browser storage
   * @param {Array} logs - Logs to store
   */
  async storeLogsToStorage(logs) {
    if (!this.config.persistLogs) {
      return;
    }

    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ bilibiliFilterLogs: logs });
      }
    } catch (error) {
      console.warn('Failed to store logs:', error);
    }
  }

  /**
   * Create a log entry
   * @param {string} level - Log level
   * @param {string} category - Log category
   * @param {string} message - Log message
   * @param {any} data - Additional data
   * @param {Object} options - Logging options
   * @returns {Object} Log entry
   */
  createLogEntry(level, category, message, data, options = {}) {
    const timestamp = Date.now();
    const logLevel = LOG_LEVELS[level] || LOG_LEVELS.INFO;
    
    const entry = {
      id: `${timestamp}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp,
      sessionId: this.sessionId,
      context: this.context,
      level: logLevel.name,
      levelValue: logLevel.value,
      category,
      message,
      data: data || null,
      stack: options.includeStack ? new Error().stack : null,
      url: typeof window !== 'undefined' ? window.location.href : null,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null
    };

    return entry;
  }

  /**
   * Add log entry to storage and output
   * @param {Object} entry - Log entry
   */
  addLogEntry(entry) {
    // Check if log level meets minimum threshold
    if (entry.levelValue < this.config.minLevel) {
      return;
    }

    // Add to internal storage
    this.logs.push(entry);

    // Trim logs if exceeding max entries
    if (this.logs.length > this.config.maxLogEntries) {
      this.logs = this.logs.slice(-this.config.maxLogEntries);
    }

    // Output to console if enabled
    if (this.config.enableConsoleOutput) {
      this.outputToConsole(entry);
    }

    // Store to browser storage periodically
    if (this.config.persistLogs && this.logs.length % 10 === 0) {
      this.storeLogsToStorage(this.logs);
    }
  }

  /**
   * Output log entry to console with formatting
   * @param {Object} entry - Log entry
   */
  outputToConsole(entry) {
    const logLevel = LOG_LEVELS[entry.level];
    const timestamp = this.config.enableTimestamps ? 
      new Date(entry.timestamp).toISOString() : '';
    
    const prefix = `[Bilibili Filter${timestamp ? ' ' + timestamp : ''}] [${entry.category.toUpperCase()}]`;
    const message = `${prefix} ${entry.message}`;

    // Choose appropriate console method
    let consoleMethod = console.log;
    switch (entry.level) {
      case 'DEBUG':
        consoleMethod = console.debug;
        break;
      case 'INFO':
        consoleMethod = console.info;
        break;
      case 'WARN':
        consoleMethod = console.warn;
        break;
      case 'ERROR':
      case 'CRITICAL':
        consoleMethod = console.error;
        break;
    }

    // Output with color if supported and enabled
    if (this.config.colorizeOutput && typeof window !== 'undefined') {
      consoleMethod(`%c${message}`, `color: ${logLevel.color}`, entry.data || '');
    } else {
      consoleMethod(message, entry.data || '');
    }

    // Show stack trace for errors if enabled
    if (this.config.enableStackTrace && entry.stack && 
        (entry.level === 'ERROR' || entry.level === 'CRITICAL')) {
      console.error('Stack trace:', entry.stack);
    }
  }

  /**
   * Debug level logging
   * @param {string} category - Log category
   * @param {string} message - Log message
   * @param {any} data - Additional data
   * @param {Object} options - Logging options
   */
  debug(category, message, data, options) {
    const entry = this.createLogEntry('DEBUG', category, message, data, options);
    this.addLogEntry(entry);
  }

  /**
   * Info level logging
   * @param {string} category - Log category
   * @param {string} message - Log message
   * @param {any} data - Additional data
   * @param {Object} options - Logging options
   */
  info(category, message, data, options) {
    const entry = this.createLogEntry('INFO', category, message, data, options);
    this.addLogEntry(entry);
  }

  /**
   * Warning level logging
   * @param {string} category - Log category
   * @param {string} message - Log message
   * @param {any} data - Additional data
   * @param {Object} options - Logging options
   */
  warn(category, message, data, options) {
    const entry = this.createLogEntry('WARN', category, message, data, options);
    this.addLogEntry(entry);
  }

  /**
   * Error level logging
   * @param {string} category - Log category
   * @param {string} message - Log message
   * @param {any} data - Additional data
   * @param {Object} options - Logging options
   */
  error(category, message, data, options) {
    const entry = this.createLogEntry('ERROR', category, message, data, options);
    this.addLogEntry(entry);
    
    // Also report to error handler
    errorHandler.handleError(new Error(message), {
      category: this.mapCategoryToErrorCategory(category),
      level: ERROR_LEVELS.ERROR,
      context: `logger_${category}`,
      recoveryStrategy: 'graceful_degradation'
    });
  }

  /**
   * Critical level logging
   * @param {string} category - Log category
   * @param {string} message - Log message
   * @param {any} data - Additional data
   * @param {Object} options - Logging options
   */
  critical(category, message, data, options) {
    const entry = this.createLogEntry('CRITICAL', category, message, data, options);
    this.addLogEntry(entry);
    
    // Also report to error handler
    errorHandler.handleError(new Error(message), {
      category: this.mapCategoryToErrorCategory(category),
      level: ERROR_LEVELS.CRITICAL,
      context: `logger_${category}`,
      recoveryStrategy: 'user_intervention'
    });
  }

  /**
   * Map log category to error handler category
   * @param {string} logCategory - Log category
   * @returns {string} Error handler category
   */
  mapCategoryToErrorCategory(logCategory) {
    const mapping = {
      [LOG_CATEGORIES.STORAGE]: ERROR_CATEGORIES.STORAGE,
      [LOG_CATEGORIES.DOM]: ERROR_CATEGORIES.DOM_MANIPULATION,
      [LOG_CATEGORIES.COMPATIBILITY]: ERROR_CATEGORIES.BROWSER_COMPATIBILITY,
      [LOG_CATEGORIES.INITIALIZATION]: ERROR_CATEGORIES.INITIALIZATION,
      [LOG_CATEGORIES.COMMUNICATION]: ERROR_CATEGORIES.NETWORK,
      [LOG_CATEGORIES.PERFORMANCE]: ERROR_CATEGORIES.PERFORMANCE
    };
    
    return mapping[logCategory] || ERROR_CATEGORIES.UNKNOWN_PAGE_STRUCTURE;
  }

  /**
   * Log performance metrics
   * @param {string} operation - Operation name
   * @param {number} duration - Duration in milliseconds
   * @param {Object} metadata - Additional metadata
   */
  performance(operation, duration, metadata = {}) {
    this.info(LOG_CATEGORIES.PERFORMANCE, `${operation} completed`, {
      duration,
      ...metadata
    });
  }

  /**
   * Log user actions
   * @param {string} action - User action
   * @param {Object} details - Action details
   */
  userAction(action, details = {}) {
    this.info(LOG_CATEGORIES.USER_ACTION, `User action: ${action}`, details);
  }

  /**
   * Start periodic log cleanup
   */
  startLogCleanup() {
    setInterval(() => {
      this.cleanupOldLogs();
    }, 300000); // Every 5 minutes
  }

  /**
   * Clean up old log entries
   */
  cleanupOldLogs() {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    const originalLength = this.logs.length;
    
    this.logs = this.logs.filter(log => log.timestamp > oneHourAgo);
    
    if (this.logs.length !== originalLength) {
      this.debug(LOG_CATEGORIES.SYSTEM, 
        `Cleaned up ${originalLength - this.logs.length} old log entries`);
      
      // Update stored logs
      if (this.config.persistLogs) {
        this.storeLogsToStorage(this.logs);
      }
    }
  }

  /**
   * Get logs filtered by criteria
   * @param {Object} filters - Filter criteria
   * @returns {Array} Filtered logs
   */
  getLogs(filters = {}) {
    let filteredLogs = [...this.logs];

    if (filters.level) {
      const minLevel = LOG_LEVELS[filters.level]?.value || 0;
      filteredLogs = filteredLogs.filter(log => log.levelValue >= minLevel);
    }

    if (filters.category) {
      filteredLogs = filteredLogs.filter(log => log.category === filters.category);
    }

    if (filters.since) {
      filteredLogs = filteredLogs.filter(log => log.timestamp >= filters.since);
    }

    if (filters.limit) {
      filteredLogs = filteredLogs.slice(-filters.limit);
    }

    return filteredLogs;
  }

  /**
   * Export logs as JSON
   * @param {Object} filters - Filter criteria
   * @returns {string} JSON string of logs
   */
  exportLogs(filters = {}) {
    const logs = this.getLogs(filters);
    return JSON.stringify(logs, null, 2);
  }

  /**
   * Get logging statistics
   * @returns {Object} Statistics
   */
  getStats() {
    const stats = {
      totalLogs: this.logs.length,
      sessionId: this.sessionId,
      context: this.context,
      logsByLevel: {},
      logsByCategory: {},
      oldestLog: null,
      newestLog: null
    };

    if (this.logs.length > 0) {
      stats.oldestLog = this.logs[0].timestamp;
      stats.newestLog = this.logs[this.logs.length - 1].timestamp;
    }

    // Count by level and category
    this.logs.forEach(log => {
      stats.logsByLevel[log.level] = (stats.logsByLevel[log.level] || 0) + 1;
      stats.logsByCategory[log.category] = (stats.logsByCategory[log.category] || 0) + 1;
    });

    return stats;
  }

  /**
   * Clear all logs
   */
  clearLogs() {
    this.logs = [];
    if (this.config.persistLogs) {
      this.storeLogsToStorage([]);
    }
    this.info(LOG_CATEGORIES.SYSTEM, 'All logs cleared');
  }

  /**
   * Update logger configuration
   * @param {Object} newConfig - New configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this.info(LOG_CATEGORIES.SYSTEM, 'Logger configuration updated', newConfig);
  }
}

// Create singleton logger instance
const logger = new Logger();

// Export for use in other modules
export {
  logger,
  Logger,
  LOG_LEVELS,
  LOG_CATEGORIES
};