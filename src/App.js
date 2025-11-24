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
    const [bypassDailyLimit, setBypassDailyLimit] = useState(false);
    const [toasts, setToasts] = useState([]);
    const [lastRating, setLastRating] = useState(null); // For undo functionality
    const [showWelcome, setShowWelcome] = useState(false);
    const [sessionCards, setSessionCards] = useState([]); // Cards reviewed in this session
    const [reviewMode, setReviewMode] = useState(false); // Practice mode for recent cards
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // Mobile hamburger menu

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
        if (data) {
            setCards(data.cards.map(cardData => restoreCard(cardData)));
            if (data.settings) setSettings(data.settings);
            if (data.streak) setStreak(data.streak);
        } else {
            initializeCards();
            // Show welcome message for new users
            const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
            if (!hasSeenWelcome) {
                setShowWelcome(true);
            }
        }

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
            showToast('🎉 Katakana Unlocked! New cards have been added to your deck. Click "Continue Learning" to start!', 'success', 6000);
        }
    }, [cards, settings.katakanaUnlocked, showToast]);

    // Get due and new cards
    const getDueCards = useCallback(() => {
        return cards.filter(card => card.isDue()).sort((a, b) =>
            new Date(a.dueDate) - new Date(b.dueDate)
        );
    }, [cards]);

    const getNewCards = useCallback(() => {
        // Get cards that have never been introduced
        const neverIntroduced = cards.filter(card => card.totalReviews === 0 && !card.introducedDate);

        // If bypassing daily limit, return all new cards
        if (bypassDailyLimit) {
            return neverIntroduced;
        }

        // Otherwise, enforce daily limit
        const today = new Date().toDateString();

        // Count how many cards were introduced today
        const introducedToday = cards.filter(card => {
            if (!card.introducedDate) return false;
            return new Date(card.introducedDate).toDateString() === today;
        }).length;

        // Calculate how many more cards we can introduce today
        const remainingSlots = Math.max(0, settings.newCardsPerDay - introducedToday);

        return neverIntroduced.slice(0, remainingSlots);
    }, [cards, settings.newCardsPerDay, bypassDailyLimit]);

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
            setBypassDailyLimit(false); // Reset bypass mode when session completes
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

    // Continue learning (add new cards)
    const handleContinueLearning = () => {
        setBypassDailyLimit(true);
        setSessionComplete(false);
        setReviewMode(false);

        // Force a check for new cards
        setTimeout(() => {
            const newCards = getNewCards();
            const dueCards = getDueCards();

            if (newCards.length === 0 && dueCards.length === 0) {
                // No cards available even with bypass
                setSessionComplete(true);
                showToast('You\'ve completed all available cards for now. Great work!', 'success', 4000);
            } else {
                nextCard();
            }
        }, 100);
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

    // Reset bypass mode when switching tabs
    useEffect(() => {
        if (activeTab !== 'study') {
            setBypassDailyLimit(false);
        }
    }, [activeTab]);

    const dueCount = getDueCards().length;
    const newCount = getNewCards().length;
    const learningCount = getLearningCards().length;
    const masteredCount = getMasteredCards().length;

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
                    {(dueCount + newCount) > 0 && (
                        <span className="menu-badge">{dueCount + newCount}</span>
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
                    newCount={newCount}
                    learningCount={learningCount}
                    masteredCount={masteredCount}
                    sessionComplete={sessionComplete}
                    sessionStats={sessionStats}
                    onContinueLearning={handleContinueLearning}
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

            {/* Welcome Modal for First-Time Users */}
            {showWelcome && (
                <div className="modal-overlay" onClick={() => { setShowWelcome(false); localStorage.setItem('hasSeenWelcome', 'true'); }}>
                    <div className="modal-content welcome-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => { setShowWelcome(false); localStorage.setItem('hasSeenWelcome', 'true'); }}>×</button>
                        <div className="welcome-content">
                            <div className="welcome-icon">👋</div>
                            <h2>Welcome to Japanese Kana Flashcards!</h2>
                            <p className="welcome-intro">Master all 142 Japanese characters (hiragana + katakana) using proven spaced repetition techniques. Here's everything you need to know:</p>

                            <div className="welcome-tips">
                                <div className="welcome-tip">
                                    <div className="tip-icon">📚</div>
                                    <div className="tip-content">
                                        <h3>How Spaced Repetition Works</h3>
                                        <p>The app tracks when you'll forget each character and shows it to you just before that happens. Cards you struggle with appear more frequently, while mastered cards appear less often (eventually weeks apart). This maximizes retention while minimizing study time.</p>
                                    </div>
                                </div>

                                <div className="welcome-tip">
                                    <div className="tip-icon">🎯</div>
                                    <div className="tip-content">
                                        <h3>Your Daily Routine</h3>
                                        <p><strong>1. Review due cards</strong> - Cards that are ready for review today<br/>
                                        <strong>2. Learn new cards</strong> - Limited to 10 per day by default to avoid getting overwhelmed<br/>
                                        <strong>3. Rate honestly</strong> - Again (forgot), Hard (difficult), Good (correct), Easy (very easy)</p>
                                    </div>
                                </div>

                                <div className="welcome-tip">
                                    <div className="tip-icon">⭐</div>
                                    <div className="tip-content">
                                        <h3>Rating Guidelines</h3>
                                        <p><strong>Again:</strong> You couldn't remember - see it again soon<br/>
                                        <strong>Hard:</strong> You got it but struggled - review sooner<br/>
                                        <strong>Good:</strong> You remembered correctly - normal interval<br/>
                                        <strong>Easy:</strong> Too easy - longer interval between reviews</p>
                                    </div>
                                </div>

                                <div className="welcome-tip">
                                    <div className="tip-icon">🔓</div>
                                    <div className="tip-content">
                                        <h3>Unlock Katakana</h3>
                                        <p>Start with hiragana! After you've introduced 40 characters, katakana will automatically unlock. This gives you a solid foundation before tackling the next script.</p>
                                    </div>
                                </div>

                                <div className="welcome-tip">
                                    <div className="tip-icon">🔥</div>
                                    <div className="tip-content">
                                        <h3>Build Your Streak</h3>
                                        <p>Study every day to maintain your streak! Even 5 minutes counts. The app remembers your progress (backed up in your browser), so you can pick up right where you left off.</p>
                                    </div>
                                </div>
                            </div>

                            <button
                                className="btn btn-primary"
                                onClick={() => { setShowWelcome(false); localStorage.setItem('hasSeenWelcome', 'true'); }}
                                style={{ marginTop: '30px', fontSize: '1.1em' }}
                            >
                                Let's Get Started!
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;
