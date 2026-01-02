# 🚀 Bilibili Content Filter Extension - Complete Setup Guide

## 📋 Table of Contents
1. [Repository Setup](#repository-setup)
2. [Installing the Extension](#installing-the-extension)
3. [Using the Extension](#using-the-extension)
4. [Development Workflow](#development-workflow)
5. [Testing](#testing)
6. [Troubleshooting](#troubleshooting)

## 🔧 Repository Setup

### 1. Create GitHub Repository (Optional)
```bash
# Create a new repository on GitHub, then:
git remote add origin https://github.com/yourusername/bilibili-content-filter.git
git branch -M main
git push -u origin main
```

### 2. Local Development Setup
```bash
# Install dependencies
npm install

# Build the extension
npm run build

# Run tests (optional - some tests need fixing)
npm test
```

## 📦 Installing the Extension

### For Chrome/Edge (Recommended - Easiest)

1. **Open Extension Management**
   - Chrome: Go to `chrome://extensions/`
   - Edge: Go to `edge://extensions/`

2. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top right

3. **Load the Extension**
   - Click "Load unpacked"
   - Navigate to your project folder
   - Select the `dist/chrome` folder
   - Click "Select Folder"

4. **Verify Installation**
   - You should see "Bilibili Content Filter" in your extensions list
   - The extension icon should appear in your browser toolbar

### For Safari (More Complex)

1. **Enable Safari Developer Features**
   ```bash
   # Run this command in Terminal
   sudo xcode-select --install
   ```

2. **Convert to Safari Extension**
   ```bash
   # Navigate to your project directory
   cd /path/to/your/project
   
   # Run the Safari deployment script
   ./scripts/deploy-safari.sh
   ```

3. **Open in Xcode**
   - Open the generated `.xcodeproj` file in `dist/safari/`
   - Build and run the project
   - Follow Xcode's instructions to install

## 🎯 Using the Extension

### 1. **Basic Usage**
1. Navigate to any Bilibili page (e.g., https://www.bilibili.com)
2. Click the extension icon in your browser toolbar
3. Toggle filters on/off using the popup interface

### 2. **Available Filters**
- **🏠 Homepage Recommendations** (Default: ON) - Hides recommendation feeds
- **📈 Ranking & Trending** - Hides trending content sections
- **📱 Right Sidebar** - Hides the entire right sidebar
- **💬 Comments** - Hides comment sections
- **🔗 Related Videos** - Hides related video recommendations

### 3. **Settings Persistence**
- Your filter preferences are automatically saved
- Settings sync across browser tabs
- Settings persist after browser restart

## 🛠 Development Workflow

### Building for Different Browsers
```bash
# Build for all browsers
npm run build

# Build for specific browsers
npm run build:chrome
npm run build:edge
npm run build:safari
```

### Making Changes
1. **Edit source files** in the `src/` directory
2. **Rebuild** the extension: `npm run build`
3. **Reload** the extension in your browser:
   - Go to extensions page
   - Click the refresh icon on your extension
   - Or disable/enable the extension

### File Structure
```
src/
├── background/     # Background service worker
├── content/        # Content scripts (injected into pages)
├── popup/          # Extension popup UI
├── storage/        # Settings management
└── utils/          # Utility functions

dist/               # Built extensions (generated)
├── chrome/         # Chrome/Edge version
├── edge/           # Edge-specific version
└── safari/         # Safari version
```

## 🧪 Testing

### Manual Testing
1. **Build and install** the extension
2. **Visit Bilibili** pages:
   - https://www.bilibili.com (homepage)
   - https://space.bilibili.com (user profiles)
   - Any video page
3. **Test each filter** by toggling them on/off
4. **Check persistence** by refreshing pages and restarting browser

### Automated Testing
```bash
# Run all tests (note: some tests need fixing)
npm test

# Run specific test files
npm test -- --testPathPattern="filter.test.js"

# Run tests in watch mode
npm run test:watch
```

### Debugging
1. **Open Developer Tools** (F12)
2. **Check Console** for any error messages
3. **Inspect Extension**:
   - Right-click extension icon → "Inspect popup"
   - Go to `chrome://extensions/` → Click "background page" link

## 🔍 Troubleshooting

### Common Issues

#### Extension Not Loading
- **Check Developer Mode** is enabled
- **Verify file permissions** - make sure all files are readable
- **Check console errors** in browser developer tools

#### Filters Not Working
- **Refresh the page** after changing settings
- **Check if you're on a Bilibili domain** (*.bilibili.com)
- **Open developer tools** and look for JavaScript errors

#### Settings Not Saving
- **Check storage permissions** in extension settings
- **Try disabling/enabling** the extension
- **Clear browser data** and reinstall if needed

### Getting Help
1. **Check the logs**:
   - Open developer tools on any Bilibili page
   - Look for extension-related messages in console

2. **Verify extension status**:
   - Go to `chrome://extensions/`
   - Make sure the extension is enabled
   - Check for any error messages

3. **Reset settings**:
   - Disable and re-enable the extension
   - Or remove and reinstall the extension

## 🎉 Success Indicators

You'll know the extension is working when:
- ✅ Extension icon appears in browser toolbar
- ✅ Popup opens when clicking the icon
- ✅ Content disappears/reappears when toggling filters
- ✅ Settings persist across page refreshes
- ✅ No error messages in browser console

## 📝 Next Steps

1. **Customize the extension** by editing CSS selectors in `src/content/selectors.js`
2. **Add new filters** by extending the filter system
3. **Contribute improvements** by fixing tests and adding features
4. **Share with others** by publishing to browser extension stores

---

**Happy filtering! 🎯**

*This extension helps you focus on the content that matters most while browsing Bilibili.*