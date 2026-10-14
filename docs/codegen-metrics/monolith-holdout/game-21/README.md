# Trivia Quiz Bowl

A fast-paced, browser-based trivia quiz game built with React + Vite.

## Features
- 15 questions across Science, History, Geography, and Pop Culture
- Questions and answer choices are shuffled every session for replayability
- Instant correct/wrong feedback after each answer (auto-advances after ~1 second)
- Live score bar and question progress indicator
- Results screen with final score, percentage, grade label, and full per-question review

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## Build for Production

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
  data/questions.js       — 15 static trivia questions with categories and answers
  hooks/useQuiz.js        — Quiz state machine (start, answer, feedback, results)
  components/
    StartScreen.jsx       — Welcome screen with rules and start button
    QuestionCard.jsx      — Active question with answer options and progress
    AnswerButton.jsx      — Individual answer choice with feedback states
    ScoreBar.jsx          — Progress bar and live score display
    ResultsScreen.jsx     — Final score, grade, and question-by-question review
  utils/helpers.js        — shuffleArray, shuffleAnswers, calcPercentage, getGradeLabel
  styles/global.css       — CSS custom properties and all component styles
```
