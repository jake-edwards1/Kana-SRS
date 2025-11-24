// LocalStorage utilities
const STORAGE_KEY = 'hiraganaFlashcards';

// Safe localStorage access
const getLocalStorage = () => {
    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            return window.localStorage;
        }
    } catch (e) {
        console.warn('localStorage not available:', e);
    }
    return null;
};

export const saveData = (cards, settings, streak) => {
    const storage = getLocalStorage();
    if (!storage) return;

    try {
        const data = {
            cards: cards.map(card => ({
                char: card.char,
                romaji: card.romaji,
                type: card.type,
                mnemonic: card.mnemonic,
                image: card.image,
                easeFactor: card.easeFactor,
                interval: card.interval,
                repetitions: card.repetitions,
                dueDate: card.dueDate,
                lastReview: card.lastReview,
                totalReviews: card.totalReviews,
                correctReviews: card.correctReviews,
                introducedDate: card.introducedDate
            })),
            settings,
            streak
        };

        storage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
        console.error('Error saving data:', e);
    }
};

export const loadData = () => {
    const storage = getLocalStorage();
    if (!storage) return null;

    try {
        const savedData = storage.getItem(STORAGE_KEY);
        return savedData ? JSON.parse(savedData) : null;
    } catch (e) {
        console.error('Error loading data:', e);
        return null;
    }
};

export const clearData = () => {
    const storage = getLocalStorage();
    if (!storage) return;

    try {
        storage.removeItem(STORAGE_KEY);
    } catch (e) {
        console.error('Error clearing data:', e);
    }
};

export const exportData = () => {
    const storage = getLocalStorage();
    if (!storage) return null;

    try {
        const savedData = storage.getItem(STORAGE_KEY);
        if (!savedData) return null;

        // Create a blob with the data
        const blob = new Blob([savedData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        // Create download link
        const link = document.createElement('a');
        link.href = url;
        link.download = `hiragana-progress-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        return true;
    } catch (e) {
        console.error('Error exporting data:', e);
        return false;
    }
};

export const importData = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);

                // Validate the data structure
                if (!data.cards || !Array.isArray(data.cards)) {
                    reject(new Error('Invalid data format: missing cards array'));
                    return;
                }

                const storage = getLocalStorage();
                if (!storage) {
                    reject(new Error('localStorage not available'));
                    return;
                }

                storage.setItem(STORAGE_KEY, JSON.stringify(data));
                resolve(data);
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = () => {
            reject(new Error('Error reading file'));
        };

        reader.readAsText(file);
    });
};
