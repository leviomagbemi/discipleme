/**
 * AI Module - Gemini Integration via Cloud Function
 * 
 * All AI requests are proxied through Firebase Cloud Functions.
 * API key is securely stored in the backend.
 */

import { auth, FUNCTIONS_URL } from './firebase-config.mjs';
import { checkOnlineStatus } from './utils.mjs';

/**
 * Make a request to the Gemini AI proxy function
 * @param {string} prompt - The prompt to send
 * @param {string} type - The type of request ('insight' or 'prayer')
 */
export async function getGeminiContent(prompt, type = 'insight') {
  // Check network status
  if (!checkOnlineStatus()) {
    return "You're offline. AI features require an internet connection.";
  }

  const user = auth.currentUser;
  
  // Allow guests to see a teaser but require auth for full features
  if (!user) {
    return "Sign in to unlock AI-powered insights and prayers for each verse you study.";
  }

  try {
    const token = await user.getIdToken();
    
    const response = await fetch(`${FUNCTIONS_URL}/geminiProxy`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prompt, type })
    });

    if (!response.ok) {
      const error = await response.json();
      
      // Handle rate limiting gracefully
      if (response.status === 429) {
        return "You've reached the insight limit. Take a moment to reflect, then try again.";
      }
      
      throw new Error(error.error || 'AI request failed');
    }

    const data = await response.json();
    return data.content || "Sorry, the AI returned an unexpected response.";

  } catch (error) {
    console.error("AI Request Failed:", error);
    return "AI is temporarily unavailable. The game continues in Standard mode!";
  }
}

/**
 * Get theological insight for a verse
 */
export async function getVerseInsight(reference, text) {
  const prompt = `Provide a brief, 2-sentence theological insight or practical application for the Bible verse ${reference}: "${text}". Keep it encouraging and simple for a general Christian audience.`;
  return await getGeminiContent(prompt, 'insight');
}

/**
 * Generate a prayer based on a verse
 */
export async function getVersePrayer(reference, text) {
  const prompt = `Write a short, heartfelt, 1-2 sentence prayer based on the Bible verse ${reference}: "${text}". The prayer should help the user apply this verse to their daily life. Start with "Lord" or "Heavenly Father".`;
  return await getGeminiContent(prompt, 'prayer');
}