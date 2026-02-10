# Email Report Import Scripts

Tools for importing unstructured email reports into the Custodial Command database.

## 📋 Overview

These scripts parse monthly custodial feedback emails (PDF or text format) and:
1. **Upload the original PDF** to the `monthly_feedback` table
2. **Create custodial notes** for each location/room mentioned in the feedback

## 🚀 Quick Start

### ⭐ Complete Import (Recommended)

**Uploads PDF + Creates Notes in one command:**

```bash
# Single PDF
node scripts/import-complete.mjs "LCA Dec 2025.pdf"

# Multiple PDFs
node scripts/import-complete.mjs "lca oct 2025.pdf" "lca nov 2025.pdf" "LCA Dec 2025.pdf"

# All PDFs in directory
node scripts/import-complete.mjs *.pdf
```

### Alternative: Step-by-Step

**1. Upload PDF only:**
```bash
node scripts/upload-pdf-to-db.mjs --file "LCA Dec 2025.pdf" --auto
```

**2. Create notes only:**
```bash
node scripts/parse-monthly-feedback.mjs --file "LCA Dec 2025.pdf"
```

## 📁 Files

- **`import-complete.mjs`** - ⭐ Complete import (PDF upload + notes creation)
- **`upload-pdf-to-db.mjs`** - Upload PDF to monthly_feedback table
- **`parse-monthly-feedback.mjs`** - Parse email and create custodial notes
- **`batch-import-feedback.mjs`** - Batch processor (notes only)
- **`extract_pdf.py`** - Python helper for PDF text extraction
- **`email-parser.mjs`** - Generic email parser (for other formats)

## 🔧 Requirements

- **Node.js** 18+ (for running the scripts)
- **Python** 3.x with **PyPDF2** (for PDF extraction)
- **PostgreSQL** database connection (set via `DATABASE_URL` env var)

### Install Python Dependencies

```bash
pip install PyPDF2
```

## 📖 Usage

### Single File Import

```bash
# From PDF
node scripts/parse-monthly-feedback.mjs --file "path/to/report.pdf"

# From text file
node scripts/parse-monthly-feedback.mjs --file "path/to/email.txt"

# Help
node scripts/parse-monthly-feedback.mjs --help
```

### Batch Import

```bash
# Import all PDFs in current directory
node scripts/batch-import-feedback.mjs *.pdf

# Import specific files
node scripts/batch-import-feedback.mjs "oct 2025.pdf" "nov 2025.pdf" "dec 2025.pdf"

# Help
node scripts/batch-import-feedback.mjs --help
```

## 📊 What Gets Imported

The parser extracts and creates custodial notes for:

- **Scores** (1-5 scale):
  - Customer Satisfaction & Coordination
  - Trash
  - Project Cleaning
  - Activity Support
  - Safety & Compliance
  - Equipment
  - Performance Efficiency

- **Locations**:
  - Bleachers
  - Gym
  - Classrooms (with room numbers)
  - Cafeteria
  - Offices
  - Hallways
  - Restrooms
  - Stairwells

- **Feedback**:
  - Glows (positive feedback)
  - Grows (areas for improvement)
  - Room-specific notes

## 📝 Email Format

The parser expects emails in this format:

```
School: LCA
Date: Dec 16, 2025
Inspector: John Doe

Customer Satisfaction & Coordination - 3
Trash - 2
Project Cleaning - 2
...

Glows
- Cafe floors and trash are always clean
- Restrooms clean

Grows
- Hallway floors and walls
- Window sills

CLASSROOMS
1123 - Desks need to be wiped down, trash full
1159 - Floors dirty, window sills dirty

CAFETERIA
- Clean and free of clutter
- Paper towel dispensers need to be checked

...
```

## 🗄️ Database Schema

Each location creates a `custodial_notes` entry with:

- `inspector_name` - From email sender
- `school` - Extracted from email (e.g., "LCA")
- `date` - Email date (YYYY-MM-DD format)
- `location` - Category (e.g., "classrooms", "gym")
- `location_description` - Room number/identifier (if applicable)
- `notes` - Combined feedback including:
  - Location-specific notes
  - Overall scores
  - Glows and Grows

## ⚙️ Configuration

### Database Connection

Set the `DATABASE_URL` environment variable:

```bash
export DATABASE_URL="postgresql://user:pass@host:port/database"
```

Or the script will use the default connection string.

### Customizing the Parser

To adapt the parser for different email formats, edit `parse-monthly-feedback.mjs`:

1. **Update school detection** (line ~45):
   ```javascript
   const schoolMatch = emailText.match(/Your School Name|SCHOOL_CODE/i);
   ```

2. **Add/modify location sections** (line ~100):
   ```javascript
   const sections = [
     'BLEACHERS',
     'GYM',
     'YOUR_NEW_SECTION',
     ...
   ];
   ```

3. **Adjust score patterns** (line ~60):
   ```javascript
   const scorePatterns = {
     yourNewScore: /Your Score Name.*?-\s*(\d)/i,
     ...
   };
   ```

## 🧪 Testing

Test with a single file first to verify parsing:

```bash
node scripts/parse-monthly-feedback.mjs --file "test.pdf"
```

The script will:
1. Show parsed data summary
2. Preview first 5 locations
3. Wait 5 seconds before inserting (Ctrl+C to cancel)
4. Insert all entries
5. Show created IDs

## 📈 Example Output

```
📄 Reading from: LCA Dec 2025.pdf

✅ Connected to database

📧 Parsing monthly feedback email...

📊 Parsed Data Summary:
   School: LCA
   Date: 2025-12-16
   Inspector: Robert Harman
   Scores: 7 categories
   Glows: 2 items
   Grows: 3 items
   Locations: 16 entries

📋 Preview of locations to be inserted:
   - bleachers: Bleachers need to be swept regularly...
   - gym: Stage need to be swept regularly...
   - classrooms (1123): Desks need to be wiped down, trash full...
   ... and 13 more

⏳ Waiting 5 seconds before inserting... (Ctrl+C to cancel)

📝 Creating database entries...

✅ Created note for bleachers (ID: 118)
✅ Created note for gym (ID: 119)
...

✅ Successfully created 16 custodial notes!
   IDs: 118, 119, 120, ...

✅ Connection closed
```

## 🔍 Verifying Imports

Check the database:

```bash
node explore-db.mjs
```

Or query directly:

```sql
SELECT COUNT(*) FROM custodial_notes WHERE school = 'LCA';
SELECT * FROM custodial_notes WHERE date >= '2025-10-01' ORDER BY created_at DESC;
```

## 🐛 Troubleshooting

### "Email text is empty"
- Ensure PyPDF2 is installed: `pip install PyPDF2`
- Check PDF is not corrupted
- Try extracting manually: `python scripts/extract_pdf.py "file.pdf"`

### "Connection refused"
- Verify `DATABASE_URL` is set correctly
- Check database is running and accessible

### "Validation failed"
- Check email format matches expected structure
- Review parser patterns in `parse-monthly-feedback.mjs`
- Add debug logging to see extracted data

## 📚 Related Files

- `server/routes.ts` - API endpoints for custodial notes
- `shared/schema.ts` - Database schema and validation
- `server/storage.ts` - Database operations

## 🤝 Contributing

To add support for new email formats:

1. Create a new parser function in `parse-monthly-feedback.mjs`
2. Add format detection logic
3. Map extracted data to database schema
4. Test with sample emails
5. Update this README

## 📄 License

MIT - Part of the Custodial Command project
