#!/usr/bin/env node
/**
 * Check if database migration (indexes) has been run
 * This script connects to the database and checks for the existence of indexes
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';

const { Pool } = pg;

// Get DATABASE_URL from environment
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL environment variable not set');
  console.log('\nSet it with your Railway database URL:');
  console.log('export DATABASE_URL="postgresql://..."');
  process.exit(1);
}

async function checkIndexes() {
  console.log('🔍 Checking database migration status...\n');

  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: DATABASE_URL.includes('railway') || DATABASE_URL.includes('neon')
      ? { rejectUnauthorized: false }
      : false
  });

  try {
    // Query to check for indexes
    const query = `
      SELECT
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM
        pg_indexes
      WHERE
        schemaname = 'public'
        AND (
          indexname LIKE 'inspections_%_idx'
          OR indexname LIKE 'custodial_notes_%_idx'
          OR indexname LIKE 'monthly_feedback_%_idx'
          OR indexname LIKE 'inspection_photos_%_idx'
        )
      ORDER BY
        tablename, indexname;
    `;

    const result = await pool.query(query);

    // Expected indexes
    const expectedIndexes = [
      'inspections_school_idx',
      'inspections_date_idx',
      'inspections_school_date_idx',
      'inspections_type_idx',
      'custodial_notes_school_idx',
      'custodial_notes_date_idx',
      'custodial_notes_school_date_idx',
      'monthly_feedback_school_idx',
      'monthly_feedback_year_idx',
      'monthly_feedback_school_year_idx',
      'monthly_feedback_school_year_month_idx',
      'inspection_photos_inspection_idx',
      'inspection_photos_sync_status_idx'
    ];

    const foundIndexes = result.rows.map(row => row.indexname);
    const missingIndexes = expectedIndexes.filter(idx => !foundIndexes.includes(idx));

    console.log('📊 Migration Status Report');
    console.log('═'.repeat(50));
    console.log(`Total expected indexes: ${expectedIndexes.length}`);
    console.log(`Indexes found: ${foundIndexes.length}`);
    console.log(`Missing indexes: ${missingIndexes.length}\n`);

    if (missingIndexes.length === 0) {
      console.log('✅ SUCCESS: All indexes are present!');
      console.log('\n✅ Database migration has been completed.');
      console.log('✅ Your application is fully optimized for performance.');
      console.log('\n📈 Expected performance improvement: 30-70% faster queries');
    } else {
      console.log('⚠️  WARNING: Migration NOT complete!');
      console.log('\nMissing indexes:');
      missingIndexes.forEach(idx => {
        console.log(`  ❌ ${idx}`);
      });
      console.log('\n🔧 To fix this, run:');
      console.log('   npm run db:push');
      console.log('\nOr in Railway shell:');
      console.log('   1. Open your Railway project');
      console.log('   2. Click "Shell" or "Terminal"');
      console.log('   3. Run: npm run db:push');
    }

    console.log('\n' + '═'.repeat(50));

    if (foundIndexes.length > 0) {
      console.log('\n✅ Found indexes:');
      result.rows.forEach(row => {
        console.log(`  • ${row.indexname} (${row.tablename})`);
      });
    }

    await pool.end();
    process.exit(missingIndexes.length === 0 ? 0 : 1);

  } catch (error) {
    console.error('❌ Error connecting to database:', error.message);
    console.log('\nPossible causes:');
    console.log('  • DATABASE_URL is incorrect');
    console.log('  • Database is not accessible');
    console.log('  • Network/firewall issues');
    await pool.end();
    process.exit(1);
  }
}

checkIndexes();
