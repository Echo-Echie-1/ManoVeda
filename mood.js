// mood.js
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

/* CONFIG — keep as provided */
const SUPABASE_URL = "https://vxknarwomlejxksmjinx.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4a25hcndvbWxlanhrc21qaW54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyNTAzMjcsImV4cCI6MjA4NTgyNjMyN30.EG9iRbnR98roL18qEL6zmJLKbbROc0mSPmNh1MZnBZ4";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* UI elements */
const usernameEl = document.getElementById("username");
const resultBox = document.getElementById("resultBox");
const detectedMoodEl = document.getElementById("detectedMood");
const adviceEl = document.getElementById("advice");
const resourcesEl = document.getElementById("resources");
const crisisBanner = document.getElementById("crisisBanner");
const detectedTimeEl = document.getElementById("detectedTime");

const EDGE_URL = `${SUPABASE_URL}/functions/v1/moodguesser-ai`;

/* load username from localStorage if exists */
const saved = JSON.parse(localStorage.getItem("manoveda_current")) || null;
if (saved?.name) {
  usernameEl.textContent = saved.name;
} else {
  usernameEl.textContent = "Friend";
}

/* helpers (same as before) */

function normalizeUrl(url) {
  if (!url) return null;
  url = url.trim();
  if (!/^https?:\/\//i.test(url)) {
    return "https://" + url.replace(/^\/+/, "");
  }
  return url;
}

function extractYouTubeId(url) {
  if (!url) return null;
  const patterns = [
    /(?:v=|\/vi\/|\/embed\/|youtu\.be\/|\/v\/)([A-Za-z0-9_-]{6,11})/,
    /youtube\.com\/shorts\/([A-Za-z0-9_-]{6,11})/
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m && m[1]) return m[1];
  }
  try {
    const u = new URL(url);
    const last = u.pathname.split("/").filter(Boolean).pop();
    if (last && /^[A-Za-z0-9_-]{6,11}$/.test(last)) return last;
  } catch (e) {}
  return null;
}

function ytWatchUrlFromId(id) {
  return id ? `https://www.youtube.com/watch?v=${id}` : null;
}
function ytThumbFromId(id) {
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}

function domainFromUrl(url) {
  try {
    const u = new URL(url);
    return u.hostname.replace("www.", "");
  } catch { return url; }
}

/* detect crisis (now considers age too) */
function detectCrisis(answers, aiMood, userInfo = {}) {
  const emotion = (answers.emotion || "").toLowerCase();
  const stress = (answers.stress || "").toLowerCase();
  const social = (answers.social || "").toLowerCase();
  const age = Number(userInfo.age) || 0;

  // heuristic: high risk if overwhelmed + sadness/anxiety + social withdrawal
  let risk = false;
  if ((emotion.includes("sad") || emotion.includes("anx") || aiMood?.toLowerCase?.()?.includes("suicidal")) &&
      (stress.includes("overwhelm") || stress.includes("very"))) {
    if (social.includes("yes") || social.includes("a little")) risk = true;
    // younger people with high stress are higher priority
    if (age > 0 && age <= 25 && stress.includes("very")) risk = true;
  }
  return risk;
}

/* render resources */
function renderResources(resources) {
  resourcesEl.innerHTML = "";

  (resources?.websites || []).forEach(raw => {
    const url = normalizeUrl(raw);
    if (!url) return;
    const el = document.createElement("div");
    el.className = "resource-site";
    el.innerHTML = `
      <div style="flex:1">
        <a href="${url}" target="_blank" rel="noopener noreferrer">${domainFromUrl(url)}</a>
        <div class="site-domain">${url}</div>
      </div>
    `;
    resourcesEl.appendChild(el);
  });

  (resources?.youtube || []).forEach(y => {
    let url = (typeof y === "string") ? y : (y?.url || "");
    url = url?.trim();
    const id = extractYouTubeId(url);
    const safeUrl = ytWatchUrlFromId(id) || normalizeUrl(url);
    const thumb = ytThumbFromId(id);

    const el = document.createElement("div");
    el.className = "resource-yt";
    el.innerHTML = `
      ${thumb ? `<img class="yt-thumb" src="${thumb}" alt="YouTube thumbnail" />` : ''}
      <div style="flex:1">
        <a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${id ? "Watch on YouTube" : url}</a>
        <div class="site-domain">${id ? ytWatchUrlFromId(id) : url}</div>
      </div>
    `;
    resourcesEl.appendChild(el);
  });

  if ((resources?.websites || []).length === 0 && (resources?.youtube || []).length === 0) {
    const el = document.createElement("div");
    el.className = "resource-site";
    el.innerHTML = `<div style="flex:1"><strong>No links returned.</strong><div class="muted-small">Try again or check the privacy link.</div></div>`;
    resourcesEl.appendChild(el);
  }
}

/* call Edge */
async function callEdge(user_info, answers) {
  const body = { user_info, answers };
  const res = await fetch(EDGE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

/* submit handler */
document.getElementById("moodForm").addEventListener("submit", async (ev) => {
  ev.preventDefault();

  // hide old result
  resultBox.classList.add("hidden");
  detectedMoodEl.textContent = "";
  adviceEl.textContent = "";
  resourcesEl.innerHTML = "";

  const form = ev.target;
  const formData = new FormData(form);
  const answers = Object.fromEntries(formData.entries());

  // separate user info fields (names used in HTML)
  const user_info = {
    name: answers.fullName || saved?.name || "Guest",
    email: answers.email || saved?.email || null,
    phone: answers.phone || saved?.phone || null,
    age: answers.age || saved?.age || null,
    state: answers.state || saved?.state || null,
    district: answers.district || saved?.district || null,
    city: answers.city || saved?.city || null,
    consent: !!formData.get("consent")
  };

  // remove personal items from answers so only checklist remains in answers object
  const checklist = {
    energy: answers.energy,
    thoughts: answers.thoughts,
    emotion: answers.emotion,
    stress: answers.stress,
    social: answers.social
  };

  // save to localStorage only if consent given
  if (user_info.consent) {
    const store = {
      name: user_info.name,
      email: user_info.email,
      phone: user_info.phone,
      age: user_info.age,
      state: user_info.state,
      district: user_info.district,
      city: user_info.city
    };
    localStorage.setItem("manoveda_current", JSON.stringify(store));
    usernameEl.textContent = store.name || "Friend";
  }

  // loading state
  const submitBtn = form.querySelector("button.primary");
  const prevText = submitBtn.textContent;
  submitBtn.textContent = "Analyzing...";
  submitBtn.disabled = true;

  let edgeResp;
  try {
    edgeResp = await callEdge(user_info, checklist);
  } catch (err) {
    console.error("Edge call failed", err);
    alert("Analysis failed — network error. Try again.");
    submitBtn.textContent = prevText;
    submitBtn.disabled = false;
    return;
  }

  const { ok, data } = edgeResp;
  if (!ok || !data) {
    console.error("Edge function error", data);
    alert("Analysis failed. Please try again.");
    submitBtn.textContent = prevText;
    submitBtn.disabled = false;
    return;
  }

  // get results (safe defaults)
  const mood = data?.mood || "Unknown";
  const advice = data?.advice || "Take a few slow deep breaths. You’re not alone.";
  const rawResources = data?.resources || { websites: [], youtube: [] };

  // render UI
  detectedMoodEl.textContent = mood;
  adviceEl.textContent = advice;
  detectedTimeEl.textContent = `Analyzed at ${new Date().toLocaleString()}`;

  // normalize resources for display and storage
  const normalizedWebsites = (rawResources.websites || []).map(normalizeUrl).filter(Boolean);
  const normalizedYt = (rawResources.youtube || []).map(y => {
    const asUrl = (typeof y === "string") ? y : (y?.url || "");
    const id = extractYouTubeId(asUrl);
    const url = ytWatchUrlFromId(id) || normalizeUrl(asUrl);
    return { id: id || null, url, thumbnail: id ? ytThumbFromId(id) : null };
  }).filter(Boolean);

  const simplifiedResources = {
    websites: normalizedWebsites,
    youtube: normalizedYt
  };

  // crisis heuristic (also ask Edge for support if provided)
  const crisisLocal = detectCrisis(checklist, mood, user_info);
  const crisisFromEdge = data?.support?.level === "crisis";
  const crisis = crisisLocal || crisisFromEdge;

  if (crisis) {
    crisisBanner.classList.remove("hidden");
    // If Edge returned helplines, show them — otherwise show local emergency
    const helplines = (data?.support?.helplines && data.support.helplines.length) ? data.support.helplines : [
      { name: "KIRAN (Govt of India)", phone: "1800-599-0019", website: "https://kiran.gov.in" }
    ];

    let html = `<div style="font-weight:700">If you feel you might harm yourself or are in immediate danger, please contact local emergency services right away.</div>`;
    helplines.forEach(h => {
      html += `<div style="margin-top:8px"><strong>${h.name}</strong> — <a href="tel:${h.phone.replace(/\s+/g,'')}" style="color:#fff;text-decoration:underline">${h.phone}</a> ${h.website ? `| <a href="${h.website}" target="_blank" style="color:#fff;text-decoration:underline">${h.website}</a>` : ''}</div>`;
    });
    crisisBanner.innerHTML = html;
  } else {
    crisisBanner.classList.add("hidden");
    crisisBanner.innerHTML = "";
  }

  renderResources(simplifiedResources);

  resultBox.classList.remove("hidden");

  // store into Supabase (clean shape)
  try {
    await supabase.from("mood_logs").insert({
      user_id: user_info.email || user_info.name || "guest",
      mood,
      answers: checklist,
      advice,
      user_info,
      resources: simplifiedResources,
      crisis,
      created_at: new Date().toISOString()
    });
  } catch (err) {
    console.error("Supabase insert failed", err);
  }

  // restore button
  submitBtn.textContent = prevText;
  submitBtn.disabled = false;
});

/* clear form */
document.getElementById("clearBtn").addEventListener("click", () => {
  document.getElementById("moodForm").reset();
  resultBox.classList.add("hidden");
  resourcesEl.innerHTML = "";
  crisisBanner.classList.add("hidden");
});
