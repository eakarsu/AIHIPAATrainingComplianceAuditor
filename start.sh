#!/bin/bash

# ══════════════════════════════════════════════════════════════════════════
# HIPAA Training & Compliance Auditor - Start Script
# ══════════════════════════════════════════════════════════════════════════

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_PORT=3001
FRONTEND_PORT=3000

echo "══════════════════════════════════════════════════════════════"
echo "  HIPAA Training & Compliance Auditor"
echo "  Starting application..."
echo "══════════════════════════════════════════════════════════════"

# ── Clean up used ports ─────────────────────────────────────────────────
echo ""
echo "[1/6] Cleaning up ports $BACKEND_PORT and $FRONTEND_PORT..."

cleanup_port() {
  local port=$1
  local pids=$(lsof -ti :$port 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo "  Killing processes on port $port: $pids"
    echo "$pids" | xargs kill -9 2>/dev/null || true
    sleep 1
  else
    echo "  Port $port is free"
  fi
}

cleanup_port $BACKEND_PORT
cleanup_port $FRONTEND_PORT

# ── Check for PostgreSQL ────────────────────────────────────────────────
echo ""
echo "[2/6] Checking PostgreSQL..."

if ! command -v psql &> /dev/null; then
  echo "  ERROR: PostgreSQL (psql) not found. Please install PostgreSQL."
  exit 1
fi

# Check if PostgreSQL is running
if ! pg_isready -q 2>/dev/null; then
  echo "  PostgreSQL is not running. Attempting to start..."
  if command -v brew &> /dev/null; then
    brew services start postgresql@14 2>/dev/null || brew services start postgresql 2>/dev/null || true
  fi
  sleep 2
  if ! pg_isready -q 2>/dev/null; then
    echo "  ERROR: Could not start PostgreSQL. Please start it manually."
    exit 1
  fi
fi
echo "  PostgreSQL is running"

# ── Create database if not exists ───────────────────────────────────────
echo ""
echo "[3/6] Setting up database..."

DB_NAME="hipaa_auditor"
DB_USER="${DB_USER:-postgres}"

if psql -U "$DB_USER" -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
  echo "  Database '$DB_NAME' already exists"
else
  echo "  Creating database '$DB_NAME'..."
  createdb -U "$DB_USER" "$DB_NAME" 2>/dev/null || psql -U "$DB_USER" -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || true
  echo "  Database created"
fi

# ── Install dependencies ────────────────────────────────────────────────
echo ""
echo "[4/6] Installing dependencies..."

cd "$PROJECT_DIR/backend"
if [ ! -d "node_modules" ]; then
  echo "  Installing backend dependencies..."
  npm install
else
  echo "  Backend dependencies already installed"
fi

cd "$PROJECT_DIR/frontend"
if [ ! -d "node_modules" ]; then
  echo "  Installing frontend dependencies..."
  npm install
else
  echo "  Frontend dependencies already installed"
fi

# ── Seed database ───────────────────────────────────────────────────────
echo ""
echo "[5/6] Seeding database..."

cd "$PROJECT_DIR/backend"
node src/seed.js

# ── Start application ──────────────────────────────────────────────────
echo ""
echo "[6/6] Starting application with hot reload..."
echo ""

# Trap to clean up background processes on exit
cleanup() {
  echo ""
  echo "Shutting down..."
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
  wait $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
  echo "Goodbye!"
  exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# Start backend with nodemon for hot reload
cd "$PROJECT_DIR/backend"
npx nodemon src/server.js &
BACKEND_PID=$!

# Start frontend with Vite (hot reload built-in)
cd "$PROJECT_DIR/frontend"
npx vite --host &
FRONTEND_PID=$!

echo ""
echo "══════════════════════════════════════════════════════════════"
echo "  Application is running!"
echo ""
echo "  Frontend:  http://localhost:$FRONTEND_PORT"
echo "  Backend:   http://localhost:$BACKEND_PORT"
echo ""
echo "  Login Credentials:"
echo "    Admin: admin@hipaa-auditor.com / admin123"
echo "    User:  user@hipaa-auditor.com / user123"
echo ""
echo "  Press Ctrl+C to stop"
echo "══════════════════════════════════════════════════════════════"

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
