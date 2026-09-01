#!/bin/sh
set -e

echo "🚀 Starting OS20..."

# Run database migrations
if [ "$DISABLE_DB_MIGRATIONS" != "true" ]; then
  echo "📦 Running database migrations..."
  node dist/database/scripts/setup-db.js || true
  yarn database:migrate:prod --force --include-slow || true
fi

# Start the server
echo "🔧 Starting server..."
node dist/main &
SERVER_PID=$!

# Wait for server to be ready
echo "⏳ Waiting for server..."
for i in $(seq 1 30); do
  if curl -s http://localhost:3000/healthz > /dev/null 2>&1; then
    echo "✅ Server is ready!"
    break
  fi
  sleep 2
done

# Keep running
wait $SERVER_PID
