import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import type { AuthCallbackNotice } from '../utils/authCallback';

interface AuthCallbackBannerProps {
  notice: AuthCallbackNotice;
  onDismiss: () => void;
}

export default function AuthCallbackBanner({ notice, onDismiss }: AuthCallbackBannerProps) {
  const isError = notice.variant === 'error';

  return (
    <div
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
      className={`border-b px-3 py-3 sm:px-4 ${
        isError
          ? 'border-rose-200 bg-rose-50 text-rose-950'
          : 'border-emerald-200 bg-emerald-50 text-emerald-950'
      }`}
    >
      <div className="mx-auto flex max-w-4xl items-start gap-3">
        {isError ? (
          <AlertCircle size={20} className="mt-0.5 shrink-0 text-rose-600" aria-hidden />
        ) : (
          <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-emerald-600" aria-hidden />
        )}
        <p className="min-w-0 flex-1 text-sm leading-6 sm:text-base">{notice.message}</p>
        <button
          type="button"
          onClick={onDismiss}
          className={`-mr-1 rounded-lg p-1 touch-manipulation ${
            isError ? 'text-rose-800 hover:bg-rose-100' : 'text-emerald-800 hover:bg-emerald-100'
          }`}
          aria-label="Dismiss message"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
