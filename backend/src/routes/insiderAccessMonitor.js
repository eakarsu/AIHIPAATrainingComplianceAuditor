// Real-time access monitoring flagging bulk downloads, cross-department access,
// off-hour usage.
// Audit: batch_04.md / AIHIPAATrainingComplianceAuditor / Custom Feature Suggestions #4
import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { aiChat } from '../services/openrouter.js';
import db from '../db.js';

const router = express.Router();
router.use(authenticateToken);

function parseJSON(t) { try { const m = t.match(/\{[\s\S]*\}/); if (m) return JSON.parse(m[0]); } catch (_) {} return { notes: t }; }

// POST /api/insider-access-monitor/scan { lookback_hours? }
router.post('/scan', async (req, res) => {
  try {
    const { lookback_hours = 24 } = req.body || {};

    let logs = { rows: [] };
    try {
      logs = await db.query(
        `SELECT * FROM audit_logs WHERE created_at > NOW() - ($1 || ' hours')::interval
         ORDER BY created_at DESC LIMIT 500`,
        [String(lookback_hours)]
      );
    } catch (_) {}

    // Pre-aggregate features for the LLM
    const counts = {};
    for (const log of logs.rows) {
      const k = `${log.user_email || 'unknown'}|${log.action}`;
      counts[k] = (counts[k] || 0) + 1;
    }
    const topAggregations = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30)
      .map(([k, v]) => ({ user_action: k, count: v }));

    const systemPrompt = `You are an insider-threat monitor for HIPAA-covered entities. Given audit logs, flag
suspicious patterns: bulk downloads, cross-department access, off-hour usage, unusual record-volume spikes.
Audit log actors are identified by the user_email column. Return STRICT JSON only.`;

    const userPrompt = `Lookback hours: ${lookback_hours}
Top user/action aggregations: ${JSON.stringify(topAggregations)}
Recent audit log sample: ${JSON.stringify(logs.rows.slice(0, 40))}

Return JSON:
{
  "summary": "...",
  "anomalies": [
    { "user_email": "string", "anomaly_type": "bulk_download|cross_dept|off_hour|volume_spike|unauthorized_role", "severity": "low|medium|high|critical", "evidence": "string", "recommended_action": "review|interview|temporary_suspend|full_investigation" }
  ],
  "baseline_health_score_0_100": 0,
  "next_review_in_hours": 0,
  "disclaimer": "Heuristic surveillance; corroborate with HR + security."
}`;

    const raw = await aiChat(systemPrompt, userPrompt);
    res.json({ lookback_hours, log_count: logs.rows.length, analysis: parseJSON(raw) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/recent-anomalies', async (_req, res) => {
  try {
    const r = await db.query(
      `SELECT id, user_email, action, entity_type AS resource, entity_id, severity, created_at
       FROM audit_logs
       WHERE severity IN ('high','critical') ORDER BY created_at DESC LIMIT 50`
    );
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
