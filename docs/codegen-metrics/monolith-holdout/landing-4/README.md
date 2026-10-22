# Happy Paws Dog Walking — Marketing Page

A polished, single-page marketing website for **Happy Paws Dog Walking**, built with React + Vite.

## Features

- **Sticky Navbar** — smooth-scroll anchor links with mobile hamburger menu
- **Hero Section** — headline, subtext, dual CTAs, and an illustrated dog graphic
- **Services Section** — four service cards (Solo Walk, Group Walk, Puppy Visit, Overnight Stay)
- **Pricing Section** — three tiered pricing cards with feature lists and CTA buttons
- **Testimonials Section** — five customer reviews with star ratings and avatars
- **Contact / Booking Section** — functional booking inquiry form with validation
- **Footer** — links, social icons, and copyright

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | React 18 |
| Build tool | Vite 5 |
| Routing | None (single page, anchor links) |
| Styling | Hand-written CSS with custom properties |
| Icons | lucide-react |
| Data | Static seed data in `src/data/content.js` |
| Persistence | None required |

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

## Project Structure

```
src/
├── App.jsx                  # Root component — assembles all sections
├── main.jsx                 # React entry point
├── components/
│   ├── Navbar.jsx           # Sticky nav with mobile menu
│   ├── Hero.jsx             # Hero with headline + CTA
│   ├── Services.jsx         # Service cards grid
│   ├── Pricing.jsx          # Pricing tier cards
│   ├── Testimonials.jsx     # Customer review cards
│   ├── Contact.jsx          # Booking inquiry form
│   └── Footer.jsx           # Footer with links
├── data/
│   └── content.js           # All static seed data
└── styles/
    └── global.css           # CSS variables, reset, utilities
```

## Customization

All business content (name, tagline, services, pricing, testimonials) lives in `src/data/content.js`. Edit that file to update the page content without touching component code.

Colors and spacing are defined as CSS custom properties in `src/styles/global.css` under `:root`.
