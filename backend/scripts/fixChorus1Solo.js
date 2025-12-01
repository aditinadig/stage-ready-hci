import { initDatabase, db, parseJsonArray } from '../database.js';

function fixChorus1Solo() {
  console.log('🔧 Fixing Chorus 1 solo detection...');

  try {
    // Get the song
    const song = db.prepare('SELECT * FROM songs WHERE title = ?').get('Into the Air Tonight');
    if (!song) {
      console.log('❌ Song not found');
      return;
    }

    // Get Chorus 1 section
    const chorus1 = db.prepare('SELECT * FROM songSections WHERE songId = ? AND sectionType = ? AND sectionNumber = ?')
      .get(song.id, 'chorus', 1);

    if (!chorus1) {
      console.log('❌ Chorus 1 section not found');
      return;
    }

    // Get Phil's user ID
    const phil = db.prepare('SELECT * FROM users WHERE userCode = ? AND teamCode = ?').get('PHIL01', 'CHOIR24');
    if (!phil) {
      console.log('❌ Phil user not found');
      return;
    }

    // Get all lyrics in Chorus 1 assigned to Phil
    const allLyrics = db.prepare('SELECT * FROM lyrics WHERE sectionId = ? ORDER BY lineNumber').all(chorus1.id);
    const philLyrics = allLyrics.filter(l => {
      const assignedIds = parseJsonArray(l.assignedUserIds);
      return assignedIds.includes(phil.id);
    });

    console.log(`\nChorus 1 has ${allLyrics.length} total lines`);
    console.log(`Phil has ${philLyrics.length} assigned lines`);
    console.log(`This should show as: ${philLyrics.length <= 2 ? 'Solo' : 'Chorus'}`);

    // The logic should work correctly - if Phil has 2 or fewer lines, it shows as Solo
    // But maybe the issue is that we need to ensure only lines 1 and 2 are assigned to Phil
    // Let's verify the assignments are correct
    
    if (philLyrics.length === 2) {
      console.log('\n✅ Chorus 1 has 2 lines assigned to Phil - should show as "Solo"');
      console.log('   If it\'s showing as "Chorus", the frontend logic might need adjustment.');
      console.log('   The database data appears correct.');
    } else {
      console.log(`\n⚠️  Chorus 1 has ${philLyrics.length} lines assigned to Phil`);
      console.log('   This will show as "Chorus" (not Solo) because there are more than 2 lines.');
    }

    // Show which lines are assigned
    console.log('\nLines assigned to Phil:');
    philLyrics.forEach(l => {
      console.log(`  Line ${l.lineNumber}: "${l.text.substring(0, 50)}..."`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

initDatabase();
fixChorus1Solo();

