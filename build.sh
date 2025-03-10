#!/bin/bash

# Install dependencies
python -m pip install -r requirements.txt

# Clean build directory
rm -rf build
mkdir -p build

# Generate static files
python freeze.py

# Ensure index.html exists in root
if [ ! -f "build/index.html" ]; then
    cp build/*/index.html build/index.html 2>/dev/null || true
fi

# Create .nojekyll file to disable Jekyll processing
touch build/.nojekyll

# Print directory structure for verification
echo "Build directory contents:"
ls -la build/ 