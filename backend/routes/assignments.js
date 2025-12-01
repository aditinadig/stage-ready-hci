import express from 'express';
import { db, generateId, getTimestamp, parseJsonArray, stringifyJsonArray } from '../database.js';

const router = express.Router();

// GET /api/assignments - Get all assignments (optionally filter by userId, songId, or teamId)
router.get('/', (req, res) => {
  try {
    const { userId, songId, teamId } = req.query;
    let query = 'SELECT * FROM userSongAssignments WHERE 1=1';
    const params = [];

    if (userId) {
      query += ' AND userId = ?';
      params.push(userId);
    }
    if (songId) {
      query += ' AND songId = ?';
      params.push(songId);
    }
    if (teamId) {
      query += ' AND teamId = ?';
      params.push(teamId);
    }

    query += ' ORDER BY createdAt DESC';

    const assignments = db.prepare(query).all(...params);
    
    // Parse JSON arrays
    const parsedAssignments = assignments.map(assignment => ({
      ...assignment,
      assignedSections: parseJsonArray(assignment.assignedSections)
    }));

    res.json(parsedAssignments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/assignments/:id - Get assignment by ID
router.get('/:id', (req, res) => {
  try {
    const assignment = db.prepare('SELECT * FROM userSongAssignments WHERE id = ?').get(req.params.id);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    
    res.json({
      ...assignment,
      assignedSections: parseJsonArray(assignment.assignedSections)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/assignments - Create new assignment
router.post('/', (req, res) => {
  try {
    const { userId, songId, teamId, assignedSections, role } = req.body;
    
    if (!userId || !songId || !teamId) {
      return res.status(400).json({ error: 'userId, songId, and teamId are required' });
    }

    const id = generateId();
    const now = getTimestamp();

    db.prepare(`
      INSERT INTO userSongAssignments (id, userId, songId, teamId, assignedSections, role, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, 
      userId, 
      songId, 
      teamId, 
      stringifyJsonArray(assignedSections || []), 
      role || null, 
      now, 
      now
    );

    const assignment = db.prepare('SELECT * FROM userSongAssignments WHERE id = ?').get(id);
    res.status(201).json({
      ...assignment,
      assignedSections: parseJsonArray(assignment.assignedSections)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/assignments/:id - Update assignment
router.put('/:id', (req, res) => {
  try {
    const { assignedSections, role } = req.body;
    const now = getTimestamp();

    const result = db.prepare(`
      UPDATE userSongAssignments 
      SET assignedSections = ?, role = ?, updatedAt = ?
      WHERE id = ?
    `).run(
      stringifyJsonArray(assignedSections || []), 
      role || null, 
      now, 
      req.params.id
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    const assignment = db.prepare('SELECT * FROM userSongAssignments WHERE id = ?').get(req.params.id);
    res.json({
      ...assignment,
      assignedSections: parseJsonArray(assignment.assignedSections)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/assignments/:id - Delete assignment
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM userSongAssignments WHERE id = ?').run(req.params.id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    res.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

