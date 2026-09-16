import { Link } from 'react-router-dom';
import { ArrowLeft, Pill } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function PrivacyPage() {
  const { user } = useAuth();
  const backTo = user ? '/' : '/';
  const backLabel = user ? 'Back to tracker' : 'Back to home';

  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-slate-900">
      <header className="relative z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link to="/" className="flex items-center gap-3" aria-label="My Meds Record home">
            <span
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 via-brand-600 to-brand-800 text-white shadow-brand-sm"
              aria-hidden
            >
              <Pill className="h-5 w-5" strokeWidth={2.2} />
            </span>
            <span className="text-xl font-bold tracking-tight">My Meds Record</span>
          </Link>
          <Link
            to={backTo}
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:text-brand-900"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {backLabel}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-700">Privacy</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
          Privacy
        </h1>
        <p className="mt-3 text-sm text-slate-500">Last updated: 16 September 2026</p>

        <div className="mt-8 space-y-8 text-base leading-7 text-slate-700">
          <section>
            <h2 className="text-lg font-bold text-slate-950">Who this is for</h2>
            <p className="mt-2">
              My Meds Record is a personal record-keeping tool at{' '}
              <a className="font-semibold text-brand-700 hover:text-brand-900" href="https://mymedsrecord.co.uk/">
                mymedsrecord.co.uk
              </a>
              . It is not a medical device and it does not give medical advice. Always follow the
              instructions from your doctor, pharmacist or medication packaging.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-950">What we store</h2>
            <p className="mt-2">When you create an account we store:</p>
            <ul className="mt-3 list-disc space-y-1 pl-5">
              <li>Your email address and a hashed password (handled by Supabase Auth)</li>
              <li>Medications, schedules, time slots and related settings you enter</li>
              <li>Dose records (taken, not taken, and flexible doses)</li>
              <li>Notes, measurements and observations, including seizure logs if you add them</li>
            </ul>
            <p className="mt-3">
              We do not ask for your name, address or payment details. Preferences such as background
              colour are saved on this device only, not in your cloud account.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-950">Why we store it</h2>
            <p className="mt-2">
              We store this information so you can sign in and see your own medications and history
              on the devices you use. We do not sell your data, and we do not use it for advertising.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-950">Where it is kept</h2>
            <p className="mt-2">
              Account and records are stored in the Supabase project used by this app (hosted
              database and authentication). Your data is kept separate from other users with
              account-based access and row-level security.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-950">Who can see it</h2>
            <p className="mt-2">
              Only you can see your records when you are signed in. The person running this site can
              access the hosting platform for maintenance, backups and security. Do not share your
              password, and only use My Meds Record on devices you trust.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-950">How long we keep it</h2>
            <p className="mt-2">
              We keep your account and records until you delete them. You can download a copy of your
              data or delete your account at any time from Settings.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-950">Your choices</h2>
            <ul className="mt-3 list-disc space-y-1 pl-5">
              <li>
                <Link className="font-semibold text-brand-700 hover:text-brand-900" to="/settings">
                  Download all my data
                </Link>{' '}
                — a JSON file of the records stored for your account
              </li>
              <li>
                <Link className="font-semibold text-brand-700 hover:text-brand-900" to="/settings">
                  Delete account
                </Link>{' '}
                — permanently removes your login and the records stored with it
              </li>
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}
