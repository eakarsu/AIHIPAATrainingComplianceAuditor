import express from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET all access control records (with optional search)
router.get('/', authenticateToken, async (req, res) => {
  const { search } = req.query;
  try {
    let query = 'SELECT * FROM access_control';
    const params = [];

    if (search) {
      query += `
        WHERE employee_name ILIKE $1
          OR system_name ILIKE $1
          OR access_level ILIKE $1
          OR status ILIKE $1
          OR approved_by ILIKE $1
          OR justification ILIKE $1
      `;
      params.push(`%${search}%`);
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('GET /access-control error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET access control record by id
router.get('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM access_control WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Access control record not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('GET /access-control/:id error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST create access control record
router.post('/', authenticateToken, async (req, res) => {
  const {
    employee_name,
    system_name,
    access_level,
    phi_access,
    granted_date,
    last_review_date,
    status,
    approved_by,
    justification,
    expiration_date,
  } = req.body;

  if (!employee_name || !system_name) {
    return res.status(400).json({ error: 'employee_name and system_name are required.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO access_control
        (employee_name, system_name, access_level, phi_access, granted_date,
         last_review_date, status, approved_by, justification, expiration_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        employee_name,
        system_name,
        access_level || null,
        phi_access !== undefined ? phi_access : false,
        granted_date || null,
        last_review_date || null,
        status || 'active',
        approved_by || null,
        justification || null,
        expiration_date || null,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('POST /access-control error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT update access control record
router.put('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const {
    employee_name,
    system_name,
    access_level,
    phi_access,
    granted_date,
    last_review_date,
    status,
    approved_by,
    justification,
    expiration_date,
  } = req.body;

  try {
    const existing = await pool.query('SELECT id FROM access_control WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Access control record not found.' });
    }

    const result = await pool.query(
      `UPDATE access_control SET
        employee_name = COALESCE($1, employee_name),
        system_name = COALESCE($2, system_name),
        access_level = COALESCE($3, access_level),
        phi_access = COALESCE($4, phi_access),
        granted_date = COALESCE($5, granted_date),
        last_review_date = COALESCE($6, last_review_date),
        status = COALESCE($7, status),
        approved_by = COALESCE($8, approved_by),
        justification = COALESCE($9, justification),
        expiration_date = COALESCE($10, expiration_date)
       WHERE id = $11
       RETURNING *`,
      [
        employee_name,
        system_name,
        access_level,
        phi_access,
        granted_date,
        last_review_date,
        status,
        approved_by,
        justification,
        expiration_date,
        id,
      ]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('PUT /access-control/:id error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE access control record
router.delete('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM access_control WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Access control record not found.' });
    }
    res.json({ message: 'Access control record deleted.', id: result.rows[0].id });
  } catch (err) {
    console.error('DELETE /access-control/:id error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
