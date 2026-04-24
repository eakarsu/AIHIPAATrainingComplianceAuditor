import express from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET all sanctions (with optional search)
router.get('/', authenticateToken, async (req, res) => {
  const { search } = req.query;
  try {
    let query = 'SELECT * FROM sanctions';
    const params = [];

    if (search) {
      query += `
        WHERE employee_name ILIKE $1
          OR violation_type ILIKE $1
          OR description ILIKE $1
          OR severity ILIKE $1
          OR sanction_type ILIKE $1
          OR status ILIKE $1
          OR imposed_by ILIKE $1
      `;
      params.push(`%${search}%`);
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('GET /sanctions error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET sanction by id
router.get('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM sanctions WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sanction not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('GET /sanctions/:id error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST create sanction
router.post('/', authenticateToken, async (req, res) => {
  const {
    employee_name,
    violation_type,
    description,
    severity,
    sanction_type,
    sanction_date,
    status,
    corrective_action,
    follow_up_date,
    imposed_by,
  } = req.body;

  if (!employee_name || !violation_type || !sanction_type) {
    return res.status(400).json({ error: 'employee_name, violation_type, and sanction_type are required.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO sanctions
        (employee_name, violation_type, description, severity, sanction_type,
         sanction_date, status, corrective_action, follow_up_date, imposed_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        employee_name,
        violation_type,
        description || null,
        severity || 'minor',
        sanction_type,
        sanction_date || null,
        status || 'active',
        corrective_action || null,
        follow_up_date || null,
        imposed_by || null,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('POST /sanctions error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT update sanction
router.put('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const {
    employee_name,
    violation_type,
    description,
    severity,
    sanction_type,
    sanction_date,
    status,
    corrective_action,
    follow_up_date,
    imposed_by,
  } = req.body;

  try {
    const existing = await pool.query('SELECT id FROM sanctions WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Sanction not found.' });
    }

    const result = await pool.query(
      `UPDATE sanctions SET
        employee_name = COALESCE($1, employee_name),
        violation_type = COALESCE($2, violation_type),
        description = COALESCE($3, description),
        severity = COALESCE($4, severity),
        sanction_type = COALESCE($5, sanction_type),
        sanction_date = COALESCE($6, sanction_date),
        status = COALESCE($7, status),
        corrective_action = COALESCE($8, corrective_action),
        follow_up_date = COALESCE($9, follow_up_date),
        imposed_by = COALESCE($10, imposed_by)
       WHERE id = $11
       RETURNING *`,
      [
        employee_name,
        violation_type,
        description,
        severity,
        sanction_type,
        sanction_date,
        status,
        corrective_action,
        follow_up_date,
        imposed_by,
        id,
      ]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('PUT /sanctions/:id error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE sanction
router.delete('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM sanctions WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sanction not found.' });
    }
    res.json({ message: 'Sanction deleted.', id: result.rows[0].id });
  } catch (err) {
    console.error('DELETE /sanctions/:id error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
