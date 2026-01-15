/**
 * Gemini AI Proxy Function
 * 
 * Security features:
 * - API key stored in Firebase environment config
 * - User authentication required
 * - Rate limiting: 10 requests per minute per user
 */

const { onRequest } = require('firebase-functions/v2/https');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = getFirestore();

// Rate limit configuration
const RATE_LIMIT_REQUESTS = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

/**
 * Verify Firebase ID token from Authorization header
 */
async function verifyToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await getAuth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * Check and update rate limit for user
 * Returns true if request is allowed, false if rate limited
 */
async function checkRateLimit(userId) {
  const userRef = db.collection('users').doc(userId);
  const now = Date.now();
  
  try {
    const result = await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      const data = userDoc.data() || {};
      
      const lastRequestTime = data.lastAiRequestTime?.toMillis() || 0;
      const requestCount = data.aiRequestCount || 0;
      
      // Reset counter if outside window
      if (now - lastRequestTime > RATE_LIMIT_WINDOW_MS) {
        transaction.set(userRef, {
          aiRequestCount: 1,
          lastAiRequestTime: FieldValue.serverTimestamp()
        }, { merge: true });
        return true;
      }
      
      // Check if rate limited
      if (requestCount >= RATE_LIMIT_REQUESTS) {
        return false;
      }
      
      // Increment counter
      transaction.set(userRef, {
        aiRequestCount: requestCount + 1,
        lastAiRequestTime: FieldValue.serverTimestamp()
      }, { merge: true });
      
      return true;
    });
    
    return result;
  } catch (error) {
    console.error('Rate limit check failed:', error);
    // Fail open - allow request if rate limit check fails
    return true;
  }
}

/**
 * Main Gemini Proxy Handler
 */
exports.geminiProxy = onRequest({ 
  cors: true,
  secrets: ['GEMINI_API_KEY']
}, async (req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.status(204).send('');
    return;
  }

  // Only allow POST
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Verify authentication
  const decodedToken = await verifyToken(req);
  if (!decodedToken) {
    res.status(401).json({ error: 'Unauthorized. Please sign in.' });
    return;
  }

  // Check rate limit
  const allowed = await checkRateLimit(decodedToken.uid);
  if (!allowed) {
    res.status(429).json({ 
      error: 'Rate limit exceeded. Please wait a moment before requesting more insights.' 
    });
    return;
  }

  // Validate request body
  const { prompt, type } = req.body;
  if (!prompt || typeof prompt !== 'string') {
    res.status(400).json({ error: 'Invalid prompt' });
    return;
  }

  // Sanitize prompt length
  const sanitizedPrompt = prompt.substring(0, 1000);

  try {
    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Build appropriate prompt based on type
    let fullPrompt;
    if (type === 'prayer') {
      fullPrompt = `Write a short, heartfelt, 1-2 sentence prayer based on the following. The prayer should help the user apply this verse to their daily life. Start with "Lord" or "Heavenly Father". Context: ${sanitizedPrompt}`;
    } else {
      fullPrompt = `Provide a brief, 2-sentence theological insight or practical application for the following. Keep it encouraging and simple for a general Christian audience. Context: ${sanitizedPrompt}`;
    }

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    res.status(200).json({ content: text });
  } catch (error) {
    console.error('Gemini API error:', error);
    res.status(500).json({ 
      error: 'AI service temporarily unavailable. Please try again later.' 
    });
  }
});
