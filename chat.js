// chat.js

const apiKey = "YOUR_NEW_API_KEY_HERE";  // 🔒 Replace with your regenerated key

async function sendMessage() {
  const userInput = document.getElementById("user-input").value;
  const responseBox = document.getElementById("response");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [{ role: "user", content: userInput }],
    }),
  });

  const data = await response.json();
  const aiMessage = data.choices?.[0]?.message?.content || "No response received.";

  responseBox.innerText = aiMessage;
}
