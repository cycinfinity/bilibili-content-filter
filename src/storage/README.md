# Storage Management System

The Storage Management System provides a cross-browser compatible abstraction layer for persisting user preferences in the Bilibili Content Filter Extension.

## Features

- **Cross-browser compatibility**: Works with Chrome, Edge, and Safari storage APIs
- **Automatic fallback**: Falls back from sync to local storage when needed
- **Error handling**: Comprehensive error handling with graceful degradation
- **Default settings**: Automatic initialization with sensible defaults
- **Change notifications**: Real-time synchronization across extension components
- **Data validation**: Ensures settings integrity and prevents corruption

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Extension     │    │  StorageManager  │    │  Browser APIs   │
│   Components    │◄──►│  (Abstraction)   │◄──►│  chrome.storage │
│                 │    │                  │    │  browser.storage│
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Usage

### Basic Usage

```javascript
import { getFilterSettings, saveFilterSettings, initializeStorage } from './storage/index.js';

// Initialize storage when extension starts
await initializeStorage();

// Get current settings
const settings = await getFilterSettings();

// Update a setting
const updatedSettings = {
  ...settings,
  homeRecommendations: false
};

await saveFilterSettings(updatedSettings);
```

### Listening for Changes

```javascript
import { onSettingsChange } from './storage/index.js';

// Listen for settings changes (useful for content scripts)
onSettingsChange((newSettings) => {
  console.log('Settings updated:', newSettings);
  applyFiltersToPage(newSettings);
});
```

### Error Handling

```javascript
import { getFilterSettings, DEFAULT_SETTINGS } from './storage/index.js';

try {
  const settings = await getFilterSettings();
  return settings;
} catch (error) {
  console.warn('Storage error, using defaults:', error);
  return { ...DEFAULT_SETTINGS };
}
```

## Default Settings

The system initializes with the following default settings:

```javascript
{
  homeRecommendations: true,    // Enabled by default (per requirements)
  rankingTrending: false,       // Disabled by default
  rightSidebar: false,          // Disabled by default
  comments: false,              // Disabled by default
  relatedVideos: false,         // Disabled by default
  version: '1.0.0',            // Settings schema version
  lastUpdated: Date.now()       // Timestamp for sync resolution
}
```

## Error Handling

The system handles various error scenarios:

### Storage Quota Exceeded
- Automatically falls back to local storage
- Logs warning for user awareness
- Continues operation without interruption

### Sync Storage Unavailable
- Uses local storage as fallback
- Maintains functionality in offline scenarios
- Syncs when connection is restored

### Corrupted Data
- Validates settings on retrieval
- Resets to defaults if corruption detected
- Logs error for debugging

### Permission Denied
- Gracefully degrades to session-only settings
- Continues operation with current state
- Provides user feedback when appropriate

## Browser Compatibility

### Chrome/Edge
- Uses `chrome.storage.sync` for cross-device synchronization
- Falls back to `chrome.storage.local` when needed
- Supports storage change events

### Safari
- Uses `browser.storage.sync` when available
- Falls back to `browser.storage.local`
- Handles Safari-specific API differences

### Feature Detection
```javascript
// Automatic detection of available APIs
if (typeof chrome !== 'undefined' && chrome.storage) {
  // Use Chrome API
} else if (typeof browser !== 'undefined' && browser.storage) {
  // Use Firefox/Safari API
}
```

## Testing

The storage system includes comprehensive unit tests:

```bash
npm test -- --testPathPattern=storage.test.js
```

### Test Coverage
- Cross-browser API detection
- Settings validation and sanitization
- Error handling and fallback scenarios
- Change listener functionality
- Storage quota management

## API Reference

### StorageManager

#### Methods

##### `getSettings(): Promise<FilterSettings>`
Retrieves current filter settings from storage.

**Returns:** Promise resolving to current settings or defaults

##### `saveSettings(settings: FilterSettings): Promise<void>`
Saves filter settings to storage with validation.

**Parameters:**
- `settings`: FilterSettings object to save

**Throws:** Error if settings are invalid or storage fails

##### `initializeDefaults(): Promise<void>`
Initializes storage with default settings if none exist.

##### `onSettingsChange(callback: Function): void`
Registers a callback for settings changes.

**Parameters:**
- `callback`: Function to call when settings change

##### `offSettingsChange(callback: Function): void`
Unregisters a settings change callback.

**Parameters:**
- `callback`: Function to remove from listeners

##### `clearSettings(): Promise<void>`
Clears all stored settings (primarily for testing).

## Requirements Validation

This implementation satisfies the following requirements:

- **7.1**: Settings are stored immediately using Storage_API
- **7.4**: Comprehensive error handling for storage operations
- **7.5**: Graceful handling of corrupted preferences with reset to defaults
- **9.2**: Chrome/Edge compatibility using chrome.storage.sync
- **9.3**: Safari compatibility using browser.storage alternatives

## Performance Considerations

- **Lazy initialization**: StorageManager is created only when needed
- **Efficient validation**: Quick boolean type checks for settings
- **Minimal storage operations**: Batched updates to reduce API calls
- **Memory management**: Proper cleanup of event listeners

## Security Considerations

- **Input validation**: All settings are validated before storage
- **Error isolation**: Storage errors don't crash the extension
- **Data integrity**: Schema versioning for future compatibility
- **Permission handling**: Graceful degradation when storage is unavailable