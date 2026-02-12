import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

/* 🔐 Supabase config */
const SUPABASE_URL = "https://vxknarwomlejxksmjinx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4a25hcndvbWxlanhrc21qaW54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyNTAzMjcsImV4cCI6MjA4NTgyNjMyN30.EG9iRbnR98roL18qEL6zmJLKbbROc0mSPmNh1MZnBZ4";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const historyEl = document.getElementById("history");

// Load history on page open
loadHistory();

async function loadHistory() {
  // 1️⃣ Get logged-in user
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user || authError) {
    historyEl.innerHTML = `<p class="empty">Please login to view your emotional history.</p>`;
    return;
  }

  // 2️⃣ Fetch mood logs for this user
  const { data, error } = await supabase
    .from("mood_logs")
    .select(`
      id,
      mood,
      advice,
      answers,
      crisis,
      created_at
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    historyEl.innerHTML = `<p class="empty">Failed to load history.</p>`;
    return;
  }

  if (!data || data.length === 0) {
    historyEl.innerHTML = `<p class="empty">No emotional records yet 🌱</p>`;
    return;
  }

  historyEl.innerHTML = "";

  // 3️⃣ Render entries
  data.forEach(log => {
    const entry = document.createElement("div");
    entry.className = `entry ${log.crisis ? "crisis" : ""}`;

    entry.innerHTML = `
      <div class="entry-header">
        <div class="mood">Mood: ${log.mood}</div>
        <div class="date">${formatDate(log.created_at)}</div>
      </div>

      ${log.crisis ? `
        <div class="section">
          🚨 <span class="label">Crisis Detected</span>
        </div>` : ""
      }

      ${log.advice ? `
        <div class="section">
          <span class="label">AI Advice:</span><br />
          ${log.advice}
        </div>` : ""
      }

      <div class="section">
        <span class="label">Your Responses:</span>
        ${renderAnswers(log.answers)}
      </div>
    `;

    historyEl.appendChild(entry);
  });
}

// 🧾 Render answers JSONB nicely
function renderAnswers(answers) {
  if (!answers || typeof answers !== "object") {
    return "<p>No responses recorded</p>";
  }

  let html = "<ul class='answers'>";

  Object.entries(answers).forEach(([question, response]) => {
    html += `<li><strong>${question}:</strong> ${response}</li>`;
  });

  html += "</ul>";
  return html;
}

// 📅 Date formatter
function formatDate(timestamp) {
  const d = new Date(timestamp);
  return d.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}
