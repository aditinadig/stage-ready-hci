import { initDatabase, db, parseJsonArray } from '../database.js';

function checkChorus1Data() {
  console.log('🔍 Checking Chorus 1 data...');

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

    // Get all lyrics in Chorus 1
    const lyrics = db.prepare('SELECT * FROM lyrics WHERE sectionId = ? ORDER BY lineNumber').all(chorus1.id);
    
    console.log(`\nChorus 1 has ${lyrics.length} total lines:`);
    lyrics.forEach(lyric => {
      const assignedIds = parseJsonArray(lyric.assignedUserIds);
      console.log(`  Line ${lyric.lineNumber}: "${lyric.text}"`);
      console.log(`    - Type: ${lyric.lineType}`);
      console.log(`    - Assigned to: ${assignedIds.length} user(s)`);
      console.log(`    - Cue: ${lyric.cueText || 'none'}`);
    });

    // Get Phil's user ID
    const phil = db.prepare('SELECT * FROM users WHERE userCode = ? AND teamCode = ?').get('PHIL01', 'CHOIR24');
    if (phil) {
      console.log(`\nPhil's user ID: ${phil.id}`);
      const philLyrics = lyrics.filter(l => {
        const assignedIds = parseJsonArray(l.assignedUserIds);
        return assignedIds.includes(phil.id);
      });
      console.log(`Phil has ${philLyrics.length} assigned lines in Chorus 1`);
      console.log(`This should show as ${philLyrics.length <= 2 ? 'Solo' : 'Chorus'}`);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

initDatabase();
checkChorus1Data();

