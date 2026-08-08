import { useEffect, useState } from 'react';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import Modal from './ui/Modal';
import Button from './ui/Button';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Open on create-account, sign-in, forgot, or set-new-password. */
  initialMode?: AuthMode;
  /** Prevent switching away from initialMode (used for recovery flow). */
  lockMode?: boolean;
}

type AuthMode = 'signin' | 'signup' | 'forgot' | 'updatePassword';

export default function AuthModal({
  isOpen,
  onClose,
  initialMode = 'signin',
  lockMode = false,
}: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, resetPassword, updatePassword, changePassword, signOut } = useAuth();
  const { showToast, showError } = useToast();
  const requireCurrentPassword = mode === 'updatePassword' && !lockMode;

  useEffect(() => {
    if (!isOpen) return;
    setMode(initialMode);
    setError('');
    setInfo('');
    setPassword('');
    setCurrentPassword('');
    setConfirmPassword('');
  }, [isOpen, initialMode]);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setCurrentPassword('');
    setConfirmPassword('');
    setError('');
    setInfo('');
  };

  const handleClose = async () => {
    if (mode === 'updatePassword' && lockMode) {
      await signOut();
    }
    onClose();
    resetForm();
    setMode(initialMode);
  };

  const switchMode = (next: AuthMode) => {
    if (lockMode) return;
    setMode(next);
    setError('');
    setInfo('');
    setPassword('');
    setCurrentPassword('');
    setConfirmPassword('');
  };

  const titleForMode = (): string => {
    switch (mode) {
      case 'signup':
        return 'Create account';
      case 'forgot':
        return 'Reset password';
      case 'updatePassword':
        return lockMode ? 'Choose a new password' : 'Change password';
      default:
        return 'Sign in';
    }
  };

  const descriptionForMode = (): string => {
    switch (mode) {
      case 'signup':
        return 'Create an account with your email. Each account keeps its own medications and logs private.';
      case 'forgot':
        return 'Enter your email and we will send a link to reset your password.';
      case 'updatePassword':
        return lockMode
          ? 'Enter a new password for your Medtrack account.'
          : 'Confirm your current password, then choose a new one. You will stay signed in after it is saved.';
      default:
        return 'Your medications stay private to your account.';
    }
  };

  const submitLabel = (): string => {
    if (loading) return 'Loading…';
    switch (mode) {
      case 'signup':
        return 'Create account';
      case 'forgot':
        return 'Send reset link';
      case 'updatePassword':
        return 'Save new password';
      default:
        return 'Sign in';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);

    try {
      if (mode === 'forgot') {
        const trimmed = email.trim();
        if (!trimmed) {
          setError('Enter your email address');
          return;
        }
        const { error: authError } = await resetPassword(trimmed);
        if (authError) {
          const message = authError.message || 'Could not send reset email';
          setError(message);
          showError(message);
          return;
        }
        const successMsg =
          'If an account exists for that email, a reset link is on its way. Check spam if it does not arrive within a few minutes.';
        setInfo(successMsg);
        showToast(successMsg, 'success');
        return;
      }

      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }

      if (mode === 'updatePassword') {
        if (requireCurrentPassword && !currentPassword) {
          setError('Enter your current password');
          return;
        }
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          return;
        }
        if (requireCurrentPassword && currentPassword === password) {
          setError('New password must be different from your current password');
          return;
        }
        const { error: authError } = requireCurrentPassword
          ? await changePassword(currentPassword, password)
          : await updatePassword(password);
        if (authError) {
          const message = authError.message || 'Could not update password';
          setError(message);
          showError(message);
          return;
        }
        showToast(
          lockMode ? 'Password updated. You are signed in.' : 'Password updated.',
          'success'
        );
        onClose();
        resetForm();
        return;
      }

      if (mode === 'signin') {
        const { error: authError } = await signIn(email, password);
        if (authError) {
          setError(authError.message);
          return;
        }
        await handleClose();
        return;
      }

      // signup
      const { error: authError, session, user } = await signUp(email, password);
      if (authError) {
        setError(authError.message);
        return;
      }

      if (session) {
        await handleClose();
        return;
      }

      const alreadyRegistered =
        user && Array.isArray((user as { identities?: unknown[] }).identities)
          ? ((user as { identities: unknown[] }).identities).length === 0
          : false;

      if (alreadyRegistered) {
        setError('An account with this email already exists. Try signing in instead.');
        setMode('signin');
        return;
      }

      setInfo(
        'Check your email for a confirmation link. After you confirm, you can sign in here. Check spam if it does not arrive within a few minutes.'
      );
      setMode('signin');
      setPassword('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      brandAccent
      title={titleForMode()}
      description={descriptionForMode()}
    >
      <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
        <div className="p-4 sm:p-5 space-y-4">
          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start gap-2">
              <AlertCircle size={20} className="text-rose-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-rose-800">{error}</p>
            </div>
          )}
          {info && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
              <p className="text-sm text-emerald-800">{info}</p>
            </div>
          )}

          {mode !== 'updatePassword' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
              <div className="relative">
                <Mail size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
              </div>
            </div>
          )}

          {requireCurrentPassword && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Current password</label>
              <div className="relative">
                <Lock size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>
          )}

          {mode !== 'forgot' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {mode === 'updatePassword' ? 'New password' : 'Password'}
              </label>
              <div className="relative">
                <Lock size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  placeholder="••••••••"
                  required
                  minLength={6}
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">Minimum 6 characters</p>
            </div>
          )}

          {mode === 'updatePassword' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Confirm new password</label>
              <div className="relative">
                <Lock size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  placeholder="••••••••"
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>
            </div>
          )}

          {mode === 'signin' && (
            <p className="text-right text-sm">
              <button
                type="button"
                onClick={() => switchMode('forgot')}
                className="font-semibold text-brand-700 hover:text-brand-900"
              >
                Forgot password?
              </button>
            </p>
          )}

          {!lockMode && (
            <p className="text-center text-sm text-slate-600">
              {mode === 'signin' && (
                <>
                  Need an account?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('signup')}
                    className="font-semibold text-brand-700 hover:text-brand-900"
                  >
                    Sign up with email
                  </button>
                </>
              )}
              {mode === 'signup' && (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('signin')}
                    className="font-semibold text-brand-700 hover:text-brand-900"
                  >
                    Sign in
                  </button>
                </>
              )}
              {mode === 'forgot' && (
                <>
                  Remembered it?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('signin')}
                    className="font-semibold text-brand-700 hover:text-brand-900"
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          )}
        </div>

        <div className="shrink-0 border-t border-slate-100 p-4 sm:p-5 bg-slate-50/80">
          <Button type="submit" disabled={loading} className="w-full py-3">
            {submitLabel()}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
