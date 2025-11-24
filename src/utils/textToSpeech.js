// Text-to-Speech utility for Japanese characters
export const speakJapanese = (text) => {
    if ('speechSynthesis' in window) {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ja-JP'; // Japanese language
        utterance.rate = 0.8; // Slightly slower for clarity
        utterance.pitch = 1.0;

        // Try to find a Japanese voice
        const voices = window.speechSynthesis.getVoices();
        const japaneseVoice = voices.find(voice => voice.lang.startsWith('ja'));

        if (japaneseVoice) {
            utterance.voice = japaneseVoice;
        }

        window.speechSynthesis.speak(utterance);
    }
};

// Load voices when they become available
export const loadVoices = () => {
    return new Promise((resolve) => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
            resolve(voices);
        } else {
            window.speechSynthesis.onvoiceschanged = () => {
                resolve(window.speechSynthesis.getVoices());
            };
        }
    });
};
