import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

const dataBuffer = fs.readFileSync('LCA Dec 2025.pdf');

pdf(dataBuffer).then(data => {
  console.log(data.text);
}).catch(err => {
  console.error('Error:', err);
});
