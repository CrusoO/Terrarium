# Weather Dashboard

A clean, interactive weather chart page built with React + Vite and Recharts.

## Features

- **Temperature Line Chart** — dual-line chart showing daily high and low temperatures (°C) over 7 days
- **Rainfall Bar Chart** — bar chart showing daily rainfall totals (mm), with the wettest day highlighted
- **Summary Stat Cards** — avg high, avg low, total rainfall, and wettest day at a glance
- **View Toggle** — switch between showing all charts, temperature only, or rainfall only
- **Responsive layout** — works on mobile, tablet, and desktop

## Getting Started

```bash
npm install
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173).

## Data

All data is seeded in `src/data/weatherData.js` as a 7-day illustrative forecast for London, UK (14–20 Jul 2025). No API keys or backend required.

## Stack

- React 18 + Vite 5
- Recharts 2 (LineChart, BarChart, ResponsiveContainer)
- Pure CSS with custom properties (no CSS framework)
