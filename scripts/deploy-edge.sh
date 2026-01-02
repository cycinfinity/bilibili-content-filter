#!/bin/bash

# Microsoft Edge Extension Deployment Script
# Packages the extension for Edge Add-ons store submission

set -e

EXTENSION_NAME="bilibili-content-filter"
BUILD_DIR="dist/edge"
PACKAGE_DIR="packages"
EDGE_PACKAGE="${PACKAGE_DIR}/${EXTENSION_NAME}-edge.zip"

echo "🚀 Deploying Edge extension..."

# Check if build exists
if [ ! -d "$BUILD_DIR" ]; then
    echo "❌ Edge build not found. Run 'npm run build:edge' first."
    exit 1
fi

# Create packages directory
mkdir -p "$PACKAGE_DIR"

# Remove existing package
if [ -f "$EDGE_PACKAGE" ]; then
    rm "$EDGE_PACKAGE"
    echo "🗑️  Removed existing Edge package"
fi

# Create zip package
echo "📦 Creating Edge package..."
cd "$BUILD_DIR"
zip -r "../../$EDGE_PACKAGE" . -x "*.DS_Store" "*.git*" "node_modules/*"
cd - > /dev/null

# Verify package
if [ -f "$EDGE_PACKAGE" ]; then
    PACKAGE_SIZE=$(du -h "$EDGE_PACKAGE" | cut -f1)
    echo "✅ Edge package created: $EDGE_PACKAGE ($PACKAGE_SIZE)"
    
    # Display package contents
    echo "📋 Package contents:"
    unzip -l "$EDGE_PACKAGE" | head -20
    
    echo ""
    echo "🎯 Next steps for Edge Add-ons:"
    echo "1. Go to https://partner.microsoft.com/dashboard/microsoftedge/"
    echo "2. Upload $EDGE_PACKAGE"
    echo "3. Fill in store listing details"
    echo "4. Submit for review"
    echo ""
    echo "📝 Note: Edge uses the same Chromium base as Chrome,"
    echo "   so the same package should work for both stores."
else
    echo "❌ Failed to create Edge package"
    exit 1
fi