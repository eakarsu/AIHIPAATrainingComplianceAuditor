import express from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /incidents - Get all incident reports with optional search
router.get('/', authenticateToken, async (req, res) => {
  const { search } = req.query;

  try {
    let query = 'SELECT * FROM incident_reports';
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      query += ' WHERE title ILIKE $1 OR incident_type ILIKE $1 OR reported_by ILIKE $1';
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching incidents:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /incidents/:id - Get a single incident report by ID
router.get('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('SELECT * FROM incident_reports WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Incident report not found.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching incident:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /incidents - Create a new incident report
router.post('/', authenticateToken, async (req, res) => {
  const {
    title,
    incident_type,
    severity,
    description,
    reported_by,
    reported_date,
    status,
    affected_individuals,
    phi_involved,
    resolution,
    resolved_date,
  } = req.body;

  if (!title || !incident_type || !reported_by || !reported_date) {
    return res.status(400).json({
      error: 'title, incident_type, reported_by, and reported_date are required.',
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO incident_reports
        (title, incident_type, severity, description, reported_by, reported_date, status,
         affected_individuals, phi_involved, resolution, resolved_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        title,
        incident_type,
        severity || 'medium',
        description || null,
        reported_by,
        reported_date,
        status || 'open',
        affected_individuals !== undefined ? affected_individuals : 0,
        phi_involved !== undefined ? phi_involved : false,
        resolution || null,
        resolved_date || null,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating incident:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /incidents/:id - Update an incident report
router.put('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const {
    title,
    incident_type,
    severity,
    description,
    reported_by,
    reported_date,
    status,
    affected_individuals,
    phi_involved,
    resolution,
    resolved_date,
  } = req.body;

  try {
    const existing = await pool.query('SELECT id FROM incident_reports WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Incident report not found.' });
    }

    const result = await pool.query(
      `UPDATE incident_reports SET
        title = COALESCE($1, title),
        incident_type = COALESCE($2, incident_type),
        severity = COALESCE($3, severity),
        description = COALESCE($4, description),
        reported_by = COALESCE($5, reported_by),
        reported_date = COALESCE($6, reported_date),
        status = COALESCE($7, status),
        affected_individuals = COALESCE($8, affected_individuals),
        phi_involved = COALESCE($9, phi_involved),
        resolution = COALESCE($10, resolution),
        resolved_date = COALESCE($11, resolved_date)
       WHERE id = $12
       RETURNING *`,
      [
        title,
        incident_type,
        severity,
        description,
        reported_by,
        reported_date,
        status,
        affected_individuals,
        phi_involved,
        resolution,
        resolved_date,
        id,
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating incident:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /incidents/:id - Delete an incident report
router.delete('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM incident_reports WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Incident report not found.' });
    }

    res.json({ message: 'Incident report deleted successfully.', id: result.rows[0].id });
  } catch (err) {
    console.error('Error deleting incident:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
