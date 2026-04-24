import express from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET all compliance deadlines (with optional search)
router.get('/', authenticateToken, async (req, res) => {
  const { search } = req.query;
  try {
    let query = 'SELECT * FROM compliance_deadlines';
    const params = [];

    if (search) {
      query += `
        WHERE title ILIKE $1
          OR category ILIKE $1
          OR assigned_to ILIKE $1
          OR status ILIKE $1
          OR priority ILIKE $1
          OR notes ILIKE $1
      `;
      params.push(`%${search}%`);
    }

    query += ' ORDER BY due_date ASC, created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('GET /deadlines error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET compliance deadline by id
router.get('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM compliance_deadlines WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Compliance deadline not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('GET /deadlines/:id error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST create compliance deadline
router.post('/', authenticateToken, async (req, res) => {
  const {
    title,
    description,
    category,
    due_date,
    assigned_to,
    status,
    priority,
    reminder_date,
    notes,
  } = req.body;

  if (!title || !due_date) {
    return res.status(400).json({ error: 'title and due_date are required.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO compliance_deadlines
        (title, description, category, due_date, assigned_to, status, priority, reminder_date, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        title,
        description || null,
        category || null,
        due_date,
        assigned_to || null,
        status || 'pending',
        priority || 'medium',
        reminder_date || null,
        notes || null,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('POST /deadlines error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT update compliance deadline
router.put('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const {
    title,
    description,
    category,
    due_date,
    assigned_to,
    status,
    priority,
    reminder_date,
    notes,
  } = req.body;

  try {
    const existing = await pool.query('SELECT id FROM compliance_deadlines WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Compliance deadline not found.' });
    }

    const result = await pool.query(
      `UPDATE compliance_deadlines SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        category = COALESCE($3, category),
        due_date = COALESCE($4, due_date),
        assigned_to = COALESCE($5, assigned_to),
        status = COALESCE($6, status),
        priority = COALESCE($7, priority),
        reminder_date = COALESCE($8, reminder_date),
        notes = COALESCE($9, notes)
       WHERE id = $10
       RETURNING *`,
      [
        title,
        description,
        category,
        due_date,
        assigned_to,
        status,
        priority,
        reminder_date,
        notes,
        id,
      ]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('PUT /deadlines/:id error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE compliance deadline
router.delete('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM compliance_deadlines WHERE id = $1 RETURNING id',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Compliance deadline not found.' });
    }
    res.json({ message: 'Compliance deadline deleted.', id: result.rows[0].id });
  } catch (err) {
    console.error('DELETE /deadlines/:id error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
