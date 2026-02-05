export async function handler(event) {
  // Allow only POST requests
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  try {
    // Parse request body
    const body = JSON.parse(event.body || "{}");
    const messages = body.messages;

    if (!messages || !Array.isArray(messages)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid messages format" }),
      };
    }

    // Call OpenRouter API
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://manoveda.netlify.app",
          "X-Title": "ManoVeda",
        },
        body: JSON.stringify({
          model: "qwen/qwen3-next-80b-a3b-instruct:free",
          messages,
        }),
      }
    );

    const data = await response.json();

    if (!data.choices || !data.choices[0]) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Invalid response from OpenRouter" }),
      };
    }

    // Send clean response to frontend
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reply: data.choices[0].message.content,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Server error",
        details: error.message,
      }),
    };
  }
}

