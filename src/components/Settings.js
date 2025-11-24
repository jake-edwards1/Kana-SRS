import React, { useState, useEffect } from 'react';

const Settings = ({ settings, onSaveSettings, onResetProgress, onExportProgress, onImportProgress, onShowTutorial }) => {
    const [localSettings, setLocalSettings] = useState(settings);

    useEffect(() => {
        setLocalSettings(settings);
    }, [settings]);

    const handleSave = () => {
        onSaveSettings(localSettings);
    };

    const handleReset = () => {
        if (window.confirm('Are you sure you want to reset all progress? This cannot be undone!')) {
            if (window.confirm('Really! All your learning data will be deleted!')) {
                onResetProgress();
            }
        }
    };

    const handleExport = () => {
        onExportProgress();
    };

    const handleImport = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (window.confirm('Importing will replace all current progress. Continue?')) {
                onImportProgress(file);
            }
        }
        // Reset file input
        e.target.value = '';
    };

    return (
        <div>
            <div className="settings-section">
                <h2>Study Settings</h2>

                <div className="setting-item">
                    <label htmlFor="new-cards-per-day">
                        New cards per day:
                        <input
                            type="number"
                            id="new-cards-per-day"
                            min="1"
                            max="50"
                            value={localSettings.newCardsPerDay}
                            onChange={(e) => setLocalSettings({
                                ...localSettings,
                                newCardsPerDay: parseInt(e.target.value)
                            })}
                        />
                    </label>
                </div>

                <div className="setting-item">
                    <label htmlFor="review-limit">
                        Daily review limit:
                        <input
                            type="number"
                            id="review-limit"
                            min="10"
                            max="200"
                            value={localSettings.reviewLimit}
                            onChange={(e) => setLocalSettings({
                                ...localSettings,
                                reviewLimit: parseInt(e.target.value)
                            })}
                        />
                    </label>
                </div>

                <h3>Hiragana Character Sets</h3>
                <div className="setting-item">
                    <label>
                        <input
                            type="checkbox"
                            checked={localSettings.enableBasic}
                            disabled
                        />
                        Basic Hiragana (あ-ん)
                    </label>
                </div>
                <div className="setting-item">
                    <label>
                        <input
                            type="checkbox"
                            checked={localSettings.enableDakuten}
                            onChange={(e) => setLocalSettings({
                                ...localSettings,
                                enableDakuten: e.target.checked
                            })}
                        />
                        Dakuten (が, ざ, etc.)
                    </label>
                </div>
                <div className="setting-item">
                    <label>
                        <input
                            type="checkbox"
                            checked={localSettings.enableHandakuten}
                            onChange={(e) => setLocalSettings({
                                ...localSettings,
                                enableHandakuten: e.target.checked
                            })}
                        />
                        Han-Dakuten (ぱ, ぴ, etc.)
                    </label>
                </div>

                <h3>Katakana</h3>
                {!localSettings.katakanaUnlocked ? (
                    <p style={{ color: '#666', fontSize: '0.9em', marginBottom: '15px' }}>
                        🔒 Katakana will unlock after you've introduced 40 hiragana characters. Keep studying!
                    </p>
                ) : (
                    <>
                        <div className="setting-item">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={localSettings.enableKatakana}
                                    onChange={(e) => setLocalSettings({
                                        ...localSettings,
                                        enableKatakana: e.target.checked
                                    })}
                                />
                                Enable Katakana (ア-ン, all variants)
                            </label>
                        </div>
                        <p style={{ color: '#666', fontSize: '0.85em', marginTop: '10px' }}>
                            ✨ Katakana is used for foreign words, onomatopoeia, and emphasis in Japanese.
                        </p>
                    </>
                )}

                <h3>Audio Settings</h3>
                <div className="setting-item">
                    <label>
                        <input
                            type="checkbox"
                            checked={localSettings.autoPronunciation}
                            onChange={(e) => setLocalSettings({
                                ...localSettings,
                                autoPronunciation: e.target.checked
                            })}
                        />
                        Auto-pronounce when flipping cards
                    </label>
                </div>

                <button className="btn btn-primary" onClick={handleSave}>
                    Save Settings
                </button>
            </div>

            <div className="settings-section">
                <h2>Help & Support</h2>
                <p style={{ marginBottom: '15px', color: '#666' }}>
                    View the tutorial to learn how to use spaced repetition effectively.
                </p>
                <button className="btn btn-primary" onClick={onShowTutorial}>
                    📖 View Tutorial
                </button>
            </div>

            <div className="settings-section">
                <h2>Backup & Restore</h2>
                <p style={{ marginBottom: '15px', color: '#666' }}>
                    Export your progress to save a backup, or import a previously saved backup file.
                </p>

                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                    <button className="btn btn-primary" onClick={handleExport}>
                        📥 Export Progress
                    </button>

                    <label className="btn btn-primary" style={{ cursor: 'pointer', margin: 0 }}>
                        📤 Import Progress
                        <input
                            type="file"
                            accept=".json"
                            onChange={handleImport}
                            style={{ display: 'none' }}
                        />
                    </label>
                </div>

                <p style={{ marginTop: '15px', fontSize: '0.9em', color: '#666' }}>
                    💡 Tip: Export regularly to backup your progress!
                </p>
            </div>

            <div className="settings-section danger-zone">
                {/*<h3>Danger Zone</h3>*/}
                <button className="btn-danger" onClick={handleReset}>
                    Reset All Progress
                </button>
                <p className="warning-text">
                    This will delete all your learning data and cannot be undone.
                </p>
            </div>
        </div>
    );
};

export default Settings;
