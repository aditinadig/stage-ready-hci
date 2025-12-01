import { initDatabase, db, generateId, getTimestamp, stringifyJsonArray } from '../database.js';

function seedDatabase() {
  console.log('🌱 Seeding database with sample data...');

  const now = getTimestamp();

  // Create a team
  const teamId = generateId();
  db.prepare(`
    INSERT INTO teams (id, teamCode, name, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?)
  `).run(teamId, 'CHOIR24', 'Spring Choir 2024', now, now);

  console.log('✅ Created team: CHOIR24');

  // Create users
  const philId = generateId();
  const janeId = generateId();
  const mikeId = generateId();

  db.prepare(`
    INSERT INTO users (id, userCode, teamId, teamCode, name, role, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(philId, 'PHIL01', teamId, 'CHOIR24', 'Phil', 'member', now, now);

  db.prepare(`
    INSERT INTO users (id, userCode, teamId, teamCode, name, role, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(janeId, 'JANE01', teamId, 'CHOIR24', 'Jane', 'member', now, now);

  db.prepare(`
    INSERT INTO users (id, userCode, teamId, teamCode, name, role, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(mikeId, 'MIKE01', teamId, 'CHOIR24', 'Mike', 'member', now, now);

  console.log('✅ Created users: Phil, Jane, Mike');

  // Create a song
  const songId = generateId();
  db.prepare(`
    INSERT INTO songs (id, teamId, title, artists, tempo, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(songId, teamId, 'Into the Air Tonight', stringifyJsonArray(['Phil', 'Jane', 'Mike']), 92, now, now);

  console.log('✅ Created song: Into the Air Tonight');

  // Create sections
  const chorus1Id = generateId();
  const verse1Id = generateId();
  const chorus2Id = generateId();
  const verse2Id = generateId();

  db.prepare(`
    INSERT INTO songSections (id, songId, sectionType, sectionNumber, displayName, orderIndex, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(chorus1Id, songId, 'chorus', 1, 'Chorus 1', 1, now, now);

  db.prepare(`
    INSERT INTO songSections (id, songId, sectionType, sectionNumber, displayName, orderIndex, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(verse1Id, songId, 'verse', 1, 'Verse 1', 2, now, now);

  db.prepare(`
    INSERT INTO songSections (id, songId, sectionType, sectionNumber, displayName, orderIndex, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(chorus2Id, songId, 'chorus', 2, 'Chorus 2', 3, now, now);

  db.prepare(`
    INSERT INTO songSections (id, songId, sectionType, sectionNumber, displayName, orderIndex, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(verse2Id, songId, 'verse', 2, 'Verse 2', 4, now, now);

  console.log('✅ Created sections');

  // Create lyrics for Chorus 1
  db.prepare(`
    INSERT INTO lyrics (id, songId, sectionId, lineNumber, text, lineType, assignedUserIds, cueText, cueType, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    generateId(), songId, chorus1Id, 1,
    'I can feel it coming in the air tonight, oh Lord',
    'own', stringifyJsonArray([philId]), '↓ Enter 8 bars after drums', 'primary',
    now, now
  );

  db.prepare(`
    INSERT INTO lyrics (id, songId, sectionId, lineNumber, text, lineType, assignedUserIds, cueText, cueType, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    generateId(), songId, chorus1Id, 2,
    'And I\'ve been waiting for this moment for all my life, oh Lord',
    'own', stringifyJsonArray([philId]), null, null,
    now, now
  );

  db.prepare(`
    INSERT INTO lyrics (id, songId, sectionId, lineNumber, text, lineType, assignedUserIds, cueText, cueType, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    generateId(), songId, chorus1Id, 3,
    'Can you feel it coming in the air tonight? Oh Lord, oh Lord',
    'context', stringifyJsonArray([]), null, null,
    now, now
  );

  // Create lyrics for Verse 1
  db.prepare(`
    INSERT INTO lyrics (id, songId, sectionId, lineNumber, text, lineType, assignedUserIds, cueText, cueType, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    generateId(), songId, verse1Id, 1,
    'Well, if you told me you were drowning',
    'own', stringifyJsonArray([philId]), null, null,
    now, now
  );

  db.prepare(`
    INSERT INTO lyrics (id, songId, sectionId, lineNumber, text, lineType, assignedUserIds, cueText, cueType, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    generateId(), songId, verse1Id, 2,
    'I would not lend a hand',
    'own', stringifyJsonArray([philId]), null, null,
    now, now
  );

  db.prepare(`
    INSERT INTO lyrics (id, songId, sectionId, lineNumber, text, lineType, assignedUserIds, cueText, cueType, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    generateId(), songId, verse1Id, 3,
    'I\'ve seen your face before, my friend',
    'context', stringifyJsonArray([]), null, null,
    now, now
  );

  db.prepare(`
    INSERT INTO lyrics (id, songId, sectionId, lineNumber, text, lineType, assignedUserIds, cueText, cueType, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    generateId(), songId, verse1Id, 4,
    'But I don\'t know if you know who I am',
    'context', stringifyJsonArray([]), 'Enter after "I would not lend a hand"', 'secondary',
    now, now
  );

  // Create lyrics for Chorus 2 (context only)
  db.prepare(`
    INSERT INTO lyrics (id, songId, sectionId, lineNumber, text, lineType, assignedUserIds, cueText, cueType, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    generateId(), songId, chorus2Id, 1,
    'And I can feel it coming in the air tonight, oh Lord',
    'context', stringifyJsonArray([]), null, null,
    now, now
  );

  db.prepare(`
    INSERT INTO lyrics (id, songId, sectionId, lineNumber, text, lineType, assignedUserIds, cueText, cueType, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    generateId(), songId, chorus2Id, 2,
    'Well, I\'ve been waiting for this moment for all my life, oh Lord',
    'context', stringifyJsonArray([]), null, null,
    now, now
  );

  // Create lyrics for Verse 2 (context only)
  db.prepare(`
    INSERT INTO lyrics (id, songId, sectionId, lineNumber, text, lineType, assignedUserIds, cueText, cueType, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    generateId(), songId, verse2Id, 1,
    'Well, the hurt doesn\'t show, but the pain still grows',
    'context', stringifyJsonArray([]), null, null,
    now, now
  );

  db.prepare(`
    INSERT INTO lyrics (id, songId, sectionId, lineNumber, text, lineType, assignedUserIds, cueText, cueType, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    generateId(), songId, verse2Id, 2,
    'It\'s no stranger to you and me',
    'context', stringifyJsonArray([]), null, null,
    now, now
  );

  console.log('✅ Created lyrics');

  // Create updates
  const update1Id = generateId();
  const update2Id = generateId();
  const update3Id = generateId();

  db.prepare(`
    INSERT INTO updates (id, songId, sectionId, text, updateType, status, targetUserIds, confirmedBy, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    update1Id, songId, verse2Id, 'Verse 2 reassigned to Jane', 'reassignment',
    'pending', stringifyJsonArray([philId]), '[]', now, now
  );

  db.prepare(`
    INSERT INTO updates (id, songId, sectionId, text, updateType, status, targetUserIds, confirmedBy, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    update2Id, songId, chorus1Id, '+8 bars before chorus 1', 'timing',
    'pending', stringifyJsonArray([philId]), '[]', now, now
  );

  db.prepare(`
    INSERT INTO updates (id, songId, sectionId, text, updateType, status, targetUserIds, confirmedBy, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    update3Id, songId, verse1Id, 'Lyrics on Verse 1 changed', 'lyrics',
    'pending', stringifyJsonArray([philId]), '[]', now, now
  );

  // Create a confirmed update (history)
  const historyUpdateId = generateId();
  db.prepare(`
    INSERT INTO updates (id, songId, sectionId, text, updateType, status, targetUserIds, confirmedBy, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    historyUpdateId, songId, null, 'Initial tempo set to 92 BPM', 'general',
    'confirmed', stringifyJsonArray([philId]), stringifyJsonArray([philId]), now - 86400000, now - 86400000
  );

  console.log('✅ Created updates');

  // Create user-song assignments
  db.prepare(`
    INSERT INTO userSongAssignments (id, userId, songId, teamId, assignedSections, role, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    generateId(), philId, songId, teamId,
    stringifyJsonArray([verse1Id, chorus1Id]), 'solo',
    now, now
  );

  console.log('✅ Created assignments');

  console.log('\n🎉 Database seeded successfully!');
  console.log('\nSample data:');
  console.log('- Team Code: CHOIR24');
  console.log('- User Code: PHIL01');
  console.log('- Song: Into the Air Tonight');
}

// Run seed
initDatabase();
seedDatabase();

