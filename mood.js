// ✅ Show user’s name
window.onload = () => {
  const user = JSON.parse(localStorage.getItem("manoveda_current"));
  if (user) {
    document.getElementById("username").textContent = user.name;
  }
};

// ✅ Mood map for icons & quotes
const moodMap = {
  happy: { icon: "😊", quote: "Happiness is a warm smile." },
  sad: { icon: "😔", quote: "It’s okay to feel sad. This too shall pass." },
  stressed: { icon: "😣", quote: "Take a deep breath. You’re doing your best." },
  angry: { icon: "😡", quote: "Let it out. Then breathe in calm." },
  excited: { icon: "🤩", quote: "Energy is contagious. Spread the joy!" },
  fear: { icon: "😨", quote: "Fear is natural. Let courage rise." },
  neutral: { icon: "😐", quote: "Everything feels balanced right now." }
};

// ✅ Emotion → Mood mapping
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

// ✅ HuggingFace AI call
async function detectMoodFromAI(text) {
  const response = await query({ inputs: text });
  if (!Array.isArray(response) || response.length === 0) return "unknown";

  let topEmotion = "unknown";
  let maxScore = 0;

  for (let e of response[0]) {
    if (e.score > maxScore) {
      topEmotion = e.label;
      maxScore = e.score;
    }
  }

  return emotionToMood[topEmotion] || "unknown";
}

// ✅ Integrated query function
async function query(data) {
  const response = await fetch(
    "https://router.huggingface.co/hf-inference/models/SamLowe/roberta-base-go_emotions",
    {
      headers: {
        Authorization: "Bearer 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",
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify(data),
    }
  );
  const result = await response.json();
  return result;
}

// ✅ Analyze button
document.getElementById("analyzeBtn").addEventListener("click", async () => {
  const text = document.getElementById("userInput").value.trim();
  const resultBox = document.getElementById("resultBox");
  const moodSpan = document.getElementById("detectedMood");
  const moodIcon = document.getElementById("moodIcon");
  const quote = document.getElementById("quote");
  const audio = document.getElementById("moodAudio");

  if (text === "") {
    alert("Please type something first.");
    return;
  }

  // Reset display
  resultBox.classList.remove("hidden");
  moodSpan.textContent = "Detecting...";
  moodIcon.textContent = "🔍";
  quote.textContent = "";
  audio.style.display = "none";

  // ✅ Detect Mood
  const mood = await detectMoodFromAI(text);

  if (mood !== "unknown") {
    const moodData = moodMap[mood];
    moodSpan.textContent = capitalize(mood);
    moodIcon.textContent = moodData.icon;
    quote.textContent = moodData.quote;

    audio.src = `assets/audio/${mood}.mp3`;
    audio.style.display = "block";
    audio.play();

    // ✅ Store in Firebase
    saveMoodToFirebase(text, mood);
    localStorage.setItem("latestMood", mood);
  } else {
    moodSpan.textContent = "Unknown";
    moodIcon.textContent = "❓";
    quote.textContent = "Hmm... we couldn’t detect your mood. Try another sentence?";
    audio.style.display = "none";
  }
});

// ✅ Save mood to Firestore
function saveMoodToFirebase(input, mood) {
  const user = JSON.parse(localStorage.getItem("manoveda_current")) || { name: "guest" };

  const moodEntry = {
    userId: user.name,
    date: new Date().toISOString().split("T")[0], // for calendar
    timestamp: firebase.firestore.FieldValue.serverTimestamp(), // ✅ real timestamp for sorting
    input: input,
    mood: mood,
    quote: moodMap[mood].quote
  };

  db.collection("ManoVedaMoods").add(moodEntry)
    .then(() => console.log("✅ Mood saved to Firebase!"))
    .catch(err => console.error("❌ Error saving mood:", err));
}

// ✅ Utility
function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}
