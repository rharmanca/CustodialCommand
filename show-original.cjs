const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, 'dist', 'public', 'assets');
const files = fs.readdirSync(distPath);
const bundleFile = files.find(f => f.startsWith('index-') && f.endsWith('.js'));
const bundlePath = path.join(distPath, bundleFile);
const content = fs.readFileSync(bundlePath, 'utf8');

// Find the pattern
const idx = content.indexOf('registerInternalModuleStop(new Error)');
if (idx >= 0) {
  console.log('Pattern around "new Error":');
  console.log(content.substring(idx, idx + 100));
}
