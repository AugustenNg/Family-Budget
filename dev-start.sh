#!/bin/bash
# Sync source files to local filesystem and run Next.js from there
SRC="/Volumes/AUGUST/File/Family Budget"
DEST="/tmp/cfo-family"

mkdir -p "$DEST"
rsync -a --exclude 'node_modules' --exclude '.next' --exclude '.git' "$SRC/" "$DEST/"

cd "$DEST"

# Install if needed
if [ ! -f node_modules/.bin/next ]; then
  npm install
fi

exec node_modules/.bin/next dev --port 3000
