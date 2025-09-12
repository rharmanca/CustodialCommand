#!/bin/bash

# Database Configuration Check Script
# This script verifies that the application is using the correct database

echo "🔍 Checking Database Configuration..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL is not set"
    exit 1
fi

# Check if it points to NeonDB
if [[ "$DATABASE_URL" == *"neon.tech"* ]]; then
    echo "✅ DATABASE_URL correctly points to NeonDB"
    echo "📍 Database: $(echo $DATABASE_URL | cut -d'@' -f2 | cut -d'/' -f1)"
else
    echo "❌ ERROR: DATABASE_URL does not point to NeonDB!"
    echo "Current: $DATABASE_URL"
    echo "Expected: Should contain 'neon.tech'"
    exit 1
fi

# Check if Railway's PostgreSQL URL is present (should not be used)
if [ ! -z "$RAILWAY_SERVICE_POSTGRES_URL" ]; then
    echo "⚠️  WARNING: RAILWAY_SERVICE_POSTGRES_URL is present but should not be used"
    echo "This could cause confusion if Railway switches to it automatically"
fi

echo "✅ Database configuration is correct"
