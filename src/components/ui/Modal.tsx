import { useEffect, useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

type ModalSize = 'sm' | 'md' | 'lg';

const sizeClass: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
};

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function focusableIn(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true'
  );
}

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
  /** When false, clicking the dimmed backdrop does not close (default true). */
  closeOnOverlayClick?: boolean;
  /** When false, Escape does not close (default true). */
  closeOnEscape?: boolean;
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
  closeOnOverlayClick = true,
  closeOnEscape = true,
  role = 'dialog',
}: ModalProps) {
  const titleId = useId();
  const descId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const panel = panelRef.current;
    const onKey = (e: KeyboardEvent) => {
      if (closeOnEscape && e.key === 'Escape') {
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !panel) return;
      const focusable = focusableIn(panel);
      if (focusable.length === 0) {
        e.preventDefault();
        panel.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panel?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus();
    };
  }, [isOpen, closeOnEscape]);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 bg-black/50 flex items-center justify-center ${zIndexClass} p-4`}
      role="presentation"
      onMouseDown={(e) => {
        if (closeOnOverlayClick && e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={`bg-white rounded-2xl shadow-2xl ring-1 ring-slate-200/90 w-full ${sizeClass[size]} max-h-[90vh] flex flex-col overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-brand-600`}
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
              <div id={descId} className="mt-1 text-sm text-slate-600 whitespace-pre-line">
                {description}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 -mr-1 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 touch-manipulation shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {children != null && children !== false && (
          <div className={`min-h-0 flex-1 ${scrollBody ? 'overflow-y-auto' : ''}`}>{children}</div>
        )}
        {footer != null && (
          <div className="shrink-0 border-t border-slate-100 p-4 sm:p-5 bg-slate-50/80">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
