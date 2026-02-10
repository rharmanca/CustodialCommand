#!/usr/bin/env node
/**
 * Monthly Feedback Email Parser for Custodial Command (v2)
 * 
 * Parses monthly custodial feedback emails and:
 * 1. Uploads the original PDF to monthly_feedback table
 * 2. Creates custodial notes for each location
 * 
 * Usage:
 *   node scripts/parse-monthly-feedback-v2.mjs --file "LCA Dec 2025.pdf"
 */

import { execSync } from 'child_process';
import { readFileSync, statSync, createReadStream } from 'fs';
import { createRequire } from 'module';
import pg from 'pg';
import path from 'path';

const require = createRequire(import.meta.url);
const FormData = require('form-data');
const fetch = require('node-fetch');

const { Client } = pg;

// Configuration
const API_BASE_URL = process.env.API_URL || 'http://localhost:5000';
const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_WwJEd5ILV7lq@ep-aged-wind-ad9g7vhf-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

/**
 * Extract text from PDF using Python
 */
function extractPDFText(pdfPath) {
  try {
    const text = execSync(`python scripts/extract_pdf.py "${pdfPath}"`, { 
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer
    });
    return text;
  } catch (error) {
    console.error('❌ Error extracting PDF:', error.message);
    if (error.stderr) {
      console.error('Python error:', error.stderr.toString());
    }
    throw error;
  }
}

/**
 * Parse monthly feedback email
 */
function parseMonthlyFeedback(emailText) {
  console.log('\n📧 Parsing monthly feedback email...\n');
  
  const data = {
    school: null,
    date: null,
    month: null,
    year: null,
    inspector: null,
    scores: {},
    glows: [],
    grows: [],
    locations: []
  };
  
  // Extract school
  const schoolMatch = emailText.match(/Livingston Collegiate|LCA|GWC|CBR|ASA/i);
  if (schoolMatch) {
    data.school = schoolMatch[0].includes('Livingston') ? 'LCA' : schoolMatch[0].toUpperCase();
  }
  
  // Extract date from email header
  const dateMatch = emailText.match(/(\w{3}), (\w{3}) (\d{1,2}), (\d{4})/);
  if (dateMatch) {
    const [, , month, day, year] = dateMatch;
    data.month = month;
    data.year = parseInt(year);
    data.date = `${year}-${getMonthNumber(month)}-${day.padStart(2, '0')}`;
  }
  
  // Extract inspector name
  const inspectorMatch = emailText.match(/([A-Z][a-z]+(?:')?(?:\s+[A-Z][a-z]+)*)\s+<\w+@/);
  if (inspectorMatch) {
    data.inspector = inspectorMatch[1];
  }
  
  // Extract scores
  const scorePatterns = {
    customerSatisfaction: /Customer Satisfaction.*?-\s*(\d)/i,
    trash: /Trash.*?-\s*(\d)/i,
    projectCleaning: /Project Cleaning.*?-\s*(\d)/i,
    activitySupport: /Activity Support.*?-\s*(\d)/i,
    safetyCompliance: /Safety.*?Compliance.*?-\s*(\d)/i,
    equipment: /Equipment.*?-\s*(\d)/i,
    monitoring: /Performance Efficiency.*?-\s*(\d)/i
  };
  
  for (const [key, pattern] of Object.entries(scorePatterns)) {
    const match = emailText.match(pattern);
    if (match) {
      data.scores[key] = parseInt(match[1]);
    }
  }
  
  // Extract Glows
  const glowsSection = emailText.match(/Glows\s+((?:- .+\n?)+)/i);
  if (glowsSection) {
    data.glows = glowsSection[1]
      .split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.replace(/^-\s*/, '').trim());
  }
  
  // Extract Grows
  const growsSection = emailText.match(/Grows\s+((?:- .+\n?)+)/i);
  if (growsSection) {
    data.grows = growsSection[1]
      .split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.replace(/^-\s*/, '').trim());
  }
  
  // Extract location-specific feedback
  const sections = [
    'BLEACHERS',
    'GYM',
    'CLASSROOMS',
    'CAFETERIA',
    'OFFICES',
    'HALLWAYS',
    'RESTROOMS',
    'STAIRWELLS'
  ];
  
  for (const section of sections) {
    const regex = new RegExp(`${section}\\s+([\\s\\S]*?)(?=(?:${sections.join('|')})|Please let me know|Thanks,|$)`, 'i');
    const match = emailText.match(regex);
    
    if (match) {
      const sectionText = match[1];
      const items = sectionText.split('\n').filter(line => line.trim().length > 0);
      
      items.forEach(item => {
        const trimmed = item.trim();
        if (trimmed.startsWith('-') || /^\d{4}/.test(trimmed)) {
          const roomMatch = trimmed.match(/^(\d{4}|[\w\s]+?)\s*-\s*(.+)/);
          
          if (roomMatch) {
            data.locations.push({
              category: section.toLowerCase(),
              room: roomMatch[1].trim(),
              notes: roomMatch[2].trim()
            });
          } else {
            data.locations.push({
              category: section.toLowerCase(),
              room: null,
              notes: trimmed.replace(/^-\s*/, '')
            });
          }
        }
      });
    }
  }
  
  return data;
}

/**
 * Helper to convert month name to number
 */
function getMonthNumber(monthName) {
  const months = {
    'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
    'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
    'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
  };
  return months[monthName] || '01';
}

/**
 * Get full month name from abbreviation
 */
function getFullMonthName(monthAbbr) {
  const months = {
    'Jan': 'January', 'Feb': 'February', 'Mar': 'March', 'Apr': 'April',
    'May': 'May', 'Jun': 'June', 'Jul': 'July', 'Aug': 'August',
    'Sep': 'September', 'Oct': 'October', 'Nov': 'November', 'Dec': 'December'
  };
  return months[monthAbbr] || monthAbbr;
}

/**
 * Upload PDF to monthly_feedback table via API
 */
async function uploadPDFToDatabase(pdfPath, data) {
  console.log('\n📤 Uploading PDF to database...\n');
  
  const form = new FormData();
  form.append('pdf', createReadStream(pdfPath));
  form.append('school', data.school || 'Unknown');
  form.append('month', getFullMonthName(data.month) || 'Unknown');
  form.append('year', data.year?.toString() || new Date().getFullYear().toString());
  form.append('uploadedBy', data.inspector || 'Automated Import');
  form.append('notes', `Imported from ${path.basename(pdfPath)}`);
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/monthly-feedback`, {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Upload failed');
    }
    
    console.log(`✅ PDF uploaded successfully! Monthly Feedback ID: ${result.id}`);
    return result.id;
    
  } catch (error) {
    console.error('❌ Error uploading PDF:', error.message);
    throw error;
  }
}

/**
 * Insert custodial notes for each location
 */
async function insertFeedbackData(client, data) {
  console.log('\n📝 Creating custodial notes...\n');
  
  const insertedIds = [];
  
  for (const location of data.locations) {
    const noteText = `
${location.notes}

Overall Scores:
- Customer Satisfaction: ${data.scores.customerSatisfaction || 'N/A'}
- Trash: ${data.scores.trash || 'N/A'}
- Project Cleaning: ${data.scores.projectCleaning || 'N/A'}
- Activity Support: ${data.scores.activitySupport || 'N/A'}
- Safety & Compliance: ${data.scores.safetyCompliance || 'N/A'}
- Equipment: ${data.scores.equipment || 'N/A'}
- Performance Efficiency: ${data.scores.monitoring || 'N/A'}

Glows:
${data.glows.map(g => `- ${g}`).join('\n')}

Grows:
${data.grows.map(g => `- ${g}`).join('\n')}
`.trim();
    
    const query = `
      INSERT INTO custodial_notes (
        inspector_name, school, date, location, location_description, notes, images
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `;
    
    const values = [
      data.inspector || 'Unknown',
      data.school || 'Unknown',
      data.date || new Date().toISOString().split('T')[0],
      location.category,
      location.room,
      noteText,
      []
    ];
    
    try {
      const result = await client.query(query, values);
      insertedIds.push(result.rows[0].id);
      console.log(`✅ Created note for ${location.category}${location.room ? ` - ${location.room}` : ''} (ID: ${result.rows[0].id})`);
    } catch (error) {
      console.error(`❌ Error inserting ${location.category}:`, error.message);
    }
  }
  
  return insertedIds;
}

/**
 * Main processing function
 */
async function processMonthlyFeedback(pdfPath, emailText) {
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('✅ Connected to database\n');
    
    // Parse the email
    const data = parseMonthlyFeedback(emailText);
    
    console.log('📊 Parsed Data Summary:');
    console.log(`   School: ${data.school}`);
    console.log(`   Date: ${data.date}`);
    console.log(`   Month: ${getFullMonthName(data.month)} ${data.year}`);
    console.log(`   Inspector: ${data.inspector}`);
    console.log(`   Scores: ${Object.keys(data.scores).length} categories`);
    console.log(`   Glows: ${data.glows.length} items`);
    console.log(`   Grows: ${data.grows.length} items`);
    console.log(`   Locations: ${data.locations.length} entries`);
    
    // Upload PDF to database
    let monthlyFeedbackId = null;
    if (pdfPath) {
      try {
        monthlyFeedbackId = await uploadPDFToDatabase(pdfPath, data);
      } catch (uploadError) {
        console.warn('⚠️  PDF upload failed, continuing with custodial notes...');
      }
    }
    
    // Preview
    console.log('\n📋 Preview of locations to be inserted:');
    data.locations.slice(0, 5).forEach(loc => {
      console.log(`   - ${loc.category}${loc.room ? ` (${loc.room})` : ''}: ${loc.notes.substring(0, 60)}...`);
    });
    if (data.locations.length > 5) {
      console.log(`   ... and ${data.locations.length - 5} more`);
    }
    
    console.log('\n⏳ Waiting 5 seconds before inserting... (Ctrl+C to cancel)');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Insert custodial notes
    const insertedIds = await insertFeedbackData(client, data);
    
    console.log(`\n✅ Successfully created ${insertedIds.length} custodial notes!`);
    console.log(`   IDs: ${insertedIds.join(', ')}`);
    
    if (monthlyFeedbackId) {
      console.log(`\n📄 Original PDF stored as Monthly Feedback ID: ${monthlyFeedbackId}`);
    }
    
    return { 
      success: true, 
      count: insertedIds.length, 
      ids: insertedIds,
      monthlyFeedbackId 
    };
    
  } catch (error) {
    console.error('\n❌ Error processing monthly feedback:', error);
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
Monthly Feedback Email Parser for Custodial Command (v2)

Features:
  - Uploads original PDF to monthly_feedback table
  - Creates custodial notes for each location

Usage:
  node scripts/parse-monthly-feedback-v2.mjs --file <pdf-path>
  node scripts/parse-monthly-feedback-v2.mjs --help

Examples:
  node scripts/parse-monthly-feedback-v2.mjs --file "LCA Dec 2025.pdf"
    `);
    return;
  }
  
  const fileIndex = args.indexOf('--file');
  
  if (fileIndex === -1 || !args[fileIndex + 1]) {
    console.error('❌ Error: Please specify --file <path>');
    console.log('Run with --help for usage information');
    process.exit(1);
  }
  
  const filePath = args[fileIndex + 1];
  console.log(`📄 Reading from: ${filePath}\n`);
  
  let emailText;
  let pdfPath = null;
  
  if (filePath.toLowerCase().endsWith('.pdf')) {
    emailText = extractPDFText(filePath);
    pdfPath = filePath;
  } else {
    emailText = readFileSync(filePath, 'utf-8');
  }
  
  if (!emailText || emailText.trim().length === 0) {
    console.error('❌ Error: Email text is empty');
    process.exit(1);
  }
  
  await processMonthlyFeedback(pdfPath, emailText);
}

// Run if called directly
if (process.argv[1] && process.argv[1].includes('parse-monthly-feedback-v2.mjs')) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { processMonthlyFeedback, parseMonthlyFeedback, extractPDFText };
