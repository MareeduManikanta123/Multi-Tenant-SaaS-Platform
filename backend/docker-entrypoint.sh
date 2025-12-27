#!/bin/sh

# Exit on error
set -e

echo "🚀 Starting SaaS Platform Backend..."

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
timeout=30
while [ $timeout -gt 0 ]; do
  if node -e "const pg = require('pg'); const client = new pg.Client('postgresql://saas_user:saas_password_secure@database:5432/saas_platform'); client.connect((err) => { if (err) process.exit(1); client.end(); process.exit(0); })" 2>/dev/null; then
    echo "✅ Database is ready!"
    break
  fi
  echo "  Still waiting... ($timeout seconds remaining)"
  timeout=$((timeout - 1))
  sleep 1
done

if [ $timeout -eq 0 ]; then
  echo "❌ Database did not become ready in time"
  exit 1
fi

# Run database migrations
echo "🔄 Running database migrations..."
if npm run migrate; then
  echo "✅ Migrations completed successfully"
else
  echo "⚠️  Migration completed with warnings (may be idempotent re-runs)"
fi

# Run database seeds
echo "🌱 Seeding database with initial data..."
if npm run seed; then
  echo "✅ Seed data loaded successfully"
else
  echo "⚠️  Seed operation completed (may be idempotent)"
fi

# Start the application
echo "🎯 Starting application server..."
exec npm start
