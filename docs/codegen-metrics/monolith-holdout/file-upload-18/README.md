# Homework Drop Box

A frontend-only homework submission portal built with React and Vite. Students can attach a file, fill in their name, class period, and assignment title, then submit. All submissions are logged below the form and persisted to `localStorage`.

## Features

- **File attachment** via drag-and-drop or click-to-browse (max 10 MB)
- **Inline validation** with per-field error messages
- **Success banner** showing file name, size, and timestamp after submission
- **Submissions log** with sort (newest/oldest), student name, period, assignment title, file name, file size, and submission time
- **Seed data** pre-populates the log on first load (Alice, Bob, Carol)
- **Clear all** with a confirmation step
- **localStorage persistence** for submission metadata across page refreshes
- Fully responsive — works on mobile, tablet, and desktop

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Build for Production

```bash
npm run build
npm run preview
```

## Notes

- File objects are held in memory only (not serializable). Metadata (name, size, timestamps) persists via `localStorage`.
- No backend or external UI libraries are used.
