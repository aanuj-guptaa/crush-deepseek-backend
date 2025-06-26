const pool = require('./connect');

const createTables = async () => {
  try {
    // USERS table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100),
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // ANALYSES table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS analyses (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        chat TEXT NOT NULL,
        mode VARCHAR(20),
        response TEXT,
        analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("✅ Tables are ready!");
  } catch (error) {
    console.error("❌ Failed to create tables:", error);
  }
};

module.exports = createTables;
