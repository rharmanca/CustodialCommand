# 🚀 Quick Start - Email Import

## One Command to Rule Them All

```bash
node scripts/import-complete.mjs *.pdf
```

That's it! This will:
- ✅ Upload all PDFs to database
- ✅ Extract text from each PDF
- ✅ Create custodial notes for each location
- ✅ Auto-detect school, month, year from filenames

## Examples

### Import One PDF
```bash
node scripts/import-complete.mjs "LCA Dec 2025.pdf"
```

### Import Multiple PDFs
```bash
node scripts/import-complete.mjs "lca oct 2025.pdf" "lca nov 2025.pdf" "LCA Dec 2025.pdf"
```

### Import All PDFs in Folder
```bash
node scripts/import-complete.mjs *.pdf
```

## What You Get

For each PDF imported:

**In `monthly_feedback` table:**
- Original PDF stored
- Extracted text
- School, month, year metadata

**In `custodial_notes` table:**
- Individual notes for each location (gym, classrooms, cafeteria, etc.)
- Room-specific feedback
- Overall scores (1-5 scale)
- Glows (positives) and Grows (improvements)

## Requirements

- Node.js 18+
- Python 3.x with PyPDF2: `pip install PyPDF2`
- Database connection (already configured)

## Filename Format

For auto-detection to work, name your PDFs like:
- `LCA Dec 2025.pdf`
- `lca nov 2025.pdf`
- `GWC October 2025.pdf`

Pattern: `[SCHOOL] [MONTH] [YEAR].pdf`

## Troubleshooting

**"PyPDF2 not found"**
```bash
pip install PyPDF2
```

**"Connection refused"**
- Check DATABASE_URL environment variable
- Ensure database is running

**Need help?**
- See `scripts/README.md` for detailed docs
- See `EMAIL_IMPORT_SUMMARY.md` for full overview

## Advanced Usage

### Upload PDF Only (No Notes)
```bash
node scripts/upload-pdf-to-db.mjs --file "LCA Dec 2025.pdf" --auto
```

### Create Notes Only (No PDF Upload)
```bash
node scripts/parse-monthly-feedback.mjs --file "LCA Dec 2025.pdf"
```

### Manual Metadata
```bash
node scripts/upload-pdf-to-db.mjs --file "report.pdf" --school "LCA" --month "December" --year 2025
```

---

**That's all you need to know!** 🎉

For more details, see:
- `scripts/README.md` - Full documentation
- `EMAIL_IMPORT_SUMMARY.md` - Project overview
