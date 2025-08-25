
// Environment Check Script
// Run with: node check-environment.js

console.log('=== ENVIRONMENT CHECK ===');

// Check essential environment variables
console.log('\n1. Environment Variables:');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Missing');
console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('PORT:', process.env.PORT || '5000');

// Check if server is running
console.log('\n2. Server Status:');
fetch('http://0.0.0.0:5000/health')
  .then(response => {
    console.log('Health endpoint:', response.ok ? '✅ Responding' : '❌ Error');
    return response.json();
  })
  .then(data => {
    console.log('Health data:', data);
  })
  .catch(error => {
    console.log('Server connection:', '❌ Failed -', error.message);
  });

// Check database schema
console.log('\n3. Database Schema Check:');
console.log('Run: npm run db:push to ensure schema is up to date');

// Check file upload directory
const fs = require('fs');
console.log('\n4. File Upload Check:');
try {
  if (!fs.existsSync('uploads')) {
    console.log('Uploads directory:', '⚠️  Missing - will be created on first upload');
  } else {
    console.log('Uploads directory:', '✅ Exists');
  }
} catch (error) {
  console.log('File system check:', '❌ Error -', error.message);
}
