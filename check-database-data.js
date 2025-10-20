#!/usr/bin/env node

// Database Data Checker Script
// This script connects to the database and checks for any test data

import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { eq, desc, count } from 'drizzle-orm';

// Load environment variables
config();

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set. Please check your .env file.');
  process.exit(1);
}

// Initialize database connection
const sql = neon(process.env.DATABASE_URL);

// Define schema tables (simplified for this check)
const users = {
  tableName: 'users',
  columns: ['id', 'username', 'password', 'created_at']
};

const inspections = {
  tableName: 'inspections', 
  columns: ['id', 'inspector_name', 'school', 'date', 'inspection_type', 'location_description', 'room_number', 'building_name', 'is_completed', 'created_at']
};

const roomInspections = {
  tableName: 'room_inspections',
  columns: ['id', 'building_inspection_id', 'room_type', 'room_identifier', 'created_at']
};

const custodialNotes = {
  tableName: 'custodial_notes',
  columns: ['id', 'school', 'date', 'location', 'location_description', 'notes', 'created_at']
};

async function checkDatabaseData() {
  console.log('🔍 Checking database for test data...\n');
  
  try {
    // Check users table
    console.log('📊 USERS TABLE:');
    const userCount = await sql`SELECT COUNT(*) as count FROM users`;
    console.log(`   Total users: ${userCount[0].count}`);
    
    if (userCount[0].count > 0) {
      const users = await sql`SELECT id, username, created_at FROM users ORDER BY created_at DESC LIMIT 5`;
      console.log('   Recent users:');
      users.forEach(user => {
        console.log(`   - ID: ${user.id}, Username: ${user.username}, Created: ${user.created_at}`);
      });
    }
    
    // Check inspections table
    console.log('\n📊 INSPECTIONS TABLE:');
    const inspectionCount = await sql`SELECT COUNT(*) as count FROM inspections`;
    console.log(`   Total inspections: ${inspectionCount[0].count}`);
    
    if (inspectionCount[0].count > 0) {
      const inspections = await sql`SELECT id, inspector_name, school, date, inspection_type, location_description, created_at FROM inspections ORDER BY created_at DESC LIMIT 5`;
      console.log('   Recent inspections:');
      inspections.forEach(inspection => {
        console.log(`   - ID: ${inspection.id}, Inspector: ${inspection.inspector_name}, School: ${inspection.school}, Date: ${inspection.date}, Type: ${inspection.inspection_type}`);
        console.log(`     Location: ${inspection.location_description}, Created: ${inspection.created_at}`);
      });
    }
    
    // Check room inspections table
    console.log('\n📊 ROOM INSPECTIONS TABLE:');
    const roomInspectionCount = await sql`SELECT COUNT(*) as count FROM room_inspections`;
    console.log(`   Total room inspections: ${roomInspectionCount[0].count}`);
    
    if (roomInspectionCount[0].count > 0) {
      const roomInspections = await sql`SELECT id, building_inspection_id, room_type, room_identifier, created_at FROM room_inspections ORDER BY created_at DESC LIMIT 5`;
      console.log('   Recent room inspections:');
      roomInspections.forEach(room => {
        console.log(`   - ID: ${room.id}, Building ID: ${room.building_inspection_id}, Room Type: ${room.room_type}, Identifier: ${room.room_identifier}, Created: ${room.created_at}`);
      });
    }
    
    // Check custodial notes table
    console.log('\n📊 CUSTODIAL NOTES TABLE:');
    const notesCount = await sql`SELECT COUNT(*) as count FROM custodial_notes`;
    console.log(`   Total custodial notes: ${notesCount[0].count}`);
    
    if (notesCount[0].count > 0) {
      const notes = await sql`SELECT id, school, date, location, location_description, notes, created_at FROM custodial_notes ORDER BY created_at DESC LIMIT 5`;
      console.log('   Recent custodial notes:');
      notes.forEach(note => {
        console.log(`   - ID: ${note.id}, School: ${note.school}, Date: ${note.date}, Location: ${note.location}`);
        console.log(`     Description: ${note.location_description}, Created: ${note.created_at}`);
        console.log(`     Notes: ${note.notes.substring(0, 100)}${note.notes.length > 100 ? '...' : ''}`);
      });
    }
    
    // Check for test data patterns
    console.log('\n🔍 CHECKING FOR TEST DATA PATTERNS:');
    
    // Look for common test patterns
    const testPatterns = [
      { table: 'users', pattern: 'test', column: 'username' },
      { table: 'inspections', pattern: 'test', column: 'inspector_name' },
      { table: 'inspections', pattern: 'demo', column: 'school' },
      { table: 'inspections', pattern: 'sample', column: 'school' },
      { table: 'custodial_notes', pattern: 'test', column: 'notes' },
      { table: 'custodial_notes', pattern: 'demo', column: 'notes' },
      { table: 'custodial_notes', pattern: 'sample', column: 'notes' }
    ];
    
    for (const pattern of testPatterns) {
      try {
        const result = await sql`SELECT COUNT(*) as count FROM ${sql(pattern.table)} WHERE LOWER(${sql(pattern.column)}) LIKE ${'%' + pattern.pattern + '%'}`;
        if (result[0].count > 0) {
          console.log(`   ⚠️  Found ${result[0].count} records with "${pattern.pattern}" in ${pattern.table}.${pattern.column}`);
        }
      } catch (error) {
        // Table might not exist or column might not exist, skip
      }
    }
    
    // Check for very recent data (last 24 hours) that might be test data
    console.log('\n🕐 CHECKING FOR RECENT DATA (last 24 hours):');
    const recentData = await sql`
      SELECT 
        'users' as table_name, 
        COUNT(*) as count 
      FROM users 
      WHERE created_at > NOW() - INTERVAL '24 hours'
      UNION ALL
      SELECT 
        'inspections' as table_name, 
        COUNT(*) as count 
      FROM inspections 
      WHERE created_at > NOW() - INTERVAL '24 hours'
      UNION ALL
      SELECT 
        'room_inspections' as table_name, 
        COUNT(*) as count 
      FROM room_inspections 
      WHERE created_at > NOW() - INTERVAL '24 hours'
      UNION ALL
      SELECT 
        'custodial_notes' as table_name, 
        COUNT(*) as count 
      FROM custodial_notes 
      WHERE created_at > NOW() - INTERVAL '24 hours'
    `;
    
    recentData.forEach(row => {
      if (row.count > 0) {
        console.log(`   📅 ${row.table_name}: ${row.count} records created in last 24 hours`);
      }
    });
    
    console.log('\n✅ Database check completed!');
    
  } catch (error) {
    console.error('❌ Error checking database:', error.message);
    process.exit(1);
  }
}

// Run the check
checkDatabaseData().catch(console.error);
