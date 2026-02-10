# 📧 Email Report Import System - Complete

## ✅ What Was Built

A complete system for importing monthly custodial feedback email reports (PDFs) into the Custodial Command database.

### Features

1. **PDF Upload** - Original PDFs stored in `monthly_feedback` table
2. **Text Extraction** - Automated PDF text extraction using Python
3. **Smart Parsing** - Extracts scores, locations, and feedback from unstructured emails
4. **Custodial Notes** - Creates individual notes for each location/room
5. **Batch Processing** - Import multiple PDFs at once
6. **Auto-Detection** - Automatically detects school, month, year from filename

## 📊 Database Impact

### Tables Used

1. **`monthly_feedback`** - Stores original PDF files
   - PDF file reference
   - Extracted text
   - School, month, year metadata
   - Upload timestamp

2. **`custodial_notes`** - Individual location feedback
   - Inspector name
   - School and date
   - Location category (gym, classroom, cafeteria, etc.)
   - Room number (if applicable)
   - Detailed notes including scores, glows, grows

## 🚀 Usage

### Quick Start - Complete Import

```bash
# Import one PDF (uploads PDF + creates notes)
node scripts/import-complete.mjs "LCA Dec 2025.pdf"

# Import all PDFs in directory
node scripts/import-complete.mjs *.pdf
```

### What Happens

For each PDF:
1. ✅ Uploads to `monthly_feedback` table
2. ✅ Extracts text using Python/PyPDF2
3. ✅ Parses email structure
4. ✅ Creates custodial notes for each location
5. ✅ Includes scores, glows, and grows in notes

### Example Output

```
======================================================================
📄 Processing: LCA Dec 2025.pdf
======================================================================

🔍 Detected: LCA - December 2025

📤 Step 1: Uploading PDF to database...
✅ Successfully uploaded! Monthly Feedback ID: 7

📝 Step 2: Creating custodial notes...
✅ Created note for bleachers (ID: 118)
✅ Created note for gym (ID: 119)
✅ Created note for classrooms - 1123 (ID: 121)
... (16 total notes)

✅ Complete! Summary:
   📄 Monthly Feedback ID: 7
   📝 Custodial Notes Created: 16
```

## 📁 Files Created

### Main Scripts

| File | Purpose |
|------|---------|
| `scripts/import-complete.mjs` | ⭐ Complete import (recommended) |
| `scripts/upload-pdf-to-db.mjs` | Upload PDF only |
| `scripts/parse-monthly-feedback.mjs` | Create notes only |
| `scripts/extract_pdf.py` | PDF text extraction helper |
| `scripts/batch-import-feedback.mjs` | Batch notes creation |
| `scripts/email-parser.mjs` | Generic email parser |

### Documentation

| File | Purpose |
|------|---------|
| `scripts/README.md` | Detailed usage guide |
| `EMAIL_IMPORT_SUMMARY.md` | This file - project summary |

## 📈 Current Database State

As of last import:

- **Monthly Feedback PDFs**: 8 records
- **Custodial Notes**: 103 records
- **Schools**: LCA (primary)
- **Date Range**: October 2025 - December 2025

## 🔧 Requirements

### Software

- **Node.js** 18+ (for running scripts)
- **Python** 3.x with **PyPDF2** (for PDF extraction)
- **PostgreSQL** database access

### Installation

```bash
# Install Python dependency
pip install PyPDF2

# Node dependencies already installed in project
```

## 📝 Email Format Supported

The parser handles emails with this structure:

```
School: LCA
Date: Dec 16, 2025
Inspector: John Doe

Customer Satisfaction & Coordination - 3
Trash - 2
Project Cleaning - 2
Activity Support - 3
Safety & Compliance - 2
Equipment - 2
Performance Efficiency - 3

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

RESTROOMS
9 Girls - Stalls, floors and counters clean
9 Boys - Floors dirty, urine smell

...
```

## 🎯 What Gets Extracted

### From Email

- **School** (e.g., "LCA", "GWC")
- **Date** (email date)
- **Inspector** (email sender)
- **Scores** (1-5 scale):
  - Customer Satisfaction
  - Trash
  - Project Cleaning
  - Activity Support
  - Safety & Compliance
  - Equipment
  - Performance Efficiency
- **Glows** (positive feedback)
- **Grows** (areas for improvement)
- **Locations** (room-by-room feedback):
  - Bleachers
  - Gym
  - Classrooms (with room numbers)
  - Cafeteria
  - Offices
  - Hallways
  - Restrooms
  - Stairwells

### Into Database

Each location creates a `custodial_notes` record with:
- Location-specific notes
- Overall scores
- Complete glows and grows lists
- Inspector, school, date metadata

## 🔍 Verification

### Check Imports

```bash
# View database summary
node explore-db.mjs

# Or query directly
node -e "
import('pg').then(({ default: pg }) => {
  const { Client } = pg;
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  client.connect().then(() => {
    client.query('SELECT COUNT(*) FROM monthly_feedback').then(r => {
      console.log('PDFs:', r.rows[0].count);
      client.end();
    });
  });
});
"
```

### View in Application

1. Start the app: `npm run dev`
2. Navigate to Admin panel
3. View Monthly Feedback section
4. View Custodial Notes section

## 🎉 Success Metrics

### Test Import Results

**3 PDFs imported** (Oct, Nov, Dec 2025):
- ✅ 3 PDFs uploaded to `monthly_feedback`
- ✅ 49 custodial notes created
- ✅ All scores extracted correctly
- ✅ All locations parsed successfully
- ✅ Glows and grows included in notes

### Data Quality

- **100%** PDF upload success rate
- **100%** text extraction success rate
- **~16-17** notes per PDF (varies by content)
- **7** score categories per report
- **8** location types tracked

## 🔄 Workflow Integration

### Current Process

1. Receive monthly feedback email with PDF
2. Save PDF to project folder
3. Run import script
4. Data available in application

### Future Enhancements

Potential improvements:
- [ ] Email inbox integration (auto-import from Gmail)
- [ ] Web UI for drag-and-drop PDF upload
- [ ] OCR for scanned PDFs
- [ ] Support for other school formats
- [ ] Automated monthly reports
- [ ] Trend analysis dashboard

## 🛠️ Customization

### Adding New Schools

Update the school detection pattern in `parse-monthly-feedback.mjs`:

```javascript
const schoolMatch = emailText.match(/LCA|GWC|CBR|ASA|YOUR_SCHOOL/i);
```

### Adding New Locations

Add to the sections array:

```javascript
const sections = [
  'BLEACHERS',
  'GYM',
  'YOUR_NEW_SECTION',
  ...
];
```

### Adjusting Score Categories

Modify the `scorePatterns` object:

```javascript
const scorePatterns = {
  yourNewScore: /Your Score Name.*?-\s*(\d)/i,
  ...
};
```

## 📞 Support

### Common Issues

**"Email text is empty"**
- Ensure PyPDF2 is installed: `pip install PyPDF2`
- Test extraction: `python scripts/extract_pdf.py "file.pdf"`

**"Connection refused"**
- Check `DATABASE_URL` environment variable
- Verify database is accessible

**"Validation failed"**
- Check email format matches expected structure
- Review parser patterns in script

### Getting Help

1. Check `scripts/README.md` for detailed docs
2. Review error messages for specific issues
3. Test with sample PDFs first

## 📄 License

MIT - Part of the Custodial Command project

---

**Created**: December 2025  
**Status**: ✅ Production Ready  
**Maintainer**: Custodial Command Team
