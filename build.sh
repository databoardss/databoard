#!/bin/bash

# Install dependencies
python -m pip install -r requirements.txt

# Clean and create build directory
rm -rf build
mkdir -p build

# Copy static assets first
cp -r static/* build/

# Generate static files
python freeze.py

# Copy index.html to root
cp templates/index.html build/index.html

# Create .nojekyll file to prevent GitHub Pages from using Jekyll
touch build/.nojekyll

echo "Build completed. Files ready for GitHub Pages deployment." 