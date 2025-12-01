import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure db directory exists
const dbDir = join(__dirname, 'db');
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
}

const dbPath = join(dbDir, 'stageready.db');
export const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

export function initDatabase() {
  console.log('📦 Initializing database...');

  // Teams table
  db.exec(`
    CREATE TABLE IF NOT EXISTS teams (
      id TEXT PRIMARY KEY,
      teamCode TEXT UNIQUE NOT NULL,
      name TEXT,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      createdBy TEXT
    )
  `);

  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      userCode TEXT NOT NULL,
      teamId TEXT NOT NULL,
      teamCode TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'member',
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      FOREIGN KEY (teamId) REFERENCES teams(id),
      UNIQUE(userCode, teamId)
    )
  `);

  // Songs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS songs (
      id TEXT PRIMARY KEY,
      teamId TEXT NOT NULL,
      title TEXT NOT NULL,
      artists TEXT, -- JSON array as string
      tempo INTEGER,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      createdBy TEXT,
      FOREIGN KEY (teamId) REFERENCES teams(id)
    )
  `);

  // Song sections table
  db.exec(`
    CREATE TABLE IF NOT EXISTS songSections (
      id TEXT PRIMARY KEY,
      songId TEXT NOT NULL,
      sectionType TEXT NOT NULL,
      sectionNumber INTEGER NOT NULL,
      displayName TEXT NOT NULL,
      orderIndex INTEGER NOT NULL,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      FOREIGN KEY (songId) REFERENCES songs(id) ON DELETE CASCADE
    )
  `);

  // Lyrics table
  db.exec(`
    CREATE TABLE IF NOT EXISTS lyrics (
      id TEXT PRIMARY KEY,
      songId TEXT NOT NULL,
      sectionId TEXT NOT NULL,
      lineNumber INTEGER NOT NULL,
      text TEXT NOT NULL,
      lineType TEXT DEFAULT 'context',
      assignedUserIds TEXT, -- JSON array as string
      cueText TEXT,
      cueType TEXT,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      FOREIGN KEY (songId) REFERENCES songs(id) ON DELETE CASCADE,
      FOREIGN KEY (sectionId) REFERENCES songSections(id) ON DELETE CASCADE
    )
  `);

  // Updates table
  db.exec(`
    CREATE TABLE IF NOT EXISTS updates (
      id TEXT PRIMARY KEY,
      songId TEXT NOT NULL,
      sectionId TEXT,
      text TEXT NOT NULL,
      updateType TEXT DEFAULT 'general',
      status TEXT DEFAULT 'pending',
      targetUserIds TEXT, -- JSON array as string
      confirmedBy TEXT, -- JSON array as string
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      createdBy TEXT,
      FOREIGN KEY (songId) REFERENCES songs(id) ON DELETE CASCADE,
      FOREIGN KEY (sectionId) REFERENCES songSections(id) ON DELETE SET NULL
    )
  `);

  // Comments table
  db.exec(`
    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      updateId TEXT NOT NULL,
      userId TEXT NOT NULL,
      userName TEXT NOT NULL,
      text TEXT NOT NULL,
      parentCommentId TEXT,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      FOREIGN KEY (updateId) REFERENCES updates(id) ON DELETE CASCADE,
      FOREIGN KEY (userId) REFERENCES users(id),
      FOREIGN KEY (parentCommentId) REFERENCES comments(id) ON DELETE CASCADE
    )
  `);

  // User song assignments table
  db.exec(`
    CREATE TABLE IF NOT EXISTS userSongAssignments (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      songId TEXT NOT NULL,
      teamId TEXT NOT NULL,
      assignedSections TEXT, -- JSON array as string
      role TEXT,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (songId) REFERENCES songs(id) ON DELETE CASCADE,
      FOREIGN KEY (teamId) REFERENCES teams(id) ON DELETE CASCADE
    )
  `);

  // Create indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_teamCode ON users(teamCode);
    CREATE INDEX IF NOT EXISTS idx_users_teamId ON users(teamId);
    CREATE INDEX IF NOT EXISTS idx_songs_teamId ON songs(teamId);
    CREATE INDEX IF NOT EXISTS idx_sections_songId ON songSections(songId);
    CREATE INDEX IF NOT EXISTS idx_sections_order ON songSections(songId, orderIndex);
    CREATE INDEX IF NOT EXISTS idx_lyrics_sectionId ON lyrics(sectionId);
    CREATE INDEX IF NOT EXISTS idx_lyrics_songId ON lyrics(songId);
    CREATE INDEX IF NOT EXISTS idx_updates_songId ON updates(songId);
    CREATE INDEX IF NOT EXISTS idx_updates_status ON updates(status);
    CREATE INDEX IF NOT EXISTS idx_updates_sectionId ON updates(sectionId);
    CREATE INDEX IF NOT EXISTS idx_comments_updateId ON comments(updateId);
    CREATE INDEX IF NOT EXISTS idx_assignments_userId ON userSongAssignments(userId);
    CREATE INDEX IF NOT EXISTS idx_assignments_songId ON userSongAssignments(songId);
    CREATE INDEX IF NOT EXISTS idx_assignments_teamId ON userSongAssignments(teamId);
  `);

  console.log('✅ Database initialized successfully!');
}

// Helper function to generate IDs
export function generateId() {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Helper function to get current timestamp
export function getTimestamp() {
  return Date.now();
}

// Helper functions for JSON array handling
export function parseJsonArray(str) {
  if (!str) return [];
  try {
    return JSON.parse(str);
  } catch {
    return [];
  }
}

export function stringifyJsonArray(arr) {
  if (!arr || !Array.isArray(arr)) return '[]';
  return JSON.stringify(arr);
}

