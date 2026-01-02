/**
 * Comprehensive Error Handling and Logging System
 * for Bilibili Content Filter Extension
 * 
 * Provides centralized error handling, logging, graceful degradation,
 * and user-friendly error messages with recovery options.
 */

/**
 * Error severity levels
 */
const ERROR_LEVELS = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  CRITICAL: 'critical'
};

/**
 * Error categories for better classification and handling
 */
const ERROR_CATEGORIES = {
  STORAGE: 'storage',
  DOM_MANIPULATION: 'dom_manipulation',
  NETWORK: 'network',
  BROWSER_COMPATIBILITY: 'browser_compatibility',
  INITIALIZATION: 'initialization',
  USER_INPUT: 'user_input',
  UNKNOWN_PAGE_STRUCTURE: 'unknown_page_structure',
  PERFORMANCE: 'performance'
};

/**
 * Recovery strategies for different error types
 */
const RECOVERY_STRATEGIES = {
  RETRY: 'retry',
  FALLBACK: 'fallback',
  GRACEFUL_DEGRADATION: 'graceful_degradation',
  USER_INTERVENTION: 'user_intervention',
  RESET_TO_DEFAULTS: 'reset_to_defaults',
  IGNORE: 'ignore'
};

/**
 * User-friendly error messages
 */
const USER_MESSAGES = {
  STORAGE_UNAVAILABLE: 'Settings could not be saved. Using temporary settings for this session.',
  DOM_MANIPULATION_FAILED: 'Some content filters may not work properly on this page.',
  UNKNOWN_PAGE_STRUCTURE: 'This page layout is not fully supported. Some filters may not work.',
  INITIALIZATION_FAILED: 'Extension failed to start properly. Please refresh the page.',
  BROWSER_COMPATIBILITY: 'Some features may not work in your browser version.',
  NETWORK_ERROR: 'Connection error occurred. Please check your internet connection.',
  GENERIC_ERROR: 'An unexpected error occurred. Please try refreshing the page.'
};

/**
 * Centralized Error Handler and Logger
 */
class ErrorHandler {
  constructor() {
    this.logs = [];
    this.maxLogEntries = 1000;
    this.errorCounts = new Map();
    this.suppressedErrors = new Set();
    this.recoveryAttempts = new Map();
    this.maxRecoveryAttempts = 3;
    
    // Initialize logging
    this.setupGlobalErrorHandlers();
    this.startPeriodicCleanup();
  }

  /**
   * Setup global error handlers for unhandled errors
   */
  setupGlobalErrorHandlers() {
    // Handle unhandled promise rejections
    if (typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', (event) => {
        this.handleError(event.reason, {
          category: ERROR_CATEGORIES.UNKNOWN_PAGE_STRUCTURE,
          level: ERROR_LEVELS.ERROR,
          context: 'unhandled_promise_rejection',
          recoveryStrategy: RECOVERY_STRATEGIES.GRACEFUL_DEGRADATION
        });
      });

      // Handle general JavaScript errors
      window.addEventListener('error', (event) => {
        // Only handle errors related to our extension
        if (event.error && (
          event.error.message.includes('bilibili-filter') ||
          event.filename.includes('bilibili') ||
          event.error.stack.includes('bilibili')
        )) {
          this.handleError(event.error, {
            category: ERROR_CATEGORIES.UNKNOWN_PAGE_STRUCTURE,
            level: ERROR_LEVELS.ERROR,
            context: 'global_error_handler',
            recoveryStrategy: RECOVERY_STRATEGIES.GRACEFUL_DEGRADATION
          });
        }
      });
    }
  }

  /**
   * Main error handling method
   * @param {Error|string} error - Error object or message
   * @param {Object} options - Error handling options
   */
  handleError(error, options = {}) {
    const {
      category = ERROR_CATEGORIES.UNKNOWN_PAGE_STRUCTURE,
      level = ERROR_LEVELS.ERROR,
      context = 'unknown',
      recoveryStrategy = RECOVERY_STRATEGIES.GRACEFUL_DEGRADATION,
      userMessage = null,
      suppressDuplicates = true,
      maxRetries = this.maxRecoveryAttempts
    } = options;

    // Create standardized error object
    const errorObj = this.normalizeError(error);
    const errorKey = this.getErrorKey(errorObj, context);

    // Check if we should suppress duplicate errors
    if (suppressDuplicates && this.shouldSuppressError(errorKey)) {
      return;
    }

    // Log the error
    this.logError(errorObj, { category, level, context });

    // Update error counts
    this.updateErrorCounts(errorKey);

    // Attempt recovery if strategy is specified
    if (recoveryStrategy !== RECOVERY_STRATEGIES.IGNORE) {
      this.attemptRecovery(errorObj, {
        strategy: recoveryStrategy,
        context,
        maxRetries,
        category
      });
    }

    // Show user-friendly message if needed
    if (userMessage || this.shouldShowUserMessage(level, category)) {
      this.showUserMessage(userMessage || this.getUserMessage(category), level);
    }

    // Report critical errors for monitoring
    if (level === ERROR_LEVELS.CRITICAL) {
      this.reportCriticalError(errorObj, { category, context });
    }
  }

  /**
   * Normalize error to standard format
   * @param {Error|string} error - Error to normalize
   * @returns {Object} Normalized error object
   */
  normalizeError(error) {
    if (error instanceof Error) {
      return {
        message: error.message,
        stack: error.stack,
        name: error.name,
        timestamp: Date.now()
      };
    } else if (typeof error === 'string') {
      return {
        message: error,
        stack: new Error().stack,
        name: 'StringError',
        timestamp: Date.now()
      };
    } else {
      return {
        message: 'Unknown error occurred',
        stack: new Error().stack,
        name: 'UnknownError',
        timestamp: Date.now(),
        originalError: error
      };
    }
  }

  /**
   * Generate unique key for error deduplication
   * @param {Object} errorObj - Normalized error object
   * @param {string} context - Error context
   * @returns {string} Unique error key
   */
  getErrorKey(errorObj, context) {
    return `${context}:${errorObj.name}:${errorObj.message}`;
  }

  /**
   * Check if error should be suppressed due to frequency
   * @param {string} errorKey - Error key
   * @returns {boolean} True if should suppress
   */
  shouldSuppressError(errorKey) {
    const count = this.errorCounts.get(errorKey) || 0;
    
    // Suppress after 5 occurrences within 5 minutes
    if (count >= 5) {
      this.suppressedErrors.add(errorKey);
      return true;
    }
    
    return this.suppressedErrors.has(errorKey);
  }

  /**
   * Log error with appropriate level and formatting
   * @param {Object} errorObj - Normalized error object
   * @param {Object} options - Logging options
   */
  logError(errorObj, options) {
    const { category, level, context } = options;
    
    const logEntry = {
      timestamp: errorObj.timestamp,
      level,
      category,
      context,
      message: errorObj.message,
      stack: errorObj.stack,
      name: errorObj.name
    };

    // Add to internal log
    this.logs.push(logEntry);
    
    // Trim logs if too many
    if (this.logs.length > this.maxLogEntries) {
      this.logs = this.logs.slice(-this.maxLogEntries);
    }

    // Console logging with appropriate level
    const consoleMessage = `[Bilibili Filter] ${category.toUpperCase()}: ${errorObj.message}`;
    
    switch (level) {
      case ERROR_LEVELS.DEBUG:
        console.debug(consoleMessage, errorObj);
        break;
      case ERROR_LEVELS.INFO:
        console.info(consoleMessage, errorObj);
        break;
      case ERROR_LEVELS.WARN:
        console.warn(consoleMessage, errorObj);
        break;
      case ERROR_LEVELS.ERROR:
        console.error(consoleMessage, errorObj);
        break;
      case ERROR_LEVELS.CRITICAL:
        console.error(`🚨 CRITICAL: ${consoleMessage}`, errorObj);
        break;
      default:
        console.log(consoleMessage, errorObj);
    }
  }

  /**
   * Update error occurrence counts
   * @param {string} errorKey - Error key
   */
  updateErrorCounts(errorKey) {
    const currentCount = this.errorCounts.get(errorKey) || 0;
    this.errorCounts.set(errorKey, currentCount + 1);
  }

  /**
   * Attempt error recovery based on strategy
   * @param {Object} errorObj - Normalized error object
   * @param {Object} options - Recovery options
   */
  async attemptRecovery(errorObj, options) {
    const { strategy, context, maxRetries, category } = options;
    const recoveryKey = `${context}:${strategy}`;
    
    // Check if we've exceeded retry attempts
    const attempts = this.recoveryAttempts.get(recoveryKey) || 0;
    if (attempts >= maxRetries) {
      this.logError({
        message: `Max recovery attempts exceeded for ${recoveryKey}`,
        timestamp: Date.now(),
        name: 'RecoveryFailure'
      }, {
        category: ERROR_CATEGORIES.UNKNOWN_PAGE_STRUCTURE,
        level: ERROR_LEVELS.WARN,
        context: 'recovery_system'
      });
      return;
    }

    // Update attempt count
    this.recoveryAttempts.set(recoveryKey, attempts + 1);

    try {
      switch (strategy) {
        case RECOVERY_STRATEGIES.RETRY:
          await this.retryOperation(context, errorObj);
          break;
          
        case RECOVERY_STRATEGIES.FALLBACK:
          await this.fallbackOperation(context, errorObj);
          break;
          
        case RECOVERY_STRATEGIES.GRACEFUL_DEGRADATION:
          await this.gracefulDegradation(context, errorObj);
          break;
          
        case RECOVERY_STRATEGIES.RESET_TO_DEFAULTS:
          await this.resetToDefaults(context, errorObj);
          break;
          
        case RECOVERY_STRATEGIES.USER_INTERVENTION:
          this.requestUserIntervention(context, errorObj);
          break;
          
        default:
          this.logError({
            message: `Unknown recovery strategy: ${strategy}`,
            timestamp: Date.now(),
            name: 'UnknownRecoveryStrategy'
          }, {
            category: ERROR_CATEGORIES.UNKNOWN_PAGE_STRUCTURE,
            level: ERROR_LEVELS.WARN,
            context: 'recovery_system'
          });
      }
      
      // Reset attempt count on successful recovery
      this.recoveryAttempts.delete(recoveryKey);
      
    } catch (recoveryError) {
      this.logError(recoveryError, {
        category: ERROR_CATEGORIES.UNKNOWN_PAGE_STRUCTURE,
        level: ERROR_LEVELS.ERROR,
        context: `recovery_${strategy}`,
        recoveryStrategy: RECOVERY_STRATEGIES.IGNORE
      });
    }
  }

  /**
   * Retry the failed operation
   * @param {string} context - Operation context
   * @param {Object} errorObj - Original error
   */
  async retryOperation(context, errorObj) {
    // Add delay before retry
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    this.logError({
      message: `Retrying operation: ${context}`,
      timestamp: Date.now(),
      name: 'RetryAttempt'
    }, {
      category: ERROR_CATEGORIES.UNKNOWN_PAGE_STRUCTURE,
      level: ERROR_LEVELS.INFO,
      context: 'recovery_retry'
    });

    // Trigger re-initialization or specific retry logic based on context
    if (context.includes('initialization')) {
      // Trigger re-initialization
      if (typeof window !== 'undefined' && window.bilibiliFilterController) {
        window.bilibiliFilterController.initialize();
      }
    } else if (context.includes('storage')) {
      // Retry storage operation with fallback
      await this.fallbackOperation(context, errorObj);
    }
  }

  /**
   * Perform fallback operation
   * @param {string} context - Operation context
   * @param {Object} errorObj - Original error
   */
  async fallbackOperation(context, errorObj) {
    this.logError({
      message: `Performing fallback for: ${context}`,
      timestamp: Date.now(),
      name: 'FallbackOperation'
    }, {
      category: ERROR_CATEGORIES.UNKNOWN_PAGE_STRUCTURE,
      level: ERROR_LEVELS.INFO,
      context: 'recovery_fallback'
    });

    if (context.includes('storage')) {
      // Use session storage or memory storage as fallback
      this.enableSessionOnlyMode();
    } else if (context.includes('dom')) {
      // Use alternative selectors or simplified filtering
      this.enableSimplifiedFiltering();
    } else if (context.includes('browser_api')) {
      // Use polyfills or alternative APIs
      this.enableCompatibilityMode();
    }
  }

  /**
   * Perform graceful degradation
   * @param {string} context - Operation context
   * @param {Object} errorObj - Original error
   */
  async gracefulDegradation(context, errorObj) {
    this.logError({
      message: `Graceful degradation for: ${context}`,
      timestamp: Date.now(),
      name: 'GracefulDegradation'
    }, {
      category: ERROR_CATEGORIES.UNKNOWN_PAGE_STRUCTURE,
      level: ERROR_LEVELS.INFO,
      context: 'recovery_degradation'
    });

    // Disable problematic features while keeping core functionality
    if (context.includes('filter')) {
      this.disableProblematicFilters();
    } else if (context.includes('observer')) {
      this.enableBasicFiltering();
    }
  }

  /**
   * Reset to default settings
   * @param {string} context - Operation context
   * @param {Object} errorObj - Original error
   */
  async resetToDefaults(context, errorObj) {
    this.logError({
      message: `Resetting to defaults for: ${context}`,
      timestamp: Date.now(),
      name: 'ResetToDefaults'
    }, {
      category: ERROR_CATEGORIES.UNKNOWN_PAGE_STRUCTURE,
      level: ERROR_LEVELS.WARN,
      context: 'recovery_reset'
    });

    // Reset settings to defaults
    try {
      const defaultSettings = {
        homeRecommendations: true,
        rankingTrending: false,
        rightSidebar: false,
        comments: false,
        relatedVideos: false,
        version: '1.0.0',
        lastUpdated: Date.now()
      };

      // Try to save defaults
      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.local.set({ bilibiliFilterSettings: defaultSettings });
      }
    } catch (resetError) {
      this.logError(resetError, {
        category: ERROR_CATEGORIES.STORAGE,
        level: ERROR_LEVELS.ERROR,
        context: 'reset_defaults',
        recoveryStrategy: RECOVERY_STRATEGIES.IGNORE
      });
    }
  }

  /**
   * Request user intervention
   * @param {string} context - Operation context
   * @param {Object} errorObj - Original error
   */
  requestUserIntervention(context, errorObj) {
    const message = `Extension needs attention: ${this.getUserMessage(context)}`;
    this.showUserMessage(message, ERROR_LEVELS.WARN, {
      showActions: true,
      actions: [
        { text: 'Refresh Page', action: () => window.location.reload() },
        { text: 'Reset Settings', action: () => this.resetToDefaults(context, errorObj) }
      ]
    });
  }

  /**
   * Enable session-only mode when storage fails
   */
  enableSessionOnlyMode() {
    this.logError({
      message: 'Enabling session-only mode due to storage failure',
      timestamp: Date.now(),
      name: 'SessionOnlyMode'
    }, {
      category: ERROR_CATEGORIES.STORAGE,
      level: ERROR_LEVELS.WARN,
      context: 'fallback_storage'
    });

    // Set flag for session-only mode
    if (typeof window !== 'undefined') {
      window.bilibiliFilterSessionOnly = true;
    }
  }

  /**
   * Enable simplified filtering when DOM manipulation fails
   */
  enableSimplifiedFiltering() {
    this.logError({
      message: 'Enabling simplified filtering due to DOM issues',
      timestamp: Date.now(),
      name: 'SimplifiedFiltering'
    }, {
      category: ERROR_CATEGORIES.DOM_MANIPULATION,
      level: ERROR_LEVELS.WARN,
      context: 'fallback_filtering'
    });

    // Use basic CSS hiding instead of complex DOM manipulation
    if (typeof window !== 'undefined') {
      window.bilibiliFilterSimplified = true;
    }
  }

  /**
   * Enable compatibility mode for browser API issues
   */
  enableCompatibilityMode() {
    this.logError({
      message: 'Enabling compatibility mode due to browser API issues',
      timestamp: Date.now(),
      name: 'CompatibilityMode'
    }, {
      category: ERROR_CATEGORIES.BROWSER_COMPATIBILITY,
      level: ERROR_LEVELS.WARN,
      context: 'fallback_compatibility'
    });

    // Use alternative APIs or polyfills
    if (typeof window !== 'undefined') {
      window.bilibiliFilterCompatibilityMode = true;
    }
  }

  /**
   * Disable problematic filters
   */
  disableProblematicFilters() {
    this.logError({
      message: 'Disabling problematic filters',
      timestamp: Date.now(),
      name: 'DisableProblematicFilters'
    }, {
      category: ERROR_CATEGORIES.DOM_MANIPULATION,
      level: ERROR_LEVELS.WARN,
      context: 'fallback_filters'
    });

    // Keep only basic filters that are known to work
    if (typeof window !== 'undefined') {
      window.bilibiliFilterBasicOnly = true;
    }
  }

  /**
   * Enable basic filtering without observers
   */
  enableBasicFiltering() {
    this.logError({
      message: 'Enabling basic filtering without observers',
      timestamp: Date.now(),
      name: 'BasicFiltering'
    }, {
      category: ERROR_CATEGORIES.DOM_MANIPULATION,
      level: ERROR_LEVELS.WARN,
      context: 'fallback_basic'
    });

    // Use static CSS injection instead of dynamic observers
    if (typeof window !== 'undefined') {
      window.bilibiliFilterStaticOnly = true;
    }
  }

  /**
   * Determine if user message should be shown
   * @param {string} level - Error level
   * @param {string} category - Error category
   * @returns {boolean} True if should show message
   */
  shouldShowUserMessage(level, category) {
    // Show messages for errors that affect user experience
    return level === ERROR_LEVELS.ERROR || 
           level === ERROR_LEVELS.CRITICAL ||
           category === ERROR_CATEGORIES.STORAGE ||
           category === ERROR_CATEGORIES.INITIALIZATION;
  }

  /**
   * Get user-friendly message for error category
   * @param {string} category - Error category
   * @returns {string} User-friendly message
   */
  getUserMessage(category) {
    switch (category) {
      case ERROR_CATEGORIES.STORAGE:
        return USER_MESSAGES.STORAGE_UNAVAILABLE;
      case ERROR_CATEGORIES.DOM_MANIPULATION:
        return USER_MESSAGES.DOM_MANIPULATION_FAILED;
      case ERROR_CATEGORIES.UNKNOWN_PAGE_STRUCTURE:
        return USER_MESSAGES.UNKNOWN_PAGE_STRUCTURE;
      case ERROR_CATEGORIES.INITIALIZATION:
        return USER_MESSAGES.INITIALIZATION_FAILED;
      case ERROR_CATEGORIES.BROWSER_COMPATIBILITY:
        return USER_MESSAGES.BROWSER_COMPATIBILITY;
      case ERROR_CATEGORIES.NETWORK:
        return USER_MESSAGES.NETWORK_ERROR;
      default:
        return USER_MESSAGES.GENERIC_ERROR;
    }
  }

  /**
   * Show user-friendly error message
   * @param {string} message - Message to show
   * @param {string} level - Error level
   * @param {Object} options - Display options
   */
  showUserMessage(message, level, options = {}) {
    // In extension context, we might show notifications or update popup UI
    // For now, we'll use console and try to update any visible UI
    
    const displayLevel = level === ERROR_LEVELS.CRITICAL ? 'error' : 
                        level === ERROR_LEVELS.ERROR ? 'error' : 'warn';
    
    console[displayLevel](`[User Message] ${message}`);

    // Try to show in popup if available
    if (typeof window !== 'undefined' && window.postMessage) {
      window.postMessage({
        type: 'BILIBILI_FILTER_ERROR',
        message,
        level,
        options
      }, '*');
    }

    // Store for popup to retrieve
    if (typeof window !== 'undefined') {
      window.bilibiliFilterLastError = {
        message,
        level,
        timestamp: Date.now(),
        options
      };
    }
  }

  /**
   * Report critical errors for monitoring
   * @param {Object} errorObj - Error object
   * @param {Object} context - Error context
   */
  reportCriticalError(errorObj, context) {
    // In a production environment, this would send to error tracking service
    console.error('🚨 CRITICAL ERROR REPORTED:', {
      error: errorObj,
      context,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      timestamp: Date.now()
    });
  }

  /**
   * Start periodic cleanup of old logs and error counts
   */
  startPeriodicCleanup() {
    setInterval(() => {
      this.cleanupOldLogs();
      this.cleanupErrorCounts();
      this.cleanupRecoveryAttempts();
    }, 300000); // Every 5 minutes
  }

  /**
   * Clean up old log entries
   */
  cleanupOldLogs() {
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    this.logs = this.logs.filter(log => log.timestamp > fiveMinutesAgo);
  }

  /**
   * Clean up old error counts
   */
  cleanupErrorCounts() {
    // Reset error counts every 5 minutes to allow previously suppressed errors
    this.errorCounts.clear();
    this.suppressedErrors.clear();
  }

  /**
   * Clean up old recovery attempts
   */
  cleanupRecoveryAttempts() {
    // Reset recovery attempts every 5 minutes
    this.recoveryAttempts.clear();
  }

  /**
   * Get current error statistics
   * @returns {Object} Error statistics
   */
  getErrorStats() {
    const stats = {
      totalLogs: this.logs.length,
      errorsByLevel: {},
      errorsByCategory: {},
      suppressedErrorCount: this.suppressedErrors.size,
      activeRecoveryAttempts: this.recoveryAttempts.size
    };

    // Count by level and category
    this.logs.forEach(log => {
      stats.errorsByLevel[log.level] = (stats.errorsByLevel[log.level] || 0) + 1;
      stats.errorsByCategory[log.category] = (stats.errorsByCategory[log.category] || 0) + 1;
    });

    return stats;
  }

  /**
   * Export logs for debugging
   * @returns {Array} Array of log entries
   */
  exportLogs() {
    return [...this.logs];
  }

  /**
   * Clear all logs and reset state
   */
  clearLogs() {
    this.logs = [];
    this.errorCounts.clear();
    this.suppressedErrors.clear();
    this.recoveryAttempts.clear();
  }
}

// Create singleton instance
const errorHandler = new ErrorHandler();

// Export for use in other modules
export {
  errorHandler,
  ErrorHandler,
  ERROR_LEVELS,
  ERROR_CATEGORIES,
  RECOVERY_STRATEGIES,
  USER_MESSAGES
};