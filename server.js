const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { OpenAI } = require("openai");

dotenv.config();

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// OpenAI Setup
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Sample Route
app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;

    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: userMessage }],
    });

    res.json({ reply: chatCompletion.choices[0].message.content });
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// Start Server
app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
