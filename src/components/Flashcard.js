import React, { useState, useEffect, useRef } from 'react';
import { speakJapanese } from '../utils/textToSpeech';

const Flashcard = ({ card, isFlipped, onFlip, onMarkMastered }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [pronunciationGuideOpen, setPronunciationGuideOpen] = useState(false);
    const [strokeOrderOpen, setStrokeOrderOpen] = useState(false);
    const [hintExpanded, setHintExpanded] = useState(false);
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

    // Close menu when card is flipped and reset hint
    useEffect(() => {
        setMenuOpen(false);
        setHintExpanded(false);
    }, [isFlipped, card]);

    if (!card) return null;

    const handlePronunciation = (e) => {
        e.stopPropagation(); // Prevent card flip when clicking the button
        speakJapanese(card.char);
    };

    const toggleMenu = (e) => {
        e.stopPropagation(); // Prevent card flip
        setMenuOpen(prev => !prev);
    };

    const handleMarkMastered = (e) => {
        e.stopPropagation(); // Prevent card flip
        setMenuOpen(false);
        if (onMarkMastered) {
            onMarkMastered(card);
        }
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

    return (
        <div className="flashcard-container">
            <div className={`flashcard ${isFlipped ? 'flipped' : ''}`}>
                {/* Front of card */}
                <div className="flashcard-front" onClick={onFlip}>
                    <div className="card-banner">
                        <div className="card-banner-left">
                            <div className="card-menu-wrapper" ref={!isFlipped ? menuRef : null}>
                                <button
                                    className="card-menu-btn"
                                    onClick={toggleMenu}
                                    aria-label="Card options"
                                >
                                    ⋮
                                </button>
                                {menuOpen && !isFlipped && (
                                    <div className="card-menu-dropdown">
                                        <button
                                            className="card-menu-item"
                                            onClick={handleMarkMastered}
                                            disabled={card.isMastered()}
                                        >
                                            ✓ Mark as Mastered
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="character">{card.char}</div>
                </div>

                {/* Back of card */}
                <div className="flashcard-back" onClick={onFlip}>
                    <div className="card-banner">
                        <div className="card-banner-left">
                            <div className="card-menu-wrapper" ref={isFlipped ? menuRef : null}>
                                <button
                                    className="card-menu-btn"
                                    onClick={toggleMenu}
                                    aria-label="Card options"
                                >
                                    ⋮
                                </button>
                                {menuOpen && isFlipped && (
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
                                            disabled={card.isMastered()}
                                        >
                                            ✓ Mark as Mastered
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className={`card-stage-badge card-stage-${card.getStage()}`}>
                                {card.getStage() === 'new' && '★ New'}
                                {card.getStage() === 'learning' && `📚 Learning (${card.repetitions}/5)`}
                                {card.getStage() === 'review' && `🔄 Review (${card.repetitions})`}
                                {card.getStage() === 'mastered' && '✓ Mastered'}
                            </div>
                        </div>
                        <div className="card-banner-right">
                            <button
                                className="pronunciation-btn"
                                onClick={handlePronunciation}
                                aria-label="Repeat pronunciation"
                            >
                                🔊
                            </button>
                        </div>
                    </div>
                    <div className="character">{card.char}</div>
                    <div className="romaji">{card.romaji}</div>

                    <div className="mnemonic-section">
                        {!hintExpanded ? (
                            <button
                                className="show-hint-btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setHintExpanded(true);
                                }}
                            >
                                💡 Show Hint
                            </button>
                        ) : (
                            <>
                                {card.image && (
                                    <img
                                        src={card.image}
                                        alt={`Mnemonic for ${card.char}`}
                                        className="mnemonic-image"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                        }}
                                    />
                                )}
                                <div className="mnemonic-description">
                                    {card.mnemonic}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Pronunciation Guide Modal */}
            {pronunciationGuideOpen && (
                <div className="modal-overlay" onClick={() => setPronunciationGuideOpen(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setPronunciationGuideOpen(false)}>×</button>
                        <h2>Pronunciation Guide: {card.char}</h2>
                        <div className="pronunciation-guide-content">
                            <div className="pronunciation-display">
                                <div className="pronunciation-char">{card.char}</div>
                                <div className="pronunciation-romaji">{card.romaji}</div>
                            </div>

                            <button
                                className="btn btn-primary pronunciation-play-btn"
                                onClick={() => speakJapanese(card.char)}
                            >
                                🔊 Play Sound
                            </button>

                            <div className="pronunciation-tips">
                                <h3>Pronunciation Tips:</h3>
                                <ul>
                                    <li><strong>Romaji:</strong> {card.romaji}</li>
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
            {strokeOrderOpen && (
                <div className="modal-overlay" onClick={() => setStrokeOrderOpen(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setStrokeOrderOpen(false)}>×</button>
                        <h2>Stroke Order: {card.char}</h2>
                        <div className="stroke-order-content">
                            <div className="stroke-order-display">
                                <div className="stroke-order-char">{card.char}</div>
                                <div className="stroke-order-romaji">{card.romaji}</div>
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
                                        href={`https://jisho.org/search/${encodeURIComponent(card.char)}%20%23kanji`}
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

export default Flashcard;
