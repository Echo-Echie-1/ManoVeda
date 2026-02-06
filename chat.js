document.addEventListener("DOMContentLoaded", () => {
  const chatBox = document.getElementById("chatBox");
  const input = document.getElementById("userInput");
  const sendBtn = document.getElementById("sendBtn");

  if (!chatBox || !input || !sendBtn) {
    console.error("Chat DOM elements not found");
    return;
  }

  function addMessage(role, text) {
    const msg = document.createElement("div");
    msg.className = role === "user" ? "user-message" : "ai-message";
    msg.textContent = text;
    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  async function sendMessageToAI(userMessage) {
    try {
      const response = await fetch(
        "https://vxknarwomlejxksmjinx.supabase.co/functions/v1/manoveda-ai",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userMsg: userMessage }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("Backend error:", data);
        return "Server error.";
      }

      return data.reply || "No reply from AI.";
    } catch (err) {
      console.error("Network error:", err);
      return "Network error.";
    }
  }

  sendBtn.addEventListener("click", async () => {
    const text = input.value.trim();
    if (!text) return;

    addMessage("user", text);
    input.value = "";

    const reply = await sendMessageToAI(text);
    addMessage("assistant", reply);
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      sendBtn.click();
    }
  });
});
