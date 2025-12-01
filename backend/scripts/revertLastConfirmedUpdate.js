import { initDatabase, db, getTimestamp, stringifyJsonArray } from '../database.js';

function revertLastConfirmedUpdate() {
  console.log('🔄 Reverting most recently confirmed update back to pending...');

  try {
    // Get the most recently confirmed update (ordered by updatedAt DESC)
    const update = db.prepare(`
      SELECT * FROM updates 
      WHERE status = ? 
      ORDER BY updatedAt DESC 
      LIMIT 1
    `).get('confirmed');

    if (!update) {
      console.log('No confirmed updates found.');
      return;
    }

    console.log(`Found most recently confirmed update: "${update.text}" (ID: ${update.id})`);

    const now = getTimestamp();

    // Revert the update: set status to pending and clear confirmedBy
    db.prepare(`
      UPDATE updates 
      SET status = ?, confirmedBy = ?, updatedAt = ?
      WHERE id = ?
    `).run('pending', '[]', now, update.id);

    console.log(`\n✅ Successfully reverted update back to pending status.`);
    console.log(`   Update: "${update.text}"`);
    console.log(`   ID: ${update.id}`);
  } catch (error) {
    console.error('❌ Error reverting update:', error);
    process.exit(1);
  }
}

// Initialize database and run script
initDatabase();
revertLastConfirmedUpdate();

