// server.js

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
require('dotenv').config(); // load .env

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

app.post('/api/analyze', async (req, res) => {
  const prompt = req.body.prompt;
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: '❌ API key is missing in backend!' });
  }

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful and funny relationship analyzer bot.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 200,
        temperature: 0.8
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const output = response.data.choices[0].message.content.trim();
    console.log('✅ OpenAI response:', output);

    res.json({ output });
  } catch (error) {
    console.error('❌ OpenAI API error:', error.response?.data || error.message);
    res.status(500).json({ error: '❌ Something went wrong with the OpenAI API request.' });
  }
});

app.get('/', (req, res) => {
  res.send('✨ Crush Analyzer backend is running!');
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
