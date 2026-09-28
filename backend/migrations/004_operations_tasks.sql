-- Migration 004: operations desk tasks
-- Durable task list backing POST/GET /api/operations-tasks.
-- Forward-only: no drop/down path. Safe to run on an existing database.

BEGIN;

CREATE TABLE IF NOT EXISTS operations_tasks (
  id SERIAL PRIMARY KEY,
  task VARCHAR(500) NOT NULL,
  owner VARCHAR(80) NOT NULL DEFAULT 'User',
  priority VARCHAR(10) NOT NULL DEFAULT 'Medium'
    CHECK (priority IN ('Low', 'Medium', 'High')),
  status VARCHAR(20) NOT NULL DEFAULT 'Queued'
    CHECK (status IN ('Queued', 'Ready', 'In progress', 'Done')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS operations_tasks_created_idx
  ON operations_tasks (created_at DESC);

COMMIT;
