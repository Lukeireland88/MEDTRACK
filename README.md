# Medication Tracker

A responsive web app for tracking daily medications with smart scheduling. Built with React, TypeScript, Tailwind CSS, Vite, and Supabase (database and authentication).

## Features

- **Authentication**: Sign up and sign in with Supabase Auth (email/password). Data is scoped per user via Row Level Security.
- **Daily tracker** (`/`): Pick a date and time-of-day slot; check off doses and see what is still due.
- **Date navigation**: Previous/next day, date picker, and jump to today.
- **Time-of-day slots**: Morning, Lunch, Evening, and Night (only slots that exist in your data are offered). Default slot follows the current time.
- **Scheduling**:
  - Daily
  - Specific days of the week (e.g. Mon/Wed/Fri)
  - Every *N* days from a start date
- **Dosing modes**:
  - **Time slots**: Medications tied to one or more slots; supports multiple slots per med (highlighted when relevant).
  - **Flexible daily**: Target doses per day with optional per-dose timestamps (`LogDoseTimeModal`).
- **Medication management**: Add and edit medications and their slot assignments (`AddMedicationModal`).
- **Per-medication history**: View dose events and check/uncheck logs for a single medication (`MedicationHistoryModal`).
- **History report** (`/history`): Filter by date range and medication; combines slot-based logs and flexible-dose events.
- **Visual cues**: Grey out meds not due on the selected date; show remaining unchecked count; notices for configured special cases (e.g. Ferrous, Azithromycin).
- **Deploy-friendly**: If `VITE_SUPABASE_*` is missing at build time, the app still loads and shows a banner instead of a blank screen.

## Tech stack

- React 18 and TypeScript
- Vite
- React Router
- Tailwind CSS
- Supabase (Postgres, Auth)
- Lucide React (icons)

## Prerequisites

- Node.js 18+ recommended (16+ may work)
- npm
- A [Supabase](https://supabase.com/) project with tables and RLS aligned to this app (see schema below)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Create a `.env` or `.env.local` in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Never commit real keys. For CI/CD (e.g. GitHub Actions), set the same variables as secrets and inject them at build time.

### 3. Run locally

```bash
npm run dev
```

Open the URL shown in the terminal (default [http://localhost:5173](http://localhost:5173)).

### 4. Other scripts

| Command | Description |
|--------|-------------|
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check (no emit) |

If `npm run build` errors on a missing `vite-plugin-pwa` package, install it (`npm install -D vite-plugin-pwa`) or remove the PWA plugin block from `vite.config.ts`.

## Usage

### Tracker (`/`)

- Use **◀** / **▶** or the date field to change day; use **Today** for the current date.
- Open **Showing: [time]** to change the active time slot.
- Check medications to mark them taken; counts update automatically.
- Sign in from the header when you want cloud sync; sign out when finished.

### History report (`/history`)

- Set **From** / **To** and optionally a medication.
- Load the report to see unified rows from slot-based logging and flexible dose events.

## Project structure

```
src/
├── components/
│   ├── AddMedicationModal.tsx
│   ├── AuthModal.tsx
│   ├── DateNav.tsx
│   ├── LogDoseTimeModal.tsx
│   ├── MedicationHistoryModal.tsx
│   ├── MedTable.tsx
│   ├── Notices.tsx
│   └── TimeSlotPicker.tsx
├── contexts/
│   └── AuthContext.tsx
├── lib/
│   └── supabase.ts
├── pages/
│   ├── HistoryReportPage.tsx
│   └── TrackerPage.tsx
├── types/
│   └── index.ts
├── utils/
│   ├── dateUtils.ts
│   └── scheduleUtils.ts
├── App.tsx
└── main.tsx
```

## Database (Supabase)

The app expects tables including:

| Table | Role |
|-------|------|
| `time_slots` | Morning / Lunch / Evening / Night (with sort order) |
| `medications` | Name, schedule fields, `active`, `dosing_mode` (`time_slots` \| `flexible_daily`), `target_doses_per_day`, optional `notes` / `end_date` |
| `medication_slots` | Links medications to time slots |
| `doses_taken` | Slot-based taken state per med, slot, and date |
| `medication_logs` | Audit log for check/uncheck actions on slot-based doses |
| `medication_dose_events` | Flexible-mode doses with `taken_at`, `dose_date`, `amount` |

Configure Row Level Security so each user only sees their own rows (policies depend on how you store `user_id` on rows).

### Schedule fields (`medications`)

- `schedule_type`: `daily` | `days_of_week` | `every_n_days_from_start`
- `days_of_week`: integers 1–7 (1 = Monday, 7 = Sunday) when using `days_of_week`
- `start_date` / `interval_days`: for `every_n_days_from_start`

### Customization

Add or change medications in Supabase: insert/update `medications`, then link rows in `medication_slots` for time-slot meds.

## License

MIT
