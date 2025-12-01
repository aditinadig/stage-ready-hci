import express from 'express';
import { db, generateId, getTimestamp, parseJsonArray, stringifyJsonArray } from '../database.js';

const router = express.Router();

// GET /api/sections - Get all sections (optionally filter by songId)
router.get('/', (req, res) => {
  try {
    const { songId } = req.query;
    let query = 'SELECT * FROM songSections WHERE 1=1';
    const params = [];

    if (songId) {
      query += ' AND songId = ?';
      params.push(songId);
    }

    query += ' ORDER BY orderIndex ASC';

    const sections = db.prepare(query).all(...params);
    res.json(sections);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/sections/:id - Get section by ID
router.get('/:id', (req, res) => {
  try {
    const section = db.prepare('SELECT * FROM songSections WHERE id = ?').get(req.params.id);
    if (!section) {
      return res.status(404).json({ error: 'Section not found' });
    }
    res.json(section);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/sections - Create new section
router.post('/', (req, res) => {
  try {
    const { songId, sectionType, sectionNumber, displayName, orderIndex } = req.body;
    
    if (!songId || !sectionType || !displayName || orderIndex === undefined) {
      return res.status(400).json({ error: 'songId, sectionType, displayName, and orderIndex are required' });
    }

    const id = generateId();
    const now = getTimestamp();

    db.prepare(`
      INSERT INTO songSections (id, songId, sectionType, sectionNumber, displayName, orderIndex, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, 
      songId, 
      sectionType, 
      sectionNumber || 1, 
      displayName, 
      orderIndex, 
      now, 
      now
    );

    const section = db.prepare('SELECT * FROM songSections WHERE id = ?').get(id);
    res.status(201).json(section);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/sections/:id - Update section
router.put('/:id', (req, res) => {
  try {
    const { sectionType, sectionNumber, displayName, orderIndex } = req.body;
    const now = getTimestamp();

    const result = db.prepare(`
      UPDATE songSections 
      SET sectionType = ?, sectionNumber = ?, displayName = ?, orderIndex = ?, updatedAt = ?
      WHERE id = ?
    `).run(
      sectionType || null, 
      sectionNumber || null, 
      displayName || null, 
      orderIndex !== undefined ? orderIndex : null, 
      now, 
      req.params.id
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Section not found' });
    }

    const section = db.prepare('SELECT * FROM songSections WHERE id = ?').get(req.params.id);
    res.json(section);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/sections/:id - Delete section
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM songSections WHERE id = ?').run(req.params.id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Section not found' });
    }

    res.json({ message: 'Section deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

