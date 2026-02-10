#!/usr/bin/env node
/**
 * Test Data Deletion Script
 * 
 * Deletes test inspections that were backed up
 * Usage: node delete-test-data.js --confirm
 */

const { Pool } = require('pg');

// Test inspection IDs to delete (from backup)
const TEST_INSPECTION_IDS = [715, 716, 717, 718, 719];

async function deleteTestData() {
  console.log('🗑️  Starting test data deletion...\n');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ Error: DATABASE_URL environment variable required');
    process.exit(1);
  }
  
  if (!process.argv.includes('--confirm')) {
    console.log('⚠️  This will PERMANENTLY DELETE test data:');
    console.log(`   - ${TEST_INSPECTION_IDS.length} test inspections`);
    console.log(`   - IDs: ${TEST_INSPECTION_IDS.join(', ')}`);
    console.log('\n📦 Backup location:');
    console.log('   .backups/test-data-cleanup-2026-02-10/');
    console.log('\n✅ To proceed, run with --confirm flag:');
    console.log('   node delete-test-data.js --confirm');
    process.exit(0);
  }
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    console.log(`📋 Deleting ${TEST_INSPECTION_IDS.length} test inspections...\n`);
    
    // Delete in proper order (respecting foreign keys)
    
    // 1. Delete room inspections (child records)
    const roomResult = await pool.query(`
      DELETE FROM room_inspections 
      WHERE inspection_id = ANY($1::int[])
      RETURNING id
    `, [TEST_INSPECTION_IDS]);
    
    console.log(`✅ Deleted ${roomResult.rowCount} room inspections`);
    
    // 2. Delete inspection photos records
    const photosResult = await pool.query(`
      DELETE FROM inspection_photos 
      WHERE inspection_id = ANY($1::int[])
      RETURNING id
    `, [TEST_INSPECTION_IDS]);
    
    console.log(`✅ Deleted ${photosResult.rowCount} photo records`);
    
    // 3. Delete inspections (parent records)
    const inspectionResult = await pool.query(`
      DELETE FROM inspections 
      WHERE id = ANY($1::int[])
      RETURNING id, inspector_name
    `, [TEST_INSPECTION_IDS]);
    
    console.log(`\n✅ Deleted ${inspectionResult.rowCount} inspections:`);
    for (const row of inspectionResult.rows) {
      console.log(`   - ID ${row.id}: ${row.inspector_name}`);
    }
    
    // 4. Verify deletion
    const verifyResult = await pool.query(`
      SELECT COUNT(*) as count 
      FROM inspections 
      WHERE id = ANY($1::int[])
    `, [TEST_INSPECTION_IDS]);
    
    const remainingCount = parseInt(verifyResult.rows[0].count);
    
    console.log('\n📊 Deletion Summary:');
    console.log(`   Target IDs: ${TEST_INSPECTION_IDS.length}`);
    console.log(`   Deleted: ${inspectionResult.rowCount}`);
    console.log(`   Remaining: ${remainingCount}`);
    
    if (remainingCount === 0) {
      console.log('\n✨ All test data deleted successfully!');
      console.log('   Backup available at: .backups/test-data-cleanup-2026-02-10/');
      console.log('   To restore: node restore-test-data.js --confirm');
    } else {
      console.log('\n⚠️  Warning: Some records were not deleted');
    }
    
    await pool.end();
    
  } catch (error) {
    console.error('❌ Deletion failed:', error);
    await pool.end();
    process.exit(1);
  }
}

deleteTestData().catch(console.error);
