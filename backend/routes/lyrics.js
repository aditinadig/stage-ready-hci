import express from 'express';
import { db, generateId, getTimestamp } from '../database.js';

const router = express.Router();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Return assigned user IDs for a line from the junction table */
function getAssignedUserIds(lineId) {
  return db
    .prepare('SELECT userId FROM line_assignments WHERE lineId = ?')
    .all(lineId)
    .map((r) => r.userId);
}

/**
 * Shape a `lines` row for API responses.
 * Adds backward-compat fields so frontend needs zero changes:
 *   - assignedUserIds  (from line_assignments junction)
 *   - lineType         ('own' if isContext=0, 'context' if isContext=1)
 */
function shape(row) {
  if (!row) return null;
  const assignedUserIds = getAssignedUserIds(row.id);
  return {
    ...row,
    assignedUserIds,
    lineType: row.isContext ? 'context' : 'own',
  };
}

// ---------------------------------------------------------------------------
// Routes — endpoint path stays /api/lyrics for frontend compat
// ---------------------------------------------------------------------------

// GET /api/lyrics?songId=&sectionId=
router.get('/', (req, res) => {
  try {
    const { songId, sectionId } = req.query;
    let query = 'SELECT * FROM lines WHERE 1=1';
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

    const rows = db.prepare(query).all(...params);
    res.json(rows.map(shape));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/lyrics/:id
router.get('/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM lines WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Line not found' });
    res.json(shape(row));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/lyrics
router.post('/', (req, res) => {
  try {
    const {
      songId, sectionId, lineNumber, text,
      lineType,        // 'own' | 'context'  (legacy input)
      isContext,       // 0 | 1               (new input)
      assignedUserIds, // array of userId strings
      cueText, cueType,
    } = req.body;

    if (!songId || lineNumber === undefined || !text) {
      return res.status(400).json({ error: 'songId, lineNumber, and text are required' });
    }

    // Resolve isContext: accept either form
    const contextFlag =
      isContext !== undefined
        ? (isContext ? 1 : 0)
        : (lineType === 'own' ? 0 : 1);

    const id  = generateId();
    const now = getTimestamp();

    db.prepare(`
      INSERT INTO lines (id, songId, sectionId, lineNumber, text, isContext, cueText, cueType, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, songId, sectionId || null, lineNumber, text, contextFlag, cueText || null, cueType || null, now, now);

    // Insert junction rows for each assigned user
    if (assignedUserIds && Array.isArray(assignedUserIds)) {
      const insertLA = db.prepare(
        'INSERT OR IGNORE INTO line_assignments (id, lineId, userId, createdAt) VALUES (?, ?, ?, ?)'
      );
      for (const uid of assignedUserIds) {
        insertLA.run(generateId(), id, uid, now);
      }
    }

    res.status(201).json(shape(db.prepare('SELECT * FROM lines WHERE id = ?').get(id)));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/lyrics/:id
router.put('/:id', (req, res) => {
  try {
    const {
      text, lineType, isContext, assignedUserIds,
      cueText, cueType, lineNumber,
    } = req.body;
    const now = getTimestamp();

    const setClauses = [];
    const params = [];

    if (text !== undefined)       { setClauses.push('text = ?');       params.push(text); }
    if (lineNumber !== undefined) { setClauses.push('lineNumber = ?'); params.push(lineNumber); }
    if (cueText !== undefined)    { setClauses.push('cueText = ?');    params.push(cueText); }
    if (cueType !== undefined)    { setClauses.push('cueType = ?');    params.push(cueType); }

    // Accept either isContext or lineType for the context flag
    if (isContext !== undefined) {
      setClauses.push('isContext = ?');
      params.push(isContext ? 1 : 0);
    } else if (lineType !== undefined) {
      setClauses.push('isContext = ?');
      params.push(lineType === 'own' ? 0 : 1);
    }

    setClauses.push('updatedAt = ?');
    params.push(now);
    params.push(req.params.id);

    if (setClauses.length > 1) { // at least one real field changed
      const result = db.prepare(
        `UPDATE lines SET ${setClauses.join(', ')} WHERE id = ?`
      ).run(...params);

      if (result.changes === 0) return res.status(404).json({ error: 'Line not found' });
    }

    // Replace line_assignments if assignedUserIds provided
    if (assignedUserIds !== undefined && Array.isArray(assignedUserIds)) {
      db.prepare('DELETE FROM line_assignments WHERE lineId = ?').run(req.params.id);
      const insertLA = db.prepare(
        'INSERT OR IGNORE INTO line_assignments (id, lineId, userId, createdAt) VALUES (?, ?, ?, ?)'
      );
      for (const uid of assignedUserIds) {
        insertLA.run(generateId(), req.params.id, uid, now);
      }
    }

    const row = db.prepare('SELECT * FROM lines WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Line not found' });
    res.json(shape(row));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/lyrics/:id
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM lines WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Line not found' });
    res.json({ message: 'Line deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
