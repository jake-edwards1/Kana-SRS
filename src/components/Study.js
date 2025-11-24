import React from 'react';
import Flashcard from './Flashcard';
import { SRSCard } from '../utils/srsAlgorithm';

const Study = ({
    currentCard,
    isFlipped,
    onShowAnswer,
    onFlipToggle,
    onRateCard,
    onMarkMastered,
    onPreviousCard,
    onNextCard,
    canGoPrevious,
    canGoNext,
    dueCount,
    reviewsCompletedToday,
    reviewsDueTotal,
    newCount,
    introducedToday,
    newCardsGoal,
    allIntroduced,
    learningCount,
    masteredCount,
    sessionComplete,
    sessionStats,
    onReviewRecentCards,
    onExitReviewMode,
    onUndoRating,
    lastRating,
    reviewMode,
    sessionCardsCount
}) => {
    // Determine color class for reviews counter (green when all done)
    const getReviewsColorClass = () => {
        if (reviewsDueTotal > 0 && reviewsCompletedToday === reviewsDueTotal) {
            return 'info-card-complete';
        }
        return '';
    };

    // Determine color class for new cards counter based on how far over the goal
    const getNewCardsColorClass = () => {
        if (allIntroduced) return 'info-card-complete';
        const overBy = introducedToday - newCardsGoal;
        if (overBy <= 0) return '';
        if (overBy <= 3) return 'info-card-warning';
        return 'info-card-danger';
    };
    const getIntervalPreview = (rating) => {
        if (!currentCard) return '';
        const interval = SRSCard.previewInterval(currentCard, rating);
        return SRSCard.formatInterval(interval);
    };

    if (sessionComplete) {
        const accuracy = sessionStats.reviewed > 0
            ? Math.round((sessionStats.correct / sessionStats.reviewed) * 100)
            : 0;

        const getMessage = () => {
            if (sessionStats.reviewed === 0) {
                return {
                    icon: "📚",
                    title: "All Caught Up!",
                    message: "No cards are due for review right now. Check back later or start learning new cards."
                };
            } else if (accuracy >= 90) {
                return {
                    icon: "🌟",
                    title: "Outstanding Performance!",
                    message: "You're mastering these characters! Keep up the incredible work."
                };
            } else if (accuracy >= 70) {
                return {
                    icon: "🎉",
                    title: "Great Job!",
                    message: "You're making solid progress. Every review brings you closer to mastery."
                };
            } else {
                return {
                    icon: "💪",
                    title: "Keep Pushing!",
                    message: "Practice makes perfect. You're building your foundation - stay consistent!"
                };
            }
        };

        const { icon, title, message } = getMessage();

        return (
            <div className="empty-state" style={{ marginTop: 0 }}>
                <div className="empty-state-icon">{icon}</div>
                <h3>{title}</h3>
                <p>{message}</p>
                {sessionStats.reviewed > 0 && (
                    <div className="session-stats">
                        <div>Cards reviewed: <strong>{sessionStats.reviewed}</strong></div>
                        <div>Accuracy: <strong>{accuracy}%</strong></div>
                    </div>
                )}
                {sessionCardsCount > 0 && (
                    <div style={{ marginTop: '20px' }}>
                        <button className="btn btn-primary" onClick={onReviewRecentCards} style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' }}>
                            Practice Recent Cards ({sessionCardsCount})
                        </button>
                    </div>
                )}
            </div>
        );
    }

    // Review mode banner
    const reviewModeBanner = reviewMode && (
        <div style={{
            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '10px',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
        }}>
            <span>🔄 Practice Mode - Your progress won't be affected</span>
            <button
                onClick={onExitReviewMode}
                style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: 'none',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600'
                }}
            >
                Exit Practice
            </button>
        </div>
    );

    return (
        <div>
            {reviewModeBanner}
            <div className="study-info">
                <div className={`info-card info-card-reviews ${getReviewsColorClass()}`}>
                    <div className="info-label">
                        Reviews Due
                        <span className="info-tooltip-wrapper">
                            <span className="info-icon">ⓘ</span>
                            <span className="info-tooltip-text">Reviews completed today / total due</span>
                        </span>
                    </div>
                    <div className="info-value">
                        {reviewsDueTotal === 0 ? (
                            <span>—</span>
                        ) : (
                            <span>{reviewsCompletedToday}/{reviewsDueTotal}</span>
                        )}
                    </div>
                </div>
                <div className={`info-card info-card-new ${getNewCardsColorClass()}`}>
                    <div className="info-label">
                        New
                        <span className="info-tooltip-wrapper">
                            <span className="info-icon">ⓘ</span>
                            <span className="info-tooltip-text info-tooltip-wide">
                                <strong>New cards introduced today</strong><br/><br/>
                                <span className="tooltip-color-indicator tooltip-blue"></span> At or under daily goal<br/>
                                <span className="tooltip-color-indicator tooltip-orange"></span> 1-3 over goal<br/>
                                <span className="tooltip-color-indicator tooltip-red"></span> 4+ over goal<br/><br/>
                                Learning too many new cards builds up tomorrow's reviews. Stick to your goal for sustainable progress!
                            </span>
                        </span>
                    </div>
                    <div className="info-value">
                        {allIntroduced ? (
                            <span>✓ All Introduced</span>
                        ) : (
                            <span>{introducedToday}/{newCardsGoal}</span>
                        )}
                    </div>
                </div>
                <div className="info-card info-card-learning">
                    <div className="info-label">
                        Learning
                        <span className="info-tooltip-wrapper">
                            <span className="info-icon">ⓘ</span>
                            <span className="info-tooltip-text">Cards you're currently learning (1-4 successful reviews)</span>
                        </span>
                    </div>
                    <div className="info-value">{learningCount}</div>
                </div>
                <div className="info-card info-card-mastered">
                    <div className="info-label">
                        Mastered
                        <span className="info-tooltip-wrapper">
                            <span className="info-icon">ⓘ</span>
                            <span className="info-tooltip-text">Cards reviewed 5+ times successfully</span>
                        </span>
                    </div>
                    <div className="info-value">{masteredCount}</div>
                </div>
            </div>

            <div className="flashcard-navigation-wrapper">
                {canGoPrevious ? (
                    <button
                        className="nav-btn nav-btn-prev"
                        onClick={onPreviousCard}
                        aria-label="Previous card"
                    >
                        ←
                    </button>
                ) : (
                    <div className="nav-btn-spacer"></div>
                )}

                <Flashcard
                    card={currentCard}
                    isFlipped={isFlipped}
                    onFlip={onFlipToggle}
                    onMarkMastered={onMarkMastered}
                />

                {canGoNext ? (
                    <button
                        className="nav-btn nav-btn-next"
                        onClick={onNextCard}
                        aria-label="Next card"
                    >
                        →
                    </button>
                ) : (
                    <div className="nav-btn-spacer"></div>
                )}
            </div>

            {!isFlipped ? (
                <div className="controls">
                    <button className="btn btn-primary" onClick={onShowAnswer}>
                        Show Answer
                    </button>
                </div>
            ) : (
                <div className="rating-controls">
                    <button className="btn btn-again" onClick={() => onRateCard(1)}>
                        Again<br />
                        <span className="interval-text">{getIntervalPreview(1)}</span>
                    </button>
                    <button className="btn btn-hard" onClick={() => onRateCard(2)}>
                        Hard<br />
                        <span className="interval-text">{getIntervalPreview(2)}</span>
                    </button>
                    <button className="btn btn-good" onClick={() => onRateCard(3)}>
                        Good<br />
                        <span className="interval-text">{getIntervalPreview(3)}</span>
                    </button>
                    <button className="btn btn-easy" onClick={() => onRateCard(4)}>
                        Easy<br />
                        <span className="interval-text">{getIntervalPreview(4)}</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default Study;
