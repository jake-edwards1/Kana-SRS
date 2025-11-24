import React, { useState } from 'react';

const TOTAL_CHARACTERS = 142; // Total hiragana + katakana characters

const WelcomeWizard = ({ onComplete, defaultNewCardsPerDay = 10 }) => {
    const [currentPage, setCurrentPage] = useState(0);
    const [newCardsPerDay, setNewCardsPerDay] = useState(defaultNewCardsPerDay);

    // Calculate estimated daily time
    // New cards: ~30 seconds each (learning mnemonic, pronunciation)
    // Reviews: ~10 seconds each
    // After settling, expect roughly 5x new cards in daily reviews
    const calculateDailyTime = (cardsPerDay) => {
        const newCardTime = cardsPerDay * 30; // seconds
        const avgReviewTime = cardsPerDay * 5 * 10; // 5x multiplier for reviews
        const totalSeconds = newCardTime + avgReviewTime;
        const minutes = Math.round(totalSeconds / 60);
        return minutes;
    };

    // Calculate time to comfortable reading (after 2-3 reviews per card)
    // After introducing + ~2 weeks of reviews, most characters feel familiar
    const calculateDaysToComfortable = (cardsPerDay) => {
        const daysToIntroduce = Math.ceil(TOTAL_CHARACTERS / cardsPerDay);
        const reviewCycles = 14; // ~2 weeks of review cycles
        return daysToIntroduce + reviewCycles;
    };

    // Calculate approximate time to master all characters
    // Mastery requires 5+ successful reviews with increasing intervals
    // Typical SRS intervals: 1, 6, 15, 37, 92 days = ~5 months for one card
    // But cards overlap, so total = days to introduce + ~3 months for last cards to mature
    const calculateDaysToMaster = (cardsPerDay) => {
        const daysToIntroduce = Math.ceil(TOTAL_CHARACTERS / cardsPerDay);
        const maturationDays = 90; // ~3 months for SRS intervals to play out
        return daysToIntroduce + maturationDays;
    };

    const formatDuration = (days) => {
        if (days < 30) return `${days} days`;
        const months = Math.round(days / 30);
        return months === 1 ? '1 month' : `${months} months`;
    };

    const formatWeeks = (days) => {
        const weeks = Math.round(days / 7);
        return weeks === 1 ? '1 week' : `${weeks} weeks`;
    };

    const dailyMinutes = calculateDailyTime(newCardsPerDay);
    const daysToComfortable = calculateDaysToComfortable(newCardsPerDay);
    const daysToMaster = calculateDaysToMaster(newCardsPerDay);

    const handleComplete = () => {
        onComplete(newCardsPerDay);
    };

    const pages = [
        // Page 1: Welcome
        {
            content: (
                <div className="wizard-page">
                    <div className="wizard-icon">👋</div>
                    <h2>Welcome to KanaSRS!</h2>
                    <p className="wizard-intro">
                        Master all 142 hiragana/katakana using proven spaced repetition techniques.
                    </p>
                    <div className="wizard-highlight">
                        <div className="highlight-item">
                            <span className="highlight-number">46</span>
                            <span className="highlight-label">Hiragana</span>
                        </div>
                        <div className="highlight-item">
                            <span className="highlight-number">46</span>
                            <span className="highlight-label">Katakana</span>
                        </div>
                        <div className="highlight-item">
                            <span className="highlight-number">50</span>
                            <span className="highlight-label">Variants</span>
                        </div>
                    </div>
                </div>
            )
        },
        // Page 2: How SRS Works
        {
            content: (
                <div className="wizard-page">
                    <div className="wizard-icon">🧠</div>
                    <h2>How Spaced Repetition Works</h2>
                    <p className="wizard-text">
                        The app tracks when you're about to forget each character and shows it
                        to you just before that happens.
                    </p>
                    <div className="wizard-benefits">
                        <div className="benefit-item">
                            <span className="benefit-icon">📈</span>
                            <span>Cards you struggle with appear more frequently</span>
                        </div>
                        <div className="benefit-item">
                            <span className="benefit-icon">⏰</span>
                            <span>Mastered cards appear less often (eventually weeks apart)</span>
                        </div>
                        <div className="benefit-item">
                            <span className="benefit-icon">🎯</span>
                            <span>Maximizes retention while minimizing study time</span>
                        </div>
                    </div>
                </div>
            )
        },
        // Page 3: Daily Routine
        {
            content: (
                <div className="wizard-page">
                    <div className="wizard-icon">📅</div>
                    <h2>Your Daily Routine</h2>
                    <div className="wizard-steps">
                        <div className="step-item">
                            <span className="step-number">1</span>
                            <div className="step-content">
                                <strong>Review due cards</strong>
                                <p>Cards that are ready for review today</p>
                            </div>
                        </div>
                        <div className="step-item">
                            <span className="step-number">2</span>
                            <div className="step-content">
                                <strong>Learn new cards</strong>
                                <p>Introduce new characters at your own pace</p>
                            </div>
                        </div>
                        <div className="step-item">
                            <span className="step-number">3</span>
                            <div className="step-content">
                                <strong>Rate yourself honestly</strong>
                                <p>Again, Hard, Good, or Easy</p>
                            </div>
                        </div>
                    </div>
                </div>
            )
        },
        // Page 4: Rating Guide
        {
            content: (
                <div className="wizard-page">
                    <div className="wizard-icon">⭐</div>
                    <h2>Rating Guidelines</h2>
                    <p className="wizard-text">
                        Be honest with your ratings - the algorithm works best when you are!
                    </p>
                    <div className="rating-guide">
                        <div className="rating-item rating-again">
                            <span className="rating-label">Again</span>
                            <span className="rating-desc">Couldn't remember - see it again soon</span>
                        </div>
                        <div className="rating-item rating-hard">
                            <span className="rating-label">Hard</span>
                            <span className="rating-desc">Got it but struggled - review sooner</span>
                        </div>
                        <div className="rating-item rating-good">
                            <span className="rating-label">Good</span>
                            <span className="rating-desc">Remembered correctly - normal interval</span>
                        </div>
                        <div className="rating-item rating-easy">
                            <span className="rating-label">Easy</span>
                            <span className="rating-desc">Too easy - longer interval</span>
                        </div>
                    </div>
                </div>
            )
        },
        // Page 5: Settings
        {
            content: (
                <div className="wizard-page">
                    <div className="wizard-icon">⚙️</div>
                    <h2>Set Your Daily Goal</h2>
                    <p className="wizard-text">
                        How many new characters would you like to learn each day?
                    </p>
                    <div className="wizard-setting">
                        <label htmlFor="new-cards-wizard">New cards per day:</label>
                        <input
                            type="number"
                            id="new-cards-wizard"
                            min="1"
                            max="30"
                            value={newCardsPerDay}
                            onChange={(e) => setNewCardsPerDay(Math.max(1, Math.min(30, parseInt(e.target.value) || 1)))}
                            className="wizard-input"
                        />
                    </div>
                    <div className="wizard-estimates">
                        <div className="estimate-item">
                            <span className="estimate-icon">⏱️</span>
                            <div className="estimate-content">
                                <span className="estimate-value">~{dailyMinutes} minutes/day</span>
                                <span className="estimate-label">daily study time</span>
                            </div>
                        </div>
                        <div className="estimate-item estimate-highlight">
                            <span className="estimate-icon">📖</span>
                            <div className="estimate-content">
                                <span className="estimate-value">~{formatWeeks(daysToComfortable)}</span>
                                <span className="estimate-label">to read comfortably</span>
                            </div>
                        </div>
                        <div className="estimate-item">
                            <span className="estimate-icon">🏆</span>
                            <div className="estimate-content">
                                <span className="estimate-value">~{formatDuration(daysToMaster)}</span>
                                <span className="estimate-label">to fully master</span>
                            </div>
                        </div>
                    </div>
                    {/*<p className="wizard-encouragement">*/}
                    {/*    You'll recognize most characters within weeks! Mastery means you'll remember them forever.*/}
                    {/*</p>*/}
                    <p className="wizard-note">
                        💡 You can change this anytime in Settings.
                    </p>
                </div>
            )
        }
    ];

    const isLastPage = currentPage === pages.length - 1;

    return (
        <div className="modal-overlay">
            <div className="modal-content wizard-modal">
                <div className="wizard-progress">
                    {pages.map((_, index) => (
                        <div
                            key={index}
                            className={`wizard-progress-dot ${index === currentPage ? 'active' : ''} ${index < currentPage ? 'completed' : ''}`}
                        />
                    ))}
                </div>

                {pages[currentPage].content}

                <div className="wizard-nav">
                    {currentPage > 0 && (
                        <button
                            className="btn wizard-btn-back"
                            onClick={() => setCurrentPage(prev => prev - 1)}
                        >
                            Back
                        </button>
                    )}
                    <button
                        className="btn btn-primary wizard-btn-next"
                        onClick={() => {
                            if (isLastPage) {
                                handleComplete();
                            } else {
                                setCurrentPage(prev => prev + 1);
                            }
                        }}
                    >
                        {isLastPage ? "Let's Get Started!" : 'Next'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WelcomeWizard;
