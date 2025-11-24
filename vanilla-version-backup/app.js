// Hiragana character data
const HIRAGANA_DATA = {
    basic: [
        { char: 'あ', romaji: 'a' }, { char: 'い', romaji: 'i' }, { char: 'う', romaji: 'u' }, { char: 'え', romaji: 'e' }, { char: 'お', romaji: 'o' },
        { char: 'か', romaji: 'ka' }, { char: 'き', romaji: 'ki' }, { char: 'く', romaji: 'ku' }, { char: 'け', romaji: 'ke' }, { char: 'こ', romaji: 'ko' },
        { char: 'さ', romaji: 'sa' }, { char: 'し', romaji: 'shi' }, { char: 'す', romaji: 'su' }, { char: 'せ', romaji: 'se' }, { char: 'そ', romaji: 'so' },
        { char: 'た', romaji: 'ta' }, { char: 'ち', romaji: 'chi' }, { char: 'つ', romaji: 'tsu' }, { char: 'て', romaji: 'te' }, { char: 'と', romaji: 'to' },
        { char: 'な', romaji: 'na' }, { char: 'に', romaji: 'ni' }, { char: 'ぬ', romaji: 'nu' }, { char: 'ね', romaji: 'ne' }, { char: 'の', romaji: 'no' },
        { char: 'は', romaji: 'ha' }, { char: 'ひ', romaji: 'hi' }, { char: 'ふ', romaji: 'fu' }, { char: 'へ', romaji: 'he' }, { char: 'ほ', romaji: 'ho' },
        { char: 'ま', romaji: 'ma' }, { char: 'み', romaji: 'mi' }, { char: 'む', romaji: 'mu' }, { char: 'め', romaji: 'me' }, { char: 'も', romaji: 'mo' },
        { char: 'や', romaji: 'ya' }, { char: 'ゆ', romaji: 'yu' }, { char: 'よ', romaji: 'yo' },
        { char: 'ら', romaji: 'ra' }, { char: 'り', romaji: 'ri' }, { char: 'る', romaji: 'ru' }, { char: 'れ', romaji: 're' }, { char: 'ろ', romaji: 'ro' },
        { char: 'わ', romaji: 'wa' }, { char: 'を', romaji: 'wo' }, { char: 'ん', romaji: 'n' }
    ],
    dakuten: [
        { char: 'が', romaji: 'ga' }, { char: 'ぎ', romaji: 'gi' }, { char: 'ぐ', romaji: 'gu' }, { char: 'げ', romaji: 'ge' }, { char: 'ご', romaji: 'go' },
        { char: 'ざ', romaji: 'za' }, { char: 'じ', romaji: 'ji' }, { char: 'ず', romaji: 'zu' }, { char: 'ぜ', romaji: 'ze' }, { char: 'ぞ', romaji: 'zo' },
        { char: 'だ', romaji: 'da' }, { char: 'ぢ', romaji: 'di' }, { char: 'づ', romaji: 'du' }, { char: 'で', romaji: 'de' }, { char: 'ど', romaji: 'do' },
        { char: 'ば', romaji: 'ba' }, { char: 'び', romaji: 'bi' }, { char: 'ぶ', romaji: 'bu' }, { char: 'べ', romaji: 'be' }, { char: 'ぼ', romaji: 'bo' }
    ],
    handakuten: [
        { char: 'ぱ', romaji: 'pa' }, { char: 'ぴ', romaji: 'pi' }, { char: 'ぷ', romaji: 'pu' }, { char: 'ぺ', romaji: 'pe' }, { char: 'ぽ', romaji: 'po' }
    ]
};

// SRS Algorithm Class (SuperMemo 2 based)
class SRSCard {
    constructor(char, romaji, type) {
        this.char = char;
        this.romaji = romaji;
        this.type = type; // 'basic', 'dakuten', 'handakuten'
        this.easeFactor = 2.5;
        this.interval = 0;
        this.repetitions = 0;
        this.dueDate = new Date().toISOString();
        this.lastReview = null;
        this.totalReviews = 0;
        this.correctReviews = 0;
    }

    review(rating) {
        // rating: 1 = Again, 2 = Hard, 3 = Good, 4 = Easy
        this.totalReviews++;
        this.lastReview = new Date().toISOString();

        if (rating >= 3) {
            this.correctReviews++;
        }

        if (rating < 3) {
            // Failed - reset to beginning
            this.repetitions = 0;
            this.interval = 0;
        } else {
            // Passed
            if (this.repetitions === 0) {
                this.interval = 1;
            } else if (this.repetitions === 1) {
                this.interval = 6;
            } else {
                this.interval = Math.round(this.interval * this.easeFactor);
            }
            this.repetitions++;

            // Adjust ease factor based on rating
            this.easeFactor = this.easeFactor + (0.1 - (4 - rating) * (0.08 + (4 - rating) * 0.02));

            // Minimum ease factor is 1.3
            if (this.easeFactor < 1.3) {
                this.easeFactor = 1.3;
            }
        }

        // Adjust interval based on rating
        if (rating === 2) { // Hard
            this.interval = Math.max(1, Math.round(this.interval * 1.2));
        } else if (rating === 4) { // Easy
            this.interval = Math.round(this.interval * 1.5);
        }

        // Set next due date
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + this.interval);
        this.dueDate = nextDate.toISOString();

        return this.interval;
    }

    isDue() {
        return new Date(this.dueDate) <= new Date();
    }

    isMastered() {
        return this.repetitions >= 5 && this.easeFactor >= 2.5;
    }

    getAccuracy() {
        return this.totalReviews > 0 ? Math.round((this.correctReviews / this.totalReviews) * 100) : 0;
    }
}

// Application State
class FlashcardApp {
    constructor() {
        this.cards = [];
        this.currentCard = null;
        this.sessionStats = {
            reviewed: 0,
            correct: 0
        };
        this.settings = {
            newCardsPerDay: 10,
            reviewLimit: 100,
            enableBasic: true,
            enableDakuten: true,
            enableHandakuten: true
        };
        this.streak = {
            current: 0,
            best: 0,
            lastStudyDate: null
        };

        this.loadData();
        this.initializeCards();
        this.setupEventListeners();
        this.updateUI();
        this.checkStreak();
    }

    initializeCards() {
        const allCharacters = [];

        if (this.settings.enableBasic) {
            allCharacters.push(...HIRAGANA_DATA.basic.map(item => ({ ...item, type: 'basic' })));
        }
        if (this.settings.enableDakuten) {
            allCharacters.push(...HIRAGANA_DATA.dakuten.map(item => ({ ...item, type: 'dakuten' })));
        }
        if (this.settings.enableHandakuten) {
            allCharacters.push(...HIRAGANA_DATA.handakuten.map(item => ({ ...item, type: 'handakuten' })));
        }

        // Create cards that don't exist yet
        allCharacters.forEach(({ char, romaji, type }) => {
            if (!this.cards.find(card => card.char === char)) {
                this.cards.push(new SRSCard(char, romaji, type));
            }
        });

        // Remove cards that are disabled
        this.cards = this.cards.filter(card => {
            if (card.type === 'basic') return this.settings.enableBasic;
            if (card.type === 'dakuten') return this.settings.enableDakuten;
            if (card.type === 'handakuten') return this.settings.enableHandakuten;
            return true;
        });
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Show answer button
        document.getElementById('show-answer-btn').addEventListener('click', () => this.showAnswer());

        // Rating buttons
        document.querySelectorAll('[data-rating]').forEach(btn => {
            btn.addEventListener('click', (e) => this.rateCard(parseInt(e.target.dataset.rating)));
        });

        // Continue learning
        document.getElementById('continue-learning-btn').addEventListener('click', () => this.nextCard());

        // Settings
        document.getElementById('save-settings-btn').addEventListener('click', () => this.saveSettings());
        document.getElementById('reset-progress-btn').addEventListener('click', () => this.resetProgress());

        // Breakdown tabs
        document.querySelectorAll('.breakdown-tab').forEach(btn => {
            btn.addEventListener('click', (e) => this.filterCharacters(e.target.dataset.type));
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === ' ' && !document.getElementById('flashcard-back').classList.contains('hidden')) {
                e.preventDefault();
            }
            if (e.key === ' ' || e.key === 'Enter') {
                if (!document.getElementById('rating-controls').classList.contains('hidden')) {
                    this.rateCard(3); // Default to "Good"
                } else if (!document.getElementById('show-answer-btn').classList.contains('hidden')) {
                    this.showAnswer();
                }
            } else if (e.key === '1') this.rateCard(1);
            else if (e.key === '2') this.rateCard(2);
            else if (e.key === '3') this.rateCard(3);
            else if (e.key === '4') this.rateCard(4);
        });
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}-tab`);
        });

        // Update content if needed
        if (tabName === 'stats') {
            this.updateStatistics();
        } else if (tabName === 'settings') {
            this.loadSettings();
        }
    }

    getDueCards() {
        return this.cards.filter(card => card.isDue()).sort((a, b) =>
            new Date(a.dueDate) - new Date(b.dueDate)
        );
    }

    getNewCards() {
        return this.cards.filter(card => card.totalReviews === 0).slice(0, this.settings.newCardsPerDay);
    }

    nextCard() {
        const dueCards = this.getDueCards();
        const newCards = this.getNewCards();

        // Combine due cards and new cards
        const availableCards = [...dueCards, ...newCards];

        if (availableCards.length === 0) {
            this.showSessionComplete();
            return;
        }

        // Hide session complete
        document.getElementById('session-complete').classList.add('hidden');

        // Pick the next card (prioritize due cards)
        this.currentCard = availableCards[0];

        // Update UI
        document.getElementById('flashcard-front').querySelector('.character').textContent = this.currentCard.char;
        document.getElementById('flashcard-back').querySelector('.romaji').textContent = this.currentCard.romaji;

        // Reset view
        document.getElementById('flashcard-back').classList.add('hidden');
        document.getElementById('show-answer-btn').classList.remove('hidden');
        document.getElementById('rating-controls').classList.add('hidden');
        document.getElementById('controls').classList.remove('hidden');

        this.updateUI();
    }

    showAnswer() {
        document.getElementById('flashcard-back').classList.remove('hidden');
        document.getElementById('show-answer-btn').classList.add('hidden');
        document.getElementById('controls').classList.add('hidden');
        document.getElementById('rating-controls').classList.remove('hidden');

        // Update interval previews
        this.updateIntervalPreviews();
    }

    updateIntervalPreviews() {
        const intervals = [
            this.previewInterval(1),
            this.previewInterval(2),
            this.previewInterval(3),
            this.previewInterval(4)
        ];

        intervals.forEach((interval, index) => {
            const text = this.formatInterval(interval);
            document.getElementById(`interval-${index + 1}`).textContent = text;
        });
    }

    previewInterval(rating) {
        // Create a temporary card copy to preview the interval
        const tempCard = Object.assign(Object.create(Object.getPrototypeOf(this.currentCard)), this.currentCard);
        return tempCard.review(rating);
    }

    formatInterval(days) {
        if (days === 0) return '<10m';
        if (days === 1) return '<1d';
        if (days < 30) return `<${days}d`;
        if (days < 365) return `<${Math.round(days / 30)}mo`;
        return `<${Math.round(days / 365)}y`;
    }

    rateCard(rating) {
        if (!this.currentCard) return;

        this.currentCard.review(rating);
        this.sessionStats.reviewed++;
        if (rating >= 3) {
            this.sessionStats.correct++;
        }

        this.saveData();
        this.nextCard();
    }

    showSessionComplete() {
        document.getElementById('flashcard-container').style.display = 'none';
        document.getElementById('controls').classList.add('hidden');
        document.getElementById('rating-controls').classList.add('hidden');
        document.getElementById('session-complete').classList.remove('hidden');

        const accuracy = this.sessionStats.reviewed > 0
            ? Math.round((this.sessionStats.correct / this.sessionStats.reviewed) * 100)
            : 0;

        document.getElementById('session-reviewed').textContent = this.sessionStats.reviewed;
        document.getElementById('session-accuracy').textContent = accuracy + '%';

        // Update streak
        this.updateStreak();
    }

    updateUI() {
        // Show flashcard container if hidden
        document.getElementById('flashcard-container').style.display = 'block';

        // Update counts
        const dueCount = this.getDueCards().length;
        const newCount = this.getNewCards().length;
        const masteredCount = this.cards.filter(card => card.isMastered()).length;

        document.getElementById('due-count').textContent = dueCount;
        document.getElementById('new-count').textContent = newCount;
        document.getElementById('mastered-count').textContent = masteredCount;

        // Update streak display
        document.getElementById('streak-count').textContent = this.streak.current;
    }

    updateStatistics() {
        // Overall stats
        const totalCards = this.cards.length;
        const totalReviews = this.cards.reduce((sum, card) => sum + card.totalReviews, 0);
        const totalCorrect = this.cards.reduce((sum, card) => sum + card.correctReviews, 0);
        const accuracy = totalReviews > 0 ? Math.round((totalCorrect / totalReviews) * 100) : 0;

        document.getElementById('total-cards').textContent = totalCards;
        document.getElementById('total-reviews').textContent = totalReviews;
        document.getElementById('best-streak').textContent = this.streak.best;
        document.getElementById('accuracy-rate').textContent = accuracy + '%';

        // Character breakdown
        this.filterCharacters('all');
    }

    filterCharacters(type) {
        // Update active tab
        document.querySelectorAll('.breakdown-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.type === type);
        });

        // Filter cards
        let filteredCards = this.cards;
        if (type !== 'all') {
            filteredCards = this.cards.filter(card => card.type === type);
        }

        // Render character grid
        const grid = document.getElementById('character-grid');
        grid.innerHTML = '';

        filteredCards.forEach(card => {
            const item = document.createElement('div');
            item.className = 'character-item';

            if (card.isMastered()) {
                item.classList.add('mastered');
            } else if (card.totalReviews > 0) {
                item.classList.add('learning');
            } else {
                item.classList.add('new');
            }

            item.innerHTML = `
                <div class="char-display">${card.char}</div>
                <div class="char-romaji">${card.romaji}</div>
                <div class="char-stats">${card.getAccuracy()}% (${card.totalReviews})</div>
            `;

            grid.appendChild(item);
        });
    }

    checkStreak() {
        const today = new Date().toDateString();
        const lastStudy = this.streak.lastStudyDate ? new Date(this.streak.lastStudyDate).toDateString() : null;

        if (lastStudy === today) {
            // Already studied today
            return;
        }

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toDateString();

        if (lastStudy !== yesterdayStr && lastStudy !== null) {
            // Streak broken
            this.streak.current = 0;
        }
    }

    updateStreak() {
        const today = new Date().toDateString();
        const lastStudy = this.streak.lastStudyDate ? new Date(this.streak.lastStudyDate).toDateString() : null;

        if (lastStudy !== today && this.sessionStats.reviewed > 0) {
            this.streak.current++;
            this.streak.lastStudyDate = new Date().toISOString();

            if (this.streak.current > this.streak.best) {
                this.streak.best = this.streak.current;
            }

            this.saveData();
            this.updateUI();
        }
    }

    loadSettings() {
        document.getElementById('new-cards-per-day').value = this.settings.newCardsPerDay;
        document.getElementById('review-limit').value = this.settings.reviewLimit;
        document.getElementById('enable-basic').checked = this.settings.enableBasic;
        document.getElementById('enable-dakuten').checked = this.settings.enableDakuten;
        document.getElementById('enable-handakuten').checked = this.settings.enableHandakuten;
    }

    saveSettings() {
        this.settings.newCardsPerDay = parseInt(document.getElementById('new-cards-per-day').value);
        this.settings.reviewLimit = parseInt(document.getElementById('review-limit').value);
        this.settings.enableBasic = document.getElementById('enable-basic').checked;
        this.settings.enableDakuten = document.getElementById('enable-dakuten').checked;
        this.settings.enableHandakuten = document.getElementById('enable-handakuten').checked;

        this.initializeCards();
        this.saveData();
        this.updateUI();

        alert('Settings saved successfully!');
    }

    resetProgress() {
        if (confirm('Are you sure you want to reset all progress? This cannot be undone!')) {
            if (confirm('Really? All your learning data will be deleted!')) {
                localStorage.clear();
                location.reload();
            }
        }
    }

    saveData() {
        const data = {
            cards: this.cards.map(card => ({
                char: card.char,
                romaji: card.romaji,
                type: card.type,
                easeFactor: card.easeFactor,
                interval: card.interval,
                repetitions: card.repetitions,
                dueDate: card.dueDate,
                lastReview: card.lastReview,
                totalReviews: card.totalReviews,
                correctReviews: card.correctReviews
            })),
            settings: this.settings,
            streak: this.streak
        };

        localStorage.setItem('hiraganaFlashcards', JSON.stringify(data));
    }

    loadData() {
        const savedData = localStorage.getItem('hiraganaFlashcards');

        if (savedData) {
            const data = JSON.parse(savedData);

            // Restore cards
            this.cards = data.cards.map(cardData => {
                const card = new SRSCard(cardData.char, cardData.romaji, cardData.type);
                card.easeFactor = cardData.easeFactor;
                card.interval = cardData.interval;
                card.repetitions = cardData.repetitions;
                card.dueDate = cardData.dueDate;
                card.lastReview = cardData.lastReview;
                card.totalReviews = cardData.totalReviews;
                card.correctReviews = cardData.correctReviews;
                return card;
            });

            // Restore settings
            if (data.settings) {
                this.settings = data.settings;
            }

            // Restore streak
            if (data.streak) {
                this.streak = data.streak;
            }
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new FlashcardApp();
    app.nextCard();
});
