// Find the inspectionSchema in routes.ts and update it
const fs = require('fs');
const path = require('path');

const routesPath = path.join(process.cwd(), 'server/routes.ts');
let content = fs.readFileSync(routesPath, 'utf8');

// Replace the schema definition to make fields optional
content = content.replace(
  /const inspectionSchema = z\.object\(\{([^}]+)\}\);/s,
  (match, inner) => {
    const updated = inner
      .replace(/school: z\.string\(\),/, 'school: z.string().optional().default(""),')
      .replace(/inspectionType: z\.string\(\),/, 'inspectionType: z.string().optional().default("routine"),')
      .replace(/locationDescription: z\.string\(\),/, 'locationDescription: z.string().optional().default(""),');
    
    return `const inspectionSchema = z.object({${updated}});`;
  }
);

fs.writeFileSync(routesPath, content);
console.log('Updated inspectionSchema in routes.ts');
