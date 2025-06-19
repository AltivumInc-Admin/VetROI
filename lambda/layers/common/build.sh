#!/bin/bash
# Build script for Lambda layer

set -e

echo "Building Lambda layer for Python 3.12..."

# Clean previous builds
rm -rf python/
rm -f layer.zip

# Create directory structure
mkdir -p python/lib/python3.12/site-packages

# Install dependencies
pip install -r requirements.txt -t python/lib/python3.12/site-packages/ --platform manylinux2014_x86_64 --only-binary=:all:

# Remove unnecessary files to reduce size
find python -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find python -type d -name "*.dist-info" -exec rm -rf {} + 2>/dev/null || true
find python -type f -name "*.pyc" -delete

# Create zip file
zip -r layer.zip python/

# Check size
echo "Layer size: $(du -h layer.zip | cut -f1)"

# Verify it's under 250MB unzipped (Lambda limit)
UNZIPPED_SIZE=$(unzip -l layer.zip | tail -1 | awk '{print $1}')
MAX_SIZE=$((250 * 1024 * 1024))

if [ $UNZIPPED_SIZE -gt $MAX_SIZE ]; then
    echo "ERROR: Layer exceeds 250MB unzipped limit"
    exit 1
fi

echo "Layer built successfully!"