const fs = require('fs');
const { PDFParse } = require('pdf-parse');

const dataBuffer = fs.readFileSync('LCA Dec 2025.pdf');

PDFParse(dataBuffer).then(data => {
  console.log(data.text);
}).catch(err => {
  console.error('Error:', err);
});
