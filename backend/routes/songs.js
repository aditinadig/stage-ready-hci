import express from 'express';
import { db, generateId, getTimestamp, parseJsonArray, stringifyJsonArray } from '../database.js';

const router = express.Router();

// GET /api/songs - Get all songs (optionally filter by teamId)
router.get('/', (req, res) => {
  try {
    const { teamId } = req.query;
    let query = 'SELECT * FROM songs WHERE 1=1';
    const params = [];

    if (teamId) {
      query += ' AND teamId = ?';
      params.push(teamId);
    }

    query += ' ORDER BY createdAt DESC';

    const songs = db.prepare(query).all(...params);
    
    // Parse JSON arrays
    const parsedSongs = songs.map(song => ({
      ...song,
      artists: parseJsonArray(song.artists)
    }));

    res.json(parsedSongs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/songs/:id - Get song by ID
router.get('/:id', (req, res) => {
  try {
    const song = db.prepare('SELECT * FROM songs WHERE id = ?').get(req.params.id);
    if (!song) {
      return res.status(404).json({ error: 'Song not found' });
    }
    
    res.json({
      ...song,
      artists: parseJsonArray(song.artists)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/songs/user/:userId - Get songs assigned to a user
router.get('/user/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    
    const assignments = db.prepare(`
      SELECT DISTINCT s.* 
      FROM songs s
      INNER JOIN userSongAssignments usa ON s.id = usa.songId
      WHERE usa.userId = ?
      ORDER BY s.createdAt DESC
    `).all(userId);

    const parsedSongs = assignments.map(song => ({
      ...song,
      artists: parseJsonArray(song.artists)
    }));

    res.json(parsedSongs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/songs - Create new song
router.post('/', (req, res) => {
  try {
    const { teamId, title, artists, tempo, createdBy } = req.body;
    
    if (!teamId || !title) {
      return res.status(400).json({ error: 'teamId and title are required' });
    }

    const id = generateId();
    const now = getTimestamp();

    db.prepare(`
      INSERT INTO songs (id, teamId, title, artists, tempo, createdAt, updatedAt, createdBy)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, 
      teamId, 
      title, 
      stringifyJsonArray(artists || []), 
      tempo || null, 
      now, 
      now, 
      createdBy || null
    );

    const song = db.prepare('SELECT * FROM songs WHERE id = ?').get(id);
    res.status(201).json({
      ...song,
      artists: parseJsonArray(song.artists)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/songs/:id - Update song
router.put('/:id', (req, res) => {
  try {
    const { title, artists, tempo } = req.body;
    const now = getTimestamp();

    const result = db.prepare(`
      UPDATE songs 
      SET title = ?, artists = ?, tempo = ?, updatedAt = ?
      WHERE id = ?
    `).run(
      title || null, 
      stringifyJsonArray(artists || []), 
      tempo || null, 
      now, 
      req.params.id
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Song not found' });
    }

    const song = db.prepare('SELECT * FROM songs WHERE id = ?').get(req.params.id);
    res.json({
      ...song,
      artists: parseJsonArray(song.artists)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/songs/:id - Delete song
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM songs WHERE id = ?').run(req.params.id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Song not found' });
    }

    res.json({ message: 'Song deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

