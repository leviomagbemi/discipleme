/**
 * Paystack Payment Initialization Function
 * 
 * Initializes a Paystack transaction for "Support the Mission" donations
 */

const { onRequest } = require('firebase-functions/v2/https');
const { getAuth } = require('firebase-admin/auth');
const admin = require('firebase-admin');
const https = require('https');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

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
 * Initialize Paystack Transaction
 */
exports.initializePayment = onRequest({
  cors: true,
  secrets: ['PAYSTACK_SECRET_KEY']
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

  const { amount, email, callbackUrl } = req.body;

  // Validate amount (minimum 100 Naira = 10000 kobo)
  if (!amount || typeof amount !== 'number' || amount < 100) {
    res.status(400).json({ error: 'Invalid amount. Minimum is 100 NGN.' });
    return;
  }

  // Use authenticated user's email if not provided
  const userEmail = email || decodedToken.email;
  if (!userEmail) {
    res.status(400).json({ error: 'Email required for payment.' });
    return;
  }

  const paystackData = JSON.stringify({
    email: userEmail,
    amount: amount * 100, // Convert to kobo
    callback_url: callbackUrl || 'https://discipleme-app.web.app',
    metadata: {
      userId: decodedToken.uid,
      purpose: 'supporter_donation'
    }
  });

  const options = {
    hostname: 'api.paystack.co',
    port: 443,
    path: '/transaction/initialize',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
      'Content-Length': paystackData.length
    }
  };

  try {
    const paystackResponse = await new Promise((resolve, reject) => {
      const paystackReq = https.request(options, (paystackRes) => {
        let data = '';
        paystackRes.on('data', chunk => data += chunk);
        paystackRes.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error('Invalid Paystack response'));
          }
        });
      });

      paystackReq.on('error', reject);
      paystackReq.write(paystackData);
      paystackReq.end();
    });

    if (paystackResponse.status) {
      res.status(200).json({
        success: true,
        authorization_url: paystackResponse.data.authorization_url,
        access_code: paystackResponse.data.access_code,
        reference: paystackResponse.data.reference
      });
    } else {
      res.status(400).json({ error: paystackResponse.message || 'Payment initialization failed' });
    }
  } catch (error) {
    console.error('Paystack initialization error:', error);
    res.status(500).json({ error: 'Payment service temporarily unavailable' });
  }
});
