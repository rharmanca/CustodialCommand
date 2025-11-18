# Railway CLI Commands - Quick Fix

## Option 1: Run the Automated Script
```bash
./railway-cli-fix.sh
```

## Option 2: Manual Commands (Copy & Paste)

### 1. First, ensure Railway CLI is installed:
```bash
# Install Railway CLI if you don't have it
brew install railway
# OR
npm install -g @railway/cli
```

### 2. Login and link to your project:
```bash
railway login
railway link
```

### 3. Set the DATABASE_URL environment variable:
```bash
railway variables set DATABASE_URL="postgresql://neondb_owner:npg_WwJEd5ILV7lq@ep-aged-wind-ad9g7vhf-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
```

### 4. Set NODE_ENV to production:
```bash
railway variables set NODE_ENV="production"
```

### 5. Verify variables are set:
```bash
railway variables
```

### 6. Trigger a new deployment:
```bash
railway up
```

### 7. Watch the logs:
```bash
railway logs
```

### 8. Open your deployed app:
```bash
railway open
```

## One-Liner (All Variables at Once)

If you're already linked to your project, you can set both variables in one command:

```bash
railway variables set DATABASE_URL="postgresql://neondb_owner:npg_WwJEd5ILV7lq@ep-aged-wind-ad9g7vhf-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require" NODE_ENV="production" && railway up
```

## Troubleshooting

### Check current deployment status:
```bash
railway status
```

### View all logs (follow mode):
```bash
railway logs -f
```

### Restart the deployment:
```bash
railway restart
```

### Run database migration manually:
```bash
railway run npm run db:push
```

### Check if database connection works from Railway environment:
```bash
railway run node -e "console.log('DB URL exists:', !!process.env.DATABASE_URL)"
```

## Emergency Database Schema Push

If the database schema wasn't created, run this:
```bash
railway run npm run db:push
```

Then restart:
```bash
railway restart
```

## Verify Everything is Working

After deployment, check these endpoints:
- Health check: `https://your-app.railway.app/health`
- Main app: `https://your-app.railway.app`

The health check should return a JSON response with status "ok".