# Sign In App

A full-stack sign-in screen built with React + Vite (frontend) and Node + Express (backend).

## Features

- **Sign In** — email + password form with client-side validation and server-side auth
- **Create Account** — registration form with field validation and success state
- **Dashboard** — post-login confirmation screen with user info and sign-out
- **Demo credentials** — `demo@example.com` / `password123`

## Quick Start

### Install dependencies

```bash
# Root (concurrently runner)
npm install

# Frontend
cd frontend && npm install

# Backend
cd backend && npm install
```

### Configure environment

```bash
cp backend/.env.example backend/.env
```

### Run (both servers)

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## Project Structure

```
├── frontend/
│   ├── src/
│   │   ├── pages/       SignIn, Register, Dashboard
│   │   ├── hooks/       useApi.js (fetch wrapper)
│   │   └── styles/      global.css
│   └── vite.config.js   (proxies /api → :3001)
├── backend/
│   └── src/
│       ├── routes/      auth.js
│       ├── controllers/ authController.js
│       ├── models/      userStore.js (in-memory)
│       └── middleware/  errorHandler.js
└── shared/
    └── constants.js
```

## Demo Accounts

| Email | Password |
|---|---|
| demo@example.com | password123 |
| jane@example.com | jane1234 |
