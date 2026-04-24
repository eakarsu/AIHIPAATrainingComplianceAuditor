import express from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET all risk register entries (with optional search)
router.get('/', authenticateToken, async (req, res) => {
  const { search } = req.query;
  try {
    let query = 'SELECT * FROM risk_register';
    const params = [];

    if (search) {
      query += `
        WHERE title ILIKE $1
          OR category ILIKE $1
          OR description ILIKE $1
          OR owner ILIKE $1
          OR status ILIKE $1
          OR risk_level ILIKE $1
      `;
      params.push(`%${search}%`);
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('GET /risk-register error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET risk register entry by id
router.get('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM risk_register WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Risk register entry not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('GET /risk-register/:id error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST create risk register entry
router.post('/', authenticateToken, async (req, res) => {
  const {
    title,
    category,
    description,
    risk_level,
    likelihood,
    impact,
    risk_score,
    mitigation_plan,
    owner,
    status,
    identified_date,
    review_date,
  } = req.body;

  if (!title || !category) {
    return res.status(400).json({ error: 'title and category are required.' });
  }

  const computedScore =
    risk_score !== undefined
      ? risk_score
      : (likelihood || 3) * (impact || 3);

  try {
    const result = await pool.query(
      `INSERT INTO risk_register
        (title, category, description, risk_level, likelihood, impact, risk_score,
         mitigation_plan, owner, status, identified_date, review_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        title,
        category,
        description || null,
        risk_level || 'medium',
        likelihood || 3,
        impact || 3,
        computedScore,
        mitigation_plan || null,
        owner || null,
        status || 'open',
        identified_date || null,
        review_date || null,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('POST /risk-register error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT update risk register entry
router.put('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const {
    title,
    category,
    description,
    risk_level,
    likelihood,
    impact,
    risk_score,
    mitigation_plan,
    owner,
    status,
    identified_date,
    review_date,
  } = req.body;

  try {
    const existing = await pool.query('SELECT * FROM risk_register WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Risk register entry not found.' });
    }

    const current = existing.rows[0];
    const newLikelihood = likelihood !== undefined ? likelihood : current.likelihood;
    const newImpact = impact !== undefined ? impact : current.impact;
    const newScore = risk_score !== undefined ? risk_score : newLikelihood * newImpact;

    const result = await pool.query(
      `UPDATE risk_register SET
        title = COALESCE($1, title),
        category = COALESCE($2, category),
        description = COALESCE($3, description),
        risk_level = COALESCE($4, risk_level),
        likelihood = $5,
        impact = $6,
        risk_score = $7,
        mitigation_plan = COALESCE($8, mitigation_plan),
        owner = COALESCE($9, owner),
        status = COALESCE($10, status),
        identified_date = COALESCE($11, identified_date),
        review_date = COALESCE($12, review_date)
       WHERE id = $13
       RETURNING *`,
      [
        title,
        category,
        description,
        risk_level,
        newLikelihood,
        newImpact,
        newScore,
        mitigation_plan,
        owner,
        status,
        identified_date,
        review_date,
        id,
      ]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('PUT /risk-register/:id error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE risk register entry
router.delete('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM risk_register WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Risk register entry not found.' });
    }
    res.json({ message: 'Risk register entry deleted.', id: result.rows[0].id });
  } catch (err) {
    console.error('DELETE /risk-register/:id error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
