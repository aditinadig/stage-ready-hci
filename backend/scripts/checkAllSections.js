import { initDatabase, db, parseJsonArray } from '../database.js';

function checkAllSections() {
  console.log('🔍 Checking all sections for Phil...');

  try {
    // Get Phil
    const phil = db.prepare('SELECT * FROM users WHERE userCode = ? AND teamCode = ?').get('PHIL01', 'CHOIR24');
    if (!phil) {
      console.log('❌ Phil not found');
      return;
    }

    // Get the song
    const song = db.prepare('SELECT * FROM songs WHERE title = ?').get('Into the Air Tonight');
    if (!song) {
      console.log('❌ Song not found');
      return;
    }

    // Get all sections ordered by orderIndex
    const sections = db.prepare('SELECT * FROM songSections WHERE songId = ? ORDER BY orderIndex').all(song.id);
    
    console.log(`\nFound ${sections.length} sections:\n`);

    sections.forEach((section, index) => {
      const lyrics = db.prepare('SELECT * FROM lyrics WHERE sectionId = ? ORDER BY lineNumber').all(section.id);
      const philLyrics = lyrics.filter(l => {
        const assignedIds = parseJsonArray(l.assignedUserIds);
        return assignedIds.includes(phil.id);
      });

      console.log(`${index + 1}. ${section.displayName} (${section.sectionType}, orderIndex: ${section.orderIndex})`);
      console.log(`   Total lines: ${lyrics.length}`);
      console.log(`   Phil's lines: ${philLyrics.length}`);
      console.log(`   Should show as: ${philLyrics.length <= 2 ? 'Solo' : section.sectionType.charAt(0).toUpperCase() + section.sectionType.slice(1)}`);
      
      if (philLyrics.length > 0) {
        console.log(`   Line numbers: ${philLyrics.map(l => l.lineNumber).join(', ')}`);
      }
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

initDatabase();
checkAllSections();

