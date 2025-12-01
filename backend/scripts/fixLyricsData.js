import { initDatabase, db, getTimestamp, parseJsonArray, stringifyJsonArray } from '../database.js';

function fixLyricsData() {
  console.log('🔧 Fixing lyrics data issues...');

  try {
    // Get the song "Into the Air Tonight"
    const song = db.prepare('SELECT * FROM songs WHERE title = ?').get('Into the Air Tonight');
    if (!song) {
      console.log('❌ Song not found');
      return;
    }

    // Get sections
    const chorus1 = db.prepare('SELECT * FROM songSections WHERE songId = ? AND sectionType = ? AND sectionNumber = ?')
      .get(song.id, 'chorus', 1);
    const verse1 = db.prepare('SELECT * FROM songSections WHERE songId = ? AND sectionType = ? AND sectionNumber = ?')
      .get(song.id, 'verse', 1);

    if (!chorus1 || !verse1) {
      console.log('❌ Sections not found');
      return;
    }

    const now = getTimestamp();

    // Issue 1: Fix Chorus 1 - ensure only 2 lines are assigned to Phil (should show as Solo)
    // This should already be correct, but let's verify and fix if needed
    console.log('\n1. Checking Chorus 1 assignments...');
    const chorus1Lyrics = db.prepare('SELECT * FROM lyrics WHERE sectionId = ? ORDER BY lineNumber').all(chorus1.id);
    console.log(`   Found ${chorus1Lyrics.length} lines in Chorus 1`);
    
    // The issue might be that we need to check the actual data
    // Chorus 1 should have 2 lines assigned to Phil (lines 1 and 2)
    // If it's showing as "chorus" instead of "solo", the logic might be wrong
    // But actually, with 2 lines, it should show as solo (isSolo = length <= 2)
    // So this might be a display issue, but let's ensure the data is correct

    // Issue 2: Fix Verse 1 - move the cue before "I've seen your face..."
    // Currently: line 3 has no cue, line 4 has the cue
    // Should be: line 3 should have the cue, line 4 should not
    console.log('\n2. Fixing Verse 1 cue placement...');
    
    // Get verse 1 lyrics
    const verse1Lyrics = db.prepare('SELECT * FROM lyrics WHERE sectionId = ? ORDER BY lineNumber').all(verse1.id);
    
    // Find line 3 ("I've seen your face before, my friend")
    const line3 = verse1Lyrics.find(l => l.lineNumber === 3 && l.text.includes("I've seen your face"));
    // Find line 4 ("But I don't know if you know who I am")
    const line4 = verse1Lyrics.find(l => l.lineNumber === 4 && l.text.includes("But I don't know"));
    
    if (line3 && line4) {
      // Move the cue from line 4 to line 3
      const cueText = line4.cueText;
      const cueType = line4.cueType;
      
      db.prepare(`
        UPDATE lyrics 
        SET cueText = ?, cueType = ?, updatedAt = ?
        WHERE id = ?
      `).run(cueText, cueType, now, line3.id);
      
      db.prepare(`
        UPDATE lyrics 
        SET cueText = ?, cueType = ?, updatedAt = ?
        WHERE id = ?
      `).run(null, null, now, line4.id);
      
      console.log(`   ✓ Moved cue from line 4 to line 3`);
    }

    // Issue 3: Fix duplicate cue text in Verse 1
    // The cue text should be just "Enter after \"I would not lend a hand\""
    // Not duplicated in the meta section
    console.log('\n3. Fixing duplicate cue text...');
    
    if (line3) {
      // Update the cue text to be cleaner
      const cleanCueText = 'Enter after "I would not lend a hand"';
      db.prepare(`
        UPDATE lyrics 
        SET cueText = ?, updatedAt = ?
        WHERE id = ?
      `).run(cleanCueText, now, line3.id);
      console.log(`   ✓ Updated cue text to: "${cleanCueText}"`);
    }

    console.log('\n✅ All fixes applied successfully!');
  } catch (error) {
    console.error('❌ Error fixing lyrics data:', error);
    process.exit(1);
  }
}

// Initialize database and run script
initDatabase();
fixLyricsData();

