#!/bin/bash

# Railway deployment script for Monthly Feedback
echo "🚀 Starting Railway deployment for Monthly Feedback..."

# Run database migration
echo "📊 Running database migration..."
npm run db:push

# Start the server
echo "🔄 Starting server..."
npm start

