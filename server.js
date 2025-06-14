require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

app.post('/api/analyze', async (req, res) => {
  const prompt = req.body.prompt;
  const apiKey = process.env.HUGGINGFACE_API_KEY;

  try {
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/deepseek/deepseek-r1-0528',
      {
        inputs: prompt,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    const output = response.data?.[0]?.generated_text || 'No response generated.';
    res.json({ output });
  } catch (error) {
    console.error('Hugging Face API error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Something went wrong with the Hugging Face API.' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
