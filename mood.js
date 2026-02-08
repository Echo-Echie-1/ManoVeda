// mood.js
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

/* =========================
   CONFIG
========================= */
const SUPABASE_URL = "https://vxknarwomlejxksmjinx.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4a25hcndvbWxlanhrc21qaW54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyNTAzMjcsImV4cCI6MjA4NTgyNjMyN30.EG9iRbnR98roL18qEL6zmJLKbbROc0mSPmNh1MZnBZ4";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const EDGE_URL = `${SUPABASE_URL}/functions/v1/moodguesser-ai`;

/* =========================
   UI ELEMENTS
========================= */
const usernameEl = document.getElementById("username");
const resultBox = document.getElementById("resultBox");
const detectedMoodEl = document.getElementById("detectedMood");
const adviceEl = document.getElementById("advice");
const resourcesEl = document.getElementById("resources");
const crisisBanner = document.getElementById("crisisBanner");
const detectedTimeEl = document.getElementById("detectedTime");

/* =========================
   LOAD USER FROM STORAGE
========================= */
const saved = JSON.parse(localStorage.getItem("manoveda_current")) || null;
usernameEl.textContent = saved?.name || "Friend";

/* =========================
   HELPERS
========================= */
function normalizeUrl(url) {
  if (!url) return null;
  url = url.trim();
  if (!/^https?:\/\//i.test(url)) return "https://" + url;
  return url;
}

function extractYouTubeId(url) {
  if (!url) return null;
  const patterns = [
    /(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{6,11})/
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function ytWatchUrlFromId(id) {
  return id ? `https://www.youtube.com/watch?v=${id}` : null;
}

function ytThumbFromId(id) {
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}

/* =========================
   CRISIS HEURISTIC
========================= */
function detectCrisis(answers, mood, userInfo = {}) {
  const emotion = (answers.emotion || "").toLowerCase();
  const stress = (answers.stress || "").toLowerCase();
  const age = Number(userInfo.age) || 0;

  return (
    (emotion.includes("sad") || emotion.includes("anx")) &&
    stress.includes("very") &&
    age > 0 &&
    age <= 25
  );
}

/* =========================
   EDGE CALL
========================= */
async function callEdge(user_info, answers) {
  const res = await fetch(EDGE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ user_info, answers }),
  });

  return { ok: res.ok, data: await res.json() };
}

/* =========================
   FORM SUBMIT
========================= */
document.getElementById("moodForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  resultBox.classList.add("hidden");
  crisisBanner.classList.add("hidden");

  const form = e.target;
  const fd = new FormData(form);
  const data = Object.fromEntries(fd.entries());

  const user_info = {
    name: data.fullName || saved?.name || "Guest",
    email: data.email || saved?.email || null,
    phone: data.phone || saved?.phone || null,
    age: data.age || saved?.age || null,
    state: data.state || saved?.state || null,
    district: data.district || saved?.district || null,
    city: data.city || saved?.city || null,
    consent: !!fd.get("consent"),
  };

  const checklist = {
    energy: data.energy,
    thoughts: data.thoughts,
    emotion: data.emotion,
    stress: data.stress,
    social: data.social,
  };

  if (user_info.consent) {
    localStorage.setItem(
      "manoveda_current",
      JSON.stringify(user_info)
    );
  }

  const btn = form.querySelector("button.primary");
  btn.disabled = true;
  btn.textContent = "Analyzing...";

  const { ok, data: ai } = await callEdge(user_info, checklist);

  if (!ok) {
    alert("Analysis failed");
    btn.disabled = false;
    btn.textContent = "Submit";
    return;
  }

  detectedMoodEl.textContent = ai.mood;
  adviceEl.textContent = ai.advice;
  detectedTimeEl.textContent = new Date().toLocaleString();

  const resources = {
    websites: (ai.resources?.websites || []).map(normalizeUrl),
    youtube: (ai.resources?.youtube || []).map((u) => {
      const id = extractYouTubeId(u);
      return {
        id,
        url: ytWatchUrlFromId(id) || normalizeUrl(u),
        thumbnail: ytThumbFromId(id),
      };
    }),
  };

  const crisis = detectCrisis(checklist, ai.mood, user_info);

  if (crisis) {
    crisisBanner.classList.remove("hidden");
    crisisBanner.innerHTML =
      "If you feel unsafe, please contact KIRAN Helpline: <b>1800-599-0019</b>";
  }

  /* =========================
     ✅ FIXED SUPABASE INSERT
  ========================= */
  await supabase.from("mood_logs").insert({
    user_id: user_info.email || user_info.name || "guest",

    full_name: user_info.name,
    email: user_info.email,
    phone: user_info.phone,
    age: user_info.age ? Number(user_info.age) : null,
    state: user_info.state,
    district: user_info.district,
    city: user_info.city,
    consent: user_info.consent,

    mood: ai.mood,
    advice: ai.advice,
    answers: checklist,
    resources,
    crisis,
  });

  resultBox.classList.remove("hidden");
  btn.disabled = false;
  btn.textContent = "Submit";
});

/* =========================
   CLEAR
========================= */
document.getElementById("clearBtn").addEventListener("click", () => {
  document.getElementById("moodForm").reset();
  resultBox.classList.add("hidden");
  crisisBanner.classList.add("hidden");
});
