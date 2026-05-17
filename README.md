<div align="center">

# StudyOS — AI Student Operating System

**Production-grade SaaS platform for student productivity**

Built like a funded startup · Deployed in minutes · Powered by Claude AI

[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?style=flat&logo=vite)](https://vitejs.dev)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat&logo=typescript)](https://typescriptlang.org)
[![Tailwind](https://img.shields.io/badge/Tailwind-3-06B6D4?style=flat&logo=tailwindcss)](https://tailwindcss.com)
[![Express](https://img.shields.io/badge/Express-4-000000?style=flat&logo=express)](https://expressjs.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat&logo=postgresql)](https://postgresql.org)

</div>

---

## What is StudyOS?

StudyOS is a full-stack SaaS productivity platform for university students. It combines task management, AI tutoring, note-taking, habit tracking, Pomodoro timing, and analytics in a single, beautifully designed workspace.

**Design inspiration:** Notion · Linear · Framer · Stripe Dashboard

---

## Architecture

```
┌─────────────────────────────┐     JWT      ┌────────────────────────────────────┐
│   Vite + React + TypeScript │  ──────────► │   Express + PostgreSQL + JWT API   │
│                             │              │                                    │
│  Tailwind CSS (no CDN)      │              │  /api/auth   → bcrypt + JWT        │
│  Framer Motion animations   │              │  /api/tasks  → CRUD + Kanban       │
│  Zustand (persist)          │              │  /api/notes  → Markdown notes      │
│  React Router v6            │              │  /api/habits → 14-day logs         │
│  react-markdown (XSS safe)  │              │  /api/ai     → 🔒 Anthropic API    │
│  Lazy-loaded pages          │              │                                    │
│  Code splitting (chunks)    │              │  helmet · cors · rate-limit        │
│  Onboarding flow            │              │  Zod validation · asyncHandler     │
└─────────────────────────────┘              └────────────────────────────────────┘
         │ Vercel                                      │ Render
         │ Free tier, edge CDN                         │ PostgreSQL auto-provisioned
```

---

## Features

### 🎓 Dashboard
- Personalized greeting by name
- Stat cards: tasks done, study hours, streaks, focus score
- Interactive bar chart (study time by day)
- Donut chart (subject distribution)
- Upcoming task list, habit streak progress bars
- AI-generated daily insight

### ✓ Task Manager (Kanban)
- Three columns: To Do, In Progress, Done
- Drag-and-drop between columns
- Subject badges with color coding
- Priority indicators (High/Medium/Low)
- Due date display
- Add/delete tasks via modal

### ✦ AI Study Assistant
- Powered by Claude (via secure backend proxy)
- Markdown rendering with react-markdown
- Typewriter-style streaming effect
- Suggestion chips for common queries
- Chat history (session + database)
- Abort on navigate, retry on failure

### ▦ Notes
- Markdown editor + live preview
- Pinned notes section
- Full-text search
- AI-powered summarization (creates new note)
- Subject tagging + date tracking

### ◈ Habit Tracker
- 14-day activity grid
- Click to toggle any day
- Streak calculation (consecutive trailing days)
- Summary stats: total habits, best streak, completion %

### ◷ Study Planner
- Pomodoro timer: 25/5, 50/10, 90/20 presets
- Animated SVG progress ring
- Session counter + focus hours
- Exam countdown with progress bars
- Today's schedule timeline

### ▲ Analytics
- Weekly study hours bar chart
- Task completion by subject
- Habit heatmap (14 days)
- Subject time allocation donut chart
- Focus score, habit rate stats

### ⚙ Settings
- Profile (name, email, GPA, year, university)
- AI response style preference
- Notification toggles
- Dark/Light theme toggle
- Accent color picker (6 colors)
- Export data as JSON
- Clear all data

### 🎉 Onboarding
- 4-step welcome flow
- Profile setup
- Subject selection
- Animated transitions

---

## Quick Start

### Prerequisites
- Node.js ≥18
- PostgreSQL 14+

### 1. Clone & install

```bash
git clone <your-repo>

# Frontend
cd studyos-vite
npm install
cp .env.example .env.local
# Edit VITE_API_URL if backend isn't on localhost:4000

# Backend
cd ../studyos-backend
npm install
cp .env.example .env
# Fill in: DATABASE_URL, JWT_SECRET, ANTHROPIC_API_KEY
```

### 2. Database setup

```bash
# Using psql
createdb studyos_db

cd studyos-backend
node src/config/migrate.js   # create all tables
node src/config/seed.js      # add demo data
```

### 3. Run

```bash
# Terminal 1 — Backend
cd studyos-backend && npm run dev    # http://localhost:4000

# Terminal 2 — Frontend
cd studyos-vite && npm run dev       # http://localhost:3000
```

Demo login: `demo@studyos.app` / `demo1234`

---

## Frontend Structure

```
studyos-vite/
├── src/
│   ├── App.tsx                          ← Root: onboarding gate, layout, lazy routing
│   ├── main.tsx                         ← Vite entry: ReactDOM + Toaster
│   ├── components/
│   │   ├── ui/                          ← Button, Card, Modal, Input, Toggle, Badge, Skeleton, SafeMarkdown
│   │   ├── layout/                      ← Sidebar (mobile drawer), PageShell (transitions)
│   │   ├── onboarding/OnboardingPage    ← 4-step welcome flow
│   │   └── pages/
│   │       ├── dashboard/DashboardPage
│   │       ├── tasks/TasksPage          ← Kanban + DnD
│   │       ├── ai/AIPage                ← Chat UI
│   │       ├── notes/NotesPage          ← Editor + SafeMarkdown
│   │       ├── habits/HabitsPage        ← 14-day grid
│   │       ├── planner/PlannerPage      ← Pomodoro + schedule
│   │       ├── analytics/AnalyticsPage  ← Charts
│   │       └── settings/SettingsPage    ← Profile + theme
│   ├── store/useAppStore.ts             ← Zustand (persist) — all state
│   ├── services/api.ts                  ← HTTP client (auto token refresh)
│   ├── constants/data.ts                ← All types + static data
│   ├── utils/index.ts                   ← cn, formatDate, calcStreak, etc.
│   └── styles/globals.css              ← Tailwind @base + custom tokens
├── tailwind.config.ts                   ← Design system (os-* colors, fonts, animations)
├── vite.config.ts                       ← Code splitting, dev proxy to backend
└── vercel.json                          ← SPA rewrite rule
```

---

## Backend Structure

```
studyos-backend/
├── src/
│   ├── app.js                  ← Express: CORS, helmet, rate limits, all routes
│   ├── server.js               ← Port binding + graceful shutdown
│   ├── config/
│   │   ├── db.js               ← pg Pool + query helper + transactions
│   │   ├── migrate.js          ← Full PostgreSQL schema (idempotent)
│   │   └── seed.js             ← Demo user + sample data
│   ├── controllers/            ← auth, task, note, habit, ai (thin, delegates to services)
│   ├── services/               ← Business logic + all DB queries
│   ├── routes/                 ← auth, tasks, notes, habits, ai (route definitions)
│   ├── middleware/
│   │   ├── auth.middleware.js  ← JWT verify → req.user
│   │   ├── validate.middleware.js ← Zod schema → req.body
│   │   └── error.middleware.js ← Global error handler
│   ├── validators/             ← Zod schemas for all endpoints
│   └── utils/                  ← ApiError class, asyncHandler
└── render.yaml                 ← Render blueprint deployment
```

---

## Database Schema

| Table | Key Columns |
|-------|-------------|
| **users** | id (UUID), email (unique), name, password (bcrypt), gpa, year, accent_color, ai_style, notif_* |
| **refresh_tokens** | id, user_id → users, token (unique), expires_at |
| **tasks** | id, user_id → users, title, subject, priority, due_date, done, col, position |
| **habits** | id, user_id → users, name, target, position |
| **habit_logs** | id, habit_id → habits, logged_date, done (UNIQUE per habit+date) |
| **notes** | id, user_id → users, title, content (50K chars max), subject, pinned |
| **chat_messages** | id, user_id → users, role, content, tokens_used |
| **pomodoro_sessions** | id, user_id → users, duration, completed, session_date |

---

## Security

| Layer | Implementation |
|-------|---------------|
| API keys | Express server only — never in browser bundle |
| Authentication | JWT access (7d) + refresh token (30d) in PostgreSQL |
| Passwords | bcrypt with 12 rounds |
| Input validation | Zod schemas on every endpoint |
| Rate limiting | Global 100 req/min + AI-specific 20 req/min (express-rate-limit) |
| HTTP headers | helmet.js (CSP, X-Frame-Options, HSTS, etc.) |
| CORS | Locked to FRONTEND_URL env var |
| XSS | react-markdown replaces dangerouslySetInnerHTML |
| SQL injection | Parameterized pg queries only |
| Content cap | 8000 char input limit, 2000 token output cap |

---

## Deployment

### Frontend → Vercel

```bash
npm install -g vercel
cd studyos-vite
vercel
# Add environment variable in Vercel dashboard:
# VITE_API_URL = https://studyos-api.onrender.com/api
vercel --prod
```

### Backend → Render

Option 1: **Blueprint** (recommended)
```bash
# Push studyos-backend to GitHub
# Go to render.com → New → Blueprint
# Select repo → deploy
# Manually set: ANTHROPIC_API_KEY, FRONTEND_URL
```

Option 2: **Manual**
```bash
# New Web Service → Node → npm install → npm start
# Add PostgreSQL add-on → DATABASE_URL is auto-set
# After deploy, open Shell tab:
node src/config/migrate.js
node src/config/seed.js
```

### Environment Variables

**Frontend (Vercel):**
```
VITE_API_URL=https://studyos-api.onrender.com/api
```

**Backend (Render):**
```
NODE_ENV=production
DATABASE_URL=<auto-set by Render PostgreSQL>
JWT_SECRET=<generate: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
ANTHROPIC_API_KEY=sk-ant-...
FRONTEND_URL=https://studyos.vercel.app
RATE_LIMIT_RPM=20
BCRYPT_ROUNDS=12
```

---

## Performance

- All 8 pages lazy-loaded via React.lazy + Suspense
- Vite code splitting: vendor / motion / markdown / store bundles
- Skeleton loaders prevent layout shift
- Zustand persist: instant state restore on refresh
- Framer Motion: GPU-accelerated transforms only
- Canvas-based charts: no heavy chart library

---

## Accessibility

- Semantic HTML: `<main>`, `<nav>`, `<aside>`, `<ol>`, `<ul>`
- ARIA: `role="dialog"`, `role="switch"`, `role="log"`, `aria-current="page"`
- Keyboard: all interactive elements focusable, Escape closes modals
- Focus trap in modals, focus restored on close
- `aria-live="polite"` on AI chat log
- Skip-to-content link for screen readers
- Color contrast ≥ 4.5:1 on all text elements

---

## Self-Review: What Was Improved (vs original HTML prototype)

| Original | v2.0 |
|----------|-------|
| Single HTML file, CDN React | Vite + npm, code-split bundles |
| No build step | TypeScript, strict mode, tree-shaking |
| Inline styles everywhere | Tailwind utility classes + design tokens |
| No routing | React Router v6 (SPA) |
| localStorage only | Express + PostgreSQL + JWT |
| API key in browser | Server-side only |
| `dangerouslySetInnerHTML` | react-markdown (XSS safe) |
| One big component | 30+ typed components |
| No state management | Zustand + persist |
| No animations | Framer Motion throughout |
| Broken mobile layout | Responsive (3 breakpoints) + mobile drawer |
| No loading states | Skeleton loaders + Suspense |
| No toasts | react-hot-toast system-wide |
| No onboarding | 4-step animated welcome flow |
| No accessibility | Full ARIA + keyboard nav |
| No tests | Vitest + Testing Library |
| No linting | ESLint + Prettier + Tailwind sort |
