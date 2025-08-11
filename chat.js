const chatBox = document.getElementById("chatBox");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");

let moodMemory = null; // Store previous detected emotion
const username = localStorage.getItem("username") || "Friend";

// Expanded keywords per emotion and conversational category
const emotionKeywords = {
  sad: ["sad", "cry", "crying", "unhappy", "hurt", "lost", "pain", "down", "depressed", "feeling like death", "heartbroken", "miserable", "hopeless", "devastated", "broken"],
  happy: ["happy", "joy", "excited", "great", "awesome", "smile", "cheerful", "fantastic", "thrilled", "overjoyed", "yay", "ecstatic", "wonderful", "amazing"],
  stressed: ["stress", "tired", "overwhelmed", "pressure", "deadline", "burnt", "exhausted", "swamped", "stressed out", "worn out", "overloaded", "burned out"],
  angry: ["angry", "mad", "furious", "irritated", "annoyed", "rage", "pissed", "frustrated", "upset", "livid", "enraged", "infuriated"],
  anxious: ["anxious", "nervous", "worried", "panic", "fear", "shaky", "scared", "terrified", "on edge", "freaking out", "panicking", "uneasy"],
  lonely: ["lonely", "alone", "isolated", "no one", "empty", "left out", "abandoned", "lonesome", "by myself", "nobody", "solitary"],
  motivated: ["motivate", "encourage", "inspire", "push me", "lift me", "ready", "pumped", "fired up", "determined", "driven", "ambitious"],
  bored: ["bored", "nothing", "dull", "lazy", "meh", "boring", "stuck", "nothing to do", "boredom", "uninterested", "idk what to do"],
  confused: ["confused", "unclear", "don’t know", "unsure", "lost", "puzzled", "mixed up", "what", "huh", "idk", "not sure", "perplexed"],
  neutral: ["okay", "fine", "neutral", "alright", "normal", "so-so", "not much", "just chilling", "whatever", "all good"],
  grateful: ["thankful", "grateful", "appreciate", "blessed", "thank you", "gratitude", "thanks", "appreciative", "thank goodness"],
  curious: ["curious", "wonder", "what’s", "why", "how", "question", "interested", "intrigued", "curiosity", "what is", "tell me about"],
  frustrated: ["frustrated", "stuck", "can’t", "difficult", "problem", "trouble", "annoying", "not working", "irritating", "messed up"],
  tired: ["tired", "sleepy", "exhausted", "worn out", "fatigued", "drained", "no energy", "beat", "knackered", "weary"],
  greeting: ["hello", "hi", "hey", "hola", "greetings", "what’s up", "yo", "sup", "howdy", "good morning", "good evening"],
  question: ["who are you", "what are you", "why are you", "what is this", "who is this", "what’s going on", "why is", "how is", "what do you", "who’s", "what can you"],
  unclear: ["??", "???", "what?", "huh?", "idk", "not sure", "random", "weird", "no idea", "confusing", "uh", "umm"]
};

// Expanded emotion and conversational responses
const emotionResponses = {
  sad: [
    "I'm really sorry you're feeling this way, {name}. 🌧️ You’re not alone.",
    "Let it out, {name}. I’m here for you — no judgment 💙",
    "It’s okay to feel down. You are deeply valued, even in silence. 🫂",
    "Feeling like-death is heavy. I’m here to sit with you through this 💔",
    "Heartbreak hurts. Let’s take it one moment at a time, okay? 🌙",
    "I’m here for you, {name}. Your pain matters, and so do you 💧",
    "It’s tough to feel this way. Want to share a bit more? 🕊️"
  ],
  happy: [
    "That's amazing, {name}! 😊 Keep shining your light!",
    "Joy suits you well! 🌞 Spread that good energy!",
    "So glad to hear that! Let’s enjoy the happy moments 🌈",
    "Your excitement is contagious, {name}! 🎉",
    "Overjoyed vibes? Love that for you! 🚀",
    "You’re glowing, {name}! What’s got you so thrilled? 🌟",
    "Happiness looks great on you! Let’s keep it going! 😄"
  ],
  stressed: [
    "One breath at a time, {name}. You're doing better than you think 🌿",
    "It's okay to pause. You deserve rest too 🧘",
    "Stress is loud. Let’s find some quiet together. 💧",
    "Feeling swamped? You’re stronger than this moment feels 🌳",
    "Let’s take a second to breathe through the chaos, okay? 🌬️",
    "You’re carrying a lot, {name}. Let’s lighten the load together 🕊️",
    "Stress can feel endless, but you’re tougher than it. I’m here 💪"
  ],
  angry: [
    "Anger means something mattered. Want to tell me what happened? 🔥",
    "Let’s cool down together, {name}. Deep breath in... and out 🌊",
    "It's alright to feel this way. I’m listening. 🙏",
    "Frustration can be loud. Let’s find some calm together ⚖️",
    "I hear you, {name}. Let’s unpack that anger a bit 🌋",
    "You’re allowed to be mad. Want to talk it through? 💥",
    "Anger’s a signal — let’s figure out what’s sparking it, {name} 🔥"
  ],
  anxious: [
    "Let’s ground ourselves, {name}. You are safe right now 🌱",
    "Anxiety comes and goes. I’ll stay while it passes 💙",
    "You’re not alone. I’m proud of you for sharing this 🌼",
    "Feeling on edge? Let’s focus on one thing at a time 🌟",
    "I’m right here with you, {name}. Let’s breathe through this 🕊️",
    "Anxiety’s tough, but you’re tougher. I’ve got you 💪",
    "Let’s take it slow, {name}. You’re safe with me 🌙"
  ],
  lonely: [
    "I’m here, {name}. Truly. Even if it's through these words 🫂",
    "Let’s chat more. I’ll sit with you in this space 💬",
    "You matter — even when you feel unseen. 🌌",
    "Feeling alone is tough. I’m here to keep you company 💞",
    "You’re not as alone as you feel, {name}. I see you 🌠",
    "Loneliness stings, but I’m right here for you, {name} 💙",
    "Let’s fill this moment with a little connection, okay? 🌈"
  ],
  motivated: [
    "You’ve got this, {name}! 💪 Let’s turn spark into action 🔥",
    "Your courage is showing, just by reaching out. Keep going 🌟",
    "Let’s take one small step together. Momentum begins now 🛤️",
    "That fire in you is inspiring, {name}! Let’s do this 🚀",
    "Ready to conquer? I’m cheering you on! 🎯",
    "Your drive is electric, {name}! What’s the next step? ⚡",
    "Keep that momentum, {name}! You’re unstoppable 🌋"
  ],
  bored: [
    "Maybe try a 5-minute doodle challenge? ✏️ It helps more than you think!",
    "Stretch. Blink. Smile. Sometimes boredom is just paused energy 🔄",
    "How about sharing a random thought with me? 🤔",
    "Boredom’s a signal — let’s find something fun to talk about! 🎲",
    "Let’s spark something new, {name}. Got any wild ideas? ✨",
    "Nothing to do? Let’s make up a quick story together! 📚",
    "Bored, huh? How about a random question — favorite snack? 🍪"
  ],
  confused: [
    "Let’s break it down together, {name}. Start with what you *do* know 🧩",
    "You don’t need to have all the answers. One step at a time 🪜",
    "Want to ask me a simpler version? I’ll try again! 🔄",
    "Confusion’s just a puzzle waiting to be solved. Let’s try together 🕵️",
    "It’s okay to feel lost. We’ll find clarity, {name} 🧠",
    "Let’s take it slow — what’s got you puzzled? 🤔",
    "No need to have it all figured out. I’m here to help sort it 🔍"
  ],
  neutral: [
    "Got it. Even ‘meh’ moods are valid. 🌤️",
    "I’m still here if you want to talk more, {name} 😊",
    "Alright, take your time. I’ll be right here 🕊️",
    "Just chilling? I’m here for that vibe too 🛋️",
    "No pressure, {name}. What’s on your mind? 🌬️",
    "All good, {name}. Ready to dive into something fun? 🎈",
    "Keeping it chill? I’m down for that, {name} 😎"
  ],
  grateful: [
    "That’s beautiful, {name}! Gratitude really lights up the heart 💖",
    "I’m so glad you’re feeling thankful. Want to share more? 🌼",
    "Your positivity is a gift, {name}. Keep spreading it! 🎁",
    "Appreciating the little things? That’s powerful! 🌟",
    "Thanks for sharing that warmth, {name}! 🙏",
    "Gratitude vibes are the best, {name}! What’s got you thankful? 😊",
    "Your thankful heart is inspiring, {name}! 🌈"
  ],
  curious: [
    "Love that curiosity, {name}! What’s sparking your interest? 🔍",
    "Questions are the best! Let’s explore that together 🧐",
    "What’s on your mind? I’m ready to dive in with you 🌍",
    "Curiosity is a superpower, {name}! What’s next? 🚀",
    "Let’s chase that ‘why’ together! 🕵️‍♂️",
    "What’s got you wondering, {name}? I’m all ears! 👂",
    "Curious minds are my favorite! Let’s dig in, {name} 🌟"
  ],
  frustrated: [
    "Frustration’s tough, {name}. Want to talk through what’s stuck? 🛠️",
    "I hear you. Let’s take a step back and tackle this together 🔧",
    "It’s okay to feel blocked. We’ll find a way through, {name} 💪",
    "That’s a lot to carry. Let’s sort it out bit by bit 🌈",
    "You’re not alone in this, {name}. I’m here to help 🧩",
    "When things feel stuck, let’s find a new angle together 🔄",
    "Frustration’s rough, but you’re tougher, {name}! Let’s do this 🛡️"
  ],
  tired: [
    "You sound exhausted, {name}. It’s okay to rest now 🛌",
    "No energy? That’s okay — let’s just chat softly 🌙",
    "You’ve been carrying a lot. Take a moment to breathe 💤",
    "Tiredness is a signal to slow down. I’m here with you 🕯️",
    "Rest up, {name}. You deserve some calm 🌜",
    "Feeling drained? Let’s keep it low-key, {name} 😴",
    "You’re allowed to pause, {name}. I’m here for you 🌌"
  ],
  greeting: [
    "Hey {name}! So nice to hear from you! 😊 What’s up?",
    "Hello there, {name}! Ready to chat? 👋",
    "Yo, {name}! What’s good today? 🌟",
    "Hi {name}! How’s your day going? 🕊️",
    "Greetings, {name}! I’m all ears — what’s on your mind? 💬",
    "Howdy, {name}! What’s the vibe today? 😎",
    "Sup, {name}! Let’s make this chat fun! 🎉"
  ],
  question: [
    "I’m ManoSathi, your friendly chat buddy, {name}! 😊 Here to listen and help. What’s up?",
    "Good question, {name}! I’m a chatbot built to support you with a kind ear. What’s on your mind? 💬",
    "Who am I? Just your virtual pal, {name}, here to chat and lift your spirits! 🌟 What’s next?",
    "I’m here to answer with care, {name}. What do you want to explore? 🔍",
    "You’re curious, huh? I’m ManoSathi, made to chat and connect. What’s your next question? 🧐",
    "I’m your go-to listener, {name}! What’s got you asking? 😄",
    "Wondering about me? I’m a friendly bot here for you, {name}. Let’s talk more! 🌈"
  ],
  unclear: [
    "Hmm, I didn’t quite catch that, {name}. Wanna try again? 🤔",
    "That’s a bit of a mystery! 😄 Can you say it another way, {name}?",
    "Whoa, you got me puzzled, {name}! Let’s clarify — what’s up? 🧩",
    "Not sure what you mean, but I’m here for it, {name}! Try again? 🌟",
    "That’s an interesting one! Can you give me a bit more, {name}? 💬",
    "My brain’s doing a flip! 😅 What’s on your mind, {name}?",
    "Let’s decode that together, {name}. Got another way to say it? 🔍"
  ],
  unknown: [
    "Hmm, I didn’t get that. Want to say it differently? 🤔",
    "Tell me more, {name}. I want to understand you better 🧡",
    "That’s a big feeling. Let’s try talking about it gently 🌸",
    "I’m not sure I caught that — let’s try again, {name}? 😊",
    "You’ve got my attention! Can you share a bit more? 🌟",
    "That’s a new one for me, {name}! Let’s dive deeper 🕵️",
    "Not quite sure what you mean, but I’m here for you, {name}! 💬"
  ]
};

// Typing simulation
function simulateTyping(callback) {
  const typingMsg = document.createElement("div");
  typingMsg.classList.add("message", "bot-message", "typing");
  typingMsg.textContent = "Typing...";
  chatBox.appendChild(typingMsg);
  chatBox.scrollTop = chatBox.scrollHeight;

  setTimeout(() => {
    typingMsg.remove();
    callback();
  }, 1000 + Math.random() * 1000);
}

// Detect emotion from input
function detectEmotion(input) {
  const msg = input.toLowerCase();
  for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
    if (keywords.some(word => msg.includes(word))) {
      moodMemory = emotion;
      return emotion;
    }
  }
  return "unknown";
}

// Format reply
function getReply(emotion) {
  const responses = emotionResponses[emotion] || emotionResponses["unknown"];
  const reply = responses[Math.floor(Math.random() * responses.length)];
  return reply.replace("{name}", username);
}

// Display message
function addMessage(text, sender = "user") {
  const msg = document.createElement("div");
  msg.classList.add("message", sender === "user" ? "user-message" : "bot-message");
  msg.textContent = text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Main chat handler
function sendMessage() {
  const input = userInput.value.trim();
  if (!input) return;

  addMessage(input, "user");
  userInput.value = "";

  const emotion = detectEmotion(input);
  const reply = getReply(emotion);

  simulateTyping(() => {
    addMessage(reply, "bot");
  });
}

// Events
sendBtn.addEventListener("click", sendMessage);
userInput.addEventListener("keypress", e => {
  if (e.key === "Enter") sendMessage();
});

// Greet user
window.onload = () => {
  simulateTyping(() => {
    addMessage(`Hi ${username}! 👋 How are you feeling today?`, "bot");
  });
};
