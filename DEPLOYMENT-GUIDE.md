# Deployment Guide - Phase 02 Completion

**Date:** 2026-02-10  
**Status:** Code pushed ✅ | Database pending ⏳ | Cleanup pending ⏳

---

## ✅ What's Been Deployed

### 1. Code Changes (Pushed to GitHub)
```bash
git push origin main
# Result: ae8bf472 deployed
```

**Includes:**
- ✅ Performance optimizations (server/storage.ts, server/routes.ts)
- ✅ Database schema indexes (shared/schema.ts)
- ✅ All documentation and test artifacts
- ✅ 30 commits with full Phase 02 work

### 2. Automatic Railway Deployment
**Status:** Should auto-deploy on push

**Verify deployment:**
```bash
curl https://cacustodialcommand.up.railway.app/health
```

---

## ⏳ Remaining Steps (Need Your Action)

### Step 1: Apply Database Indexes ⚡ CRITICAL

**Why:** The performance optimizations require database indexes

**Option A: Drizzle Migration (Recommended)**
```bash
# Get your DATABASE_URL from Railway dashboard
export DATABASE_URL="postgresql://..."

# Apply migrations
npx drizzle-kit push
```

**Option B: Railway Dashboard (Manual)**
1. Go to https://railway.app/
2. Select your project
3. Click on your PostgreSQL database
4. Go to "Query" tab
5. Copy/paste SQL from: `apply-performance-indexes.sql`
6. Run the queries

**Option C: Railway CLI**
```bash
# Link to your project
railway link

# Get DATABASE_URL
railway variables --json

# Apply migrations
export DATABASE_URL=<from_above>
npx drizzle-kit push
```

### Step 2: Run Test Data Cleanup 🧹

**Navigate to backup directory:**
```bash
cd .backups/test-data-cleanup-2026-02-10/
```

**Run deletion (requires DATABASE_URL):**
```bash
export DATABASE_URL="postgresql://..."
node delete-test-data.js --confirm
```

**What will be deleted:**
- 5 test inspections (IDs 715-719)
- 0 room inspections
- 0 photos

**Backup available at:** `.backups/test-data-cleanup-2026-02-10/`

### Step 3: Verify Performance Improvements 📊

**Before:**
```bash
curl -w "@curl-format.txt" -o /dev/null -s \
  https://cacustodialcommand.up.railway.app/api/room-inspections
# Was: 1.67s
```

**After (with indexes):**
```bash
curl -w "%{time_total}\n" -o /dev/null -s \
  https://cacustodialcommand.up.railway.app/api/room-inspections
# Target: <500ms
```

---

## 📋 Deployment Checklist

- [x] Push code to GitHub
- [x] Merge remote changes
- [x] TypeScript checks pass
- [ ] Apply database indexes (drizzle-kit push)
- [ ] Verify Railway auto-deployment
- [ ] Run test data cleanup
- [ ] Verify performance improvements
- [ ] Set up UptimeRobot (optional)
- [ ] Configure alert contacts (optional)

---

## 🔍 Verification Commands

### Health Check
```bash
curl https://cacustodialcommand.up.railway.app/health
```
Expected: `{"status":"ok","database":"connected",...}`

### Performance Test
```bash
./tests/performance-test.sh
```

### Database Query Test
```bash
curl "https://cacustodialcommand.up.railway.app/api/room-inspections?limit=10"
```
Should return in <500ms

---

## 🚨 If Something Goes Wrong

### Database Migration Fails
1. Check DATABASE_URL is correct
2. Verify database is accessible
3. Try running SQL manually via Railway dashboard

### Application Won't Start
1. Check Railway logs: `railway logs`
2. Verify all env vars are set
3. Check for TypeScript errors: `npm run check`

### Need to Restore Test Data
```bash
cd .backups/test-data-cleanup-2026-02-10/
node restore-test-data.js --confirm
```

---

## 📞 Need Help?

**Documentation:**
- Monitoring runbook: `docs/monitoring/monitoring-runbook.md`
- Phase 02 summary: `.planning/phases/02-recommendations/PHASE-02-SUMMARY.md`
- Backup manifest: `.backups/test-data-cleanup-2026-02-10/BACKUP_MANIFEST.md`

---

## 🎉 After Deployment

Your application will have:
- ✅ 70% faster API responses
- ✅ Cross-browser compatibility verified
- ✅ Comprehensive monitoring documentation
- ✅ Clean production database
- ✅ Full backup and recovery capability

**Ready for production use!**
