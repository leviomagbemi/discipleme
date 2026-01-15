/**
 * Profile Module
 * Handles user profile display, editing, and scripture mastery tracking
 */

import { auth, db } from './firebase-config.mjs';
import { 
  doc, 
  getDoc, 
  updateDoc,
  collection, 
  getDocs, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { showModal } from './utils.mjs';
import { signOut } from './auth.mjs';
import { navigateTo, VIEWS } from './router.mjs';

/**
 * Initialize profile page
 */
export async function initProfile() {
  const user = auth.currentUser;
  if (!user) return;

  // Set up event listeners
  setupProfileEventListeners();
  
  // Load profile data
  await loadProfileData(user);
  
  // Load mastered scriptures
  await loadMasteredScriptures(user.uid);
}

/**
 * Load and display profile data
 */
async function loadProfileData(user) {
  // Avatar
  const avatarEl = document.getElementById('profile-avatar');
  if (avatarEl) {
    if (user.photoURL) {
      avatarEl.innerHTML = `<img src="${user.photoURL}" alt="${user.displayName}">`;
    } else {
      const initial = (user.displayName || user.email || 'D').charAt(0).toUpperCase();
      avatarEl.textContent = initial;
    }
  }

  // Name and email
  const nameEl = document.getElementById('profile-name');
  const emailEl = document.getElementById('profile-email');
  const displayNameInput = document.getElementById('display-name');
  
  if (nameEl) nameEl.textContent = user.displayName || 'Disciple';
  if (emailEl) emailEl.textContent = user.email;
  if (displayNameInput) displayNameInput.value = user.displayName || '';

  // Load Firestore data
  try {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const userData = userSnap.data();
      
      // Update stats
      updateStatDisplay('stat-streak', userData.streak || 0);
      
      // Check subscription status
      const { getSubscriptionStatus, showUpgradeModal } = await import('./subscription.mjs');
      const subStatus = await getSubscriptionStatus();
      
      // Badges container
      const badgesContainer = document.getElementById('profile-badges');
      if (badgesContainer) {
        let badgeHtml = '';
        
        if (subStatus.isActive) {
          // Premium user
          const expiryDate = subStatus.expiresAt?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          badgeHtml = `
            <span class="badge badge-gradient">
              <i class="fa-solid fa-crown"></i> Premium
            </span>
            <span style="font-size: var(--text-xs); color: var(--text-muted);">
              Expires ${expiryDate}
            </span>
          `;
        } else if (userData.supporterStatus) {
          // Legacy supporter
          badgeHtml = `
            <span class="badge badge-gradient">
              <i class="fa-solid fa-star"></i> Supporter
            </span>
          `;
        } else {
          // Free user - show upgrade button
          badgeHtml = `
            <button class="btn-secondary btn-sm" id="profile-upgrade-btn">
              <i class="fa-solid fa-rocket"></i> Upgrade to Premium
            </button>
          `;
        }
        
        badgesContainer.innerHTML = badgeHtml;
        
        // Add upgrade button listener
        document.getElementById('profile-upgrade-btn')?.addEventListener('click', () => {
          showUpgradeModal();
        });
      }

      // Calculate level based on mastered verses
      const masteredRef = collection(db, 'users', user.uid, 'mastered_verses');
      const masteredSnap = await getDocs(masteredRef);
      const masteredCount = masteredSnap.size;
      
      updateStatDisplay('stat-mastered', masteredCount);
      updateStatDisplay('stat-level', Math.floor(masteredCount / 10) + 1);
    }
  } catch (error) {
    console.error('Error loading profile data:', error);
  }
}

/**
 * Update stat display with animation
 */
function updateStatDisplay(elementId, value) {
  const el = document.getElementById(elementId);
  if (el) {
    el.textContent = value;
    el.classList.add('animate-fade-in');
  }
}

/**
 * Load mastered scriptures list
 * Separates mastered (hard) from in-progress (easy/medium)
 */
async function loadMasteredScriptures(userId) {
  const listEl = document.getElementById('scripture-list');
  if (!listEl) return;

  try {
    const versesRef = collection(db, 'users', userId, 'mastered_verses');
    const q = query(versesRef, orderBy('lastPracticedAt', 'desc'));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      listEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📖</div>
          <h4>No scriptures practiced yet</h4>
          <p>Start memorizing to track your progress!</p>
          <button class="btn-primary" id="start-memorizing-from-profile">
            <i class="fa-solid fa-play"></i>
            Start Memorizing
          </button>
        </div>
      `;
      
      document.getElementById('start-memorizing-from-profile')?.addEventListener('click', () => {
        navigateTo(VIEWS.APP);
      });
      return;
    }

    // Separate mastered from in-progress
    const mastered = [];
    const inProgress = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.status === 'mastered' || data.difficulty === 'hard') {
        mastered.push(data);
      } else {
        inProgress.push(data);
      }
    });

    // Update stats - only count truly mastered
    updateStatDisplay('stat-mastered', mastered.length);

    let html = '';
    
    // Mastered Section
    if (mastered.length > 0) {
      html += `
        <div class="scripture-section">
          <h4 class="scripture-section-title">
            <i class="fa-solid fa-crown" style="color: var(--brand-cyan);"></i>
            Mastered (${mastered.length})
          </h4>
      `;
      
      mastered.forEach(data => {
        const date = data.masteredAt?.toDate?.() || new Date();
        const formattedDate = date.toLocaleDateString('en-US', { 
          month: 'short', day: 'numeric', year: 'numeric'
        });
        
        html += `
          <div class="scripture-item scripture-item-mastered">
            <div class="scripture-item-info">
              <div class="scripture-item-icon" style="background: var(--gradient-brand);">
                <i class="fa-solid fa-crown"></i>
              </div>
              <div>
                <div class="scripture-item-ref">${data.reference}</div>
                <div class="scripture-item-meta">
                  Mastered on ${formattedDate}
                </div>
              </div>
            </div>
            <button class="scripture-item-action" data-ref="${data.reference}" data-diff="hard">
              Practice
            </button>
          </div>
        `;
      });
      
      html += `</div>`;
    }
    
    // In Progress Section
    if (inProgress.length > 0) {
      html += `
        <div class="scripture-section" style="margin-top: var(--space-6);">
          <h4 class="scripture-section-title">
            <i class="fa-solid fa-spinner" style="color: var(--brand-yellow);"></i>
            In Progress (${inProgress.length})
          </h4>
      `;
      
      inProgress.forEach(data => {
        const difficultyLabel = data.difficulty === 'medium' ? 'Medium' : 'Easy';
        const difficultyColor = data.difficulty === 'medium' ? 'var(--brand-yellow)' : 'var(--accent-success)';
        const nextLevel = data.difficulty === 'medium' ? 'Hard' : 'Medium';
        
        html += `
          <div class="scripture-item scripture-item-progress">
            <div class="scripture-item-info">
              <div class="scripture-item-icon" style="background: ${difficultyColor};">
                <i class="fa-solid fa-${data.difficulty === 'medium' ? 'fire' : 'seedling'}"></i>
              </div>
              <div>
                <div class="scripture-item-ref">${data.reference}</div>
                <div class="scripture-item-meta">
                  <span class="badge" style="background: ${difficultyColor}20; color: ${difficultyColor}; font-size: var(--text-xs);">
                    ${difficultyLabel}
                  </span>
                  <span style="margin-left: var(--space-2);">→ Try ${nextLevel} to progress</span>
                </div>
              </div>
            </div>
            <button class="scripture-item-action" data-ref="${data.reference}" data-diff="${data.difficulty === 'medium' ? 'hard' : 'medium'}">
              Level Up
            </button>
          </div>
        `;
      });
      
      html += `</div>`;
    }

    listEl.innerHTML = html;

    // Add click handlers for practice buttons
    listEl.querySelectorAll('.scripture-item-action').forEach(btn => {
      btn.addEventListener('click', () => {
        const ref = btn.dataset.ref;
        // Parse reference and navigate to game
        const match = ref.match(/^(.+)\s+(\d+):(.+)$/);
        if (match) {
          const [, book, chapter, verses] = match;
          const url = new URL(window.location);
          url.searchParams.set('book', book.toLowerCase().replace(/\s+/g, ''));
          url.searchParams.set('chapter', chapter);
          url.searchParams.set('verse', verses.split('-')[0]);
          url.hash = '/app';
          window.location.href = url.toString();
        }
      });
    });

  } catch (error) {
    console.error('Error loading mastered scriptures:', error);
    listEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <h4>Error loading scriptures</h4>
        <p>Please try again later.</p>
      </div>
    `;
  }
}

/**
 * Set up profile event listeners
 */
function setupProfileEventListeners() {
  // Save profile button
  const saveBtn = document.getElementById('save-profile-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', handleSaveProfile);
  }

  // Sign out button
  const signOutBtn = document.getElementById('sign-out-profile-btn');
  if (signOutBtn) {
    signOutBtn.addEventListener('click', async () => {
      await signOut();
      navigateTo(VIEWS.LANDING);
    });
  }

  // Mastery tabs
  const tabs = document.querySelectorAll('.mastery-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      // In a full implementation, this would filter the list
    });
  });
}

/**
 * Handle save profile
 */
async function handleSaveProfile() {
  const user = auth.currentUser;
  if (!user) return;

  const displayNameInput = document.getElementById('display-name');
  const newName = displayNameInput?.value?.trim();

  if (!newName) {
    showModal('Error', 'Please enter a display name');
    return;
  }

  const saveBtn = document.getElementById('save-profile-btn');
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
  }

  try {
    // Update Firebase Auth profile
    await updateProfile(user, { displayName: newName });

    // Update Firestore
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, { displayName: newName });

    // Update UI
    const nameEl = document.getElementById('profile-name');
    if (nameEl) nameEl.textContent = newName;

    showModal('Success! ✅', 'Your profile has been updated.');
  } catch (error) {
    console.error('Error saving profile:', error);
    showModal('Error', 'Failed to save profile. Please try again.');
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<i class="fa-solid fa-save"></i> Save Changes';
    }
  }
}
