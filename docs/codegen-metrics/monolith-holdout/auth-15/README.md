# Auth App — Login, Register & Password Reset

A full-stack authentication application built with React/Vite (frontend) and Node/Express (backend).

## Features

- **Login** — Email + password with JWT token issuance
- **Register** — Full name, email, password with confirmation and validation
- **Forgot Password** — Request a reset link via email (token logged to console in dev)
- **Reset Password** — Set a new password using a token from the URL
- **Dashboard** — Protected stub page shown after successful login
- **Demo user** — `demo@example.com` / `password123` pre-seeded for instant testing

## Project Structure

```
.
├── package.json          # Root scripts (runs both frontend + backend)
├── shared/
│   └── constants.js      # Shared API route constants
├── frontend/             # Vite + React SPA
│   ├── package.json
│   ├── vite.config.js    # Proxies /api → backend :4000
│   └── src/
│       ├── App.jsx
│       ├── context/AuthContext.jsx
│       ├── hooks/useApi.js
│       ├── components/
│       │   ├── AuthLayout.jsx
│       │   ├── FormField.jsx
│       │   └── ProtectedRoute.jsx
│       ├── pages/
│       │   ├── LoginPage.jsx
│       │   ├── RegisterPage.jsx
│       │   ├── ForgotPasswordPage.jsx
│       │   ├── ResetPasswordPage.jsx
│       │   └── DashboardPage.jsx
│       └── styles/global.css
└── backend/              # Node + Express REST API
    ├── package.json
    ├── .env.example
    └── src/
        ├── server.js
        ├── config/env.js
        ├── models/userStore.js
        ├── controllers/authController.js
        ├── routes/auth.js
        └── middleware/errorHandler.js
```

## Quick Start

### 1. Install all dependencies

```bash
npm run install:all
```

### 2. Configure environment

```bash
cp backend/.env.example backend/.env
# Edit backend/.env and set a strong JWT_SECRET
```

### 3. Run in development (both servers)

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:4000

### 4. Build for production

```bash
npm run build
```

## API Endpoints

| Method | Path | Body | Response |
|--------|------|------|----------|
| POST | `/api/auth/register` | `{ name, email, password }` | `{ user, token }` |
| POST | `/api/auth/login` | `{ email, password }` | `{ user, token }` |
| POST | `/api/auth/forgot-password` | `{ email }` | `{ message }` |
| POST | `/api/auth/reset-password` | `{ token, newPassword }` | `{ message }` |

## Demo Credentials

| Field | Value |
|-------|-------|
| Email | `demo@example.com` |
| Password | `password123` |

## Password Reset Flow (Development)

Since there is no real email service configured, the reset token is printed to the **backend console** when you submit the Forgot Password form:

```
[DEV] Password reset token for demo@example.com: <token>
[DEV] Reset URL: http://localhost:5173/reset-password?token=<token>
```

Copy the URL from the console and open it in your browser to test the full reset flow.

## Validation Rules

- **Email** — must be a valid email format
- **Password** — minimum 8 characters
- **Confirm Password** — must match the password field
- **Name** — required, minimum 2 characters
- **Reset Token** — expires after 1 hour

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, React Router v6 |
| Backend | Node.js, Express 4 |
| Auth | JWT (jsonwebtoken), bcryptjs |
| State | React Context + localStorage |
| Styling | Plain CSS with custom properties |
