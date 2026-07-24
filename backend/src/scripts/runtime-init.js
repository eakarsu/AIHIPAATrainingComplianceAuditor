import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../../../.env') });

const { default: pool } = await import('../db.js');

try {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR UNIQUE NOT NULL,
      password_hash VARCHAR NOT NULL,
      full_name VARCHAR NOT NULL,
      role VARCHAR DEFAULT 'employee',
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS audit_logs (
      id SERIAL PRIMARY KEY,
      action VARCHAR,
      entity_type VARCHAR,
      entity_id INTEGER,
      user_email VARCHAR,
      details JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS ai_results_store (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      user_email VARCHAR,
      tool_name VARCHAR NOT NULL,
      input_snapshot JSONB,
      result TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
  const email = process.env.ADMIN_EMAIL || 'runtime-admin@example.com';
  const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'RuntimeAcceptance123!', 12);
  await pool.query(
    `INSERT INTO users (email, password_hash, full_name, role)
     VALUES ($1, $2, $3, 'admin')
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, full_name = EXCLUDED.full_name, role = EXCLUDED.role`,
    [email.trim().toLowerCase(), passwordHash, 'Runtime Administrator']
  );
} catch (error) {
  console.error(`Runtime initialization failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await pool.end();
}
