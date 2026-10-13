# PermitPortal — Permit Application Wizard

A clean, three-step building permit application wizard built with React + Vite.

## Features

- **Step 1 – Address**: Collects street address, city, state (dropdown), and ZIP code with validation.
- **Step 2 – Work Type**: Radio card selector for work category (New Construction, Renovation, Electrical, Plumbing, Other) plus a required project description.
- **Step 3 – Review**: Read-only summary of all entered data with a disclaimer before submission.
- **Success Screen**: Confirmation with a generated permit number after submission.
- Field-level validation with inline error messages.
- Visual step progress indicator with completed/active/upcoming states.
- Fully responsive — works on mobile, tablet, and desktop.

## Getting Started

```bash
npm install
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173).

## Build

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
  App.jsx                  # Root component, wizard state
  context/
    WizardContext.jsx      # Shared context for step data + navigation
  components/
    StepIndicator.jsx      # Visual 1-2-3 progress bar
    SuccessScreen.jsx      # Post-submission confirmation
  steps/
    Step1Address.jsx       # Address form
    Step2WorkType.jsx      # Work type selector + description
    Step3Review.jsx        # Read-only review + submit
  utils/
    helpers.js             # Validation functions + static data
  styles/
    global.css             # All styles via CSS custom properties
```
