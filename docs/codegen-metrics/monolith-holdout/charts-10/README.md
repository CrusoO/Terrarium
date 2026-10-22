# Sales Chart Dashboard

A production-ready sales analytics dashboard built with React + Vite. Renders a combined bar + line chart using pure SVG — no external charting library required.

## Features

- **Bar chart** — monthly revenue (USD) for 2024
- **Line chart** — monthly order count overlaid on the same axis
- **Hover tooltips** — shows exact revenue and orders per month
- **Date range filters** — Full Year / H1 / H2 / Q4
- **KPI stat cards** — total revenue, total orders, avg order value (updates with filter)
- **Monthly breakdown table** — with revenue share progress bars
- Fully responsive (mobile / tablet / desktop)

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

## Stack

- React 18
- Vite 4
- lucide-react (icons)
- Pure SVG charts (no Recharts / Chart.js)
