import express from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET all departments (with optional search)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { search } = req.query;
    let query = 'SELECT * FROM departments';
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      query += ' WHERE name ILIKE $1 OR head_name ILIKE $1 OR risk_level ILIKE $1';
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('GET /departments error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET department by id
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM departments WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('GET /departments/:id error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST create department
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      name,
      head_name,
      employee_count,
      compliance_score,
      risk_level,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO departments (name, head_name, employee_count, compliance_score, risk_level)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        name,
        head_name,
        employee_count ?? 0,
        compliance_score ?? 0,
        risk_level ?? 'low',
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('POST /departments error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT update department
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      head_name,
      employee_count,
      compliance_score,
      risk_level,
    } = req.body;

    const result = await pool.query(
      `UPDATE departments SET
        name = COALESCE($1, name),
        head_name = COALESCE($2, head_name),
        employee_count = COALESCE($3, employee_count),
        compliance_score = COALESCE($4, compliance_score),
        risk_level = COALESCE($5, risk_level)
       WHERE id = $6
       RETURNING *`,
      [name || null, head_name || null, employee_count ?? null, compliance_score ?? null, risk_level || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('PUT /departments/:id error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE department
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM departments WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }

    res.json({ message: 'Department deleted successfully', id: result.rows[0].id });
  } catch (err) {
    console.error('DELETE /departments/:id error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
