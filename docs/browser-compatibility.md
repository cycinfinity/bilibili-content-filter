# Browser Compatibility Guide

This document outlines the cross-browser compatibility features and deployment procedures for the Bilibili Content Filter Extension.

## Supported Browsers

### Chrome (Version 88+)
- **Manifest Version**: 3
- **Storage API**: `chrome.storage.sync` with `chrome.storage.local` fallback
- **Permissions**: `storage`, `activeTab`
- **Host Permissions**: `*://*.bilibili.com/*`
- **Package Format**: ZIP file for Chrome Web Store

### Microsoft Edge (Version 88+)
- **Manifest Version**: 3
- **Storage API**: `chrome.storage.sync` with `chrome.storage.local` fallback
- **Permissions**: `storage`, `activeTab`
- **Host Permissions**: `*://*.bilibili.com/*`
- **Package Format**: ZIP file for Edge Add-ons store
- **Note**: Uses same Chromium base as Chrome

### Safari (Version 14+)
- **Manifest Version**: 3
- **Storage API**: `browser.storage.local` (sync not available)
- **Permissions**: `storage` (activeTab handled differently)
- **Host Permissions**: `*://*.bilibili.com/*`
- **Package Format**: Xcode project for App Store
- **Requirements**: macOS 10.14+, Apple Developer account

## Feature Detection

The extension includes a comprehensive browser compatibility layer that automatically detects and adapts to different browser environments.

### Automatic Detection

```javascript
import { browserCompatibility, BROWSER_FEATURES } from './utils/browser-compatibility.js';

// Check browser type
const browserType = browserCompatibility.getBrowserType();

// Check feature availability
const hasSyncStorage = browserCompatibility.hasFeature(BROWSER_FEATURES.SYNC_STORAGE);
const hasLocalStorage = browserCompatibility.hasFeature(BROWSER_FEATURES.LOCAL_STORAGE);

// Get appropriate API
const storageAPI = browserCompatibility.getAPI('storage');
```

### Supported Features

| Feature | Chrome | Edge | Safari | Notes |
|---------|--------|------|--------|-------|
| Sync Storage | ✅ | ✅ | ❌ | Safari uses local storage only |
| Local Storage | ✅ | ✅ | ✅ | Available in all browsers |
| Active Tab | ✅ | ✅ | ⚠️ | Different implementation in Safari |
| Tabs API | ✅ | ✅ | ✅ | Full support |
| Runtime Messaging | ✅ | ✅ | ✅ | Cross-component communication |
| Content Scripts | ✅ | ✅ | ✅ | DOM manipulation |
| Web Accessible Resources | ✅ | ✅ | ✅ | Resource access |

## Build System

### Building for All Browsers

```bash
# Build all browser versions
npm run build

# Build specific browser
npm run build:chrome
npm run build:edge
npm run build:safari
```

### Browser-Specific Build Steps

1. **File Copying**: Source files copied to browser-specific directories
2. **Manifest Processing**: Browser-specific manifest modifications
3. **Compatibility Injection**: Browser detection code injection
4. **Safari Project Generation**: Xcode project structure creation (Safari only)

### Build Output Structure

```
dist/
├── chrome/          # Chrome extension files
├── edge/            # Edge extension files
└── safari/          # Safari extension files
    └── BilibiliContentFilter.app/
        └── Contents/
            └── Resources/
                └── Extension/
```

## Deployment

### Chrome Web Store

```bash
# Create Chrome package
npm run deploy:chrome

# Manual steps:
# 1. Go to https://chrome.google.com/webstore/devconsole/
# 2. Upload packages/bilibili-content-filter-chrome.zip
# 3. Fill in store listing details
# 4. Submit for review
```

### Edge Add-ons Store

```bash
# Create Edge package
npm run deploy:edge

# Manual steps:
# 1. Go to https://partner.microsoft.com/dashboard/microsoftedge/
# 2. Upload packages/bilibili-content-filter-edge.zip
# 3. Fill in store listing details
# 4. Submit for review
```

### Safari App Store

```bash
# Create Safari project
npm run deploy:safari

# Manual steps:
# 1. Open packages/safari-project/*.xcodeproj in Xcode
# 2. Configure signing and provisioning profiles
# 3. Build and archive the app
# 4. Upload to App Store Connect
# 5. Submit for review
```

### Deploy All Browsers

```bash
# Build and package for all browsers
npm run deploy
```

## Browser-Specific Considerations

### Chrome/Edge
- Uses `chrome.storage.sync` for cross-device synchronization
- Supports `activeTab` permission for minimal permissions
- ZIP packaging for store submission
- Automatic updates through store

### Safari
- Limited to `browser.storage.local` (no sync)
- Requires conversion to native app wrapper
- App Store review process required
- Manual user enablement in Safari preferences
- Requires Apple Developer account ($99/year)

## API Differences

### Storage API

**Chrome/Edge:**
```javascript
chrome.storage.sync.get(['key'], (result) => {
  // Handle result
});
```

**Safari:**
```javascript
browser.storage.local.get(['key']).then((result) => {
  // Handle result
});
```

**Abstracted (Recommended):**
```javascript
const storageAPI = browserCompatibility.getAPI('storage');
const result = await storageAPI.sync.get(['key']);
```

### Runtime API

**Chrome/Edge:**
```javascript
chrome.runtime.sendMessage(message, (response) => {
  // Handle response
});
```

**Safari:**
```javascript
browser.runtime.sendMessage(message).then((response) => {
  // Handle response
});
```

**Abstracted (Recommended):**
```javascript
const runtimeAPI = browserCompatibility.getAPI('runtime');
const response = await runtimeAPI.sendMessage(message);
```

## Error Handling

The extension includes comprehensive error handling for cross-browser compatibility:

### Storage Errors
- **Quota Exceeded**: Automatic fallback to local storage
- **Sync Unavailable**: Graceful degradation to local-only storage
- **Permission Denied**: Continue with session-only settings
- **Corrupted Data**: Reset to default settings

### API Errors
- **API Not Available**: Feature detection prevents calls to unavailable APIs
- **Permission Issues**: Graceful degradation with reduced functionality
- **Network Issues**: Local fallbacks where possible

## Testing

### Cross-Browser Testing

```bash
# Run tests with browser-specific mocks
npm test

# Test specific browser compatibility
npm test -- --testNamePattern="browser compatibility"
```

### Manual Testing Checklist

- [ ] Extension loads in all target browsers
- [ ] Settings persist across browser restarts
- [ ] Filters work on all Bilibili domains
- [ ] Popup interface functions correctly
- [ ] Cross-tab synchronization works (Chrome/Edge)
- [ ] Error handling graceful in all browsers

## Troubleshooting

### Common Issues

**Extension not loading:**
- Check manifest.json syntax
- Verify permissions are correct for target browser
- Check console for error messages

**Settings not persisting:**
- Verify storage permissions
- Check if sync storage is available
- Test local storage fallback

**Safari-specific issues:**
- Ensure Xcode command line tools installed
- Check bundle identifier uniqueness
- Verify signing certificates

### Debug Information

Enable debug logging by setting:
```javascript
// In development builds
process.env.NODE_ENV = 'development';
```

This will log browser compatibility information to the console.

## Future Compatibility

### Manifest V3 Migration
- All browsers now support Manifest V3
- Service workers replace background pages
- Declarative content scripts preferred

### API Evolution
- Monitor browser API changes
- Update compatibility layer as needed
- Test with browser beta versions

### New Browser Support
To add support for new browsers:

1. Update `BROWSER_TYPES` in `browser-compatibility.js`
2. Add browser detection logic
3. Create browser-specific build configuration
4. Add deployment script
5. Update documentation

## Resources

- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/)
- [Edge Add-ons Documentation](https://docs.microsoft.com/en-us/microsoft-edge/extensions-chromium/)
- [Safari Extension Documentation](https://developer.apple.com/documentation/safariservices/safari_web_extensions)
- [Manifest V3 Migration Guide](https://developer.chrome.com/docs/extensions/migrating/)