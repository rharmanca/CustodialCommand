import fs from 'fs';

const allData = JSON.parse(fs.readFileSync('.backups/test-data-cleanup-2026-02-10/inspections_api_all.json', 'utf8'));
const inspections = allData.data || [];

console.log('=== INSPECTIONS ANALYSIS ===\n');
console.log(`Total inspections: ${inspections.length}\n`);

// Sort by ID
const sorted = [...inspections].sort((a, b) => a.id - b.id);

console.log('ID Range:');
console.log(`  Min ID: ${sorted[0]?.id}`);
console.log(`  Max ID: ${sorted[sorted.length - 1]?.id}\n`);

// Find test records
const testRecords = sorted.filter(i => {
  const name = (i.inspectorName || '').toLowerCase();
  const notes = (i.notes || '').toLowerCase();
  return name.includes('test') || 
         name.includes('automated') || 
         name.includes('xss') ||
         notes.includes('test') ||
         notes.includes('automated') ||
         notes.includes('csrf');
});

console.log(`Test records found: ${testRecords.length}\n`);

testRecords.forEach(i => {
  console.log(`ID: ${i.id}`);
  console.log(`  Inspector: ${i.inspectorName}`);
  console.log(`  School: ${i.school}`);
  console.log(`  Date: ${i.date}`);
  console.log(`  Notes: ${i.notes?.substring(0, 80) || 'None'}...`);
  console.log('');
});

// All records
console.log('\n=== ALL RECORDS ===');
sorted.forEach(i => {
  console.log(`ID ${i.id}: ${i.inspectorName} (${i.school}) - ${i.date}`);
});
