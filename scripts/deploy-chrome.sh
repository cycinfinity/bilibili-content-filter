#!/bin/bash

# Chrome Extension Deployment Script
# Packages the extension for Chrome Web Store submission

set -e

EXTENSION_NAME="bilibili-content-filter"
BUILD_DIR="dist/chrome"
PACKAGE_DIR="packages"
CHROME_PACKAGE="${PACKAGE_DIR}/${EXTENSION_NAME}-chrome.zip"

echo "🚀 Deploying Chrome extension..."

# Check if build exists
if [ ! -d "$BUILD_DIR" ]; then
    echo "❌ Chrome build not found. Run 'npm run build:chrome' first."
    exit 1
fi

# Create packages directory
mkdir -p "$PACKAGE_DIR"

# Remove existing package
if [ -f "$CHROME_PACKAGE" ]; then
    rm "$CHROME_PACKAGE"
    echo "🗑️  Removed existing Chrome package"
fi

# Create zip package
echo "📦 Creating Chrome package..."
cd "$BUILD_DIR"
zip -r "../../$CHROME_PACKAGE" . -x "*.DS_Store" "*.git*" "node_modules/*"
cd - > /dev/null

# Verify package
if [ -f "$CHROME_PACKAGE" ]; then
    PACKAGE_SIZE=$(du -h "$CHROME_PACKAGE" | cut -f1)
    echo "✅ Chrome package created: $CHROME_PACKAGE ($PACKAGE_SIZE)"
    
    # Display package contents
    echo "📋 Package contents:"
    unzip -l "$CHROME_PACKAGE" | head -20
    
    echo ""
    echo "🎯 Next steps for Chrome Web Store:"
    echo "1. Go to https://chrome.google.com/webstore/devconsole/"
    echo "2. Upload $CHROME_PACKAGE"
    echo "3. Fill in store listing details"
    echo "4. Submit for review"
else
    echo "❌ Failed to create Chrome package"
    exit 1
fi