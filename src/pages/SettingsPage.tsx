import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Archive, ArrowLeft, Hand, ListOrdered, Lock, Paintbrush, Pill, Settings } from 'lucide-react';
import ManageTimeSlotsModal from '../components/ManageTimeSlotsModal';
import EndedCoursesModal from '../components/EndedCoursesModal';
import AllMedicationsModal from '../components/AllMedicationsModal';
import AuthModal from '../components/AuthModal';
import { useAuth } from '../contexts/AuthContext';
import {
  DEFAULT_BACKGROUND_COLOR,
  usePageBackgroundProps,
  usePreferences,
  type Handedness,
} from '../contexts/PreferencesContext';

const BACKGROUND_PRESETS = [
  { label: 'Default', value: DEFAULT_BACKGROUND_COLOR },
  { label: 'Sky', value: '#e0f2fe' },
  { label: 'Mint', value: '#dcfce7' },
  { label: 'Lavender', value: '#ede9fe' },
  { label: 'Blush', value: '#ffe4e6' },
  { label: 'Sand', value: '#fef3c7' },
] as const;

type AuthModalMode = 'signin' | 'updatePassword';

export default function SettingsPage() {
  const { user } = useAuth();
  const { handedness, setHandedness, backgroundColor, setBackgroundColor, resetBackgroundColor } =
    usePreferences();
  const pageBg = usePageBackgroundProps();
  const [sessionsOpen, setSessionsOpen] = useState(false);
  const [endedCoursesOpen, setEndedCoursesOpen] = useState(false);
  const [allMedsOpen, setAllMedsOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<AuthModalMode>('signin');

  const openSignIn = () => {
    setAuthModalMode('signin');
    setAuthModalOpen(true);
  };

  const openChangePassword = () => {
    setAuthModalMode('updatePassword');
    setAuthModalOpen(true);
  };

  const selectHandedness = (value: Handedness) => {
    setHandedness(value);
  };

  return (
    <div className={pageBg.className} style={pageBg.style}>
      <div className="mx-auto max-w-2xl px-2 py-3 sm:px-4 sm:py-6">
        <header className="mb-6">
          <Link
            to="/"
            className="app-page-link mb-3 inline-flex items-center gap-2 text-sm font-semibold transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to tracker
          </Link>
          <div className="flex items-start gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 via-brand-600 to-brand-800 text-white shadow-brand-sm sm:h-12 sm:w-12"
              aria-hidden
            >
              <Settings className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <h1 className="app-page-title text-2xl font-bold tracking-tight sm:text-3xl">Settings</h1>
              <p className="app-page-muted mt-1 text-sm">Configure how Medtrack works for you.</p>
            </div>
          </div>
        </header>

        <ul className="space-y-3">
          <li>
            {user ? (
              <button
                type="button"
                onClick={openChangePassword}
                className="flex w-full items-start gap-4 rounded-2xl surface-glass-interactive p-4 text-left"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  <Lock className="h-5 w-5" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-slate-900">Account</div>
                  <p className="mt-0.5 text-sm text-slate-600">
                    Signed in as {user.email}. Change the password for this account.
                  </p>
                  <span className="mt-2 inline-block text-sm font-semibold text-brand-700">
                    Change password →
                  </span>
                </div>
              </button>
            ) : (
              <button
                type="button"
                onClick={openSignIn}
                className="flex w-full items-start gap-4 rounded-2xl surface-glass-interactive p-4 text-left"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  <Lock className="h-5 w-5" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-slate-900">Account</div>
                  <p className="mt-0.5 text-sm text-slate-600">
                    Sign in to change your password and sync medications across devices.
                  </p>
                  <span className="mt-2 inline-block text-sm font-semibold text-brand-700">
                    Sign in →
                  </span>
                </div>
              </button>
            )}
          </li>
          <li>
            <div className="rounded-2xl surface-glass p-4">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100/80 text-slate-700">
                  <Hand className="h-5 w-5" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-slate-900">Handedness</div>
                  <p className="mt-0.5 text-sm text-slate-600">
                    Put checkboxes and Log dose on your preferred side. Actions move to the other side.
                  </p>
                  <div
                    className="mt-3 grid grid-cols-2 gap-2"
                    role="radiogroup"
                    aria-label="Handedness"
                  >
                    <button
                      type="button"
                      role="radio"
                      aria-checked={handedness === 'left'}
                      onClick={() => selectHandedness('left')}
                      className={`rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
                        handedness === 'left'
                          ? 'border-brand-600 bg-brand-50 text-brand-900 ring-1 ring-brand-600'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      Left-handed
                      <span className="mt-0.5 block text-xs font-normal text-slate-500">
                        Controls on left
                      </span>
                    </button>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={handedness === 'right'}
                      onClick={() => selectHandedness('right')}
                      className={`rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
                        handedness === 'right'
                          ? 'border-brand-600 bg-brand-50 text-brand-900 ring-1 ring-brand-600'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      Right-handed
                      <span className="mt-0.5 block text-xs font-normal text-slate-500">
                        Controls on right
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </li>
          <li>
            <div className="rounded-2xl surface-glass p-4">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100/80 text-slate-700">
                  <Paintbrush className="h-5 w-5" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-slate-900">Background colour</div>
                  <p className="mt-0.5 text-sm text-slate-600">
                    Choose a page background. Primary buttons (Add, Save, Log dose) follow this colour. Saved for your
                    account on this device.
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                      <span
                        className="relative h-9 w-9 overflow-hidden rounded-lg border border-slate-200 shadow-sm"
                        style={{ backgroundColor }}
                        aria-hidden
                      >
                        <input
                          type="color"
                          value={backgroundColor}
                          onChange={(e) => setBackgroundColor(e.target.value)}
                          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                          aria-label="Pick background colour"
                        />
                      </span>
                      Custom
                    </label>
                    <span className="font-mono text-xs text-slate-500">{backgroundColor}</span>
                    {backgroundColor !== DEFAULT_BACKGROUND_COLOR && (
                      <button
                        type="button"
                        onClick={resetBackgroundColor}
                        className="text-sm font-semibold text-brand-700 hover:text-brand-900"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2" role="list" aria-label="Colour presets">
                    {BACKGROUND_PRESETS.map((preset) => {
                      const selected = backgroundColor === preset.value;
                      return (
                        <button
                          key={preset.value}
                          type="button"
                          title={preset.label}
                          aria-label={preset.label}
                          aria-pressed={selected}
                          onClick={() => setBackgroundColor(preset.value)}
                          className={`h-8 w-8 rounded-full border-2 shadow-sm transition-transform hover:scale-105 ${
                            selected ? 'border-slate-900 ring-2 ring-brand-500 ring-offset-1' : 'border-white'
                          }`}
                          style={{ backgroundColor: preset.value }}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </li>
          <li>
            <button
              type="button"
              onClick={() => (user ? setSessionsOpen(true) : openSignIn())}
              className="flex w-full items-start gap-4 rounded-2xl surface-glass-interactive p-4 text-left"
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
                <span className="mt-2 inline-block text-sm font-semibold text-brand-700">
                  {user ? 'Manage sessions →' : 'Sign in to manage →'}
                </span>
              </div>
            </button>
          </li>
          <li>
            <button
              type="button"
              onClick={() => (user ? setAllMedsOpen(true) : openSignIn())}
              className="flex w-full items-start gap-4 rounded-2xl surface-glass-interactive p-4 text-left"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <Pill className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-slate-900">All medications</div>
                <p className="mt-0.5 text-sm text-slate-600">
                  Browse and edit your full medication list.
                </p>
                <span className="mt-2 inline-block text-sm font-semibold text-brand-700">
                  {user ? 'Browse / edit →' : 'Sign in to browse →'}
                </span>
              </div>
            </button>
          </li>
          {user ? (
            <li>
              <button
                type="button"
                onClick={() => setEndedCoursesOpen(true)}
                className="flex w-full items-start gap-4 rounded-2xl surface-glass-interactive p-4 text-left"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  <Archive className="h-5 w-5" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-slate-900">Ended courses</div>
                  <p className="mt-0.5 text-sm text-slate-600">
                    Restart rescue meds or past antibiotic courses, or edit medications that are past their end date.
                  </p>
                  <span className="mt-2 inline-block text-sm font-semibold text-brand-700">
                    Open ended courses →
                  </span>
                </div>
              </button>
            </li>
          ) : (
            <li>
              <button
                type="button"
                onClick={openSignIn}
                className="w-full rounded-2xl border border-slate-200/90 bg-slate-50/80 p-4 text-left text-sm text-slate-600 hover:bg-slate-100/80"
              >
                Sign in to manage ended courses.
              </button>
            </li>
          )}
        </ul>
      </div>

      <ManageTimeSlotsModal
        isOpen={sessionsOpen}
        onClose={() => setSessionsOpen(false)}
        onSaved={() => {
          /* Tracker reloads slot list on next visit; optional: could broadcast a custom event */
        }}
      />
      <EndedCoursesModal isOpen={endedCoursesOpen} onClose={() => setEndedCoursesOpen(false)} />
      <AllMedicationsModal
        isOpen={allMedsOpen}
        onClose={() => setAllMedsOpen(false)}
        signedIn={Boolean(user)}
        onRequireSignIn={openSignIn}
      />
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
      />
    </div>
  );
}
