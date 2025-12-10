import { loadHeaderFooter, loadBooks, loadNumberOfChapters, loadNumberOfVerses, getParams, setParams } from "./utils.mjs";
import { getVerse } from "./api.mjs";
import { getVerseInsight, getVersePrayer } from "./ai.mjs"; // Import AI functions

const booksElement = document.getElementById("books");
const chaptersElement = document.getElementById("chapters");
const startButton = document.querySelector(".cta-section button");
const difficultyButtons = document.querySelectorAll(".difficulty-section button");

// Initialize App
async function init() {
  await loadHeaderFooter();
  await loadBooks();
  
  updateStreakUI();

  const params = getParams();
  if (params.book && params.chapter && params.verse) {
    startGame(params.book, params.chapter, params.verse);
  } else {
    await loadNumberOfChapters();
    await loadNumberOfVerses(booksElement.value, chaptersElement.value)
  }
}

// ... (Event listeners remain the same) ...
booksElement.addEventListener("change", async () => {
  await loadNumberOfChapters();
  await loadNumberOfVerses(booksElement.value, chaptersElement.value)
});

chaptersElement.addEventListener("change", async() => {
  await loadNumberOfVerses(booksElement.value, chaptersElement.value)
})

difficultyButtons.forEach(button => {
    button.addEventListener("click", () => {
        difficultyButtons.forEach(btn => btn.classList.remove("active"));
        button.classList.add("active");
    });
});

startButton.addEventListener("click", () => {
  const book = booksElement.value;
  const chapter = chaptersElement.value;
  const verse = document.getElementById("verse-choice").value || "1"; 

  setParams(book, chapter, verse);
  startGame(book, chapter, verse);
});

// Storage Functions
function getStorageData() {
    const streak = parseInt(localStorage.getItem('discipleme_streak') || '0');
    const mastered = JSON.parse(localStorage.getItem('discipleme_mastered') || '[]');
    return { streak, mastered };
}

function saveStorageData(streak, mastered) {
    localStorage.setItem('discipleme_streak', streak.toString());
    localStorage.setItem('discipleme_mastered', JSON.stringify(mastered));
}

function updateStreakUI() {
    const { streak } = getStorageData();
    const streakElement = document.querySelector(".streak span");
    if (streakElement) {
        streakElement.textContent = streak;
    }
}

// Simple Modal Logic for AI
function showModal(title, content) {
    // Create modal elements if they don't exist, or select them
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

async function startGame(book, chapter, verse) {
  document.querySelector(".scripture-reference-section").classList.add("hidden");
  document.querySelector(".difficulty-section").classList.add("hidden");
  document.querySelector(".cta-section").classList.add("hidden");

  const gameContainer = document.getElementById("game-container");
  if(gameContainer) {
      gameContainer.classList.remove("hidden");
      
      const refPill = gameContainer.querySelector(".reference-pill");
      const textContainer = gameContainer.querySelector(".scripture-text");
      const wordChipsContainer = gameContainer.querySelector(".word-chips-container");
      const progressBar = gameContainer.querySelector(".progress-bar"); 
      const hintButton = gameContainer.querySelector(".hint-btn");
      
      // Add Insight Button next to Hint if not already there
      let insightButton = gameContainer.querySelector(".insight-btn");
      if (!insightButton && hintButton) {
          insightButton = document.createElement("button");
          insightButton.className = "hint-btn insight-btn";
          insightButton.style.marginLeft = "12px";
          insightButton.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> Insight`;
          hintButton.parentNode.insertBefore(insightButton, hintButton.nextSibling);
      }

      if(progressBar) progressBar.style.width = "0%";
      if(textContainer) textContainer.innerHTML = "Loading scripture...";

      try {
        const verseData = await getVerse(book, chapter, verse);
        
        if(refPill) refPill.textContent = verseData.reference;
        
        // Setup Insight Button Click
        if (insightButton) {
            // Clone to remove old listeners
            const newInsightBtn = insightButton.cloneNode(true);
            insightButton.parentNode.replaceChild(newInsightBtn, insightButton);
            
            newInsightBtn.addEventListener("click", async () => {
                newInsightBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Loading...`;
                const insight = await getVerseInsight(verseData.reference, verseData.text);
                showModal("Verse Insight", insight);
                newInsightBtn.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> Insight`;
            });
        }

        if(textContainer) {
            const words = verseData.text.split(" ");
            let html = "";
            let hiddenWords = [];

            // --- DIFFICULTY LOGIC ---
            let percentageToHide = 0.2; 
            const activeDifficultyBtn = document.querySelector(".difficulty-section button.active");
            
            if (activeDifficultyBtn) {
                const levelText = activeDifficultyBtn.innerText.toLowerCase();
                if (levelText.includes("medium")) percentageToHide = 0.5;
                if (levelText.includes("hard")) percentageToHide = 1.0;
            }

            const wordCount = words.length;
            const hideCount = Math.floor(wordCount * percentageToHide);
            const indicesToHide = new Set();

            if (percentageToHide === 1.0) {
                for(let i=0; i<wordCount; i++) indicesToHide.add(i);
            } else {
                const targetCount = Math.max(1, hideCount); 
                while (indicesToHide.size < targetCount && indicesToHide.size < wordCount) {
                    const randomIndex = Math.floor(Math.random() * wordCount);
                    indicesToHide.add(randomIndex);
                }
            }

            words.forEach((word, index) => {
                if (indicesToHide.has(index)) { 
                    const cleanAnswer = word.replace(/[.,;!?"“”]/g, "");
                    html += `<span class="blank-slot" data-answer="${cleanAnswer}">_____</span> `;
                    hiddenWords.push(cleanAnswer); 
                } else {
                    html += `${word} `;
                }
            });
            textContainer.innerHTML = html;

            if(wordChipsContainer) {
                wordChipsContainer.innerHTML = hiddenWords
                    .sort(() => Math.random() - 0.5)
                    .map(word => `<button class="word-chip">${word}</button>`)
                    .join("");
                
                let correctCount = 0;
                const totalBlanks = hiddenWords.length;

                const chips = wordChipsContainer.querySelectorAll(".word-chip");
                chips.forEach(chip => {
                    chip.addEventListener("click", function() {
                        const selectedWord = this.innerText;
                        const slots = textContainer.querySelectorAll(".blank-slot");
                        let targetSlot = null;
                        
                        for (let slot of slots) {
                            if (slot.innerText === "_____") {
                                targetSlot = slot;
                                break;
                            }
                        }

                        if (targetSlot) {
                            const correctAnswer = targetSlot.getAttribute("data-answer");
                            targetSlot.innerText = selectedWord;
                            targetSlot.classList.add("filled");

                            if (selectedWord.trim() === correctAnswer.trim()) {
                                targetSlot.style.color = "var(--secondary)"; 
                                targetSlot.style.borderBottom = "none";
                                
                                correctCount++;
                                const percentage = (correctCount / totalBlanks) * 100;
                                if(progressBar) progressBar.style.width = `${percentage}%`;

                                // WIN CONDITION
                                if (correctCount === totalBlanks) {
                                    let { streak, mastered } = getStorageData();
                                    const currentRef = verseData.reference;

                                    if (!mastered.includes(currentRef)) {
                                        streak++;
                                        mastered.push(currentRef);
                                        saveStorageData(streak, mastered);
                                        updateStreakUI();
                                    }
                                    
                                    // Trigger Win Modal with Prayer Button
                                    setTimeout(async () => {
                                        // Create a custom content div for the modal
                                        const winContent = `
                                            <p style="margin-bottom: 1rem;">You mastered <strong>${verseData.reference}</strong>!</p>
                                            <button id="prayer-btn" class="btn-primary" style="width: 100%; margin-bottom: 0.5rem; background-color: var(--accent-1); color: #fff;">
                                                <i class="fa-solid fa-hands-praying"></i> Generate Prayer
                                            </button>
                                        `;
                                        showModal("Verse Mastered! 🎉", winContent);
                                        
                                        // Add Listener for Prayer Button
                                        const prayerBtn = document.getElementById("prayer-btn");
                                        if(prayerBtn) {
                                            prayerBtn.addEventListener("click", async () => {
                                                prayerBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Writing...`;
                                                const prayer = await getVersePrayer(verseData.reference, verseData.text);
                                                showModal("Personal Prayer 🙏", prayer);
                                            });
                                        }
                                    }, 500);
                                }

                            } else {
                                targetSlot.style.color = "var(--accent-2)"; 
                                targetSlot.style.textDecoration = "line-through";
                            }

                            this.remove();
                        }
                    });
                });

                if (hintButton) {
                    const newHintBtn = hintButton.cloneNode(true);
                    hintButton.parentNode.replaceChild(newHintBtn, hintButton);
                    
                    newHintBtn.addEventListener("click", () => {
                        const emptySlots = Array.from(textContainer.querySelectorAll(".blank-slot")).filter(slot => slot.innerText === "_____");
                        if (emptySlots.length > 0) {
                            const targetSlot = emptySlots[0]; 
                            const answer = targetSlot.getAttribute("data-answer");
                            const availableChips = Array.from(wordChipsContainer.querySelectorAll(".word-chip"));
                            const matchingChip = availableChips.find(chip => chip.innerText.trim() === answer.trim());
                            if (matchingChip) matchingChip.click();
                        }
                    });
                }
            }
        }

      } catch (err) {
        console.error(err);
        if(textContainer) textContainer.innerHTML = `Error loading verse. <br><button class="btn-primary" onclick="window.location.reload()">Try Again</button>`;
      }
  }
}

init();