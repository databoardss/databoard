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

# Copy index.html to root if it's in a subdirectory
find build -name "index.html" -exec cp {} build/ \;

# Create API directory and ensure data file exists
mkdir -p build/api
if [ -f "build/api_data" ]; then
    mv build/api_data build/api/data
fi

# Ensure proper permissions
find build -type d -exec chmod 755 {} \;
find build -type f -exec chmod 644 {} \;

# Verify the build
echo "Verifying build contents..."
if [ ! -f "build/index.html" ]; then
    echo "Error: index.html not found in build directory"
    exit 1
fi

# Print directory structure for verification
echo "Build directory structure:"
ls -R build/

# Verify critical files
echo "Verifying critical files..."
for file in "index.html" "api/data" ".nojekyll"; do
    if [ -f "build/$file" ]; then
        echo "✓ $file exists"
    else
        echo "✗ $file missing"
        exit 1
    fi
done

echo "Build completed successfully!" 