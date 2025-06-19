// server.js
require('dotenv').config();
console.log("🔑 Loaded API Key from .env:", process.env.OPENROUTER_API_KEY ? "[PRESENT]" : "❌ MISSING");

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const pool = require('./db/connect');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// Root check
app.get('/', (req, res) => {
  res.send('✨ CrushAnalyzer Backend is Live!');
});

// DB test route
app.get('/api/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ time: result.rows[0] });
  } catch (error) {
    console.error('❌ Database error:', error);
    res.status(500).json({ error: 'Database not reachable' });
  }
});

// Main AI route
app.post('/api/analyze', async (req, res) => {
  const prompt = req.body.prompt;
  const apiKey = process.env.OPENROUTER_API_KEY;

  console.log('🔑 Using API Key:', apiKey ? '[HIDDEN]' : '❌ Missing');
  console.log('📝 Incoming Prompt:', prompt);

  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'deepseek/deepseek-r1-0528:free',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1000,
        temperature: 0.7,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
      }
    );

    const output = response.data.choices[0].message.content;
    console.log('✅ AI Response:', output);
    res.json({ output });
  } catch (error) {
    console.error('❌ OpenRouter API Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Something went wrong with the AI API.' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
