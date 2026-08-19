#!/bin/bash
set -e

echo "📦 Installing frontend dependencies..."
cd frontend
npm install
echo "✅ Frontend dependencies installed"

echo "🔨 Building frontend..."
npm run build
echo "✅ Frontend built"

echo "📦 Installing backend dependencies..."
cd ../backend
npm install --production
echo "✅ Backend dependencies installed"

echo "🚀 Starting server..."
node src/index.js
