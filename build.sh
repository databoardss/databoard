#!/bin/bash

# Install dependencies
python -m pip install -r requirements.txt

# Clean and create build directory
rm -rf build
mkdir -p build
mkdir -p build/api

# Copy static assets first
cp -r static/* build/

# Generate static files
python freeze.py

# Ensure index.html is in the root
if [ ! -f "build/index.html" ]; then
    cp templates/index.html build/index.html
fi

# Create necessary GitHub Pages files
touch build/.nojekyll  # Prevent Jekyll processing
echo "databoard.work" > build/CNAME  # Set custom domain

# Ensure API data directory exists and has proper permissions
mkdir -p build/api
chmod 755 build/api

# Print directory structure for verification
echo "Build directory contents:"
ls -la build/
echo "API directory contents:"
ls -la build/api/

echo "Build completed. Files ready for GitHub Pages deployment." 