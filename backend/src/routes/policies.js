import express from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /policies - Get all policies with optional search
router.get('/', authenticateToken, async (req, res) => {
  const { search } = req.query;

  try {
    let query = 'SELECT * FROM policies';
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      query += ' WHERE title ILIKE $1 OR category ILIKE $1 OR approved_by ILIKE $1';
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching policies:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /policies/:id - Get a single policy by ID
router.get('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('SELECT * FROM policies WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Policy not found.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching policy:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /policies - Create a new policy
router.post('/', authenticateToken, async (req, res) => {
  const {
    title,
    category,
    description,
    content,
    version,
    status,
    effective_date,
    review_date,
    approved_by,
  } = req.body;

  if (!title || !category) {
    return res.status(400).json({ error: 'title and category are required.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO policies
        (title, category, description, content, version, status, effective_date, review_date, approved_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        title,
        category,
        description || null,
        content || null,
        version || null,
        status || 'draft',
        effective_date || null,
        review_date || null,
        approved_by || null,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating policy:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /policies/:id - Update a policy
router.put('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const {
    title,
    category,
    description,
    content,
    version,
    status,
    effective_date,
    review_date,
    approved_by,
  } = req.body;

  try {
    const existing = await pool.query('SELECT id FROM policies WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Policy not found.' });
    }

    const result = await pool.query(
      `UPDATE policies SET
        title = COALESCE($1, title),
        category = COALESCE($2, category),
        description = COALESCE($3, description),
        content = COALESCE($4, content),
        version = COALESCE($5, version),
        status = COALESCE($6, status),
        effective_date = COALESCE($7, effective_date),
        review_date = COALESCE($8, review_date),
        approved_by = COALESCE($9, approved_by)
       WHERE id = $10
       RETURNING *`,
      [
        title,
        category,
        description,
        content,
        version,
        status,
        effective_date,
        review_date,
        approved_by,
        id,
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating policy:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /policies/:id - Delete a policy
router.delete('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM policies WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Policy not found.' });
    }

    res.json({ message: 'Policy deleted successfully.', id: result.rows[0].id });
  } catch (err) {
    console.error('Error deleting policy:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
