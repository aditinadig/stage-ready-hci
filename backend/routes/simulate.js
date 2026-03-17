import express from 'express';
import { db, generateId, getTimestamp } from '../database.js';

const router = express.Router();

/**
 * POST /api/simulate/reassign-chorus2
 *
 * Assigns Chorus 2 lines 1 and 2 to Phil, then creates an update + receipt
 * targeting Phil so the notification appears in the UI.
 */
router.post('/reassign-chorus2', (req, res) => {
  try {
    // Find the song
    const song = db.prepare("SELECT * FROM songs WHERE title = ?").get('Into the Air Tonight');
    if (!song) return res.status(404).json({ error: 'Song not found' });

    // Find Chorus 2 section
    const chorus2 = db.prepare(
      "SELECT * FROM sections WHERE songId = ? AND sectionType = ? AND sectionNumber = ?"
    ).get(song.id, 'chorus', 2);
    if (!chorus2) return res.status(404).json({ error: 'Chorus 2 section not found' });

    // Find Phil
    const phil = db.prepare(
      "SELECT * FROM users WHERE userCode = ? AND teamCode = ?"
    ).get('PHIL01', 'CHOIR24');
    if (!phil) return res.status(404).json({ error: 'Phil not found' });

    // Get Chorus 2 lines 1 and 2
    const chorus2Lines = db.prepare(
      "SELECT * FROM lines WHERE sectionId = ? AND lineNumber IN (1, 2) ORDER BY lineNumber"
    ).all(chorus2.id);
    if (chorus2Lines.length === 0) {
      return res.status(404).json({ error: 'Chorus 2 lines 1 and 2 not found' });
    }

    const now = getTimestamp();

    // Assign Phil to each line (if not already assigned)
    const insertLA = db.prepare(
      'INSERT OR IGNORE INTO line_assignments (id, lineId, userId, createdAt) VALUES (?, ?, ?, ?)'
    );
    for (const line of chorus2Lines) {
      insertLA.run(generateId(), line.id, phil.id, now);

      // Mark line as non-context (isContext = 0) now that it's assigned
      db.prepare('UPDATE lines SET isContext = 0, updatedAt = ? WHERE id = ?')
        .run(now, line.id);
    }

    // Ensure Phil has a song-level assignment
    db.prepare(`
      INSERT OR IGNORE INTO song_assignments (id, userId, songId, teamId, role, createdAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(generateId(), phil.id, song.id, phil.teamId, null, now);

    // Create an update pointing to the first line of Chorus 2
    const updateId = generateId();
    const firstLine = chorus2Lines[0];

    db.prepare(`
      INSERT INTO updates (id, songId, lineId, text, updateType, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      updateId, song.id, firstLine.id,
      'Chorus 2 lines 1 and 2 reassigned to Phil',
      'reassignment', now, now
    );

    // Create a pending receipt for Phil
    db.prepare(`
      INSERT OR IGNORE INTO update_receipts (id, updateId, userId, status, confirmedAt, createdAt)
      VALUES (?, ?, ?, 'pending', NULL, ?)
    `).run(generateId(), updateId, phil.id, now);

    const update = db.prepare('SELECT * FROM updates WHERE id = ?').get(updateId);

    res.json({
      success: true,
      message: 'Chorus 2 lines 1 and 2 reassigned to Phil',
      update,
      updatedLines: chorus2Lines.map((l) => ({ ...l, isContext: 0 })),
    });
  } catch (error) {
    console.error('Simulate error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
