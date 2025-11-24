# Quick Start Guide

## Get Started in 3 Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the App
```bash
npm start
```

### 3. Open Your Browser
Navigate to [http://localhost:3000](http://localhost:3000)

## First Time Setup

When you first open the app:
1. Click "Study" tab (already selected)
2. Press **Space** or click "Show Answer"
3. The card will flip and read the character aloud in Japanese
4. Read the mnemonic description
5. Rate your knowledge (1-4 or Again/Hard/Good/Easy)

## Key Features to Try

### Card Flip Animation
- Click "Show Answer" to see the smooth 3D flip
- Front: Hiragana character
- Back: Romaji + mnemonic

### Text-to-Speech
- Automatically plays when you flip the card
- Uses browser's Japanese voice
- Works best in Chrome/Edge

### Tofugu Mnemonics
- Each character has a visual story
- Helps create memorable associations
- See the description on the back of each card

### Streak Tracking
- Study daily to build your streak
- Fire icon 🔥 shows current streak
- Check Statistics for your best streak

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Space/Enter | Show answer or rate as "Good" |
| 1 | Rate as "Again" (reset card) |
| 2 | Rate as "Hard" |
| 3 | Rate as "Good" |
| 4 | Rate as "Easy" |

## Adding Mnemonic Images (Optional)

The app includes placeholder images. To add real mnemonic illustrations:

1. Create folder: `public/mnemonics/`
2. Add images named: `a.png`, `ka.png`, etc.
3. Or use images from Tofugu if you have access

The app will work fine without images - the text mnemonics are very helpful on their own!

## Settings to Adjust

Visit the Settings tab to customize:
- **New cards per day**: Start with 10, increase as you get comfortable
- **Daily review limit**: Default 100 is good for most learners
- **Character sets**: Disable dakuten/han-dakuten until you master basics

## Troubleshooting

**No sound?**
- Check browser supports speech synthesis (Chrome/Edge work best)
- Install Japanese language pack on your system
- Check browser volume/permissions

**Cards not appearing?**
- Refresh the page
- Check Settings tab - ensure character sets are enabled
- Clear browser cache if needed

**Data lost?**
- Don't use incognite/private mode
- Check localStorage is enabled in browser
- Export/backup not yet implemented (coming soon)

---

That's it! Start studying and enjoy learning Hiragana! 🎌
