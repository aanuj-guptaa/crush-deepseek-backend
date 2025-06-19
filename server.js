require('dotenv').config();
const pool = require('./db/connect');
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// Basic route to check Render status
app.get('/', (req, res) => {
  res.send('✨ CrushAnalyzer Backend is Live!');
});

// Test route for DB
app.get('/api/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ time: result.rows[0] });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database not reachable' });
  }
});

app.post('/api/analyze', async (req, res) => {
  const prompt = req.body.prompt;
  const apiKey = process.env.OPENROUTER_API_KEY;

  console.log('🔑 Using API Key:', apiKey ? '[HIDDEN]' : '❌ Missing');

  console.log('📝 Incoming Prompt:', prompt); 

  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'deepseek/deepseek-r1-0528-qwen3-8b:free',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1000,
        temperature: 0.7,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': process.env.OPENROUTER_API_KEY, 
          'HTTP-Referer': 'https://your-site.com',
          'X-Title': 'CrushAnalyzer',
        },
      }
    );

    const output = response.data.choices[0].message.content;
    console.log(' AI Response:', output); 

    res.json({ output });
  } catch (error) {
    console.error('❌ OpenRouter/DeepSeek API error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Something went wrong with the AI API.' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
