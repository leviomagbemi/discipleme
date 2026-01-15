/**
 * Paystack Payment Integration Module
 * 
 * Handles "Support the Mission" donations via Firebase Cloud Functions.
 */

import { auth, FUNCTIONS_URL } from './firebase-config.mjs';
import { showModal } from './utils.mjs';

// Paystack public key (safe to expose)
const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;

/**
 * Initialize a payment transaction
 * @param {number} amount - Amount in NGN
 */
export async function initializePayment(amount = 1000) {
  const user = auth.currentUser;
  
  if (!user) {
    showModal('Sign In Required', 'Please sign in to support the mission.');
    return { success: false, error: 'Not authenticated' };
  }

  try {
    const token = await user.getIdToken();
    
    const response = await fetch(`${FUNCTIONS_URL}/initializePayment`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount,
        email: user.email,
        callbackUrl: window.location.origin
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Payment initialization failed');
    }

    const data = await response.json();
    
    // Open Paystack payment page
    if (data.authorization_url) {
      // Option 1: Redirect to Paystack
      window.location.href = data.authorization_url;
      return { success: true, redirected: true };
    }

    return { success: false, error: 'No authorization URL received' };
  } catch (error) {
    console.error('Payment error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Open Paystack inline popup (alternative to redirect)
 * Requires Paystack inline JS to be loaded
 * @param {number} amount - Amount in NGN
 */
export async function openPaystackInline(amount = 1000) {
  const user = auth.currentUser;
  
  if (!user) {
    showModal('Sign In Required', 'Please sign in to support the mission.');
    return;
  }

  // Ensure Paystack script is loaded
  if (!window.PaystackPop) {
    await loadPaystackScript();
  }

  try {
    const token = await user.getIdToken();
    
    // Get transaction reference from backend
    const response = await fetch(`${FUNCTIONS_URL}/initializePayment`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount,
        email: user.email
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Payment initialization failed');
    }

    const data = await response.json();

    // Open Paystack popup
    const handler = window.PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email: user.email,
      amount: amount * 100, // Convert to kobo
      ref: data.reference,
      onClose: () => {
        console.log('Payment popup closed');
      },
      callback: (response) => {
        handlePaymentSuccess(response);
      }
    });

    handler.openIframe();
  } catch (error) {
    console.error('Payment error:', error);
    showModal('Payment Error', error.message);
  }
}

/**
 * Handle successful payment
 */
function handlePaymentSuccess(response) {
  console.log('Payment successful:', response.reference);
  showModal(
    'Thank You! 🎉',
    `<p>Your support means everything to us!</p>
     <p>You are now a <strong>DiscipleMe Supporter</strong>.</p>
     <p style="font-size: 0.875rem; color: #666;">Reference: ${response.reference}</p>`
  );
  
  // Refresh page to update supporter status
  setTimeout(() => {
    window.location.reload();
  }, 3000);
}

/**
 * Load Paystack inline script dynamically
 */
function loadPaystackScript() {
  return new Promise((resolve, reject) => {
    if (window.PaystackPop) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

/**
 * Show support modal with amount selection
 */
export function showSupportModal() {
  const user = auth.currentUser;
  
  if (!user) {
    showModal('Sign In Required', 'Please sign in to support the mission.');
    return;
  }

  let modal = document.getElementById('support-modal');
  if (modal) modal.remove();

  modal = document.createElement('div');
  modal.id = 'support-modal';
  modal.className = 'auth-modal-overlay';
  
  modal.innerHTML = `
    <div class="auth-modal" style="max-width: 380px;">
      <button class="auth-modal-close" aria-label="Close">&times;</button>
      
      <div class="auth-modal-header">
        <h2>Support the Mission 💜</h2>
        <p>Help us keep DiscipleMe free and growing!</p>
      </div>

      <div class="support-amounts">
        <button class="support-amount-btn" data-amount="500">₦500</button>
        <button class="support-amount-btn active" data-amount="1000">₦1,000</button>
        <button class="support-amount-btn" data-amount="2000">₦2,000</button>
        <button class="support-amount-btn" data-amount="5000">₦5,000</button>
      </div>

      <div class="support-custom">
        <label for="custom-amount">Or enter custom amount (NGN)</label>
        <input type="number" id="custom-amount" min="100" placeholder="Enter amount">
      </div>

      <button class="btn-primary w-full" id="proceed-payment-btn" style="margin-top: 1rem;">
        Proceed to Payment
      </button>
    </div>
  `;

  document.body.appendChild(modal);

  let selectedAmount = 1000;

  // Amount button selection
  modal.querySelectorAll('.support-amount-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      modal.querySelectorAll('.support-amount-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedAmount = parseInt(btn.dataset.amount);
      document.getElementById('custom-amount').value = '';
    });
  });

  // Custom amount input
  document.getElementById('custom-amount').addEventListener('input', (e) => {
    const value = parseInt(e.target.value);
    if (value >= 100) {
      selectedAmount = value;
      modal.querySelectorAll('.support-amount-btn').forEach(b => b.classList.remove('active'));
    }
  });

  // Proceed to payment
  document.getElementById('proceed-payment-btn').addEventListener('click', async () => {
    const customAmount = parseInt(document.getElementById('custom-amount').value);
    const amount = customAmount >= 100 ? customAmount : selectedAmount;
    
    modal.remove();
    await initializePayment(amount);
  });

  // Close handlers
  modal.querySelector('.auth-modal-close').addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
}

/**
 * Initialize subscription payment
 * @param {string} planId - Plan ID (monthly, quarterly, yearly)
 */
export async function initializeSubscriptionPayment(planId) {
  const user = auth.currentUser;
  
  if (!user) {
    showModal('Sign In Required', 'Please sign in to upgrade to premium.');
    return;
  }

  // Import subscription plans
  const { PLANS, activateSubscription } = await import('./subscription.mjs');
  
  const plan = Object.values(PLANS).find(p => p.id === planId);
  if (!plan || plan.id === 'free') {
    showModal('Error', 'Invalid subscription plan.');
    return;
  }

  // Show loading
  showModal('Processing...', `
    <div style="text-align: center;">
      <i class="fa-solid fa-spinner fa-spin" style="font-size: 2rem; color: var(--brand-cyan);"></i>
      <p style="margin-top: var(--space-4);">Initializing ${plan.name} subscription...</p>
    </div>
  `);

  // Ensure Paystack is loaded
  if (!window.PaystackPop) {
    await loadPaystackScript();
  }

  try {
    const handler = window.PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email: user.email,
      amount: plan.price, // Amount in kobo
      currency: 'NGN',
      ref: `sub_${planId}_${user.uid}_${Date.now()}`,
      metadata: {
        custom_fields: [
          { display_name: 'Plan', variable_name: 'plan', value: planId },
          { display_name: 'User ID', variable_name: 'user_id', value: user.uid },
          { display_name: 'Plan Name', variable_name: 'plan_name', value: plan.name }
        ]
      },
      onClose: () => {
        document.getElementById('ai-modal')?.remove();
        showModal('Payment Cancelled', 'You can upgrade anytime from your profile.');
      },
      callback: async (response) => {
        document.getElementById('ai-modal')?.remove();
        
        try {
          // Activate subscription in Firestore
          await activateSubscription(planId, response.reference);
          
          showModal('🎉 Welcome to Premium!', `
            <div style="text-align: center;">
              <p style="margin-bottom: var(--space-4);">Your ${plan.name} subscription is now active!</p>
              <ul style="list-style: none; display: flex; flex-direction: column; gap: var(--space-2); margin-bottom: var(--space-4);">
                <li style="color: var(--text-secondary);">✅ Unlimited AI insights</li>
                <li style="color: var(--text-secondary);">✅ AI-generated prayers</li>
                <li style="color: var(--text-secondary);">✅ Supporter badge</li>
              </ul>
              <button class="btn-primary" onclick="document.getElementById('ai-modal').remove(); window.location.reload();">
                Start Exploring
              </button>
            </div>
          `);
        } catch (error) {
          console.error('Subscription activation error:', error);
          showModal('Activation Issue', `
            Payment received! If your premium features aren't active, please contact support with reference: ${response.reference}
          `);
        }
      }
    });

    document.getElementById('ai-modal')?.remove();
    handler.openIframe();
  } catch (error) {
    console.error('Subscription payment error:', error);
    document.getElementById('ai-modal')?.remove();
    showModal('Payment Error', 'Failed to initialize payment. Please try again.');
  }
}
