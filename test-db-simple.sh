#!/bin/bash

# Simple database connection test using psql
DATABASE_URL="postgresql://neondb_owner:npg_WwJEd5ILV7lq@ep-aged-wind-ad9g7vhf-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

echo "Testing database connection to Neon..."
echo "Database host: ep-aged-wind-ad9g7vhf-pooler.c-2.us-east-1.aws.neon.tech"
echo ""

# Try to connect and run a simple query
psql "$DATABASE_URL" -c "SELECT version();" 2>&1

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Database connection successful!"
    echo ""
    echo "Checking tables..."
    psql "$DATABASE_URL" -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' LIMIT 10;" 2>&1
else
    echo ""
    echo "❌ Database connection failed"
    echo ""
    echo "Possible issues:"
    echo "1. psql is not installed (install with: brew install postgresql)"
    echo "2. Database URL is incorrect"
    echo "3. Network connectivity issues"
    echo "4. Database is suspended or offline"
fi