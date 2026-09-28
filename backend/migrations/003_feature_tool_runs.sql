-- Migration 003: feature tool run history
-- Persists every cf-*/gap-* feature-tool invocation (see
-- backend/src/routes/featureTools.js) for auditability.
-- Forward-only: no drop/down path. Safe to run on an existing database.

BEGIN;

CREATE TABLE IF NOT EXISTS feature_tool_runs (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(160) NOT NULL,
  user_id INTEGER,
  user_email VARCHAR,
  input TEXT,
  context JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(context) = 'object'),
  result TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS feature_tool_runs_slug_idx
  ON feature_tool_runs (slug, created_at DESC);

CREATE INDEX IF NOT EXISTS feature_tool_runs_user_idx
  ON feature_tool_runs (user_id, created_at DESC);

COMMIT;
