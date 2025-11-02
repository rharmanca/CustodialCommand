/**
 * Test script for PDF walkthrough report generation
 *
 * This script tests the generateWalkthroughReportPDF function with sample data
 * to verify the PDF export feature works correctly in production.
 */

import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Dynamic import of the PDF generator
async function testPDFExport() {
  try {
    console.log('🔍 Loading PDF generator module...');

    // Import the module (this will be transpiled TypeScript)
    const { generateWalkthroughReportPDF } = await import('./src/utils/printReportGenerator.ts');

    console.log('✅ Module loaded successfully\n');

    // Create sample inspection data
    const sampleInspections = [
      {
        id: 1,
        inspectorName: 'Test Inspector',
        school: 'Central Academy',
        date: '2025-01-15',
        inspectionType: 'whole_building',
        locationDescription: 'Main Office',
        locationCategory: 'Administrative',
        floors: 5,
        verticalHorizontalSurfaces: 4,
        ceiling: 5,
        restrooms: null,
        customerSatisfaction: 4,
        trash: 5,
        projectCleaning: 4,
        activitySupport: 5,
        safetyCompliance: 5,
        equipment: 4,
        monitoring: 4,
        notes: 'Excellent condition overall',
        images: [],
        verifiedRooms: ['office'],
        isCompleted: true,
        createdAt: new Date('2025-01-15T10:00:00Z')
      },
      {
        id: 2,
        inspectorName: 'Test Inspector',
        school: 'Central Academy',
        date: '2025-01-15',
        inspectionType: 'whole_building',
        locationDescription: 'Main Hallway',
        locationCategory: 'Hallway',
        floors: 3,
        verticalHorizontalSurfaces: 3,
        ceiling: 4,
        restrooms: null,
        customerSatisfaction: 3,
        trash: 4,
        projectCleaning: 3,
        activitySupport: 4,
        safetyCompliance: 4,
        equipment: 3,
        monitoring: 3,
        notes: 'Some wear and tear visible',
        images: [],
        verifiedRooms: ['hallway'],
        isCompleted: true,
        createdAt: new Date('2025-01-15T10:30:00Z')
      },
      {
        id: 3,
        inspectorName: 'Test Inspector',
        school: 'Central Academy',
        date: '2025-01-15',
        inspectionType: 'whole_building',
        locationDescription: 'Student Restroom - 1st Floor',
        locationCategory: 'Restroom',
        floors: 4,
        verticalHorizontalSurfaces: 4,
        ceiling: 5,
        restrooms: 4,
        customerSatisfaction: 4,
        trash: 5,
        projectCleaning: 4,
        activitySupport: 5,
        safetyCompliance: 5,
        equipment: 4,
        monitoring: 4,
        notes: 'Well maintained, supplies stocked',
        images: [],
        verifiedRooms: ['restroom'],
        isCompleted: true,
        createdAt: new Date('2025-01-15T11:00:00Z')
      },
      {
        id: 4,
        inspectorName: 'Test Inspector',
        school: 'Central Academy',
        date: '2025-01-15',
        inspectionType: 'whole_building',
        locationDescription: 'Room 101 - Classroom',
        locationCategory: 'Classroom',
        floors: 4,
        verticalHorizontalSurfaces: 4,
        ceiling: 4,
        restrooms: null,
        customerSatisfaction: 5,
        trash: 4,
        projectCleaning: 4,
        activitySupport: 5,
        safetyCompliance: 4,
        equipment: 4,
        monitoring: 4,
        notes: 'Clean and ready for instruction',
        images: [],
        verifiedRooms: ['classroom'],
        isCompleted: true,
        createdAt: new Date('2025-01-15T11:30:00Z')
      },
      {
        id: 5,
        inspectorName: 'Test Inspector',
        school: 'Central Academy',
        date: '2025-01-15',
        inspectionType: 'whole_building',
        locationDescription: 'Cafeteria',
        locationCategory: 'Cafeteria',
        floors: 3,
        verticalHorizontalSurfaces: 3,
        ceiling: 4,
        restrooms: null,
        customerSatisfaction: 3,
        trash: 3,
        projectCleaning: 3,
        activitySupport: 4,
        safetyCompliance: 4,
        equipment: 3,
        monitoring: 3,
        notes: 'Needs attention after lunch service',
        images: [],
        verifiedRooms: ['cafeteria'],
        isCompleted: true,
        createdAt: new Date('2025-01-15T12:00:00Z')
      }
    ];

    // Create completion status summary
    const completionStatus = [
      { category: 'Administrative', required: 2, completed: 2 },
      { category: 'Hallways', required: 3, completed: 3 },
      { category: 'Restrooms', required: 4, completed: 4 },
      { category: 'Classrooms', required: 20, completed: 20 },
      { category: 'Cafeteria', required: 1, completed: 1 },
      { category: 'Gymnasium', required: 1, completed: 1 },
      { category: 'Library', required: 1, completed: 1 }
    ];

    // Create report data
    const reportData = {
      school: 'Central Academy',
      date: '2025-01-15',
      inspectorName: 'Test Inspector',
      inspections: sampleInspections,
      completionStatus: completionStatus,
      overallRating: 4.1,
      notes: 'Overall building is in good condition. Some areas require routine maintenance. All critical areas have been inspected and meet standards.'
    };

    console.log('📊 Sample Report Data:');
    console.log('  School:', reportData.school);
    console.log('  Date:', reportData.date);
    console.log('  Inspector:', reportData.inspectorName);
    console.log('  Inspections:', reportData.inspections.length);
    console.log('  Overall Rating:', reportData.overallRating + '/5.0');
    console.log('  Categories:', completionStatus.length);
    console.log('');

    console.log('🔨 Generating PDF...');
    const pdfBlob = generateWalkthroughReportPDF(reportData);

    console.log('✅ PDF generated successfully');
    console.log('  Blob size:', pdfBlob.size, 'bytes');
    console.log('  Blob type:', pdfBlob.type);
    console.log('');

    // Convert blob to buffer and save
    const buffer = Buffer.from(await pdfBlob.arrayBuffer());
    const outputPath = join(__dirname, 'test-walkthrough-report.pdf');

    writeFileSync(outputPath, buffer);

    console.log('💾 PDF saved to:', outputPath);
    console.log('');
    console.log('✨ Test completed successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('  1. Open the PDF file to verify formatting');
    console.log('  2. Check all data is displayed correctly');
    console.log('  3. Verify tables, ratings, and notes are present');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('');
    console.error('Stack trace:');
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the test
console.log('🧪 Testing Walkthrough Report PDF Generation');
console.log('='.repeat(50));
console.log('');

testPDFExport();
