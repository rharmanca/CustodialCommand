// This script will show you what to change in your validation
console.log(`
In server/routes.ts, find the inspectionSchema and make these fields optional:

const inspectionSchema = z.object({
  date: z.string(),
  time: z.string(),
  location: z.string(),
  inspector: z.string(),
  area: z.string(),
  score: z.number(),
  notes: z.string().optional(),
  categories: z.array(z.any()).optional(),
  school: z.string().optional().default(''),
  inspectionType: z.string().optional().default('routine'),
  locationDescription: z.string().optional().default('')
});

Change the three fields to optional with defaults:
- school: z.string().optional().default('')
- inspectionType: z.string().optional().default('routine')  
- locationDescription: z.string().optional().default('')
`);
