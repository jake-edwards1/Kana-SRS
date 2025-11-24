import React, { useState, useMemo, useRef, useEffect } from 'react';
import { speakJapanese } from '../utils/textToSpeech';

const Statistics = ({ cards, streak }) => {
    const [filterType, setFilterType] = useState('all');
    const [filterScript, setFilterScript] = useState('all'); // 'all', 'hiragana', 'katakana'
    const [selectedCard, setSelectedCard] = useState(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const [pronunciationGuideOpen, setPronunciationGuideOpen] = useState(false);
    const [strokeOrderOpen, setStrokeOrderOpen] = useState(false);
    const menuRef = useRef(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setMenuOpen(false);
            }
        };

        if (menuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [menuOpen]);

    // Close menu when selected card changes
    useEffect(() => {
        setMenuOpen(false);
    }, [selectedCard]);

    // Basic Stats
    const totalCards = cards.length;
    const totalReviews = cards.reduce((sum, card) => sum + card.totalReviews, 0);
    const totalCorrect = cards.reduce((sum, card) => sum + card.correctReviews, 0);
    const accuracy = totalReviews > 0 ? Math.round((totalCorrect / totalReviews) * 100) : 0;

    // Review Forecast (next 7 days)
    const forecastData = useMemo(() => {
        const forecast = {};
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Initialize next 7 days
        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() + i);
            forecast[date.toDateString()] = 0;
        }

        // Count due cards per day
        cards.forEach(card => {
            if (card.dueDate) {
                const dueDate = new Date(card.dueDate);
                dueDate.setHours(0, 0, 0, 0);
                const dueDateStr = dueDate.toDateString();

                if (forecast.hasOwnProperty(dueDateStr)) {
                    forecast[dueDateStr]++;
                }
            }
        });

        return forecast;
    }, [cards]);

    // Difficult Cards (lowest accuracy with at least 3 reviews and accuracy < 80%)
    const difficultCards = useMemo(() => {
        return cards
            .filter(card => card.totalReviews >= 3 && card.getAccuracy() < 80)
            .sort((a, b) => a.getAccuracy() - b.getAccuracy())
            .slice(0, 10);
    }, [cards]);

    // Progress Over Time (cards mastered per week for last 12 weeks)
    const progressOverTime = useMemo(() => {
        const weeks = [];
        const today = new Date();

        for (let i = 11; i >= 0; i--) {
            const weekStart = new Date(today);
            weekStart.setDate(weekStart.getDate() - (i * 7) - today.getDay());
            weekStart.setHours(0, 0, 0, 0);

            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            weekEnd.setHours(23, 59, 59, 999);

            const masteredInWeek = cards.filter(card => {
                if (!card.lastReview || !card.isMastered()) return false;
                const reviewDate = new Date(card.lastReview);
                return reviewDate >= weekStart && reviewDate <= weekEnd;
            }).length;

            weeks.push({
                label: `${weekStart.getMonth() + 1}/${weekStart.getDate()}`,
                count: masteredInWeek
            });
        }

        return weeks;
    }, [cards]);

    // Filter by script first, then by type
    let filteredCards = cards;

    if (filterScript !== 'all') {
        filteredCards = filteredCards.filter(card => card.script === filterScript);
    }

    if (filterType !== 'all') {
        filteredCards = filteredCards.filter(card => card.type === filterType);
    }

    // Count cards by script
    const hiraganaCount = cards.filter(c => c.script === 'hiragana').length;
    const katakanaCount = cards.filter(c => c.script === 'katakana').length;

    const getCardClass = (card) => {
        if (card.isMastered()) return 'mastered';
        if (card.totalReviews > 0) return 'learning';
        return 'new';
    };

    const handlePronunciation = (e) => {
        e.stopPropagation();
        if (selectedCard) {
            speakJapanese(selectedCard.char);
        }
    };

    const toggleMenu = (e) => {
        e.stopPropagation();
        setMenuOpen(prev => !prev);
    };

    const handlePronunciationGuide = (e) => {
        e.stopPropagation();
        setMenuOpen(false);
        setPronunciationGuideOpen(true);
    };

    const handleStrokeOrder = (e) => {
        e.stopPropagation();
        setMenuOpen(false);
        setStrokeOrderOpen(true);
    };

    const handleMarkMastered = (e) => {
        e.stopPropagation();
        setMenuOpen(false);
        if (selectedCard) {
            // Mark as mastered
            selectedCard.repetitions = 5;
            selectedCard.easeFactor = 2.5;
            selectedCard.interval = 30;
            selectedCard.lastReview = new Date().toISOString();
            const nextDate = new Date();
            nextDate.setDate(nextDate.getDate() + 30);
            selectedCard.dueDate = nextDate.toISOString();
            // Force re-render by creating new array reference
            setSelectedCard({ ...selectedCard });
        }
    };

    return (
        <div>
            <div className="stats-overview">
                <h2>Your Progress</h2>
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-value">{totalCards}</div>
                        <div className="stat-label">Total Cards</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{totalReviews}</div>
                        <div className="stat-label">Total Reviews</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{streak.best}</div>
                        <div className="stat-label">Best Streak</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{accuracy}%</div>
                        <div className="stat-label">Accuracy</div>
                    </div>
                </div>
            </div>

            {/* Review Forecast */}
            <div className="stats-section">
                <h3>📊 Review Forecast (Next 7 Days)</h3>
                <p className="stats-description">Plan your study sessions ahead.</p>
                <div className="forecast-chart">
                    {Object.entries(forecastData).map(([dateStr, count], index) => {
                        const date = new Date(dateStr);
                        const maxCount = Math.max(...Object.values(forecastData), 1);
                        const heightPercent = (count / maxCount) * 100;

                        return (
                            <div key={index} className="forecast-bar-container">
                                <div className="forecast-bar-wrapper">
                                    <div
                                        className="forecast-bar"
                                        style={{ height: `${heightPercent}%` }}
                                    >
                                        <span className="forecast-count">{count}</span>
                                    </div>
                                </div>
                                <div className="forecast-label">
                                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                                    <br />
                                    {date.getMonth() + 1}/{date.getDate()}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Difficult Cards */}
            <div className="stats-section">
                <h3>💪 Cards That Need Practice</h3>
                <p className="stats-description">Focus on these characters to improve your weak spots.</p>
                {difficultCards.length > 0 ? (
                    <div className="difficult-cards">
                        {difficultCards.map((card, index) => (
                            <div key={index} className="difficult-card">
                                <div className="difficult-rank">#{index + 1}</div>
                                <div className="difficult-char">{card.char}</div>
                                <div className="difficult-romaji">{card.romaji}</div>
                                <div className="difficult-accuracy">{card.getAccuracy()}%</div>
                                <div className="difficult-reviews">
                                    {card.correctReviews}/{card.totalReviews} correct
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <div className="empty-state-icon">🎯</div>
                        <h3>You're doing great!</h3>
                        <p>
                            {totalReviews === 0
                                ? "Start studying to see which cards need more practice."
                                : "No struggling cards yet! Keep up the excellent work. Cards with less than 80% accuracy will appear here."}
                        </p>
                    </div>
                )}
            </div>

            {/* Progress Over Time */}
            <div className="stats-section">
                <h3>📉 Cards Mastered Over Time (12 Weeks)</h3>
                <p className="stats-description">Visualize your learning journey.</p>
                <div className="progress-chart">
                    {progressOverTime.map((week, index) => {
                        const maxCount = Math.max(...progressOverTime.map(w => w.count), 1);
                        const heightPercent = (week.count / maxCount) * 100;

                        return (
                            <div key={index} className="progress-bar-container">
                                <div className="progress-bar-wrapper">
                                    <div
                                        className="progress-bar"
                                        style={{ height: `${heightPercent}%` }}
                                        title={`${week.label}: ${week.count} mastered`}
                                    >
                                        {week.count > 0 && <span className="progress-count">{week.count}</span>}
                                    </div>
                                </div>
                                <div className="progress-label">{week.label}</div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Character Breakdown */}
            <div className="character-breakdown">
                <h3>Character Breakdown</h3>

                {/* Script filter tabs */}
                {katakanaCount > 0 && (
                    <div className="breakdown-tabs" style={{ marginBottom: '15px' }}>
                        <button
                            className={`breakdown-tab ${filterScript === 'all' ? 'active' : ''}`}
                            onClick={() => setFilterScript('all')}
                        >
                            All ({cards.length})
                        </button>
                        <button
                            className={`breakdown-tab ${filterScript === 'hiragana' ? 'active' : ''}`}
                            onClick={() => setFilterScript('hiragana')}
                        >
                            Hiragana ({hiraganaCount})
                        </button>
                        <button
                            className={`breakdown-tab ${filterScript === 'katakana' ? 'active' : ''}`}
                            onClick={() => setFilterScript('katakana')}
                        >
                            Katakana ({katakanaCount})
                        </button>
                    </div>
                )}

                {/* Type filter tabs */}
                <div className="breakdown-tabs">
                    <button
                        className={`breakdown-tab ${filterType === 'all' ? 'active' : ''}`}
                        onClick={() => setFilterType('all')}
                    >
                        All
                    </button>
                    <button
                        className={`breakdown-tab ${filterType === 'basic' ? 'active' : ''}`}
                        onClick={() => setFilterType('basic')}
                    >
                        Basic
                    </button>
                    <button
                        className={`breakdown-tab ${filterType === 'dakuten' ? 'active' : ''}`}
                        onClick={() => setFilterType('dakuten')}
                    >
                        Dakuten
                    </button>
                    <button
                        className={`breakdown-tab ${filterType === 'handakuten' ? 'active' : ''}`}
                        onClick={() => setFilterType('handakuten')}
                    >
                        Han-Dakuten
                    </button>
                </div>
                <div className="character-grid">
                    {filteredCards.map((card, index) => (
                        <div
                            key={index}
                            className={`character-item ${getCardClass(card)}`}
                            onClick={() => setSelectedCard(card)}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className="char-display">{card.char}</div>
                            <div className="char-romaji">{card.romaji}</div>
                            <div className="char-stats">
                                {card.getAccuracy()}% ({card.totalReviews})
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Card Preview Modal */}
            {selectedCard && (
                <div className="modal-overlay" onClick={() => setSelectedCard(null)}>
                    <div className="modal-content modal-content-card" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setSelectedCard(null)}>×</button>
                        <div className="modal-card-preview">
                            {/* Card Banner */}
                            <div className="preview-card-banner">
                                <div className="card-menu-wrapper" ref={menuRef}>
                                    <button
                                        className="card-menu-btn"
                                        onClick={toggleMenu}
                                        aria-label="Card options"
                                    >
                                        ⋮
                                    </button>
                                    {menuOpen && (
                                        <div className="card-menu-dropdown">
                                            <button
                                                className="card-menu-item"
                                                onClick={handlePronunciationGuide}
                                            >
                                                🗣️ Pronunciation Guide
                                            </button>
                                            <button
                                                className="card-menu-item"
                                                onClick={handleStrokeOrder}
                                            >
                                                ✍️ Stroke Order
                                            </button>
                                            <button
                                                className="card-menu-item"
                                                onClick={handleMarkMastered}
                                                disabled={selectedCard.isMastered()}
                                            >
                                                ✓ Mark as Mastered
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <button
                                    className="pronunciation-btn"
                                    onClick={handlePronunciation}
                                    aria-label="Play pronunciation"
                                >
                                    🔊
                                </button>
                            </div>

                            <div className="character-large">{selectedCard.char}</div>
                            <div className="romaji-large">{selectedCard.romaji}</div>

                            <div className="preview-mnemonic-section">
                                {selectedCard.image && (
                                    <img
                                        src={selectedCard.image}
                                        alt={`Mnemonic for ${selectedCard.char}`}
                                        className="preview-mnemonic-image"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                        }}
                                    />
                                )}
                                <div className="preview-mnemonic-description">
                                    {selectedCard.mnemonic}
                                </div>
                            </div>

                            <div className="preview-stats">
                                <div className="preview-stat">
                                    <span className="preview-stat-label">Accuracy:</span>
                                    <span className="preview-stat-value">{selectedCard.getAccuracy()}%</span>
                                </div>
                                <div className="preview-stat">
                                    <span className="preview-stat-label">Reviews:</span>
                                    <span className="preview-stat-value">{selectedCard.totalReviews}</span>
                                </div>
                                <div className="preview-stat">
                                    <span className="preview-stat-label">Stage:</span>
                                    <span className="preview-stat-value">
                                        {selectedCard.getStage() === 'new' && '★ New'}
                                        {selectedCard.getStage() === 'learning' && `📚 Learning (${selectedCard.repetitions}/5)`}
                                        {selectedCard.getStage() === 'review' && `🔄 Review (${selectedCard.repetitions})`}
                                        {selectedCard.getStage() === 'mastered' && '✓ Mastered'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Pronunciation Guide Modal */}
            {pronunciationGuideOpen && selectedCard && (
                <div className="modal-overlay" onClick={() => setPronunciationGuideOpen(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setPronunciationGuideOpen(false)}>×</button>
                        <h2>Pronunciation Guide: {selectedCard.char}</h2>
                        <div className="pronunciation-guide-content">
                            <div className="pronunciation-display">
                                <div className="pronunciation-char">{selectedCard.char}</div>
                                <div className="pronunciation-romaji">{selectedCard.romaji}</div>
                            </div>

                            <button
                                className="btn btn-primary pronunciation-play-btn"
                                onClick={() => speakJapanese(selectedCard.char)}
                            >
                                🔊 Play Sound
                            </button>

                            <div className="pronunciation-tips">
                                <h3>Pronunciation Tips:</h3>
                                <ul>
                                    <li><strong>Romaji:</strong> {selectedCard.romaji}</li>
                                    <li>Click "Play Sound" to hear the pronunciation</li>
                                    <li>Hiragana characters represent single syllables in Japanese</li>
                                    <li>Practice saying the sound out loud while looking at the character</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Stroke Order Modal */}
            {strokeOrderOpen && selectedCard && (
                <div className="modal-overlay" onClick={() => setStrokeOrderOpen(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setStrokeOrderOpen(false)}>×</button>
                        <h2>Stroke Order: {selectedCard.char}</h2>
                        <div className="stroke-order-content">
                            <div className="stroke-order-display">
                                <div className="stroke-order-char">{selectedCard.char}</div>
                                <div className="stroke-order-romaji">{selectedCard.romaji}</div>
                            </div>

                            <div className="stroke-order-info">
                                <p>
                                    Stroke order diagrams help you learn the proper way to write this character.
                                    Correct stroke order improves handwriting and character recognition.
                                </p>
                                <p className="stroke-order-note">
                                    💡 <strong>Tip:</strong> Practice writing this character multiple times,
                                    following the traditional stroke order from top to bottom and left to right.
                                </p>
                                <p className="stroke-order-resource">
                                    For detailed stroke order diagrams, visit{' '}
                                    <a
                                        href={`https://jisho.org/search/${encodeURIComponent(selectedCard.char)}%20%23kanji`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        Jisho.org
                                    </a>
                                    {' '}or similar resources.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Statistics;
