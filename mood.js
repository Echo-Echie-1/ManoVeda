import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

/* 🔐 Supabase Config */
const SUPABASE_URL = "https://vxknarwomlejxksmjinx.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4a25hcndvbWxlanhrc21qaW54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyNTAzMjcsImV4cCI6MjA4NTgyNjMyN30.EG9iRbnR98roL18qEL6zmJLKbbROc0mSPmNh1MZnBZ4";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* 👤 Load user */
const user =
  JSON.parse(localStorage.getItem("manoveda_current")) || { name: "guest" };

document.getElementById("username").textContent = user.name;

/* 🧠 Handle form submit */
document.getElementById("moodForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(e.target);
  const answers = Object.fromEntries(formData.entries());

  let data;

  try {
    const res = await fetch(
      "https://vxknarwomlejxksmjinx.supabase.co/functions/v1/moodguesser-ai",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          user_id: user.name,
          answers
        })
      }
    );

    data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "AI request failed");
    }
  } catch (err) {
    alert("Mood analysis failed. Please try again.");
    console.error(err);
    return;
  }

  /* 🖥 UI update */
  document.getElementById("resultBox").classList.remove("hidden");
  document.getElementById("detectedMood").textContent = data.mood;
  document.getElementById("advice").textContent = data.advice;

  const list = document.getElementById("resources");
  list.innerHTML = "";

  (data.resources?.websites || []).forEach((url) => {
    list.innerHTML += `<li><a href="${url}" target="_blank">${url}</a></li>`;
  });

  (data.resources?.youtube || []).forEach((url) => {
    list.innerHTML += `<li><a href="${url}" target="_blank">${url}</a></li>`;
  });

  /* 💾 Save mood log */
  await supabase.from("mood_logs").insert({
    user_id: user.name,
    mood: data.mood,
    answers,
    advice: data.advice,
    resources: data.resources
  });
});
