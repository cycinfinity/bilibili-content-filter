#!/bin/bash

# Master Deployment Script
# Builds and packages extensions for all supported browsers

set -e

echo "🚀 Building and deploying extensions for all browsers..."
echo "=================================================="

# Build all extensions first
echo "🔨 Building extensions..."
npm run build

echo ""
echo "📦 Creating deployment packages..."

# Deploy Chrome
echo ""
echo "Chrome Extension:"
echo "=================="
./scripts/deploy-chrome.sh

# Deploy Edge
echo ""
echo "Edge Extension:"
echo "==============="
./scripts/deploy-edge.sh

# Deploy Safari
echo ""
echo "Safari Extension:"
echo "================="
./scripts/deploy-safari.sh

echo ""
echo "🎉 All deployments completed!"
echo ""
echo "📋 Summary:"
echo "- Chrome package: packages/bilibili-content-filter-chrome.zip"
echo "- Edge package: packages/bilibili-content-filter-edge.zip"
echo "- Safari project: packages/safari-project/"
echo ""
echo "🎯 Next steps:"
echo "1. Upload Chrome package to Chrome Web Store"
echo "2. Upload Edge package to Edge Add-ons"
echo "3. Open Safari Xcode project and build for App Store"