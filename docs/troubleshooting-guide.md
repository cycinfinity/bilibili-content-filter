# Troubleshooting Guide

This guide helps users and developers diagnose and resolve common issues with the Bilibili Content Filter Extension.

## Quick Diagnosis

### Is the Extension Working?

1. **Check Extension Icon**: Look for the extension icon in your browser toolbar
2. **Open Popup**: Click the icon - you should see filter toggles
3. **Test a Filter**: Toggle "Homepage Recommendations" and refresh Bilibili.com
4. **Check Console**: Open Developer Tools (F12) and look for errors

### Common Symptoms

| Symptom | Likely Cause | Quick Fix |
|---------|--------------|-----------|
| Extension icon missing | Not installed or disabled | Reinstall or enable extension |
| Popup won't open | Extension crashed | Restart browser |
| Filters don't work | Selectors outdated | Update extension |
| Page loads slowly | Performance issue | Disable some filters |
| Settings don't save | Storage issue | Check browser storage |

## Installation Issues

### Chrome/Edge Installation Problems

#### "Package is invalid" Error

**Symptoms:**
- Cannot install extension from ZIP file
- Error message about invalid package

**Causes:**
- Corrupted ZIP file
- Incorrect file structure
- Missing manifest.json

**Solutions:**
1. **Re-download** the extension package
2. **Check ZIP contents**:
   ```
   bilibili-content-filter-chrome.zip
   ├── manifest.json
   ├── popup/
   ├── content/
   ├── background/
   └── icons/
   ```
3. **Verify manifest.json** is valid JSON
4. **Try different browser** to isolate the issue

#### "Manifest file is invalid" Error

**Symptoms:**
- Extension installs but doesn't work
- Error in extension management page

**Causes:**
- JSON syntax errors in manifest
- Invalid permissions format
- Missing required fields

**Solutions:**
1. **Check manifest syntax**:
   ```bash
   # Validate JSON
   cat manifest.json | python -m json.tool
   ```
2. **Compare with working manifest**
3. **Check browser compatibility** (Manifest V3 required)

#### Extension Installs but Icon Missing

**Symptoms:**
- Extension appears in management page
- No icon in toolbar

**Causes:**
- Icon files missing or corrupted
- Incorrect icon paths in manifest
- Browser cache issues

**Solutions:**
1. **Check icon files exist**:
   ```
   icons/
   ├── icon16.png
   ├── icon32.png
   ├── icon48.png
   └── icon128.png
   ```
2. **Clear browser cache**
3. **Restart browser**
4. **Reinstall extension**

### Safari Installation Problems

#### "Cannot Convert Extension" Error

**Symptoms:**
- Safari converter fails
- Error during xcrun command

**Causes:**
- Xcode command line tools not installed
- Invalid extension structure
- Unsupported manifest features

**Solutions:**
1. **Install Xcode command line tools**:
   ```bash
   xcode-select --install
   ```
2. **Check Safari compatibility**:
   - Manifest V3 required
   - Some Chrome APIs not available
3. **Use Safari-specific build**:
   ```bash
   npm run build:safari
   ```

#### "Signing Failed" Error

**Symptoms:**
- Xcode build fails with signing error
- Cannot archive app

**Causes:**
- No Apple Developer account
- Invalid certificates
- Incorrect bundle identifier

**Solutions:**
1. **Check Apple Developer account** status
2. **Install valid certificates** in Keychain
3. **Set unique bundle identifier** in Xcode
4. **Configure signing** in project settings

#### Extension Loads but Doesn't Work

**Symptoms:**
- Extension appears in Safari preferences
- Filters don't work on Bilibili

**Causes:**
- Extension not enabled for website
- Safari-specific API differences
- Content script injection issues

**Solutions:**
1. **Enable extension for Bilibili**:
   - Safari → Preferences → Websites → Extensions
   - Find "Bilibili Content Filter"
   - Set to "Allow" for bilibili.com
2. **Check Safari console** for errors
3. **Test with Safari-specific build**

## Functionality Issues

### Filters Not Working

#### Content Still Visible After Enabling Filter

**Symptoms:**
- Toggle filter on in popup
- Content still shows on page
- No visual change

**Diagnosis Steps:**
1. **Check if settings are saving**:
   - Open popup
   - Toggle filter off and on
   - Check if toggle state persists after closing popup

2. **Inspect page elements**:
   - Right-click on content that should be hidden
   - Select "Inspect Element"
   - Check if CSS rules are applied

3. **Check browser console**:
   - Open Developer Tools (F12)
   - Look for JavaScript errors
   - Check for CSS injection errors

**Common Causes & Solutions:**

**Cause: Outdated Selectors**
- Bilibili changed their HTML structure
- Extension selectors no longer match

*Solution:*
```javascript
// Check current selectors in console
document.querySelectorAll('.feed-card').length
document.querySelectorAll('.bili-video-card').length

// If returns 0, selectors need updating
```

**Cause: Content Loads Dynamically**
- Content appears after page load
- DOM observer not catching changes

*Solution:*
- Refresh the page after enabling filter
- Check if filter works on page refresh

**Cause: CSS Injection Failed**
- Content Security Policy blocking styles
- Extension permissions insufficient

*Solution:*
- Check console for CSP errors
- Verify extension has correct permissions

#### Some Content Hidden, Some Still Visible

**Symptoms:**
- Filter partially works
- Some elements hidden, others visible
- Inconsistent behavior

**Causes:**
- Multiple CSS classes used for same content type
- New content structure not covered by selectors
- Dynamic content loading after filter application

**Solutions:**
1. **Update selectors** to cover all variations
2. **Check for new CSS classes**:
   ```javascript
   // Find all video cards on page
   document.querySelectorAll('[class*="video"]')
   document.querySelectorAll('[class*="card"]')
   document.querySelectorAll('[class*="feed"]')
   ```
3. **Improve DOM observation** for dynamic content

#### Filters Work on Some Pages, Not Others

**Symptoms:**
- Works on homepage but not user spaces
- Works on www.bilibili.com but not space.bilibili.com
- Inconsistent across different page types

**Causes:**
- Domain-specific selectors missing
- Different page layouts use different CSS
- Extension not injecting on all subdomains

**Solutions:**
1. **Check domain permissions** in manifest:
   ```json
   {
     "host_permissions": [
       "*://*.bilibili.com/*"
     ]
   }
   ```
2. **Add domain-specific selectors**
3. **Test on all Bilibili subdomains**

### Performance Issues

#### Page Loads Slowly

**Symptoms:**
- Bilibili pages take longer to load
- Browser becomes unresponsive
- High CPU usage

**Diagnosis:**
1. **Disable extension** and test page load speed
2. **Check browser task manager** for extension CPU usage
3. **Monitor network tab** for blocked requests

**Causes & Solutions:**

**Cause: Inefficient Selectors**
- Complex CSS selectors cause slow DOM queries
- Too many selectors being processed

*Solution:*
- Optimize selectors for performance
- Use more specific selectors
- Reduce number of fallback selectors

**Cause: Excessive DOM Observation**
- MutationObserver firing too frequently
- Processing too many DOM changes

*Solution:*
- Throttle observer callbacks
- Reduce observer scope
- Debounce rapid changes

**Cause: Memory Leaks**
- Event listeners not cleaned up
- Large objects retained in memory

*Solution:*
- Check for memory leaks in DevTools
- Ensure proper cleanup on page unload
- Limit log storage size

#### Browser Becomes Unresponsive

**Symptoms:**
- Browser freezes when visiting Bilibili
- Tab crashes or becomes unresponsive
- High memory usage

**Immediate Actions:**
1. **Disable extension** immediately
2. **Restart browser**
3. **Check browser console** for errors

**Investigation:**
1. **Enable extension with single filter** to isolate issue
2. **Monitor memory usage** in browser task manager
3. **Check for infinite loops** in console

**Solutions:**
- Update to latest extension version
- Report bug with specific page URL and browser version
- Use fewer filters simultaneously

### Settings and Storage Issues

#### Settings Don't Save

**Symptoms:**
- Toggle filters in popup
- Settings reset after closing popup
- Filters don't persist across browser sessions

**Diagnosis:**
1. **Check storage permissions**:
   - Extension management page
   - Verify "storage" permission granted

2. **Test storage manually**:
   ```javascript
   // In extension popup console
   chrome.storage.sync.get(null, (result) => {
     console.log('Stored settings:', result);
   });
   ```

3. **Check for storage errors**:
   - Browser console
   - Extension background page console

**Common Causes:**

**Cause: Storage Quota Exceeded**
- Browser storage limit reached
- Too much data stored by extension

*Solution:*
- Clear extension storage
- Reduce stored data size
- Implement storage cleanup

**Cause: Storage API Unavailable**
- Browser doesn't support sync storage
- Network issues preventing sync

*Solution:*
- Use local storage fallback
- Check network connectivity
- Update browser version

**Cause: Permission Issues**
- Extension lacks storage permission
- Browser blocking storage access

*Solution:*
- Reinstall extension with correct permissions
- Check browser privacy settings
- Disable other extensions that might interfere

#### Settings Sync Issues

**Symptoms:**
- Settings different across devices
- Changes on one device don't sync to others
- Inconsistent behavior across browser instances

**Causes:**
- Browser sync disabled
- Network connectivity issues
- Storage conflicts between devices

**Solutions:**
1. **Enable browser sync**:
   - Chrome: Settings → Sync and Google services
   - Edge: Settings → Profiles → Sync
   - Safari: Uses local storage only (no sync)

2. **Check sync status** in browser settings
3. **Manually sync** by toggling settings on each device

### Cross-Browser Issues

#### Works in Chrome but Not Safari

**Symptoms:**
- Extension functions perfectly in Chrome
- Same features don't work in Safari
- Different behavior between browsers

**Common Differences:**

**API Differences:**
- Chrome uses `chrome.storage.sync`
- Safari uses `browser.storage.local`
- Different promise/callback patterns

**Manifest Differences:**
- Safari requires different permission format
- Some Chrome features not available in Safari

**Solutions:**
1. **Use Safari-specific build**:
   ```bash
   npm run build:safari
   ```
2. **Check Safari console** for specific errors
3. **Test with Safari developer tools**

#### Extension Breaks After Browser Update

**Symptoms:**
- Extension worked before browser update
- Now shows errors or doesn't function
- Other extensions still work fine

**Causes:**
- Browser API changes
- Manifest V3 migration required
- Deprecated features removed

**Solutions:**
1. **Update extension** to latest version
2. **Check extension compatibility** with browser version
3. **Report compatibility issue** to developers

## Error Messages

### Common Error Messages and Solutions

#### "Extension context invalidated"

**Meaning:** Extension was reloaded or updated while page was open

**Solution:**
- Refresh the page
- Restart browser if problem persists

#### "Cannot access chrome.storage"

**Meaning:** Storage permission missing or API unavailable

**Solutions:**
- Check extension permissions
- Reinstall extension
- Update browser version

#### "Content script injection failed"

**Meaning:** Extension cannot inject scripts into page

**Solutions:**
- Check host permissions in manifest
- Verify page URL matches permission patterns
- Check for Content Security Policy conflicts

#### "Uncaught TypeError: Cannot read property"

**Meaning:** JavaScript error in extension code

**Solutions:**
- Update extension to latest version
- Check browser console for full error details
- Report bug with error details

### Debug Mode

#### Enabling Debug Mode

For developers and advanced users:

1. **Enable Developer Mode** in browser extension settings
2. **Load unpacked extension** from source code
3. **Open extension background page** console
4. **Enable verbose logging**:
   ```javascript
   // In background console
   localStorage.setItem('debug', 'true');
   ```

#### Debug Information

With debug mode enabled, you can:
- See detailed selector matching information
- Monitor storage operations
- Track filter application timing
- View error recovery attempts

#### Debug Console Commands

```javascript
// Check current settings
chrome.storage.sync.get(null, console.log);

// Test selectors on current page
document.querySelectorAll('.feed-card').length;

// Check if extension is active
window.bilibiliContentFilter?.isActive;

// View error logs
window.bilibiliContentFilter?.getErrorLogs();
```

## Getting Help

### Before Reporting Issues

1. **Update extension** to latest version
2. **Test in incognito/private mode** to rule out conflicts
3. **Disable other extensions** temporarily
4. **Clear browser cache** and cookies
5. **Try different browser** to isolate issue

### Information to Include in Bug Reports

#### System Information
- Browser name and version
- Operating system
- Extension version
- Date and time of issue

#### Issue Details
- Specific page URL where issue occurs
- Steps to reproduce the problem
- Expected behavior vs actual behavior
- Screenshots or screen recordings

#### Technical Information
- Browser console errors (F12 → Console)
- Extension console errors (if accessible)
- Network tab information (if relevant)
- Other extensions installed

#### Example Bug Report

```
**Browser:** Chrome 120.0.6099.109
**OS:** macOS 14.1
**Extension Version:** 1.2.3
**Date:** 2024-01-15

**Issue:** Homepage recommendations filter not working

**Steps to Reproduce:**
1. Go to https://www.bilibili.com
2. Open extension popup
3. Enable "Homepage Recommendations" filter
4. Refresh page

**Expected:** Recommendation feed should be hidden
**Actual:** All recommendations still visible

**Console Errors:**
```
Uncaught TypeError: Cannot read property 'querySelectorAll' of null
    at FilterManager.applyFilter (filter.js:45)
```

**Additional Info:**
- Works fine on space.bilibili.com
- Started happening after Bilibili layout update
- Other filters work normally
```

### Support Channels

1. **GitHub Issues**: For bug reports and feature requests
2. **Browser Store Reviews**: For general feedback
3. **Email Support**: For private issues or security concerns
4. **Community Forums**: For usage questions and tips

### Self-Help Resources

1. **Documentation**: Read all guides in `/docs` folder
2. **FAQ**: Check frequently asked questions
3. **Source Code**: Review implementation for understanding
4. **Test Suite**: Run tests to verify functionality
5. **Community**: Search existing issues and discussions

## Prevention Tips

### Avoiding Common Issues

1. **Keep Extension Updated**: Enable automatic updates
2. **Regular Browser Updates**: Keep browser current
3. **Monitor Bilibili Changes**: Watch for layout updates
4. **Backup Settings**: Export settings before major changes
5. **Test After Updates**: Verify functionality after updates

### Best Practices

1. **Use Minimal Filters**: Only enable filters you need
2. **Regular Cleanup**: Clear browser cache periodically
3. **Monitor Performance**: Watch for slowdowns
4. **Report Issues Early**: Help improve extension for everyone
5. **Stay Informed**: Follow extension updates and announcements

This troubleshooting guide covers the most common issues users and developers encounter with the Bilibili Content Filter Extension. For issues not covered here, please refer to the other documentation guides or contact support with detailed information about your specific problem.