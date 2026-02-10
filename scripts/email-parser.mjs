#!/usr/bin/env node
/**
 * Email Report Parser for Custodial Command
 * 
 * Parses unstructured email reports and inserts them into the database
 * Compatible with the existing Custodial Command application
 * 
 * Usage:
 *   node scripts/email-parser.mjs --file email.txt
 *   node scripts/email-parser.mjs --interactive
 */

import { readFileSync } from 'fs';
import { insertInspectionSchema, insertCustodialNoteSchema } from '../shared/schema.js';
import pg from 'pg';

const { Client } = pg;

// Database connection
const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_WwJEd5ILV7lq@ep-aged-wind-ad9g7vhf-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

/**
 * Extract structured data from email text
 * This is a template - customize based on your actual email format
 */
function parseEmailReport(emailText) {
  console.log('\n📧 Parsing email report...\n');
  
  // Common patterns to extract
  const patterns = {
    school: /school[:\s]+([A-Z]{2,4}|[A-Za-z\s]+)/i,
    date: /date[:\s]+(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{2,4})/i,
    inspector: /inspector[:\s]+([A-Za-z\s\.]+)/i,
    location: /location[:\s]+([^\n]+)/i,
    notes: /notes?[:\s]+([^\n]+(?:\n(?!school|date|inspector|location)[^\n]+)*)/i,
    
    // Rating patterns (1-5 scale)
    floors: /floors?[:\s]+(\d)/i,
    surfaces: /(?:vertical|horizontal|surfaces?)[:\s]+(\d)/i,
    ceiling: /ceiling[:\s]+(\d)/i,
    restrooms: /restrooms?[:\s]+(\d)/i,
    trash: /trash[:\s]+(\d)/i,
  };

  const extracted = {};
  
  // Extract each field
  for (const [key, pattern] of Object.entries(patterns)) {
    const match = emailText.match(pattern);
    if (match) {
      extracted[key] = match[1].trim();
    }
  }

  // Normalize date format to YYYY-MM-DD
  if (extracted.date) {
    const dateMatch = extracted.date.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
    if (dateMatch) {
      let [, month, day, year] = dateMatch;
      if (year.length === 2) year = '20' + year;
      extracted.date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }

  console.log('📋 Extracted data:');
  console.log(JSON.stringify(extracted, null, 2));
  
  return extracted;
}

/**
 * Determine if this should be an inspection or custodial note
 * Based on whether we have rating data
 */
function classifyReport(extracted) {
  const hasRatings = ['floors', 'surfaces', 'ceiling', 'restrooms', 'trash']
    .some(field => extracted[field]);
  
  return hasRatings ? 'inspection' : 'custodial_note';
}

/**
 * Map extracted data to inspection schema
 */
function mapToInspection(extracted) {
  return {
    inspectorName: extracted.inspector || 'Unknown',
    school: extracted.school || 'Unknown',
    date: extracted.date || new Date().toISOString().split('T')[0],
    inspectionType: 'single_room',
    locationDescription: extracted.location || '',
    roomNumber: null,
    locationCategory: null,
    floors: extracted.floors ? parseInt(extracted.floors) : null,
    verticalHorizontalSurfaces: extracted.surfaces ? parseInt(extracted.surfaces) : null,
    ceiling: extracted.ceiling ? parseInt(extracted.ceiling) : null,
    restrooms: extracted.restrooms ? parseInt(extracted.restrooms) : null,
    customerSatisfaction: null,
    trash: extracted.trash ? parseInt(extracted.trash) : null,
    projectCleaning: null,
    activitySupport: null,
    safetyCompliance: null,
    equipment: null,
    monitoring: null,
    notes: extracted.notes || null,
    images: [],
    verifiedRooms: [],
    isCompleted: false,
  };
}

/**
 * Map extracted data to custodial note schema
 */
function mapToCustodialNote(extracted) {
  return {
    inspectorName: extracted.inspector || 'Unknown',
    school: extracted.school || 'Unknown',
    date: extracted.date || new Date().toISOString().split('T')[0],
    location: extracted.location || 'Unknown',
    locationDescription: null,
    notes: extracted.notes || 'No notes provided',
    images: [],
  };
}

/**
 * Insert inspection into database
 */
async function insertInspection(client, data) {
  const query = `
    INSERT INTO inspections (
      inspector_name, school, date, inspection_type, location_description,
      room_number, location_category, floors, vertical_horizontal_surfaces,
      ceiling, restrooms, customer_satisfaction, trash, project_cleaning,
      activity_support, safety_compliance, equipment, monitoring, notes,
      images, verified_rooms, is_completed
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22
    ) RETURNING id
  `;
  
  const values = [
    data.inspectorName,
    data.school,
    data.date,
    data.inspectionType,
    data.locationDescription,
    data.roomNumber,
    data.locationCategory,
    data.floors,
    data.verticalHorizontalSurfaces,
    data.ceiling,
    data.restrooms,
    data.customerSatisfaction,
    data.trash,
    data.projectCleaning,
    data.activitySupport,
    data.safetyCompliance,
    data.equipment,
    data.monitoring,
    data.notes,
    data.images,
    data.verifiedRooms,
    data.isCompleted,
  ];
  
  const result = await client.query(query, values);
  return result.rows[0].id;
}

/**
 * Insert custodial note into database
 */
async function insertCustodialNote(client, data) {
  const query = `
    INSERT INTO custodial_notes (
      inspector_name, school, date, location, location_description, notes, images
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7
    ) RETURNING id
  `;
  
  const values = [
    data.inspectorName,
    data.school,
    data.date,
    data.location,
    data.locationDescription,
    data.notes,
    data.images,
  ];
  
  const result = await client.query(query, values);
  return result.rows[0].id;
}

/**
 * Main processing function
 */
async function processEmailReport(emailText, options = {}) {
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('✅ Connected to database\n');
    
    // Step 1: Parse email
    const extracted = parseEmailReport(emailText);
    
    // Step 2: Classify report type
    const reportType = classifyReport(extracted);
    console.log(`\n📊 Report type: ${reportType}\n`);
    
    // Step 3: Map to schema
    let mappedData;
    let validatedData;
    
    if (reportType === 'inspection') {
      mappedData = mapToInspection(extracted);
      console.log('🔍 Mapped to inspection:');
      console.log(JSON.stringify(mappedData, null, 2));
      
      // Validate with Zod
      try {
        validatedData = insertInspectionSchema.parse(mappedData);
        console.log('\n✅ Validation passed\n');
      } catch (validationError) {
        console.error('❌ Validation failed:');
        console.error(validationError.errors);
        throw validationError;
      }
      
      // Preview before insert
      if (!options.autoConfirm) {
        console.log('\n📝 Preview - Will insert inspection:');
        console.log(JSON.stringify(validatedData, null, 2));
        console.log('\nPress Ctrl+C to cancel, or wait 5 seconds to continue...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
      
      // Insert
      const id = await insertInspection(client, validatedData);
      console.log(`\n✅ Inspection created successfully! ID: ${id}`);
      return { type: 'inspection', id, data: validatedData };
      
    } else {
      mappedData = mapToCustodialNote(extracted);
      console.log('🔍 Mapped to custodial note:');
      console.log(JSON.stringify(mappedData, null, 2));
      
      // Validate with Zod
      try {
        validatedData = insertCustodialNoteSchema.parse(mappedData);
        console.log('\n✅ Validation passed\n');
      } catch (validationError) {
        console.error('❌ Validation failed:');
        console.error(validationError.errors);
        throw validationError;
      }
      
      // Preview before insert
      if (!options.autoConfirm) {
        console.log('\n📝 Preview - Will insert custodial note:');
        console.log(JSON.stringify(validatedData, null, 2));
        console.log('\nPress Ctrl+C to cancel, or wait 5 seconds to continue...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
      
      // Insert
      const id = await insertCustodialNote(client, validatedData);
      console.log(`\n✅ Custodial note created successfully! ID: ${id}`);
      return { type: 'custodial_note', id, data: validatedData };
    }
    
  } catch (error) {
    console.error('\n❌ Error processing email report:');
    console.error(error);
    throw error;
  } finally {
    await client.end();
    console.log('\n✅ Connection closed\n');
  }
}

/**
 * CLI Interface
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Email Report Parser for Custodial Command

Usage:
  node scripts/email-parser.mjs --file <path>     Parse email from file
  node scripts/email-parser.mjs --interactive     Interactive mode (paste email)
  node scripts/email-parser.mjs --example         Show example email format

Options:
  --auto-confirm                                  Skip confirmation prompt
  --help, -h                                      Show this help
    `);
    return;
  }
  
  if (args.includes('--example')) {
    console.log(`
Example Email Format:

Subject: Custodial Inspection Report

School: GWC
Date: 11/20/2025
Inspector: John Smith
Location: Main Building, Room 101

Floors: 4
Surfaces: 5
Ceiling: 4
Restrooms: 5
Trash: 4

Notes: Overall good condition. Minor scuff marks on walls near entrance.
Restrooms were exceptionally clean. Recommend deep cleaning of ceiling tiles
in the next maintenance cycle.

---

This parser will extract the data and insert it into the database.
Customize the patterns in parseEmailReport() to match your email format.
    `);
    return;
  }
  
  const fileIndex = args.indexOf('--file');
  const autoConfirm = args.includes('--auto-confirm');
  
  let emailText;
  
  if (fileIndex !== -1 && args[fileIndex + 1]) {
    // Read from file
    const filePath = args[fileIndex + 1];
    console.log(`📄 Reading email from: ${filePath}\n`);
    emailText = readFileSync(filePath, 'utf-8');
  } else if (args.includes('--interactive')) {
    // Interactive mode - read from stdin
    console.log('📧 Interactive mode - paste your email and press Ctrl+D (or Ctrl+Z on Windows) when done:\n');
    const chunks = [];
    for await (const chunk of process.stdin) {
      chunks.push(chunk);
    }
    emailText = Buffer.concat(chunks).toString('utf-8');
  } else {
    console.error('❌ Error: Please specify --file <path> or --interactive');
    console.log('Run with --help for usage information');
    process.exit(1);
  }
  
  if (!emailText || emailText.trim().length === 0) {
    console.error('❌ Error: Email text is empty');
    process.exit(1);
  }
  
  await processEmailReport(emailText, { autoConfirm });
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { processEmailReport, parseEmailReport, mapToInspection, mapToCustodialNote };
