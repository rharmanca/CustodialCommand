# Finalize Deployment - Quick Guide

## Current Status
- ✅ Code pushed to GitHub (32 commits)
- ✅ Railway should auto-deploy (check in 1-2 minutes)
- ⏳ Database indexes need to be applied
- ⏳ Test data cleanup pending

## Option 1: Railway Dashboard (Easiest - 3 minutes)

1. Go to https://railway.app/
2. Click on **custodial-command** project
3. Click on **PostgreSQL** database
4. Click **Query** tab
5. Paste and run this SQL:

```sql
-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_room_inspections_inspection_id ON room_inspections(inspection_id);
CREATE INDEX IF NOT EXISTS idx_room_inspections_room_number ON room_inspections(room_number);
CREATE INDEX IF NOT EXISTS idx_room_inspections_created_at ON room_inspections(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_room_inspections_inspection_room ON room_inspections(inspection_id, room_number);
CREATE INDEX IF NOT EXISTS idx_inspections_inspector_name ON inspections(inspector_name);
CREATE INDEX IF NOT EXISTS idx_inspections_school ON inspections(school);
CREATE INDEX IF NOT EXISTS idx_inspections_created_at ON inspections(created_at DESC);
```

6. Click **Run**
7. Done! Indexes are now applied.

## Option 2: Railway CLI (If configured)

```bash
# Make sure you're linked
railway link

# Open a shell on the Railway environment
railway shell

# Run migrations
npx drizzle-kit push
```

## Option 3: Create .env file locally

Create a `.env` file in the project root:

```bash
DATABASE_URL=postgresql://username:password@hostname:port/database
```

Replace with your actual Railway database URL.

Then run:
```bash
npx drizzle-kit push
```

## Verify Deployment

After applying indexes, test the performance:

```bash
# Should respond in <500ms (was 1.67s before)
curl -w "%{time_total}\n" -o /dev/null -s \
  https://cacustodialcommand.up.railway.app/api/room-inspections?limit=10
```

## Test Data Cleanup (Optional)

To clean up test data:

```bash
cd .backups/test-data-cleanup-2026-02-10/

# Set your DATABASE_URL
export DATABASE_URL="your_railway_database_url"

# Run cleanup
node delete-test-data.js --confirm
```

## Check Health

```bash
curl https://cacustodialcommand.up.railway.app/health
```

Expected: `{"status":"ok","database":"connected",...}`

---

## What Was Deployed

1. ✅ **Performance optimizations** - Code changes pushed
2. ✅ **Monitoring docs** - Complete runbook created
3. ✅ **Test data backup** - Safely stored
4. ⏳ **Database indexes** - Need to apply via one of the options above
5. ⏳ **Test data cleanup** - Optional, can do later

## Need Help?

- Full deployment guide: `DEPLOYMENT-GUIDE.md`
- Database SQL: `apply-performance-indexes.sql`
- Monitoring runbook: `docs/monitoring/monitoring-runbook.md`
