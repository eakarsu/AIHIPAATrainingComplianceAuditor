import express from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /baas - Get all business associate agreements with optional search
router.get('/', authenticateToken, async (req, res) => {
  const { search } = req.query;

  try {
    let query = 'SELECT * FROM business_associate_agreements';
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      query += ' WHERE associate_name ILIKE $1 OR contact_email ILIKE $1 OR agreement_type ILIKE $1';
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching BAAs:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /baas/:id - Get a single business associate agreement by ID
router.get('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'SELECT * FROM business_associate_agreements WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Business associate agreement not found.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching BAA:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /baas - Create a new business associate agreement
router.post('/', authenticateToken, async (req, res) => {
  const {
    associate_name,
    contact_email,
    agreement_type,
    status,
    effective_date,
    expiration_date,
    phi_access_level,
    last_audit_date,
    compliance_status,
    notes,
  } = req.body;

  if (!associate_name || !contact_email || !agreement_type) {
    return res.status(400).json({
      error: 'associate_name, contact_email, and agreement_type are required.',
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO business_associate_agreements
        (associate_name, contact_email, agreement_type, status, effective_date, expiration_date,
         phi_access_level, last_audit_date, compliance_status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        associate_name,
        contact_email,
        agreement_type,
        status || 'active',
        effective_date || null,
        expiration_date || null,
        phi_access_level || null,
        last_audit_date || null,
        compliance_status || 'compliant',
        notes || null,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating BAA:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /baas/:id - Update a business associate agreement
router.put('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const {
    associate_name,
    contact_email,
    agreement_type,
    status,
    effective_date,
    expiration_date,
    phi_access_level,
    last_audit_date,
    compliance_status,
    notes,
  } = req.body;

  try {
    const existing = await pool.query(
      'SELECT id FROM business_associate_agreements WHERE id = $1',
      [id]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Business associate agreement not found.' });
    }

    const result = await pool.query(
      `UPDATE business_associate_agreements SET
        associate_name = COALESCE($1, associate_name),
        contact_email = COALESCE($2, contact_email),
        agreement_type = COALESCE($3, agreement_type),
        status = COALESCE($4, status),
        effective_date = COALESCE($5, effective_date),
        expiration_date = COALESCE($6, expiration_date),
        phi_access_level = COALESCE($7, phi_access_level),
        last_audit_date = COALESCE($8, last_audit_date),
        compliance_status = COALESCE($9, compliance_status),
        notes = COALESCE($10, notes)
       WHERE id = $11
       RETURNING *`,
      [
        associate_name,
        contact_email,
        agreement_type,
        status,
        effective_date,
        expiration_date,
        phi_access_level,
        last_audit_date,
        compliance_status,
        notes,
        id,
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating BAA:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /baas/:id - Delete a business associate agreement
router.delete('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM business_associate_agreements WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Business associate agreement not found.' });
    }

    res.json({ message: 'Business associate agreement deleted successfully.', id: result.rows[0].id });
  } catch (err) {
    console.error('Error deleting BAA:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
