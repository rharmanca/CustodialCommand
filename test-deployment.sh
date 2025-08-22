#!/bin/bash
echo "Building application..."
npm run build
echo "Starting server on port 5000..."
PORT=5000 timeout 5 node dist/index.js &
sleep 2
echo "Testing health check..."
curl -f http://localhost:5000/ && echo "✓ Health check passed!" || echo "✗ Health check failed!"
pkill node
