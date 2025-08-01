# Custodial Command - Bolt.new Setup Guide

This guide will help you import and run the Custodial Command app in Bolt.new.

## 🚀 Quick Import to Bolt.new

### Method 1: Direct Import (Recommended)
1. **Upload the Files**: Import all files from this `custodial-command-bolt-export` folder into your Bolt.new project
2. **Install Dependencies**: Bolt.new will automatically detect the package.json and install dependencies
3. **Set Environment Variables**: Add your database URL (see Environment Setup below)
4. **Run the App**: Use `npm run dev` to start both frontend and backend

### Method 2: Manual Setup
1. Create a new Bolt.new project
2. Copy all files from this export folder
3. Run `npm install` to install dependencies
4. Set up environment variables
5. Start with `npm run dev`

## 🔧 Environment Setup

Create a `.env` file in your project root:

```env
# Required: Database connection
DATABASE_URL=postgresql://username:password@host:port/database

# Optional: Server configuration
NODE_ENV=development
PORT=5000
```

### Database Options:
- **Neon.tech**: Free PostgreSQL (recommended for Bolt.new)
- **Supabase**: Free tier with PostgreSQL
- **Railway**: Simple PostgreSQL hosting
- **Local PostgreSQL**: If running locally

## 📦 Dependencies Explained

### Core Stack:
- **React 18** + **TypeScript** for frontend
- **Express.js** for API server
- **PostgreSQL** + **Drizzle ORM** for database
- **Vite** for build tooling
- **Tailwind CSS** + **Shadcn/UI** for styling

### Key Features:
- **Auto-save** functionality with localStorage backup
- **Progressive Web App** capabilities
- **Mobile-responsive** design
- **Photo upload** for inspections
- **Real-time** data analytics

## 🗄️ Database Setup

1. **Get a PostgreSQL database** (Neon.tech is free and easy)
2. **Add your DATABASE_URL** to the .env file
3. **Push the schema**: Run `npm run db:push`
4. **Verify connection**: The app will create tables automatically

### Sample Database URLs:
```env
# Neon.tech
DATABASE_URL=postgresql://username:password@hostname.neon.tech/dbname?sslmode=require

# Supabase
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres

# Railway
DATABASE_URL=postgresql://postgres:[password]@[host]:5432/railway
```

## 🏃‍♂️ Running the App

### Development Mode:
```bash
npm run dev
```
This starts:
- **Frontend** (Vite) on port 5173
- **Backend** (Express) on port 5000
- **Auto-reload** for both

### Production Build:
```bash
npm run build
npm start
```

## 📱 PWA Features

Once running, you can:
- **Install on mobile** devices (iOS/Android)
- **Work offline** with auto-save drafts
- **Add to home screen** for app-like experience

## 🎯 Key App Features

### Inspection Types:
1. **Single Room Inspections** - Quick facility assessments
2. **Whole Building Inspections** - Comprehensive building evaluations
3. **Custodial Notes** - Additional feedback and concerns

### Rating System:
- **11 categories** (floors, surfaces, restrooms, etc.)
- **1-5 star ratings** with detailed criteria
- **Auto-save every 2 seconds** prevents data loss

### Data Analytics:
- **School-level summaries** with performance breakdowns
- **Room-specific analysis** with trend tracking
- **Interactive filtering** by multiple criteria

## 🔍 Troubleshooting

### Common Issues:

**Database Connection Failed:**
- Verify your DATABASE_URL is correct
- Check if the database server is running
- Ensure SSL mode is set correctly for cloud databases

**Port Conflicts:**
- Frontend runs on 5173, backend on 5000
- Modify ports in vite.config.ts if needed

**Build Errors:**
- Run `npm install` to ensure all dependencies are installed
- Check TypeScript errors with `npm run check`

**PWA Not Working:**
- Ensure you're running on HTTPS (required for PWA features)
- Check browser console for service worker errors

### Performance Tips:
- Use a fast database connection (Neon.tech recommended)
- Enable gzip compression for better load times
- Consider Redis for session storage in production

## 📧 Support

If you encounter issues:
1. Check the console for error messages
2. Verify your database connection
3. Ensure all environment variables are set
4. Try running `npm run db:push` to reset the schema

## 🎨 Customization

The app uses a retro propaganda poster theme with:
- **Cream, red, and charcoal** color scheme
- **Bold, motivational** typography
- **Mobile-first** responsive design

You can customize colors in `src/index.css` and components in `src/components/ui/`.

---

**Ready to deploy?** The app is production-ready and can be deployed to any Node.js hosting platform that supports PostgreSQL.