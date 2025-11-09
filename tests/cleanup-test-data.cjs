#!/usr/bin/env node

/**
 * Test Data Cleanup Script
 * Removes all test data created during form testing
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = process.env.TEST_URL || 'http://localhost:5000';
const DRY_RUN = process.env.DRY_RUN === 'true';

// Load test data inventory
const inventoryPath = path.join(__dirname, 'test-data-inventory.json');
let inventory = null;

try {
  if (fs.existsSync(inventoryPath)) {
    inventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
  }
} catch (error) {
  console.log('❌ Could not load test data inventory:', error.message);
  process.exit(1);
}

if (!inventory) {
  console.log('ℹ️ No test data inventory found - nothing to clean up');
  process.exit(0);
}

// HTTP request helper
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://');
    const client = isHttps ? https : http;

    const requestOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      timeout: 10000
    };

    const req = client.request(url, requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = res.headers['content-type']?.includes('application/json')
            ? JSON.parse(data)
            : data;
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => reject(new Error('Request timeout')));

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }

    req.end();
  });
}

// Cleanup functions
async function cleanupInspections(ids) {
  console.log('🏫 Cleaning up inspections...');
  let cleaned = 0;

  for (const id of ids) {
    try {
      if (DRY_RUN) {
        console.log(`   DRY RUN: Would delete inspection ${id}`);
        cleaned++;
      } else {
        const response = await makeRequest(`${BASE_URL}/api/inspections/${id}`, {
          method: 'DELETE'
        });

        if (response.status === 200 || response.status === 204) {
          console.log(`   ✅ Deleted inspection ${id}`);
          cleaned++;
        } else {
          console.log(`   ❌ Failed to delete inspection ${id} (status: ${response.status})`);
        }
      }
    } catch (error) {
      console.log(`   ❌ Error deleting inspection ${id}: ${error.message}`);
    }
  }

  return cleaned;
}

async function cleanupRoomInspections(ids) {
  console.log('🏠 Cleaning up room inspections...');
  let cleaned = 0;

  for (const id of ids) {
    try {
      if (DRY_RUN) {
        console.log(`   DRY RUN: Would delete room inspection ${id}`);
        cleaned++;
      } else {
        const response = await makeRequest(`${BASE_URL}/api/room-inspections/${id}`, {
          method: 'DELETE'
        });

        if (response.status === 200 || response.status === 204) {
          console.log(`   ✅ Deleted room inspection ${id}`);
          cleaned++;
        } else {
          console.log(`   ❌ Failed to delete room inspection ${id} (status: ${response.status})`);
        }
      }
    } catch (error) {
      console.log(`   ❌ Error deleting room inspection ${id}: ${error.message}`);
    }
  }

  return cleaned;
}

async function cleanupCustodialNotes(ids) {
  console.log('📝 Cleaning up custodial notes...');
  let cleaned = 0;

  for (const id of ids) {
    try {
      if (DRY_RUN) {
        console.log(`   DRY RUN: Would delete custodial note ${id}`);
        cleaned++;
      } else {
        const response = await makeRequest(`${BASE_URL}/api/custodial-notes/${id}`, {
          method: 'DELETE'
        });

        if (response.status === 200 || response.status === 204) {
          console.log(`   ✅ Deleted custodial note ${id}`);
          cleaned++;
        } else {
          console.log(`   ❌ Failed to delete custodial note ${id} (status: ${response.status})`);
        }
      }
    } catch (error) {
      console.log(`   ❌ Error deleting custodial note ${id}: ${error.message}`);
    }
  }

  return cleaned;
}

async function cleanupMonthlyFeedback(ids) {
  console.log('📊 Cleaning up monthly feedback...');
  let cleaned = 0;

  for (const id of ids) {
    try {
      if (DRY_RUN) {
        console.log(`   DRY RUN: Would delete monthly feedback ${id}`);
        cleaned++;
      } else {
        const response = await makeRequest(`${BASE_URL}/api/monthly-feedback/${id}`, {
          method: 'DELETE'
        });

        if (response.status === 200 || response.status === 204) {
          console.log(`   ✅ Deleted monthly feedback ${id}`);
          cleaned++;
        } else {
          console.log(`   ❌ Failed to delete monthly feedback ${id} (status: ${response.status})`);
        }
      }
    } catch (error) {
      console.log(`   ❌ Error deleting monthly feedback ${id}: ${error.message}`);
    }
  }

  return cleaned;
}

async function cleanupPhotos(ids) {
  console.log('📸 Cleaning up photos...');
  let cleaned = 0;

  for (const id of ids) {
    try {
      if (DRY_RUN) {
        console.log(`   DRY RUN: Would delete photo ${id}`);
        cleaned++;
      } else {
        const response = await makeRequest(`${BASE_URL}/api/inspections/photos/${id}`, {
          method: 'DELETE'
        });

        if (response.status === 200 || response.status === 204) {
          console.log(`   ✅ Deleted photo ${id}`);
          cleaned++;
        } else {
          console.log(`   ❌ Failed to delete photo ${id} (status: ${response.status})`);
        }
      }
    } catch (error) {
      console.log(`   ❌ Error deleting photo ${id}: ${error.message}`);
    }
  }

  return cleaned;
}

// Main cleanup function
async function runCleanup() {
  console.log('🧹 Starting Test Data Cleanup');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'EXECUTE'}`);

  if (!inventory) {
    console.log('ℹ️ No test data to clean up');
    return;
  }

  const startTime = Date.now();
  let totalCleaned = 0;

  try {
    totalCleaned += await cleanupInspections(inventory.details.inspections.map(item => item.id));
    totalCleaned += await cleanupRoomInspections(inventory.details.roomInspections.map(item => item.id));
    totalCleaned += await cleanupCustodialNotes(inventory.details.custodialNotes.map(item => item.id));
    totalCleaned += await cleanupMonthlyFeedback(inventory.details.monthlyFeedback.map(item => item.id));
    totalCleaned += await cleanupPhotos(inventory.details.photos.map(item => item.id));

    const duration = Date.now() - startTime;

    console.log(`\n✅ Cleanup completed in ${(duration / 1000).toFixed(1)}s`);
    console.log(`   Total records processed: ${inventory.summary.totalTestRecords}`);
    console.log(`   Total records cleaned: ${totalCleaned}`);

    if (!DRY_RUN) {
      // Remove the inventory file after successful cleanup
      try {
        fs.unlinkSync(inventoryPath);
        console.log(`   🗑️ Removed test data inventory file`);
      } catch (error) {
        console.log(`   ⚠️ Could not remove inventory file: ${error.message}`);
      }
    }

  } catch (error) {
    console.log(`❌ Cleanup failed: ${error.message}`);
    process.exit(1);
  }
}

// Run cleanup if this file is executed directly
if (require.main === module) {
  runCleanup().catch(error => {
    console.log(`💥 Cleanup script failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { runCleanup };
