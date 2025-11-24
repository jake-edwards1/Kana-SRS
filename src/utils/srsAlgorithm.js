// SRS Algorithm Class (SuperMemo 2 based)
export class SRSCard {
    constructor(char, romaji, type, mnemonic, image, script = 'hiragana') {
        this.char = char;
        this.romaji = romaji;
        this.type = type; // 'basic', 'dakuten', 'handakuten'
        this.script = script; // 'hiragana' or 'katakana'
        this.mnemonic = mnemonic;
        this.image = image;
        this.easeFactor = 2.5;
        this.interval = 0;
        this.repetitions = 0;
        this.dueDate = new Date().toISOString();
        this.lastReview = null;
        this.totalReviews = 0;
        this.correctReviews = 0;
        this.introducedDate = null; // Date when card was first introduced to user
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

        // Ensure minimum interval for successful reviews (prevents 0 * easeFactor = 0 bug)
        if (rating >= 3 && this.interval < 1) {
            this.interval = 1;
        }

        // Set next due date (midnight-based: cards become due at start of day)
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + this.interval);
        // Reset to midnight (start of day) so cards become due at midnight
        nextDate.setHours(0, 0, 0, 0);
        this.dueDate = nextDate.toISOString();

        return this.interval;
    }

    isDue() {
        return new Date(this.dueDate) <= new Date();
    }

    isMastered() {
        return this.repetitions >= 5 && this.easeFactor >= 2.5;
    }

    isLearning() {
        return this.repetitions > 0 && this.repetitions < 5;
    }

    isNew() {
        return this.totalReviews === 0;
    }

    getStage() {
        if (this.isMastered()) return 'mastered';
        if (this.isLearning()) return 'learning';
        if (this.isNew()) return 'new';
        return 'review'; // 5+ reviews but not mastered yet
    }

    getAccuracy() {
        return this.totalReviews > 0 ? Math.round((this.correctReviews / this.totalReviews) * 100) : 0;
    }

    // Preview what interval would be given for a rating without applying it
    static previewInterval(card, rating) {
        const tempCard = Object.assign(Object.create(Object.getPrototypeOf(card)), card);
        return tempCard.review(rating);
    }

    // Format interval for display
    static formatInterval(days) {
        if (days === 0) return '<10m';
        if (days === 1) return '<1d';
        if (days < 30) return `<${days}d`;
        if (days < 365) return `<${Math.round(days / 30)}mo`;
        return `<${Math.round(days / 365)}y`;
    }
}

// Restore card from saved data
export function restoreCard(cardData) {
    const card = new SRSCard(
        cardData.char,
        cardData.romaji,
        cardData.type,
        cardData.mnemonic,
        cardData.image,
        cardData.script || 'hiragana' // Default to hiragana for backwards compatibility
    );
    card.easeFactor = cardData.easeFactor;
    card.interval = cardData.interval !== undefined ? cardData.interval : 0;
    card.repetitions = cardData.repetitions;
    card.dueDate = cardData.dueDate;
    card.lastReview = cardData.lastReview;
    card.totalReviews = cardData.totalReviews;
    card.correctReviews = cardData.correctReviews;
    card.introducedDate = cardData.introducedDate || null;
    return card;
}
