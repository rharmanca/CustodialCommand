
#!/bin/bash

echo "=== Health Check Script ==="

# Kill any existing node processes
pkill -f node || true
sleep 2

# Build and start
echo "Building..."
npm run build
if [ $? -ne 0 ]; then
    echo "Build failed!"
    exit 1
fi

echo "Starting server..."
npm start &
SERVER_PID=$!
sleep 5

# Test health endpoint
echo "Testing health endpoint..."
curl -sS http://localhost:5000/health || curl -sS http://localhost:5000/

# Test inspections endpoint
echo "Testing inspections API..."
node test-with-logging.js

# Test custodial notes with multipart
echo "Testing custodial notes API..."
base64 -d > /tmp/px.png <<'B64'
iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP8z8DwHwAF/gL9Kp0P1wAAAABJRU5ErkJggg==
B64

curl -sS -X POST http://localhost:5000/api/custodial-notes \
  -F inspectorName='Test Inspector' \
  -F school='Test School' \
  -F date='2025-08-25' \
  -F location='Classroom' \
  -F locationDescription='Room 101' \
  -F notes='Test note' \
  -F images=@/tmp/px.png

echo "Health check complete!"
