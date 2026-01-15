/**
 * Simple SPA Router for DiscipleMe
 * Handles view navigation and route guards with loading state
 */

import { auth } from './firebase-config.mjs';

// Available views
export const VIEWS = {
  LANDING: 'landing-view',
  APP: 'app-view',
  PROFILE: 'profile-view'
};

// Current view state
let currentView = null;
let authReady = false;
const viewChangeListeners = [];

/**
 * Show loading state
 */
function showLoading() {
  let loader = document.getElementById('app-loader');
  if (!loader) {
    loader = document.createElement('div');
    loader.id = 'app-loader';
    loader.innerHTML = `
      <div class="loader-content">
        <div class="loader-spinner"></div>
        <p>Loading...</p>
      </div>
    `;
    loader.style.cssText = `
      position: fixed;
      inset: 0;
      background: var(--bg-primary, #0a0a0f);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      transition: opacity 0.3s ease;
    `;
    
    const style = document.createElement('style');
    style.textContent = `
      .loader-content {
        text-align: center;
        color: var(--text-primary, #fff);
      }
      .loader-spinner {
        width: 48px;
        height: 48px;
        border: 4px solid var(--border-subtle, #333);
        border-top-color: var(--brand-cyan, #00D4FF);
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 1rem;
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(loader);
  }
  loader.style.display = 'flex';
  loader.style.opacity = '1';
}

/**
 * Hide loading state
 */
function hideLoading() {
  const loader = document.getElementById('app-loader');
  if (loader) {
    loader.style.opacity = '0';
    setTimeout(() => {
      loader.style.display = 'none';
    }, 300);
  }
}

/**
 * Hide all views initially (before auth is ready)
 */
export function hideAllViews() {
  Object.values(VIEWS).forEach(id => {
    const view = document.getElementById(id);
    if (view) {
      view.classList.add('hidden');
    }
  });
}

/**
 * Navigate to a specific view
 * @param {string} viewId - The view ID to navigate to
 * @param {boolean} pushState - Whether to push to browser history
 */
export function navigateTo(viewId, pushState = true) {
  // Hide all views first
  Object.values(VIEWS).forEach(id => {
    const view = document.getElementById(id);
    if (view) {
      view.classList.add('hidden');
    }
  });

  // Show requested view
  const targetView = document.getElementById(viewId);
  if (targetView) {
    targetView.classList.remove('hidden');
    // Only animate if auth is ready (prevents flash during initial load)
    if (authReady) {
      targetView.classList.add('animate-fade-in');
    }
    currentView = viewId;

    // Update hash
    if (pushState) {
      const route = viewIdToRoute(viewId);
      window.location.hash = route;
    }

    // Notify listeners
    viewChangeListeners.forEach(cb => cb(viewId));

    // Scroll to top
    window.scrollTo(0, 0);
  }

  // Hide loader once first navigation is done
  if (authReady) {
    hideLoading();
  }
}

/**
 * Navigate based on auth state
 * @param {Object|null} user - Firebase user object
 */
export function handleAuthNavigation(user) {
  // Mark auth as ready
  authReady = true;
  
  const hash = window.location.hash.slice(1) || '/';
  
  if (user) {
    // Authenticated user
    if (hash === '/' || hash === '/landing') {
      navigateTo(VIEWS.APP, true);
    } else if (hash === '/profile') {
      navigateTo(VIEWS.PROFILE, true);
    } else if (hash === '/app') {
      navigateTo(VIEWS.APP, true);
    } else {
      navigateTo(VIEWS.APP, true);
    }
  } else {
    // Unauthenticated - always show landing
    navigateTo(VIEWS.LANDING, true);
  }
  
  // Hide loading after navigation
  hideLoading();
}

/**
 * Convert view ID to route
 */
function viewIdToRoute(viewId) {
  switch (viewId) {
    case VIEWS.LANDING: return '/';
    case VIEWS.APP: return '/app';
    case VIEWS.PROFILE: return '/profile';
    default: return '/';
  }
}

/**
 * Convert route to view ID
 */
function routeToViewId(route) {
  switch (route) {
    case '/':
    case '/landing':
      return VIEWS.LANDING;
    case '/app':
      return VIEWS.APP;
    case '/profile':
      return VIEWS.PROFILE;
    default:
      return VIEWS.LANDING;
  }
}

/**
 * Subscribe to view changes
 * @param {Function} callback
 * @returns {Function} Unsubscribe function
 */
export function onViewChange(callback) {
  viewChangeListeners.push(callback);
  return () => {
    const index = viewChangeListeners.indexOf(callback);
    if (index > -1) viewChangeListeners.splice(index, 1);
  };
}

/**
 * Initialize router
 */
export function initRouter() {
  // Hide all views and show loading immediately
  hideAllViews();
  showLoading();
  
  // Handle hash changes
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.slice(1) || '/';
    const viewId = routeToViewId(hash);
    
    // Check auth for protected routes
    if ((viewId === VIEWS.APP || viewId === VIEWS.PROFILE) && !auth.currentUser) {
      navigateTo(VIEWS.LANDING, true);
      return;
    }
    
    navigateTo(viewId, false);
  });

  // Handle initial route - don't navigate yet, wait for auth
  const initialHash = window.location.hash.slice(1) || '/';
  return routeToViewId(initialHash);
}

/**
 * Get current view
 */
export function getCurrentView() {
  return currentView;
}
