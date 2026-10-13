# Course Registration Wizard

A polished, multi-step registration wizard built with React + Vite. Collects contact information, course selection, waiver agreement, and presents a final review before submission.

## Features

- **Step 1 – Contact Info**: First name, last name, email, and phone with real-time validation
- **Step 2 – Course Selection**: Card-based course picker with 6 seeded courses including dates, instructors, seats, and pricing
- **Step 3 – Waiver**: Scrollable liability waiver with must-scroll enforcement before the checkbox is enabled
- **Step 4 – Review**: Read-only summary with inline Edit buttons to jump back to any step; Submit logs the payload
- Visual progress bar with completed/active states
- Responsive layout for mobile, tablet, and desktop

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
│   ├── steps/
│   │   ├── ContactInfo.jsx    # Step 1: name, email, phone
│   │   ├── CourseSelection.jsx # Step 2: pick a course
│   │   ├── Waiver.jsx         # Step 3: scrollable waiver
│   │   └── Review.jsx         # Step 4: summary + submit
│   ├── NavButtons.jsx         # Back / Next / Submit
│   ├── ProgressBar.jsx        # Step indicator
│   └── Wizard.jsx             # Step router + shared state
├── data/
│   └── courses.js             # Seeded course catalog
├── hooks/
│   └── useWizardState.js      # Form state management
├── styles/
│   └── global.css             # All styles
├── utils/
│   └── helpers.js             # Validation functions
├── App.jsx
└── main.jsx
```

## Notes

- All state is held in memory (no backend or localStorage)
- On submission, the full registration payload is logged to the browser console
- The waiver checkbox is disabled until the user scrolls to the bottom of the waiver text
