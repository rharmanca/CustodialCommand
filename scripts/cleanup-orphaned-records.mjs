#!/usr/bin/env node
/**
 * Cleanup Script: Orphaned Room Inspections
 * 
 * This script removes orphaned room_inspection records that reference
 * non-existent parent inspections.
 * 
 * SAFETY FEATURES:
 * - Preview mode by default (no changes)
 * - Requires --execute flag to actually delete
 * - Creates backup before deletion
 * - Verifies results after deletion
 * 
 * Usage:
 *   node scripts/cleanup-orphaned-records.mjs           # Preview only
 *   node scripts/cleanup-orphaned-records.mjs --execute # Actually delete
 */

import pg from 'pg';
import { writeFileSync } from 'fs';

const { Client } = pg;

const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_WwJEd5ILV7lq@ep-aged-wind-ad9g7vhf-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function main() {
  const args = process.argv.slice(2);
  const executeMode = args.includes('--execute');
  
  console.log('=' .repeat(70));
  console.log('🧹 ORPHANED ROOM INSPECTIONS CLEANUP');
  console.log('=' .repeat(70));
  console.log(`\nMode: ${executeMode ? '⚠️  EXECUTE (will delete records)' : '👁️  PREVIEW (read-only)'}\n`);
  
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('✅ Connected to database\n');
    
    // Step 1: Find orphaned records
    console.log('📋 Step 1: Finding orphaned records...\n');
    
    const orphanedQuery = `
      SELECT 
        ri.id,
        ri.building_inspection_id,
        ri.room_type,
        ri.room_identifier,
        ri.notes,
        ri.created_at
      FROM room_inspections ri 
      WHERE NOT EXISTS (
        SELECT 1 FROM inspections i 
        WHERE i.id = ri.building_inspection_id
      )
      ORDER BY ri.building_inspection_id, ri.id
    `;
    
    const orphaned = await client.query(orphanedQuery);
    
    if (orphaned.rows.length === 0) {
      console.log('✅ No orphaned records found! Database is clean.\n');
      await client.end();
      return;
    }
    
    console.log(`Found ${orphaned.rows.length} orphaned record(s):\n`);
    
    orphaned.rows.forEach(row => {
      const date = new Date(row.created_at).toLocaleDateString();
      console.log(`  ID ${row.id}: ${row.room_type}${row.room_identifier ? ' (' + row.room_identifier + ')' : ''}`);
      console.log(`    Parent ID: ${row.building_inspection_id} (MISSING)`);
      console.log(`    Created: ${date}`);
      if (row.notes) {
        console.log(`    Notes: ${row.notes.substring(0, 50)}...`);
      }
      console.log('');
    });
    
    if (!executeMode) {
      console.log('=' .repeat(70));
      console.log('ℹ️  PREVIEW MODE - No changes made');
      console.log('=' .repeat(70));
      console.log('\nTo delete these records, run:');
      console.log('  node scripts/cleanup-orphaned-records.mjs --execute\n');
      await client.end();
      return;
    }
    
    // Step 2: Create backup
    console.log('📦 Step 2: Creating backup...\n');
    
    const backupFilename = `backup-orphaned-records-${Date.now()}.json`;
    writeFileSync(backupFilename, JSON.stringify(orphaned.rows, null, 2));
    console.log(`✅ Backup saved to: ${backupFilename}\n`);
    
    // Step 3: Confirm deletion
    console.log('⚠️  Step 3: Deleting orphaned records...\n');
    
    const deleteQuery = `
      DELETE FROM room_inspections ri 
      WHERE NOT EXISTS (
        SELECT 1 FROM inspections i 
        WHERE i.id = ri.building_inspection_id
      )
      RETURNING id
    `;
    
    const deleteResult = await client.query(deleteQuery);
    console.log(`✅ Deleted ${deleteResult.rowCount} record(s)\n`);
    
    // Step 4: Verify
    console.log('🔍 Step 4: Verifying cleanup...\n');
    
    const verifyResult = await client.query(`
      SELECT COUNT(*) as count
      FROM room_inspections ri 
      WHERE NOT EXISTS (
        SELECT 1 FROM inspections i 
        WHERE i.id = ri.building_inspection_id
      )
    `);
    
    const remaining = parseInt(verifyResult.rows[0].count);
    
    if (remaining === 0) {
      console.log('✅ Verification passed! No orphaned records remain.\n');
    } else {
      console.log(`⚠️  Warning: ${remaining} orphaned record(s) still exist.\n`);
    }
    
    // Summary
    console.log('=' .repeat(70));
    console.log('📊 CLEANUP SUMMARY');
    console.log('=' .repeat(70));
    console.log(`\n  Records deleted: ${deleteResult.rowCount}`);
    console.log(`  Backup file: ${backupFilename}`);
    console.log(`  Remaining orphans: ${remaining}`);
    console.log('\n✅ Cleanup complete!\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    throw error;
  } finally {
    await client.end();
    console.log('✅ Connection closed\n');
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
