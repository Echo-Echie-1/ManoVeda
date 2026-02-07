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

/* load username */
const user = JSON.parse(localStorage.getItem("manoveda_current")) || { name: "Guest" };
usernameEl.textContent = user.name || "Guest";

/* helpers */

// ensure website has protocol
function normalizeUrl(url) {
  if (!url) return null;
  url = url.trim();
  if (!/^https?:\/\//i.test(url)) {
    return "https://" + url.replace(/^\/+/, "");
  }
  return url;
}

// extract YouTube video id from many possible forms
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
  // fallback: last path segment if looks like id
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

/* basic crisis detection heuristic using checklist */
function detectCrisis(answers, aiMood) {
  const emotion = (answers.emotion || "").toLowerCase();
  const stress = (answers.stress || "").toLowerCase();
  const social = (answers.social || "").toLowerCase();

  // heuristic: high risk if overwhelmed + sadness or anxiety + social withdrawal
  if ((emotion.includes("sad") || emotion.includes("anx") || aiMood?.toLowerCase?.()?.includes("suicidal")) &&
      (stress.includes("overwhelm") || stress.includes("very")) &&
      (social.includes("yes") || social.includes("a little"))) {
    return true;
  }
  return false;
}

/* render resources to UI */
function renderResources(resources) {
  resourcesEl.innerHTML = "";

  // websites
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
      <div style="opacity:0.9; font-size:0.9rem; color:var(--muted)"></div>
    `;
    resourcesEl.appendChild(el);
  });

  // youtube
  (resources?.youtube || []).forEach(y => {
    // accept either string url or object {id,url}
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

  // fallback if nothing
  if ((resources?.websites || []).length === 0 && (resources?.youtube || []).length === 0) {
    const el = document.createElement("div");
    el.className = "resource-site";
    el.innerHTML = `<div style="flex:1"><strong>No links returned.</strong><div class="muted-small">We tried — but no links were available. Try again or contact support.</div></div>`;
    resourcesEl.appendChild(el);
  }
}

/* safe fetch to Edge function */
async function callEdge(answers) {
  const body = { user_id: user.name || "guest", answers };
  const res = await fetch(EDGE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // keep anon key so Supabase accepts the function call (your project uses RLS)
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
  resultBox.classList.add("hidden");
  detectedMoodEl.textContent = "";
  adviceEl.textContent = "";
  resourcesEl.innerHTML = "";

  const form = ev.target;
  const formData = new FormData(form);
  const answers = Object.fromEntries(formData.entries());

  // show a small loading state
  const submitBtn = form.querySelector("button.primary");
  const prevText = submitBtn.textContent;
  submitBtn.textContent = "Analyzing...";
  submitBtn.disabled = true;

  let edgeResp;
  try {
    edgeResp = await callEdge(answers);
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

  // data contains mood/advice/resources or error wrapper
  const mood = data?.mood || "Unknown";
  const advice = data?.advice || "Take a few slow deep breaths. You’re not alone.";
  const rawResources = data?.resources || { websites: [], youtube: [] };

  // render UI
  detectedMoodEl.textContent = mood;
  adviceEl.textContent = advice;
  detectedTimeEl.textContent = `Analyzed at ${new Date().toLocaleString()}`;

  // normalize & create simplified resources structure for storage
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

  // show crisis banner if heuristic matches
  const crisis = detectCrisis(answers, mood);
  if (crisis) {
    crisisBanner.classList.remove("hidden");
    crisisBanner.innerHTML = `
      If you feel you might harm yourself or are in immediate danger, please contact local emergency services right away.
      <div style="margin-top:8px;font-weight:600;">
        India: <a href="tel:9152290000" style="color:#fff;text-decoration:underline">91522-90000</a> |
        International: <a href="https://www.opencounseling.com/suicide-hotlines" target="_blank" style="color:#fff;text-decoration:underline">Find help</a>
      </div>`;
  } else {
    crisisBanner.classList.add("hidden");
    crisisBanner.innerHTML = "";
  }

  renderResources(simplifiedResources);

  resultBox.classList.remove("hidden");

  // store into Supabase mood_logs table (clean shape)
  try {
    await supabase.from("mood_logs").insert({
      user_id: user.name,
      mood,
      answers,
      advice,
      resources: simplifiedResources,
      crisis: crisis,
      created_at: new Date().toISOString()
    });
  } catch (err) {
    // don't block UX on DB failure - log for debugging
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
