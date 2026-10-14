# Clara Voss — Food Photography Portfolio

A one-page marketing site for a freelance food photographer, built with React + Vite.

## Features

- **Hero** — Full-width dark banner with photographer name, tagline, and bio
- **Portfolio** — Three interactive shoot cards (Farm-to-Table, Artisan Bakery, Cocktail Menu) with expandable detail panels
- **Quote Form** — Validated contact form with inline success confirmation

## Tech Stack

- React 18
- Vite 5
- No external CSS frameworks or CDN assets
- All placeholder images are inline SVG scenes

## Getting Started

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

## Structure

```
src/
  components/
    Hero.jsx        — Photographer intro section
    Portfolio.jsx   — Shoot grid with detail panel
    ShootCard.jsx   — Individual shoot card
    QuoteForm.jsx   — Quote request form
  data/
    shoots.js       — Static shoot data with inline SVG scenes
  styles/
    global.css      — All styles (warm editorial theme)
  App.jsx           — Page composition
  main.jsx          — Vite entry point
```
