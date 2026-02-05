export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" })
    };
  }

  try {
    const { messages } = JSON.parse(event.body || "{}");

    if (!Array.isArray(messages)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid messages format" })
      };
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://manoveda.netlify.app",
        "X-Title": "ManoVeda"
      },
      body: JSON.stringify({
        model: "qwen/qwen3-next-80b-a3b-instruct:free",
        messages
      })
    });

    const data = await response.json();

    // 👇 IMPORTANT: surface OpenRouter errors
    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({
          error: "OpenRouter error",
          details: data
        })
      };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Server error",
        details: err.message
      })
    };
  }
}
