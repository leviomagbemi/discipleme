import { getVerse } from "./api.mjs";
import { getVerseInsight, getVersePrayer } from "./ai.mjs";
import { 
  showModal, 
  getUserData, 
  saveMasteredVerse, 
  updateStreakUI,
  checkOnlineStatus 
} from "./utils.mjs";
import { auth } from "./firebase-config.mjs";

export class ScriptureGame {
    constructor() {
        this.container = document.getElementById("game-container");
        this.isGameComplete = false;
        this.hintsRemaining = 3; // Limited hints per game
        this.currentDifficulty = 'easy';
    }

    // Initialize and start the game
    async start(book, chapter, verse) {
        // Reset game state
        this.isGameComplete = false;
        this.hintsRemaining = 3;
        
        // Get difficulty from dashboard step wizard
        this.detectDifficulty();
        
        this.toggleHomeVisibility(false);
        this.showContainer();

        // Initialize UI Elements
        const refPill = this.container.querySelector(".reference-pill");
        const textContainer = this.container.querySelector(".scripture-text");
        const progressBar = this.container.querySelector(".progress-bar");
        
        // Reset state
        if (progressBar) progressBar.style.width = "0%";
        if (textContainer) textContainer.innerHTML = "Loading scripture...";

        try {
            // Fetch Data
            const verseData = await getVerse(book, chapter, verse);
            
            // Render basic info
            if (refPill) refPill.textContent = verseData.reference;

            // Setup Insight Button (only if online and authenticated)
            await this.setupInsightButton(verseData);

            // Update hint button display
            this.updateHintDisplay();

            // Setup Game Logic (Blanks & Word Bank)
            this.setupGamePlay(verseData, textContainer, progressBar);

        } catch (err) {
            console.error(err);
            if (textContainer) {
                textContainer.innerHTML = `Error loading verse. <br><button class="btn-primary" onclick="window.location.reload()">Try Again</button>`;
            }
        }
    }

    /**
     * Detect difficulty from dashboard step wizard
     */
    detectDifficulty() {
        // Check new dashboard difficulty cards first
        const activeCard = document.querySelector(".difficulty-card.active");
        if (activeCard) {
            this.currentDifficulty = activeCard.dataset.difficulty || 'easy';
            return;
        }
        
        // Fallback to old difficulty section
        const activeDifficultyBtn = document.querySelector(".difficulty-section button.active");
        if (activeDifficultyBtn) {
            const levelText = activeDifficultyBtn.innerText.toLowerCase();
            if (levelText.includes("hard")) {
                this.currentDifficulty = 'hard';
            } else if (levelText.includes("medium")) {
                this.currentDifficulty = 'medium';
            } else {
                this.currentDifficulty = 'easy';
            }
        }
    }

    toggleHomeVisibility(visible) {
        // Hide/show dashboard
        const dashboard = document.querySelector(".dashboard");
        if (dashboard) {
            dashboard.classList.toggle("hidden", !visible);
        }
        
        // Hide/show header and footer during game
        const header = document.getElementById("main-header");
        const footer = document.getElementById("main-footer");
        
        if (header) header.classList.toggle("hidden", !visible);
        if (footer) footer.classList.toggle("hidden", !visible);
    }

    showContainer() {
        this.container?.classList.remove("hidden");
        // Remove any top padding/margin
        if (this.container) {
            this.container.style.paddingTop = "0";
            this.container.style.marginTop = "0";
        }
    }

    /**
     * Update hint button display with remaining count
     */
    updateHintDisplay() {
        const hintButton = this.container.querySelector(".hint-btn:not(.insight-btn)");
        if (hintButton) {
            hintButton.innerHTML = `<i class="fa-regular fa-lightbulb"></i> Hint (${this.hintsRemaining})`;
            
            if (this.hintsRemaining <= 0 || this.isGameComplete) {
                hintButton.disabled = true;
                hintButton.classList.add("disabled-hint");
            } else {
                hintButton.disabled = false;
                hintButton.classList.remove("disabled-hint");
            }
        }
    }

    async setupInsightButton(verseData) {
        const hintButton = this.container.querySelector(".hint-btn:not(.insight-btn)");
        let insightButton = this.container.querySelector(".insight-btn");

        // Create button if it doesn't exist
        if (!insightButton && hintButton) {
            insightButton = document.createElement("button");
            insightButton.className = "hint-btn insight-btn";
            insightButton.style.marginLeft = "12px";
            hintButton.parentNode.insertBefore(insightButton, hintButton.nextSibling);
        }

        if (!insightButton) return;

        // Get AI usage status
        let aiStatusText = "";
        if (auth.currentUser) {
            try {
                const { checkAIUsage } = await import('./subscription.mjs');
                const usage = await checkAIUsage();
                if (usage.remaining !== Infinity) {
                    aiStatusText = ` (${usage.remaining} left)`;
                }
            } catch (e) {
                console.error("Error checking AI usage:", e);
            }
        }

        insightButton.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> Insight${aiStatusText}`;

        // Attach event listener (cloning replaces old listeners)
        const newInsightBtn = insightButton.cloneNode(true);
        insightButton.parentNode.replaceChild(newInsightBtn, insightButton);
        
        newInsightBtn.addEventListener("click", async () => {
            // Don't allow insight after game completion
            if (this.isGameComplete) {
                showModal("Game Complete", "Insights are only available during gameplay.");
                return;
            }

            // Check network status first
            if (!checkOnlineStatus()) {
                showModal("Offline Mode", "AI insights require an internet connection. Keep playing in Standard mode!");
                return;
            }

            // Check if user is authenticated
            if (!auth.currentUser) {
                showModal("Sign In Required", `
                    <p style="margin-bottom: var(--space-4);">Sign in to unlock AI-powered insights!</p>
                    <button class="btn-primary w-full" onclick="document.getElementById('ai-modal').remove(); import('./auth.mjs').then(m => m.showAuthModal('signin'));">
                        Sign In
                    </button>
                `);
                return;
            }

            // Check AI usage limits
            try {
                const { checkAIUsage, incrementAIUsage, showUpgradeModal } = await import('./subscription.mjs');
                const usage = await checkAIUsage();
                
                if (!usage.allowed) {
                    showUpgradeModal();
                    return;
                }

                const originalText = newInsightBtn.innerHTML;
                newInsightBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Loading...`;
                newInsightBtn.disabled = true;
                
                const insight = await getVerseInsight(verseData.reference, verseData.text);
                
                // Increment usage after successful request
                await incrementAIUsage();
                
                // Show insight with remaining count for free users
                const updatedUsage = await checkAIUsage();
                let insightContent = insight;
                if (updatedUsage.remaining !== Infinity) {
                    insightContent += `<p style="margin-top: var(--space-4); font-size: var(--text-xs); color: var(--text-muted);">${updatedUsage.remaining} AI request${updatedUsage.remaining !== 1 ? 's' : ''} remaining today</p>`;
                    // Update button text
                    newInsightBtn.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> Insight (${updatedUsage.remaining} left)`;
                } else {
                    newInsightBtn.innerHTML = originalText;
                }
                
                showModal("Verse Insight ✨", insightContent);
                newInsightBtn.disabled = false;
            } catch (error) {
                console.error("Insight error:", error);
                showModal("AI Unavailable", "Sorry, the AI service is temporarily unavailable. Please try again later.");
                newInsightBtn.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> Insight`;
                newInsightBtn.disabled = false;
            }
        });

        // Visual indicator if offline or not authenticated
        if (!checkOnlineStatus() || !auth.currentUser) {
            newInsightBtn.classList.add("disabled-hint");
            newInsightBtn.title = !checkOnlineStatus() 
                ? "Offline - AI unavailable" 
                : "Sign in to unlock AI insights";
        }
    }

    setupGamePlay(verseData, textContainer, progressBar) {
        const words = verseData.text.split(" ");
        let html = "";
        let hiddenWords = [];
        
        // Determine difficulty from instance property
        let percentageToHide = 0.2; // Easy default
        
        if (this.currentDifficulty === 'medium') {
            percentageToHide = 0.5;
        } else if (this.currentDifficulty === 'hard') {
            percentageToHide = 1.0;
        }

        // Calculate indices to hide
        const wordCount = words.length;
        const hideCount = Math.floor(wordCount * percentageToHide);
        const indicesToHide = new Set();

        if (percentageToHide === 1.0) {
            // Hard mode: hide ALL words
            for(let i = 0; i < wordCount; i++) {
                indicesToHide.add(i);
            }
        } else {
            // Easy/Medium: hide random percentage
            const targetCount = Math.max(1, hideCount); 
            while (indicesToHide.size < targetCount && indicesToHide.size < wordCount) {
                indicesToHide.add(Math.floor(Math.random() * wordCount));
            }
        }

        // Build HTML string
        words.forEach((word, index) => {
            if (indicesToHide.has(index)) { 
                const cleanAnswer = word.replace(/[.,;!?"""]/g, "");
                html += `<span class="blank-slot" data-answer="${cleanAnswer}">_____</span> `;
                hiddenWords.push(cleanAnswer); 
            } else {
                html += `${word} `;
            }
        });
        textContainer.innerHTML = html;

        // Setup Word Bank chips
        this.renderWordChips(hiddenWords, textContainer, progressBar, verseData);
    }

    renderWordChips(hiddenWords, textContainer, progressBar, verseData) {
        const wordChipsContainer = this.container.querySelector(".word-chips-container");
        if (!wordChipsContainer) return;

        wordChipsContainer.innerHTML = hiddenWords
            .sort(() => Math.random() - 0.5)
            .map(word => `<button class="word-chip">${word}</button>`)
            .join("");
        
        const chips = wordChipsContainer.querySelectorAll(".word-chip");
        let correctCount = 0;
        const totalBlanks = hiddenWords.length;

        // Chip click logic
        chips.forEach(chip => {
            chip.addEventListener("click", () => {
                const selectedWord = chip.innerText;
                const slots = textContainer.querySelectorAll(".blank-slot");
                let targetSlot = null;
                
                // Find first empty slot
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
                        // Correct Answer
                        targetSlot.style.color = "var(--secondary)"; 
                        targetSlot.style.borderBottom = "none";
                        
                        correctCount++;
                        const percentage = (correctCount / totalBlanks) * 100;
                        if(progressBar) progressBar.style.width = `${percentage}%`;

                        // Check Win Condition
                        if (correctCount === totalBlanks) {
                            this.handleWin(verseData);
                        }
                    } else {
                        // Wrong Answer
                        targetSlot.style.color = "var(--accent-2)"; 
                        targetSlot.style.textDecoration = "line-through";
                    }

                    chip.remove();
                }
            });
        });

        // Setup Hint Button
        this.setupHintButton(textContainer, wordChipsContainer);
    }

    setupHintButton(textContainer, wordChipsContainer) {
        const hintButton = this.container.querySelector(".hint-btn:not(.insight-btn)");
        if (hintButton) {
            const newHintBtn = hintButton.cloneNode(true);
            newHintBtn.innerHTML = `<i class="fa-regular fa-lightbulb"></i> Hint (${this.hintsRemaining})`;
            hintButton.parentNode.replaceChild(newHintBtn, hintButton);
            
            newHintBtn.addEventListener("click", () => {
                // Don't allow hints after game completion or when none remaining
                if (this.isGameComplete || this.hintsRemaining <= 0) {
                    return;
                }

                const emptySlots = Array.from(textContainer.querySelectorAll(".blank-slot"))
                    .filter(slot => slot.innerText === "_____");
                
                if (emptySlots.length > 0) {
                    const targetSlot = emptySlots[0]; 
                    const answer = targetSlot.getAttribute("data-answer");
                    const availableChips = Array.from(wordChipsContainer.querySelectorAll(".word-chip"));
                    const matchingChip = availableChips.find(chip => chip.innerText.trim() === answer.trim());
                    
                    if (matchingChip) {
                        // Decrement hints and update display
                        this.hintsRemaining--;
                        this.updateHintDisplay();
                        
                        // Trigger the chip click
                        matchingChip.click();
                    }
                }
            });
        }
    }

    async handleWin(verseData) {
        // Mark game as complete
        this.isGameComplete = true;
        
        // Disable hint and insight buttons
        this.updateHintDisplay();
        const insightBtn = this.container.querySelector(".insight-btn");
        if (insightBtn) {
            insightBtn.disabled = true;
            insightBtn.classList.add("disabled-hint");
        }

        const currentRef = verseData.reference;
        const user = auth.currentUser;

        // Use the difficulty we detected at start
        const difficulty = this.currentDifficulty;

        // Save to appropriate storage (Firestore for auth users, localStorage for guests)
        await saveMasteredVerse(currentRef, difficulty);
        await updateStreakUI();
        
        // Trigger confetti celebration
        this.showConfetti();
        
        // Build win modal content
        setTimeout(async () => {
            const isMastered = difficulty === 'hard';
            const statusText = isMastered 
                ? '🎉 Verse Mastered!' 
                : `✅ Great progress on ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}!`;
            
            let modalContent = `
                <div style="font-size: 3rem; margin-bottom: 1rem;">${isMastered ? '🏆' : '🎯'}</div>
                <p style="margin-bottom: 1.5rem; color: var(--text-secondary);">
                    ${isMastered 
                        ? `You've mastered <strong style="color: var(--brand-cyan);">${verseData.reference}</strong>!`
                        : `You completed <strong style="color: var(--brand-cyan);">${verseData.reference}</strong> on ${difficulty}. Try the next level to master it!`
                    }
                </p>
            `;

            // Only show prayer button if online (AI feature)
            if (checkOnlineStatus() && user) {
                modalContent += `
                    <button id="prayer-btn" class="btn-primary w-full" style="margin-bottom: 0.75rem;">
                        <i class="fa-solid fa-hands-praying"></i> Generate Prayer
                    </button>
                `;
            } else if (!user) {
                modalContent += `
                    <p style="font-size: 0.875rem; color: var(--text-muted); margin-bottom: 1rem;">
                        <a href="#" id="win-sign-in" style="color: var(--brand-cyan);">Sign in</a> to save your progress and unlock AI prayers!
                    </p>
                `;
            }

            modalContent += `
                <button id="continue-btn" class="btn-secondary w-full">
                    <i class="fa-solid fa-arrow-right"></i> Continue Learning
                </button>
            `;

            showModal(statusText, modalContent);

            // Prayer button handler
            document.getElementById('prayer-btn')?.addEventListener('click', async () => {
                const prayerBtn = document.getElementById('prayer-btn');
                prayerBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Generating...`;
                prayerBtn.disabled = true;
                
                try {
                    // Check AI limits for prayer
                    const { checkAIUsage, incrementAIUsage, showUpgradeModal } = await import('./subscription.mjs');
                    const usage = await checkAIUsage();
                    
                    if (!usage.allowed) {
                        document.getElementById('ai-modal')?.remove();
                        showUpgradeModal();
                        return;
                    }
                    
                    const prayer = await getVersePrayer(verseData.reference, verseData.text);
                    await incrementAIUsage();
                    
                    prayerBtn.innerHTML = `<i class="fa-solid fa-check"></i> Prayer Generated`;
                    
                    // Show prayer in a new modal
                    setTimeout(() => {
                        document.getElementById('ai-modal')?.remove();
                        showModal("🙏 Personalized Prayer", `
                            <p style="font-style: italic; line-height: 1.8; color: var(--text-secondary);">${prayer}</p>
                            <button class="btn-primary w-full" style="margin-top: 1.5rem;" onclick="document.getElementById('ai-modal').remove(); import('./dashboard.mjs').then(m => m.showDashboard());">
                                <i class="fa-solid fa-arrow-right"></i> Continue
                            </button>
                        `);
                    }, 500);
                } catch (error) {
                    console.error("Prayer generation error:", error);
                    prayerBtn.innerHTML = `<i class="fa-solid fa-times"></i> Error`;
                }
            });

            // Continue button handler
            document.getElementById('continue-btn')?.addEventListener('click', async () => {
                document.getElementById('ai-modal')?.remove();
                const { showDashboard } = await import('./dashboard.mjs');
                showDashboard();
            });

            // Sign in link handler
            document.getElementById('win-sign-in')?.addEventListener('click', async (e) => {
                e.preventDefault();
                document.getElementById('ai-modal')?.remove();
                const { showAuthModal } = await import('./auth.mjs');
                showAuthModal('signin');
            });
        }, 500);
    }

    showConfetti() {
        const confettiCount = 100;
        const container = document.createElement('div');
        container.id = 'confetti-container';
        container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1000;
            overflow: hidden;
        `;
        document.body.appendChild(container);

        const colors = ['#00D4FF', '#7C3AED', '#F59E0B', '#10B981', '#EC4899'];
        
        for (let i = 0; i < confettiCount; i++) {
            const confetti = document.createElement('div');
            confetti.style.cssText = `
                position: absolute;
                width: ${Math.random() * 10 + 5}px;
                height: ${Math.random() * 10 + 5}px;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                left: ${Math.random() * 100}%;
                top: -20px;
                opacity: ${Math.random() * 0.5 + 0.5};
                transform: rotate(${Math.random() * 360}deg);
                animation: confetti-fall ${Math.random() * 2 + 2}s linear forwards;
            `;
            container.appendChild(confetti);
        }

        // Add keyframe animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes confetti-fall {
                to {
                    top: 100%;
                    transform: rotate(${Math.random() * 720}deg) translateX(${Math.random() * 200 - 100}px);
                }
            }
        `;
        document.head.appendChild(style);

        // Cleanup after animation
        setTimeout(() => {
            container.remove();
            style.remove();
        }, 4000);
    }
}