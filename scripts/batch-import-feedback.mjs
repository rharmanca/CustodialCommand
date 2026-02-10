#!/usr/bin/env node
/**
 * Batch Import Monthly Feedback PDFs
 * 
 * Processes multiple PDF files and imports them into the database
 * 
 * Usage:
 *   node scripts/batch-import-feedback.mjs *.pdf
 *   node scripts/batch-import-feedback.mjs "lca nov 2025.pdf" "lca dec 2025.pdf"
 */

import { processMonthlyFeedback, extractPDFText } from './parse-monthly-feedback.mjs';
import { readFileSync } from 'fs';

async function batchImport(files) {
  console.log(`\n📦 Batch Import - Processing ${files.length} files\n`);
  
  const results = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📄 File ${i + 1}/${files.length}: ${file}`);
    console.log('='.repeat(60));
    
    try {
      let emailText;
      
      if (file.toLowerCase().endsWith('.pdf')) {
        emailText = extractPDFText(file);
      } else {
        emailText = readFileSync(file, 'utf-8');
      }
      
      const result = await processMonthlyFeedback(emailText);
      results.push({ file, success: true, ...result });
      
    } catch (error) {
      console.error(`\n❌ Failed to process ${file}:`, error.message);
      results.push({ file, success: false, error: error.message });
    }
    
    // Small delay between files
    if (i < files.length - 1) {
      console.log('\n⏳ Waiting 2 seconds before next file...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 BATCH IMPORT SUMMARY');
  console.log('='.repeat(60));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`\n✅ Successful: ${successful.length}/${results.length}`);
  successful.forEach(r => {
    console.log(`   - ${r.file}: ${r.count} notes created`);
  });
  
  if (failed.length > 0) {
    console.log(`\n❌ Failed: ${failed.length}/${results.length}`);
    failed.forEach(r => {
      console.log(`   - ${r.file}: ${r.error}`);
    });
  }
  
  const totalNotes = successful.reduce((sum, r) => sum + r.count, 0);
  console.log(`\n📝 Total custodial notes created: ${totalNotes}`);
  console.log('\n✅ Batch import complete!\n');
}

// CLI
const files = process.argv.slice(2);

if (files.length === 0 || files.includes('--help') || files.includes('-h')) {
  console.log(`
Batch Import Monthly Feedback PDFs

Usage:
  node scripts/batch-import-feedback.mjs <file1> <file2> ...
  node scripts/batch-import-feedback.mjs *.pdf

Examples:
  node scripts/batch-import-feedback.mjs "lca nov 2025.pdf" "lca dec 2025.pdf"
  node scripts/batch-import-feedback.mjs *.pdf
  `);
  process.exit(files.length === 0 ? 1 : 0);
}

batchImport(files).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
