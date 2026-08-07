import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type ToastTone = 'error' | 'success' | 'info';

interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ToastContextValue {
  showToast: (message: string, tone?: ToastTone) => void;
  showError: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, tone: ToastTone = 'info') => {
    const id = nextId++;
    setToasts((list) => [...list, { id, message, tone }]);
    window.setTimeout(() => dismiss(id), 4500);
  }, [dismiss]);

  const showError = useCallback(
    (message: string) => showToast(message, 'error'),
    [showToast]
  );

  const value = useMemo(() => ({ showToast, showError }), [showToast, showError]);

  const toneClass: Record<ToastTone, string> = {
    error: 'bg-rose-700 text-white border-rose-800',
    success: 'bg-emerald-700 text-white border-emerald-800',
    info: 'bg-slate-800 text-white border-slate-900',
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="fixed bottom-4 left-1/2 z-[100] flex w-[min(100%-1.5rem,24rem)] -translate-x-1/2 flex-col gap-2 pointer-events-none"
        aria-live="polite"
        aria-relevant="additions"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.tone === 'error' ? 'alert' : 'status'}
            className={`pointer-events-auto rounded-xl border px-4 py-3 text-sm font-medium shadow-lg ${toneClass[t.tone]}`}
          >
            <div className="flex items-start justify-between gap-3">
              <span>{t.message}</span>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="shrink-0 rounded-lg px-1.5 py-0.5 text-white/80 hover:bg-white/10 hover:text-white"
                aria-label="Dismiss"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}
