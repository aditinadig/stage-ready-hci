import { initDatabase, db } from '../database.js';

function removeLatestUpdates() {
  console.log('🗑️  Removing latest 3 updates from database...');

  try {
    // Get the 3 most recent updates ordered by createdAt DESC
    const latestUpdates = db.prepare(`
      SELECT * FROM updates 
      ORDER BY createdAt DESC 
      LIMIT 3
    `).all();

    if (latestUpdates.length === 0) {
      console.log('No updates found in database.');
      return;
    }

    console.log(`\nFound ${latestUpdates.length} update(s) to remove:\n`);

    // Delete each update
    for (const update of latestUpdates) {
      console.log(`  - Removing: "${update.text}" (ID: ${update.id})`);
      
      const result = db.prepare('DELETE FROM updates WHERE id = ?').run(update.id);
      
      if (result.changes > 0) {
        console.log(`    ✓ Deleted successfully`);
      } else {
        console.log(`    ✗ Failed to delete`);
      }
    }

    console.log(`\n✅ Successfully removed ${latestUpdates.length} update(s) from database.`);
  } catch (error) {
    console.error('❌ Error removing updates:', error);
    process.exit(1);
  }
}

// Initialize database and run script
initDatabase();
removeLatestUpdates();

