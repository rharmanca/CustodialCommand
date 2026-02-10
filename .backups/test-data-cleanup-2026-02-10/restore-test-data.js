#!/usr/bin/env node
/**
 * Test Data Restoration Script
 * 
 * Restores test inspections from backup to database
 * Usage: node restore-test-data.js
 */

const { drizzle } = require('drizzle-orm/node-postgres');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load backup data
const backupPath = path.join(__dirname, 'inspections_backup.json');
const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

async function restoreTestData() {
  console.log('🔄 Starting test data restoration...\n');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ Error: DATABASE_URL environment variable required');
    console.log('   Set it with: export DATABASE_URL=postgresql://...');
    process.exit(1);
  }
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    console.log(`📦 Found ${backup.count} test inspections to restore`);
    console.log(`   IDs: ${backup.ids.join(', ')}\n`);
    
    // Confirmation prompt
    console.log('⚠️  This will INSERT test data into the database.');
    console.log('   The new records will get new auto-incremented IDs.');
    console.log('   To proceed, type "restore" and press Enter:');
    
    // Note: In a real script, you'd use readline here
    // For automation, you can use: node restore-test-data.js --confirm
    
    if (process.argv.includes('--confirm')) {
      await performRestoration(pool, backup.data);
    } else {
      console.log('\n⏸️  Restoration paused. Run with --confirm flag to proceed:');
      console.log('   node restore-test-data.js --confirm');
    }
    
    await pool.end();
    
  } catch (error) {
    console.error('❌ Restoration failed:', error);
    await pool.end();
    process.exit(1);
  }
}

async function performRestoration(pool, inspections) {
  let successCount = 0;
  let errorCount = 0;
  
  for (const inspection of inspections) {
    try {
      // Remove database-managed fields
      const { id, createdAt, ...restorableData } = inspection;
      
      // Build INSERT query
      const columns = Object.keys(restorableData);
      const values = Object.values(restorableData);
      const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
      
      const query = `
        INSERT INTO inspections (${columns.join(', ')})
        VALUES (${placeholders})
        RETURNING id
      `;
      
      const result = await pool.query(query, values);
      const newId = result.rows[0].id;
      
      console.log(`✅ Restored: "${restorableData.inspector_name}" → New ID: ${newId}`);
      successCount++;
      
    } catch (error) {
      console.error(`❌ Failed to restore inspection ${inspection.id}:`, error.message);
      errorCount++;
    }
  }
  
  console.log(`\n📊 Restoration Complete:`);
  console.log(`   Success: ${successCount}`);
  console.log(`   Failed: ${errorCount}`);
  
  if (successCount > 0) {
    console.log(`\n✨ Test data restored successfully!`);
    console.log(`   Verify at: https://cacustodialcommand.up.railway.app/inspection-data`);
  }
}

// Run restoration
restoreTestData().catch(console.error);
