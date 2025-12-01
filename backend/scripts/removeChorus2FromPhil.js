import { initDatabase, db, getTimestamp, parseJsonArray, stringifyJsonArray } from '../database.js';

function removeChorus2FromPhil() {
  console.log('🔧 Removing Chorus 2 assignment from Phil...');

  try {
    // Get the song "Into the Air Tonight"
    const song = db.prepare('SELECT * FROM songs WHERE title = ?').get('Into the Air Tonight');
    if (!song) {
      console.log('❌ Song not found');
      return;
    }

    // Get Chorus 2 section
    const chorus2 = db.prepare('SELECT * FROM songSections WHERE songId = ? AND sectionType = ? AND sectionNumber = ?')
      .get(song.id, 'chorus', 2);
    
    if (!chorus2) {
      console.log('❌ Chorus 2 section not found');
      return;
    }

    // Get Phil's user ID
    const phil = db.prepare('SELECT * FROM users WHERE userCode = ? AND teamCode = ?').get('PHIL01', 'CHOIR24');
    if (!phil) {
      console.log('❌ Phil user not found');
      return;
    }

    // Get Chorus 2 lyrics (lines 1 and 2)
    const chorus2Lyrics = db.prepare('SELECT * FROM lyrics WHERE sectionId = ? AND lineNumber IN (?, ?) ORDER BY lineNumber')
      .all(chorus2.id, 1, 2);

    if (chorus2Lyrics.length === 0) {
      console.log('❌ Chorus 2 lines 1 and 2 not found');
      return;
    }

    const now = getTimestamp();
    let updatedCount = 0;

    // Remove Phil from lines 1 and 2
    for (const lyric of chorus2Lyrics) {
      const currentAssigned = parseJsonArray(lyric.assignedUserIds);
      
      // Remove Phil if assigned
      if (currentAssigned.includes(phil.id)) {
        const newAssigned = currentAssigned.filter(id => id !== phil.id);
        
        // Update the lyric - if no one is assigned, set lineType back to 'context'
        const newLineType = newAssigned.length === 0 ? 'context' : lyric.lineType;
        
        db.prepare(`
          UPDATE lyrics 
          SET assignedUserIds = ?, lineType = ?, updatedAt = ?
          WHERE id = ?
        `).run(stringifyJsonArray(newAssigned), newLineType, now, lyric.id);
        
        updatedCount++;
        console.log(`  ✓ Removed Phil from line ${lyric.lineNumber}`);
      }
    }

    // Remove Chorus 2 from user-song assignment
    const existingAssignment = db.prepare('SELECT * FROM userSongAssignments WHERE userId = ? AND songId = ?')
      .get(phil.id, song.id);
    
    if (existingAssignment) {
      const assignedSections = parseJsonArray(existingAssignment.assignedSections);
      const index = assignedSections.indexOf(chorus2.id);
      
      if (index !== -1) {
        assignedSections.splice(index, 1);
        
        // If no sections left, delete the assignment, otherwise update it
        if (assignedSections.length === 0) {
          db.prepare('DELETE FROM userSongAssignments WHERE id = ?').run(existingAssignment.id);
          console.log('  ✓ Removed Chorus 2 from assignment (assignment deleted - no sections left)');
        } else {
          db.prepare(`
            UPDATE userSongAssignments 
            SET assignedSections = ?, updatedAt = ?
            WHERE id = ?
          `).run(stringifyJsonArray(assignedSections), now, existingAssignment.id);
          console.log('  ✓ Removed Chorus 2 from assignment');
        }
      } else {
        console.log('  ℹ Chorus 2 was not in Phil\'s assigned sections');
      }
    } else {
      console.log('  ℹ No assignment found for Phil');
    }

    console.log(`\n✅ Successfully removed Chorus 2 assignment from Phil.`);
    console.log(`   Updated ${updatedCount} lyric line(s).`);
  } catch (error) {
    console.error('❌ Error removing Chorus 2 from Phil:', error);
    process.exit(1);
  }
}

// Initialize database and run script
initDatabase();
removeChorus2FromPhil();

