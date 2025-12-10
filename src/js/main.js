import { loadHeaderFooter, loadBooks, loadNumberOfChapters, loadNumberOfVerses, getParams, setParams } from "./utils.mjs";
import { getVerse } from "./api.mjs";

const booksElement = document.getElementById("books");
const chaptersElement = document.getElementById("chapters");
const startButton = document.querySelector(".cta-section button");

// Initialize App
async function init() {
  await loadHeaderFooter();
  await loadBooks();
  
  // Check if we are "in a game" based on URL
  const params = getParams();
  if (params.book && params.chapter && params.verse) {
    // We have a routed game! Load it.
    startGame(params.book, params.chapter, params.verse);
  } else {
    // Just load the default setup
    await loadNumberOfChapters();
    await loadNumberOfVerses(booksElement.value, chaptersElement.value)
  }
}

// Event Listeners
booksElement.addEventListener("change", async () => {
  await loadNumberOfChapters();
  await loadNumberOfVerses(booksElement.value, chaptersElement.value)
});

chaptersElement.addEventListener("change", async() => {
  await loadNumberOfVerses(booksElement.value, chaptersElement.value)
})


startButton.addEventListener("click", () => {
  const book = booksElement.value;
  const chapter = chaptersElement.value;
  const verse = document.getElementById("verse-choice").value || "1"; // Default to 1 if empty

  // 1. Update URL (Routing)
  setParams(book, chapter, verse);

  // 2. Start Game Logic
  startGame(book, chapter, verse);
});

async function startGame(book, chapter, verse) {
  // Logic to hide setup UI and show Game UI
  document.querySelector(".scripture-reference-section").classList.add("hidden");
  document.querySelector(".difficulty-section").classList.add("hidden");
  document.querySelector(".cta-section").classList.add("hidden");

  // You need a container in index.html with id="game-container" to show this
  const gameContainer = document.getElementById("game-container");
  if(gameContainer) {
      gameContainer.classList.remove("hidden");
      gameContainer.innerHTML = "<p>Loading...</p>"; // Loading state

      try {
        const verseData = await getVerse(book, chapter, verse);
        // Render your game here using verseData
        gameContainer.innerHTML = `
            <h2>${verseData.reference}</h2>
            <p>${verseData.text}</p>
            <button class="btn-primary" onclick="window.location.href='/'">Back to Home</button>
        `;
      } catch (err) {
        gameContainer.innerHTML = `<p>Error loading verse. <button onclick="window.location.href='/'">Go Back</button></p>`;
      }
  }
}

init();