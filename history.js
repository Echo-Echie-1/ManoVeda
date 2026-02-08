/******************************
 * SUPABASE CONFIG
 ******************************/
const SUPABASE_URL = "https://vxknarwomlejxksmjinx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4a25hcndvbWxlanhrc21qaW54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyNTAzMjcsImV4cCI6MjA4NTgyNjMyN30.EG9iRbnR98roL18qEL6zmJLKbbROc0mSPmNh1MZnBZ4";

const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

/******************************
 * DOM ELEMENTS
 ******************************/
const historyList = document.getElementById("historyList");
const moodFilter = document.getElementById("moodFilter");

/******************************
 * USER CONTEXT
 * (must be set when user logs in / submits mood)
 ******************************/
const currentUser =
  JSON.parse(localStorage.getItem("manoveda_user")) || {
    user_id: "guest"
  };

/******************************
 * HELPERS
 ******************************/
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function timeOfDay(dateStr) {
  const hour = new Date(dateStr).getHours();
  if (hour < 12) return "🌅 Morning";
  if (hour < 17) return "☀️ Afternoon";
  if (hour < 21) return "🌆 Evening";
  return "🌙 Night";
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/******************************
 * LOAD MOOD HISTORY
 ******************************/
async function loadMoodHistory() {
  historyList.innerHTML = "⏳ Loading your emotional journey...";

  const filter = moodFilter.value;

  let query = supabase
    .from("mood_logs")
    .select("*")
    .eq("user_id", currentUser.user_id)
    .order("created_at", { ascending: false });

  if (filter !== "all") {
    query = query.eq("mood", filter);
  }

  const { data, error } = await query;

  if (error) {
    console.error(error);
    historyList.innerHTML = "❌ Failed to load mood history.";
    return;
  }

  if (!data || data.length === 0) {
    historyList.innerHTML = "📝 No mood entries yet.";
    return;
  }

  historyList.innerHTML = "";

  data.forEach(entry => {
    const card = document.createElement("div");
    card.className = `entry ${entry.mood}`;

    const answersHtml = entry.answers
      ? `<pre class="answers">${JSON.stringify(entry.answers, null, 2)}</pre>`
      : "";

    const resourcesHtml = entry.resources
      ? `<pre class="resources">${JSON.stringify(entry.resources, null, 2)}</pre>`
      : "";

    card.innerHTML = `
      <div class="entry-header">
        <span class="mood">🧠 ${capitalize(entry.mood)}</span>
        <span class="time">${timeOfDay(entry.created_at)}</span>
      </div>

      <div class="timestamp">🕒 ${formatDate(entry.created_at)}</div>

      ${entry.advice ? `<div class="advice">💡 <strong>Advice:</strong> ${entry.advice}</div>` : ""}

      ${answersHtml}

      ${resourcesHtml}

      ${
        entry.crisis
          ? `<div class="crisis">🚨 Crisis detected – support recommended</div>`
          : ""
      }
    `;

    historyList.appendChild(card);
  });
}

/******************************
 * EVENTS
 ******************************/
moodFilter.addEventListener("change", loadMoodHistory);
loadMoodHistory();
