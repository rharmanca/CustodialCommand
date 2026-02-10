import fs from 'fs';
import path from 'path';

const backupDir = '.backups/test-data-cleanup-2026-02-10';

// Read the full API response
const allData = JSON.parse(fs.readFileSync(path.join(backupDir, 'inspections_api_all.json'), 'utf8'));
const allInspections = allData.data || [];

console.log('=== CREATING BACKUP ===\n');
console.log(`Total inspections in API: ${allInspections.length}`);

// Find test records by pattern
const testInspections = allInspections.filter(i => {
  const name = (i.inspectorName || '').toLowerCase();
  const notes = (i.notes || '').toLowerCase();
  return name.includes('test') || 
         name.includes('automated') || 
         name.includes('xss') ||
         notes.includes('test') ||
         notes.includes('automated') ||
         notes.includes('csrf');
});

console.log(`Test inspections found: ${testInspections.length}\n`);

// Save full backup
const backup = {
  backupDate: new Date().toISOString(),
  source: 'API - /api/inspections',
  criteria: 'inspector_name or notes containing: test, automated, xss, csrf',
  count: testInspections.length,
  ids: testInspections.map(i => i.id).sort((a, b) => a - b),
  data: testInspections
};

fs.writeFileSync(
  path.join(backupDir, 'inspections_backup.json'),
  JSON.stringify(backup, null, 2)
);

console.log('✅ inspections_backup.json created');

// Create summary
const summary = testInspections.map(i => ({
  id: i.id,
  inspectorName: i.inspectorName,
  school: i.school,
  date: i.date,
  inspectionType: i.inspectionType,
  roomNumber: i.roomNumber,
  createdAt: i.createdAt,
  notes: i.notes
}));

fs.writeFileSync(
  path.join(backupDir, 'inspections_summary.json'),
  JSON.stringify(summary, null, 2)
);

console.log('✅ inspections_summary.json created');

// Create simple list for deletion reference
const deletionList = testInspections.map(i => ({
  id: i.id,
  inspectorName: i.inspectorName,
  school: i.school
}));

fs.writeFileSync(
  path.join(backupDir, 'deletion_list.json'),
  JSON.stringify(deletionList, null, 2)
);

console.log('✅ deletion_list.json created');

console.log('\n=== BACKUP COMPLETE ===');
console.log(`Records backed up: ${testInspections.length}`);
console.log(`IDs: ${backup.ids.join(', ')}`);
