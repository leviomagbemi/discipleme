// Access the API key from environment variables
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.error("CRITICAL: Gemini API Key is missing. Make sure VITE_GEMINI_API_KEY is set in your .env file.");
} else {
  console.log("Gemini API Key loaded successfully.");
}

// CHANGED: Switched to gemini-pro which is often more stable for v1beta
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

export async function getGeminiContent(prompt) {
  if (!API_KEY) {
    return "Error: API Key is missing. Please set VITE_GEMINI_API_KEY in your .env file.";
  }

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Gemini API Error Details:", errorData);
      // Helpful error message for the user
      throw new Error(`Gemini API Error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    
    // Safety check for response structure
    if (data.candidates && data.candidates.length > 0 && data.candidates[0].content) {
        return data.candidates[0].content.parts[0].text;
    } else {
        console.error("Unexpected API Response structure:", data);
        return "Sorry, the AI returned an unexpected response format.";
    }

  } catch (error) {
    console.error("AI Request Failed:", error);
    return "Sorry, I couldn't connect to the AI right now. Please check your internet connection or API key.";
  }
}

export async function getVerseInsight(reference, text) {
  const prompt = `Provide a brief, 2-sentence theological insight or practical application for the Bible verse ${reference}: "${text}". Keep it encouraging and simple for a general Christian audience.`;
  return await getGeminiContent(prompt);
}

export async function getVersePrayer(reference, text) {
  const prompt = `Write a short, heartfelt, 1-2 sentence prayer based on the Bible verse ${reference}: "${text}". The prayer should help the user apply this verse to their daily life. Start with "Lord" or "Heavenly Father".`;
  return await getGeminiContent(prompt);
}