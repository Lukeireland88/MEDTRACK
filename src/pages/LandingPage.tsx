import {
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
  FileClock,
  LockKeyhole,
  NotebookPen,
  Pill,
  ShieldCheck,
  Sparkles,
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
          <a href="#top" className="flex items-center gap-3" aria-label="Medtrack home">
            <span
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 via-brand-600 to-brand-800 text-white shadow-brand-sm"
              aria-hidden
            >
              <Pill className="h-5 w-5" strokeWidth={2.2} />
            </span>
            <span className="text-xl font-bold tracking-tight">Medtrack</span>
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
                A calmer way to keep track of your medication.
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
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">
                        Today
                      </p>
                      <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                        Morning medications
                      </h2>
                    </div>
                    <div className="rounded-xl bg-brand-600 p-2 text-white shadow-brand-sm">
                      <Pill className="h-5 w-5" aria-hidden />
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    <MedicationPreview name="Morning tablet" detail="1 tablet" checked />
                    <MedicationPreview name="Vitamin supplement" detail="1 capsule" checked />
                    <MedicationPreview name="Daily medication" detail="2 tablets" />
                  </div>

                  <div className="mt-4 flex items-center justify-between rounded-xl border border-brand-100 bg-brand-50 px-4 py-3">
                    <div>
                      <p className="text-xs font-semibold text-brand-800">Morning progress</p>
                      <p className="mt-0.5 text-sm font-bold text-brand-950">2 of 3 recorded</p>
                    </div>
                    <div className="relative h-12 w-12 rounded-full bg-white shadow-sm ring-1 ring-brand-100">
                      <div className="absolute inset-2 rounded-full border-4 border-brand-200 border-r-brand-600 border-t-brand-600" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-7 -left-2 hidden items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-xl shadow-slate-900/10 sm:flex lg:-left-12">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <Check className="h-5 w-5" strokeWidth={3} aria-hidden />
                </span>
                <div>
                  <p className="text-xs font-medium text-slate-500">Dose recorded</p>
                  <p className="text-sm font-bold text-slate-900">History updated</p>
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
                Medtrack is designed to make everyday recording quick and looking back easy.
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

            <div className="rounded-3xl bg-slate-950 p-6 text-white shadow-2xl shadow-slate-900/20 sm:p-8">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-brand-200">
                  <NotebookPen className="h-6 w-6" aria-hidden />
                </span>
                <div>
                  <p className="text-sm text-slate-400">History</p>
                  <h3 className="font-bold">A useful timeline</h3>
                </div>
              </div>

              <div className="mt-7 space-y-5 border-l border-slate-700 pl-6">
                <TimelineItem time="8:05 AM" title="Morning medication recorded" tone="green" />
                <TimelineItem time="12:30 PM" title="Lunchtime dose recorded" tone="blue" />
                <TimelineItem time="3:15 PM" title="Observation added" tone="violet" />
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
                  Medtrack uses account-based access so your medication and tracking records are
                  kept separate from other users. Never share your password, and only use Medtrack
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
            Medtrack
          </div>
          <p className="max-w-2xl leading-6 md:text-right">
            Medtrack is a personal record-keeping tool, not medical advice. Always follow the
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
  checked = false,
}: {
  name: string;
  detail: string;
  checked?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
          checked ? 'bg-emerald-100 text-emerald-700' : 'bg-brand-100 text-brand-700'
        }`}
      >
        {checked ? <Check className="h-5 w-5" strokeWidth={3} /> : <Pill className="h-5 w-5" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold text-slate-900">{name}</span>
        <span className="block text-xs text-slate-500">{detail}</span>
      </span>
      <span
        className={`h-6 w-6 rounded-full border-2 ${
          checked ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300 bg-white'
        }`}
        aria-hidden
      />
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

function TimelineItem({
  time,
  title,
  tone,
}: {
  time: string;
  title: string;
  tone: 'green' | 'blue' | 'violet';
}) {
  const toneClasses = {
    green: 'bg-emerald-400 ring-emerald-400/20',
    blue: 'bg-brand-400 ring-brand-400/20',
    violet: 'bg-violet-400 ring-violet-400/20',
  };

  return (
    <div className="relative">
      <span
        className={`absolute -left-[1.82rem] top-1.5 h-3 w-3 rounded-full ring-4 ${toneClasses[tone]}`}
        aria-hidden
      />
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{time}</p>
      <p className="mt-1 text-sm font-semibold text-slate-100">{title}</p>
    </div>
  );
}
