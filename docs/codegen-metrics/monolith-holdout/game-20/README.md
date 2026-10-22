# Memory Puzzle Game

A card-matching memory game built with React + Vite.

## Features
- Three difficulty levels: Easy (4×4), Medium (4×6), Hard (6×6)
- Smooth 3D card flip animations
- Move counter and elapsed timer
- Best score persistence via localStorage (per difficulty)
- Win screen with stats and new-best detection

## Getting Started

```bash
npm install
npm run dev
```

## How to Play
1. Select a difficulty level in the toolbar
2. Click any card to flip it face-up
3. Click a second card — if the symbols match, they stay revealed
4. If they don't match, both cards flip back after a short delay
5. Match all pairs to win!

## Project Structure
```
src/
  hooks/useGameState.js   — core game logic (flip, match, timer, win)
  components/
    GameBoard.jsx         — responsive CSS grid of cards
    Card.jsx              — individual card with 3D flip animation
    Toolbar.jsx           — stats, difficulty selector, restart
    WinScreen.jsx         — victory overlay with score summary
  utils/helpers.js        — shuffle, generateDeck, formatTime
  styles/global.css       — CSS variables, animations, layout
```
