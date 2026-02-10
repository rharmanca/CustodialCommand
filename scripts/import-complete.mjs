#!/usr/bin/env node
/**
 * Complete Import - Upload PDF + Create Custodial Notes
 * 
 * This script:
 * 1. Uploads the original PDF to monthly_feedback table
 * 2. Parses the email and creates custodial notes for each location
 * 
 * Usage:
 *   node scripts/import-complete.mjs --file "LCA Dec 2025.pdf"
 *   node scripts/import-complete.mjs *.pdf  (batch mode)
 */

import { uploadPDF } from './upload-pdf-to-db.mjs';
import { processMonthlyFeedback, extractPDFText } from './parse-monthly-feedback.mjs';
import path from 'path';

/**
 * Parse month/year from filename
 */
function parseFilename(filename) {
  const monthMatch = filename.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i);
  const yearMatch = filename.match(/20\d{2}/);
  
  const monthMap = {
    'jan': 'January', 'feb': 'February', 'mar': 'March', 'apr': 'April',
    'may': 'May', 'jun': 'June', 'jul': 'July', 'aug': 'August',
    'sep': 'September', 'oct': 'October', 'nov': 'November', 'dec': 'December'
  };
  
  return {
    school: filename.match(/LCA|GWC|CBR|ASA/i)?.[0].toUpperCase() || 'Unknown',
    month: monthMatch ? monthMap[monthMatch[1].toLowerCase()] : 'Unknown',
    year: yearMatch ? parseInt(yearMatch[0]) : new Date().getFullYear()
  };
}

/**
 * Complete import for a single PDF
 */
async function importPDF(pdfPath) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`📄 Processing: ${path.basename(pdfPath)}`);
  console.log('='.repeat(70));
  
  try {
    // Auto-detect metadata
    const metadata = parseFilename(path.basename(pdfPath));
    console.log(`\n🔍 Detected: ${metadata.school} - ${metadata.month} ${metadata.year}`);
    
    // Step 1: Upload PDF to monthly_feedback
    console.log('\n📤 Step 1: Uploading PDF to database...');
    const monthlyFeedbackId = await uploadPDF(
      pdfPath,
      metadata.school,
      metadata.month,
      metadata.year,
      'Automated Import'
    );
    
    // Step 2: Extract text and create custodial notes
    console.log('\n📝 Step 2: Creating custodial notes...');
    const emailText = extractPDFText(pdfPath);
    const result = await processMonthlyFeedback(emailText);
    
    console.log(`\n✅ Complete! Summary:`);
    console.log(`   📄 Monthly Feedback ID: ${monthlyFeedbackId}`);
    console.log(`   📝 Custodial Notes Created: ${result.count}`);
    console.log(`   🆔 Note IDs: ${result.ids.slice(0, 5).join(', ')}${result.ids.length > 5 ? '...' : ''}`);
    
    return {
      success: true,
      file: path.basename(pdfPath),
      monthlyFeedbackId,
      notesCount: result.count,
      noteIds: result.ids
    };
    
  } catch (error) {
    console.error(`\n❌ Error processing ${path.basename(pdfPath)}:`, error.message);
    return {
      success: false,
      file: path.basename(pdfPath),
      error: error.message
    };
  }
}

/**
 * Batch import multiple PDFs
 */
async function batchImport(files) {
  console.log(`\n📦 BATCH IMPORT - Processing ${files.length} file(s)\n`);
  
  const results = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const result = await importPDF(file);
    results.push(result);
    
    // Delay between files
    if (i < files.length - 1) {
      console.log('\n⏳ Waiting 3 seconds before next file...\n');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 BATCH IMPORT SUMMARY');
  console.log('='.repeat(70));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`\n✅ Successful: ${successful.length}/${results.length}`);
  successful.forEach(r => {
    console.log(`   - ${r.file}:`);
    console.log(`     • Monthly Feedback ID: ${r.monthlyFeedbackId}`);
    console.log(`     • Custodial Notes: ${r.notesCount}`);
  });
  
  if (failed.length > 0) {
    console.log(`\n❌ Failed: ${failed.length}/${results.length}`);
    failed.forEach(r => {
      console.log(`   - ${r.file}: ${r.error}`);
    });
  }
  
  const totalNotes = successful.reduce((sum, r) => sum + r.notesCount, 0);
  const totalPDFs = successful.length;
  
  console.log(`\n📊 Totals:`);
  console.log(`   📄 PDFs uploaded: ${totalPDFs}`);
  console.log(`   📝 Custodial notes created: ${totalNotes}`);
  console.log('\n✅ Batch import complete!\n');
}

/**
 * CLI
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
Complete Import - Upload PDF + Create Custodial Notes

This script performs a complete import:
  1. Uploads original PDF to monthly_feedback table
  2. Extracts text and creates custodial notes for each location

Usage:
  node scripts/import-complete.mjs <file1.pdf> [file2.pdf] [...]
  node scripts/import-complete.mjs *.pdf

Examples:
  # Single file
  node scripts/import-complete.mjs "LCA Dec 2025.pdf"
  
  # Multiple files
  node scripts/import-complete.mjs "lca oct 2025.pdf" "lca nov 2025.pdf" "LCA Dec 2025.pdf"
  
  # All PDFs in directory
  node scripts/import-complete.mjs *.pdf

Features:
  ✓ Auto-detects school, month, year from filename
  ✓ Uploads original PDF to database
  ✓ Extracts text from PDF
  ✓ Creates custodial notes for each location
  ✓ Includes scores, glows, and grows in notes
  ✓ Batch processing support
    `);
    process.exit(args.length === 0 ? 1 : 0);
  }
  
  const files = args.filter(arg => !arg.startsWith('--'));
  
  if (files.length === 0) {
    console.error('❌ Error: No PDF files specified');
    process.exit(1);
  }
  
  if (files.length === 1) {
    await importPDF(files[0]);
  } else {
    await batchImport(files);
  }
}

if (process.argv[1] && process.argv[1].includes('import-complete.mjs')) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { importPDF, batchImport };
