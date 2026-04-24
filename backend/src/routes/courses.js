import express from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET all courses (with optional search)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { search } = req.query;
    let query = 'SELECT * FROM training_courses';
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      query += ' WHERE title ILIKE $1 OR description ILIKE $1 OR category ILIKE $1 OR status ILIKE $1';
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('GET /courses error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET course by id
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM training_courses WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('GET /courses/:id error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST create course
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      duration_hours,
      passing_score,
      is_mandatory,
      status,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO training_courses
        (title, description, category, duration_hours, passing_score, is_mandatory, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        title,
        description,
        category,
        duration_hours,
        passing_score ?? 80,
        is_mandatory ?? true,
        status ?? 'active',
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('POST /courses error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT update course
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      category,
      duration_hours,
      passing_score,
      is_mandatory,
      status,
    } = req.body;

    const result = await pool.query(
      `UPDATE training_courses SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        category = COALESCE($3, category),
        duration_hours = COALESCE($4, duration_hours),
        passing_score = COALESCE($5, passing_score),
        is_mandatory = COALESCE($6, is_mandatory),
        status = COALESCE($7, status)
       WHERE id = $8
       RETURNING *`,
      [title || null, description || null, category || null, duration_hours ?? null, passing_score ?? null, is_mandatory !== undefined ? is_mandatory : null, status || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('PUT /courses/:id error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE course
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM training_courses WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json({ message: 'Course deleted successfully', id: result.rows[0].id });
  } catch (err) {
    console.error('DELETE /courses/:id error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
