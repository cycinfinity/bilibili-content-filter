// Build configuration for cross-browser extension packaging
const fs = require('fs');
const path = require('path');

const BROWSERS = {
  chrome: {
    manifestFile: 'manifest.json',
    outputDir: 'dist/chrome',
    permissions: ['storage', 'activeTab'],
    hostPermissions: ['*://*.bilibili.com/*'],
    storageAPI: 'chrome.storage',
    packageFormat: 'zip',
    buildSteps: ['copyFiles', 'processManifest', 'injectCompatibility']
  },
  edge: {
    manifestFile: 'manifest.json',
    outputDir: 'dist/edge',
    permissions: ['storage', 'activeTab'],
    hostPermissions: ['*://*.bilibili.com/*'],
    storageAPI: 'chrome.storage',
    packageFormat: 'zip',
    buildSteps: ['copyFiles', 'processManifest', 'injectCompatibility']
  },
  safari: {
    manifestFile: 'manifest-safari.json',
    outputDir: 'dist/safari',
    permissions: ['storage'],
    hostPermissions: ['*://*.bilibili.com/*'],
    storageAPI: 'browser.storage',
    packageFormat: 'xcode',
    buildSteps: ['copyFiles', 'processManifest', 'injectCompatibility', 'generateSafariProject']
  }
};

function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Process manifest file for browser-specific requirements
 * @param {string} browser - Target browser
 * @param {string} manifestPath - Path to manifest file
 */
function processManifest(browser, manifestPath) {
  const config = BROWSERS[browser];
  
  if (!fs.existsSync(manifestPath)) {
    console.warn(`Manifest file not found: ${manifestPath}`);
    return;
  }
  
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  
  // Browser-specific manifest modifications
  switch (browser) {
    case 'safari':
      // Safari doesn't support activeTab permission in the same way
      manifest.permissions = manifest.permissions.filter(p => p !== 'activeTab');
      break;
      
    case 'chrome':
    case 'edge':
      // Ensure activeTab permission is present for Chrome/Edge
      if (!manifest.permissions.includes('activeTab')) {
        manifest.permissions.push('activeTab');
      }
      break;
  }
  
  // Write processed manifest
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`✓ Processed manifest for ${browser}`);
}

/**
 * Inject browser compatibility code into content scripts
 * @param {string} browser - Target browser
 * @param {string} outputDir - Output directory
 */
function injectCompatibility(browser, outputDir) {
  const config = BROWSERS[browser];
  const compatibilityCode = `
// Browser compatibility injection for ${browser}
(function() {
  'use strict';
  
  // Set browser type for runtime detection
  if (typeof window !== 'undefined') {
    window.BROWSER_TYPE = '${browser}';
    window.STORAGE_API = '${config.storageAPI}';
  }
  
  // Polyfill for Safari if needed
  if ('${browser}' === 'safari' && typeof chrome === 'undefined' && typeof browser !== 'undefined') {
    window.chrome = {
      storage: browser.storage,
      runtime: browser.runtime,
      tabs: browser.tabs
    };
  }
})();
`;
  
  // Inject into content script
  const contentScriptPath = path.join(outputDir, 'content', 'content.js');
  if (fs.existsSync(contentScriptPath)) {
    const originalContent = fs.readFileSync(contentScriptPath, 'utf8');
    const modifiedContent = compatibilityCode + '\n' + originalContent;
    fs.writeFileSync(contentScriptPath, modifiedContent);
  }
  
  // Inject into background script
  const backgroundScriptPath = path.join(outputDir, 'background', 'background.js');
  if (fs.existsSync(backgroundScriptPath)) {
    const originalContent = fs.readFileSync(backgroundScriptPath, 'utf8');
    const modifiedContent = compatibilityCode + '\n' + originalContent;
    fs.writeFileSync(backgroundScriptPath, modifiedContent);
  }
  
  // Inject into popup script
  const popupScriptPath = path.join(outputDir, 'popup', 'popup.js');
  if (fs.existsSync(popupScriptPath)) {
    const originalContent = fs.readFileSync(popupScriptPath, 'utf8');
    const modifiedContent = compatibilityCode + '\n' + originalContent;
    fs.writeFileSync(popupScriptPath, modifiedContent);
  }
  
  console.log(`✓ Injected compatibility code for ${browser}`);
}

/**
 * Generate Safari-specific project structure
 * @param {string} outputDir - Safari output directory
 */
function generateSafariProject(outputDir) {
  // Create Safari app wrapper structure
  const safariAppDir = path.join(outputDir, 'BilibiliContentFilter.app');
  const safariExtensionDir = path.join(safariAppDir, 'Contents', 'Resources', 'Extension');
  
  if (!fs.existsSync(safariExtensionDir)) {
    fs.mkdirSync(safariExtensionDir, { recursive: true });
  }
  
  // Move extension files to proper Safari location
  const extensionFiles = fs.readdirSync(outputDir);
  for (const file of extensionFiles) {
    if (file !== 'BilibiliContentFilter.app') {
      const srcPath = path.join(outputDir, file);
      const destPath = path.join(safariExtensionDir, file);
      
      if (fs.statSync(srcPath).isDirectory()) {
        copyDirectory(srcPath, destPath);
        fs.rmSync(srcPath, { recursive: true });
      } else {
        fs.copyFileSync(srcPath, destPath);
        fs.unlinkSync(srcPath);
      }
    }
  }
  
  // Create Safari app Info.plist
  const infoPlist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDisplayName</key>
    <string>Bilibili Content Filter</string>
    <key>CFBundleIdentifier</key>
    <string>com.bilibilifilter.extension</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleName</key>
    <string>BilibiliContentFilter</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0.0</string>
    <key>CFBundleVersion</key>
    <string>1</string>
    <key>LSMinimumSystemVersion</key>
    <string>10.14</string>
    <key>NSExtension</key>
    <dict>
        <key>NSExtensionPointIdentifier</key>
        <string>com.apple.Safari.extension</string>
        <key>NSExtensionPrincipalClass</key>
        <string>SafariExtensionHandler</string>
    </dict>
</dict>
</plist>`;
  
  fs.writeFileSync(path.join(safariAppDir, 'Contents', 'Info.plist'), infoPlist);
  
  // Create Safari conversion script
  const conversionScript = `#!/bin/bash
# Safari Extension Conversion Script
# Run this script to convert the extension for Safari

echo "Converting extension for Safari..."

# Check if xcrun is available
if ! command -v xcrun &> /dev/null; then
    echo "Error: Xcode command line tools not found. Please install Xcode."
    exit 1
fi

# Convert to Safari extension
xcrun safari-web-extension-converter "${outputDir}" --app-name "Bilibili Content Filter" --bundle-identifier "com.bilibilifilter.extension"

echo "✓ Safari extension conversion completed"
echo "Open the generated Xcode project to build and sign the extension"
`;
  
  fs.writeFileSync(path.join(outputDir, 'convert-safari.sh'), conversionScript);
  fs.chmodSync(path.join(outputDir, 'convert-safari.sh'), '755');
  
  console.log(`✓ Generated Safari project structure`);
}

function buildForBrowser(browser) {
  const config = BROWSERS[browser];
  const srcDir = 'src';
  const destDir = config.outputDir;
  
  console.log(`Building for ${browser}...`);
  
  // Clean and create output directory
  if (fs.existsSync(destDir)) {
    fs.rmSync(destDir, { recursive: true });
  }
  fs.mkdirSync(destDir, { recursive: true });
  
  // Execute build steps
  for (const step of config.buildSteps) {
    switch (step) {
      case 'copyFiles':
        copyDirectory(srcDir, destDir);
        break;
        
      case 'processManifest':
        const manifestSrc = path.join(srcDir, config.manifestFile);
        const manifestDest = path.join(destDir, 'manifest.json');
        
        if (fs.existsSync(manifestSrc)) {
          fs.copyFileSync(manifestSrc, manifestDest);
          processManifest(browser, manifestDest);
        }
        
        // Remove the safari-specific manifest from non-safari builds
        if (browser !== 'safari') {
          const safariManifest = path.join(destDir, 'manifest-safari.json');
          if (fs.existsSync(safariManifest)) {
            fs.unlinkSync(safariManifest);
          }
        }
        break;
        
      case 'injectCompatibility':
        injectCompatibility(browser, destDir);
        break;
        
      case 'generateSafariProject':
        if (browser === 'safari') {
          generateSafariProject(destDir);
        }
        break;
    }
  }
  
  console.log(`✓ Built ${browser} extension in ${destDir}`);
}

function buildAll() {
  console.log('Building extensions for all browsers...\n');
  
  for (const browser of Object.keys(BROWSERS)) {
    buildForBrowser(browser);
  }
  
  console.log('\n✓ All builds completed successfully!');
}

module.exports = {
  BROWSERS,
  buildForBrowser,
  buildAll
};

// Run build if called directly
if (require.main === module) {
  const browser = process.argv[2];
  
  if (browser && BROWSERS[browser]) {
    buildForBrowser(browser);
  } else if (browser === 'all' || !browser) {
    buildAll();
  } else {
    console.error(`Unknown browser: ${browser}`);
    console.log(`Available browsers: ${Object.keys(BROWSERS).join(', ')}, all`);
    process.exit(1);
  }
}