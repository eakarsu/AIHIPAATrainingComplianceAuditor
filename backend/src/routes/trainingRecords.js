import express from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET all training records (with optional search), JOIN employees and training_courses
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { search } = req.query;
    let query = `
      SELECT
        tr.id,
        tr.employee_id,
        e.first_name || ' ' || e.last_name AS employee_name,
        tr.course_id,
        tc.title AS course_title,
        tr.status,
        tr.score,
        tr.started_at,
        tr.completed_at,
        tr.expires_at,
        tr.created_at
      FROM training_records tr
      LEFT JOIN employees e ON tr.employee_id = e.id
      LEFT JOIN training_courses tc ON tr.course_id = tc.id
    `;
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      query += `
        WHERE
          e.first_name ILIKE $1 OR
          e.last_name ILIKE $1 OR
          tc.title ILIKE $1 OR
          tr.status ILIKE $1
      `;
    }

    query += ' ORDER BY tr.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('GET /training-records error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET training record by id
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT
        tr.id,
        tr.employee_id,
        e.first_name || ' ' || e.last_name AS employee_name,
        tr.course_id,
        tc.title AS course_title,
        tr.status,
        tr.score,
        tr.started_at,
        tr.completed_at,
        tr.expires_at,
        tr.created_at
      FROM training_records tr
      LEFT JOIN employees e ON tr.employee_id = e.id
      LEFT JOIN training_courses tc ON tr.course_id = tc.id
      WHERE tr.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Training record not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('GET /training-records/:id error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST create training record
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      employee_id,
      course_id,
      status,
      score,
      started_at,
      completed_at,
      expires_at,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO training_records
        (employee_id, course_id, status, score, started_at, completed_at, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        employee_id,
        course_id,
        status ?? 'not_started',
        score ?? null,
        started_at ?? null,
        completed_at ?? null,
        expires_at ?? null,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('POST /training-records error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT update training record
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      employee_id,
      course_id,
      status,
      score,
      started_at,
      completed_at,
      expires_at,
    } = req.body;

    const result = await pool.query(
      `UPDATE training_records SET
        employee_id = COALESCE($1, employee_id),
        course_id = COALESCE($2, course_id),
        status = COALESCE($3, status),
        score = COALESCE($4, score),
        started_at = COALESCE($5, started_at),
        completed_at = COALESCE($6, completed_at),
        expires_at = COALESCE($7, expires_at)
       WHERE id = $8
       RETURNING *`,
      [employee_id ?? null, course_id ?? null, status || null, score ?? null, started_at || null, completed_at || null, expires_at || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Training record not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('PUT /training-records/:id error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE training record
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM training_records WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Training record not found' });
    }

    res.json({ message: 'Training record deleted successfully', id: result.rows[0].id });
  } catch (err) {
    console.error('DELETE /training-records/:id error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
