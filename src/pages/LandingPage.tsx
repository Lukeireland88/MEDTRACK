import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  Download,
  FileClock,
  LockKeyhole,
  Pill,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import Button from '../components/ui/Button';

interface LandingPageProps {
  onSignIn: () => void;
  onCreateAccount: () => void;
}

const featureCards = [
  {
    icon: CalendarDays,
    title: 'Your day at a glance',
    description:
      'See what is due morning, lunchtime, evening or night, and mark each dose as taken.',
  },
  {
    icon: Clock3,
    title: 'Schedules that fit real life',
    description:
      'Set regular time slots, selected days, repeating courses or flexible daily doses.',
  },
  {
    icon: FileClock,
    title: 'A clear history',
    description:
      'Look back at medication activity, notes and observations when you need the full picture.',
  },
];

export default function LandingPage({ onSignIn, onCreateAccount }: LandingPageProps) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-slate-900">
      <header className="relative z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <a href="#top" className="flex items-center gap-3" aria-label="My Meds Record home">
            <span
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 via-brand-600 to-brand-800 text-white shadow-brand-sm"
              aria-hidden
            >
              <Pill className="h-5 w-5" strokeWidth={2.2} />
            </span>
            <span className="text-xl font-bold tracking-tight">My Meds Record</span>
          </a>

          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={onSignIn} className="px-3 sm:px-4">
              Sign in
            </Button>
            <Button onClick={onCreateAccount} className="hidden sm:inline-flex">
              Create account
            </Button>
          </div>
        </div>
      </header>

      <main id="top">
        <section className="relative isolate overflow-hidden">
          <div
            className="absolute inset-x-0 top-0 -z-10 h-[46rem] bg-gradient-to-b from-brand-50 via-sky-50/70 to-white"
            aria-hidden
          />
          <div
            className="absolute -right-36 top-24 -z-10 h-80 w-80 rounded-full bg-brand-200/45 blur-3xl"
            aria-hidden
          />
          <div
            className="absolute -left-36 top-72 -z-10 h-72 w-72 rounded-full bg-cyan-100/70 blur-3xl"
            aria-hidden
          />

          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-16 sm:px-6 sm:pt-24 lg:grid-cols-[1.02fr_0.98fr] lg:px-8 lg:pb-28 lg:pt-28">
            <div className="max-w-2xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/80 px-3 py-1.5 text-sm font-semibold text-brand-800 shadow-sm">
                <Sparkles className="h-4 w-4" aria-hidden />
                Simple medication tracking
              </div>
              <h1 className="text-4xl font-bold leading-[1.08] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                A calmer way to organise and record your medication.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600 sm:text-xl">
                Organise your daily medication, record each dose and keep a useful history—all in
                one clear, straightforward place.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button onClick={onCreateAccount} className="px-6 py-3.5 text-base shadow-brand">
                  Create a free account
                  <ArrowRight className="h-5 w-5" aria-hidden />
                </Button>
                <Button variant="secondary" onClick={onSignIn} className="px-6 py-3.5 text-base">
                  I already have an account
                </Button>
              </div>

              <p className="mt-5 flex items-center gap-2 text-sm text-slate-500">
                <LockKeyhole className="h-4 w-4 text-brand-600" aria-hidden />
                Your medications and logs are private to your account.
              </p>
            </div>

            <div className="relative mx-auto w-full max-w-lg lg:mx-0 lg:ml-auto">
              <div className="absolute inset-8 -z-10 rounded-[2rem] bg-brand-400/20 blur-3xl" aria-hidden />
              <div className="rounded-[1.75rem] border border-white/90 bg-white/80 p-3 shadow-2xl shadow-brand-900/10 ring-1 ring-slate-200/70 backdrop-blur sm:p-5">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
                  <div className="flex items-center justify-between gap-3 px-1 pb-4">
                    <h2 className="text-xl font-bold tracking-tight text-slate-950">
                      Today's medications
                    </h2>
                    <div className="rounded-xl bg-brand-600 p-2 text-white shadow-brand-sm">
                      <Pill className="h-5 w-5" aria-hidden />
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-t-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800">
                    <span>Showing: Morning</span>
                    <ChevronDown className="h-4 w-4 text-slate-500" aria-hidden />
                  </div>

                  <div className="space-y-2 rounded-b-xl border-x border-b border-slate-200 bg-white/60 p-2">
                    <MedicationPreview name="Morning tablet" detail="Daily" status="taken" />
                    <MedicationPreview name="Vitamin supplement" detail="Daily" status="pending" />
                    <MedicationPreview name="Daily medication" detail="Daily" status="notTaken" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="border-y border-slate-200 bg-slate-50/80 py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-700">
                Clear by design
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Everything you need, without the clutter
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-600">
                My Meds Record is designed to make everyday recording quick and looking back easy.
              </p>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {featureCards.map(({ icon: Icon, title, description }) => (
                <article
                  key={title}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
                    <Icon className="h-6 w-6" aria-hidden />
                  </span>
                  <h3 className="mt-5 text-lg font-bold text-slate-950">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 sm:py-24">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-700">
                More than a tick list
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Keep the useful details together
              </h2>
              <p className="mt-5 text-lg leading-8 text-slate-600">
                Add notes and observations alongside your medication activity, then use the history
                view when you want to look back over a particular period.
              </p>

              <ul className="mt-7 space-y-4 text-slate-700">
                <Benefit>Record taken and not-taken doses</Benefit>
                <Benefit>Log notes, measurements and observations</Benefit>
                <Benefit>Review and export a filtered history</Benefit>
                <Benefit>Use it comfortably on phone, tablet or computer</Benefit>
              </ul>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-2xl shadow-slate-900/10 sm:p-6">
              <div className="flex items-center gap-3 px-1">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
                  <FileClock className="h-6 w-6" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">History</p>
                  <h3 className="font-bold text-slate-950">History report</h3>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2 text-xs font-semibold text-slate-700">
                <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">Last 7 days</div>
                <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">All events</div>
              </div>

              <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-3 py-2">
                  <span className="text-xs text-slate-600">3 events</span>
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800">
                    <Download className="h-3.5 w-3.5" aria-hidden />
                    Export CSV
                  </span>
                </div>
                <div className="divide-y divide-slate-100">
                  <HistoryPreviewRow time="Today, 8:05 AM" name="Morning tablet" status="Taken" tone="green" />
                  <HistoryPreviewRow time="Yesterday, 8:10 PM" name="Daily medication" status="Not taken" tone="rose" />
                  <HistoryPreviewRow time="Yesterday, 3:15 PM" name="General note" status="Note" tone="amber" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="privacy" className="px-4 pb-20 sm:px-6 sm:pb-24 lg:px-8">
          <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl bg-brand-700 shadow-xl shadow-brand-900/15">
            <div className="grid gap-8 px-6 py-10 text-white sm:px-10 sm:py-12 lg:grid-cols-[auto_1fr] lg:items-center lg:px-14">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
                <ShieldCheck className="h-8 w-8" aria-hidden />
              </span>
              <div>
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Your account, your records
                </h2>
                <p className="mt-3 max-w-3xl leading-7 text-brand-100">
                  My Meds Record uses account-based access so your medication and tracking records are
                  kept separate from other users. Never share your password, and only use My Meds Record
                  on devices you trust.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-slate-950 py-20 text-white sm:py-24">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ready for a clearer view of your medication?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-300">
              Create your account and set up your first medication in just a few minutes.
            </p>
            <Button onClick={onCreateAccount} className="mt-8 px-7 py-3.5 text-base">
              Get started
              <ArrowRight className="h-5 w-5" aria-hidden />
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-8 text-sm text-slate-500 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div className="flex items-center gap-2 font-semibold text-slate-700">
            <Pill className="h-4 w-4 text-brand-600" aria-hidden />
            My Meds Record
          </div>
          <p className="max-w-2xl leading-6 md:text-right">
            My Meds Record is a personal record-keeping tool, not medical advice. Always follow the
            instructions provided by your doctor, pharmacist or medication packaging.
          </p>
        </div>
      </footer>
    </div>
  );
}

function MedicationPreview({
  name,
  detail,
  status,
}: {
  name: string;
  detail: string;
  status: 'taken' | 'pending' | 'notTaken';
}) {
  const taken = status === 'taken';
  const notTaken = status === 'notTaken';

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border p-3 shadow-sm ${
        taken
          ? 'border-emerald-200 bg-emerald-50'
          : notTaken
            ? 'border-rose-200 bg-rose-50'
            : 'border-slate-200 bg-white'
      }`}
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600"
      >
        <Pill className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block truncate text-sm font-bold ${taken ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
          {name}
        </span>
        <span className="block text-xs text-slate-500">{detail}</span>
      </span>
      <span className={`inline-flex min-h-8 w-[5.75rem] overflow-hidden rounded-md border text-xs font-semibold ${
        taken
          ? 'border-emerald-600 bg-emerald-600 text-white'
          : notTaken
            ? 'border-rose-400 bg-rose-50 text-rose-800'
            : 'border-slate-300 bg-white text-slate-700'
      }`}>
        <span className="flex flex-1 items-center justify-center px-1.5">
          {taken ? <Check className="h-4 w-4" strokeWidth={2.5} /> : notTaken ? <X className="h-4 w-4" strokeWidth={2.5} /> : 'Log dose'}
        </span>
        <span className={`flex w-7 items-center justify-center border-l ${taken ? 'border-emerald-500' : notTaken ? 'border-rose-300' : 'border-slate-200'}`}>
          <ChevronDown className="h-3.5 w-3.5" />
        </span>
      </span>
    </div>
  );
}

function Benefit({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
        <Check className="h-4 w-4" strokeWidth={3} aria-hidden />
      </span>
      <span>{children}</span>
    </li>
  );
}

function HistoryPreviewRow({
  time,
  name,
  status,
  tone,
}: {
  time: string;
  name: string;
  status: string;
  tone: 'green' | 'rose' | 'amber';
}) {
  const toneClasses = {
    green: 'bg-emerald-100 text-emerald-800',
    rose: 'bg-rose-100 text-rose-800',
    amber: 'bg-amber-100 text-amber-800',
  };

  return (
    <div className="flex items-center gap-3 px-3 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-900">{name}</p>
        <p className="mt-0.5 text-xs text-slate-500">{time}</p>
      </div>
      <span className={`rounded-full px-2 py-1 text-[11px] font-bold ${toneClasses[tone]}`}>
        {status}
      </span>
    </div>
  );
}
