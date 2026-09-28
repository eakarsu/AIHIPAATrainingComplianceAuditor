-- Migration 002: runtime feature tables
-- Creates the tables assumed by mounted routes but previously never migrated:
--   reminders        (GET/POST /api/reminders, reminder scan job)
--   quiz_attempts    (/api/ai/log-quiz-attempt, /api/ai/quiz-analytics, remediation)
--   ai_results_store (/api/ai history endpoints; previously only in runtime-init.js)
-- Adds audit_logs.severity used by /api/insider-access-monitor/recent-anomalies.
-- Forward-only: no drop/down path. Safe to run on an existing database.

BEGIN;

-- Canonical audit_logs shape (matches seed.js); created here only so this
-- migration is self-sufficient on databases that have not run the demo seed.
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  action VARCHAR,
  entity_type VARCHAR,
  entity_id INT,
  user_email VARCHAR,
  details TEXT,
  ip_address VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE audit_logs
  ADD COLUMN IF NOT EXISTS severity VARCHAR(20) NOT NULL DEFAULT 'info'
  CHECK (severity IN ('info', 'low', 'medium', 'high', 'critical'));

CREATE INDEX IF NOT EXISTS audit_logs_severity_created_idx
  ON audit_logs (severity, created_at DESC);

CREATE TABLE IF NOT EXISTS reminders (
  id SERIAL PRIMARY KEY,
  type VARCHAR(80) NOT NULL,
  entity_type VARCHAR(80),
  entity_id INTEGER,
  message TEXT NOT NULL,
  severity VARCHAR(20) NOT NULL DEFAULT 'medium'
    CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS reminders_unack_created_idx
  ON reminders (acknowledged, created_at DESC);

CREATE INDEX IF NOT EXISTS reminders_entity_idx
  ON reminders (entity_type, entity_id);

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER,
  course_id INTEGER,
  question_text TEXT,
  selected_answer TEXT,
  correct_answer TEXT,
  is_correct BOOLEAN,
  topic VARCHAR(160),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS quiz_attempts_employee_idx
  ON quiz_attempts (employee_id, created_at DESC);

CREATE INDEX IF NOT EXISTS quiz_attempts_topic_idx
  ON quiz_attempts (topic);

-- Definition must stay identical to backend/src/scripts/runtime-init.js.
CREATE TABLE IF NOT EXISTS ai_results_store (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  user_email VARCHAR,
  tool_name VARCHAR NOT NULL,
  input_snapshot JSONB,
  result TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ai_results_store_user_idx
  ON ai_results_store (user_id, created_at DESC);

COMMIT;
