#!/bin/bash

# Safari Extension Deployment Script
# Converts and packages the extension for Safari App Store submission

set -e

EXTENSION_NAME="bilibili-content-filter"
BUILD_DIR="dist/safari"
PACKAGE_DIR="packages"
SAFARI_PROJECT_DIR="${PACKAGE_DIR}/safari-project"

echo "🚀 Deploying Safari extension..."

# Check if build exists
if [ ! -d "$BUILD_DIR" ]; then
    echo "❌ Safari build not found. Run 'npm run build:safari' first."
    exit 1
fi

# Check for Xcode tools
if ! command -v xcrun &> /dev/null; then
    echo "❌ Xcode command line tools not found."
    echo "   Please install Xcode from the App Store and run:"
    echo "   xcode-select --install"
    exit 1
fi

# Create packages directory
mkdir -p "$PACKAGE_DIR"

# Remove existing project
if [ -d "$SAFARI_PROJECT_DIR" ]; then
    rm -rf "$SAFARI_PROJECT_DIR"
    echo "🗑️  Removed existing Safari project"
fi

echo "🔄 Converting extension for Safari..."

# Convert extension using Safari converter
xcrun safari-web-extension-converter "$BUILD_DIR" \
    --project-location "$SAFARI_PROJECT_DIR" \
    --app-name "Bilibili Content Filter" \
    --bundle-identifier "com.bilibilifilter.extension" \
    --swift

# Check if conversion was successful
if [ -d "$SAFARI_PROJECT_DIR" ]; then
    echo "✅ Safari project created successfully"
    
    # Find the Xcode project file
    XCODE_PROJECT=$(find "$SAFARI_PROJECT_DIR" -name "*.xcodeproj" | head -1)
    
    if [ -n "$XCODE_PROJECT" ]; then
        echo "📋 Safari project details:"
        echo "   Project: $XCODE_PROJECT"
        echo "   Location: $SAFARI_PROJECT_DIR"
        
        echo ""
        echo "🎯 Next steps for Safari App Store:"
        echo "1. Open the Xcode project: $XCODE_PROJECT"
        echo "2. Configure signing and provisioning profiles"
        echo "3. Build and archive the app"
        echo "4. Upload to App Store Connect"
        echo "5. Submit for review"
        echo ""
        echo "📝 Safari Extension Requirements:"
        echo "   - macOS 10.14+ (Mojave)"
        echo "   - Safari 14+"
        echo "   - Valid Apple Developer account"
        echo "   - App Store distribution certificate"
        
        # Create a README for the Safari project
        cat > "$SAFARI_PROJECT_DIR/README.md" << EOF
# Safari Extension Build

This directory contains the converted Safari extension project.

## Building the Extension

1. Open the Xcode project file
2. Select your development team in the project settings
3. Configure the bundle identifier if needed
4. Build and run the project

## Distribution

1. Archive the project (Product → Archive)
2. Upload to App Store Connect
3. Submit for review

## Requirements

- macOS 10.14+ (Mojave)
- Safari 14+
- Valid Apple Developer account
- App Store distribution certificate

## Notes

- The extension requires user permission to access Bilibili domains
- Users must enable the extension in Safari preferences after installation
EOF
        
        echo "📄 Created README.md in Safari project directory"
        
    else
        echo "⚠️  Xcode project not found in converted directory"
    fi
else
    echo "❌ Safari conversion failed"
    exit 1
fi