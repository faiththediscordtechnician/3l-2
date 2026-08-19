#!/bin/bash
set -e

echo "📦 Installing backend dependencies..."
cd backend
npm install --production
echo "✅ Dependencies installed"

echo "🚀 Starting server..."
node src/index.js
