import React from 'react';

const DailyWelcome = ({
    streak,
    reviewsDueTotal,
    newCardsAvailable,
    newCardsGoal,
    yesterdayStats,
    onClose
}) => {
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    const getMotivationalMessage = () => {
        if (streak.current === 0) {
            return "Let's start fresh today!";
        } else if (streak.current === 1) {
            return "Great start! Keep the momentum going.";
        } else if (streak.current < 7) {
            return `${streak.current} days strong! You're building a habit.`;
        } else if (streak.current < 30) {
            return `${streak.current} day streak! You're on fire!`;
        } else {
            return `Incredible ${streak.current} day streak! You're unstoppable!`;
        }
    };

    const getStreakIcon = () => {
        if (streak.current === 0) return '🌱';
        if (streak.current < 7) return '🔥';
        if (streak.current < 30) return '💪';
        return '🏆';
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content daily-welcome-modal" onClick={(e) => e.stopPropagation()}>
                <div className="daily-welcome-content">
                    <div className="daily-greeting">
                        <span className="greeting-icon">{getStreakIcon()}</span>
                        <h2>{getGreeting()}!</h2>
                    </div>

                    <p className="motivational-message">{getMotivationalMessage()}</p>

                    {/* Streak Display */}
                    <div className="daily-streak-display">
                        <div className="streak-flame">🔥</div>
                        <div className="streak-info">
                            <div className="streak-number">{streak.current}</div>
                            <div className="streak-label">day streak</div>
                        </div>
                        {streak.best > streak.current && (
                            <div className="streak-best">Best: {streak.best}</div>
                        )}
                    </div>

                    {/* Yesterday's Stats (if available) */}
                    {yesterdayStats && yesterdayStats.reviewed > 0 && (
                        <div className="yesterday-stats">
                            <h3>Yesterday's Progress</h3>
                            <div className="yesterday-stats-grid">
                                <div className="yesterday-stat">
                                    <span className="stat-value">{yesterdayStats.reviewed}</span>
                                    <span className="stat-label">cards reviewed</span>
                                </div>
                                <div className="yesterday-stat">
                                    <span className="stat-value">{yesterdayStats.introduced}</span>
                                    <span className="stat-label">new cards</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Today's Goals */}
                    <div className="today-goals">
                        <h3>Today's Goals</h3>
                        <div className="goals-grid">
                            <div className="goal-item">
                                <span className="goal-icon">📖</span>
                                <span className="goal-value">{reviewsDueTotal}</span>
                                <span className="goal-label">reviews due</span>
                            </div>
                            <div className="goal-item">
                                <span className="goal-icon">✨</span>
                                <span className="goal-value">{Math.min(newCardsAvailable, newCardsGoal)}</span>
                                <span className="goal-label">new cards</span>
                            </div>
                        </div>
                    </div>

                    <button className="btn btn-primary daily-start-btn" onClick={onClose}>
                        Start Learning
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DailyWelcome;
