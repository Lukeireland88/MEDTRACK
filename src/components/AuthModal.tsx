import { useEffect, useState } from 'react';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
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
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, resetPassword, updatePassword, signOut } = useAuth();

  useEffect(() => {
    if (!isOpen) return;
    setMode(initialMode);
    setError('');
    setInfo('');
    setPassword('');
    setConfirmPassword('');
  }, [isOpen, initialMode]);

  const resetForm = () => {
    setEmail('');
    setPassword('');
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
    setConfirmPassword('');
  };

  const titleForMode = (): string => {
    switch (mode) {
      case 'signup':
        return 'Create account';
      case 'forgot':
        return 'Reset password';
      case 'updatePassword':
        return 'Choose a new password';
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
        return 'Enter a new password for your Medtrack account.';
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

    if (mode === 'forgot') {
      const { error: authError } = await resetPassword(email.trim());
      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }
      setInfo(
        'If an account exists for that email, a reset link is on its way. Check spam if it does not arrive within a few minutes.'
      );
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    if (mode === 'updatePassword') {
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }
      const { error: authError } = await updatePassword(password);
      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }
      setInfo('Password updated. You are signed in.');
      setLoading(false);
      onClose();
      resetForm();
      return;
    }

    if (mode === 'signin') {
      const { error: authError } = await signIn(email, password);
      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }
      handleClose();
      setLoading(false);
      return;
    }

    // signup
    const { error: authError, session, user } = await signUp(email, password);
    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (session) {
      handleClose();
      setLoading(false);
      return;
    }

    const alreadyRegistered =
      user && Array.isArray((user as { identities?: unknown[] }).identities)
        ? ((user as { identities: unknown[] }).identities).length === 0
        : false;

    if (alreadyRegistered) {
      setError('An account with this email already exists. Try signing in instead.');
      setMode('signin');
      setLoading(false);
      return;
    }

    setInfo(
      'Check your email for a confirmation link. After you confirm, you can sign in here. Check spam if it does not arrive within a few minutes.'
    );
    setMode('signin');
    setPassword('');
    setLoading(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      brandAccent
      title={titleForMode()}
      description={descriptionForMode()}
      footer={
        <Button type="submit" form="auth-form" disabled={loading} className="w-full py-3">
          {submitLabel()}
        </Button>
      }
    >
      <form id="auth-form" onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
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
            <label className="block text-sm font-medium text-slate-700 mb-2">Confirm password</label>
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
      </form>
    </Modal>
  );
}
