// Insight endpoints: real, computed compliance signals for the visualization
// pages (no mock data).
import express from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken);

async function safeCount(label, query, params) {
  try {
    const r = await pool.query(query, params);
    return parseInt(r.rows[0].c, 10);
  } catch (err) {
    console.error(`insights: ${label} query failed:`, err.message);
    return 0;
  }
}

function pct(part, whole) {
  return whole > 0 ? Math.round((part / whole) * 100) : 0;
}

// GET /api/insights/summary — headline compliance signals + 12-month trend.
router.get('/summary', async (_req, res) => {
  try {
    const [
      totalRecords, completedRecords,
      totalRisks, highRisks,
      totalIncidents, openIncidents,
      totalPolicies, activePolicies,
      totalEmployees, certifiedEmployees,
    ] = await Promise.all([
      safeCount('training_records total', 'SELECT COUNT(*)::int AS c FROM training_records'),
      safeCount('training_records completed', "SELECT COUNT(*)::int AS c FROM training_records WHERE status = 'completed'"),
      safeCount('risk total', 'SELECT COUNT(*)::int AS c FROM risk_register'),
      safeCount('risk high', "SELECT COUNT(*)::int AS c FROM risk_register WHERE risk_level IN ('high','critical')"),
      safeCount('incident total', 'SELECT COUNT(*)::int AS c FROM incident_reports'),
      safeCount('incident open', "SELECT COUNT(*)::int AS c FROM incident_reports WHERE status IN ('open','in_progress')"),
      safeCount('policy total', 'SELECT COUNT(*)::int AS c FROM policies'),
      safeCount('policy active', "SELECT COUNT(*)::int AS c FROM policies WHERE status = 'active'"),
      safeCount('employee total', 'SELECT COUNT(*)::int AS c FROM employees'),
      safeCount('employee certified', 'SELECT COUNT(*)::int AS c FROM employees WHERE hipaa_certified = true'),
    ]);

    // Incident volume per month for the trailing 12 months (oldest first).
    let trend = new Array(12).fill(0);
    try {
      const t = await pool.query(
        `SELECT date_trunc('month', reported_date) AS m, COUNT(*)::int AS c
         FROM incident_reports
         WHERE reported_date >= date_trunc('month', CURRENT_DATE) - INTERVAL '11 months'
         GROUP BY m`
      );
      const byMonth = new Map(t.rows.map((r) => [new Date(r.m).toISOString().slice(0, 7), r.c]));
      const now = new Date();
      trend = trend.map((_, i) => {
        const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (11 - i), 1));
        return byMonth.get(d.toISOString().slice(0, 7)) || 0;
      });
    } catch (err) {
      console.error('insights: trend query failed:', err.message);
    }

    res.json({
      signals: [
        { label: 'Training completion', value: pct(completedRecords, totalRecords), detail: `${completedRecords}/${totalRecords} records completed` },
        { label: 'Risk posture', value: totalRisks ? 100 - pct(highRisks, totalRisks) : 100, detail: `${highRisks}/${totalRisks} high or critical risks` },
        { label: 'Incident pressure', value: totalIncidents ? 100 - pct(openIncidents, totalIncidents) : 100, detail: `${openIncidents}/${totalIncidents} incidents open` },
        { label: 'Policy currency', value: pct(activePolicies, totalPolicies), detail: `${activePolicies}/${totalPolicies} policies active` },
        { label: 'Certification coverage', value: pct(certifiedEmployees, totalEmployees), detail: `${certifiedEmployees}/${totalEmployees} staff HIPAA certified` },
      ],
      incident_trend_12m: trend,
    });
  } catch (err) {
    console.error('GET /insights/summary error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/insights/case-funnel — governed-training case counts per workflow
// state, oldest stage first. Empty (not an error) when migration 001 has not
// been applied.
router.get('/case-funnel', async (_req, res) => {
  const STAGES = ['assigned', 'content_verified', 'in_progress', 'assessed', 'attested', 'remediation', 'compliance_review', 'closed'];
  try {
    const r = await pool.query('SELECT state, COUNT(*)::int AS c FROM governed_cases GROUP BY state');
    const byState = new Map(r.rows.map((row) => [row.state, row.c]));
    res.json({
      available: true,
      stages: STAGES.map((state) => ({ state, count: byState.get(state) || 0 })),
    });
  } catch (err) {
    if (err.code === '42P01') {
      return res.json({ available: false, stages: STAGES.map((state) => ({ state, count: 0 })) });
    }
    console.error('GET /insights/case-funnel error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
