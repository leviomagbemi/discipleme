/**
 * Subscription Module
 * Handles premium subscriptions, tier checking, and AI usage limits
 */

import { auth, db } from './firebase-config.mjs';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';

// Subscription Plans
export const PLANS = {
  FREE: {
    id: 'free',
    name: 'Free',
    price: 0,
    aiRequestsPerDay: 3,
    features: ['Basic memorization', 'Progress tracking', 'Limited AI insights']
  },
  MONTHLY: {
    id: 'monthly',
    name: 'Premium Monthly',
    price: 150000, // ₦1,500 in kobo
    priceDisplay: '₦1,500',
    duration: 30, // days
    aiRequestsPerDay: Infinity,
    features: ['Unlimited AI insights', 'AI-generated prayers', 'Priority support', 'Supporter badge']
  },
  QUARTERLY: {
    id: 'quarterly',
    name: 'Premium Quarterly',
    price: 350000, // ₦3,500 in kobo
    priceDisplay: '₦3,500',
    duration: 90, // days
    savings: '22% off',
    aiRequestsPerDay: Infinity,
    features: ['Unlimited AI insights', 'AI-generated prayers', 'Priority support', 'Supporter badge']
  },
  YEARLY: {
    id: 'yearly',
    name: 'Premium Yearly',
    price: 1000000, // ₦10,000 in kobo
    priceDisplay: '₦10,000',
    duration: 365, // days
    savings: '45% off',
    aiRequestsPerDay: Infinity,
    features: ['Unlimited AI insights', 'AI-generated prayers', 'Priority support', 'Supporter badge']
  }
};

/**
 * Get user's subscription status
 * @returns {Object} { tier, isActive, expiresAt, aiRequestsToday, aiLimit }
 */
export async function getSubscriptionStatus() {
  const user = auth.currentUser;
  if (!user) {
    return { tier: 'free', isActive: false, aiRequestsToday: 0, aiLimit: 3 };
  }

  try {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      return { tier: 'free', isActive: false, aiRequestsToday: 0, aiLimit: 3 };
    }

    const data = userSnap.data();
    const now = new Date();
    const expiresAt = data.subscriptionExpiry?.toDate?.();
    const isActive = expiresAt && expiresAt > now;
    
    // Check AI usage for today
    const today = now.toISOString().split('T')[0];
    const aiUsage = data.aiUsage || {};
    const aiRequestsToday = aiUsage[today] || 0;
    const aiLimit = isActive ? Infinity : 3;

    return {
      tier: isActive ? (data.subscriptionTier || 'premium') : 'free',
      isActive,
      expiresAt,
      aiRequestsToday,
      aiLimit,
      canUseAI: aiRequestsToday < aiLimit
    };
  } catch (error) {
    console.error('Error getting subscription status:', error);
    return { tier: 'free', isActive: false, aiRequestsToday: 0, aiLimit: 3 };
  }
}

/**
 * Check if user can use AI features
 * @returns {Object} { allowed, remaining, message }
 */
export async function checkAIUsage() {
  const status = await getSubscriptionStatus();
  
  if (status.isActive) {
    return { 
      allowed: true, 
      remaining: Infinity, 
      message: 'Unlimited AI access' 
    };
  }

  const remaining = Math.max(0, status.aiLimit - status.aiRequestsToday);
  
  if (remaining > 0) {
    return {
      allowed: true,
      remaining,
      message: `${remaining} AI requests remaining today`
    };
  }

  return {
    allowed: false,
    remaining: 0,
    message: 'Daily AI limit reached. Upgrade to Premium for unlimited access!'
  };
}

/**
 * Increment AI usage counter
 */
export async function incrementAIUsage() {
  const user = auth.currentUser;
  if (!user) return;

  try {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    
    const today = new Date().toISOString().split('T')[0];
    const data = userSnap.exists() ? userSnap.data() : {};
    const aiUsage = data.aiUsage || {};
    
    // Reset if it's a new day
    const newUsage = {
      [today]: (aiUsage[today] || 0) + 1
    };

    await updateDoc(userRef, { aiUsage: newUsage });
  } catch (error) {
    console.error('Error incrementing AI usage:', error);
  }
}

/**
 * Activate premium subscription
 * @param {string} planId - Plan ID (monthly, quarterly, yearly)
 * @param {string} transactionRef - Paystack transaction reference
 */
export async function activateSubscription(planId, transactionRef) {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const plan = Object.values(PLANS).find(p => p.id === planId);
  if (!plan || plan.id === 'free') throw new Error('Invalid plan');

  const now = new Date();
  const expiryDate = new Date(now.getTime() + plan.duration * 24 * 60 * 60 * 1000);

  try {
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      subscriptionTier: planId,
      subscriptionExpiry: expiryDate,
      supporterStatus: true,
      lastPaymentRef: transactionRef,
      lastPaymentDate: now,
      lastPaymentAmount: plan.price
    });

    return { success: true, expiresAt: expiryDate };
  } catch (error) {
    console.error('Error activating subscription:', error);
    throw error;
  }
}

/**
 * Show upgrade prompt modal
 */
export function showUpgradeModal() {
  // Remove existing modal
  document.getElementById('upgrade-modal')?.remove();

  const modal = document.createElement('div');
  modal.id = 'upgrade-modal';
  modal.className = 'auth-modal-overlay';
  modal.innerHTML = `
    <div class="auth-modal" style="max-width: 500px;">
      <button class="auth-modal-close" id="upgrade-modal-close">&times;</button>
      
      <div class="auth-modal-header">
        <h2>🚀 Upgrade to Premium</h2>
        <p>Unlock unlimited AI insights and more!</p>
      </div>

      <div style="margin-bottom: var(--space-6);">
        <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: var(--radius-md); padding: var(--space-3); margin-bottom: var(--space-4); color: var(--accent-error); font-size: var(--text-sm);">
          <i class="fa-solid fa-circle-exclamation"></i>
          You've used all 3 free AI requests for today
        </div>

        <h4 style="margin-bottom: var(--space-3); font-size: var(--text-sm); color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px;">Premium Benefits</h4>
        <ul style="list-style: none; display: flex; flex-direction: column; gap: var(--space-2); margin-bottom: var(--space-6);">
          <li style="display: flex; align-items: center; gap: var(--space-2); color: var(--text-secondary);">
            <i class="fa-solid fa-check" style="color: var(--accent-success);"></i>
            Unlimited AI insights & prayers
          </li>
          <li style="display: flex; align-items: center; gap: var(--space-2); color: var(--text-secondary);">
            <i class="fa-solid fa-check" style="color: var(--accent-success);"></i>
            Supporter badge on profile
          </li>
          <li style="display: flex; align-items: center; gap: var(--space-2); color: var(--text-secondary);">
            <i class="fa-solid fa-check" style="color: var(--accent-success);"></i>
            Priority email support
          </li>
          <li style="display: flex; align-items: center; gap: var(--space-2); color: var(--text-secondary);">
            <i class="fa-solid fa-check" style="color: var(--accent-success);"></i>
            Support scripture ministry
          </li>
        </ul>
      </div>

      <div style="display: flex; flex-direction: column; gap: var(--space-3);">
        <button class="btn-primary w-full upgrade-plan-btn" data-plan="monthly" style="justify-content: space-between;">
          <span>Monthly</span>
          <span>₦1,500/mo</span>
        </button>
        <button class="btn-secondary w-full upgrade-plan-btn" data-plan="quarterly" style="justify-content: space-between; position: relative;">
          <span>Quarterly</span>
          <span>₦3,500 <small style="color: var(--accent-success);">(22% off)</small></span>
        </button>
        <button class="btn-secondary w-full upgrade-plan-btn" data-plan="yearly" style="justify-content: space-between;">
          <span>Yearly</span>
          <span>₦10,000 <small style="color: var(--accent-success);">(45% off)</small></span>
        </button>
      </div>

      <p style="text-align: center; margin-top: var(--space-4); font-size: var(--text-xs); color: var(--text-muted);">
        Secure payment via Paystack. Cancel anytime.
      </p>
    </div>
  `;

  document.body.appendChild(modal);

  // Close button
  document.getElementById('upgrade-modal-close')?.addEventListener('click', () => {
    modal.remove();
  });

  // Close on backdrop click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });

  // Plan buttons
  modal.querySelectorAll('.upgrade-plan-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const planId = btn.dataset.plan;
      modal.remove();
      
      // Trigger Paystack payment
      const { initializeSubscriptionPayment } = await import('./paystack.mjs');
      initializeSubscriptionPayment(planId);
    });
  });
}
