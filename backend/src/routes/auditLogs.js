import express from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET all audit logs (with optional filters: entity_type, action, date_from, date_to)
router.get('/', authenticateToken, async (req, res) => {
  const { entity_type, action, date_from, date_to } = req.query;
  try {
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (entity_type) {
      conditions.push(`entity_type = $${paramIndex++}`);
      params.push(entity_type);
    }

    if (action) {
      conditions.push(`action = $${paramIndex++}`);
      params.push(action);
    }

    if (date_from) {
      conditions.push(`created_at >= $${paramIndex++}`);
      params.push(date_from);
    }

    if (date_to) {
      conditions.push(`created_at <= $${paramIndex++}`);
      params.push(date_to);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await pool.query(
      `SELECT * FROM audit_logs ${whereClause} ORDER BY created_at DESC`,
      params
    );
    res.json(result.rows);
  } catch (err) {
    console.error('GET /audit-logs error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET audit log by id
router.get('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM audit_logs WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Audit log entry not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('GET /audit-logs/:id error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST create audit log entry
router.post('/', authenticateToken, async (req, res) => {
  const { action, entity_type, entity_id, user_email, details, ip_address } = req.body;

  if (!action || !entity_type) {
    return res.status(400).json({ error: 'action and entity_type are required.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO audit_logs
        (action, entity_type, entity_id, user_email, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        action,
        entity_type,
        entity_id || null,
        user_email || null,
        details || null,
        ip_address || null,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('POST /audit-logs error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
