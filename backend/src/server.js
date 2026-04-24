import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
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

app.use(cors());
app.use(express.json({ limit: '10mb' }));

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

app.listen(PORT, () => {
  console.log(`🏥 HIPAA Auditor Backend running on port ${PORT}`);
});
