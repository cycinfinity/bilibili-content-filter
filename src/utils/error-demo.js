/**
 * Demonstration of Error Handling and Logging System
 * 
 * This file demonstrates how to use the comprehensive error handling
 * and logging system in the Bilibili Content Filter Extension.
 */

import { errorHandler, ERROR_CATEGORIES, RECOVERY_STRATEGIES, ERROR_LEVELS } from './error-handler.js';
import { logger, LOG_CATEGORIES } from './logger.js';
import { gracefulDegradationManager } from './graceful-degradation.js';

/**
 * Demonstrate basic error handling
 */
function demonstrateBasicErrorHandling() {
  console.log('=== Basic Error Handling Demo ===');
  
  try {
    // Simulate a storage error
    throw new Error('Failed to access browser storage');
  } catch (error) {
    errorHandler.handleError(error, {
      category: ERROR_CATEGORIES.STORAGE,
      level: ERROR_LEVELS.ERROR,
      context: 'demo_storage_access',
      recoveryStrategy: RECOVERY_STRATEGIES.FALLBACK,
      userMessage: 'Settings could not be loaded. Using defaults.'
    });
  }
  
  try {
    // Simulate a DOM manipulation error
    throw new Error('Cannot find element with selector .non-existent');
  } catch (error) {
    errorHandler.handleError(error, {
      category: ERROR_CATEGORIES.DOM_MANIPULATION,
      level: ERROR_LEVELS.WARN,
      context: 'demo_dom_manipulation',
      recoveryStrategy: RECOVERY_STRATEGIES.GRACEFUL_DEGRADATION
    });
  }
  
  try {
    // Simulate a critical initialization error
    throw new Error('Extension failed to initialize');
  } catch (error) {
    errorHandler.handleError(error, {
      category: ERROR_CATEGORIES.INITIALIZATION,
      level: ERROR_LEVELS.CRITICAL,
      context: 'demo_initialization',
      recoveryStrategy: RECOVERY_STRATEGIES.USER_INTERVENTION,
      userMessage: 'Extension failed to start. Please refresh the page.'
    });
  }
}

/**
 * Demonstrate logging system
 */
function demonstrateLogging() {
  console.log('=== Logging System Demo ===');
  
  // Debug logging
  logger.debug(LOG_CATEGORIES.SYSTEM, 'Debug message for development', {
    debugInfo: 'Additional debug data'
  });
  
  // Info logging
  logger.info(LOG_CATEGORIES.INITIALIZATION, 'Extension initialized successfully', {
    version: '1.0.0',
    browser: 'Chrome'
  });
  
  // Warning logging
  logger.warn(LOG_CATEGORIES.COMPATIBILITY, 'Unknown page structure detected', {
    url: window.location.href,
    confidence: 'low'
  });
  
  // Error logging (also triggers error handler)
  logger.error(LOG_CATEGORIES.STORAGE, 'Failed to save settings', {
    errorCode: 'QUOTA_EXCEEDED',
    attemptedData: { homeRecommendations: true }
  });
  
  // Performance logging
  logger.performance('filter_application', 45, {
    filterType: 'homeRecommendations',
    elementsProcessed: 12
  });
  
  // User action logging
  logger.userAction('toggle_filter', {
    filterType: 'comments',
    enabled: false,
    source: 'popup'
  });
}

/**
 * Demonstrate graceful degradation
 */
function demonstrateGracefulDegradation() {
  console.log('=== Graceful Degradation Demo ===');
  
  // Get current page analysis
  const status = gracefulDegradationManager.getStatus();
  logger.info(LOG_CATEGORIES.COMPATIBILITY, 'Page analysis results', status);
  
  // Demonstrate adaptive filtering
  const filterTypes = ['homeRecommendations', 'comments', 'rightSidebar'];
  
  filterTypes.forEach(filterType => {
    try {
      const success = gracefulDegradationManager.applyGracefulFiltering(filterType, true);
      
      if (success) {
        logger.info(LOG_CATEGORIES.FILTERING, `Successfully applied ${filterType} filter using graceful degradation`);
      } else {
        logger.warn(LOG_CATEGORIES.FILTERING, `Failed to apply ${filterType} filter even with graceful degradation`);
      }
    } catch (error) {
      logger.error(LOG_CATEGORIES.FILTERING, `Error during graceful filtering for ${filterType}`, error);
    }
  });
}

/**
 * Demonstrate error recovery strategies
 */
async function demonstrateRecoveryStrategies() {
  console.log('=== Recovery Strategies Demo ===');
  
  // Retry strategy
  try {
    throw new Error('Temporary network error');
  } catch (error) {
    errorHandler.handleError(error, {
      category: ERROR_CATEGORIES.NETWORK,
      level: ERROR_LEVELS.WARN,
      context: 'demo_network_request',
      recoveryStrategy: RECOVERY_STRATEGIES.RETRY
    });
  }
  
  // Fallback strategy
  try {
    throw new Error('Primary storage unavailable');
  } catch (error) {
    errorHandler.handleError(error, {
      category: ERROR_CATEGORIES.STORAGE,
      level: ERROR_LEVELS.ERROR,
      context: 'demo_storage_fallback',
      recoveryStrategy: RECOVERY_STRATEGIES.FALLBACK
    });
  }
  
  // Reset to defaults strategy
  try {
    throw new Error('Settings corrupted');
  } catch (error) {
    errorHandler.handleError(error, {
      category: ERROR_CATEGORIES.STORAGE,
      level: ERROR_LEVELS.ERROR,
      context: 'demo_settings_corruption',
      recoveryStrategy: RECOVERY_STRATEGIES.RESET_TO_DEFAULTS
    });
  }
}

/**
 * Demonstrate error statistics and monitoring
 */
function demonstrateErrorStatistics() {
  console.log('=== Error Statistics Demo ===');
  
  // Get error statistics
  const errorStats = errorHandler.getErrorStats();
  logger.info(LOG_CATEGORIES.SYSTEM, 'Error statistics', errorStats);
  
  // Get logging statistics
  const logStats = logger.getStats();
  logger.info(LOG_CATEGORIES.SYSTEM, 'Logging statistics', logStats);
  
  // Export logs for analysis
  const recentLogs = logger.getLogs({ 
    level: 'WARN', 
    limit: 10 
  });
  
  console.log('Recent warning and error logs:', recentLogs);
  
  // Export all logs as JSON
  const exportedLogs = logger.exportLogs({ since: Date.now() - 60000 }); // Last minute
  console.log('Exported logs (JSON):', exportedLogs);
}

/**
 * Demonstrate error suppression and rate limiting
 */
function demonstrateErrorSuppression() {
  console.log('=== Error Suppression Demo ===');
  
  // Generate repeated errors to demonstrate suppression
  for (let i = 0; i < 10; i++) {
    try {
      throw new Error('Repeated DOM error');
    } catch (error) {
      errorHandler.handleError(error, {
        category: ERROR_CATEGORIES.DOM_MANIPULATION,
        level: ERROR_LEVELS.WARN,
        context: 'demo_repeated_error',
        recoveryStrategy: RECOVERY_STRATEGIES.IGNORE,
        suppressDuplicates: true
      });
    }
  }
  
  const stats = errorHandler.getErrorStats();
  console.log('After repeated errors - suppressed count:', stats.suppressedErrorCount);
}

/**
 * Demonstrate user-friendly error messages
 */
function demonstrateUserMessages() {
  console.log('=== User Messages Demo ===');
  
  // Show different types of user messages
  errorHandler.showUserMessage(
    'Extension is running in compatibility mode due to browser limitations.',
    ERROR_LEVELS.WARN
  );
  
  errorHandler.showUserMessage(
    'Some content filters may not work on this page layout.',
    ERROR_LEVELS.INFO
  );
  
  errorHandler.showUserMessage(
    'Extension failed to start properly. Please refresh the page.',
    ERROR_LEVELS.ERROR,
    {
      showActions: true,
      actions: [
        { text: 'Refresh Page', action: () => window.location.reload() },
        { text: 'Reset Settings', action: () => console.log('Settings reset') }
      ]
    }
  );
}

/**
 * Run all demonstrations
 */
function runAllDemonstrations() {
  console.log('🚀 Starting Error Handling and Logging System Demonstration');
  console.log('===========================================================');
  
  try {
    demonstrateBasicErrorHandling();
    demonstrateLogging();
    demonstrateGracefulDegradation();
    demonstrateRecoveryStrategies();
    demonstrateErrorStatistics();
    demonstrateErrorSuppression();
    demonstrateUserMessages();
    
    console.log('===========================================================');
    console.log('✅ All demonstrations completed successfully');
    
    // Final statistics
    const finalStats = {
      errors: errorHandler.getErrorStats(),
      logs: logger.getStats(),
      degradation: gracefulDegradationManager.getStatus()
    };
    
    console.log('📊 Final System Statistics:', finalStats);
    
  } catch (error) {
    console.error('❌ Demo failed:', error);
    
    // Even the demo failure is handled by our error system!
    errorHandler.handleError(error, {
      category: ERROR_CATEGORIES.UNKNOWN_PAGE_STRUCTURE,
      level: ERROR_LEVELS.ERROR,
      context: 'demo_execution',
      recoveryStrategy: RECOVERY_STRATEGIES.GRACEFUL_DEGRADATION
    });
  }
}

// Export for use in browser console or testing
if (typeof window !== 'undefined') {
  window.errorHandlingDemo = {
    runAll: runAllDemonstrations,
    basicErrors: demonstrateBasicErrorHandling,
    logging: demonstrateLogging,
    degradation: demonstrateGracefulDegradation,
    recovery: demonstrateRecoveryStrategies,
    statistics: demonstrateErrorStatistics,
    suppression: demonstrateErrorSuppression,
    userMessages: demonstrateUserMessages
  };
  
  console.log('💡 Error handling demo available at window.errorHandlingDemo');
  console.log('   Run window.errorHandlingDemo.runAll() to see all features');
}

export {
  runAllDemonstrations,
  demonstrateBasicErrorHandling,
  demonstrateLogging,
  demonstrateGracefulDegradation,
  demonstrateRecoveryStrategies,
  demonstrateErrorStatistics,
  demonstrateErrorSuppression,
  demonstrateUserMessages
};