/**
 * Dashboard Module
 * Handles the premium dashboard UI, step wizard, and dashboard-specific features
 */

import { auth, db } from './firebase-config.mjs';
import { doc, getDoc } from 'firebase/firestore';
import { loadBooks, loadNumberOfChapters, loadNumberOfVerses } from './utils.mjs';
import { ScriptureGame } from './game.mjs';
import { getSubscriptionStatus, showUpgradeModal } from './subscription.mjs';

// Initialize game instance
const game = new ScriptureGame();

// State
let currentStep = 1;
let selectedDifficulty = 'easy';

/**
 * Initialize the dashboard
 */
export async function initDashboard() {
  const user = auth.currentUser;
  if (!user) return;

  // Update welcome section
  updateWelcomeSection(user);
  
  // Load initial books
  await loadBooks('Old Testament');
  await loadNumberOfChapters();
  const booksEl = document.getElementById('books');
  const chaptersEl = document.getElementById('chapters');
  if (booksEl && chaptersEl) {
    await loadNumberOfVerses(booksEl.value, chaptersEl.value);
  }

  // Check subscription status and show/hide premium banner
  const status = await getSubscriptionStatus();
  const premiumBanner = document.getElementById('premium-banner');
  if (premiumBanner && status.isActive) {
    premiumBanner.classList.add('hidden');
  }

  // Setup event listeners
  setupDashboardEvents();
}

/**
 * Update welcome section with user data
 */
async function updateWelcomeSection(user) {
  const nameEl = document.getElementById('dashboard-user-name');
  const streakEl = document.getElementById('dashboard-streak');

  if (nameEl) {
    nameEl.textContent = user.displayName || 'Disciple';
  }

  // Get streak from Firestore
  try {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists() && streakEl) {
      streakEl.textContent = userSnap.data().streak || 0;
    }
  } catch (error) {
    console.error('Error fetching streak:', error);
  }
}

/**
 * Setup dashboard event listeners
 */
function setupDashboardEvents() {
  // Premium banner upgrade button
  document.getElementById('banner-upgrade-btn')?.addEventListener('click', () => {
    showUpgradeModal();
  });

  // Testament toggle
  document.querySelectorAll('.testament-toggle button').forEach(btn => {
    btn.addEventListener('click', async () => {
      document.querySelectorAll('.testament-toggle button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      await loadBooks(btn.dataset.testament);
      await loadNumberOfChapters();
      const booksEl = document.getElementById('books');
      const chaptersEl = document.getElementById('chapters');
      if (booksEl && chaptersEl) {
        await loadNumberOfVerses(booksEl.value, chaptersEl.value);
      }
    });
  });

  // Book selector change
  document.getElementById('books')?.addEventListener('change', async (e) => {
    await loadNumberOfChapters();
    const chaptersEl = document.getElementById('chapters');
    if (chaptersEl) {
      await loadNumberOfVerses(e.target.value, chaptersEl.value);
    }
  });

  // Chapter selector change
  document.getElementById('chapters')?.addEventListener('change', async (e) => {
    const booksEl = document.getElementById('books');
    if (booksEl) {
      await loadNumberOfVerses(booksEl.value, e.target.value);
    }
  });

  // Step 1 Next button
  document.getElementById('step-1-next')?.addEventListener('click', () => {
    const book = document.getElementById('books')?.value;
    const chapter = document.getElementById('chapters')?.value;
    const verse = document.getElementById('verse-choice')?.value || '1';

    if (!book || !chapter) {
      showToast('Please select a book and chapter');
      return;
    }

    // Mark step 1 as completed and go to step 2
    goToStep(2);
  });

  // Step 2 Back button
  document.getElementById('step-2-back')?.addEventListener('click', () => {
    goToStep(1);
  });

  // Step 2 Start button
  document.getElementById('step-2-next')?.addEventListener('click', () => {
    startGame();
  });

  // Difficulty cards
  document.querySelectorAll('.difficulty-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.difficulty-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      selectedDifficulty = card.dataset.difficulty;
    });
  });

  // Quick action: Random verse
  document.getElementById('random-verse-btn')?.addEventListener('click', () => {
    startRandomVerse();
  });

  // Quick action: My Progress
  document.getElementById('my-profile-btn')?.addEventListener('click', () => {
    window.location.hash = '/profile';
  });

  // Daily verse memorize button
  document.getElementById('memorize-daily-btn')?.addEventListener('click', () => {
    // Start with Jeremiah 29:11 as default daily verse
    startGameWithVerse('Jeremiah', '29', '11');
  });
}

/**
 * Navigate to a specific step
 */
function goToStep(step) {
  currentStep = step;

  // Update step indicators
  document.querySelectorAll('.step-indicator').forEach(ind => {
    const indStep = parseInt(ind.dataset.step);
    ind.classList.remove('active', 'completed');
    
    if (indStep < step) {
      ind.classList.add('completed');
    } else if (indStep === step) {
      ind.classList.add('active');
    }
  });

  // Update step panels
  document.querySelectorAll('.step-panel').forEach(panel => {
    panel.classList.remove('active');
    if (parseInt(panel.dataset.step) === step) {
      panel.classList.add('active');
    }
  });
}

/**
 * Start the game with selected options
 */
function startGame() {
  const book = document.getElementById('books')?.value;
  const chapter = document.getElementById('chapters')?.value;
  const verse = document.getElementById('verse-choice')?.value || '1';

  // Store difficulty in a way the game can access
  setSelectedDifficulty(selectedDifficulty);
  
  // Hide dashboard, show game
  document.querySelector('.dashboard')?.classList.add('hidden');
  document.getElementById('game-container')?.classList.remove('hidden');

  // Start the game
  game.start(book, chapter, verse);
}

/**
 * Start game with specific verse
 */
function startGameWithVerse(book, chapter, verse) {
  selectedDifficulty = 'easy';
  setSelectedDifficulty(selectedDifficulty);
  
  document.querySelector('.dashboard')?.classList.add('hidden');
  document.getElementById('game-container')?.classList.remove('hidden');

  game.start(book, chapter, verse);
}

/**
 * Start a random verse
 */
function startRandomVerse() {
  const popularVerses = [
    { book: 'John', chapter: '3', verse: '16' },
    { book: 'Philippians', chapter: '4', verse: '13' },
    { book: 'Jeremiah', chapter: '29', verse: '11' },
    { book: 'Proverbs', chapter: '3', verse: '5' },
    { book: 'Romans', chapter: '8', verse: '28' },
    { book: 'Psalm', chapter: '23', verse: '1' },
    { book: 'Isaiah', chapter: '40', verse: '31' },
    { book: 'Matthew', chapter: '11', verse: '28' },
    { book: 'Joshua', chapter: '1', verse: '9' },
    { book: 'Psalm', chapter: '46', verse: '1' }
  ];

  const random = popularVerses[Math.floor(Math.random() * popularVerses.length)];
  startGameWithVerse(random.book, random.chapter, random.verse);
}

/**
 * Set selected difficulty for game to read
 */
function setSelectedDifficulty(difficulty) {
  // Create a visual element that the game can check
  const difficultyMap = { easy: 0, medium: 1, hard: 2 };
  const buttons = document.querySelectorAll('.difficulty-section button');
  buttons.forEach((btn, i) => {
    btn.classList.toggle('active', i === difficultyMap[difficulty]);
  });
}

/**
 * Show dashboard and hide game
 */
export function showDashboard() {
  // Show header and footer
  document.getElementById('main-header')?.classList.remove('hidden');
  document.getElementById('main-footer')?.classList.remove('hidden');
  
  // Show dashboard, hide game
  document.querySelector('.dashboard')?.classList.remove('hidden');
  document.getElementById('game-container')?.classList.add('hidden');
  
  // Reset step wizard to step 1
  goToStep(1);
}

/**
 * Show toast notification
 */
function showToast(message) {
  let toast = document.getElementById('dashboard-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'dashboard-toast';
    toast.style.cssText = `
      position: fixed;
      bottom: 100px;
      left: 50%;
      transform: translateX(-50%) translateY(20px);
      background: var(--bg-elevated);
      color: var(--text-primary);
      padding: var(--space-3) var(--space-6);
      border-radius: var(--radius-full);
      border: 1px solid var(--border-subtle);
      z-index: 1100;
      opacity: 0;
      transition: all 0.3s ease;
      font-weight: 500;
      box-shadow: var(--shadow-lg);
    `;
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.style.opacity = '1';
  toast.style.transform = 'translateX(-50%) translateY(0)';

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(20px)';
  }, 3000);
}
