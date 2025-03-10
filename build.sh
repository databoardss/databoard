#!/bin/bash

set -e  # Exit on error

echo "Starting build process..."

# Install dependencies
echo "Installing dependencies..."
python -m pip install -r requirements.txt

# Clean build directory
echo "Cleaning build directory..."
rm -rf build
mkdir -p build

# Generate static files
echo "Generating static files..."
python freeze.py

# Ensure all necessary files are in place
echo "Setting up GitHub Pages files..."

# Create necessary GitHub Pages files
touch build/.nojekyll  # Prevent Jekyll processing
echo "databoardss.github.io/databoard" > build/CNAME  # Set GitHub Pages domain

# Ensure proper permissions
find build -type d -exec chmod 755 {} \;
find build -type f -exec chmod 644 {} \;

# Verify the build
echo "Verifying build contents..."
if [ ! -f "build/index.html" ]; then
    echo "Error: index.html not found in build directory"
    exit 1
fi

echo "Checking API data..."
if [ ! -f "build/api/data" ]; then
    echo "Warning: API data file not found at expected location"
fi

# Print directory structure for verification
echo "Build directory structure:"
tree build/ || ls -R build/

echo "Build completed successfully!" 