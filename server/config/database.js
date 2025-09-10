const { Pool } = require('pg');

// Database connection - Railway provides these environment variables automatically
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test database connection
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('Database connected successfully');
    client.release();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    return false;
  }
};

// Initialize database tables
const initDatabase = async () => {
  try {
    // Test connection first
    const connected = await testConnection();
    if (!connected) {
      console.log('Skipping database initialization due to connection failure');
      return;
    }
    // Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        gym VARCHAR(255) DEFAULT 'PowerHouse Fitness',
        workout_streak INTEGER DEFAULT 0,
        last_workout DATE DEFAULT CURRENT_DATE,
        level INTEGER DEFAULT 1,
        xp INTEGER DEFAULT 0,
        strength INTEGER DEFAULT 10,
        endurance INTEGER DEFAULT 10,
        agility INTEGER DEFAULT 10,
        equipment JSONB DEFAULT '{"weapon": null, "armor": null, "accessory": null}',
        inventory JSONB DEFAULT '["basic_gloves", "water_bottle"]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Quests table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS quests (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        completed BOOLEAN DEFAULT false,
        progress VARCHAR(50) DEFAULT '0/1',
        xp_reward INTEGER NOT NULL,
        reward JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Raid boss table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS raid_boss (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        total_hp INTEGER NOT NULL,
        current_hp INTEGER NOT NULL,
        participants INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Activity feed table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS activities (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        username VARCHAR(255) NOT NULL,
        action TEXT NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Duels table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS duels (
        id SERIAL PRIMARY KEY,
        challenger VARCHAR(255) NOT NULL,
        opponent VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        challenge TEXT NOT NULL,
        deadline TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

// Seed initial data
const seedDatabase = async () => {
  try {
    // Check if user already exists
    const userExists = await pool.query('SELECT id FROM users WHERE username = $1', ['TestWarrior']);
    
    if (userExists.rows.length === 0) {
      // Insert default user
      await pool.query(`
        INSERT INTO users (username, gym, workout_streak, level, xp, strength, endurance, agility)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, ['TestWarrior', 'PowerHouse Fitness', 3, 1, 0, 10, 10, 10]);
    }

    // Check if quests exist
    const questsExist = await pool.query('SELECT id FROM quests LIMIT 1');
    
    if (questsExist.rows.length === 0) {
      // Insert default quests
      const quests = [
        ['First Steps', 'Complete your first workout', 50, '{"item": "training_shoes"}'],
        ['Cardio Warrior', 'Run 5 miles total', 200, '{"item": "running_gear"}'],
        ['Strength Builder', 'Complete 100 reps', 150, '{"item": "weight_belt"}'],
        ['Streak Master', 'Maintain a 7-day workout streak', 300, '{"item": "champion_badge"}'],
        ['Social Butterfly', 'Challenge 3 gym buddies to duels', 100, '{"item": "friendship_ring"}']
      ];

      for (const quest of quests) {
        await pool.query(`
          INSERT INTO quests (title, description, xp_reward, reward)
          VALUES ($1, $2, $3, $4)
        `, quest);
      }
    }

    // Check if raid boss exists
    const raidExists = await pool.query('SELECT id FROM raid_boss LIMIT 1');
    
    if (raidExists.rows.length === 0) {
      await pool.query(`
        INSERT INTO raid_boss (name, description, total_hp, current_hp, participants)
        VALUES ($1, $2, $3, $4, $5)
      `, ['The Titan Squat', 'Defeat with collective squats!', 10000, 8500, 47]);
    }

    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

module.exports = {
  pool,
  initDatabase,
  seedDatabase,
  testConnection
};
