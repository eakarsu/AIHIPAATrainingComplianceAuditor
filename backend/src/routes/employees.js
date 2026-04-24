import express from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET all employees (with optional search), JOIN departments for department_name
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { search } = req.query;
    let query = `
      SELECT
        e.id,
        e.first_name,
        e.last_name,
        e.email,
        e.department_id,
        d.name AS department_name,
        e.job_title,
        e.hire_date,
        e.training_status,
        e.hipaa_certified,
        e.certification_date,
        e.created_at
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
    `;
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      query += `
        WHERE
          e.first_name ILIKE $1 OR
          e.last_name ILIKE $1 OR
          e.email ILIKE $1 OR
          e.job_title ILIKE $1 OR
          d.name ILIKE $1
      `;
    }

    query += ' ORDER BY e.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('GET /employees error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET employee by id
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT
        e.id,
        e.first_name,
        e.last_name,
        e.email,
        e.department_id,
        d.name AS department_name,
        e.job_title,
        e.hire_date,
        e.training_status,
        e.hipaa_certified,
        e.certification_date,
        e.created_at
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE e.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('GET /employees/:id error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST create employee
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      email,
      department_id,
      job_title,
      hire_date,
      training_status,
      hipaa_certified,
      certification_date,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO employees
        (first_name, last_name, email, department_id, job_title, hire_date, training_status, hipaa_certified, certification_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        first_name,
        last_name,
        email,
        department_id,
        job_title,
        hire_date,
        training_status ?? 'pending',
        hipaa_certified ?? false,
        certification_date ?? null,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('POST /employees error:', err);
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT update employee
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      first_name,
      last_name,
      email,
      department_id,
      job_title,
      hire_date,
      training_status,
      hipaa_certified,
      certification_date,
    } = req.body;

    const result = await pool.query(
      `UPDATE employees SET
        first_name = COALESCE($1, first_name),
        last_name = COALESCE($2, last_name),
        email = COALESCE($3, email),
        department_id = COALESCE($4, department_id),
        job_title = COALESCE($5, job_title),
        hire_date = COALESCE($6, hire_date),
        training_status = COALESCE($7, training_status),
        hipaa_certified = COALESCE($8, hipaa_certified),
        certification_date = COALESCE($9, certification_date)
       WHERE id = $10
       RETURNING *`,
      [
        first_name || null,
        last_name || null,
        email || null,
        department_id ?? null,
        job_title || null,
        hire_date || null,
        training_status || null,
        hipaa_certified !== undefined ? hipaa_certified : null,
        certification_date || null,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('PUT /employees/:id error:', err);
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE employee
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM employees WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json({ message: 'Employee deleted successfully', id: result.rows[0].id });
  } catch (err) {
    console.error('DELETE /employees/:id error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
