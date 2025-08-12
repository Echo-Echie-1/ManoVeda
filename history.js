const historyList = document.getElementById("historyList");
const moodFilter = document.getElementById("moodFilter");
const user = JSON.parse(localStorage.getItem("manoveda_current")) || { name: "guest" };

const moodIcons = {
  happy: "assets/icons/happy.png",
  sad: "assets/icons/sad.png",
  stressed: "assets/icons/stressed.png",
  angry: "assets/icons/angry.png",
  fear: "assets/icons/fear.png",
  excited: "assets/icons/excited.png",
  neutral: "assets/icons/neutral.png"
};

// Convert Firestore timestamp to readable date
function formatDate(timestamp) {
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
}

async function loadMoodHistory() {
  historyList.innerHTML = "";

  try {
    const snapshot = await db.collection("ManoVedaMoods")
      .where("userId", "==", user.name)
      .orderBy("timestamp", "desc") // ✅ Use timestamp instead of date
      .get();

    const filter = moodFilter.value;

    if (snapshot.empty) {
      historyList.innerHTML = `<p>No mood history found. Start by entering your mood on the Mood Detector page.</p>`;
      return;
    }

    snapshot.forEach(doc => {
      const data = doc.data();
      if (filter !== "all" && data.mood !== filter) return;

      const div = document.createElement("div");
      div.className = `entry ${data.mood}`;

      div.innerHTML = `
        <img src="${moodIcons[data.mood] || moodIcons.neutral}" alt="${data.mood}" />
        <div class="info">
          <div class="input-text">📝 <strong>You wrote:</strong> "${data.input}"</div>
          <div class="mood">🧠 <strong>Mood:</strong> ${capitalize(data.mood)}</div>
          <div class="timestamp">🕒 ${formatDate(data.timestamp)}</div>
        </div>
        <button class="deleteBtn">Delete</button>
      `;

      div.querySelector(".deleteBtn").addEventListener("click", async () => {
        if (confirm("Are you sure you want to delete this mood entry?")) {
          await db.collection("ManoVedaMoods").doc(doc.id).delete();
          div.remove();
        }
      });

      historyList.appendChild(div);
    });

  } catch (err) {
    console.error("❌ Failed to load mood history:", err);
    historyList.innerHTML = `<p>Error loading mood history. Try again later.</p>`;
  }
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

moodFilter.addEventListener("change", loadMoodHistory);
loadMoodHistory();
