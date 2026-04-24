import express from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET all documents (with optional search)
router.get('/', authenticateToken, async (req, res) => {
  const { search } = req.query;
  try {
    let query = 'SELECT * FROM documents';
    const params = [];

    if (search) {
      query += `
        WHERE title ILIKE $1
          OR category ILIKE $1
          OR description ILIKE $1
          OR file_type ILIKE $1
          OR status ILIKE $1
          OR uploaded_by ILIKE $1
          OR tags ILIKE $1
      `;
      params.push(`%${search}%`);
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('GET /documents error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET document by id
router.get('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM documents WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('GET /documents/:id error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST create document
router.post('/', authenticateToken, async (req, res) => {
  const {
    title,
    category,
    description,
    file_type,
    version,
    status,
    uploaded_by,
    upload_date,
    review_date,
    tags,
  } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'title is required.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO documents
        (title, category, description, file_type, version, status,
         uploaded_by, upload_date, review_date, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        title,
        category || null,
        description || null,
        file_type || null,
        version || null,
        status || 'active',
        uploaded_by || null,
        upload_date || null,
        review_date || null,
        tags || null,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('POST /documents error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT update document
router.put('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const {
    title,
    category,
    description,
    file_type,
    version,
    status,
    uploaded_by,
    upload_date,
    review_date,
    tags,
  } = req.body;

  try {
    const existing = await pool.query('SELECT id FROM documents WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    const result = await pool.query(
      `UPDATE documents SET
        title = COALESCE($1, title),
        category = COALESCE($2, category),
        description = COALESCE($3, description),
        file_type = COALESCE($4, file_type),
        version = COALESCE($5, version),
        status = COALESCE($6, status),
        uploaded_by = COALESCE($7, uploaded_by),
        upload_date = COALESCE($8, upload_date),
        review_date = COALESCE($9, review_date),
        tags = COALESCE($10, tags)
       WHERE id = $11
       RETURNING *`,
      [
        title,
        category,
        description,
        file_type,
        version,
        status,
        uploaded_by,
        upload_date,
        review_date,
        tags,
        id,
      ]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('PUT /documents/:id error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE document
router.delete('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM documents WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found.' });
    }
    res.json({ message: 'Document deleted.', id: result.rows[0].id });
  } catch (err) {
    console.error('DELETE /documents/:id error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
