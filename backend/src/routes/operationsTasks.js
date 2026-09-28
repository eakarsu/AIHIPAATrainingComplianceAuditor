// Operations desk tasks: durable follow-up items for the operations page.
import express from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken);

const PRIORITIES = ['Low', 'Medium', 'High'];
const STATUSES = ['Queued', 'Ready', 'In progress', 'Done'];

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, task, owner, priority, status, created_at FROM operations_tasks ORDER BY created_at DESC LIMIT 200'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('GET /operations-tasks error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.post('/', async (req, res) => {
  const { task, owner, priority, status } = req.body || {};
  if (!task || typeof task !== 'string' || !task.trim()) {
    return res.status(400).json({ error: 'task is required.' });
  }
  if (task.trim().length > 500) {
    return res.status(400).json({ error: 'task must be 500 characters or fewer.' });
  }
  const priorityValue = PRIORITIES.includes(priority) ? priority : 'Medium';
  const statusValue = STATUSES.includes(status) ? status : 'Queued';
  const ownerValue = typeof owner === 'string' && owner.trim() ? owner.trim().slice(0, 80) : (req.user?.email || 'User');

  try {
    const result = await pool.query(
      `INSERT INTO operations_tasks (task, owner, priority, status)
       VALUES ($1, $2, $3, $4) RETURNING id, task, owner, priority, status, created_at`,
      [task.trim(), ownerValue, priorityValue, statusValue]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('POST /operations-tasks error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.patch('/:id/status', async (req, res) => {
  const { status } = req.body || {};
  if (!STATUSES.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${STATUSES.join(', ')}.` });
  }
  try {
    const result = await pool.query(
      'UPDATE operations_tasks SET status = $1 WHERE id = $2 RETURNING id, task, owner, priority, status, created_at',
      [status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Task not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('PATCH /operations-tasks/:id/status error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
