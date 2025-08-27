import fetch from 'node-fetch';

const BASE_URL = 'http://0.0.0.0:5000';

async function testHealth() {
  console.log('=== QUICK HEALTH CHECK ===\n');
  
  try {
    console.log('1. Testing server connectivity...');
    const response = await fetch(`${BASE_URL}/health`);
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Health data:', data);
      console.log('✅ Server is running and healthy');
    } else {
      console.log('❌ Server responded but health check failed');
    }
    
  } catch (error) {
    console.log('❌ Cannot connect to server:', error.message);
    console.log('\nPossible issues:');
    console.log('- Server is not running');
    console.log('- Wrong port (should be 5000)');
    console.log('- Network connectivity issues');
  }
  
  try {
    console.log('\n2. Testing database connection...');
    const dbResponse = await fetch(`${BASE_URL}/api/inspections`);
    console.log(`Database test status: ${dbResponse.status}`);
    
    if (dbResponse.ok) {
      console.log('✅ Database connection working');
    } else {
      console.log('❌ Database connection failed');
    }
    
  } catch (error) {
    console.log('❌ Database test failed:', error.message);
  }
  
  console.log('\n=== HEALTH CHECK COMPLETE ===');
}

testHealth();
