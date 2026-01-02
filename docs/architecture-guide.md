# Extension Architecture and Maintenance Guide

This guide provides a comprehensive overview of the Bilibili Content Filter Extension's architecture, design decisions, and maintenance procedures.

## Architecture Overview

The extension follows a modular, event-driven architecture designed for cross-browser compatibility and maintainability.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser Extension                        │
├─────────────────┬──────────────────┬─────────────────────────────┤
│   Popup UI      │  Background      │      Content Scripts        │
│   (User Interface) │  Service Worker  │   (Page Manipulation)      │
├─────────────────┼──────────────────┼─────────────────────────────┤
│ • popup.html    │ • background.js  │ • content.js                │
│ • popup.js      │ • Extension      │ • filter.js                 │
│ • popup.css     │   lifecycle      │ • selectors.js              │
│                 │ • Cross-tab sync │ • content.css               │
└─────────────────┴──────────────────┴─────────────────────────────┘
                           │
┌─────────────────────────────────────────────────────────────────┐
│                    Shared Components                            │
├─────────────────┬──────────────────┬─────────────────────────────┤
│   Storage       │   Utilities      │      Error Handling         │
│   Management    │   & Helpers      │      & Logging              │
├─────────────────┼──────────────────┼─────────────────────────────┤
│ • storage.js    │ • browser-       │ • error-handler.js          │
│ • index.js      │   compatibility  │ • logger.js                 │
│ • types.d.ts    │ • graceful-      │ • graceful-degradation.js   │
│                 │   degradation    │                             │
└─────────────────┴──────────────────┴─────────────────────────────┘
                           │
┌─────────────────────────────────────────────────────────────────┐
│                    Browser APIs                                 │
├─────────────────┬──────────────────┬─────────────────────────────┤
│   Chrome/Edge   │     Safari       │       Common APIs           │
├─────────────────┼──────────────────┼─────────────────────────────┤
│ • chrome.storage│ • browser.storage│ • DOM APIs                  │
│ • chrome.tabs   │ • browser.tabs   │ • CSS APIs                  │
│ • chrome.runtime│ • browser.runtime│ • Event APIs                │
└─────────────────┴──────────────────┴─────────────────────────────┘
```

## Component Architecture

### 1. Content Scripts (`src/content/`)

The content scripts are responsible for DOM manipulation and content filtering.

#### content.js - Main Coordinator
```javascript
class ContentScriptManager {
  constructor() {
    this.filterManager = new FilterManager();
    this.storageManager = new StorageManager();
    this.initialized = false;
  }

  async initialize() {
    // Load settings from storage
    // Set up DOM observers
    // Apply initial filters
    // Listen for settings changes
  }
}
```

**Responsibilities:**
- Initialize extension on page load
- Coordinate between filter manager and storage
- Handle settings changes from popup
- Manage DOM observers for dynamic content

#### filter.js - Filter Application Logic
```javascript
class FilterManager {
  constructor() {
    this.activeFilters = new Set();
    this.observer = null;
    this.styleElement = null;
  }

  applyFilter(filterType, enabled) {
    // Get selectors for filter type
    // Generate CSS rules
    // Inject or remove styles
    // Update active filters set
  }
}
```

**Responsibilities:**
- Apply and remove content filters
- Generate CSS rules from selectors
- Manage DOM mutation observers
- Handle dynamic content filtering

#### selectors.js - Selector Definitions
```javascript
export const PRIMARY_SELECTORS = {
  homeRecommendations: [...],
  rankingTrending: [...],
  // ... other filter types
};

export function getSelectorsForFilter(filterType, domain) {
  // Return appropriate selectors for filter and domain
}
```

**Responsibilities:**
- Define CSS selectors for each filter type
- Provide domain-specific selector variations
- Implement intelligent selector fallbacks
- Validate selector safety

### 2. Popup Interface (`src/popup/`)

The popup provides the user interface for controlling filters.

#### popup.html - UI Structure
```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="popup.css">
</head>
<body>
  <div class="popup-container">
    <header>
      <h1>Bilibili Content Filter</h1>
    </header>
    <main>
      <!-- Filter toggles -->
    </main>
  </div>
  <script src="popup.js"></script>
</body>
</html>
```

#### popup.js - UI Logic
```javascript
class PopupController {
  constructor() {
    this.storageManager = new StorageManager();
    this.toggles = new Map();
  }

  async initialize() {
    // Load current settings
    // Set up toggle event listeners
    // Update UI state
  }

  async toggleFilter(filterType) {
    // Update settings
    // Save to storage
    // Send message to content script
    // Update UI
  }
}
```

**Responsibilities:**
- Render filter toggle controls
- Handle user interactions
- Communicate with content scripts
- Persist settings changes

#### popup.css - Styling
```css
.popup-container {
  width: 300px;
  padding: 16px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto;
}

.filter-toggle {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #eee;
}
```

**Responsibilities:**
- Provide clean, intuitive interface design
- Ensure accessibility compliance
- Support light/dark themes
- Responsive design for different screen sizes

### 3. Background Service Worker (`src/background/`)

The background script manages extension lifecycle and cross-tab communication.

#### background.js - Service Worker
```javascript
class BackgroundService {
  constructor() {
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Extension install/update events
    // Storage change events
    // Message passing events
    // Tab events
  }

  handleInstall() {
    // Initialize default settings
    // Set up extension state
  }

  handleStorageChange(changes) {
    // Broadcast changes to all tabs
    // Update extension badge/icon
  }
}
```

**Responsibilities:**
- Handle extension installation and updates
- Manage cross-tab settings synchronization
- Coordinate between popup and content scripts
- Handle browser-specific API differences

### 4. Storage Management (`src/storage/`)

Provides cross-browser storage abstraction and settings management.

#### storage.js - Storage Abstraction
```javascript
class StorageManager {
  constructor() {
    this.api = this.detectStorageAPI();
    this.listeners = new Set();
  }

  detectStorageAPI() {
    // Detect available storage API
    // Return appropriate API wrapper
  }

  async getSettings() {
    // Retrieve settings with fallbacks
    // Validate and sanitize data
    // Return settings object
  }

  async saveSettings(settings) {
    // Validate settings
    // Save to storage with error handling
    // Notify listeners
  }
}
```

**Responsibilities:**
- Abstract browser storage API differences
- Provide consistent settings interface
- Handle storage errors and fallbacks
- Manage settings validation and defaults

#### index.js - Public API
```javascript
export { getFilterSettings, saveFilterSettings, initializeStorage } from './storage.js';
export { DEFAULT_SETTINGS, FILTER_TYPES } from './types.js';
export { onSettingsChange, offSettingsChange } from './storage.js';
```

**Responsibilities:**
- Provide clean public API for storage operations
- Export types and constants
- Simplify storage usage across components

### 5. Utilities (`src/utils/`)

Shared utilities for error handling, logging, and browser compatibility.

#### error-handler.js - Error Management
```javascript
class ErrorHandler {
  constructor() {
    this.errorCounts = new Map();
    this.suppressedErrors = new Set();
  }

  handleError(error, context) {
    // Classify error type
    // Apply recovery strategy
    // Log error details
    // Notify user if needed
  }
}
```

#### logger.js - Logging System
```javascript
class Logger {
  constructor(config) {
    this.config = config;
    this.logs = [];
    this.sessionId = this.generateSessionId();
  }

  log(level, category, message, data) {
    // Format log entry
    // Store in memory/storage
    // Output to console if enabled
  }
}
```

#### browser-compatibility.js - Cross-Browser Support
```javascript
class BrowserCompatibility {
  constructor() {
    this.browserType = this.detectBrowser();
    this.features = this.detectFeatures();
  }

  getAPI(apiName) {
    // Return appropriate API for current browser
  }

  hasFeature(feature) {
    // Check if feature is available
  }
}
```

## Data Flow

### Settings Update Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   User      │    │   Popup     │    │   Storage   │    │   Content   │
│   Action    │───▶│   Interface │───▶│   Manager   │───▶│   Script    │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                          │                   │                   │
                          │                   ▼                   ▼
                          │            ┌─────────────┐    ┌─────────────┐
                          │            │   Browser   │    │   Filter    │
                          │            │   Storage   │    │   Manager   │
                          │            └─────────────┘    └─────────────┘
                          │                   │                   │
                          │                   │                   ▼
                          │                   │            ┌─────────────┐
                          │                   │            │    DOM      │
                          │                   │            │ Manipulation│
                          │                   │            └─────────────┘
                          │                   │
                          ▼                   ▼
                   ┌─────────────┐    ┌─────────────┐
                   │ Background  │    │   Other     │
                   │ Service     │    │   Tabs      │
                   │ Worker      │    │ (Broadcast) │
                   └─────────────┘    └─────────────┘
```

### Filter Application Flow

```
Page Load
    │
    ▼
Initialize Content Script
    │
    ▼
Load Settings from Storage
    │
    ▼
Apply Initial Filters
    │
    ▼
Set up DOM Observer ──────┐
    │                     │
    ▼                     │
Listen for Settings       │
Changes                   │
    │                     │
    ▼                     │
┌─────────────────────────┼─────────────────────────┐
│ Settings Changed        │ New Content Detected    │
│        │                │         │               │
│        ▼                │         ▼               │
│ Update Active Filters   │ Apply Filters to New    │
│        │                │ Content                 │
│        ▼                │         │               │
│ Regenerate CSS Rules    │         │               │
│        │                │         │               │
│        ▼                │         │               │
│ Update Style Element ◄──┼─────────┘               │
└─────────────────────────┼─────────────────────────┘
                          │
                          ▼
                    DOM Updated
```

## Design Patterns

### 1. Observer Pattern

Used for DOM observation and settings changes:

```javascript
// DOM Observer
class FilterManager {
  observeDOM() {
    this.observer = new MutationObserver((mutations) => {
      this.handleDOMChanges(mutations);
    });
    
    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
}

// Settings Observer
class StorageManager {
  onSettingsChange(callback) {
    this.listeners.add(callback);
  }
  
  notifyListeners(changes) {
    this.listeners.forEach(callback => callback(changes));
  }
}
```

### 2. Strategy Pattern

Used for error recovery and browser compatibility:

```javascript
// Error Recovery Strategies
const RECOVERY_STRATEGIES = {
  RETRY: (error, context) => retryWithBackoff(context.operation),
  FALLBACK: (error, context) => useFallbackMethod(context),
  GRACEFUL_DEGRADATION: (error, context) => reduceFeatures(context)
};

// Browser API Strategies
const API_STRATEGIES = {
  chrome: () => chrome.storage.sync,
  safari: () => browser.storage.local,
  edge: () => chrome.storage.sync
};
```

### 3. Factory Pattern

Used for creating browser-specific components:

```javascript
class StorageFactory {
  static create() {
    const browserType = detectBrowser();
    
    switch (browserType) {
      case 'chrome':
      case 'edge':
        return new ChromeStorageManager();
      case 'safari':
        return new SafariStorageManager();
      default:
        return new GenericStorageManager();
    }
  }
}
```

### 4. Singleton Pattern

Used for global managers:

```javascript
class Logger {
  static instance = null;
  
  static getInstance(config) {
    if (!Logger.instance) {
      Logger.instance = new Logger(config);
    }
    return Logger.instance;
  }
}
```

## Error Handling Strategy

### Error Categories

1. **Storage Errors**: Quota exceeded, permission denied, corruption
2. **DOM Errors**: Selector failures, injection errors, observer failures
3. **Network Errors**: Communication failures, timeout errors
4. **Compatibility Errors**: API unavailable, feature not supported
5. **User Errors**: Invalid input, configuration errors

### Recovery Strategies

1. **Retry**: Exponential backoff for transient failures
2. **Fallback**: Alternative methods when primary fails
3. **Graceful Degradation**: Reduce functionality but keep working
4. **User Intervention**: Request user action for resolution
5. **Reset**: Return to known good state

### Error Flow

```
Error Occurs
    │
    ▼
Classify Error Type
    │
    ▼
Select Recovery Strategy
    │
    ▼
Apply Recovery ──────┐
    │                │
    ▼                │
Success? ────No──────┘
    │
   Yes
    ▼
Log Resolution
    │
    ▼
Continue Operation
```

## Performance Considerations

### 1. Selector Performance

- Use specific selectors to minimize DOM traversal
- Cache selector results when possible
- Batch DOM operations to reduce reflow
- Use CSS for hiding instead of JavaScript when possible

### 2. Memory Management

- Clean up event listeners on page unload
- Limit log storage to prevent memory leaks
- Use WeakMap/WeakSet for temporary references
- Implement garbage collection for old data

### 3. Storage Optimization

- Batch storage operations to reduce API calls
- Use compression for large data sets
- Implement storage quotas and cleanup
- Cache frequently accessed data

### 4. DOM Observation

- Throttle mutation observer callbacks
- Use intersection observers for visibility detection
- Debounce rapid DOM changes
- Limit observer scope to relevant elements

## Security Considerations

### 1. Content Security Policy

```json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'"
  }
}
```

### 2. Permissions

- Request minimal necessary permissions
- Use `activeTab` instead of broad host permissions when possible
- Validate all user inputs
- Sanitize data before storage

### 3. Code Injection Prevention

- Use `textContent` instead of `innerHTML`
- Validate CSS selectors before use
- Escape user-provided data
- Use CSP to prevent script injection

## Testing Strategy

### 1. Unit Tests

Test individual components in isolation:

```javascript
// Example: Storage Manager Tests
describe('StorageManager', () => {
  test('should save and retrieve settings', async () => {
    const storage = new StorageManager();
    const settings = { homeRecommendations: true };
    
    await storage.saveSettings(settings);
    const retrieved = await storage.getSettings();
    
    expect(retrieved).toEqual(settings);
  });
});
```

### 2. Integration Tests

Test component interactions:

```javascript
// Example: Content Script Integration
describe('Content Script Integration', () => {
  test('should apply filters when settings change', async () => {
    const contentScript = new ContentScriptManager();
    await contentScript.initialize();
    
    // Simulate settings change
    await contentScript.handleSettingsChange({
      homeRecommendations: { newValue: false }
    });
    
    // Verify filters are applied
    expect(document.querySelector('.feed-card')).toHaveStyle('display: none');
  });
});
```

### 3. Property-Based Tests

Test universal properties:

```javascript
// Example: Filter Toggle Property
test('Filter toggle round-trip consistency', () => {
  fc.assert(fc.property(
    fc.constantFrom(...Object.keys(FILTER_TYPES)),
    fc.boolean(),
    (filterType, enabled) => {
      // Enable filter
      filterManager.applyFilter(filterType, enabled);
      const afterEnable = getVisibleElements(filterType);
      
      // Disable filter
      filterManager.applyFilter(filterType, !enabled);
      const afterDisable = getVisibleElements(filterType);
      
      // Should return to original state
      return enabled ? afterDisable.length > afterEnable.length : true;
    }
  ));
});
```

## Maintenance Procedures

### 1. Regular Maintenance

#### Weekly Tasks
- Monitor user feedback and bug reports
- Check extension functionality on Bilibili.com
- Review error logs and performance metrics
- Update documentation as needed

#### Monthly Tasks
- Test extension with latest browser versions
- Review and update CSS selectors
- Analyze usage statistics and performance
- Update dependencies and security patches

#### Quarterly Tasks
- Comprehensive testing across all browsers
- Performance optimization review
- Security audit and vulnerability assessment
- Architecture review and refactoring

### 2. Emergency Maintenance

When Bilibili makes breaking changes:

1. **Immediate Response** (within 2 hours):
   - Identify affected functionality
   - Find temporary workarounds
   - Deploy emergency patch

2. **Short-term Fix** (within 24 hours):
   - Update CSS selectors
   - Test across different pages
   - Deploy stable fix

3. **Long-term Improvement** (within 1 week):
   - Add fallback selectors
   - Improve error handling
   - Update documentation

### 3. Version Management

#### Semantic Versioning
- **Major** (1.0.0): Breaking changes, major new features
- **Minor** (1.1.0): New features, backward compatible
- **Patch** (1.1.1): Bug fixes, selector updates

#### Release Process
1. Update version in `package.json` and manifests
2. Update `CHANGELOG.md` with changes
3. Run full test suite
4. Build and test all browser versions
5. Deploy to stores
6. Monitor for issues

### 4. Monitoring and Analytics

#### Error Monitoring
- Track error rates by category
- Monitor recovery success rates
- Identify common failure patterns
- Set up alerts for critical errors

#### Performance Monitoring
- Track page load impact
- Monitor memory usage
- Measure filter application time
- Analyze storage operation performance

#### Usage Analytics
- Track feature usage patterns
- Monitor user retention
- Analyze filter preferences
- Identify popular pages/domains

## Development Workflow

### 1. Setting Up Development Environment

```bash
# Clone repository
git clone <repository-url>
cd bilibili-content-filter

# Install dependencies
npm install

# Set up development build
npm run build:chrome
```

### 2. Making Changes

```bash
# Create feature branch
git checkout -b feature/new-selector-support

# Make changes
# Test changes
npm test

# Build and test manually
npm run build
# Load extension in browser for testing

# Commit changes
git commit -m "Add support for new video card selectors"
```

### 3. Code Review Process

1. **Self Review**: Check code quality, test coverage, documentation
2. **Peer Review**: Have another developer review changes
3. **Testing**: Ensure all tests pass and manual testing is complete
4. **Documentation**: Update relevant documentation
5. **Merge**: Merge to main branch after approval

### 4. Deployment Process

```bash
# Ensure main branch is up to date
git checkout main
git pull origin main

# Run full test suite
npm test

# Build all browser versions
npm run build

# Create deployment packages
npm run deploy

# Upload to browser stores
# Monitor deployment for issues
```

## Troubleshooting Common Issues

### 1. Extension Not Loading

**Symptoms**: Extension doesn't appear in browser
**Causes**: Manifest errors, permission issues, build problems
**Solutions**:
- Check manifest.json syntax
- Verify permissions are correct
- Check browser console for errors
- Rebuild extension

### 2. Filters Not Working

**Symptoms**: Content not being hidden
**Causes**: Selector changes, DOM structure changes, timing issues
**Solutions**:
- Update CSS selectors
- Check DOM observer functionality
- Verify settings are being applied
- Test with debug mode enabled

### 3. Performance Issues

**Symptoms**: Slow page loading, browser lag
**Causes**: Inefficient selectors, memory leaks, excessive DOM observation
**Solutions**:
- Optimize CSS selectors
- Implement throttling
- Check for memory leaks
- Reduce observer scope

### 4. Cross-Browser Issues

**Symptoms**: Works in one browser but not others
**Causes**: API differences, manifest differences, feature support
**Solutions**:
- Check browser compatibility layer
- Update browser-specific code
- Test with different API implementations
- Review manifest differences

This architecture guide provides a comprehensive understanding of the extension's design and maintenance requirements, enabling effective development and long-term maintenance.