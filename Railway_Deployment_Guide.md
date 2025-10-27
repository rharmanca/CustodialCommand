# Railway Deployment Guide for Custodial Command

This guide provides step-by-step instructions for deploying the enhanced Custodial Command application to Railway.

## Prerequisites

1. **Railway Account**: Make sure you have a Railway account at [railway.app](https://railway.app)
2. **Railway CLI**: Install the Railway CLI tool
   ```bash
   npm install -g @railway/cli
   # Or using curl
   curl -fsSL https://railway.app/install.sh | bash
   ```
3. **Git Repository**: Ensure your repository is properly set up with Git
4. **Database**: Have your Neon database URL ready

## Deployment Steps

### 1. Login to Railway
```bash
railway login
```

### 2. Navigate to Project Directory
```bash
cd /Users/rharman/CustodialCommand-1
```

### 3. Link to Existing Project or Create New One
If deploying to an existing project:
```bash
railway link
# Follow prompts to select your existing project
```

If creating a new project:
```bash
railway init
# Follow prompts to create a new project
```

### 4. Set Environment Variables
```bash
railway vars set DATABASE_URL "your-neon-database-url"
railway vars set ADMIN_USERNAME "admin"
railway vars set ADMIN_PASSWORD "your-secure-password"
railway vars set NODE_ENV "production"
railway vars set SESSION_SECRET "your-session-secret"
```

### 5. Configure Railway Service
Create/update the `railway.json` configuration file in your project root:

```json
{
  "projectId": "your-project-id",
  "services": [
    {
      "name": "custodial-command",
      "env": "production",
      "buildCommand": "npm run build",
      "startCommand": "npm start",
      "healthCheckPath": "/health"
    }
  ]
}
```

### 6. Update Package.json for Production
Ensure your `package.json` has the correct production scripts:

```json
{
  "scripts": {
    "dev": "NODE_ENV=development tsx server/index.ts",
    "dev:server": "NODE_ENV=development tsx server/index.ts",
    "dev:client": "vite",
    "start:clean": "node start-server.js",
    "test:forms": "node test-form-submissions.js",
    "test:health": "node test-health.js",
    "test:debug": "node test-submission-debug.js",
    "prebuild": "npm run check",
    "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --external:fs --external:path --external:crypto --external:http --external:https --external:url --external:os --external:stream --external:util --external:events --external:querystring --external:zlib --outdir=dist",
    "prestart": "node -e \"if (!process.env.DATABASE_URL) { console.error('DATABASE_URL not set'); process.exit(1); }\"",
    "start": "NODE_ENV=production node dist/index.js",
    "check": "tsc --noEmit",
    "db:push": "drizzle-kit push"
  }
}
```

### 7. Deploy to Railway
```bash
railway up
```

### 8. Deploy via Git (Alternative Method)
If you prefer to deploy via Git:

1. Add all changes to Git:
```bash
git add .
git commit -m "Deploy enhanced Custodial Command with new features and fixes"
git push origin main  # or your default branch
```

2. If Railway is connected to your GitHub/GitLab repository, it will automatically deploy when you push changes.

### 9. Verify Deployment
1. Check the deployment status:
```bash
railway dashboard
# This opens the Railway dashboard in your browser
```

2. Or check logs:
```bash
railway logs
```

3. Visit your deployed application (URL shown in Railway dashboard)

## Environment Configuration for Railway

The following environment variables should be configured in Railway:

- `DATABASE_URL`: Your Neon database connection string
- `ADMIN_USERNAME`: Admin username for the application (default: admin)
- `ADMIN_PASSWORD`: Secure password for admin access
- `SESSION_SECRET`: Random string for session encryption
- `NODE_ENV`: Set to "production" for production deployment

## Database Migration

After deployment, run database migrations if needed:

1. Connect to your Railway project
2. Run:
```bash
railway run npx drizzle-kit push
```

## Post-Deployment Verification

1. **Health Check**: Visit `https://your-app.railway.app/health` to verify the service is running
2. **Basic Functionality**: Test creating a simple inspection
3. **Export Functionality**: Test the new export features
4. **Mobile Experience**: Verify mobile responsiveness works correctly
5. **PWA Features**: Test installability and offline functionality

## Common Deployment Issues and Solutions

### Issue: Build fails due to dependencies
**Solution**: Check that all required dependencies are in `package.json` and that the `build` script completes successfully locally.

### Issue: Database connection errors
**Solution**: 
1. Verify `DATABASE_URL` is set correctly in Railway variables
2. Ensure the database is accessible from Railway's network
3. Check that the Neon database is provisioned and active

### Issue: Port binding errors
**Solution**: The application is configured to use the `PORT` environment variable that Railway provides automatically.

### Issue: Assets not loading
**Solution**: Verify that the build process completes and that static assets are properly referenced in the built application.

## Rollback Procedure

If deployment issues occur:

1. Identify the last known working deployment in Railway dashboard
2. Use Railway's rollback feature or redeploy from a stable git commit
3. Monitor logs to confirm the rollback was successful

## Monitoring and Maintenance

1. Regularly check Railway logs for errors
2. Monitor application performance
3. Update dependencies periodically
4. Backup important data regularly

## Performance Optimization for Railway

The application is configured with:
- Production build optimization
- Efficient database queries
- Proper caching headers
- Optimized image handling
- Efficient API response formats

## Security Considerations

- All API endpoints have rate limiting (80 requests/minute)
- Form inputs are sanitized
- SQL injection prevention is implemented
- Authentication is required for admin functions
- Session management is secure

## Support and Troubleshooting

For deployment issues:
1. Check Railway logs first
2. Verify environment variables are correctly set
3. Ensure database is accessible
4. Run local build to identify potential issues
5. Contact Railway support if infrastructure-related issues persist

Your enhanced Custodial Command application with all improvements should now be successfully deployed to Railway!