import express from 'express';

const router = express.Router();

function assess(input = {}) {
  const departments = input.departments || [
    { name: 'Billing', phi_access_events: 420, training_days_old: 312, role_policy_changes: 3 },
    { name: 'Nursing', phi_access_events: 930, training_days_old: 74, role_policy_changes: 1 },
    { name: 'Front Desk', phi_access_events: 260, training_days_old: 221, role_policy_changes: 2 },
  ];
  return {
    departments: departments.map((d) => {
      const score = Math.min(100, Math.round(Number(d.training_days_old) * 0.18 + Number(d.role_policy_changes) * 16 + Math.log10(Number(d.phi_access_events) + 1) * 8));
      return {
        ...d,
        drift_score: score,
        status: score >= 75 ? 'retrain_now' : score >= 50 ? 'targeted_refresh' : 'current',
        module: score >= 75 ? 'minimum necessary plus role scenarios' : 'role-specific PHI refresher',
      };
    }),
  };
}

router.get('/', (req, res) => res.json(assess()));
router.post('/assess', (req, res) => res.json(assess(req.body || {})));

export default router;
