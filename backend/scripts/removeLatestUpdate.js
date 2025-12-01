import { initDatabase, db } from '../database.js';

function removeLatestUpdate() {
  console.log('🗑️  Removing latest update from database...');

  try {
    // Get the most recent update ordered by createdAt DESC
    const latestUpdate = db.prepare(`
      SELECT * FROM updates 
      ORDER BY createdAt DESC 
      LIMIT 1
    `).get();

    if (!latestUpdate) {
      console.log('No updates found in database.');
      return;
    }

    console.log(`\nFound update to remove:`);
    console.log(`  - "${latestUpdate.text}" (ID: ${latestUpdate.id})`);
    
    // Delete the update
    const result = db.prepare('DELETE FROM updates WHERE id = ?').run(latestUpdate.id);
    
    if (result.changes > 0) {
      console.log(`\n✅ Successfully removed update from database.`);
    } else {
      console.log(`\n✗ Failed to delete update`);
    }
  } catch (error) {
    console.error('❌ Error removing update:', error);
    process.exit(1);
  }
}

// Initialize database and run script
initDatabase();
removeLatestUpdate();

