
// === Batch 04 Gaps & Frontend Mounts ===
import route_gap_limited_vendor_security_assessment_depth from '../routes/gap-limited-vendor-security-assessment-depth.js';
import route_gap_no_breach_simulation_tabletop_endpoint from '../routes/gap-no-breach-simulation-tabletop-endpoint.js';
import route_gap_no_insider_threat_behavior_baseline_drif from '../routes/gap-no-insider-threat-behavior-baseline-drif.js';
import route_gap_no_user_facing_dashboard_backend_api from '../routes/gap-no-user-facing-dashboard-backend-api.js';
import route_gap_no_real_time_phi_streaming_monitor from '../routes/gap-no-real-time-phi-streaming-monitor.js';
import route_gap_no_ehr_system_integration from '../routes/gap-no-ehr-system-integration.js';
import route_gap_no_external_regulator_communication_work from '../routes/gap-no-external-regulator-communication-work.js';
import route_gap_no_webhook_surface_for_siem_integration from '../routes/gap-no-webhook-surface-for-siem-integration.js';
import route_gap_no_multi_tenant_covered_entity_isolation from '../routes/gap-no-multi-tenant-covered-entity-isolation.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import cron from 'node-cron';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../.env') });

import pool from './db.js';
import authRoutes from './routes/auth.js';
import employeeRoutes from './routes/employees.js';
import departmentRoutes from './routes/departments.js';
import courseRoutes from './routes/courses.js';
import trainingRecordRoutes from './routes/trainingRecords.js';
import assessmentRoutes from './routes/assessments.js';
import policyRoutes from './routes/policies.js';
import incidentRoutes from './routes/incidents.js';
import baaRoutes from './routes/baas.js';
import phiRoutes from './routes/phiInventory.js';
import riskRoutes from './routes/riskRegister.js';
import auditLogRoutes from './routes/auditLogs.js';
import deadlineRoutes from './routes/deadlines.js';
import sanctionRoutes from './routes/sanctions.js';
import documentRoutes from './routes/documents.js';
import accessControlRoutes from './routes/accessControl.js';
import aiRoutes from './routes/ai.js';

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

app.use(helmet());

// CORS allowlist via env (ALLOWED_ORIGINS=comma,separated). Falls back to single CLIENT_URL.
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : [process.env.CLIENT_URL || 'http://localhost:5173', 'http://localhost:3000'];
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Global rate limiter
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests' },
}));

// Ensure AI results table exists
pool.query(`
  CREATE TABLE IF NOT EXISTS ai_results_store (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    user_email TEXT,
    tool_name TEXT NOT NULL,
    input_snapshot JSONB,
    result TEXT,
    created_at TIMESTAMP DEFAULT NOW()
  );
`).catch(err => console.error('ai_results_store init error:', err.message));

// Ensure quiz_attempts table exists (Feature #5)
pool.query(`
  CREATE TABLE IF NOT EXISTS quiz_attempts (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER,
    course_id INTEGER,
    question_text TEXT,
    selected_answer TEXT,
    correct_answer TEXT,
    is_correct BOOLEAN DEFAULT false,
    topic TEXT,
    created_at TIMESTAMP DEFAULT NOW()
  );
`).catch(err => console.error('quiz_attempts init error:', err.message));

// Add due_date column to training_records if missing
pool.query(`ALTER TABLE training_records ADD COLUMN IF NOT EXISTS due_date DATE`).catch(err => console.error('due_date column add error:', err.message));

// Reminders table for the scheduler
pool.query(`
  CREATE TABLE IF NOT EXISTS reminders (
    id SERIAL PRIMARY KEY,
    type TEXT,
    entity_type TEXT,
    entity_id INTEGER,
    message TEXT,
    severity TEXT DEFAULT 'info',
    acknowledged BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
  );
`).catch(err => console.error('reminders init error:', err.message));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/training-records', trainingRecordRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/policies', policyRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/baas', baaRoutes);
app.use('/api/phi-inventory', phiRoutes);
app.use('/api/risk-register', riskRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/deadlines', deadlineRoutes);
app.use('/api/sanctions', sanctionRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/access-control', accessControlRoutes);
app.use('/api/ai', aiRoutes);
import('./routes/breachSimulation.js').then(m => app.use('/api/breach-simulation', m.default));
import('./routes/insiderAccessMonitor.js').then(m => app.use('/api/insider-access-monitor', m.default));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Dashboard stats
app.get('/api/dashboard', async (req, res) => {
  try {
    const stats = await Promise.all([
      pool.query('SELECT COUNT(*) FROM employees'),
      pool.query('SELECT COUNT(*) FROM training_courses'),
      pool.query('SELECT COUNT(*) FROM training_records WHERE status = $1', ['completed']),
      pool.query('SELECT COUNT(*) FROM compliance_assessments WHERE status = $1', ['non_compliant']),
      pool.query('SELECT COUNT(*) FROM incident_reports WHERE status IN ($1, $2)', ['open', 'in_progress']),
      pool.query('SELECT COUNT(*) FROM policies WHERE status = $1', ['active']),
      pool.query('SELECT COUNT(*) FROM risk_register WHERE risk_level IN ($1, $2)', ['high', 'critical']),
      pool.query('SELECT COUNT(*) FROM compliance_deadlines WHERE due_date < NOW() AND status != $1', ['completed']),
    ]);
    res.json({
      totalEmployees: parseInt(stats[0].rows[0].count),
      totalCourses: parseInt(stats[1].rows[0].count),
      completedTrainings: parseInt(stats[2].rows[0].count),
      nonCompliantAssessments: parseInt(stats[3].rows[0].count),
      openIncidents: parseInt(stats[4].rows[0].count),
      activePolicies: parseInt(stats[5].rows[0].count),
      highRisks: parseInt(stats[6].rows[0].count),
      overdueDeadlines: parseInt(stats[7].rows[0].count),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reminders endpoint (paginated)
app.get('/api/reminders', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const [rows, count] = await Promise.all([
      pool.query(`SELECT * FROM reminders WHERE acknowledged = false ORDER BY created_at DESC LIMIT $1 OFFSET $2`, [limit, offset]),
      pool.query(`SELECT COUNT(*)::int AS cnt FROM reminders WHERE acknowledged = false`),
    ]);
    res.json({ data: rows.rows, total: count.rows[0].cnt, page, limit });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/reminders/:id/acknowledge', async (req, res) => {
  try {
    await pool.query('UPDATE reminders SET acknowledged = true WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Background scheduler — daily at 7am: scan for due deadlines, expiring certs, expiring BAAs
async function runReminderScan() {
  try {
    // Overdue compliance deadlines
    const overdue = await pool.query(
      `SELECT id, title FROM compliance_deadlines WHERE due_date < NOW() AND status != 'completed' LIMIT 50`
    ).catch(() => ({ rows: [] }));
    for (const r of overdue.rows) {
      await pool.query(
        `INSERT INTO reminders (type, entity_type, entity_id, message, severity)
         SELECT 'overdue_deadline', 'compliance_deadlines', $1, $2, 'high'
         WHERE NOT EXISTS (SELECT 1 FROM reminders WHERE entity_type='compliance_deadlines' AND entity_id=$1 AND acknowledged=false)`,
        [r.id, `Overdue deadline: ${r.title}`]
      ).catch(() => {});
    }
    // Expiring certifications (within 30 days of 1-year mark)
    const expiringCerts = await pool.query(
      `SELECT id, first_name, last_name FROM employees
       WHERE certification_date IS NOT NULL
         AND certification_date + INTERVAL '11 months' <= CURRENT_DATE
         AND certification_date + INTERVAL '12 months' > CURRENT_DATE LIMIT 100`
    ).catch(() => ({ rows: [] }));
    for (const r of expiringCerts.rows) {
      await pool.query(
        `INSERT INTO reminders (type, entity_type, entity_id, message, severity)
         SELECT 'cert_expiring', 'employees', $1, $2, 'medium'
         WHERE NOT EXISTS (SELECT 1 FROM reminders WHERE entity_type='employees' AND entity_id=$1 AND type='cert_expiring' AND acknowledged=false)`,
        [r.id, `HIPAA certification expiring soon: ${r.first_name} ${r.last_name}`]
      ).catch(() => {});
    }
    // Expiring BAAs (90 days)
    const expiringBAAs = await pool.query(
      `SELECT id, associate_name FROM business_associate_agreements
       WHERE expiration_date <= CURRENT_DATE + 90 AND expiration_date >= CURRENT_DATE LIMIT 50`
    ).catch(() => ({ rows: [] }));
    for (const r of expiringBAAs.rows) {
      await pool.query(
        `INSERT INTO reminders (type, entity_type, entity_id, message, severity)
         SELECT 'baa_expiring', 'business_associate_agreements', $1, $2, 'high'
         WHERE NOT EXISTS (SELECT 1 FROM reminders WHERE entity_type='business_associate_agreements' AND entity_id=$1 AND type='baa_expiring' AND acknowledged=false)`,
        [r.id, `BAA expiring within 90 days: ${r.associate_name}`]
      ).catch(() => {});
    }
    console.log(`[scheduler] reminder scan complete: ${overdue.rows.length} overdue + ${expiringCerts.rows.length} certs + ${expiringBAAs.rows.length} BAAs`);
  } catch (err) {
    console.error('[scheduler] error:', err.message);
  }
}

// Daily at 7:00am
cron.schedule('0 7 * * *', runReminderScan);
// Run once at startup (after a 10s delay so DB is up)
setTimeout(runReminderScan, 10000);


app.use('/api/gap-limited-vendor-security-assessment-depth', route_gap_limited_vendor_security_assessment_depth);
app.use('/api/gap-no-breach-simulation-tabletop-endpoint', route_gap_no_breach_simulation_tabletop_endpoint);
app.use('/api/gap-no-insider-threat-behavior-baseline-drif', route_gap_no_insider_threat_behavior_baseline_drif);
app.use('/api/gap-no-user-facing-dashboard-backend-api', route_gap_no_user_facing_dashboard_backend_api);
app.use('/api/gap-no-real-time-phi-streaming-monitor', route_gap_no_real_time_phi_streaming_monitor);
app.use('/api/gap-no-ehr-system-integration', route_gap_no_ehr_system_integration);
app.use('/api/gap-no-external-regulator-communication-work', route_gap_no_external_regulator_communication_work);
app.use('/api/gap-no-webhook-surface-for-siem-integration', route_gap_no_webhook_surface_for_siem_integration);
app.use('/api/gap-no-multi-tenant-covered-entity-isolation', route_gap_no_multi_tenant_covered_entity_isolation);

app.listen(PORT, () => {
  console.log(`HIPAA Auditor Backend running on port ${PORT}`);
});
