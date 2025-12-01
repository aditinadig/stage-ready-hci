import express from 'express';
import { db, generateId, getTimestamp, parseJsonArray, stringifyJsonArray } from '../database.js';

const router = express.Router();

// POST /api/simulate/reassign-chorus2 - Simulate reassigning Chorus 2 lines 1 and 2 to Phil
router.post('/reassign-chorus2', async (req, res) => {
  try {
    // Get the song "Into the Air Tonight"
    const song = db.prepare('SELECT * FROM songs WHERE title = ?').get('Into the Air Tonight');
    if (!song) {
      return res.status(404).json({ error: 'Song not found' });
    }

    // Get Chorus 2 section
    const chorus2 = db.prepare('SELECT * FROM songSections WHERE songId = ? AND sectionType = ? AND sectionNumber = ?')
      .get(song.id, 'chorus', 2);
    
    if (!chorus2) {
      return res.status(404).json({ error: 'Chorus 2 section not found' });
    }

    // Get Phil's user ID
    const phil = db.prepare('SELECT * FROM users WHERE userCode = ? AND teamCode = ?').get('PHIL01', 'CHOIR24');
    if (!phil) {
      return res.status(404).json({ error: 'Phil user not found' });
    }

    // Get Chorus 2 lyrics (lines 1 and 2)
    const chorus2Lyrics = db.prepare('SELECT * FROM lyrics WHERE sectionId = ? AND lineNumber IN (?, ?) ORDER BY lineNumber')
      .all(chorus2.id, 1, 2);

    if (chorus2Lyrics.length === 0) {
      return res.status(404).json({ error: 'Chorus 2 lines 1 and 2 not found' });
    }

    const now = getTimestamp();

    // Update lines 1 and 2 to assign them to Phil
    for (const lyric of chorus2Lyrics) {
      const currentAssigned = parseJsonArray(lyric.assignedUserIds);
      
      // Add Phil if not already assigned
      if (!currentAssigned.includes(phil.id)) {
        currentAssigned.push(phil.id);
      }

      // Update the lyric
      db.prepare(`
        UPDATE lyrics 
        SET assignedUserIds = ?, lineType = 'own', updatedAt = ?
        WHERE id = ?
      `).run(stringifyJsonArray(currentAssigned), now, lyric.id);
    }

    // Update or create user-song assignment for Chorus 2
    const existingAssignment = db.prepare('SELECT * FROM userSongAssignments WHERE userId = ? AND songId = ?')
      .get(phil.id, song.id);
    
    if (existingAssignment) {
      // Update existing assignment to include Chorus 2
      const assignedSections = parseJsonArray(existingAssignment.assignedSections);
      if (!assignedSections.includes(chorus2.id)) {
        assignedSections.push(chorus2.id);
        db.prepare(`
          UPDATE userSongAssignments 
          SET assignedSections = ?, updatedAt = ?
          WHERE id = ?
        `).run(stringifyJsonArray(assignedSections), now, existingAssignment.id);
      }
    } else {
      // Create new assignment
      const assignmentId = generateId();
      db.prepare(`
        INSERT INTO userSongAssignments (id, userId, songId, teamId, assignedSections, role, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        assignmentId,
        phil.id,
        song.id,
        phil.teamId,
        stringifyJsonArray([chorus2.id]),
        null,
        now,
        now
      );
    }

    // Create an update notification
    const updateId = generateId();
    const updateText = 'Chorus 2 lines 1 and 2 reassigned to Phil';
    
    db.prepare(`
      INSERT INTO updates (id, songId, sectionId, text, updateType, status, targetUserIds, confirmedBy, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      updateId,
      song.id,
      chorus2.id,
      updateText,
      'reassignment',
      'pending',
      stringifyJsonArray([phil.id]),
      '[]',
      now,
      now
    );

    // Get the created update
    const update = db.prepare('SELECT * FROM updates WHERE id = ?').get(updateId);

    res.json({
      success: true,
      message: 'Chorus 2 lines 1 and 2 reassigned to Phil',
      update: {
        ...update,
        targetUserIds: parseJsonArray(update.targetUserIds),
        confirmedBy: parseJsonArray(update.confirmedBy)
      },
      updatedLyrics: chorus2Lyrics.map(l => ({
        ...l,
        assignedUserIds: parseJsonArray(l.assignedUserIds)
      }))
    });
  } catch (error) {
    console.error('Error simulating update:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
