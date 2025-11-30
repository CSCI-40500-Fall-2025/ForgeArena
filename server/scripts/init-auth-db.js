const fs = require('fs').promises;
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');
const USERS_DB_PATH = path.join(DATA_DIR, 'users.json');

async function initializeDatabase() {
  try {
    console.log('🔧 Initializing user database...');
    
    // Create data directory
    await fs.mkdir(DATA_DIR, { recursive: true });
    console.log('✅ Data directory created/verified');
    
    // Check if users.json exists
    try {
      await fs.access(USERS_DB_PATH);
      console.log('✅ users.json already exists');
    } catch {
      // Create empty users database
      await fs.writeFile(USERS_DB_PATH, JSON.stringify({ users: [] }, null, 2));
      console.log('✅ users.json created');
    }
    
    console.log('✨ Database initialization complete!');
    console.log(`📁 Database location: ${USERS_DB_PATH}`);
    
  } catch (error) {
    console.error('❌ Failed to initialize database:', error.message);
    process.exit(1);
  }
}

// Run initialization
initializeDatabase();

