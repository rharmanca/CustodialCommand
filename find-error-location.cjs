const fs = require('fs');

// Read the local bundle
const bundle = fs.readFileSync('dist/public/assets/index-C8lZs5ns-v6.js', 'utf8');

// The error is at line 10, character 1064
// Since it's minified, it's all on one line
const lines = bundle.split('\n');
const line10 = lines[9]; // 0-indexed

if (line10) {
  // Get context around character 1064
  const start = Math.max(0, 1064 - 200);
  const end = Math.min(line10.length, 1064 + 200);
  const context = line10.substring(start, end);
  
  console.log('📍 Error location context (char 1064 ±200):');
  console.log(context);
  console.log('\n');
  
  // Look for the pattern around unstable_now assignment
  const unstableNowPattern = /.{100}unstable_now.{100}/g;
  const matches = line10.match(unstableNowPattern);
  
  if (matches) {
    console.log('🔍 Found unstable_now patterns:');
    matches.slice(0, 3).forEach((match, i) => {
      console.log(`\nPattern ${i + 1}:`);
      console.log(match);
    });
  }
}
