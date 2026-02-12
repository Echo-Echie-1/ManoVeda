import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// 🔐 SUPABASE CONFIG (use your real keys)
const SUPABASE_URL = "https://vxknarwomlejxksmjinx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4a25hcndvbWxlanhrc21qaW54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyNTAzMjcsImV4cCI6MjA4NTgyNjMyN30.EG9iRbnR98roL18qEL6zmJLKbbROc0mSPmNh1MZnBZ4";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const historyContainer = document.getElementById("history");

// Load on page open
loadHistory();

async function loadHistory() {
  // 1️⃣ Get logged in user
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user || authError) {
    historyContainer.innerHTML = `<p class="empty">Please login to view your emotional history.</p>`;
    return;
  }

  // 2️⃣ Fetch mood logs
  const { data, error } = await supabase
    .from("mood_logs")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    historyContainer.innerHTML = `<p class="empty">Failed to load history.</p>`;
    return;
  }

  if (!data || data.length === 0) {
    historyContainer.innerHTML = `<p class="empty">No moods recorded yet 🌱</p>`;
    return;
  }

  historyContainer.innerHTML = "";

  // 3️⃣ Render each entry
  data.forEach(log => {
    const entry = document.createElement("div");
    entry.className = "entry";

    entry.innerHTML = `
      <div class="entry-header">
        <div class="mood">Mood: ${log.mood || "Unknown"}</div>
        <div class="date">${formatDate(log.created_at)}</div>
      </div>
      <div class="note">
        ${log.note || "No notes added"}
      </div>
    `;

    historyContainer.appendChild(entry);
  });
}

// Date formatter
function formatDate(ts) {
  const d = new Date(ts);
  return d.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}
