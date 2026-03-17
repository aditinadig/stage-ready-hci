import express from 'express';
import { db, generateId, getTimestamp } from '../database.js';

const router = express.Router();

// Shape a sections row for API responses.
// Returns both `name` (new) and `displayName` (backward-compat alias).
function shape(row) {
  if (!row) return null;
  return {
    ...row,
    displayName: row.name, // backward-compat alias used by frontend
  };
}

// GET /api/sections?songId=
router.get('/', (req, res) => {
  try {
    const { songId } = req.query;
    let query = 'SELECT * FROM sections WHERE 1=1';
    const params = [];

    if (songId) {
      query += ' AND songId = ?';
      params.push(songId);
    }

    query += ' ORDER BY orderIndex ASC';

    const rows = db.prepare(query).all(...params);
    res.json(rows.map(shape));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/sections/:id
router.get('/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM sections WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Section not found' });
    res.json(shape(row));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/sections
router.post('/', (req, res) => {
  try {
    // Accept either `name` or `displayName` from callers
    const { songId, name, displayName, sectionType, sectionNumber, orderIndex } = req.body;
    const resolvedName = name || displayName;

    if (!songId || !resolvedName || orderIndex === undefined) {
      return res.status(400).json({ error: 'songId, name (or displayName), and orderIndex are required' });
    }

    const id  = generateId();
    const now = getTimestamp();

    db.prepare(`
      INSERT INTO sections (id, songId, name, sectionType, sectionNumber, orderIndex, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, songId, resolvedName, sectionType || null, sectionNumber || 1, orderIndex, now, now);

    res.status(201).json(shape(db.prepare('SELECT * FROM sections WHERE id = ?').get(id)));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/sections/:id
router.put('/:id', (req, res) => {
  try {
    const { name, displayName, sectionType, sectionNumber, orderIndex } = req.body;
    const resolvedName = name || displayName;
    const now = getTimestamp();

    const result = db.prepare(`
      UPDATE sections
      SET name = ?, sectionType = ?, sectionNumber = ?, orderIndex = ?, updatedAt = ?
      WHERE id = ?
    `).run(
      resolvedName || null,
      sectionType  || null,
      sectionNumber || null,
      orderIndex !== undefined ? orderIndex : null,
      now,
      req.params.id
    );

    if (result.changes === 0) return res.status(404).json({ error: 'Section not found' });
    res.json(shape(db.prepare('SELECT * FROM sections WHERE id = ?').get(req.params.id)));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/sections/:id
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM sections WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Section not found' });
    res.json({ message: 'Section deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
