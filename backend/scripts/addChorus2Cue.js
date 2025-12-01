import { initDatabase, db, getTimestamp } from '../database.js';

function addChorus2Cue() {
  console.log('🎯 Adding cue to the beginning of Chorus 2...');

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

    // Get the first line of Chorus 2 (lineNumber = 1)
    const firstLine = db.prepare('SELECT * FROM lyrics WHERE sectionId = ? AND lineNumber = ?')
      .get(chorus2.id, 1);

    if (!firstLine) {
      console.log('❌ First line of Chorus 2 not found');
      return;
    }

    // Random cue options
    const cueOptions = [
      'Enter after the bridge',
      'Start after 4 bars',
      'Come in after "I can feel it"',
      'Enter on the downbeat',
      'Start after the pause',
      'Come in after verse 2',
      'Enter with full energy',
      'Start after the instrumental break'
    ];

    const randomCue = cueOptions[Math.floor(Math.random() * cueOptions.length)];

    const now = getTimestamp();

    // Update the first line with the cue
    db.prepare(`
      UPDATE lyrics 
      SET cueText = ?, cueType = 'primary', updatedAt = ?
      WHERE id = ?
    `).run(randomCue, now, firstLine.id);

    console.log(`\n✅ Successfully added cue to Chorus 2, line 1:`);
    console.log(`   Cue: "${randomCue}"`);
  } catch (error) {
    console.error('❌ Error adding cue:', error);
    process.exit(1);
  }
}

// Initialize database and run script
initDatabase();
addChorus2Cue();

