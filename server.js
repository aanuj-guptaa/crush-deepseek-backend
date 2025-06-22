require('dotenv').config();
console.log("🔑 Loaded API Key:", process.env.OPENROUTER_API_KEY ? "[PRESENT]" : "❌ MISSING");

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const bcrypt = require('bcrypt');
const pool = require('./db/connect');
const createUsersTable = require('./db/createTables');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// Create tables on start
createUsersTable();

// 🚀 Home route
app.get('/', (req, res) => {
  res.send('✨ CrushAnalyzer Backend is Live!');
});

// ✅ Test DB route
app.get('/api/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ time: result.rows[0] });
  } catch (error) {
    console.error('❌ DB Error:', error);
    res.status(500).json({ error: 'Database not reachable' });
  }
});

// ✅ Signup route
app.post('/api/signup', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = `
      INSERT INTO users (name, email, password)
      VALUES ($1, $2, $3)
      RETURNING id, name, email, created_at;
    `;
    const values = [name, email, hashedPassword];

    const result = await pool.query(query, values);
    res.status(201).json({ user: result.rows[0] });
  } catch (error) {
    console.error('❌ Signup error:', error);
    res.status(500).json({ message: 'Signup failed. Email might already be registered.' });
  }
});

// ✅ Login route
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'User not found' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    res.json({ message: 'Login successful', user: { id: user.id, name: user.name, email: user.email } });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
});

// 🤖 Analyze route (AI)
app.post('/api/analyze', async (req, res) => {
  const { prompt, mode } = req.body;
  
  const headers = {
    'Authorization': 'Bearer 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', // Hardcode NEW key
    'HTTP-Referer': 'http://localhost:3000',
    'X-Title': 'CrushAnalyzer',
    'Content-Type': 'application/json',
    'Accept': 'application/json' // ← OpenRouter sometimes requires this
  };

  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'deepseek/deepseek-r1-0528:free',
        messages: [{ role: 'user', content: prompt }],
        temperature: mode === 'savage' ? 0.9 : 0.7,
      },
      { headers }
    );

    res.json({ output: response.data.choices[0].message.content });
  } catch (error) {
    console.error("💥 FULL ERROR:", {
      headersSent: headers['Authorization'].slice(0, 10) + '...', // Logs first 10 chars of key
      error: error.response?.data || error.message
    });
    res.status(500).json({ 
      error: "OpenRouter request failed",
      details: error.response?.data 
    });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
