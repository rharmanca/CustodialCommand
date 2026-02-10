import fs from 'fs';
import path from 'path';

const backupDir = '.backups/test-data-cleanup-2026-02-10';

// Read the full API response
const allData = JSON.parse(fs.readFileSync(path.join(backupDir, 'inspections_api_all.json'), 'utf8'));
const allInspections = allData.data || [];

console.log(`Total inspections in API: ${allInspections.length}`);

// Filter for test inspections in the specified ID range (460-714)
const testInspections = allInspections.filter(i => i.id >= 460 && i.id <= 714);
console.log(`Test inspections (IDs 460-714): ${testInspections.length}`);

// Also find any other test inspections by name pattern
const testPatternInspections = allInspections.filter(i => 
  i.id < 460 && (
    (i.inspectorName && (
      i.inspectorName.toLowerCase().includes('test') ||
      i.inspectorName.toLowerCase().includes('automated') ||
      i.inspectorName.toLowerCase().includes('xss')
    )) ||
    (i.notes && (
      i.notes.toLowerCase().includes('test') ||
      i.notes.toLowerCase().includes('automated') ||
      i.notes.toLowerCase().includes('csrf')
    ))
  )
);
console.log(`Additional test inspections by pattern: ${testPatternInspections.length}`);

// Combine all test inspections
const allTestInspections = [...testInspections, ...testPatternInspections];
console.log(`\nTotal test inspections: ${allTestInspections.length}`);

// Save detailed test inspections backup
fs.writeFileSync(
  path.join(backupDir, 'inspections_backup.json'),
  JSON.stringify({
    backupDate: new Date().toISOString(),
    criteria: 'IDs 460-714 OR inspector_name/test notes patterns',
    count: allTestInspections.length,
    data: allTestInspections
  }, null, 2)
);

// Create summary with just IDs and key info for quick reference
const summary = allTestInspections.map(i => ({
  id: i.id,
  inspectorName: i.inspectorName,
  school: i.school,
  date: i.date,
  notes: i.notes ? i.notes.substring(0, 100) + (i.notes.length > 100 ? '...' : '') : null,
  createdAt: i.createdAt
}));

fs.writeFileSync(
  path.join(backupDir, 'inspections_summary.json'),
  JSON.stringify(summary, null, 2)
);

console.log('\n=== Backup Files Created ===');
console.log(`1. inspections_backup.json - Full data (${allTestInspections.length} records)`);
console.log(`2. inspections_summary.json - Summary view (${summary.length} records)`);

// List the IDs
const ids = allTestInspections.map(i => i.id).sort((a, b) => a - b);
console.log(`\nTest Inspection IDs: ${ids.join(', ')}`);

