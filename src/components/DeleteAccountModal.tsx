import { useEffect, useState } from 'react';
import { Lock } from 'lucide-react';
import Modal from './ui/Modal';
import Button from './ui/Button';

interface DeleteAccountModalProps {
  isOpen: boolean;
  email: string;
  loading: boolean;
  error: string;
  onClose: () => void;
  onConfirm: (password: string) => Promise<void>;
}

export default function DeleteAccountModal({
  isOpen,
  email,
  loading,
  error,
  onClose,
  onConfirm,
}: DeleteAccountModalProps) {
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (isOpen) setPassword('');
  }, [isOpen]);

  const handleClose = () => {
    if (loading) return;
    setPassword('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Delete account"
      description="This permanently deletes your login and all medications, dose logs, notes and observations stored with this account. This cannot be undone."
      size="sm"
      brandAccent
      closeOnOverlayClick={!loading}
      role="alertdialog"
    >
      <form
        className="flex min-h-0 flex-1 flex-col"
        onSubmit={(event) => {
          event.preventDefault();
          void onConfirm(password);
        }}
      >
        <div className="space-y-4 p-4 sm:p-5">
          <p className="text-sm text-slate-600">
            Signed in as <span className="font-semibold text-slate-900">{email}</span>. Enter your
            password to confirm.
          </p>
          {error && (
            <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800" role="alert">
              {error}
            </p>
          )}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="delete-account-password">
              Password
            </label>
            <div className="relative">
              <Lock size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden />
              <input
                id="delete-account-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-4 focus:border-transparent focus:ring-2 focus:ring-brand-500"
                placeholder="••••••••"
                required
                autoComplete="current-password"
                disabled={loading}
              />
            </div>
          </div>
        </div>
        <div className="flex shrink-0 justify-end gap-2 border-t border-slate-100 bg-slate-50/80 p-4 sm:p-5">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="danger" disabled={loading || !password}>
            {loading ? 'Deleting…' : 'Delete account'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
