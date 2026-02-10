import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL not set');
  process.exit(1);
}

const sql = neon(DATABASE_URL);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backupDir = '.backups/test-data-cleanup-2026-02-10';

async function exportData() {
  console.log('Starting data export for backup...\n');
  
  try {
    // 1. Export inspections (IDs 460-714)
    console.log('Exporting inspections (IDs 460-714)...');
    const inspections = await sql`SELECT * FROM inspections WHERE id BETWEEN 460 AND 714`;
    console.log(`  Found ${inspections.length} inspection records`);
    fs.writeFileSync(
      path.join(backupDir, 'inspections_backup.json'),
      JSON.stringify(inspections, null, 2)
    );
    console.log('  Saved to inspections_backup.json\n');
    
    // 2. Export room_inspections (IDs 85-149)
    console.log('Exporting room_inspections (IDs 85-149)...');
    const roomInspections = await sql`SELECT * FROM room_inspections WHERE id BETWEEN 85 AND 149`;
    console.log(`  Found ${roomInspections.length} room_inspection records`);
    fs.writeFileSync(
      path.join(backupDir, 'room_inspections_backup.json'),
      JSON.stringify(roomInspections, null, 2)
    );
    console.log('  Saved to room_inspections_backup.json\n');
    
    // 3. Export photos metadata for test inspections
    console.log('Exporting inspection photos metadata...');
    const photos = await sql`
      SELECT * FROM inspection_photos 
      WHERE inspection_id BETWEEN 460 AND 714
    `;
    console.log(`  Found ${photos.length} photo records`);
    fs.writeFileSync(
      path.join(backupDir, 'photos_metadata.json'),
      JSON.stringify(photos, null, 2)
    );
    console.log('  Saved to photos_metadata.json\n');
    
    // 4. Get photo file paths
    const photoPaths = photos.map(p => p.photo_url).filter(Boolean);
    fs.writeFileSync(
      path.join(backupDir, 'photo_paths.json'),
      JSON.stringify(photoPaths, null, 2)
    );
    console.log(`  Saved ${photoPaths.length} photo paths to photo_paths.json\n`);
    
    console.log('=== EXPORT COMPLETE ===');
    console.log(`Inspections: ${inspections.length}`);
    console.log(`Room Inspections: ${roomInspections.length}`);
    console.log(`Photos: ${photos.length}`);
    
    // Return summary for manifest
    return {
      inspections: inspections.length,
      roomInspections: roomInspections.length,
      photos: photos.length,
      photoPaths: photoPaths
    };
    
  } catch (error) {
    console.error('Export failed:', error);
    process.exit(1);
  }
}

exportData().then(summary => {
  // Save summary for later use
  fs.writeFileSync(
    path.join(backupDir, 'export_summary.json'),
    JSON.stringify(summary, null, 2)
  );
});
