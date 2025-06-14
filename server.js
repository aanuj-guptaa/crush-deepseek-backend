const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());

app.post('/api/analyze', async (req, res) => {
  const { prompt } = req.body;
  try {
    const rsp = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'deepseek/deepseek-chat-v3-0324:free',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 500
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    const output = rsp.data.choices?.[0]?.message?.content || '⚠️ No response';
    res.json({ output });
  } catch (err) {
    console.error('OpenRouter error:', err.response?.data || err.message);
    res.status(500).json({ error: 'API error or possibly rate-limited.' });
  }
});

app.listen(PORT, () => console.log(`✅ Server listening on port ${PORT}`));
