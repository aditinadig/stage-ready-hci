import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbDir = join(__dirname, 'db');
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
}

const dbPath = join(dbDir, 'stageready.db');
export const db = new Database(dbPath);

db.pragma('foreign_keys = OFF');

// ---------------------------------------------------------------------------
// Migration: if old schema is present, drop all tables so we start fresh
// ---------------------------------------------------------------------------
function resetIfOldSchema() {
  const tables = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table'")
    .all()
    .map((t) => t.name);

  const hasOld =
    tables.includes('songSections') ||
    tables.includes('lyrics') ||
    tables.includes('userSongAssignments');

  if (!hasOld) return false;

  console.log('🔄 Old schema detected – dropping all tables for fresh start...');
  // Disable FK so we can drop in any order
  for (const t of tables) {
    db.exec(`DROP TABLE IF EXISTS "${t}"`);
  }
  console.log('✅ Old tables dropped.');
  return true; // caller should seed
}

// ---------------------------------------------------------------------------
// Schema creation
// ---------------------------------------------------------------------------
function createTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS teams (
      id        TEXT PRIMARY KEY,
      teamCode  TEXT UNIQUE NOT NULL,
      name      TEXT NOT NULL,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id        TEXT PRIMARY KEY,
      teamId    TEXT NOT NULL,
      teamCode  TEXT NOT NULL,
      userCode  TEXT NOT NULL,
      name      TEXT NOT NULL,
      role      TEXT DEFAULT 'member',
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      FOREIGN KEY (teamId) REFERENCES teams(id),
      UNIQUE (userCode, teamId)
    );

    CREATE TABLE IF NOT EXISTS songs (
      id        TEXT PRIMARY KEY,
      teamId    TEXT NOT NULL,
      title     TEXT NOT NULL,
      artists   TEXT,
      tempo     INTEGER,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      FOREIGN KEY (teamId) REFERENCES teams(id)
    );

    -- sections: optional, sectionId on lines is nullable
    CREATE TABLE IF NOT EXISTS sections (
      id          TEXT PRIMARY KEY,
      songId      TEXT NOT NULL,
      name        TEXT NOT NULL,
      sectionType TEXT,
      sectionNumber INTEGER,
      orderIndex  INTEGER NOT NULL,
      createdAt   INTEGER NOT NULL,
      updatedAt   INTEGER NOT NULL,
      FOREIGN KEY (songId) REFERENCES songs(id) ON DELETE CASCADE
    );

    -- lines: global lineNumber across whole song; sectionId nullable
    CREATE TABLE IF NOT EXISTS lines (
      id          TEXT PRIMARY KEY,
      songId      TEXT NOT NULL,
      sectionId   TEXT,
      lineNumber  INTEGER NOT NULL,
      text        TEXT NOT NULL,
      isContext   INTEGER DEFAULT 0,
      cueText     TEXT,
      cueType     TEXT,
      createdAt   INTEGER NOT NULL,
      updatedAt   INTEGER NOT NULL,
      FOREIGN KEY (songId)   REFERENCES songs(id)    ON DELETE CASCADE,
      FOREIGN KEY (sectionId) REFERENCES sections(id) ON DELETE SET NULL
    );

    -- which users are assigned to which lines
    CREATE TABLE IF NOT EXISTS line_assignments (
      id        TEXT PRIMARY KEY,
      lineId    TEXT NOT NULL,
      userId    TEXT NOT NULL,
      createdAt INTEGER NOT NULL,
      FOREIGN KEY (lineId)  REFERENCES lines(id) ON DELETE CASCADE,
      FOREIGN KEY (userId)  REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE (lineId, userId)
    );

    -- updates: point to the specific line that changed (nullable for song-level)
    CREATE TABLE IF NOT EXISTS updates (
      id         TEXT PRIMARY KEY,
      songId     TEXT NOT NULL,
      lineId     TEXT,
      text       TEXT NOT NULL,
      updateType TEXT DEFAULT 'general',
      createdBy  TEXT,
      createdAt  INTEGER NOT NULL,
      updatedAt  INTEGER NOT NULL,
      FOREIGN KEY (songId)  REFERENCES songs(id) ON DELETE CASCADE,
      FOREIGN KEY (lineId)  REFERENCES lines(id) ON DELETE SET NULL,
      FOREIGN KEY (createdBy) REFERENCES users(id)
    );

    -- per-user confirmation state for each update
    CREATE TABLE IF NOT EXISTS update_receipts (
      id          TEXT PRIMARY KEY,
      updateId    TEXT NOT NULL,
      userId      TEXT NOT NULL,
      status      TEXT DEFAULT 'pending',
      confirmedAt INTEGER,
      createdAt   INTEGER NOT NULL,
      FOREIGN KEY (updateId) REFERENCES updates(id) ON DELETE CASCADE,
      FOREIGN KEY (userId)   REFERENCES users(id)   ON DELETE CASCADE,
      UNIQUE (updateId, userId)
    );

    -- which songs a user is assigned to (song-level, not line-level)
    CREATE TABLE IF NOT EXISTS song_assignments (
      id        TEXT PRIMARY KEY,
      userId    TEXT NOT NULL,
      songId    TEXT NOT NULL,
      teamId    TEXT NOT NULL,
      role      TEXT,
      createdAt INTEGER NOT NULL,
      FOREIGN KEY (userId)  REFERENCES users(id)  ON DELETE CASCADE,
      FOREIGN KEY (songId)  REFERENCES songs(id)  ON DELETE CASCADE,
      UNIQUE (userId, songId)
    );

    -- threaded discussion on updates
    CREATE TABLE IF NOT EXISTS comments (
      id              TEXT PRIMARY KEY,
      updateId        TEXT NOT NULL,
      userId          TEXT NOT NULL,
      userName        TEXT NOT NULL,
      text            TEXT NOT NULL,
      parentCommentId TEXT,
      createdAt       INTEGER NOT NULL,
      FOREIGN KEY (updateId)        REFERENCES updates(id)  ON DELETE CASCADE,
      FOREIGN KEY (userId)          REFERENCES users(id),
      FOREIGN KEY (parentCommentId) REFERENCES comments(id) ON DELETE CASCADE
    );
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_teamCode      ON users(teamCode);
    CREATE INDEX IF NOT EXISTS idx_users_teamId        ON users(teamId);
    CREATE INDEX IF NOT EXISTS idx_songs_teamId        ON songs(teamId);
    CREATE INDEX IF NOT EXISTS idx_sections_songId     ON sections(songId);
    CREATE INDEX IF NOT EXISTS idx_sections_order      ON sections(songId, orderIndex);
    CREATE INDEX IF NOT EXISTS idx_lines_songId        ON lines(songId);
    CREATE INDEX IF NOT EXISTS idx_lines_sectionId     ON lines(sectionId);
    CREATE INDEX IF NOT EXISTS idx_lines_lineNumber    ON lines(songId, lineNumber);
    CREATE INDEX IF NOT EXISTS idx_la_userId           ON line_assignments(userId);
    CREATE INDEX IF NOT EXISTS idx_la_lineId           ON line_assignments(lineId);
    CREATE INDEX IF NOT EXISTS idx_updates_songId      ON updates(songId);
    CREATE INDEX IF NOT EXISTS idx_updates_lineId      ON updates(lineId);
    CREATE INDEX IF NOT EXISTS idx_receipts_userId     ON update_receipts(userId);
    CREATE INDEX IF NOT EXISTS idx_receipts_updateId   ON update_receipts(updateId);
    CREATE INDEX IF NOT EXISTS idx_receipts_status     ON update_receipts(userId, status);
    CREATE INDEX IF NOT EXISTS idx_song_assign_userId  ON song_assignments(userId);
    CREATE INDEX IF NOT EXISTS idx_comments_updateId   ON comments(updateId);
  `);
}

// ---------------------------------------------------------------------------
// Seed initial data (only runs when DB is empty)
// ---------------------------------------------------------------------------
function seedIfEmpty() {
  const count = db.prepare('SELECT COUNT(*) as c FROM teams').get().c;
  if (count > 0) return;

  console.log('🌱 Seeding initial data...');
  const now = getTimestamp();

  // Team
  const teamId = generateId();
  db.prepare(`INSERT INTO teams (id, teamCode, name, createdAt, updatedAt)
              VALUES (?, ?, ?, ?, ?)`)
    .run(teamId, 'CHOIR24', 'Spring Choir 2024', now, now);

  // Users
  const philId = generateId();
  const janeId = generateId();
  const mikeId = generateId();

  db.prepare(`INSERT INTO users (id, teamId, teamCode, userCode, name, role, createdAt, updatedAt)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(philId, teamId, 'CHOIR24', 'PHIL01', 'Phil', 'member', now, now);
  db.prepare(`INSERT INTO users (id, teamId, teamCode, userCode, name, role, createdAt, updatedAt)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(janeId, teamId, 'CHOIR24', 'JANE01', 'Jane', 'member', now, now);
  db.prepare(`INSERT INTO users (id, teamId, teamCode, userCode, name, role, createdAt, updatedAt)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(mikeId, teamId, 'CHOIR24', 'MIKE01', 'Mike', 'member', now, now);

  // Song
  const songId = generateId();
  db.prepare(`INSERT INTO songs (id, teamId, title, artists, tempo, createdAt, updatedAt)
              VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(songId, teamId, 'Into the Air Tonight',
      JSON.stringify(['Phil Collins']), 92, now, now);

  // Sections
  const chorus1Id = generateId();
  const verse1Id  = generateId();
  const chorus2Id = generateId();
  const verse2Id  = generateId();

  const insertSection = db.prepare(`
    INSERT INTO sections (id, songId, name, sectionType, sectionNumber, orderIndex, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertSection.run(chorus1Id, songId, 'Chorus 1', 'chorus', 1, 1, now, now);
  insertSection.run(verse1Id,  songId, 'Verse 1',  'verse',  1, 2, now, now);
  insertSection.run(chorus2Id, songId, 'Chorus 2', 'chorus', 2, 3, now, now);
  insertSection.run(verse2Id,  songId, 'Verse 2',  'verse',  2, 4, now, now);

  // Helper to insert a line and optionally assign it
  const insertLine = db.prepare(`
    INSERT INTO lines (id, songId, sectionId, lineNumber, text, isContext, cueText, cueType, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertLA = db.prepare(`
    INSERT INTO line_assignments (id, lineId, userId, createdAt) VALUES (?, ?, ?, ?)
  `);

  function addLine(sectionId, lineNumber, text, isContext, cueText, cueType, assignedUserIds = []) {
    const lineId = generateId();
    insertLine.run(lineId, songId, sectionId, lineNumber, text, isContext ? 1 : 0, cueText || null, cueType || null, now, now);
    for (const uid of assignedUserIds) {
      insertLA.run(generateId(), lineId, uid, now);
    }
    return lineId;
  }

  // --- Chorus 1 ---
  const c1l1 = addLine(chorus1Id, 1,
    'I can feel it coming in the air tonight, oh Lord',
    false, '↓ Enter 8 bars after drums', 'primary', [philId]);
  addLine(chorus1Id, 2,
    "And I've been waiting for this moment for all my life, oh Lord",
    false, null, null, [philId]);
  addLine(chorus1Id, 3,
    'Can you feel it coming in the air tonight? Oh Lord, oh Lord',
    true, null, null, []);

  // --- Verse 1 ---
  const v1l1 = addLine(verse1Id, 1,
    'Well, if you told me you were drowning',
    false, null, null, [philId]);
  addLine(verse1Id, 2,
    'I would not lend a hand',
    false, null, null, [philId]);
  addLine(verse1Id, 3,
    "I've seen your face before, my friend",
    true, null, null, []);
  addLine(verse1Id, 4,
    "But I don't know if you know who I am",
    true, 'Enter after "I would not lend a hand"', 'secondary', []);

  // --- Chorus 2 (context only for Phil) ---
  const c2l1 = addLine(chorus2Id, 1,
    'And I can feel it coming in the air tonight, oh Lord',
    true, null, null, []);
  addLine(chorus2Id, 2,
    "Well, I've been waiting for this moment for all my life, oh Lord",
    true, null, null, []);

  // --- Verse 2 (context only) ---
  const v2l1 = addLine(verse2Id, 1,
    "Well, the hurt doesn't show, but the pain still grows",
    true, null, null, []);
  addLine(verse2Id, 2,
    "It's no stranger to you and me",
    true, null, null, []);

  console.log('✅ Lines created');

  // Updates – now point to specific lines
  const insertUpdate = db.prepare(`
    INSERT INTO updates (id, songId, lineId, text, updateType, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const insertReceipt = db.prepare(`
    INSERT INTO update_receipts (id, updateId, userId, status, confirmedAt, createdAt)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const u1Id = generateId();
  insertUpdate.run(u1Id, songId, v2l1, 'Verse 2 reassigned to Jane', 'reassignment', now, now);
  insertReceipt.run(generateId(), u1Id, philId, 'pending', null, now);

  const u2Id = generateId();
  insertUpdate.run(u2Id, songId, c1l1, '+8 bars before Chorus 1', 'timing', now, now);
  insertReceipt.run(generateId(), u2Id, philId, 'pending', null, now);

  const u3Id = generateId();
  insertUpdate.run(u3Id, songId, v1l1, 'Lyrics on Verse 1 changed', 'lyrics', now, now);
  insertReceipt.run(generateId(), u3Id, philId, 'pending', null, now);

  // One already-confirmed update (history item)
  const u4Id = generateId();
  const yesterday = now - 86400000;
  insertUpdate.run(u4Id, songId, null, 'Initial tempo set to 92 BPM', 'general', yesterday, yesterday);
  insertReceipt.run(generateId(), u4Id, philId, 'confirmed', yesterday, yesterday);

  console.log('✅ Updates and receipts created');

  // Song assignments (song-level)
  db.prepare(`INSERT INTO song_assignments (id, userId, songId, teamId, role, createdAt)
              VALUES (?, ?, ?, ?, ?, ?)`)
    .run(generateId(), philId, songId, teamId, 'solo', now);

  console.log('✅ Song assignments created');
  console.log('\n🎉 Seed complete.');
  console.log('   Team: CHOIR24  |  User: PHIL01  |  Song: Into the Air Tonight');
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------
export function initDatabase() {
  console.log('📦 Initializing database...');
  const needsSeed = resetIfOldSchema();
  db.pragma('foreign_keys = ON');
  createTables();
  if (needsSeed) {
    seedIfEmpty();
  } else {
    seedIfEmpty(); // also seeds on first ever run
  }
  console.log('✅ Database ready.');
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
export function generateId() {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function getTimestamp() {
  return Date.now();
}

export function parseJsonArray(str) {
  if (!str) return [];
  try { return JSON.parse(str); } catch { return []; }
}

export function stringifyJsonArray(arr) {
  if (!arr || !Array.isArray(arr)) return '[]';
  return JSON.stringify(arr);
}
