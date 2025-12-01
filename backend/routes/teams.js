import express from 'express';
import { db, generateId, getTimestamp, parseJsonArray, stringifyJsonArray } from '../database.js';

const router = express.Router();

// GET /api/teams - Get all teams
router.get('/', (req, res) => {
  try {
    const teams = db.prepare('SELECT * FROM teams ORDER BY createdAt DESC').all();
    res.json(teams);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/teams/:id - Get team by ID
router.get('/:id', (req, res) => {
  try {
    const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(req.params.id);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    res.json(team);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/teams/code/:teamCode - Get team by code
router.get('/code/:teamCode', (req, res) => {
  try {
    const team = db.prepare('SELECT * FROM teams WHERE teamCode = ?').get(req.params.teamCode);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    res.json(team);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/teams - Create new team
router.post('/', (req, res) => {
  try {
    const { teamCode, name, createdBy } = req.body;
    
    if (!teamCode) {
      return res.status(400).json({ error: 'teamCode is required' });
    }

    const id = generateId();
    const now = getTimestamp();

    db.prepare(`
      INSERT INTO teams (id, teamCode, name, createdAt, updatedAt, createdBy)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, teamCode, name || null, now, now, createdBy || null);

    const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(id);
    res.status(201).json(team);
  } catch (error) {
    if (error.message.includes('UNIQUE constraint')) {
      return res.status(409).json({ error: 'Team code already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/teams/:id - Update team
router.put('/:id', (req, res) => {
  try {
    const { name } = req.body;
    const now = getTimestamp();

    const result = db.prepare(`
      UPDATE teams 
      SET name = ?, updatedAt = ?
      WHERE id = ?
    `).run(name || null, now, req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(req.params.id);
    res.json(team);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/teams/:id - Delete team
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM teams WHERE id = ?').run(req.params.id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }

    res.json({ message: 'Team deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

