import express from 'express';
import { db, generateId, getTimestamp } from '../database.js';

const router = express.Router();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Shape an `updates` row for API responses.
 *
 * The DB no longer stores status/targetUserIds/confirmedBy on the update itself.
 * We compute them from `update_receipts` and make them available on the response
 * so the frontend requires no changes.
 *
 * We also compute `sectionId` by looking up the line's sectionId so that the
 * frontend scroll-to-section logic still works.
 *
 * @param {object} row          - raw row from the updates table
 * @param {string|null} userId  - when provided, status is from this user's receipt
 */
function shape(row, userId = null) {
  if (!row) return null;

  const receipts = db
    .prepare('SELECT * FROM update_receipts WHERE updateId = ?')
    .all(row.id);

  const targetUserIds = receipts.map((r) => r.userId);
  const confirmedBy   = receipts.filter((r) => r.status === 'confirmed').map((r) => r.userId);

  // Per-user status: only meaningful when userId is provided
  let status = 'pending';
  if (userId) {
    const myReceipt = receipts.find((r) => r.userId === userId);
    status = myReceipt ? myReceipt.status : 'pending';
  } else {
    // Global status: confirmed only if ALL targeted users confirmed
    status = targetUserIds.length > 0 && confirmedBy.length === targetUserIds.length
      ? 'confirmed'
      : 'pending';
  }

  // Compute sectionId from the line so scroll-to-section still works
  let sectionId = null;
  if (row.lineId) {
    const line = db.prepare('SELECT sectionId FROM lines WHERE id = ?').get(row.lineId);
    sectionId = line ? line.sectionId : null;
  }

  return {
    ...row,
    sectionId,      // computed for backward-compat (frontend uses this for scroll)
    status,         // computed per-user (or global)
    targetUserIds,  // all receipt users
    confirmedBy,    // confirmed receipt users
  };
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

// GET /api/updates?songId=&status=&userId=
router.get('/', (req, res) => {
  try {
    const { songId, status, userId } = req.query;

    let query = 'SELECT DISTINCT u.* FROM updates u';
    const params = [];

    // If userId is provided, join receipts to filter by target user
    if (userId) {
      query += ' JOIN update_receipts ur ON u.id = ur.updateId AND ur.userId = ?';
      params.push(userId);
    }

    query += ' WHERE 1=1';

    if (songId) {
      query += ' AND u.songId = ?';
      params.push(songId);
    }

    // status filter: apply on the receipt for this user
    if (status && userId) {
      query += ' AND ur.status = ?';
      params.push(status);
    }

    query += ' ORDER BY u.createdAt DESC';

    const rows = db.prepare(query).all(...params);
    res.json(rows.map((r) => shape(r, userId || null)));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/updates/:id
router.get('/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM updates WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Update not found' });
    res.json(shape(row));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/updates
// Body: { songId, lineId?, text, updateType?, targetUserIds?, createdBy? }
router.post('/', (req, res) => {
  try {
    const { songId, lineId, text, updateType, targetUserIds, createdBy } = req.body;

    if (!songId || !text) {
      return res.status(400).json({ error: 'songId and text are required' });
    }

    const id  = generateId();
    const now = getTimestamp();

    db.prepare(`
      INSERT INTO updates (id, songId, lineId, text, updateType, createdBy, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, songId, lineId || null, text, updateType || 'general', createdBy || null, now, now);

    // Create receipts for each target user
    if (targetUserIds && Array.isArray(targetUserIds)) {
      const insertReceipt = db.prepare(`
        INSERT OR IGNORE INTO update_receipts (id, updateId, userId, status, confirmedAt, createdAt)
        VALUES (?, ?, ?, 'pending', NULL, ?)
      `);
      for (const uid of targetUserIds) {
        insertReceipt.run(generateId(), id, uid, now);
      }
    }

    res.status(201).json(shape(db.prepare('SELECT * FROM updates WHERE id = ?').get(id)));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/updates/:id  (metadata edits – text, updateType, lineId)
router.put('/:id', (req, res) => {
  try {
    const { text, updateType, lineId } = req.body;
    const now = getTimestamp();

    const setClauses = [];
    const params = [];

    if (text !== undefined)       { setClauses.push('text = ?');       params.push(text); }
    if (updateType !== undefined) { setClauses.push('updateType = ?'); params.push(updateType); }
    if (lineId !== undefined)     { setClauses.push('lineId = ?');     params.push(lineId); }

    setClauses.push('updatedAt = ?');
    params.push(now);
    params.push(req.params.id);

    const result = db.prepare(
      `UPDATE updates SET ${setClauses.join(', ')} WHERE id = ?`
    ).run(...params);

    if (result.changes === 0) return res.status(404).json({ error: 'Update not found' });
    res.json(shape(db.prepare('SELECT * FROM updates WHERE id = ?').get(req.params.id)));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/updates/:id/confirm  Body: { userId }
router.post('/:id/confirm', (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const update = db.prepare('SELECT * FROM updates WHERE id = ?').get(req.params.id);
    if (!update) return res.status(404).json({ error: 'Update not found' });

    const now = getTimestamp();

    // Upsert the receipt: insert if missing, update if already there
    const existing = db
      .prepare('SELECT * FROM update_receipts WHERE updateId = ? AND userId = ?')
      .get(req.params.id, userId);

    if (existing) {
      db.prepare(`
        UPDATE update_receipts SET status = 'confirmed', confirmedAt = ?
        WHERE updateId = ? AND userId = ?
      `).run(now, req.params.id, userId);
    } else {
      db.prepare(`
        INSERT INTO update_receipts (id, updateId, userId, status, confirmedAt, createdAt)
        VALUES (?, ?, ?, 'confirmed', ?, ?)
      `).run(generateId(), req.params.id, userId, now, now);
    }

    res.json(shape(db.prepare('SELECT * FROM updates WHERE id = ?').get(req.params.id), userId));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/updates/:id
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM updates WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Update not found' });
    res.json({ message: 'Update deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
