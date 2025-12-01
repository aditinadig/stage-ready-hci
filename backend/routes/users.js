import express from 'express';
import { db, generateId, getTimestamp, parseJsonArray, stringifyJsonArray } from '../database.js';

const router = express.Router();

// GET /api/users - Get all users (optionally filter by teamId)
router.get('/', (req, res) => {
  try {
    const { teamId, teamCode, userCode } = req.query;
    let query = 'SELECT * FROM users WHERE 1=1';
    const params = [];

    if (teamId) {
      query += ' AND teamId = ?';
      params.push(teamId);
    }
    if (teamCode) {
      query += ' AND teamCode = ?';
      params.push(teamCode);
    }
    if (userCode) {
      query += ' AND userCode = ?';
      params.push(userCode);
    }

    query += ' ORDER BY createdAt DESC';

    const users = db.prepare(query).all(...params);
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/users/:id - Get user by ID
router.get('/:id', (req, res) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/users/code/:teamCode/:userCode - Get user by team code and user code
router.get('/code/:teamCode/:userCode', (req, res) => {
  try {
    const { teamCode, userCode } = req.params;
    const user = db.prepare('SELECT * FROM users WHERE teamCode = ? AND userCode = ?')
      .get(teamCode, userCode);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/users - Create new user
router.post('/', (req, res) => {
  try {
    const { userCode, teamId, teamCode, name, role } = req.body;
    
    if (!userCode || !teamId || !teamCode || !name) {
      return res.status(400).json({ error: 'userCode, teamId, teamCode, and name are required' });
    }

    const id = generateId();
    const now = getTimestamp();

    db.prepare(`
      INSERT INTO users (id, userCode, teamId, teamCode, name, role, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, userCode, teamId, teamCode, name, role || 'member', now, now);

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    res.status(201).json(user);
  } catch (error) {
    if (error.message.includes('UNIQUE constraint')) {
      return res.status(409).json({ error: 'User code already exists for this team' });
    }
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/users/:id - Update user
router.put('/:id', (req, res) => {
  try {
    const { name, role } = req.body;
    const now = getTimestamp();

    const result = db.prepare(`
      UPDATE users 
      SET name = ?, role = ?, updatedAt = ?
      WHERE id = ?
    `).run(name || null, role || 'member', now, req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/users/:id - Delete user
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

