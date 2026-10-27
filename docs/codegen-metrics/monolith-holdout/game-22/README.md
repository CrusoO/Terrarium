# ⚡ Reaction Game

A fast-paced browser reaction time trainer. Tap the square the moment it turns green — the faster you tap, the better your score.

## How to Play

1. **Click the grey square** to start a round.
2. The square turns **red** — wait for it.
3. When it turns **green**, tap/click as fast as you can!
4. Your reaction time in milliseconds is shown immediately.
5. Tap again to play another round.

> ⚠ **False Start**: Tapping while the square is still red counts as a false start and won't be recorded.

## Ratings

| Time       | Rating     |
|------------|------------|
| < 150 ms   | 🏆 Legendary |
| < 200 ms   | 🥇 Excellent |
| < 250 ms   | ⚡ Great     |
| < 300 ms   | 👍 Good      |
| < 400 ms   | 😐 Average   |
| < 500 ms   | 🐢 Slow      |
| ≥ 500 ms   | 😴 Very Slow |

## Setup

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Build

```bash
npm run build
npm run preview
```

## Tech Stack

- **React 18** + **Vite 5**
- No external UI libraries
- `localStorage` for persisting best time and last 10 attempts
