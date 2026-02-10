// Script to export test data from database
const { drizzle } = require('drizzle-orm/node-postgres');
const { Pool } = require('pg');
const fs = require('fs');

async function exportTestData() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });
  
  const db = drizzle(pool);
  
  try {
    // Export test inspections (IDs 460-714 based on Phase 01 catalog)
    const inspectionsResult = await pool.query(`
      SELECT * FROM inspections 
      WHERE id >= 460 AND id <= 714
      ORDER BY id
    `);
    
    fs.writeFileSync(
      '.backups/test-data-cleanup-2026-02-10/inspections_backup.json',
      JSON.stringify(inspectionsResult.rows, null, 2)
    );
    
    console.log(`Exported ${inspectionsResult.rowCount} test inspections`);
    
    // Export room inspections
    const roomInspectionsResult = await pool.query(`
      SELECT * FROM room_inspections 
      WHERE id >= 85 AND id <= 149
      ORDER BY id
    `);
    
    fs.writeFileSync(
      '.backups/test-data-cleanup-2026-02-10/room_inspections_backup.json',
      JSON.stringify(roomInspectionsResult.rows, null, 2)
    );
    
    console.log(`Exported ${roomInspectionsResult.rowCount} room inspections`);
    
    await pool.end();
    console.log('Backup complete!');
    
  } catch (error) {
    console.error('Backup failed:', error);
    await pool.end();
    process.exit(1);
  }
}

exportTestData();
