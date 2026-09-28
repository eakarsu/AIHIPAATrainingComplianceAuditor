// Minimum-necessary training drift: scores each department's drift between
// current PHI access activity and training recency, from live database state.
import express from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Deterministic scoring; kept pure so it stays unit-testable.
export function scoreDepartments(departments) {
  return departments.map((d) => {
    const score = Math.min(100, Math.round(Number(d.training_days_old) * 0.18 + Number(d.role_policy_changes) * 16 + Math.log10(Number(d.phi_access_events) + 1) * 8));
    return {
      ...d,
      drift_score: score,
      status: score >= 75 ? 'retrain_now' : score >= 50 ? 'targeted_refresh' : 'current',
      module: score >= 75 ? 'minimum necessary plus role scenarios' : 'role-specific PHI refresher',
    };
  });
}

async function loadDepartments() {
  // PHI access events per department (audit log entries attributed to members).
  const access = await pool.query(
    `SELECT d.id, d.name, COUNT(al.id)::int AS phi_access_events
     FROM departments d
     LEFT JOIN employees e ON e.department_id = d.id
     LEFT JOIN audit_logs al ON al.user_email = e.email
     GROUP BY d.id, d.name
     ORDER BY d.name`
  );

  // Days since the most recent completed training in each department.
  const recency = await pool.query(
    `SELECT e.department_id,
            MAX(tr.completed_at) AS last_completed_at
     FROM employees e
     JOIN training_records tr ON tr.employee_id = e.id AND tr.status = 'completed'
     GROUP BY e.department_id`
  );
  const recencyByDept = new Map(recency.rows.map((r) => [r.department_id, r.last_completed_at]));

  // Policy changes in the last 12 months (organization-wide signal applied to
  // every department, since role policies are shared).
  const policyChanges = await pool.query(
    `SELECT COUNT(*)::int AS c FROM policies WHERE created_at > NOW() - INTERVAL '12 months'`
  );
  const orgPolicyChanges = policyChanges.rows[0]?.c ?? 0;

  return access.rows.map((row) => {
    const last = recencyByDept.get(row.id);
    const trainingDaysOld = last
      ? Math.max(0, Math.round((Date.now() - new Date(last).getTime()) / 86400000))
      : 365; // no completed training on record: worst-case drift
    return {
      name: row.name,
      phi_access_events: row.phi_access_events,
      training_days_old: trainingDaysOld,
      role_policy_changes: orgPolicyChanges,
    };
  });
}

router.get('/', authenticateToken, async (req, res) => {
  try {
    res.json({ departments: scoreDepartments(await loadDepartments()) });
  } catch (err) {
    console.error('GET /minimum-necessary-training-drift error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Explicit-override path: callers may supply their own department inputs.
router.post('/assess', authenticateToken, async (req, res) => {
  try {
    const departments = Array.isArray(req.body?.departments) ? req.body.departments : await loadDepartments();
    res.json({ departments: scoreDepartments(departments) });
  } catch (err) {
    console.error('POST /minimum-necessary-training-drift/assess error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
