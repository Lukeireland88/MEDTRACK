# Medication Tracker

A responsive web application for tracking daily medications with smart scheduling, built with React, TypeScript, Tailwind CSS, and Supabase.

## Features

- **Date Navigation**: Navigate through dates with prev/next buttons and date picker
- **Time-of-Day Tracking**: Organize medications by Morning, Lunch, Evening, and Night
- **Smart Scheduling**: Supports multiple schedule types:
  - Daily medications
  - Specific days of the week (e.g., Mon/Wed/Fri)
  - Every N days from a start date
- **Multiple Time Slots**: Highlights medications that appear in multiple time slots
- **Visual Indicators**:
  - Grey out medications not due on the selected date
  - Show remaining count of unchecked medications
  - Display notices for special medications (Ferrous, Azithromycin)
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Tech Stack

- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Supabase for database and backend
- Lucide React for icons

## Prerequisites

- Node.js 16+ and npm
- A Supabase account and project

## Setup Instructions

### 1. Clone and Install

```bash
npm install
```

### 2. Environment Variables

The `.env` file is already configured with Supabase credentials. The database includes:

- 4 time slots: Morning, Lunch, Evening, Night
- 12+ medications with various schedules
- Proper Row Level Security (RLS) policies

### 3. Database Schema

The database includes the following tables:

- `time_slots`: Time periods for medication (Morning, Lunch, Evening, Night)
- `medications`: Medication details and schedule rules
- `medication_slots`: Join table linking medications to time slots
- `doses_taken`: Optional tracking of which doses have been taken

All migrations have been applied automatically.

### 4. Run the Application

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### 5. Build for Production

```bash
npm run build
```

## Usage

### Date Selection

- Use the **◀** and **▶** buttons to navigate between dates
- Click the date input to select a specific date
- Click **Today** to jump to the current date

### Time Slot Selection

- Click the "Showing: [time]" dropdown to see all time slots
- Select Morning, Lunch, Evening, or Night
- The default time slot is determined by the current time:
  - Before 12 PM: Morning
  - 12 PM - 3 PM: Lunch
  - 3 PM - 7 PM: Evening
  - After 7 PM: Night

### Tracking Medications

- Check the box next to a medication to mark it as taken
- The remaining count updates automatically
- Medications highlighted in yellow appear in multiple time slots
- Greyed out medications are not due on the selected date

### Special Schedules

- **Azithromycin**: Only due on Monday, Wednesday, and Friday
- **Ferrous Fumarate**: Due every other day starting from Sept 18, 2025

When these medications are not due (and Morning is selected), a notice appears showing the next due date.

## Project Structure

```
src/
├── components/
│   ├── DateNav.tsx          # Date navigation controls
│   ├── TimeSlotPicker.tsx   # Time slot selector
│   ├── MedTable.tsx          # Medication table and status
│   └── Notices.tsx           # Special medication notices
├── lib/
│   └── supabase.ts           # Supabase client
├── types/
│   └── index.ts              # TypeScript type definitions
├── utils/
│   ├── dateUtils.ts          # Date handling utilities
│   └── scheduleUtils.ts      # Medication scheduling logic
├── App.tsx                   # Main application component
└── main.tsx                  # Application entry point
```

## Database Schema

### time_slots
- `id`: UUID primary key
- `name`: Text (Morning, Lunch, Evening, Night)
- `sort_order`: Integer for ordering

### medications
- `id`: UUID primary key
- `name`: Text (medication name)
- `when_text`: Text (display text like "Daily" or "Mon/Wed/Fri")
- `schedule_type`: Text (daily, days_of_week, every_n_days_from_start)
- `days_of_week`: Integer array (1=Mon, 7=Sun)
- `start_date`: Date (for interval-based schedules)
- `interval_days`: Integer (for interval-based schedules)
- `active`: Boolean

### medication_slots
- `id`: UUID primary key
- `medication_id`: UUID foreign key
- `time_slot_id`: UUID foreign key

### doses_taken
- `id`: UUID primary key
- `medication_id`: UUID foreign key
- `time_slot_id`: UUID foreign key
- `dose_date`: Date
- `taken`: Boolean
- `taken_at`: Timestamp

## Customization

### Adding New Medications

Medications are stored in Supabase. To add new medications, insert records into the `medications` table and link them to time slots via `medication_slots`.

### Modifying Schedules

Schedule types:
- `daily`: Medication is due every day
- `days_of_week`: Due on specific days (1=Monday, 7=Sunday)
- `every_n_days_from_start`: Due every N days from a start date

## License

MIT
