# Database Setup Guide

## Option 1: Supabase (Recommended - Free & Easy)

### Step 1: Create Supabase Account
1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project" 
3. Sign up with GitHub, Google, or email

### Step 2: Create New Project
1. Click "New Project"
2. Choose your organization (or create one)
3. Fill in project details:
   - **Name**: `custodial-command`
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to you
4. Click "Create new project"
5. Wait 2-3 minutes for setup to complete

### Step 3: Get Connection String
1. In your Supabase dashboard, go to **Settings** → **Database**
2. Scroll down to "Connection string"
3. Select **URI** tab
4. Copy the connection string (it looks like):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```
5. Replace `[YOUR-PASSWORD]` with the password you created in Step 2

### Step 4: Update .env File
Replace the DATABASE_URL in your `.env` file with your Supabase connection string.

## Option 2: Neon (Alternative Free Option)

### Step 1: Create Neon Account
1. Go to [neon.tech](https://neon.tech)
2. Sign up with GitHub or email

### Step 2: Create Database
1. Click "Create a database"
2. Choose a name: `custodial-command`
3. Select region closest to you
4. Click "Create database"

### Step 3: Get Connection String
1. In your Neon dashboard, click on your database
2. Go to "Connection Details"
3. Copy the connection string from "Direct connection"

### Step 4: Update .env File
Replace the DATABASE_URL in your `.env` file with your Neon connection string.

## After Setting Up Database

1. Update your `.env` file with the real connection string
2. Run: `npm run db:push` to create the database tables
3. Run: `npm run dev` to start the application

The app will automatically create all the necessary tables for inspections, users, and custodial notes.