# Track Here — Complete Study Management Operating System

**Track Here** is a personal productivity, accountability, and learning platform designed specifically for students mastering **C++**, **Data Structures & Algorithms (DSA)**, **Competitive Programming (CP)**, and related technical subjects.

Built with a calm green design with light and dark themes, it provides a high-focus environment that helps students study consistently, measure real focused hours, manage tasks, take rich technical notes, journal competitive programming attempts, retain concepts via spaced repetition, and maintain accountability morning and evening.

---

## 1. Tech Stack

- **Frontend**:
  - React 18 + Vite
  - JavaScript (ES Modules, strict zero-TypeScript as required)
  - Tailwind CSS with custom dark palette
  - Custom UI Component Library (`Button`, `Card`, `Dialog`, `Progress`, `Select`, `Textarea`, `Tabs`, `Switch`, etc.)
  - Lucide React icons
  - React Router DOM v7
  - TanStack React Query (v5)
  - Axios with automated JWT refresh token interceptors
  - Recharts for performance and study time analytics
  - Tiptap (Rich Text with Markdown dual-mode editing)
  - date-fns and date-fns-tz
  - Web Push API & Service Workers

- **Backend**:
  - Node.js & Express.js (ES Modules)
  - MongoDB Atlas & Mongoose
  - JWT Authentication with short-lived access tokens (15m) + refresh token rotation (7d)
  - Secure HTTP-only cookies (`SameSite: Lax`, `HttpOnly`)
  - bcryptjs for password hashing
  - Zod for request body and query validation schemas
  - Helmet for security headers
  - express-rate-limit for endpoint protection
  - node-cron for scheduled morning/evening notifications
  - web-push for browser push delivery

---

## 2. Architecture & Directory Layout

```
Track Here/
├── package.json                   # Root workspace scripts (dev, build, start)
├── .gitignore                     # Git exclusions (env files, node_modules, dist)
├── README.md                      # Complete system documentation
│
├── client/                        # React + Vite Frontend
│   ├── public/
│   │   └── sw.js                  # Service worker for Web Push notifications
│   ├── index.html                 # App shell with theme color
│   ├── vite.config.js             # Vite config with API proxy & path aliases
│   ├── tailwind.config.js         # Custom dark theme colors & typography
│   ├── .env.example
│   └── src/
│       ├── main.jsx               # React DOM entry with QueryClient & Toaster
│       ├── App.jsx                # Router & ProtectedRoute guard
│       ├── index.css              # Tailwind base, dark scrollbars, ProseMirror
│       ├── api/                   # API service modules (Axios)
│       │   ├── axios.js           # Interceptor with token refresh queue
│       │   ├── auth.js            # Authentication endpoints
│       │   ├── studySessions.js   # Study sessions & timer
│       │   ├── tasks.js           # Tasks CRUD & status toggles
│       │   ├── notes.js           # Notes CRUD & folder organization
│       │   ├── problems.js        # Problem journal & attempt records
│       │   ├── dailyPlans.js      # Morning accountability plans
│       │   ├── dailyReviews.js    # Evening reviews & auto-stats
│       │   ├── revisions.js       # Spaced repetition queue
│       │   ├── mockTests.js       # Mock test logs
│       │   ├── timetable.js       # Weekly timetable slots
│       │   ├── analytics.js       # Dashboard & review metrics
│       │   ├── search.js          # Global multi-entity search
│       │   └── users.js           # Profile, preferences, backup
│       ├── hooks/                 # TanStack Query & state hooks
│       │   ├── useAuth.jsx        # Auth context & session recovery
│       │   ├── useTimer.js        # Active timer with recovery after refresh
│       │   ├── usePomodoro.js     # Timestamp-driven Pomodoro engine
│       │   ├── useStudySessions.js
│       │   ├── useTasks.js
│       │   ├── useNotes.js
│       │   ├── useProblems.js
│       │   ├── useDailyPlans.js
│       │   ├── useDailyReviews.js
│       │   ├── useRevisions.js
│       │   ├── useMockTests.js
│       │   ├── useTimetable.js
│       │   ├── useRewards.js
│       │   └── useAnalytics.js
│       ├── components/
│       │   ├── ui/                # Accessible UI primitives
│       │   ├── layout/            # AppLayout, Header, MobileTabBar, SyncStatus
│       │   ├── dashboard/         # DashboardPage, ErrorLog, FirstSessionGuide
│       │   ├── study/             # StudyPage, PomodoroTimer, TodaySessions, HistoryDrawer
│       │   ├── plan/              # PlanPage (Tasks, Week, Subjects)
│       │   ├── notes/             # NotesPage (Markdown & local draft persistence)
│       │   ├── progress/          # ProgressPage, StudyInsights, ReportModal
│       │   ├── journal/           # MorningPlan, EveningReview
│       │   ├── revisions/         # RevisionsPage, ReviewSheet, RevisionCard, RevisionForm
│       │   ├── discover/          # Discover, Garden, Achievements, Circles, Roadmaps, PublicTools
│       │   ├── settings/          # SettingsPage
│       │   ├── rewards/           # RewardsSheet
│       │   ├── admin/             # AdminPage
│       │   └── search/            # CommandPalette (Ctrl+K)
│       └── lib/
│           ├── utils.js           # cn(), date & duration formatters
│           └── constants.js       # Categories, priorities, platforms
│
└── server/                        # Express + Mongoose Backend
    ├── index.js                   # Server entry point with middleware & crons
    ├── .env.example
    ├── config/
    │   ├── db.js                  # MongoDB Atlas connection handler
    │   ├── env.js                 # Environment validation
    │   └── cors.js                # CORS options & credentials
    ├── middleware/
    │   ├── auth.js                # JWT verification & owner extraction
    │   ├── validate.js            # Zod validation middleware factory
    │   ├── rateLimiter.js         # Endpoint rate limiting
    │   └── errorHandler.js        # Centralized error handler
    ├── models/                    # 12 Mongoose Models (Owner-Scoped)
    │   ├── User.js
    │   ├── RefreshSession.js      # Refresh token rotation with TTL
    │   ├── StudySession.js        # Focus duration & timer state
    │   ├── Task.js                # Priorities, deadlines, recurrence
    │   ├── Note.js                # Dual-mode rich & markdown storage
    │   ├── Problem.js             # Platform, difficulty, solo flag
    │   ├── ProblemAttempt.js      # Complexities, approaches, mistakes
    │   ├── DailyPlan.js           # Morning targets & priorities
    │   ├── DailyReview.js         # Evening metrics & reflection
    │   ├── Revision.js            # Adaptive spaced intervals
    │   ├── PushSubscription.js    # Web Push endpoints
    │   └── NotificationLog.js     # Deduplicated alerts history
    ├── controllers/               # 12 REST Controllers
    ├── routes/                    # 12 Express Routers mounted on `/api/*`
    ├── services/
    │   ├── streakService.js       # Timezone-aware streak engine (≥25m rule)
    │   ├── analyticsService.js    # Aggregations, heatmap & summaries
    │   └── notificationService.js # Cron worker & webpush dispatcher
    └── utils/
        ├── ApiError.js            # Structured API errors
        ├── asyncHandler.js        # Async route wrapper
        └── tokens.js              # Access & Refresh token helpers
```

---

## 3. Core Modules & Interactions

### A. Authentication & Profiles
- Signup, login, logout, password recovery.
- Short-lived JWT access tokens in memory/cookie, paired with secure HTTP-only refresh tokens.
- Automatic refresh token rotation on token expiry.
- Owner-scoped queries: Every resource query is filtered by `user: req.user.id`.

### B. Live Dashboard
- Greeting personalized by time of day.
- Today's focused study minutes vs. 4-hour default goal with progress bar.
- Streak summary (current and all-time record).
- Problems attempted, solved, and solo-solved percentage.
- 7-day study chart (Recharts) and monthly consistency heatmap.
- Quick action shortcuts.

### C. Study Tracker & Focus Timer
- Interactive timer with pause, resume, and finish.
- State persisted in database: recovers active timer automatically across browser refresh or navigation.
- Separate tracking for video duration vs. genuine focused study time.
- Filterable history by category (`C++`, `DSA`, `Competitive Programming`, `Other`), activity type, topic, and date range.
- Dual view: List and Calendar.

### D. Task Manager
- Tabbed views: **Today**, **Upcoming**, **Backlog**, and **Completed**.
- Priority badges (Low, Medium, High).
- Due date calculation with relative time.
- Recurring task support (Daily, Weekly, Monthly).
- Link tasks directly to study sessions.

### E. Notes Workspace
- Powered by Tiptap with dual editing modes:
  1. **Rich-Text Editor**: Headings, lists, code blocks, checklists, bold, italic, underline, links.
  2. **Markdown Editor**: Split-screen live preview with syntax parsing.
- Debounced autosave with clear status indicators (**Saving**, **Saved at [time]**, **Save failed**).
- Folder categorization and pinned notes.

### F. Competitive Programming Journal
- Track problems from **Codeforces**, **CodeChef**, **LeetCode**, and others.
- Log multiple attempts with time spent, outcome (`Solved independently`, `Solved with hints`, `Solved after viewing solution`, `Not solved`).
- Store time complexity, space complexity, mistakes, and core learnings.
- Distinguishes independent solving percentage.

### G. Morning & Evening Accountability
- **Morning Check-In (7:00 AM)**: Set daily study hours target, define C++, DSA, and CP goals, select priority tasks, write daily intentions.
- **Evening Review (9:00 PM)**: Automatically populates actual focused hours, completed tasks, and problems solved today without forcing redundant input; prompts for learnings, mistakes, and tomorrow's plan.

### H. Study Streak & Consistency Engine
- **Active Day Rule**: Requires at least **25 minutes** of focused study to preserve streak. Tasks or passive app opens do not qualify.
- Timezone-aware calculation prevents date-boundary errors.
- Milestone badges: 7-day, 14-day, 30-day, 60-day, and 50 problems.
- Full 52-week GitHub-style consistency heatmap.

### I. Spaced Repetition Revision Manager
- Queue topics, notes, or problems for periodic review.
- Feedback-based adaptive interval calculation:
  - **Easy**: Doubles interval (e.g. 1 → 3 → 7 → 14 → 30 days).
  - **Correct but slow**: 1.5× interval.
  - **Needed hint**: Maintains current interval.
  - **Forgot**: Resets interval to 1 day.

### J. Analytics & Weekly Review
- Weekly review synthesis separating raw time spent from demonstrated learning mastery.
- Category breakdown pie chart and top topics list.
- Problem solving distribution by difficulty and platform.

### K. Web Push Notifications
- Browser push reminders via Web Push API and VAPID keys.
- Scheduled backend cron jobs check morning reminders, evening reviews, task deadlines, and due revisions every minute.
- Configurable quiet hours and per-channel switches.

### L. Global Search & Command Palette (`Ctrl + K` / `Cmd + K`)
- Fast global search across Study Sessions, Tasks, Notes, and Problems.
- Quick navigation shortcuts.

---

## 4. Getting Started Locally

### Prerequisites
- Node.js 22 or higher
- npm (v9.0.0 or higher)
- A MongoDB database (MongoDB Atlas or local `mongodb://127.0.0.1:27017/trackhere`)

### Installation

1. Clone or open the workspace:
   ```bash
   cd "Track Here"
   ```

2. Install root, client, and server dependencies:
   ```bash
   npm install
   npm --prefix client install
   npm --prefix server install
   ```

3. Setup environment variables:
   - In `server/.env`:
     ```env
     PORT=5000
     MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/trackhere?retryWrites=true&w=majority
     JWT_ACCESS_SECRET=your_super_secret_access_key
     JWT_REFRESH_SECRET=your_super_secret_refresh_key
     CLIENT_URL=http://localhost:5173
     NODE_ENV=development
     VAPID_PUBLIC_KEY=
     VAPID_PRIVATE_KEY=
     VAPID_EMAIL=mailto:support@trackhere.app
     ```
   - In `client/.env`:
     ```env
     VITE_API_URL=/api
     ```

4. Run development servers concurrently:
   ```bash
   npm run dev
   ```
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:5000/api`

5. Build for production:
   ```bash
   npm run build
   ```

---

## 5. Deployment Guide

### A. MongoDB Atlas
1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a database user with read/write access.
3. Whitelist Network Access IP `0.0.0.0/0` (allow access from anywhere) for Render.
4. Copy the connection string into the server's `MONGODB_URI` environment variable.

### B. Backend on Render
1. Create a new **Web Service** on [Render](https://render.com).
2. Connect your GitHub repository.
3. Set **Root Directory**: `server`
4. Set **Build Command**: `npm install`
5. Set **Start Command**: `npm start`
6. Add Environment Variables:
   - `MONGODB_URI`
   - `JWT_ACCESS_SECRET`
   - `JWT_REFRESH_SECRET`
   - `CLIENT_URL` (URL of your deployed Vercel frontend)
   - `NODE_ENV=production`

### C. Frontend on Vercel
1. Import the repository on [Vercel](https://vercel.com).
2. Set **Root Directory**: `client`
3. Framework Preset: **Vite**
4. Set **Build Command**: `npm run build`
5. Set **Output Directory**: `dist`
6. Configure rewrites for client-side routing in `vercel.json`:
   ```json
   {
     "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
   }
   ```
7. Set Environment Variable:
   - `VITE_API_URL`: Your Render backend URL (e.g. `https://track-here-api.onrender.com/api`)

---

## 6. Security Features

- **Passwords**: Hashed with `bcryptjs` (salt rounds: 12).
- **Authentication**: Short-lived JWT access tokens with secure HTTP-only refresh tokens.
- **Refresh Token Rotation**: Old refresh tokens are invalidated upon renewal to prevent token replay attacks.
- **Authorization**: All private endpoints strictly verify user ownership server-side using `req.user.id`.
- **Validation**: Strict Zod schemas on all route requests reject invalid payloads.
- **Rate Limiting**: Rate limiting middleware on API and Auth routes prevents brute-force attacks.
- **Headers**: Secured with Helmet.
- **CORS**: Whitelist restricted to authorized client domains.

---

## 7. Backups

Run backups monthly and keep the archive file on your own computer.

### Windows PowerShell
```powershell
$d = Get-Date -Format yyyy-MM-dd
mongodump --uri="$env:MONGODB_URI" --gzip --archive="backups/trackhere-$d.gz"

# Restore into a NEW empty database to test it:
mongorestore --uri="$env:MONGODB_URI_RESTORE" --gzip --archive="backups/trackhere-$d.gz"
```

### Bash
```bash
mongodump --uri="$MONGODB_URI" --gzip --archive="backups/trackhere-$(date +%F).gz"

# Restore into a NEW empty database to test it:
mongorestore --uri="$MONGODB_URI_RESTORE" --gzip --archive="backups/trackhere-$(date +%F).gz"
```


## Workspace reliability and design update

The five primary views remain Today, Focus, Plan, Notes, and Progress. Today tasks carry their subject and task identity into Focus. One app-level Pomodoro engine now owns the screen timer, header controls, persistence, and completion callbacks across page navigation. Timer snapshots are isolated by account. A completed focus block is durably queued before the timer advances; the completion panel can complete its linked task, create a learning note, or schedule a revision.

The cloud button distinguishes syncing, offline, and pending device saves. The IndexedDB queue stores an owner ID, retries transient errors with backoff, pauses authentication failures, and retains validation failures for retry/export. The backend checks `X-Account-Id` against the authenticated user before accepting queued writes. Deploy the frontend and backend changes together. Old queue records without an owner are preserved but deliberately not automatically assigned to an account.

Notes synchronously retain account-specific local drafts and coalesce queued updates by note. Markdown is the canonical text format for the Notes workspace; stale HTML is cleared on edit. Keep browser data until the cloud button confirms pending writes have synced. Local draft persistence does not provide conflict merging between devices.

Shared buttons, cards, badges, empty states, skeletons, dialogs and sheets live in `client/src/components/ui`. The legacy `ui.jsx` entry re-exports the same components. Native modal dialogs provide keyboard focus containment and restore focus on close. Plan includes a mobile agenda and planned/recorded totals. Progress includes daily goals, subject gaps, and matching repeated mistake notes from the last 90 days. Revision buttons preview their next date using the same interval function as the backend.

Landing previews under `client/public/previews` are screenshots of the real UI with demo API data, not real user records. Brand and empty-state illustrations are code-native SVG assets. The service worker caches same-origin shell assets only and uses the actual brand asset in its install list.

### Verification

```sh
npm run test:unit
npm run test:server
npm --prefix client run build
npm run test:e2e
```

`test:e2e` uses Playwright Chromium and a local production preview with deterministic API fixtures. It checks browser behavior without contacting a production database; it is not a live-backend integration suite. Install a Playwright browser if absent (`npx playwright install chromium`). The browser check covers password-reset payloads and service failures, mobile signup, subjects, timer recovery, offline saves and reconnection, and signing back in. `test:server` exercises mail configuration and Brevo submission with a mocked provider; it does not send email. No CI workflow is currently included.

The active timer is recovered in the same browser/account; this change does not implement live timer takeover between devices. Existing server timer endpoints remain available for older clients.

### Launch configuration

Run `npm run check:launch` with Node 24 to check local configuration without printing secrets. Local settings do not prove that hosted settings match.

- In Render, set `CLIENT_URL=https://track-here.beta-001.workers.dev`, `BREVO_API_KEY`, and `MAIL_FROM_EMAIL`. The sender must be verified in Brevo. Redeploy the API after changing configuration. The live API reported an old Vercel client URL during the November 20, 2026 review.
- In the frontend build environment, set `VITE_SENTRY_DSN` and optionally `VITE_SENTRY_ENVIRONMENT=production`. Rebuild and redeploy the frontend; adding a runtime Worker secret after building does not configure Vite's client bundle. Error boundaries forward caught rendering failures to Sentry.
- Deploy both frontend and backend fixes. Password recovery now submits JSON objects and obtains a CSRF token; failed requests remain retryable instead of showing a false confirmation. Missing production mail configuration returns a generic service-unavailable response before looking up the email address. Provider failures are logged by status without exposing recipient details.
- Confirm delivery using an existing test account, follow its reset link on the Workers domain, and sign in with the new password. An HTTP success response alone does not establish inbox delivery. Check Brevo transactional logs and Render logs if delivery fails.
- Verify an error event in the intended Sentry project after deployment. A configured DSN alone does not establish event delivery.

Social previews use `client/public/social-preview.png` (1200 × 630) and the Workers URL in `client/index.html`. Update those URLs if the public domain changes. New students see a first-session guide until a saved session exists.

### Administrator access and localhost verification

Set `ADMIN_USER_IDS` on the API to the comma-separated MongoDB IDs of confirmed administrator accounts. Deployments previously using `ADMIN_EMAILS` must migrate to those IDs. Add each approved preview frontend origin to `CLIENT_URLS`. Set the API's `GOOGLE_CLIENT_ID` to the same web client ID used by the frontend.

With root, client and server dependencies installed, run `npm --prefix client run build`, then `npm run test:localhost`. The desktop check uses the built frontend, a loopback API and a disposable MongoDB instance. It requires Playwright Chromium and its FFmpeg binary, plus a MongoDB binary compatible with mongodb-memory-server. Set `MONGOMS_SYSTEM_BINARY` to use an existing MongoDB executable. The desktop video and results are written under `.qa-artifacts/`. The separate `npm run test:e2e` mobile recording uses API fixtures for offline and failure scenarios.
