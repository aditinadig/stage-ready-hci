import express from 'express';
import { db, generateId, getTimestamp, parseJsonArray, stringifyJsonArray } from '../database.js';

const router = express.Router();

function shape(song) {
  return { ...song, artists: parseJsonArray(song.artists) };
}

// GET /api/songs?teamId=
router.get('/', (req, res) => {
  try {
    const { teamId } = req.query;
    let query = 'SELECT * FROM songs WHERE 1=1';
    const params = [];

    if (teamId) { query += ' AND teamId = ?'; params.push(teamId); }
    query += ' ORDER BY createdAt DESC';

    res.json(db.prepare(query).all(...params).map(shape));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/songs/user/:userId  — songs where user has a song_assignment OR a line_assignment
router.get('/user/:userId', (req, res) => {
  try {
    const { userId } = req.params;

    // Primary: songs explicitly assigned to this user via song_assignments
    const songs = db.prepare(`
      SELECT DISTINCT s.*
      FROM songs s
      JOIN song_assignments sa ON s.id = sa.songId
      WHERE sa.userId = ?
      ORDER BY s.createdAt DESC
    `).all(userId).map(shape);

    // Fallback: if no song-level assignments, find songs via line-level assignments
    if (songs.length === 0) {
      const fallback = db.prepare(`
        SELECT DISTINCT s.*
        FROM songs s
        JOIN lines l ON s.id = l.songId
        JOIN line_assignments la ON l.id = la.lineId
        WHERE la.userId = ?
        ORDER BY s.createdAt DESC
      `).all(userId).map(shape);
      return res.json(fallback);
    }

    res.json(songs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/songs/:id
router.get('/:id', (req, res) => {
  try {
    const song = db.prepare('SELECT * FROM songs WHERE id = ?').get(req.params.id);
    if (!song) return res.status(404).json({ error: 'Song not found' });
    res.json(shape(song));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/songs
router.post('/', (req, res) => {
  try {
    const { teamId, title, artists, tempo } = req.body;

    if (!teamId || !title) {
      return res.status(400).json({ error: 'teamId and title are required' });
    }

    const id  = generateId();
    const now = getTimestamp();

    db.prepare(`
      INSERT INTO songs (id, teamId, title, artists, tempo, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, teamId, title, stringifyJsonArray(artists || []), tempo || null, now, now);

    res.status(201).json(shape(db.prepare('SELECT * FROM songs WHERE id = ?').get(id)));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/songs/:id
router.put('/:id', (req, res) => {
  try {
    const { title, artists, tempo } = req.body;
    const now = getTimestamp();

    const result = db.prepare(`
      UPDATE songs SET title = ?, artists = ?, tempo = ?, updatedAt = ? WHERE id = ?
    `).run(title || null, stringifyJsonArray(artists || []), tempo || null, now, req.params.id);

    if (result.changes === 0) return res.status(404).json({ error: 'Song not found' });
    res.json(shape(db.prepare('SELECT * FROM songs WHERE id = ?').get(req.params.id)));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/songs/:id
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM songs WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Song not found' });
    res.json({ message: 'Song deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
