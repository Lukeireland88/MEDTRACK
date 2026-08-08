import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';

export type ConfirmTone = 'default' | 'danger';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

interface PendingConfirm extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  const pendingRef = useRef<PendingConfirm | null>(null);
  pendingRef.current = pending;

  const settle = useCallback((value: boolean) => {
    const current = pendingRef.current;
    if (!current) return;
    current.resolve(value);
    setPending(null);
  }, []);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setPending((prev) => {
        // If a confirm was already open, cancel it first.
        prev?.resolve(false);
        return { ...options, resolve };
      });
    });
  }, []);

  useEffect(() => {
    if (!pending) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      e.stopImmediatePropagation();
      settle(false);
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [pending, settle]);

  const value = useMemo(() => ({ confirm }), [confirm]);

  const tone = pending?.tone ?? 'default';
  const confirmLabel = pending?.confirmLabel ?? (tone === 'danger' ? 'Delete' : 'Continue');
  const cancelLabel = pending?.cancelLabel ?? 'Cancel';

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <Modal
        isOpen={Boolean(pending)}
        onClose={() => settle(false)}
        title={pending?.title ?? ''}
        description={pending?.message}
        size="sm"
        zIndexClass="z-[110]"
        closeOnOverlayClick={false}
        closeOnEscape={false}
        role="alertdialog"
        footer={
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => settle(false)}>
              {cancelLabel}
            </Button>
            <Button
              type="button"
              variant={tone === 'danger' ? 'danger' : 'primary'}
              onClick={() => settle(true)}
              autoFocus
            >
              {confirmLabel}
            </Button>
          </div>
        }
      >
        {null}
      </Modal>
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmContextValue {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error('useConfirm must be used within ConfirmProvider');
  }
  return ctx;
}
