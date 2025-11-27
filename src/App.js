import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import { HIRAGANA_DATA } from './data/hiraganaData';
import { KATAKANA_DATA } from './data/katakanaData';
import { SRSCard, restoreCard } from './utils/srsAlgorithm';
import { saveData, loadData, clearData, exportData, importData } from './utils/storage';
import { speakJapanese, loadVoices } from './utils/textToSpeech';
import Study from './components/Study';
import Statistics from './components/Statistics';
import Settings from './components/Settings';
import ToastContainer from './components/ToastContainer';
import DailyWelcome from './components/DailyWelcome';
import WelcomeWizard from './components/WelcomeWizard';

function App() {
    const [cards, setCards] = useState([]);
    const [currentCard, setCurrentCard] = useState(null);
    const [isFlipped, setIsFlipped] = useState(false);
    const [activeTab, setActiveTab] = useState('study');
    const [sessionStats, setSessionStats] = useState({ reviewed: 0, correct: 0 });
    const [sessionComplete, setSessionComplete] = useState(false);
    const [cardHistory, setCardHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [settings, setSettings] = useState({
        newCardsPerDay: 10,
        reviewLimit: 100,
        enableBasic: true,
        enableDakuten: true,
        enableHandakuten: true,
        enableKatakana: false,
        katakanaUnlocked: false,
        autoPronunciation: true
    });
    const [streak, setStreak] = useState({
        current: 0,
        best: 0,
        lastStudyDate: null
    });
    const [toasts, setToasts] = useState([]);
    const [lastRating, setLastRating] = useState(null); // For undo functionality
    const [showWelcome, setShowWelcome] = useState(false);
    const [sessionCards, setSessionCards] = useState([]); // Cards reviewed in this session
    const [reviewMode, setReviewMode] = useState(false); // Practice mode for recent cards
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // Mobile hamburger menu
    const [showDailyWelcome, setShowDailyWelcome] = useState(false); // Daily welcome modal
    const [yesterdayStats, setYesterdayStats] = useState(null); // Yesterday's stats for daily modal

    // Toast notification system
    const showToast = useCallback((message, type = 'info', duration = 3000) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type, duration }]);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    // Initialize cards from hiragana and katakana data
    const initializeCards = useCallback(() => {
        const allCharacters = [];

        // Hiragana cards
        if (settings.enableBasic) {
            allCharacters.push(...HIRAGANA_DATA.basic.map(item => ({ ...item, type: 'basic', script: 'hiragana' })));
        }
        if (settings.enableDakuten) {
            allCharacters.push(...HIRAGANA_DATA.dakuten.map(item => ({ ...item, type: 'dakuten', script: 'hiragana' })));
        }
        if (settings.enableHandakuten) {
            allCharacters.push(...HIRAGANA_DATA.handakuten.map(item => ({ ...item, type: 'handakuten', script: 'hiragana' })));
        }

        // Katakana cards (only if enabled AND unlocked)
        if (settings.enableKatakana && settings.katakanaUnlocked) {
            allCharacters.push(...KATAKANA_DATA.basic.map(item => ({ ...item, type: 'basic', script: 'katakana' })));
            allCharacters.push(...KATAKANA_DATA.dakuten.map(item => ({ ...item, type: 'dakuten', script: 'katakana' })));
            allCharacters.push(...KATAKANA_DATA.handakuten.map(item => ({ ...item, type: 'handakuten', script: 'katakana' })));
        }

        setCards(prevCards => {
            const newCards = [...prevCards];

            // Add new cards that don't exist
            allCharacters.forEach(({ char, romaji, type, mnemonic, image, script }) => {
                if (!newCards.find(card => card.char === char)) {
                    newCards.push(new SRSCard(char, romaji, type, mnemonic, image, script));
                }
            });

            // Remove cards that are disabled
            return newCards.filter(card => {
                if (card.script === 'hiragana') {
                    if (card.type === 'basic') return settings.enableBasic;
                    if (card.type === 'dakuten') return settings.enableDakuten;
                    if (card.type === 'handakuten') return settings.enableHandakuten;
                } else if (card.script === 'katakana') {
                    return settings.enableKatakana && settings.katakanaUnlocked;
                }
                return true;
            });
        });
    }, [settings.enableBasic, settings.enableDakuten, settings.enableHandakuten, settings.enableKatakana, settings.katakanaUnlocked]);

    // Load data on mount
    useEffect(() => {
        const data = loadData();
        const today = new Date().toDateString();
        const lastVisitDate = localStorage.getItem('lastVisitDate');

        // Check if user has completed the welcome wizard
        const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');

        if (data) {
            const restoredCards = data.cards.map(cardData => restoreCard(cardData));
            setCards(restoredCards);
            if (data.settings) setSettings(data.settings);
            if (data.streak) setStreak(data.streak);

            // Show welcome wizard if they haven't seen it (for existing users who haven't gone through new wizard)
            if (!hasSeenWelcome) {
                setShowWelcome(true);
            } else if (lastVisitDate && lastVisitDate !== today) {
                // Check if it's a new day (only if they've seen the welcome)
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = yesterday.toDateString();

                const reviewedYesterday = restoredCards.filter(card => {
                    if (!card.lastReview) return false;
                    return new Date(card.lastReview).toDateString() === yesterdayStr;
                }).length;

                const introducedYesterday = restoredCards.filter(card => {
                    if (!card.introducedDate) return false;
                    return new Date(card.introducedDate).toDateString() === yesterdayStr;
                }).length;

                if (reviewedYesterday > 0 || introducedYesterday > 0) {
                    setYesterdayStats({
                        reviewed: reviewedYesterday,
                        introduced: introducedYesterday
                    });
                }

                // Show daily welcome modal for returning users on a new day
                setShowDailyWelcome(true);
            }
        } else {
            initializeCards();
            // Show welcome wizard for new users
            if (!hasSeenWelcome) {
                setShowWelcome(true);
            }
        }

        // Update last visit date
        localStorage.setItem('lastVisitDate', today);

        // Load voices for text-to-speech
        loadVoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Save data whenever it changes
    useEffect(() => {
        if (cards.length > 0) {
            saveData(cards, settings, streak);
        }
    }, [cards, settings, streak]);

    // Check and update streak
    useEffect(() => {
        const today = new Date().toDateString();
        const lastStudy = streak.lastStudyDate ? new Date(streak.lastStudyDate).toDateString() : null;

        if (lastStudy === today) {
            return;
        }

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toDateString();

        if (lastStudy !== yesterdayStr && lastStudy !== null) {
            setStreak(prev => ({ ...prev, current: 0 }));
        }
    }, [streak.lastStudyDate]);

    // Check if katakana should be unlocked
    useEffect(() => {
        if (settings.katakanaUnlocked) return; // Already unlocked

        const hiraganaCards = cards.filter(card => card.script === 'hiragana');
        const introducedHiragana = hiraganaCards.filter(card => card.introducedDate !== null).length;

        // Unlock katakana after 40 hiragana cards have been introduced
        if (introducedHiragana >= 40) {
            setSettings(prev => ({ ...prev, katakanaUnlocked: true, enableKatakana: true }));
            showToast('🎉 Katakana Unlocked! New cards have been added to your deck.', 'success', 5000);
        }
    }, [cards, settings.katakanaUnlocked, showToast]);

    // Get due and new cards
    const getDueCards = useCallback(() => {
        const today = new Date();
        const todayString = today.toDateString();

        // Only include cards that:
        // 1. Have been introduced
        // 2. Were introduced BEFORE today (not new cards introduced today)
        // 3. Are due for review
        const dueCards = cards.filter(card => {
            if (!card.introducedDate) return false;
            const introducedBeforeToday = new Date(card.introducedDate).toDateString() !== todayString;
            return introducedBeforeToday && card.isDue();
        });

        // Group cards by priority based on how overdue they are
        const critical = [];   // 3+ days overdue or failed cards (repetitions reset to 0)
        const high = [];       // 1-2 days overdue
        const normal = [];     // Due today (0 days overdue)

        dueCards.forEach(card => {
            const daysOverdue = Math.floor((today - new Date(card.dueDate)) / (1000 * 60 * 60 * 24));

            if (daysOverdue >= 3 || card.repetitions === 0) {
                critical.push(card);
            } else if (daysOverdue >= 1) {
                high.push(card);
            } else {
                normal.push(card);
            }
        });

        // Shuffle function to randomize within each priority group
        const shuffle = (array) => {
            const shuffled = [...array];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            return shuffled;
        };

        // Return cards in priority order with randomization within each group
        return [...shuffle(critical), ...shuffle(high), ...shuffle(normal)];
    }, [cards]);

    const getNewCards = useCallback(() => {
        // Get cards that have never been introduced (no daily limit enforcement)
        return cards.filter(card => card.totalReviews === 0 && !card.introducedDate);
    }, [cards]);

    const getLearningCards = useCallback(() => {
        return cards.filter(card => card.isLearning());
    }, [cards]);

    const getMasteredCards = useCallback(() => {
        return cards.filter(card => card.isMastered());
    }, [cards]);

    // Load next card
    const nextCard = useCallback(() => {
        // If in review mode, cycle through session cards
        if (reviewMode && sessionCards.length > 0) {
            setIsFlipped(false);
            setTimeout(() => {
                // Get a random card from session cards
                const randomCard = sessionCards[Math.floor(Math.random() * sessionCards.length)];
                setCurrentCard(randomCard);
            }, 150);
            return;
        }

        const dueCards = getDueCards();
        const newCards = getNewCards();
        const availableCards = [...dueCards, ...newCards];

        if (availableCards.length === 0) {
            setSessionComplete(true);
            setCurrentCard(null);
            setReviewMode(false); // Exit review mode
            updateStreak();
            return;
        }

        setSessionComplete(false);
        // Reset flip state first, then load new card after a brief delay
        setIsFlipped(false);
        setTimeout(() => {
            const nextCardData = availableCards[0];

            // Mark card as introduced if it's being shown for the first time
            if (!nextCardData.introducedDate && nextCardData.totalReviews === 0) {
                nextCardData.introducedDate = new Date().toISOString();
                setCards(prevCards => [...prevCards]); // Trigger save
            }

            setCurrentCard(nextCardData);
            // Add to history if it's a new card (not navigating back)
            setCardHistory(prev => {
                const newHistory = [...prev.slice(0, historyIndex + 1), nextCardData];
                return newHistory;
            });
            setHistoryIndex(prev => prev + 1);
        }, 150);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [getDueCards, getNewCards, historyIndex, reviewMode, sessionCards]);

    // Show answer with flip animation and text-to-speech
    const handleShowAnswer = () => {
        setIsFlipped(true);
        if (currentCard && settings.autoPronunciation) {
            speakJapanese(currentCard.char);
        }
    };

    // Toggle card flip
    const handleFlipToggle = () => {
        setIsFlipped(prev => !prev);
        if (!isFlipped && currentCard && settings.autoPronunciation) {
            speakJapanese(currentCard.char);
        }
    };

    // Navigate to previous card
    const handlePreviousCard = () => {
        if (historyIndex > 0) {
            setIsFlipped(false);
            setTimeout(() => {
                setHistoryIndex(prev => prev - 1);
                setCurrentCard(cardHistory[historyIndex - 1]);
            }, 150);
        }
    };

    // Navigate to next card in history
    const handleNextCard = () => {
        if (historyIndex < cardHistory.length - 1) {
            setIsFlipped(false);
            setTimeout(() => {
                setHistoryIndex(prev => prev + 1);
                setCurrentCard(cardHistory[historyIndex + 1]);
            }, 150);
        }
    };

    // Rate card
    const handleRateCard = (rating) => {
        if (!currentCard) return;

        // Save state for undo (only in normal mode, not review mode)
        if (!reviewMode) {
            const cardSnapshot = {
                char: currentCard.char,
                easeFactor: currentCard.easeFactor,
                interval: currentCard.interval,
                repetitions: currentCard.repetitions,
                dueDate: currentCard.dueDate,
                lastReview: currentCard.lastReview,
                totalReviews: currentCard.totalReviews,
                correctReviews: currentCard.correctReviews
            };

            const statsSnapshot = { ...sessionStats };

            currentCard.review(rating);
            const newStats = {
                reviewed: sessionStats.reviewed + 1,
                correct: sessionStats.correct + (rating >= 3 ? 1 : 0)
            };
            setSessionStats(newStats);

            // Save undo state
            setLastRating({
                card: currentCard,
                snapshot: cardSnapshot,
                statsSnapshot: statsSnapshot,
                rating: rating
            });

            // Track card in session
            setSessionCards(prev => {
                // Add card if not already in session list
                if (!prev.find(c => c.char === currentCard.char)) {
                    return [...prev, currentCard];
                }
                return prev;
            });

            // Update cards state
            setCards(prevCards => [...prevCards]);
        }

        nextCard();
    };

    // Undo last rating
    const handleUndoRating = () => {
        if (!lastRating) return;

        const { card, snapshot, statsSnapshot } = lastRating;

        // Restore card state
        card.easeFactor = snapshot.easeFactor;
        card.interval = snapshot.interval;
        card.repetitions = snapshot.repetitions;
        card.dueDate = snapshot.dueDate;
        card.lastReview = snapshot.lastReview;
        card.totalReviews = snapshot.totalReviews;
        card.correctReviews = snapshot.correctReviews;

        // Restore session stats
        setSessionStats(statsSnapshot);

        // Clear undo state
        setLastRating(null);

        // Update cards state
        setCards(prevCards => [...prevCards]);

        showToast('Rating undone!', 'info', 2000);
    };

    // Mark card as mastered
    const handleMarkMastered = (card) => {
        if (!card) return;

        // Set card to mastered state
        card.repetitions = 5;
        card.easeFactor = 2.5;
        card.interval = 30; // Set interval to match the due date (important to avoid 0 * easeFactor = 0 bug)
        card.lastReview = new Date().toISOString();
        card.totalReviews = card.totalReviews || 0;
        card.correctReviews = card.correctReviews || 0;

        // Set next due date to 30 days from now
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + 30);
        card.dueDate = nextDate.toISOString();

        // Update cards state to trigger re-render
        setCards(prevCards => [...prevCards]);

        // Only move to next card if on study tab
        if (activeTab === 'study') {
            nextCard();
        }
    };

    // Update streak
    const updateStreak = () => {
        const today = new Date().toDateString();
        const lastStudy = streak.lastStudyDate ? new Date(streak.lastStudyDate).toDateString() : null;

        if (lastStudy !== today && sessionStats.reviewed > 0) {
            setStreak(prev => {
                const newCurrent = prev.current + 1;
                return {
                    current: newCurrent,
                    best: Math.max(newCurrent, prev.best),
                    lastStudyDate: new Date().toISOString()
                };
            });
        }
    };

    // Start review mode for recent cards
    const handleReviewRecentCards = () => {
        if (sessionCards.length === 0) {
            showToast('No cards to review yet. Complete some reviews first!', 'info', 3000);
            return;
        }

        setReviewMode(true);
        setSessionComplete(false);
        setIsFlipped(false);

        // Pick a random card from session
        const randomCard = sessionCards[Math.floor(Math.random() * sessionCards.length)];
        setCurrentCard(randomCard);

        showToast(`Practice mode: Reviewing ${sessionCards.length} recent cards. These won't affect your progress.`, 'info', 4000);
    };

    // Exit review mode
    const handleExitReviewMode = () => {
        setReviewMode(false);
        setSessionComplete(true);
        setCurrentCard(null);
    };

    // Save settings
    const handleSaveSettings = (newSettings) => {
        setSettings(newSettings);
        initializeCards();
        showToast('Settings saved successfully!', 'success');
    };

    // Reset progress
    const handleResetProgress = () => {
        clearData();
        window.location.reload();
    };

    // Export progress
    const handleExportProgress = () => {
        const success = exportData();
        if (success) {
            showToast('Progress exported successfully!', 'success');
        } else {
            showToast('Failed to export progress. Please try again.', 'error');
        }
    };

    // Import progress
    const handleImportProgress = (file) => {
        if (!file) return;

        importData(file)
            .then((data) => {
                // Reload the app with imported data
                setCards(data.cards.map(cardData => restoreCard(cardData)));
                if (data.settings) setSettings(data.settings);
                if (data.streak) setStreak(data.streak);
                showToast('Progress imported successfully!', 'success');
            })
            .catch((error) => {
                showToast(`Failed to import progress: ${error.message}`, 'error');
            });
    };

    // Handle welcome wizard completion
    const handleWelcomeComplete = (newCardsPerDay) => {
        setSettings(prev => ({ ...prev, newCardsPerDay }));
        setShowWelcome(false);
        localStorage.setItem('hasSeenWelcome', 'true');
    };

    // Initialize first card
    useEffect(() => {
        if (cards.length > 0 && !currentCard && activeTab === 'study') {
            nextCard();
        }
    }, [cards, currentCard, activeTab, nextCard]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyPress = (e) => {
            if (activeTab !== 'study') return;

            if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                if (isFlipped) {
                    handleRateCard(3);
                } else {
                    handleShowAnswer();
                }
            } else if (e.key === '1' && isFlipped) {
                handleRateCard(1);
            } else if (e.key === '2' && isFlipped) {
                handleRateCard(2);
            } else if (e.key === '3' && isFlipped) {
                handleRateCard(3);
            } else if (e.key === '4' && isFlipped) {
                handleRateCard(4);
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                handlePreviousCard();
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                handleNextCard();
            }
        };

        document.addEventListener('keydown', handleKeyPress);
        return () => document.removeEventListener('keydown', handleKeyPress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, isFlipped, currentCard, historyIndex, cardHistory]);

    const dueCount = getDueCards().length;
    const newCount = getNewCards().length;
    const learningCount = getLearningCards().length;
    const masteredCount = getMasteredCards().length;

    // Calculate cards introduced today (excluding manually mastered cards)
    const today = new Date().toDateString();
    const introducedToday = cards.filter(card => {
        if (!card.introducedDate) return false;
        if (card.isMastered()) return false; // Don't count manually mastered cards
        return new Date(card.introducedDate).toDateString() === today;
    }).length;

    // Calculate reviews completed today (cards reviewed today that were introduced before today)
    // Must have totalReviews > 1 to count (first review is the introduction, not a "review")
    const reviewsCompletedToday = cards.filter(card => {
        if (!card.lastReview || !card.introducedDate) return false;
        if (card.totalReviews < 1) return false; // Need at least one actual review
        const reviewedToday = new Date(card.lastReview).toDateString() === today;
        const introducedBeforeToday = new Date(card.introducedDate).toDateString() !== today;
        return reviewedToday && introducedBeforeToday;
    }).length;

    // Total reviews that were due today = completed + still remaining
    // Only show if there are any reviews (avoid showing 0/0)
    const reviewsDueTotal = reviewsCompletedToday + dueCount;

    // Check if all cards have been introduced
    const allIntroduced = cards.every(card => card.introducedDate !== null);

    const handleTabClick = (tab) => {
        setActiveTab(tab);
        setMobileMenuOpen(false);
    };

    return (
        <div className="container">
            {/* Desktop Header */}
            <header className="desktop-header">
                <h1>かな Flashcards</h1>
                <div className="streak-display">
                    <span className="streak-icon">🔥</span>
                    <span>{streak.current}</span> day streak
                </div>
            </header>

            {/* Mobile Header */}
            <header className="mobile-header">
                <div className="mobile-header-content">
                    <div className="mobile-logo">
                        <span className="logo-kana">Kana</span>
                        <span className="logo-srs">SRS</span>
                    </div>
                    <div className="mobile-header-right">
                        <div className="mobile-streak">
                            <span className="streak-icon">🔥</span>
                            <span>{streak.current}</span>
                        </div>
                        <button
                            className={`hamburger-btn ${mobileMenuOpen ? 'open' : ''}`}
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            aria-label="Toggle menu"
                        >
                            <span></span>
                            <span></span>
                            <span></span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile Slide-out Menu */}
            <div
                className={`mobile-menu-overlay ${mobileMenuOpen ? 'open' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
            />
            <nav className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
                <div className="mobile-menu-header">
                    <div className="mobile-menu-title">Menu</div>
                </div>
                <button
                    className={`mobile-menu-item ${activeTab === 'study' ? 'active' : ''}`}
                    onClick={() => handleTabClick('study')}
                >
                    <span className="menu-icon">📚</span>
                    Study
                    {dueCount > 0 && (
                        <span className="menu-badge">{dueCount}</span>
                    )}
                </button>
                <button
                    className={`mobile-menu-item ${activeTab === 'stats' ? 'active' : ''}`}
                    onClick={() => handleTabClick('stats')}
                >
                    <span className="menu-icon">📊</span>
                    Statistics
                </button>
                <button
                    className={`mobile-menu-item ${activeTab === 'settings' ? 'active' : ''}`}
                    onClick={() => handleTabClick('settings')}
                >
                    <span className="menu-icon">⚙️</span>
                    Settings
                </button>
            </nav>

            {/* Desktop Navigation */}
            <nav className="tabs desktop-tabs">
                <button
                    className={`tab-btn ${activeTab === 'study' ? 'active' : ''}`}
                    onClick={() => setActiveTab('study')}
                >
                    Study
                </button>
                <button
                    className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
                    onClick={() => setActiveTab('stats')}
                >
                    Statistics
                </button>
                <button
                    className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
                    onClick={() => setActiveTab('settings')}
                >
                    Settings
                </button>
            </nav>

            <div className={`tab-content ${activeTab === 'study' ? 'active' : ''}`}>
                <Study
                    currentCard={currentCard}
                    isFlipped={isFlipped}
                    onShowAnswer={handleShowAnswer}
                    onFlipToggle={handleFlipToggle}
                    onRateCard={handleRateCard}
                    onMarkMastered={handleMarkMastered}
                    onPreviousCard={handlePreviousCard}
                    onNextCard={handleNextCard}
                    canGoPrevious={historyIndex > 0 && !reviewMode}
                    canGoNext={historyIndex < cardHistory.length - 1 && !reviewMode}
                    dueCount={dueCount}
                    reviewsCompletedToday={reviewsCompletedToday}
                    reviewsDueTotal={reviewsDueTotal}
                    newCount={newCount}
                    introducedToday={introducedToday}
                    newCardsGoal={settings.newCardsPerDay}
                    allIntroduced={allIntroduced}
                    learningCount={learningCount}
                    masteredCount={masteredCount}
                    sessionComplete={sessionComplete}
                    sessionStats={sessionStats}
                    onReviewRecentCards={handleReviewRecentCards}
                    onExitReviewMode={handleExitReviewMode}
                    onUndoRating={handleUndoRating}
                    lastRating={lastRating}
                    reviewMode={reviewMode}
                    sessionCardsCount={sessionCards.length}
                />
            </div>

            <div className={`tab-content ${activeTab === 'stats' ? 'active' : ''}`}>
                <Statistics cards={cards} streak={streak} />
            </div>

            <div className={`tab-content ${activeTab === 'settings' ? 'active' : ''}`}>
                <Settings
                    settings={settings}
                    onSaveSettings={handleSaveSettings}
                    onResetProgress={handleResetProgress}
                    onExportProgress={handleExportProgress}
                    onImportProgress={handleImportProgress}
                    onShowTutorial={() => setShowWelcome(true)}
                />
            </div>

            <ToastContainer toasts={toasts} removeToast={removeToast} />

            {/* Daily Welcome Modal for returning users on a new day */}
            {showDailyWelcome && (
                <DailyWelcome
                    streak={streak}
                    reviewsDueTotal={reviewsDueTotal}
                    newCardsAvailable={cards.filter(card => card.totalReviews === 0 && !card.introducedDate).length}
                    newCardsGoal={settings.newCardsPerDay}
                    yesterdayStats={yesterdayStats}
                    onClose={() => setShowDailyWelcome(false)}
                />
            )}

            {/* Welcome Wizard for First-Time Users */}
            {showWelcome && (
                <WelcomeWizard
                    onComplete={handleWelcomeComplete}
                    defaultNewCardsPerDay={settings.newCardsPerDay}
                />
            )}
        </div>
    );
}

export default App;
