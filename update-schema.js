const fs = require('fs');
const routesPath = 'server/routes.ts';
const content = fs.readFileSync(routesPath, 'utf8');

// Find the schema definition
const schemaRegex = /const inspectionSchema = z\.object\(\{[\s\S]*?\}\);/;
const schemaMatch = content.match(schemaRegex);

if (schemaMatch) {
  const schema = schemaMatch[0];
  
  // Update the fields to be optional
  const updatedSchema = schema
    .replace(/school: z\.string\(\)/g, 'school: z.string().optional().default("")')
    .replace(/inspectionType: z\.string\(\)/g, 'inspectionType: z.string().optional().default("routine")')
    .replace(/locationDescription: z\.string\(\)/g, 'locationDescription: z.string().optional().default("")');
  
  // Replace the schema in the file
  const updatedContent = content.replace(schemaRegex, updatedSchema);
  fs.writeFileSync(routesPath, updatedContent);
  console.log('Schema updated successfully');
} else {
  console.error('Could not find schema definition');
}
