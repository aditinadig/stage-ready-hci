import express from 'express';
import { db, generateId, getTimestamp, parseJsonArray, stringifyJsonArray } from '../database.js';

const router = express.Router();

// GET /api/lyrics - Get all lyrics (optionally filter by songId or sectionId)
router.get('/', (req, res) => {
  try {
    const { songId, sectionId } = req.query;
    let query = 'SELECT * FROM lyrics WHERE 1=1';
    const params = [];

    if (songId) {
      query += ' AND songId = ?';
      params.push(songId);
    }
    if (sectionId) {
      query += ' AND sectionId = ?';
      params.push(sectionId);
    }

    query += ' ORDER BY lineNumber ASC';

    const lyrics = db.prepare(query).all(...params);
    
    // Parse JSON arrays
    const parsedLyrics = lyrics.map(lyric => ({
      ...lyric,
      assignedUserIds: parseJsonArray(lyric.assignedUserIds)
    }));

    res.json(parsedLyrics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/lyrics/:id - Get lyric by ID
router.get('/:id', (req, res) => {
  try {
    const lyric = db.prepare('SELECT * FROM lyrics WHERE id = ?').get(req.params.id);
    if (!lyric) {
      return res.status(404).json({ error: 'Lyric not found' });
    }
    
    res.json({
      ...lyric,
      assignedUserIds: parseJsonArray(lyric.assignedUserIds)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/lyrics - Create new lyric line
router.post('/', (req, res) => {
  try {
    const { songId, sectionId, lineNumber, text, lineType, assignedUserIds, cueText, cueType } = req.body;
    
    if (!songId || !sectionId || lineNumber === undefined || !text) {
      return res.status(400).json({ error: 'songId, sectionId, lineNumber, and text are required' });
    }

    const id = generateId();
    const now = getTimestamp();

    db.prepare(`
      INSERT INTO lyrics (id, songId, sectionId, lineNumber, text, lineType, assignedUserIds, cueText, cueType, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, 
      songId, 
      sectionId, 
      lineNumber, 
      text, 
      lineType || 'context', 
      stringifyJsonArray(assignedUserIds || []), 
      cueText || null, 
      cueType || null, 
      now, 
      now
    );

    const lyric = db.prepare('SELECT * FROM lyrics WHERE id = ?').get(id);
    res.status(201).json({
      ...lyric,
      assignedUserIds: parseJsonArray(lyric.assignedUserIds)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/lyrics/:id - Update lyric
router.put('/:id', (req, res) => {
  try {
    const { text, lineType, assignedUserIds, cueText, cueType, lineNumber } = req.body;
    const now = getTimestamp();

    const updates = [];
    const params = [];

    if (text !== undefined) {
      updates.push('text = ?');
      params.push(text);
    }
    if (lineType !== undefined) {
      updates.push('lineType = ?');
      params.push(lineType);
    }
    if (assignedUserIds !== undefined) {
      updates.push('assignedUserIds = ?');
      params.push(stringifyJsonArray(assignedUserIds));
    }
    if (cueText !== undefined) {
      updates.push('cueText = ?');
      params.push(cueText);
    }
    if (cueType !== undefined) {
      updates.push('cueType = ?');
      params.push(cueType);
    }
    if (lineNumber !== undefined) {
      updates.push('lineNumber = ?');
      params.push(lineNumber);
    }

    updates.push('updatedAt = ?');
    params.push(now);
    params.push(req.params.id);

    const result = db.prepare(`
      UPDATE lyrics 
      SET ${updates.join(', ')}
      WHERE id = ?
    `).run(...params);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Lyric not found' });
    }

    const lyric = db.prepare('SELECT * FROM lyrics WHERE id = ?').get(req.params.id);
    res.json({
      ...lyric,
      assignedUserIds: parseJsonArray(lyric.assignedUserIds)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/lyrics/:id - Delete lyric
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM lyrics WHERE id = ?').run(req.params.id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Lyric not found' });
    }

    res.json({ message: 'Lyric deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

