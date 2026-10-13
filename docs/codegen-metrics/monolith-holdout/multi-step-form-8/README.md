# Claim Wizard

A multi-step claim submission wizard built with React and Vite.

## Features

- **3-step wizard flow**: Date → Amount → Review
- **Inline validation** on each step before advancing
- **Visual step indicator** with completed/active states
- **Confirmation screen** with a generated reference ID
- **Fully accessible**: ARIA labels, roles, and live regions
- **Responsive**: Works on mobile, tablet, and desktop
- **No external UI libraries** — plain CSS only

## Steps

| Step | Purpose |
|------|---------|
| 1 — Date | Select the incident date (must not be in the future) |
| 2 — Amount | Enter the claim amount in USD (max $1,000,000) |
| 3 — Review | Confirm details and submit |

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

## Project Structure

```
src/
├── components/
│   ├── ClaimWizard.jsx    # Orchestrates all steps + confirmation
│   ├── StepIndicator.jsx  # Visual 1-2-3 progress bar
│   ├── Step1Date.jsx      # Date input form
│   ├── Step2Amount.jsx    # Currency amount input form
│   └── Step3Review.jsx    # Read-only review + submit
├── hooks/
│   └── useClaimForm.js    # Shared form state and navigation logic
├── utils/
│   └── helpers.js         # formatDate, formatCurrency, todayISO
├── styles/
│   └── global.css         # All styles (CSS custom properties)
├── App.jsx
└── main.jsx
```
