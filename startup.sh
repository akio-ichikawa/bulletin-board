#!/bin/sh
set -e  # エラー時に停止

# データベース接続の確認
echo "Checking database connection..."
npx prisma db push --accept-data-loss || {
  echo "Database connection failed"
  exit 1
}

# Run migrations
echo "Running migrations..."
npx prisma migrate deploy || {
  echo "Migration failed"
  exit 1
}
echo "Migrations completed."

# Start the application
echo "Starting the application..."
npm run start || {
  echo "Application failed to start"
  exit 1
} 