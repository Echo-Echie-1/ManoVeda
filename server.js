const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { OpenAI } = require('openai');

const app = express();
const port = 3000;
app.use(cors());
app.use(bodyParser.json());

const openai = new OpenAI({ apiKey: 'sk-REPLACE_WITH_YOUR_KEY' });

app.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: message }],
      temperature: 0.7,
      max_tokens: 150
    });
    res.json({ reply: completion.choices[0].message.content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ reply: '😔 Something went wrong.' });
  }
});

app.listen(port, () => console.log(`✅ Server listening at http://localhost:${port}`));