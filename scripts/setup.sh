#!/usr/bin/env bash
set -e
cd "$(dirname "$0")/.."
python -m venv .venv
source .venv/bin/activate
pip install -r server/requirements.txt
cd client
npm install
