import fetch from 'node-fetch';
import { FormData } from 'formdata-node';
import { testData } from './test-data.js';

// Test configuration
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5000';

class SubmissionTestDataGenerator {
  constructor() {
    this.createdIds = {};
    this.submissionCount = 0;
  }

  log(message, status = 'INFO') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${status}: ${message}`);
  }

  // Generate multiple test submissions for different scenarios
  async generateTestSubmissions(count = 5) {
    this.log(`=== Generating ${count} test submissions for each type ===`);
    
    // Create multiple single room inspections
    for (let i = 0; i < count; i++) {
      const submission = {
        ...testData.singleRoomInspection,
        inspectorName: `Test Inspector ${i + 1}`,
        roomNumber: `TEST-${100 + i}`,
        date: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0], // Random date in last week
        locationDescription: `Test location for room ${100 + i}`,
        floors: Math.floor(Math.random() * 5) + 1,
        verticalHorizontalSurfaces: Math.floor(Math.random() * 5) + 1,
        ceiling: Math.floor(Math.random() * 5) + 1,
        notes: `Automated test submission #${i + 1}`
      };
      
      this.log(`Creating single room inspection #${i + 1} for ${submission.school} - Room ${submission.roomNumber}`);
      await this.createSubmission('/api/inspections', submission, `Single Room #${i + 1}`);
    }

    // Create multiple building inspections
    for (let i = 0; i < Math.floor(count / 2); i++) {  // Fewer building inspections
      const submission = {
        ...testData.buildingInspection,
        inspectorName: `Building Inspector ${i + 1}`,
        school: testData.schools[Math.floor(Math.random() * testData.schools.length)].value,
        date: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
        locationDescription: `Building inspection for ${submission.school}`,
        notes: `Automated building inspection #${i + 1}`
      };
      
      this.log(`Creating building inspection #${i + 1} for ${submission.school}`);
      await this.createSubmission('/api/inspections', submission, `Building #${i + 1}`);
    }

    // Create multiple custodial notes
    for (let i = 0; i < count; i++) {
      const submission = {
        ...testData.custodialNotes,
        school: testData.schools[Math.floor(Math.random() * testData.schools.length)].value,
        location: `Location-${i + 1}`,
        date: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
        locationDescription: `Test area for custodial concern #${i + 1}`,
        notes: `Custodial concern reported on ${new Date().toISOString().split('T')[0]} - Item #${i + 1}`
      };
      
      this.log(`Creating custodial note #${i + 1} for ${submission.school}`);
      await this.createSubmission('/api/custodial-notes', submission, `Custodial Note #${i + 1}`);
    }

    this.log(`=== Completed generating ${count} test submissions per type ===`);
  }

  async createSubmission(endpoint, data, description) {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const responseText = await response.text();
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = { raw: responseText };
      }

      if (response.ok) {
        this.log(`✅ ${description} created successfully - ID: ${responseData.id || 'N/A'}`, 'PASS');
        this.submissionCount++;
        
        // Store the ID if available for potential later use
        if (responseData.id) {
          if (endpoint.includes('inspections')) {
            if (!this.createdIds.inspections) this.createdIds.inspections = [];
            this.createdIds.inspections.push(responseData.id);
          } else if (endpoint.includes('custodial-notes')) {
            if (!this.createdIds.custodialNotes) this.createdIds.custodialNotes = [];
            this.createdIds.custodialNotes.push(responseData.id);
          }
        }
      } else {
        this.log(`❌ ${description} failed - Status: ${response.status}, Error: ${JSON.stringify(responseData)}`, 'FAIL');
      }
    } catch (error) {
      this.log(`❌ ${description} error: ${error.message}`, 'FAIL');
    }
  }

  // Create test data with images
  async generateTestSubmissionsWithImages(count = 3) {
    this.log(`=== Generating ${count} test submissions with images ===`);
    
    for (let i = 0; i < count; i++) {
      // For image uploads, we need to use FormData
      const formData = new FormData();
      
      // Add inspection data as JSON string
      const inspectionData = {
        ...testData.singleRoomInspection,
        inspectorName: `Image Inspector ${i + 1}`,
        roomNumber: `IMG-${100 + i}`,
        date: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
        locationDescription: `Test location with image ${i + 1}`,
        notes: `Inspection with image attachment #${i + 1}`
      };
      
      formData.append('inspectorName', inspectionData.inspectorName);
      formData.append('school', inspectionData.school);
      formData.append('date', inspectionData.date);
      formData.append('inspectionType', inspectionData.inspectionType);
      formData.append('locationDescription', inspectionData.locationDescription);
      formData.append('roomNumber', inspectionData.roomNumber);
      formData.append('locationCategory', inspectionData.locationCategory || '');
      formData.append('notes', inspectionData.notes);
      
      // Add a simple 1x1 pixel image for testing
      const imageBuffer = Buffer.from(testData.testImages.png1x1, 'base64');
      const imageName = `test-image-${i + 1}.png`;
      formData.append('images', new Blob([imageBuffer], { type: 'image/png' }), imageName);
      
      try {
        const response = await fetch(`${BASE_URL}/api/inspections`, {
          method: 'POST',
          body: formData
        });

        const responseText = await response.text();
        let responseData;
        try {
          responseData = JSON.parse(responseText);
        } catch {
          responseData = { raw: responseText };
        }

        if (response.ok) {
          this.log(`✅ Image submission #${i + 1} created successfully - ID: ${responseData.id || 'N/A'}`, 'PASS');
          this.submissionCount++;
        } else {
          this.log(`❌ Image submission #${i + 1} failed - Status: ${response.status}, Error: ${JSON.stringify(responseData)}`, 'FAIL');
        }
      } catch (error) {
        this.log(`❌ Image submission #${i + 1} error: ${error.message}`, 'FAIL');
      }
    }
  }

  // Create submissions for different schools
  async generateSchoolSpecificSubmissions() {
    this.log('=== Generating submissions for all schools ===');
    
    for (const school of testData.schools) {
      // Create a single room inspection for the school
      const singleRoomData = {
        ...testData.singleRoomInspection,
        school: school.value,
        inspectorName: `Inspector ${school.value}`,
        roomNumber: `${school.value}-001`,
        locationDescription: `Test room at ${school.label}`,
        notes: `Test inspection for ${school.label}`
      };
      
      await this.createSubmission('/api/inspections', singleRoomData, `Single Room for ${school.value}`);
      
      // Create a custodial note for the school
      const custodialNoteData = {
        ...testData.custodialNotes,
        school: school.value,
        location: `Area A - ${school.value}`,
        locationDescription: `Main area at ${school.label}`,
        notes: `Custodial note for ${school.label} reported on ${new Date().toISOString().split('T')[0]}`
      };
      
      await this.createSubmission('/api/custodial-notes', custodialNoteData, `Custodial Note for ${school.value}`);
    }
  }

  // Create submissions with different rating scenarios
  async generateRatingScenarioSubmissions() {
    this.log('=== Generating submissions with different rating scenarios ===');
    
    const scenarios = ['lowRatingsInspection', 'highRatingsInspection', 'partialRatingsInspection'];
    
    for (const scenario of scenarios) {
      const submission = {
        ...testData.testScenarios[scenario],
        date: new Date().toISOString().split('T')[0],
        notes: `${testData.testScenarios[scenario].notes} - Created by rating scenario test`
      };
      
      await this.createSubmission('/api/inspections', submission, `Rating Scenario: ${scenario}`);
    }
  }

  // Generate comprehensive test data
  async generateAllTestData() {
    this.log('🚀 Starting comprehensive test data generation');
    
    await this.generateTestSubmissions(5);
    await this.generateSchoolSpecificSubmissions();
    await this.generateRatingScenarioSubmissions();
    await this.generateTestSubmissionsWithImages(3);
    
    this.log(`=== SUMMARY: Created ${this.submissionCount} test submissions ===`);
    this.log(`Created IDs:`, this.createdIds);
  }
}

// Run the test data generation
const generator = new SubmissionTestDataGenerator();
generator.generateAllTestData().catch(console.error);