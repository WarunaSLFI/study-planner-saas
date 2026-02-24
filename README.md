# Study Planner SaaS

A full-stack, production-ready SaaS application that helps students manage subjects, track assignments, and stay on top of deadlines — built with modern web technologies and deployed to the cloud.

**Live Demo:** [https://study-planner-saas.vercel.app](https://study-planner-saas.vercel.app)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, React Server Components) |
| Language | TypeScript 5 (strict mode) |
| UI | React 19 + Tailwind CSS v4 |
| Auth & Database | Supabase (PostgreSQL + Auth) |
| Deployment | Vercel |
| Analytics | Vercel Analytics |

---

## Features

### Assignment & Subject Management
- Full CRUD for subjects and assignments with real-time cloud sync via Supabase
- Advanced filtering — search by title/subject/code, filter by status (overdue, due soon, upcoming), sort by due date or recency
- Smart bulk import — paste raw text from a university portal and the app parses subjects and assignments automatically, using a **Levenshtein distance algorithm** for fuzzy subject matching and conflict detection

### Dashboard & Notifications
- Overview dashboard with live stats (total, upcoming, due soon, overdue, completed)
- Color-coded status badges with automatic status calculation based on due date proximity
- Browser push notifications for assignments due within 3 days — tracks notified items in `localStorage` to avoid repeat alerts
- Dynamic browser tab badge showing live overdue count

### Authentication
- Email/password sign-up and sign-in with Supabase Auth
- Email verification flow with resend support
- Password reset via email link
- Email change with Supabase verification flow
- Route protection via Next.js middleware — unauthenticated users are redirected to `/login`

### Data Portability
- Export all data as a timestamped JSON backup file
- Import from a JSON file or pasted text — validates structure, remaps IDs, and handles legacy field names
- Full account reset with typed confirmation (`RESET`) guard

### User Preferences
- Persisted settings via `localStorage`: default sort order, date format, hide completed toggle, week start day
- Auto-save with visual confirmation feedback

### API Layer
- `GET /api/export` — authenticated, rate-limited data export endpoint
- `POST /api/import` — authenticated, rate-limited import with full validation
- `GET /api/health` — service health check
- IP-based in-memory rate limiting across all endpoints

---

## Architecture

```
src/
├── app/
│   ├── (marketing)/          # Public landing page
│   ├── login/                # Auth pages (sign-in, sign-up)
│   ├── forgot-password/      # Password reset request
│   ├── reset-password/       # Password reset form
│   ├── auth/callback/        # Supabase OAuth & email callback handler
│   ├── api/
│   │   ├── export/           # Authenticated data export endpoint
│   │   ├── import/           # Authenticated data import endpoint
│   │   └── health/           # Health check
│   └── app/                  # Protected app shell
│       ├── dashboard/        # Stats overview + assignment list
│       ├── courses/          # Subject management + bulk import
│       ├── tasks/            # Assignment management + bulk import
│       ├── settings/         # Preferences, backup, account reset
│       └── providers/
│           ├── AppDataProvider.tsx     # Global state + Supabase CRUD
│           └── NotificationProvider.tsx # Browser notification logic
├── components/
│   ├── Header.tsx            # Top nav, user menu, edit profile modal
│   ├── Sidebar.tsx           # Desktop navigation, version display
│   ├── AssignmentModal.tsx   # Create/edit assignment form
│   ├── AssignmentsTable.tsx  # Filterable assignment table
│   ├── ConfirmDialog.tsx     # Reusable confirmation modal
│   └── StatCard.tsx          # Dashboard metric cards
└── lib/
    ├── assignmentStatus.ts   # Status logic (Overdue / Due Soon / Upcoming)
    ├── parseAssignments.ts   # Smart assignment text parser
    ├── parseSubjects.ts      # Smart subject text parser
    ├── rateLimit.ts          # IP-based rate limiter
    └── supabase/             # Client, server, and middleware helpers
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project

### Installation

```bash
git clone https://github.com/WarunaSLFI/study-planner-saas.git
cd study-planner-saas
npm install
```

### Environment Variables

Create a `.env.local` file in the root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Database Schema

The app uses two core tables in Supabase (PostgreSQL), both scoped to `user_id` for data isolation:

**`subjects`**
| Column | Type |
|---|---|
| id | uuid (PK) |
| user_id | uuid (FK → auth.users) |
| subject_name | text |
| subject_code | text |
| created_at | timestamptz |

**`assignments`**
| Column | Type |
|---|---|
| id | uuid (PK) |
| user_id | uuid (FK → auth.users) |
| subject_id | uuid (FK → subjects) |
| title | text |
| due_date | date |
| is_completed | boolean |
| score | text |
| created_at | timestamptz |

---

## Key Technical Decisions

**Next.js App Router** — Leverages React Server Components for fast initial loads, with client components used only where interactivity is needed.

**Supabase SSR** — Uses `@supabase/ssr` for proper server-side session management via cookies, avoiding hydration issues common with client-only auth.

**Context API for State** — `AppDataProvider` manages all subject and assignment state globally, keeping Supabase calls centralized and components thin.

**Fuzzy Matching on Bulk Import** — The Levenshtein distance algorithm prevents near-duplicate subjects (e.g., `COMP101` vs `COMP 101`) from being imported twice, with a manual resolution UI for ambiguous cases.

**Rate Limiting** — API endpoints use an in-memory IP-based rate limiter to prevent abuse without requiring an external service.

---

## Version

Current version: **v3.7.6**

---

## License

MIT
