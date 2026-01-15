import { getBooks, getChapterVerses } from "./api.mjs";
import { auth, db } from "./firebase-config.mjs";
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  getDocs, 
  addDoc, 
  serverTimestamp,
  increment 
} from "firebase/firestore";

let books = [];

// Initialize books data
try {
    books = await getBooks();
} catch (error) {
    console.error("Failed to load books from API:", error);
}

// --- URL & Navigation Utils ---

export function getParams() {
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  return {
    book: urlParams.get('book'),
    chapter: urlParams.get('chapter'),
    verse: urlParams.get('verse')
  };
}

export function setParams(book, chapter, verse) {
  const url = new URL(window.location);
  url.searchParams.set('book', book);
  url.searchParams.set('chapter', chapter);
  url.searchParams.set('verse', verse);
  window.history.pushState({}, '', url);
}

// --- Template Loading Utils ---

export async function loadTemplate(path){
  const file = await fetch(path);
  return await file.text();
}

export function renderWithTemplate(template, parentElement) {
  parentElement.innerHTML = template;
}

export async function loadHeaderFooter(){
  const headerContent = await loadTemplate('../partials/header.html');
  const footerContent = await loadTemplate('../partials/footer.html');

  const header = document.getElementById('main-header');
  const footer = document.getElementById('main-footer');

  if (header) renderWithTemplate(headerContent, header);
  if (footer) renderWithTemplate(footerContent, footer);
}

// --- Dropdown Population Utils ---

export async function loadBooks(testament = "Old Testament") {
  const booksElement = document.getElementById("books");
  if (!booksElement) return;
  
  booksElement.innerHTML = ""; 
  
  if (!books || books.length === 0) {
      const option = document.createElement("option");
      option.textContent = "Error loading books";
      booksElement.appendChild(option);
      return;
  }
  
  // Filter books by testament (OT: first 39, NT: remaining 27)
  let filteredBooks = testament === "Old Testament" ? books.slice(0, 39) : books.slice(39);

  filteredBooks.forEach(book => {
    const bookElement = document.createElement("option");
    bookElement.value = book.id; 
    bookElement.textContent = book.name || book.commonName || book.id; 
    booksElement.appendChild(bookElement);
  });
}

export async function loadNumberOfChapters(selectedBookId) {
  const booksElement = document.getElementById("books");
  const bookId = selectedBookId || booksElement.value;

  if (bookId) {
    const book = books.find((b) => b.id === bookId);
    const chaptersElement = document.getElementById("chapters");
    if (chaptersElement) {
        chaptersElement.innerHTML = ""; 

        if (book) {
          for (let i = 0; i < book.numberOfChapters; i++) {
            const chapterElement = document.createElement("option");
            chapterElement.value = i + 1;
            chapterElement.textContent = i + 1;
            chaptersElement.appendChild(chapterElement);
          }
        }
    }
  }
}

export async function loadNumberOfVerses(book, chapter){
  const booksElement = document.getElementById("books");
  const chaptersElement = document.getElementById("chapters");
  
  const bookVal = book || booksElement?.value;
  const chapterVal = chapter || chaptersElement?.value;

  if (!bookVal || !chapterVal) return;

  try {
      const verses = await getChapterVerses(bookVal, chapterVal);
      const versesElement = document.getElementById("verses");
      const verseInput = document.getElementById("verse-choice");

      if(versesElement) versesElement.innerHTML = "";
      if(verseInput) verseInput.value = ""; 

      if (verses && verses.chapter && verses.chapter.content){
        verses.chapter.content.forEach((verse) => {
              const verseElement = document.createElement("option");
              verseElement.value = verse.verse;
              verseElement.textContent = verse.verse
              versesElement.appendChild(verseElement);
        });
      }
  } catch (error) {
      console.error("Error loading verses:", error);
  }
}

// --- Firestore User Data Utils ---

/**
 * Get user data from Firestore
 * Falls back to localStorage for unauthenticated users
 */
export async function getUserData() {
  const user = auth.currentUser;
  
  if (!user) {
    // Fallback to localStorage for guests
    return getLocalStorageData();
  }

  try {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      return { streak: 0, mastered: [], supporterStatus: false };
    }

    const userData = userSnap.data();
    
    // Get mastered verses from subcollection
    const masteredRef = collection(db, 'users', user.uid, 'mastered_verses');
    const masteredSnap = await getDocs(masteredRef);
    const mastered = masteredSnap.docs.map(doc => doc.data().reference);

    return {
      streak: userData.streak || 0,
      mastered,
      supporterStatus: userData.supporterStatus || false,
      displayName: userData.displayName
    };
  } catch (error) {
    console.error("Error fetching user data:", error);
    return { streak: 0, mastered: [], supporterStatus: false };
  }
}

/**
 * Save verse progress to Firestore
 * Only 'hard' difficulty marks as mastered, others are 'in progress'
 */
export async function saveMasteredVerse(reference, difficulty = 'easy') {
  const user = auth.currentUser;
  const isMastered = difficulty === 'hard';
  
  if (!user) {
    // Fallback to localStorage for guests
    const { streak, mastered } = getLocalStorageData();
    if (!mastered.includes(reference)) {
      mastered.push(reference);
      saveLocalStorageData(streak + 1, mastered);
    }
    return;
  }

  try {
    const userRef = doc(db, 'users', user.uid);
    const versesRef = collection(db, 'users', user.uid, 'mastered_verses');
    
    // Check if verse already exists
    const existingSnap = await getDocs(versesRef);
    const existingDoc = existingSnap.docs.find(
      doc => doc.data().reference === reference
    );

    if (existingDoc) {
      // Update existing verse if new difficulty is higher
      const existingDiff = existingDoc.data().difficulty;
      const difficultyOrder = { easy: 1, medium: 2, hard: 3 };
      
      if (difficultyOrder[difficulty] > difficultyOrder[existingDiff]) {
        // Upgrade the difficulty level
        await setDoc(doc(db, 'users', user.uid, 'mastered_verses', existingDoc.id), {
          reference,
          difficulty,
          status: isMastered ? 'mastered' : 'in_progress',
          masteredAt: isMastered ? serverTimestamp() : null,
          lastPracticedAt: serverTimestamp()
        }, { merge: true });
      }
    } else {
      // Add new verse
      await addDoc(versesRef, {
        reference,
        difficulty,
        status: isMastered ? 'mastered' : 'in_progress',
        masteredAt: isMastered ? serverTimestamp() : null,
        lastPracticedAt: serverTimestamp()
      });

      // Increment streak only for new verses
      await setDoc(userRef, {
        streak: increment(1),
        lastActivityDate: serverTimestamp()
      }, { merge: true });
    }
  } catch (error) {
    console.error("Error saving verse progress:", error);
  }
}

// --- Legacy localStorage Utils (for guests and migration) ---

export function getLocalStorageData() {
  const streak = parseInt(localStorage.getItem('discipleme_streak') || '0');
  const mastered = JSON.parse(localStorage.getItem('discipleme_mastered') || '[]');
  return { streak, mastered };
}

export function saveLocalStorageData(streak, mastered) {
  localStorage.setItem('discipleme_streak', streak.toString());
  localStorage.setItem('discipleme_mastered', JSON.stringify(mastered));
}

/**
 * Check if user has legacy localStorage data to migrate
 */
export function hasLegacyData() {
  const streak = parseInt(localStorage.getItem('discipleme_streak') || '0');
  const mastered = JSON.parse(localStorage.getItem('discipleme_mastered') || '[]');
  return streak > 0 || mastered.length > 0;
}

/**
 * Migrate localStorage data to Firestore for authenticated user
 */
export async function migrateLegacyData() {
  const user = auth.currentUser;
  if (!user) return { success: false, error: 'Not authenticated' };

  const { streak, mastered } = getLocalStorageData();
  
  if (streak === 0 && mastered.length === 0) {
    return { success: true, migrated: 0 };
  }

  try {
    const userRef = doc(db, 'users', user.uid);
    const masteredRef = collection(db, 'users', user.uid, 'mastered_verses');

    // Update streak
    await setDoc(userRef, {
      streak: increment(streak),
      lastActivityDate: serverTimestamp()
    }, { merge: true });

    // Add all mastered verses
    for (const reference of mastered) {
      await addDoc(masteredRef, {
        reference,
        difficulty: 'legacy',
        masteredAt: serverTimestamp()
      });
    }

    // Clear localStorage after successful migration
    localStorage.removeItem('discipleme_streak');
    localStorage.removeItem('discipleme_mastered');

    return { success: true, migrated: mastered.length };
  } catch (error) {
    console.error("Migration error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Show legacy data migration prompt
 */
export function showLegacySyncPrompt() {
  return new Promise((resolve) => {
    const { streak, mastered } = getLocalStorageData();
    
    let modal = document.getElementById('legacy-sync-modal');
    if (modal) modal.remove();

    modal = document.createElement('div');
    modal.id = 'legacy-sync-modal';
    modal.className = 'auth-modal-overlay';
    
    modal.innerHTML = `
      <div class="auth-modal" style="max-width: 380px;">
        <div class="auth-modal-header">
          <h2>Welcome Back! 👋</h2>
          <p>We found your previous progress:</p>
        </div>

        <div style="background: var(--bg-secondary, #f3f4f6); padding: 1rem; border-radius: 8px; margin: 1rem 0;">
          <p style="margin: 0.25rem 0;"><strong>🔥 Streak:</strong> ${streak} days</p>
          <p style="margin: 0.25rem 0;"><strong>📖 Verses Mastered:</strong> ${mastered.length}</p>
        </div>

        <p style="font-size: 0.875rem; color: #666; margin-bottom: 1rem;">
          Would you like to import this progress to your account?
        </p>

        <div style="display: flex; gap: 0.5rem;">
          <button class="btn-secondary" id="skip-sync-btn" style="flex: 1;">Skip</button>
          <button class="btn-primary" id="import-sync-btn" style="flex: 1;">Import</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('skip-sync-btn').addEventListener('click', () => {
      modal.remove();
      resolve(false);
    });

    document.getElementById('import-sync-btn').addEventListener('click', async () => {
      const btn = document.getElementById('import-sync-btn');
      btn.textContent = 'Importing...';
      btn.disabled = true;
      
      const result = await migrateLegacyData();
      modal.remove();
      
      if (result.success) {
        showModal('Import Complete! ✅', `Successfully imported ${result.migrated} verses to your account.`);
      }
      
      resolve(result.success);
    });
  });
}

// --- UI Helper Utils ---

export async function updateStreakUI() {
  const { streak, supporterStatus } = await getUserData();
  const streakElement = document.querySelector(".streak span");
  if (streakElement) {
    streakElement.textContent = streak;
  }

  // Show supporter badge if applicable
  const badgeContainer = document.querySelector(".supporter-badge");
  if (badgeContainer && supporterStatus) {
    badgeContainer.classList.remove("hidden");
  }
}

export function showModal(title, content) {
  let modal = document.getElementById('ai-modal');
  if (!modal) {
      modal = document.createElement('div');
      modal.id = 'ai-modal';
      modal.style.cssText = `
          position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;
      `;
      document.body.appendChild(modal);
  }
  
  modal.innerHTML = `
      <div style="background: white; padding: 24px; border-radius: 12px; max-width: 90%; width: 400px; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h3 style="margin-top: 0; color: var(--primary);">${title}</h3>
          <div style="margin: 16px 0; font-size: 1rem; color: #374151;">${content}</div>
          <button class="btn-primary" onclick="document.getElementById('ai-modal').remove()">Close</button>
      </div>
  `;
}

// --- Network Status Utils ---

let isOnline = navigator.onLine;
const networkListeners = [];

/**
 * Subscribe to network status changes
 */
export function onNetworkChange(callback) {
  networkListeners.push(callback);
  return () => {
    const index = networkListeners.indexOf(callback);
    if (index > -1) networkListeners.splice(index, 1);
  };
}

/**
 * Check if currently online
 */
export function checkOnlineStatus() {
  return isOnline;
}

/**
 * Initialize network awareness
 */
export function initNetworkAwareness() {
  const updateOnlineStatus = () => {
    isOnline = navigator.onLine;
    networkListeners.forEach(cb => cb(isOnline));
    updateOfflineIndicator();
  };

  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  
  // Initial indicator
  updateOfflineIndicator();
}

function updateOfflineIndicator() {
  let indicator = document.getElementById('offline-indicator');
  
  if (!isOnline) {
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'offline-indicator';
      indicator.className = 'offline-indicator';
      indicator.innerHTML = `
        <i class="fa-solid fa-wifi-slash"></i>
        <span>Offline - Some features unavailable</span>
      `;
      document.body.appendChild(indicator);
    }
    indicator.classList.add('visible');
  } else if (indicator) {
    indicator.classList.remove('visible');
  }
}