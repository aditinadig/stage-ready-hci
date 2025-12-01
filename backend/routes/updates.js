import express from 'express';
import { db, generateId, getTimestamp, parseJsonArray, stringifyJsonArray } from '../database.js';

const router = express.Router();

// GET /api/updates - Get all updates (optionally filter by songId, status, or userId)
router.get('/', (req, res) => {
  try {
    const { songId, status, userId } = req.query;
    let query = 'SELECT * FROM updates WHERE 1=1';
    const params = [];

    if (songId) {
      query += ' AND songId = ?';
      params.push(songId);
    }
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY createdAt DESC';

    let updates = db.prepare(query).all(...params);

    // Filter by userId if provided (check if userId is in targetUserIds)
    if (userId) {
      updates = updates.filter(update => {
        const targetIds = parseJsonArray(update.targetUserIds);
        return targetIds.includes(userId);
      });
    }

    // Parse JSON arrays
    const parsedUpdates = updates.map(update => ({
      ...update,
      targetUserIds: parseJsonArray(update.targetUserIds),
      confirmedBy: parseJsonArray(update.confirmedBy)
    }));

    res.json(parsedUpdates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/updates/:id - Get update by ID
router.get('/:id', (req, res) => {
  try {
    const update = db.prepare('SELECT * FROM updates WHERE id = ?').get(req.params.id);
    if (!update) {
      return res.status(404).json({ error: 'Update not found' });
    }
    
    res.json({
      ...update,
      targetUserIds: parseJsonArray(update.targetUserIds),
      confirmedBy: parseJsonArray(update.confirmedBy)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/updates - Create new update
router.post('/', (req, res) => {
  try {
    const { songId, sectionId, text, updateType, targetUserIds, createdBy } = req.body;
    
    if (!songId || !text) {
      return res.status(400).json({ error: 'songId and text are required' });
    }

    const id = generateId();
    const now = getTimestamp();

    db.prepare(`
      INSERT INTO updates (id, songId, sectionId, text, updateType, status, targetUserIds, confirmedBy, createdAt, updatedAt, createdBy)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, 
      songId, 
      sectionId || null, 
      text, 
      updateType || 'general', 
      'pending', 
      stringifyJsonArray(targetUserIds || []), 
      '[]', 
      now, 
      now, 
      createdBy || null
    );

    const update = db.prepare('SELECT * FROM updates WHERE id = ?').get(id);
    res.status(201).json({
      ...update,
      targetUserIds: parseJsonArray(update.targetUserIds),
      confirmedBy: parseJsonArray(update.confirmedBy)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/updates/:id - Update update (e.g., confirm it)
router.put('/:id', (req, res) => {
  try {
    const { status, confirmedBy } = req.body;
    const now = getTimestamp();

    const update = db.prepare('SELECT * FROM updates WHERE id = ?').get(req.params.id);
    if (!update) {
      return res.status(404).json({ error: 'Update not found' });
    }

    let newConfirmedBy = parseJsonArray(update.confirmedBy);
    if (confirmedBy && Array.isArray(confirmedBy)) {
      // Merge confirmedBy arrays
      newConfirmedBy = [...new Set([...newConfirmedBy, ...confirmedBy])];
    }

    const result = db.prepare(`
      UPDATE updates 
      SET status = ?, confirmedBy = ?, updatedAt = ?
      WHERE id = ?
    `).run(
      status || update.status, 
      stringifyJsonArray(newConfirmedBy), 
      now, 
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM updates WHERE id = ?').get(req.params.id);
    res.json({
      ...updated,
      targetUserIds: parseJsonArray(updated.targetUserIds),
      confirmedBy: parseJsonArray(updated.confirmedBy)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/updates/:id/confirm - Confirm an update (adds userId to confirmedBy)
router.post('/:id/confirm', (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const update = db.prepare('SELECT * FROM updates WHERE id = ?').get(req.params.id);
    if (!update) {
      return res.status(404).json({ error: 'Update not found' });
    }

    const confirmedBy = parseJsonArray(update.confirmedBy);
    if (!confirmedBy.includes(userId)) {
      confirmedBy.push(userId);
    }

    const now = getTimestamp();
    const newStatus = confirmedBy.length > 0 ? 'confirmed' : update.status;

    db.prepare(`
      UPDATE updates 
      SET status = ?, confirmedBy = ?, updatedAt = ?
      WHERE id = ?
    `).run(newStatus, stringifyJsonArray(confirmedBy), now, req.params.id);

    const updated = db.prepare('SELECT * FROM updates WHERE id = ?').get(req.params.id);
    res.json({
      ...updated,
      targetUserIds: parseJsonArray(updated.targetUserIds),
      confirmedBy: parseJsonArray(updated.confirmedBy)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/updates/:id - Delete update
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM updates WHERE id = ?').run(req.params.id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Update not found' });
    }

    res.json({ message: 'Update deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

