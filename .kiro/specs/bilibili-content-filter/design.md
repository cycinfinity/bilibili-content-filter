# Design Document

## Overview

The Bilibili Content Filter Extension is a cross-browser extension built using Manifest V3 standards to provide content filtering capabilities on Bilibili.com. The extension uses a content script architecture to inject CSS and JavaScript that selectively hides distracting elements based on user preferences stored in browser sync storage.

The design emphasizes simplicity, reliability, and maintainability while ensuring consistent behavior across Safari 14+, Chrome, and Edge browsers. The extension operates entirely client-side with no external dependencies or network requests.

## Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Popup UI      │    │  Background      │    │  Content Script │
│   (HTML/CSS/JS) │◄──►│  Service Worker  │◄──►│  (Injected JS)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Browser Storage│    │   Extension      │    │   Bilibili      │
│  (Sync/Local)   │    │   Manifest       │    │   DOM           │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Component Interaction Flow

1. **Initialization**: Content script injects at document_start on Bilibili domains
2. **Settings Retrieval**: Content script queries browser storage for user preferences
3. **DOM Manipulation**: CSS classes and styles applied based on active filters
4. **User Interaction**: Popup UI allows real-time toggle of filter settings
5. **State Synchronization**: Changes propagate from popup → storage → content script → DOM

## Components and Interfaces

### Content Script (`content.js`)

**Responsibilities:**
- Inject filtering CSS and JavaScript into Bilibili pages
- Monitor DOM changes for dynamically loaded content
- Apply/remove filters based on stored preferences
- Handle cross-browser storage API differences

**Key Methods:**
```javascript
interface ContentScript {
  initializeFilters(): Promise<void>
  applyFilter(filterType: FilterType, enabled: boolean): void
  observeDOM(): void
  handleStorageChange(changes: StorageChanges): void
}
```

### Popup Interface (`popup.html`, `popup.js`, `popup.css`)

**Responsibilities:**
- Provide intuitive toggle controls for each filter type
- Display current filter states accurately
- Persist setting changes to browser storage
- Communicate with content script for immediate updates

**Key Methods:**
```javascript
interface PopupController {
  loadCurrentSettings(): Promise<FilterSettings>
  toggleFilter(filterType: FilterType): Promise<void>
  updateUI(settings: FilterSettings): void
  sendMessageToContentScript(message: FilterMessage): void
}
```

### Background Service Worker (`background.js`)

**Responsibilities:**
- Handle extension lifecycle events
- Manage cross-tab communication
- Provide fallback storage operations
- Handle browser-specific API differences

**Key Methods:**
```javascript
interface BackgroundService {
  handleInstall(): void
  handleStorageChange(changes: StorageChanges): void
  broadcastSettingsUpdate(settings: FilterSettings): void
}
```

### Storage Manager (`storage.js`)

**Responsibilities:**
- Abstract browser storage API differences
- Provide consistent interface for settings persistence
- Handle storage errors and fallbacks
- Manage default settings initialization

**Key Methods:**
```javascript
interface StorageManager {
  getSettings(): Promise<FilterSettings>
  saveSettings(settings: FilterSettings): Promise<void>
  onSettingsChange(callback: (settings: FilterSettings) => void): void
  initializeDefaults(): Promise<void>
}
```

## Data Models

### FilterSettings
```typescript
interface FilterSettings {
  homeRecommendations: boolean    // Default: true
  rankingTrending: boolean       // Default: false
  rightSidebar: boolean          // Default: false
  comments: boolean              // Default: false
  relatedVideos: boolean         // Default: false
  version: string                // Settings schema version
  lastUpdated: number           // Timestamp for sync resolution
}
```

### FilterType
```typescript
enum FilterType {
  HOME_RECOMMENDATIONS = 'homeRecommendations',
  RANKING_TRENDING = 'rankingTrending',
  RIGHT_SIDEBAR = 'rightSidebar',
  COMMENTS = 'comments',
  RELATED_VIDEOS = 'relatedVideos'
}
```

### CSS Selector Mappings
```typescript
interface SelectorMappings {
  [FilterType.HOME_RECOMMENDATIONS]: string[]
  [FilterType.RANKING_TRENDING]: string[]
  [FilterType.RIGHT_SIDEBAR]: string[]
  [FilterType.COMMENTS]: string[]
  [FilterType.RELATED_VIDEOS]: string[]
}
```

### Extension Message Protocol
```typescript
interface FilterMessage {
  type: 'TOGGLE_FILTER' | 'GET_SETTINGS' | 'SETTINGS_UPDATED'
  filterType?: FilterType
  enabled?: boolean
  settings?: FilterSettings
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Based on the prework analysis, I'll consolidate redundant properties and focus on the most valuable correctness guarantees:

**Property 1: Filter toggle round-trip consistency**
*For any* filter type and any page state, enabling then immediately disabling a filter should restore the page to its original visibility state
**Validates: Requirements 1.3, 2.3, 3.3, 4.3**

**Property 2: Universal element hiding**
*For any* enabled filter and any matching DOM elements, all elements matching the filter's selectors should be hidden when the filter is active
**Validates: Requirements 1.1, 2.1, 3.1, 4.1, 5.1**

**Property 3: Dynamic content detection**
*For any* filter type and any dynamically injected content, newly added elements matching filter selectors should be hidden immediately upon DOM insertion
**Validates: Requirements 2.2, 4.2, 5.4**

**Property 4: Settings persistence round-trip**
*For any* valid filter settings, storing then retrieving settings should return identical values
**Validates: Requirements 7.1, 7.2**

**Property 5: Cross-domain consistency**
*For any* valid Bilibili domain and any filter configuration, the same filter settings should produce consistent hiding behavior across all domains
**Validates: Requirements 8.1, 8.2**

**Property 6: Layout integrity preservation**
*For any* page layout and any combination of active filters, hiding elements should not cause layout breaks, overlapping content, or broken spacing
**Validates: Requirements 1.5, 2.5, 5.5**

**Property 7: Storage error graceful degradation**
*For any* storage operation failure, the extension should continue functioning with current session settings without throwing unhandled exceptions
**Validates: Requirements 7.4, 10.5**

**Property 8: Browser API compatibility**
*For any* supported browser environment, the extension should use the appropriate storage API (chrome.storage.sync or browser.storage) without errors
**Validates: Requirements 9.2, 9.3, 9.4**

**Property 9: Immediate toggle response**
*For any* filter toggle action in the popup, the corresponding DOM changes should occur within a measurable time threshold
**Validates: Requirements 5.3, 6.2**

**Property 10: Settings UI synchronization**
*For any* stored filter settings, the popup UI should accurately reflect the current state of all toggles
**Validates: Requirements 6.3**

## Error Handling

### Storage Errors
- **Quota Exceeded**: Fall back to session storage with user notification
- **Sync Unavailable**: Use local storage as fallback
- **Corrupted Data**: Reset to default settings and log error
- **Permission Denied**: Gracefully degrade to session-only settings

### DOM Manipulation Errors
- **Selector Not Found**: Log warning but continue with other filters
- **CSS Injection Failed**: Retry with fallback selectors
- **Observer Errors**: Reinitialize DOM observer with exponential backoff
- **Cross-Frame Issues**: Handle iframe content separately with try-catch

### Cross-Browser Compatibility
- **API Not Available**: Provide polyfills or graceful degradation
- **Manifest Differences**: Use conditional compilation for browser-specific features
- **Storage API Variations**: Abstract storage layer to handle browser differences
- **Event Handling**: Use feature detection for browser-specific event handling

### Network and Performance
- **Large DOM Trees**: Implement throttled processing for performance
- **Memory Leaks**: Proper cleanup of event listeners and observers
- **Infinite Loops**: Circuit breakers for recursive DOM operations
- **Race Conditions**: Proper synchronization for concurrent operations

## Testing Strategy

### Unit Testing Approach
The extension will use **Jest** as the primary testing framework with **jsdom** for DOM manipulation testing. Unit tests will focus on:

- Individual function behavior with specific inputs
- Error handling for edge cases
- Browser API mocking and interaction
- CSS selector validation
- Storage operations with various data states

### Property-Based Testing Approach
The extension will use **fast-check** for property-based testing to verify universal properties across many inputs. Property tests will:

- Generate random DOM structures to test filtering behavior
- Create various filter setting combinations to test consistency
- Simulate different browser environments and API responses
- Test with random Bilibili domain patterns
- Verify layout integrity across different page structures

**Configuration Requirements:**
- Each property-based test MUST run a minimum of 100 iterations
- Each property-based test MUST be tagged with a comment referencing the design document property
- Tag format: `**Feature: bilibili-content-filter, Property {number}: {property_text}**`

### Integration Testing
- Cross-browser compatibility testing in actual browser environments
- End-to-end user workflow testing
- Performance testing with large DOM trees
- Storage synchronization testing across browser instances

### Test Environment Setup
```javascript
// Jest configuration for browser extension testing
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/test/setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/manifest.json'
  ]
};
```

### Mock Strategy
- **Browser APIs**: Mock chrome.storage, browser.storage, chrome.tabs
- **DOM Environment**: Use jsdom with realistic Bilibili page structures
- **Async Operations**: Mock timers and promises for deterministic testing
- **Cross-Browser APIs**: Feature detection mocks for different browsers