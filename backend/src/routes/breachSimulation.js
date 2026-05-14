// Breach simulation gamified exercises scoring incident response.
// Audit: batch_04.md / AIHIPAATrainingComplianceAuditor / Custom Feature Suggestions #2
import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { aiChat } from '../services/openrouter.js';
import db from '../db.js';

const router = express.Router();
router.use(authenticateToken);

function parseJSON(t) { try { const m = t.match(/\{[\s\S]*\}/); if (m) return JSON.parse(m[0]); } catch (_) {} return { notes: t }; }

// POST /api/breach-simulation/run
// Body: { difficulty?, focus?: 'ransomware'|'insider'|'vendor'|'phishing', team_size? }
router.post('/run', async (req, res) => {
  try {
    const { difficulty = 'medium', focus = 'phishing', team_size = 5 } = req.body || {};

    const systemPrompt = `You are a HIPAA tabletop exercise facilitator. Design a realistic breach scenario
focused on the requested vector, with branching decision points and a scoring rubric tied to HIPAA Breach
Notification Rule timing and Security Rule controls. Return STRICT JSON only.`;

    const userPrompt = `Difficulty: ${difficulty}
Focus vector: ${focus}
Team size: ${team_size}

Return JSON:
{
  "scenario_title": "string",
  "narrative": "string (3-4 paragraphs)",
  "decision_points": [
    {
      "step": 1,
      "prompt": "string",
      "options": [
        { "id": "A", "text": "string", "score_delta": 0, "consequence": "string" }
      ],
      "best_option_id": "A",
      "rationale": "string"
    }
  ],
  "scoring_rubric": [{ "criterion": "string", "max_points": 0, "phi_rule_reference": "string" }],
  "max_total_score": 0,
  "post_exercise_debrief_questions": ["..."],
  "disclaimer": "Tabletop only; not a substitute for live incident response drills."
}`;

    const raw = await aiChat(systemPrompt, userPrompt);
    const parsed = parseJSON(raw);

    try {
      await db.query(`CREATE TABLE IF NOT EXISTS breach_simulation_runs (
        id SERIAL PRIMARY KEY, user_id INTEGER, difficulty TEXT, focus TEXT,
        scenario JSONB, score INT, created_at TIMESTAMPTZ DEFAULT NOW()
      )`);
      await db.query(
        `INSERT INTO breach_simulation_runs (user_id, difficulty, focus, scenario) VALUES ($1,$2,$3,$4)`,
        [req.user.id, difficulty, focus, JSON.stringify(parsed)]
      );
    } catch (_) {}

    res.json({ difficulty, focus, scenario: parsed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/breach-simulation/:id/score { responses: [{step, option_id}], score }
router.post('/:id/score', async (req, res) => {
  try {
    const { responses = [], score } = req.body || {};
    await db.query(
      `UPDATE breach_simulation_runs SET score = $1
       WHERE id = $2 AND user_id = $3`,
      [score || 0, req.params.id, req.user.id]
    ).catch(() => {});
    res.json({ id: req.params.id, score, response_count: responses.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/breach-simulation/history
router.get('/history', async (req, res) => {
  try {
    const r = await db.query(
      `SELECT id, difficulty, focus, score, created_at FROM breach_simulation_runs
       WHERE user_id = $1 ORDER BY created_at DESC LIMIT 30`,
      [req.user.id]
    ).catch(() => ({ rows: [] }));
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
