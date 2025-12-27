const pool = require('../../src/config/database');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
  try {
    const migrationDir = path.join(__dirname);
    const files = fs.readdirSync(migrationDir)
      .filter(f => f.match(/^\d{3}_.*\.sql$/))
      .sort();

    console.log('Running migrations...');

    for (const file of files) {
      const filePath = path.join(migrationDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      console.log(`Executing migration: ${file}`);
      
      try {
        await pool.query(sql);
        console.log(`✓ Completed: ${file}`);
      } catch (error) {
        // Some migrations might fail if tables already exist (idempotent)
        // This is acceptable for development
        if (error.code === '42P07' || error.message.includes('already exists')) {
          console.log(`⚠ Skipped (already exists): ${file}`);
        } else {
          throw error;
        }
      }
    }

    console.log('All migrations completed successfully');
    return true;
  } catch (error) {
    console.error('Migration error:', error);
    return false;
  } finally {
    await pool.end();
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { runMigrations };
