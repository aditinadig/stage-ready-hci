import { initDatabase, db, getTimestamp, stringifyJsonArray } from '../database.js';

function revertConfirmedUpdates() {
  console.log('🔄 Reverting confirmed updates back to pending...');

  try {
    // Get all confirmed updates
    const confirmedUpdates = db.prepare('SELECT * FROM updates WHERE status = ?').all('confirmed');
    
    console.log(`Found ${confirmedUpdates.length} confirmed update(s)`);

    if (confirmedUpdates.length === 0) {
      console.log('No confirmed updates to revert.');
      return;
    }

    const now = getTimestamp();
    let revertedCount = 0;

    // Revert each confirmed update
    confirmedUpdates.forEach(update => {
      db.prepare(`
        UPDATE updates 
        SET status = ?, confirmedBy = ?, updatedAt = ?
        WHERE id = ?
      `).run('pending', '[]', now, update.id);
      
      revertedCount++;
      console.log(`  ✓ Reverted: "${update.text}" (ID: ${update.id})`);
    });

    console.log(`\n✅ Successfully reverted ${revertedCount} update(s) back to pending status.`);
  } catch (error) {
    console.error('❌ Error reverting updates:', error);
    process.exit(1);
  }
}

// Initialize database and run script
initDatabase();
revertConfirmedUpdates();

