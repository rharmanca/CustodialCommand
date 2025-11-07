require('dotenv').config();
const express = require('express');
const { neon } = require('@neondatabase/serverless');

const app = express();
const sql = neon(process.env.DATABASE_URL);

app.get('/api/health', async (req, res) => {
  try {
    await sql`SELECT 1`;
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    console.error('HEALTH ERROR:', error);
    res.status(503).json({ status: 'error', database: 'error', error: error.message });
  }
});

app.listen(3003, () => {
  console.log('Test server running on 3003');
  
  setTimeout(() => {
    require('http').get('http://localhost:3003/api/health', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('Health response:', data);
        process.exit(0);
      });
    });
  }, 1000);
});