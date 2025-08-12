window.onload = () => {
  const user = JSON.parse(localStorage.getItem("manoveda_current"));
  if (user) {
    document.getElementById("username").textContent = user.name || "Guest";
  }
};

// Mood map for icons & quotes
const moodMap = {
  happy: { icon: "😊", quote: "Happiness is a warm smile." },
  sad: { icon: "😔", quote: "It’s okay to feel sad. This too shall pass." },
  stressed: { icon: "😣", quote: "Take a deep breath. You’re doing your best." },
  angry: { icon: "😡", quote: "Let it out. Then breathe in calm." },
  excited: { icon: "🤩", quote: "Energy is contagious. Spread the joy!" },
  fear: { icon: "😨", quote: "Fear is natural. Let courage rise." },
  neutral: { icon: "😐", quote: "Everything feels balanced right now." },
  unknown: { icon: "❓", quote: "Hmm... we couldn’t detect your mood. Try another sentence?" }
};

// Emotion → Mood mapping
const emotionToMood = {
  joy: "happy", amusement: "happy", gratitude: "happy",
  pride: "happy", relief: "happy", love: "happy", approval: "happy",
  excitement: "excited", optimism: "excited", curiosity: "excited", anticipation: "excited",
  sadness: "sad", disappointment: "sad", grief: "sad", embarrassment: "sad", remorse: "sad",
  nervousness: "stressed", anxiety: "stressed", confusion: "stressed", distress: "stressed", stressed: "stressed",
  fear: "fear",
  anger: "angry", annoyance: "angry", disapproval: "angry", disgust: "angry",
  realization: "neutral", neutral: "neutral"
};

// HuggingFace AI call for mood detection
async function detectMoodFromAI(text) {
  try {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/SamLowe/roberta-base-go_emotions",
      {
        method: "POST",
        headers: {
          Authorization: "Bearer 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",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ inputs: text })
      }
    );

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const result = await response.json();
    if (!Array.isArray(result) || result.length === 0) return "unknown";

    let topEmotion = "unknown";
    let maxScore = 0;

    for (let e of result[0]) {
      if (e.score > maxScore) {
        topEmotion = e.label;
        maxScore = e.score;
      }
    }

    return emotionToMood[topEmotion] || "unknown";
  } catch (error) {
    console.error("❌ Error detecting mood:", error);
    return "unknown";
  }
}

// xAI API call for conversational responses
async function getConversationalResponse(text) {
  try {
    const response = await fetch("https://api.x.ai/grok/converse", {
      method: "POST",
      headers: {
        Authorization: "Bearer xai_dummy_token", // Replace with actual xAI API token
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ query: text })
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const data = await response.json();
    return data.response || "I couldn't find an answer to that. Try something else?";
  } catch (error) {
    console.error("❌ Error fetching conversational response:", error);
    return "Sorry, I couldn't process your query right now. Please try again.";
  }
}

// Analyze button
document.getElementById("analyzeBtn").addEventListener("click", async () => {
  const text = document.getElementById("userInput").value.trim();
  const resultBox = document.getElementById("resultBox");
  const moodSpan = document.getElementById("detectedMood");
  const moodIcon = document.getElementById("moodIcon");
  const quote = document.getElementById("quote");
  const audio = document.getElementById("moodAudio");
  const responseText = document.getElementById("responseText") || createResponseTextElement();

  if (text === "") {
    alert("Please type something first.");
    return;
  }

  // Reset display
  resultBox.classList.remove("hidden");
  moodSpan.textContent = "Detecting...";
  moodIcon.textContent = "🔍";
  quote.textContent = "";
  responseText.textContent = "Processing your query...";
  audio.style.display = "none";

  // Detect mood and get conversational response concurrently
  const [mood, aiResponse] = await Promise.all([
    detectMoodFromAI(text),
    getConversationalResponse(text)
  ]);

  // Update UI with mood
  const moodData = moodMap[mood] || moodMap["unknown"];
  moodSpan.textContent = capitalize(mood);
  moodIcon.textContent = moodData.icon;
  quote.textContent = moodData.quote;

  // Play audio if mood is detected
  if (mood !== "unknown") {
    audio.src = `assets/audio/${mood}.mp3`;
    audio.style.display = "block";
    audio.play().catch(err => console.error("❌ Audio playback error:", err));
  } else {
    audio.style.display = "none";
  }

  // Display conversational response
  responseText.textContent = aiResponse;

  // Store in Firebase if mood is detected
  if (mood !== "unknown") {
    saveMoodToFirebase(text, mood, aiResponse);
    localStorage.setItem("latestMood", mood);
  }
});

// Create response text element if it doesn't exist
function createResponseTextElement() {
  const responseText = document.createElement("p");
  responseText.id = "responseText";
  responseText.className = "mt-4 text-gray-700";
  document.getElementById("resultBox").appendChild(responseText);
  return responseText;
}

// Save mood and response to Firestore
function saveMoodToFirebase(input, mood, aiResponse) {
  const user = JSON.parse(localStorage.getItem("manoveda_current")) || { name: "guest" };

  const moodEntry = {
    userId: user.name,
    date: new Date().toISOString().split("T")[0],
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    input: input,
    mood: mood,
    quote: moodMap[mood]?.quote || "No quote available",
    aiResponse: aiResponse
  };

  db.collection("ManoVedaMoods").add(moodEntry)
    .then(() => console.log("✅ Mood and response saved to Firebase!"))
    .catch(err => console.error("❌ Error saving to Firebase:", err));
}

// Utility
function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

// Handle specific sensitive inputs
function isSensitiveInput(text) {
  const sensitivePhrases = ["i want to die", "suicide", "kill myself"];
  return sensitivePhrases.some(phrase => text.toLowerCase().includes(phrase));
}

document.getElementById("userInput").addEventListener("input", (event) => {
  const text = event.target.value.trim();
  if (isSensitiveInput(text)) {
    const responseText = document.getElementById("responseText") || createResponseTextElement();
    responseText.textContent = "I'm really sorry you're feeling this way. You're not alone, and help is available. Please consider reaching out to a trusted friend or a professional at a helpline like 988 (US) or a local support service.";
    document.getElementById("resultBox").classList.remove("hidden");
  }
});