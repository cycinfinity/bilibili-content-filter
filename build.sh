#!/bin/bash

# Build script for Bilibili Content Filter Extension
# Cross-browser extension packaging

set -e

BROWSERS=("chrome" "edge" "safari")
SRC_DIR="src"

# Function to copy directory
copy_directory() {
    local src="$1"
    local dest="$2"
    
    mkdir -p "$dest"
    cp -r "$src"/* "$dest"/
}

# Function to build for specific browser
build_browser() {
    local browser="$1"
    local dest_dir="dist/$browser"
    
    echo "Building for $browser..."
    
    # Clean and create output directory
    rm -rf "$dest_dir"
    mkdir -p "$dest_dir"
    
    # Copy all source files
    copy_directory "$SRC_DIR" "$dest_dir"
    
    # Use correct manifest file
    if [ "$browser" = "safari" ]; then
        cp "$SRC_DIR/manifest-safari.json" "$dest_dir/manifest.json"
    else
        cp "$SRC_DIR/manifest.json" "$dest_dir/manifest.json"
    fi
    
    # Remove safari-specific manifest from non-safari builds
    if [ "$browser" != "safari" ]; then
        rm -f "$dest_dir/manifest-safari.json"
    fi
    
    echo "✓ Built $browser extension in $dest_dir"
}

# Main build function
build_all() {
    echo "Building extensions for all browsers..."
    echo
    
    for browser in "${BROWSERS[@]}"; do
        build_browser "$browser"
    done
    
    echo
    echo "✓ All builds completed successfully!"
}

# Parse command line arguments
if [ $# -eq 0 ] || [ "$1" = "all" ]; then
    build_all
elif [[ " ${BROWSERS[@]} " =~ " $1 " ]]; then
    build_browser "$1"
else
    echo "Unknown browser: $1"
    echo "Available browsers: ${BROWSERS[*]}, all"
    exit 1
fi