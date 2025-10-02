#!/bin/sh

# Wait for postgres to be ready
echo "⏳ Waiting for postgres..."
until npx prisma db push --skip-generate 2>/dev/null; do
  echo "Postgres is unavailable - sleeping"
  sleep 2
done

echo "✅ Postgres is ready!"

# Run migrations
echo "🔄 Running migrations..."
npx prisma db push --skip-generate

echo "✅ Migrations applied!"

# Start the application in background to seed data
echo "🚀 Starting application..."
node server.js &
APP_PID=$!

# Wait for app to be ready
echo "⏳ Waiting for application to start..."
sleep 5

# Seed database via API (if endpoint exists)
echo "🌱 Seeding database..."
curl -X POST http://localhost:3000/api/seed -f 2>/dev/null || echo "⚠️  Seed endpoint not available (might be already seeded)"

echo "✅ Application ready at http://localhost:3000"

# Bring app to foreground
wait $APP_PID

