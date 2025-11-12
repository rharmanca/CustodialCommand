#!/bin/bash
echo "=== Checking Production Deployment ==="
echo ""
echo "1. Main Page Status:"
curl -s -o /dev/null -w "Status: %{http_code}\n" https://cacustodialcommand.up.railway.app/

echo ""
echo "2. Main JS Bundle:"
curl -s -o /dev/null -w "Status: %{http_code}, Size: %{size_download} bytes\n" https://cacustodialcommand.up.railway.app/assets/index-C8lZs5ns-v6.js

echo ""
echo "3. Main CSS:"
curl -s -o /dev/null -w "Status: %{http_code}, Size: %{size_download} bytes\n" https://cacustodialcommand.up.railway.app/assets/css/index-DwqoedQJ-v6.css

echo ""
echo "4. Checking if React is in the bundle:"
curl -s https://cacustodialcommand.up.railway.app/assets/index-C8lZs5ns-v6.js | grep -o "React" | head -1

echo ""
echo "5. Checking HTML root div:"
curl -s https://cacustodialcommand.up.railway.app/ | grep "root"

echo ""
echo "=== All checks complete ==="
