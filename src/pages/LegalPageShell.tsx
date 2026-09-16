import { Link } from 'react-router-dom';
import { ArrowLeft, Pill } from 'lucide-react';
import type { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface LegalPageShellProps {
  kicker: string;
  title: string;
  updated: string;
  children: ReactNode;
}

export default function LegalPageShell({ kicker, title, updated, children }: LegalPageShellProps) {
  const { user } = useAuth();
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
            to="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:text-brand-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {backLabel}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-700">{kicker}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">{title}</h1>
        <p className="mt-3 text-sm text-slate-500">{updated}</p>
        <div className="mt-8 space-y-8 text-base leading-7 text-slate-700">{children}</div>
      </main>
    </div>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-bold text-slate-950">{title}</h2>
      <div className="mt-2 space-y-3">{children}</div>
    </section>
  );
}

export function LegalLink({ to, children }: { to: string; children: ReactNode }) {
  const className =
    'font-semibold text-brand-700 hover:text-brand-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600';
  if (to.startsWith('http://') || to.startsWith('https://') || to.startsWith('mailto:')) {
    return (
      <a className={className} href={to}>
        {children}
      </a>
    );
  }
  return (
    <Link className={className} to={to}>
      {children}
    </Link>
  );
}
