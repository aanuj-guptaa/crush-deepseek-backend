const { response } = require('express');
const pool = require('./connect');

const createUsersTable = async () => {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100),
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await pool.query(query);
    console.log("✅ 'users' table is ready!");
  } catch (error) {
    console.error("❌ Failed to create 'users' table:", error);
  }
};

const createAnalysesTable = async () => {
    try{
    const query = `
      CREATE TABLE IF NOT EXISTS analyses (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        chat TEXT NOT NULL,
        mode VARCHAR(20),
        response TEXT,
        analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await pool.query(query);
    console.log("✅ 'analyses' table is ready!");
  } catch (error) {
    console.error("❌ Failed to create 'analyses' table:", error);
  }
};


const createTables = async () => {
    await createUsersTable();
    await createAnalysesTable();
};

module.exports = createUsersTable;

