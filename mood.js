import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

/* 🔐 SUPABASE CONFIG */
const SUPABASE_URL = "https://vxknarwomlejxksmjinx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4a25hcndvbWxlanhrc21qaW54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyNTAzMjcsImV4cCI6MjA4NTgyNjMyN30.EG9iRbnR98roL18qEL6zmJLKbbROc0mSPmNh1MZnBZ4";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* 👤 Load username */
window.onload = () => {
  const user = JSON.parse(localStorage.getItem("manoveda_current"));
  if (user?.name) {
    document.getElementById("username").textContent = user.name;
  }
};

/* 🧠 Handle form submit */
document.getElementById("moodForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(e.target);
  const answers = Object.fromEntries(formData.entries());

  const user = JSON.parse(localStorage.getItem("manoveda_current")) || { name: "guest" };

  // 🔹 Call Edge Function
  const response = await fetch(
    "https://vxknarwomlejxksmjinx.supabase.co/functions/v1/moodguesser-ai",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: user.name,
        answers
      })
    }
  );

  const data = await response.json();

  // 🔹 UI Update
  document.getElementById("resultBox").classList.remove("hidden");
  document.getElementById("detectedMood").textContent = data.mood;
  document.getElementById("advice").textContent = data.advice;

  const resourceList = document.getElementById("resources");
  resourceList.innerHTML = "";

  data.resources.websites.forEach(site => {
    resourceList.innerHTML += `<li><a href="${site}" target="_blank">${site}</a></li>`;
  });

  data.resources.youtube.forEach(video => {
    resourceList.innerHTML += `<li><a href="${video}" target="_blank">${video}</a></li>`;
  });

  // 💾 STORE IN SUPABASE (PER USER, EVERY TIME)
  await supabase.from("mood_logs").insert({
    user_id: user.name,
    mood: data.mood,
    answers: answers,
    advice: data.advice,
    resources: data.resources
  });
});
