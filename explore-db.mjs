import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://neondb_owner:npg_WwJEd5ILV7lq@ep-aged-wind-ad9g7vhf-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function exploreDatabase() {
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // List all tables
    console.log('📋 Tables in database:');
    console.log('='.repeat(50));
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    for (const row of tablesResult.rows) {
      console.log(`  - ${row.table_name}`);
    }
    console.log('');

    // For each table, show structure and sample data
    for (const table of tablesResult.rows) {
      const tableName = table.table_name;
      console.log(`\n📊 Table: ${tableName}`);
      console.log('='.repeat(50));
      
      // Get column information
      const columnsResult = await client.query(`
        SELECT 
          column_name, 
          data_type, 
          is_nullable,
          column_default
        FROM information_schema.columns 
        WHERE table_name = $1 
        ORDER BY ordinal_position;
      `, [tableName]);
      
      console.log('\nColumns:');
      for (const col of columnsResult.rows) {
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
        console.log(`  ${col.column_name}: ${col.data_type} ${nullable}${defaultVal}`);
      }
      
      // Get row count
      const countResult = await client.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
      console.log(`\nRow count: ${countResult.rows[0].count}`);
      
      // Show sample data (first 3 rows)
      if (parseInt(countResult.rows[0].count) > 0) {
        const sampleResult = await client.query(`SELECT * FROM "${tableName}" LIMIT 3`);
        console.log('\nSample data (first 3 rows):');
        console.log(JSON.stringify(sampleResult.rows, null, 2));
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await client.end();
    console.log('\n✅ Connection closed');
  }
}

exploreDatabase();
