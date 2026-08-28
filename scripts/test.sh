#!/usr/bin/env bash
set -e
cd "$(dirname "$0")/.."
cd server && pytest -q
cd ../client && npm run build
