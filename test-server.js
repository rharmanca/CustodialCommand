const express = require('express');
const { createServer } = require('http');

const app = express();

app.get('/', (req, res) => {
  res.send(`
    <html>
      <body>
        <h1>Test Server Working!</h1>
        <p>Node.js server is running correctly on port 5000</p>
        <p>This confirms the middleware mode setup would work.</p>
      </body>
    </html>
  `);
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', port: 5000, middleware_ready: true });
});

const server = createServer(app);
const PORT = 5000;
const HOST = '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log(`Test server running on ${HOST}:${PORT}`);
});