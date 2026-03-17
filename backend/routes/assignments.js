import express from 'express';
import { db, generateId, getTimestamp } from '../database.js';

const router = express.Router();

// GET /api/assignments?userId=&songId=&teamId=
router.get('/', (req, res) => {
  try {
    const { userId, songId, teamId } = req.query;
    let query = 'SELECT * FROM song_assignments WHERE 1=1';
    const params = [];

    if (userId) { query += ' AND userId = ?'; params.push(userId); }
    if (songId) { query += ' AND songId = ?'; params.push(songId); }
    if (teamId) { query += ' AND teamId = ?'; params.push(teamId); }

    query += ' ORDER BY createdAt DESC';

    res.json(db.prepare(query).all(...params));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/assignments/:id
router.get('/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM song_assignments WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Assignment not found' });
    res.json(row);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/assignments
router.post('/', (req, res) => {
  try {
    const { userId, songId, teamId, role } = req.body;

    if (!userId || !songId || !teamId) {
      return res.status(400).json({ error: 'userId, songId, and teamId are required' });
    }

    const id  = generateId();
    const now = getTimestamp();

    db.prepare(`
      INSERT OR IGNORE INTO song_assignments (id, userId, songId, teamId, role, createdAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, userId, songId, teamId, role || null, now);

    const row = db.prepare('SELECT * FROM song_assignments WHERE userId = ? AND songId = ?').get(userId, songId);
    res.status(201).json(row);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/assignments/:id  (update role)
router.put('/:id', (req, res) => {
  try {
    const { role } = req.body;
    const now = getTimestamp();

    // song_assignments has no updatedAt column; just update role
    const result = db.prepare('UPDATE song_assignments SET role = ? WHERE id = ?')
      .run(role || null, req.params.id);

    if (result.changes === 0) return res.status(404).json({ error: 'Assignment not found' });
    res.json(db.prepare('SELECT * FROM song_assignments WHERE id = ?').get(req.params.id));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/assignments/:id
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM song_assignments WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Assignment not found' });
    res.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
