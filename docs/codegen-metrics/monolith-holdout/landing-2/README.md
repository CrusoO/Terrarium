# Spoke & Soil Bike Co-op — Marketing Page

A polished, single-page marketing site for a community bike co-op built with React + Vite.

## Features

- **Navbar** — Fixed top bar with smooth-scroll links and a mobile hamburger drawer. Becomes opaque on scroll.
- **Hero** — Full-viewport section with headline, tagline, dual CTAs, and an animated scroll cue.
- **Stats Bar** — Key co-op metrics displayed below the hero.
- **About** — Two-column section with narrative copy and program cards.
- **Pricing** — Three interactive membership tier cards sourced from `src/data/pricingData.js`. Cards are selectable; clicking the CTA shows a confirmation banner.
- **Footer** — Brand info, quick links, shop hours, and contact details.

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

## Customisation

- Edit membership tiers in `src/data/pricingData.js`.
- Swap design tokens (colours, radii, shadows) in `src/styles/global.css` under `:root`.
- Replace the hero gradient with a real photo by updating `.hero` background in the CSS.
