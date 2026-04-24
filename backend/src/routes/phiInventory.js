import express from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET all PHI inventory entries (with optional search)
router.get('/', authenticateToken, async (req, res) => {
  const { search } = req.query;
  try {
    let query = `
      SELECT * FROM phi_inventory
    `;
    const params = [];

    if (search) {
      query += `
        WHERE data_type ILIKE $1
          OR storage_location ILIKE $1
          OR system_name ILIKE $1
          OR access_level ILIKE $1
          OR notes ILIKE $1
      `;
      params.push(`%${search}%`);
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('GET /phi-inventory error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET PHI inventory entry by id
router.get('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM phi_inventory WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'PHI inventory entry not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('GET /phi-inventory/:id error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST create PHI inventory entry
router.post('/', authenticateToken, async (req, res) => {
  const {
    data_type,
    storage_location,
    system_name,
    department_id,
    encryption_status,
    access_level,
    retention_period,
    last_audit_date,
    risk_level,
    notes,
  } = req.body;

  if (!data_type || !storage_location || !system_name) {
    return res.status(400).json({ error: 'data_type, storage_location, and system_name are required.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO phi_inventory
        (data_type, storage_location, system_name, department_id, encryption_status,
         access_level, retention_period, last_audit_date, risk_level, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        data_type,
        storage_location,
        system_name,
        department_id || null,
        encryption_status || 'encrypted',
        access_level || null,
        retention_period || null,
        last_audit_date || null,
        risk_level || 'medium',
        notes || null,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('POST /phi-inventory error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT update PHI inventory entry
router.put('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const {
    data_type,
    storage_location,
    system_name,
    department_id,
    encryption_status,
    access_level,
    retention_period,
    last_audit_date,
    risk_level,
    notes,
  } = req.body;

  try {
    const existing = await pool.query('SELECT id FROM phi_inventory WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'PHI inventory entry not found.' });
    }

    const result = await pool.query(
      `UPDATE phi_inventory SET
        data_type = COALESCE($1, data_type),
        storage_location = COALESCE($2, storage_location),
        system_name = COALESCE($3, system_name),
        department_id = COALESCE($4, department_id),
        encryption_status = COALESCE($5, encryption_status),
        access_level = COALESCE($6, access_level),
        retention_period = COALESCE($7, retention_period),
        last_audit_date = COALESCE($8, last_audit_date),
        risk_level = COALESCE($9, risk_level),
        notes = COALESCE($10, notes)
       WHERE id = $11
       RETURNING *`,
      [
        data_type,
        storage_location,
        system_name,
        department_id,
        encryption_status,
        access_level,
        retention_period,
        last_audit_date,
        risk_level,
        notes,
        id,
      ]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('PUT /phi-inventory/:id error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE PHI inventory entry
router.delete('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM phi_inventory WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'PHI inventory entry not found.' });
    }
    res.json({ message: 'PHI inventory entry deleted.', id: result.rows[0].id });
  } catch (err) {
    console.error('DELETE /phi-inventory/:id error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
