import express from 'express';
import { db, generateId, getTimestamp, parseJsonArray, stringifyJsonArray } from '../database.js';

const router = express.Router();

// GET /api/comments - Get all comments (optionally filter by updateId)
router.get('/', (req, res) => {
  try {
    const { updateId, parentCommentId } = req.query;
    let query = 'SELECT * FROM comments WHERE 1=1';
    const params = [];

    if (updateId) {
      query += ' AND updateId = ?';
      params.push(updateId);
    }
    if (parentCommentId !== undefined) {
      if (parentCommentId === null || parentCommentId === 'null') {
        query += ' AND parentCommentId IS NULL';
      } else {
        query += ' AND parentCommentId = ?';
        params.push(parentCommentId);
      }
    }

    query += ' ORDER BY createdAt ASC';

    const comments = db.prepare(query).all(...params);
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/comments/:id - Get comment by ID
router.get('/:id', (req, res) => {
  try {
    const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(req.params.id);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    res.json(comment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/comments - Create new comment
router.post('/', (req, res) => {
  try {
    const { updateId, userId, userName, text, parentCommentId } = req.body;
    
    if (!updateId || !userId || !userName || !text) {
      return res.status(400).json({ error: 'updateId, userId, userName, and text are required' });
    }

    const id = generateId();
    const now = getTimestamp();

    db.prepare(`
      INSERT INTO comments (id, updateId, userId, userName, text, parentCommentId, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, 
      updateId, 
      userId, 
      userName, 
      text, 
      parentCommentId || null, 
      now, 
      now
    );

    const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(id);
    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/comments/:id - Update comment
router.put('/:id', (req, res) => {
  try {
    const { text } = req.body;
    const now = getTimestamp();

    const result = db.prepare(`
      UPDATE comments 
      SET text = ?, updatedAt = ?
      WHERE id = ?
    `).run(text || null, now, req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(req.params.id);
    res.json(comment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/comments/:id - Delete comment
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM comments WHERE id = ?').run(req.params.id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

