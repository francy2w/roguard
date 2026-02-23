#!/usr/bin/env bash
set -euo pipefail

# Ensure corepack and pnpm are active before any install/build step
echo "Enabling corepack and preparing pnpm@10.4.1"
corepack enable
corepack prepare pnpm@10.4.1 --activate

echo "Installing dependencies (frozen lockfile)"
pnpm install --frozen-lockfile

echo "Building project"
# Safety: ensure no references to native bcrypt remain
echo "Verifying no native 'bcrypt' imports remain in source..."
if grep -R --exclude-dir=node_modules --exclude-dir=dist "\bbcrypt\b" .; then
	echo "Error: found 'bcrypt' references in repository. Please migrate to 'bcryptjs' before building." >&2
	exit 2
fi

pnpm build

echo "Build complete"
