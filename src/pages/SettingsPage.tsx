import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ListOrdered, Settings } from 'lucide-react';
import ManageTimeSlotsModal from '../components/ManageTimeSlotsModal';
import EndedCoursesSection from '../components/EndedCoursesSection';

export default function SettingsPage() {
  const [sessionsOpen, setSessionsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100/95">
      <div className="mx-auto max-w-2xl px-2 py-3 sm:px-4 sm:py-6">
        <header className="mb-6">
          <Link
            to="/"
            className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-brand-800 transition-colors hover:text-brand-950"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to tracker
          </Link>
          <div className="flex items-start gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-800 text-white shadow-brand-sm sm:h-12 sm:w-12"
              aria-hidden
            >
              <Settings className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Settings</h1>
              <p className="mt-1 text-sm text-slate-600">Configure how Medication Tracker works for you.</p>
            </div>
          </div>
        </header>

        <ul className="space-y-3">
          <li>
            <button
              type="button"
              onClick={() => setSessionsOpen(true)}
              className="flex w-full items-start gap-4 rounded-2xl border border-slate-200/90 bg-white p-4 text-left shadow-brand-sm ring-1 ring-slate-200/80 transition-colors hover:border-slate-300 hover:bg-slate-50/80"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <ListOrdered className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-slate-900">Sessions</div>
                <p className="mt-0.5 text-sm text-slate-600">
                  Name and order day tabs (Morning, Lunch, Evening, …), set which tab opens first by time of day, and
                  add or remove sessions.
                </p>
                <span className="mt-2 inline-block text-sm font-semibold text-brand-700">Configure →</span>
              </div>
            </button>
          </li>
          <EndedCoursesSection />
        </ul>
      </div>

      <ManageTimeSlotsModal
        isOpen={sessionsOpen}
        onClose={() => setSessionsOpen(false)}
        onSaved={() => {
          /* Tracker reloads slot list on next visit; optional: could broadcast a custom event */
        }}
      />
    </div>
  );
}
