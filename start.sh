#!/bin/bash
set -e

cd /app

# Ensure data directory exists
mkdir -p /app/data

# Start uvicorn
exec python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --log-level info
