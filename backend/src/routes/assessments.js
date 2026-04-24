import express from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /assessments - Get all compliance assessments with optional search
router.get('/', authenticateToken, async (req, res) => {
  const { search } = req.query;

  try {
    let query = `
      SELECT
        ca.id,
        ca.title,
        ca.department_id,
        d.name AS department_name,
        ca.assessor_name,
        ca.assessment_date,
        ca.status,
        ca.score,
        ca.findings,
        ca.recommendations,
        ca.next_review_date,
        ca.created_at
      FROM compliance_assessments ca
      LEFT JOIN departments d ON ca.department_id = d.id
    `;
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      query += ` WHERE ca.title ILIKE $1 OR ca.assessor_name ILIKE $1 OR d.name ILIKE $1`;
    }

    query += ' ORDER BY ca.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching assessments:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /assessments/:id - Get a single compliance assessment by ID
router.get('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT
        ca.id,
        ca.title,
        ca.department_id,
        d.name AS department_name,
        ca.assessor_name,
        ca.assessment_date,
        ca.status,
        ca.score,
        ca.findings,
        ca.recommendations,
        ca.next_review_date,
        ca.created_at
      FROM compliance_assessments ca
      LEFT JOIN departments d ON ca.department_id = d.id
      WHERE ca.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Assessment not found.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching assessment:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /assessments - Create a new compliance assessment
router.post('/', authenticateToken, async (req, res) => {
  const {
    title,
    department_id,
    assessor_name,
    assessment_date,
    status,
    score,
    findings,
    recommendations,
    next_review_date,
  } = req.body;

  if (!title || !assessor_name || !assessment_date) {
    return res.status(400).json({ error: 'title, assessor_name, and assessment_date are required.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO compliance_assessments
        (title, department_id, assessor_name, assessment_date, status, score, findings, recommendations, next_review_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        title,
        department_id || null,
        assessor_name,
        assessment_date,
        status || 'pending',
        score || null,
        findings || null,
        recommendations || null,
        next_review_date || null,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating assessment:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /assessments/:id - Update a compliance assessment
router.put('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const {
    title,
    department_id,
    assessor_name,
    assessment_date,
    status,
    score,
    findings,
    recommendations,
    next_review_date,
  } = req.body;

  try {
    const existing = await pool.query('SELECT id FROM compliance_assessments WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Assessment not found.' });
    }

    const result = await pool.query(
      `UPDATE compliance_assessments SET
        title = COALESCE($1, title),
        department_id = COALESCE($2, department_id),
        assessor_name = COALESCE($3, assessor_name),
        assessment_date = COALESCE($4, assessment_date),
        status = COALESCE($5, status),
        score = COALESCE($6, score),
        findings = COALESCE($7, findings),
        recommendations = COALESCE($8, recommendations),
        next_review_date = COALESCE($9, next_review_date)
       WHERE id = $10
       RETURNING *`,
      [
        title,
        department_id,
        assessor_name,
        assessment_date,
        status,
        score,
        findings,
        recommendations,
        next_review_date,
        id,
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating assessment:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /assessments/:id - Delete a compliance assessment
router.delete('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM compliance_assessments WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Assessment not found.' });
    }

    res.json({ message: 'Assessment deleted successfully.', id: result.rows[0].id });
  } catch (err) {
    console.error('Error deleting assessment:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
