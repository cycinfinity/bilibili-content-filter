# Error Handling and Logging System

This directory contains a comprehensive error handling and logging system for the Bilibili Content Filter Extension. The system provides robust error recovery, graceful degradation, structured logging, and user-friendly error messages.

## Components

### 1. Error Handler (`error-handler.js`)

The central error handling system that provides:

- **Centralized Error Processing**: All errors flow through a single handler
- **Error Classification**: Categorizes errors by type (storage, DOM, network, etc.)
- **Recovery Strategies**: Automatic recovery attempts with different strategies
- **Error Suppression**: Prevents spam from repeated errors
- **User-Friendly Messages**: Converts technical errors to user-understandable messages
- **Critical Error Reporting**: Special handling for critical system failures

#### Usage Example

```javascript
import { errorHandler, ERROR_CATEGORIES, RECOVERY_STRATEGIES } from './error-handler.js';

try {
  // Some operation that might fail
  await saveSettings(settings);
} catch (error) {
  errorHandler.handleError(error, {
    category: ERROR_CATEGORIES.STORAGE,
    level: ERROR_LEVELS.ERROR,
    context: 'save_user_settings',
    recoveryStrategy: RECOVERY_STRATEGIES.FALLBACK,
    userMessage: 'Settings could not be saved. Using temporary settings.'
  });
}
```

#### Error Categories

- `STORAGE`: Browser storage related errors
- `DOM_MANIPULATION`: DOM access and modification errors
- `NETWORK`: Network and communication errors
- `BROWSER_COMPATIBILITY`: Cross-browser compatibility issues
- `INITIALIZATION`: Extension startup and initialization errors
- `USER_INPUT`: User input validation and processing errors
- `UNKNOWN_PAGE_STRUCTURE`: Unknown or changed page layouts
- `PERFORMANCE`: Performance and resource related issues

#### Recovery Strategies

- `RETRY`: Attempt the operation again with exponential backoff
- `FALLBACK`: Use alternative methods or APIs
- `GRACEFUL_DEGRADATION`: Reduce functionality but keep core features working
- `USER_INTERVENTION`: Request user action to resolve the issue
- `RESET_TO_DEFAULTS`: Reset to known good state
- `IGNORE`: Log the error but don't attempt recovery

### 2. Logger (`logger.js`)

A structured logging system with:

- **Multiple Log Levels**: DEBUG, INFO, WARN, ERROR, CRITICAL
- **Categorized Logging**: Organize logs by functional area
- **Persistent Storage**: Logs can be stored in browser storage
- **Cross-Context Support**: Works in content scripts, popup, and background
- **Performance Logging**: Special methods for performance metrics
- **Log Filtering and Export**: Query and export logs for analysis

#### Usage Example

```javascript
import { logger, LOG_CATEGORIES } from './logger.js';

// Basic logging
logger.info(LOG_CATEGORIES.INITIALIZATION, 'Extension started successfully');

// Logging with data
logger.warn(LOG_CATEGORIES.STORAGE, 'Storage quota low', { 
  used: 95, 
  total: 100 
});

// Performance logging
logger.performance('filter_application', 150, { 
  filterType: 'comments',
  elementsProcessed: 25 
});

// User action logging
logger.userAction('toggle_filter', { 
  filterType: 'sidebar', 
  enabled: false 
});
```

#### Log Categories

- `INITIALIZATION`: Extension startup and initialization
- `STORAGE`: Data persistence and retrieval
- `FILTERING`: Content filtering operations
- `DOM`: DOM manipulation and observation
- `UI`: User interface interactions
- `COMMUNICATION`: Message passing and API calls
- `PERFORMANCE`: Performance metrics and timing
- `COMPATIBILITY`: Browser compatibility handling
- `USER_ACTION`: User interactions and preferences
- `SYSTEM`: System-level operations and health checks

### 3. Graceful Degradation Manager (`graceful-degradation.js`)

Handles unknown page structures and provides fallback mechanisms:

- **Page Structure Analysis**: Analyzes current page layout and confidence level
- **Adaptive Selectors**: Dynamically discovers working CSS selectors
- **Fallback Strategies**: Multiple levels of fallback for different confidence levels
- **Intelligent Discovery**: Uses heuristics to find similar elements
- **Cross-Domain Consistency**: Maintains functionality across different Bilibili subdomains

#### Usage Example

```javascript
import { gracefulDegradationManager } from './graceful-degradation.js';

// Get current page analysis
const status = gracefulDegradationManager.getStatus();
console.log('Page confidence:', status.confidenceLevel);

// Apply filtering with graceful degradation
const success = gracefulDegradationManager.applyGracefulFiltering('comments', true);
if (!success) {
  logger.warn(LOG_CATEGORIES.FILTERING, 'Could not apply comments filter');
}
```

#### Confidence Levels

- `HIGH`: 80%+ selectors found - use standard filtering
- `MEDIUM`: 50-79% selectors found - use adaptive filtering
- `LOW`: 20-49% selectors found - use basic filtering
- `UNKNOWN`: <20% selectors found - use minimal filtering

## Integration with Existing Code

The error handling system is integrated into the existing extension components:

### Content Script Integration

```javascript
// In src/content/content.js
import { logger, LOG_CATEGORIES } from '../utils/logger.js';
import { errorHandler, ERROR_CATEGORIES, RECOVERY_STRATEGIES } from '../utils/error-handler.js';

// Error handling in initialization
try {
  await this.loadAndApplySettings();
} catch (error) {
  logger.error(LOG_CATEGORIES.STORAGE, 'Failed to load settings', error);
  
  errorHandler.handleError(error, {
    category: ERROR_CATEGORIES.STORAGE,
    context: 'load_settings',
    recoveryStrategy: RECOVERY_STRATEGIES.FALLBACK
  });
}
```

### Filter Manager Integration

```javascript
// Enhanced filter application with error handling
applyFiltersFromSettings(settings) {
  Object.entries(settings).forEach(([filterType, enabled]) => {
    try {
      if (enabled) {
        const success = filterManager.applyFilter(filterType);
        if (!success) {
          // Fall back to graceful degradation
          gracefulDegradationManager.applyGracefulFiltering(filterType, true);
        }
      }
    } catch (error) {
      errorHandler.handleError(error, {
        category: ERROR_CATEGORIES.DOM_MANIPULATION,
        context: `apply_filter_${filterType}`,
        recoveryStrategy: RECOVERY_STRATEGIES.GRACEFUL_DEGRADATION
      });
    }
  });
}
```

## Configuration

### Logger Configuration

```javascript
const logger = new Logger({
  minLevel: LOG_LEVELS.INFO.value,    // Minimum log level to record
  maxLogEntries: 1000,                // Maximum log entries to keep
  persistLogs: true,                  // Store logs in browser storage
  enableConsoleOutput: true,          // Output to browser console
  enableTimestamps: true,             // Include timestamps in logs
  colorizeOutput: true                // Use colors in console output
});
```

### Error Handler Configuration

The error handler automatically configures itself but provides methods to adjust behavior:

```javascript
// Update error suppression threshold
errorHandler.maxRecoveryAttempts = 5;

// Clear suppressed errors
errorHandler.suppressedErrors.clear();

// Get current statistics
const stats = errorHandler.getErrorStats();
```

## Monitoring and Debugging

### Getting System Status

```javascript
// Error handler statistics
const errorStats = errorHandler.getErrorStats();
console.log('Total errors:', errorStats.totalLogs);
console.log('Errors by category:', errorStats.errorsByCategory);

// Logger statistics  
const logStats = logger.getStats();
console.log('Total logs:', logStats.totalLogs);
console.log('Session ID:', logStats.sessionId);

// Graceful degradation status
const degradationStatus = gracefulDegradationManager.getStatus();
console.log('Page type:', degradationStatus.pageType);
console.log('Confidence:', degradationStatus.confidenceLevel);
```

### Exporting Logs

```javascript
// Export recent error logs
const errorLogs = logger.getLogs({ 
  level: 'ERROR', 
  since: Date.now() - 3600000  // Last hour
});

// Export as JSON
const jsonLogs = logger.exportLogs({ limit: 100 });

// Export error handler logs
const errorHandlerLogs = errorHandler.exportLogs();
```

### Demo and Testing

Run the demonstration to see all features in action:

```javascript
// In browser console
window.errorHandlingDemo.runAll();

// Or run individual demos
window.errorHandlingDemo.logging();
window.errorHandlingDemo.recovery();
```

## Error Recovery Examples

### Storage Failures

When browser storage is unavailable:
1. **Fallback**: Use session storage or memory storage
2. **User Message**: "Settings could not be saved. Using temporary settings for this session."
3. **Recovery**: Periodically retry storage access

### DOM Manipulation Failures

When CSS selectors don't work:
1. **Graceful Degradation**: Use alternative selectors or heuristic discovery
2. **Fallback**: Enable simplified filtering mode
3. **User Message**: "Some content filters may not work properly on this page."

### Initialization Failures

When extension fails to start:
1. **Retry**: Attempt initialization with exponential backoff
2. **Degradation**: Enable basic functionality only
3. **User Message**: "Extension failed to start properly. Please refresh the page."

### Browser Compatibility Issues

When browser APIs are unavailable:
1. **Compatibility Mode**: Use polyfills or alternative APIs
2. **Feature Detection**: Disable unsupported features gracefully
3. **User Message**: "Some features may not work in your browser version."

## Best Practices

1. **Always Use Error Handling**: Wrap risky operations in try-catch blocks
2. **Choose Appropriate Categories**: Use the most specific error category
3. **Provide Context**: Include meaningful context information
4. **Select Recovery Strategy**: Choose the most appropriate recovery strategy
5. **Log Performance**: Use performance logging for timing-critical operations
6. **Monitor Statistics**: Regularly check error statistics for issues
7. **Test Error Paths**: Test error handling and recovery mechanisms
8. **User-Friendly Messages**: Always provide clear, actionable user messages

## Testing

The system includes comprehensive tests:

- `error-handler.test.js`: Unit tests for error handler
- `logger.test.js`: Unit tests for logger
- `error-integration.test.js`: Integration tests with existing components

Run tests with:
```bash
npm test
```

## Performance Considerations

- **Log Rotation**: Old logs are automatically cleaned up
- **Error Suppression**: Repeated errors are suppressed to prevent spam
- **Efficient Storage**: Only essential data is persisted
- **Lazy Loading**: Components are loaded only when needed
- **Memory Management**: Automatic cleanup of old data and listeners

## Future Enhancements

- **Remote Error Reporting**: Send critical errors to monitoring service
- **Advanced Analytics**: More sophisticated error pattern analysis
- **User Feedback Integration**: Allow users to report issues directly
- **Performance Monitoring**: Real-time performance metrics dashboard
- **Automated Recovery**: More intelligent automatic recovery mechanisms