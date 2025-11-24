# Hiragana Flashcards - React SRS Learning App

A comprehensive Japanese Hiragana flashcard application built with React, featuring an advanced SRS 2.0 algorithm, card flip animations, text-to-speech, and Tofugu-style mnemonics.

## Features

### 🎴 Complete Hiragana Coverage
- 46 basic hiragana characters (あ-ん)
- 20 dakuten characters (が, ざ, だ, ば)
- 5 han-dakuten characters (ぱ, ぴ, ぷ, ぺ, ぽ)
- **Total: 71 characters**

### 🧠 Advanced SRS 2.0 Algorithm
- Based on the SuperMemo 2 algorithm
- Dynamic ease factor adjustment
- Intelligent interval scheduling
- 4 rating levels: Again, Hard, Good, Easy
- Real-time interval previews

### 🔄 Card Flip Animation
- Smooth 3D card flip animation when showing answers
- Front shows the hiragana character
- Back reveals romaji, mnemonic image, and description

### 🔊 Text-to-Speech
- Automatic Japanese pronunciation when showing answer
- Uses browser's built-in speech synthesis
- Supports Japanese language voices

### 🎨 Tofugu-Style Mnemonics
- Creative visual mnemonics for each character
- Story-based memory aids
- Placeholder system for mnemonic images

### 🔥 Streak Tracking
- Daily study streak counter
- Best streak record
- Automatic streak validation

### 📊 Comprehensive Statistics
- Total cards, reviews, and accuracy
- Character breakdown by type
- Individual character progress
- Mastery status visualization

### ⚙️ Customizable Settings
- Adjustable new cards per day
- Daily review limit
- Enable/disable character sets
- Progress reset option

### ⌨️ Keyboard Shortcuts
- **Space/Enter**: Show answer or rate as "Good"
- **1-4**: Rate cards (Again, Hard, Good, Easy)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Building for Production

```bash
npm run build
```

This creates an optimized production build in the `build` folder.

## How to Use

### Studying
1. Click "Show Answer" or press **Space** to flip the card
2. The app will read the character aloud in Japanese
3. Read the mnemonic description to help remember the character
4. Rate your knowledge:
   - **Again (1)**: Didn't know it - resets the card
   - **Hard (2)**: Struggled - slightly longer interval
   - **Good (3)**: Knew it - normal interval
   - **Easy (4)**: Very easy - much longer interval

### Adding Mnemonic Images

The app includes Tofugu-style mnemonic descriptions, but you'll need to add images yourself:

1. Create a `public/mnemonics` folder
2. Add images named after each character (e.g., `a.png`, `ka.png`, etc.)
3. Or update the image paths in `src/data/hiraganaData.js` to point to your images

**Note**: Tofugu provides excellent mnemonic images through their resources. If you have access to their materials, you can use those. Otherwise, create your own illustrations based on the mnemonic descriptions provided.

## Browser Compatibility

### Text-to-Speech Requirements
- **Chrome/Edge**: Full support with Japanese voices
- **Firefox**: Supported with available system voices
- **Safari**: Supported on macOS/iOS

For best Japanese pronunciation, ensure you have Japanese language voices installed on your system.

## Data Storage

All progress is saved in browser localStorage:
- Card review history
- SRS intervals and ease factors
- Study streak data
- Settings preferences

Your data persists between sessions but is stored locally on your device.

## Project Structure

```
src/
├── components/
│   ├── Flashcard.js      # Card flip component
│   ├── Study.js          # Study session component
│   ├── Statistics.js     # Stats and progress tracking
│   └── Settings.js       # Settings panel
├── data/
│   └── hiraganaData.js   # Character data and mnemonics
├── utils/
│   ├── srsAlgorithm.js   # SRS card logic
│   ├── storage.js        # LocalStorage utilities
│   └── textToSpeech.js   # TTS functionality
├── App.js                # Main application
├── App.css               # Styles and animations
└── index.js              # React entry point
```

## Customization

### Adjusting the SRS Algorithm
Edit `src/utils/srsAlgorithm.js` to modify:
- Initial intervals
- Ease factor calculations
- Mastery thresholds

### Adding More Characters
Edit `src/data/hiraganaData.js` to add katakana or other characters.

### Styling
Modify `src/App.css` to customize colors, animations, and layout.

## Tips for Learning

1. **Study daily** to maintain your streak and reinforce learning
2. **Be honest** with your ratings - this helps the SRS algorithm optimize your reviews
3. **Use the mnemonics** - visual stories make characters much easier to remember
4. **Start with basics** - disable dakuten/han-dakuten until you master basic hiragana
5. **Review the statistics** to identify characters that need more practice

## Credits

- Mnemonic style inspired by [Tofugu](https://www.tofugu.com/)
- SRS algorithm based on SuperMemo 2
- Built with React and modern web technologies

## License

This project is for educational purposes. Please respect copyright for any images or content you add.

## Troubleshooting

### Text-to-Speech not working
- Check that your browser supports speech synthesis
- Ensure Japanese voices are installed on your system
- Try Chrome/Edge for the best compatibility

### Data not saving
- Check that localStorage is enabled in your browser
- Ensure you're not in private/incognito mode

### Cards not showing
- Check the Settings tab to ensure character sets are enabled
- Try resetting progress (Settings > Reset All Progress)

---

Happy learning! 頑張って！ (Ganbatte!)
