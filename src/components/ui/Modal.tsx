import { useEffect, useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

type ModalSize = 'sm' | 'md' | 'lg';

const sizeClass: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
};

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: ModalSize;
  /** Overlay z-index (default 50). */
  zIndexClass?: string;
  /** Optional brand gradient bar at top (e.g. auth). */
  brandAccent?: boolean;
  /** When false, body is not scroll-constrained (caller manages layout). */
  scrollBody?: boolean;
  role?: 'dialog' | 'alertdialog';
}

export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  zIndexClass = 'z-50',
  brandAccent = false,
  scrollBody = true,
  role = 'dialog',
}: ModalProps) {
  const titleId = useId();
  const descId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // Focus the panel once on open (not on every parent re-render / onClose identity change)
    panelRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 bg-black/50 flex items-center justify-center ${zIndexClass} p-4`}
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={`bg-white rounded-2xl shadow-2xl ring-1 ring-slate-200/90 w-full ${sizeClass[size]} max-h-[90vh] flex flex-col overflow-hidden outline-none`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {brandAccent && (
          <div
            className="h-1.5 shrink-0 bg-gradient-to-r from-brand-500 via-brand-600 to-brand-800"
            aria-hidden
          />
        )}
        <div className="flex items-start justify-between gap-3 p-4 sm:p-5 border-b border-slate-100 shrink-0">
          <div className="min-w-0">
            <h2 id={titleId} className="text-lg sm:text-xl font-bold text-slate-900">
              {title}
            </h2>
            {description != null && description !== false && (
              <div id={descId} className="mt-1 text-sm text-slate-600">
                {description}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 -mr-1 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 touch-manipulation shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className={`min-h-0 flex-1 ${scrollBody ? 'overflow-y-auto' : ''}`}>{children}</div>
        {footer != null && (
          <div className="shrink-0 border-t border-slate-100 p-4 sm:p-5 bg-slate-50/80">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
