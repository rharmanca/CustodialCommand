#!/usr/bin/env node
/**
 * Upload PDF directly to database (monthly_feedback table)
 * 
 * Usage:
 *   node scripts/upload-pdf-to-db.mjs --file "LCA Dec 2025.pdf" --school "LCA" --month "December" --year 2025
 */

import { readFileSync } from 'fs';
import { execSync } from 'child_process';
import pg from 'pg';
import path from 'path';

const { Client } = pg;

const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_WwJEd5ILV7lq@ep-aged-wind-ad9g7vhf-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

/**
 * Extract text from PDF
 */
function extractPDFText(pdfPath) {
  try {
    const text = execSync(`python scripts/extract_pdf.py "${pdfPath}"`, { 
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024
    });
    return text;
  } catch (error) {
    console.warn('⚠️  Could not extract text from PDF');
    return null;
  }
}

/**
 * Upload PDF to database
 */
async function uploadPDF(pdfPath, school, month, year, uploadedBy = 'Automated Import') {
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('✅ Connected to database\n');
    
    // Read PDF file
    const pdfBuffer = readFileSync(pdfPath);
    const fileName = path.basename(pdfPath);
    const fileSize = pdfBuffer.length;
    
    console.log(`📄 File: ${fileName}`);
    console.log(`📏 Size: ${(fileSize / 1024).toFixed(2)} KB`);
    
    // Extract text
    console.log('\n📝 Extracting text from PDF...');
    const extractedText = extractPDFText(pdfPath);
    
    if (extractedText) {
      console.log(`✅ Extracted ${extractedText.length} characters`);
    } else {
      console.log('⚠️  No text extracted');
    }
    
    // For now, we'll store the PDF path as a reference
    // In production, you'd upload to object storage first
    const pdfUrl = `/pdfs/${fileName}`;
    
    const query = `
      INSERT INTO monthly_feedback (
        school, month, year, pdf_url, pdf_file_name, 
        extracted_text, notes, uploaded_by, file_size
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `;
    
    const values = [
      school,
      month,
      year,
      pdfUrl,
      fileName,
      extractedText,
      `Imported from ${fileName}`,
      uploadedBy,
      fileSize
    ];
    
    console.log('\n📤 Uploading to database...');
    const result = await client.query(query, values);
    const id = result.rows[0].id;
    
    console.log(`\n✅ Successfully uploaded! Monthly Feedback ID: ${id}`);
    console.log(`   School: ${school}`);
    console.log(`   Month: ${month} ${year}`);
    console.log(`   File: ${fileName}`);
    
    return id;
    
  } catch (error) {
    console.error('\n❌ Error uploading PDF:', error.message);
    throw error;
  } finally {
    await client.end();
    console.log('\n✅ Connection closed\n');
  }
}

/**
 * Parse month/year from filename
 */
function parseFilename(filename) {
  // Try to extract month and year from filename like "lca nov 2025.pdf"
  const monthMatch = filename.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i);
  const yearMatch = filename.match(/20\d{2}/);
  
  const monthMap = {
    'jan': 'January', 'feb': 'February', 'mar': 'March', 'apr': 'April',
    'may': 'May', 'jun': 'June', 'jul': 'July', 'aug': 'August',
    'sep': 'September', 'oct': 'October', 'nov': 'November', 'dec': 'December'
  };
  
  return {
    month: monthMatch ? monthMap[monthMatch[1].toLowerCase()] : null,
    year: yearMatch ? parseInt(yearMatch[0]) : null
  };
}

/**
 * CLI
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Upload PDF to Database (monthly_feedback table)

Usage:
  node scripts/upload-pdf-to-db.mjs --file <path> --school <school> --month <month> --year <year>
  node scripts/upload-pdf-to-db.mjs --file <path> --auto  (auto-detect from filename)

Options:
  --file <path>      Path to PDF file (required)
  --school <name>    School name (e.g., "LCA", "GWC")
  --month <name>     Month name (e.g., "December")
  --year <yyyy>      Year (e.g., 2025)
  --auto             Auto-detect school/month/year from filename
  --uploaded-by <name>  Who uploaded it (default: "Automated Import")

Examples:
  node scripts/upload-pdf-to-db.mjs --file "LCA Dec 2025.pdf" --school "LCA" --month "December" --year 2025
  node scripts/upload-pdf-to-db.mjs --file "lca nov 2025.pdf" --auto
    `);
    return;
  }
  
  const fileIndex = args.indexOf('--file');
  const schoolIndex = args.indexOf('--school');
  const monthIndex = args.indexOf('--month');
  const yearIndex = args.indexOf('--year');
  const uploadedByIndex = args.indexOf('--uploaded-by');
  const auto = args.includes('--auto');
  
  if (fileIndex === -1 || !args[fileIndex + 1]) {
    console.error('❌ Error: --file is required');
    process.exit(1);
  }
  
  const filePath = args[fileIndex + 1];
  const fileName = path.basename(filePath);
  
  let school, month, year;
  
  if (auto) {
    // Auto-detect from filename
    const parsed = parseFilename(fileName);
    school = fileName.match(/LCA|GWC|CBR|ASA/i)?.[0].toUpperCase() || 'Unknown';
    month = parsed.month || 'Unknown';
    year = parsed.year || new Date().getFullYear();
    
    console.log('\n🔍 Auto-detected from filename:');
    console.log(`   School: ${school}`);
    console.log(`   Month: ${month}`);
    console.log(`   Year: ${year}`);
  } else {
    school = schoolIndex !== -1 ? args[schoolIndex + 1] : 'Unknown';
    month = monthIndex !== -1 ? args[monthIndex + 1] : 'Unknown';
    year = yearIndex !== -1 ? parseInt(args[yearIndex + 1]) : new Date().getFullYear();
  }
  
  const uploadedBy = uploadedByIndex !== -1 ? args[uploadedByIndex + 1] : 'Automated Import';
  
  await uploadPDF(filePath, school, month, year, uploadedBy);
}

if (process.argv[1] && process.argv[1].includes('upload-pdf-to-db.mjs')) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { uploadPDF };
