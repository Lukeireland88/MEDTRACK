import { MailCheck, Pill } from 'lucide-react';
import Button from './ui/Button';
import { INVALID_CONFIRMATION_LINK_MESSAGE } from '../utils/authCallback';

interface EmailConfirmationScreenProps {
  valid: boolean;
  confirmationUrl: string | null;
  onContinue?: () => void;
}

export default function EmailConfirmationScreen({
  valid,
  confirmationUrl,
  onContinue,
}: EmailConfirmationScreenProps) {
  const handleConfirm = () => {
    if (!valid || !confirmationUrl) return;
    window.location.assign(confirmationUrl);
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-slate-900">
      <header className="relative z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 via-brand-600 to-brand-800 text-white shadow-brand-sm"
            aria-hidden
          >
            <Pill className="h-5 w-5" strokeWidth={2.2} />
          </span>
          <span className="text-xl font-bold tracking-tight">My Meds Record</span>
        </div>
      </header>

      <main className="relative isolate px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div
          className="absolute inset-x-0 top-0 -z-10 h-[28rem] bg-gradient-to-b from-brand-50 via-sky-50/70 to-white"
          aria-hidden
        />
        <div className="mx-auto w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-brand-900/10 sm:p-8">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
            <MailCheck className="h-6 w-6" aria-hidden />
          </span>
          <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-950">
            Confirm your email
          </h1>
          {valid ? (
            <>
              <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
                Press the button below to finish creating your account. This extra step stops email
                scanners from using your one-time confirmation link before you do.
              </p>
              <Button onClick={handleConfirm} className="mt-6 w-full py-3">
                Confirm my email
              </Button>
            </>
          ) : (
            <>
              <p className="mt-3 text-sm leading-6 text-rose-800 sm:text-base" role="alert">
                {INVALID_CONFIRMATION_LINK_MESSAGE}
              </p>
              {onContinue && (
                <Button variant="secondary" onClick={onContinue} className="mt-6 w-full py-3">
                  Continue to My Meds Record
                </Button>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
