/**
 * Paystack Webhook Handler
 * 
 * Handles payment verification and updates user supporter status.
 * Implements idempotent processing to prevent duplicate credits.
 */

const { onRequest } = require('firebase-functions/v2/https');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const admin = require('firebase-admin');
const crypto = require('crypto');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = getFirestore();

/**
 * Verify Paystack webhook signature
 */
function verifySignature(payload, signature, secret) {
  const hash = crypto
    .createHmac('sha512', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  return hash === signature;
}

/**
 * Paystack Webhook Handler - Idempotent
 */
exports.paystackWebhook = onRequest({
  secrets: ['PAYSTACK_SECRET_KEY']
}, async (req, res) => {
  // Only allow POST
  if (req.method !== 'POST') {
    res.status(405).send('Method not allowed');
    return;
  }

  const signature = req.headers['x-paystack-signature'];
  const payload = req.body;

  // Verify webhook signature
  if (!verifySignature(payload, signature, process.env.PAYSTACK_SECRET_KEY)) {
    console.error('Invalid Paystack signature');
    res.status(401).send('Invalid signature');
    return;
  }

  const event = payload.event;
  const data = payload.data;

  // Only process successful charges
  if (event !== 'charge.success') {
    res.status(200).send('Event ignored');
    return;
  }

  const reference = data.reference;
  const userId = data.metadata?.userId;
  const purpose = data.metadata?.purpose;

  // Validate required fields
  if (!reference || !userId) {
    console.error('Missing reference or userId in webhook payload');
    res.status(400).send('Missing required fields');
    return;
  }

  // Only process supporter donations
  if (purpose !== 'supporter_donation') {
    res.status(200).send('Not a supporter donation');
    return;
  }

  try {
    // Idempotent check: Use transaction to prevent duplicate processing
    const paymentRef = db.collection('payments').doc(reference);
    const userRef = db.collection('users').doc(userId);

    await db.runTransaction(async (transaction) => {
      const paymentDoc = await transaction.get(paymentRef);
      
      // Check if already processed
      if (paymentDoc.exists && paymentDoc.data().processed) {
        console.log(`Payment ${reference} already processed, skipping`);
        return;
      }

      // Mark payment as processed
      transaction.set(paymentRef, {
        reference,
        userId,
        amount: data.amount / 100, // Convert from kobo to Naira
        email: data.customer?.email,
        processed: true,
        processedAt: FieldValue.serverTimestamp(),
        paystackData: {
          status: data.status,
          channel: data.channel,
          paidAt: data.paid_at
        }
      });

      // Update user's supporter status
      transaction.set(userRef, {
        supporterStatus: true,
        supporterSince: FieldValue.serverTimestamp(),
        totalDonated: FieldValue.increment(data.amount / 100)
      }, { merge: true });

      console.log(`Successfully processed payment ${reference} for user ${userId}`);
    });

    res.status(200).send('Webhook processed successfully');
  } catch (error) {
    console.error('Webhook processing error:', error);
    // Return 500 so Paystack will retry
    res.status(500).send('Internal error, will retry');
  }
});
