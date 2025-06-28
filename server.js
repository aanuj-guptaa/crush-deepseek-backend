require('dotenv').config();
console.log("🔑 Loaded API Key:", process.env.OPENROUTER_API_KEY ? "[PRESENT]" : "❌ MISSING");

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const bcrypt = require('bcrypt');
const pool = require('./db/connect');
const createTables = require('./db/createTables');

const app = express();
const PORT = process.env.PORT || 3001; // Consolidated port declaration

// Enhanced CORS configuration
app.use(cors({
  origin: true, // Dynamically allow all origins
  credentials: true,
}));

app.use(bodyParser.json());

// Initialize database
createTables();

//ROUTES
app.get('/', (req, res) => res.send('✨ CrushAnalyzer Backend is Live!'));

// Database test API
app.get('/api/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ time: result.rows[0] });
  } catch (error) {
    console.error('❌ DB Error:', error);
    res.status(500).json({ error: 'Database not reachable' });
  }
});

// Auth Routes 
app.post('/api/signup', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (name, email, password) 
       VALUES ($1, $2, $3) 
       RETURNING id, name, email, created_at`,
      [name, email, hashedPassword]
    );
    res.status(201).json({ user: result.rows[0] });
  } catch (error) {
    console.error('❌ Signup error:', error.message, error.stack);
    res.status(500).json({ message: 'Signup failed. Email might already be registered.' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(401).json({ message: 'User not found' });
    
    const user = result.rows[0];
    if (!await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ message: 'Incorrect password' });
    }
    
    res.json({ 
      message: 'Login successful', 
      user: { id: user.id, name: user.name, email: user.email } 
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
});

//HISTORY

app.get('/api/history/:userId', async (req, res) => {
  const userId = req.params.userId;
  try {
    const result = await pool.query(
      'SELECT chat, response, mode, created_at FROM analyses WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    res.json({ history: result.rows });
  } catch (error) {
    console.error('❌ History fetch error:', error);
    res.status(500).json({ error: 'Could not fetch history' });
  }
});


// Analyze API endpoint
app.post('/api/analyze', async (req, res) => {
  const { prompt, mode } = req.body;
  
  const apiKey = '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'; 
  
  // 2. Debug logs
  console.log("🔑 Using Key:", apiKey.slice(0, 8) + '...' + apiKey.slice(-4));
  console.log("🌍 Origin:", req.headers.origin);

  try {
    // 3. Using axios.create() for better header control
    const api = axios.create({
      baseURL: 'https://openrouter.ai/api/v1',
      timeout: 10000,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': req.headers.origin || 'http://localhost:3001',
        'X-Title': 'CrushAnalyzer',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    // 4. Make the request
    const response = await api.post('/chat/completions', {
      model: 'deepseek/deepseek-r1-0528:free',
      messages: [{ role: 'user', content: prompt }],
      temperature: mode === 'savage' ? 0.9 : 0.7,
      max_tokens: 500
    });

    console.log("💬 Prompt sent to AI:", prompt);
    console.log("🧠 Full AI raw response:", JSON.stringify(response.data, null, 2));

    const output = response.data?.choices?.[0]?.message?.content;

    if (!output) {
  console.warn("⚠️ No output received from AI");
  return res.status(200).json({ output: "⚠️ No meaningful response generated. Try rephrasing your chat." });
  }

res.json({ output });
try {
  await pool.query(
    `INSERT INTO analyses (user_id, chat, mode, response)
     VALUES ($1, $2, $3, $4)`,
    [null, prompt, mode, output]
  );
  console.log("✅ Analysis saved to DB");
} catch (dbError) {
  console.error("❌ Failed to save analysis:", dbError.message);
}
  } catch (error) {
    // 5. Enhanced error diagnostics
    const errorInfo = {
      time: new Date().toISOString(),
      keyUsed: apiKey.slice(0, 8) + '...' + apiKey.slice(-4),
      headersSent: error.config?.headers,
      openRouterResponse: error.response?.data,
      fullError: error.message
    };
    console.error("💥 CRITICAL FAILURE:", errorInfo);
    
    res.status(500).json({
      error: "AI service unavailable",
      details: "Technical team has been notified" // User-friendly message
    });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🔐 Auth endpoints: /api/signup, /api/login`);
  console.log(`🤖 AI endpoint: /api/analyze`);
});
