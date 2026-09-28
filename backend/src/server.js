
// === Batch 04 Gaps & Frontend Mounts ===
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
import customViewsRoutes from './routes/customViews.js';
import minimumNecessaryTrainingDriftRoutes from './routes/minimumNecessaryTrainingDrift.js';
import breachSimulationRoutes from './routes/breachSimulation.js';
import insiderAccessMonitorRoutes from './routes/insiderAccessMonitor.js';
import featureToolsRoutes from './routes/featureTools.js';
import operationsTasksRoutes from './routes/operationsTasks.js';
import insightsRoutes from './routes/insights.js';
import governanceRouter from './governance/router.js';
import governanceRuntime from './governance/runtime.cjs';
import { runReminderScan } from './services/reminderScan.js';

governanceRuntime.validateRuntime();

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
app.use('/api/minimum-necessary-training-drift', minimumNecessaryTrainingDriftRoutes);
app.use('/api/governed-training', governanceRouter);
app.use('/api/breach-simulation', breachSimulationRoutes);
app.use('/api/insider-access-monitor', insiderAccessMonitorRoutes);
app.use('/api', featureToolsRoutes);
app.use('/api/operations-tasks', operationsTasksRoutes);
app.use('/api/insights', insightsRoutes);

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
async function runScheduledReminderScan() {
  try {
    const s = await runReminderScan();
    console.log(`[scheduler] reminder scan complete: ${s.overdue_deadlines} overdue + ${s.expiring_certifications} certs + ${s.expiring_baas} BAAs (${s.reminders_created} created)`);
    for (const e of s.errors) console.error(`[scheduler] ${e}`);
  } catch (err) {
    console.error('[scheduler] error:', err.message);
  }
}

// Legacy reminder mutation is opt-in; normal service startup is non-destructive.
if (process.env.ENABLE_LEGACY_SCHEDULERS === 'true') {
  cron.schedule('0 7 * * *', runScheduledReminderScan);
  setTimeout(runScheduledReminderScan, 10000);
}



// Custom Views (4 endpoints) — must be mounted BEFORE any 404 handler
app.use('/api/custom-views', customViewsRoutes);

app.listen(PORT, () => {
  console.log(`HIPAA Auditor Backend running on port ${PORT}`);
});
