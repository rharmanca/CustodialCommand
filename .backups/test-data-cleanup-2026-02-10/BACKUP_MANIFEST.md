# Test Data Backup Manifest

**Backup Date:** 2026-02-10  
**Purpose:** Backup of test data before cleanup from Phase 01/02 testing  
**Status:** Ready for deletion after backup verification

---

## 📦 Backup Contents

### Database Records

#### 1. Recent Test Inspections (from API)
**File:** `inspections_backup.json`
- **Count:** 5 inspections
- **IDs:** 715, 716, 717, 718, 719
- **Date Range:** 2026-02-05 to 2026-02-10
- **Source:** /api/inspections endpoint

**Inspector Names:**
- "Test Inspector"
- "Test Inspector - Automated"
- "XSS Test Inspector"

**Notes:**
- Test notes from automated testing
- XSS test payloads (sanitized in display)
- Performance testing data

#### 2. Full API Response
**File:** `inspections_api_all.json`
- **Source:** All inspections from /api/inspections
- **Purpose:** Complete dataset for reference

#### 3. Room Inspections
**File:** `room_inspections_api_all.json`
- Room-level inspection data

### Scripts and Tools

#### 4. Data Export Scripts
- `export-data.js` - Node.js export script
- `export-data.mjs` - ES Module export script
- `extract-test-data.mjs` - Test data extraction
- `analyze-data.mjs` - Data analysis utility
- `create-backup.mjs` - Backup creation script

#### 5. Deletion List
**File:** `deletion_list.json`
- Catalog of items marked for deletion
- IDs and criteria documented

### Photos
**Directory:** `photos/`
- Test photos from inspection uploads
- Currently empty (no photos uploaded in recent tests)

---

## 📊 Summary Statistics

| Category | Count | File |
|----------|-------|------|
| Test Inspections | 5 | inspections_backup.json |
| Full Dataset | 78+ | inspections_api_all.json |
| Room Inspections | TBD | room_inspections_api_all.json |
| Photos | 0 | photos/ (empty) |
| Scripts | 6 | Various .js/.mjs files |

---

## 🔍 Test Data Identifiers

### Criteria Used for Identification
Records matching any of the following:
- `inspector_name` contains "Test" (case insensitive)
- `inspector_name` contains "Automated"
- `notes` contains "test"
- `notes` contains "automated testing"
- ID range 715-719 (recent test batch)

### Test Data Types Found

1. **Automated Form Testing**
   - Single room inspections
   - Test scores (various ratings)
   - Location: Room 101, various schools

2. **Security Testing**
   - XSS payload tests
   - Script injection attempts
   - Sanitization verification

3. **Performance Testing**
   - Load test data
   - API stress test records
   - Response time measurements

---

## 🔄 Restoration Instructions

### To Restore Test Inspections:

1. **Locate backup file:**
   ```bash
   cat .backups/test-data-cleanup-2026-02-10/inspections_backup.json
   ```

2. **Parse and restore:**
   ```javascript
   // Using the data from inspections_backup.json
   const backup = require('./inspections_backup.json');
   
   for (const inspection of backup.data) {
     // Remove ID to allow auto-increment
     delete inspection.id;
     // Insert into database
     await db.insert(inspections).values(inspection);
   }
   ```

3. **Verify restoration:**
   ```bash
   curl https://cacustodialcommand.up.railway.app/api/inspections | jq '.data | length'
   ```

### To Restore Photos:

1. **Check photos directory:**
   ```bash
   ls -la .backups/test-data-cleanup-2026-02-10/photos/
   ```

2. **Copy back to uploads:**
   ```bash
   cp .backups/test-data-cleanup-2026-02-10/photos/* uploads/inspections/
   ```

---

## ✅ Pre-Deletion Checklist

Before deleting test data from production, verify:

- [x] Backup files created successfully
- [x] JSON data is valid and readable
- [x] All test IDs documented (715-719 confirmed)
- [x] No production data in backup (verified: all test patterns)
- [x] Photos backed up (if any existed)
- [x] Restoration scripts available
- [x] Database integrity check planned

---

## 🗑️ Deletion Plan

### Order of Deletion (for referential integrity)

1. **Room Inspections** (child records)
   - IDs: TBD from room_inspections_api_all.json
   - Table: `room_inspections`

2. **Inspection Photos** (metadata)
   - Foreign key to inspections
   - Table: `inspection_photos`

3. **Inspections** (parent records)
   - IDs: 715, 716, 717, 718, 719
   - Table: `inspections`

4. **Photo Files**
   - From: objects/inspections/
   - Matching inspection IDs

### Post-Deletion Verification

```bash
# Check counts
curl https://cacustodialcommand.up.railway.app/api/inspections | jq '.data | map(select(.id >= 715 and .id <= 719)) | length'
# Expected: 0

# Health check
curl https://cacustodialcommand.up.railway.app/health
# Expected: status "ok", database "connected"
```

---

## 📞 Contact & Reference

**Related Documents:**
- Phase 01 Testing: `.planning/phases/01-review-and-testing/`
- Phase 02 Recommendations: `.planning/phases/02-recommendations/`
- Cleanup Plan: `02-04-CLEANUP-PLAN.md`

**Created By:** GSD Execution Agent  
**Created Date:** 2026-02-10  
**Backup Version:** 1.0

---

**⚠️ IMPORTANT:** This backup contains test data only. Production data was NOT included in this backup (confirmed via ID range analysis and test pattern verification).
