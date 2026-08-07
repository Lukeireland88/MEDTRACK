import { useState } from 'react';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Modal from './ui/Modal';
import Button from './ui/Button';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthMode = 'signin' | 'signup';

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setError('');
    setInfo('');
  };

  const handleClose = () => {
    onClose();
    resetForm();
    setMode('signin');
  };

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setError('');
    setInfo('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
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
    } else {
      const { error: authError } = await signUp(email, password);
      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }
      setInfo(
        'Account created. You can sign in now (confirm email first if your project requires it).'
      );
      setMode('signin');
      setPassword('');
    }
    setLoading(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      brandAccent
      title={mode === 'signin' ? 'Sign in' : 'Create account'}
      description={
        mode === 'signin'
          ? 'Your medications stay private to your account.'
          : 'Each account has its own medications and logs.'
      }
      footer={
        <Button type="submit" form="auth-form" disabled={loading} className="w-full py-3">
          {loading ? 'Loading…' : mode === 'signin' ? 'Sign in' : 'Create account'}
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

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
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

        <p className="text-center text-sm text-slate-600">
          {mode === 'signin' ? (
            <>
              Need an account?{' '}
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className="font-semibold text-brand-700 hover:text-brand-900"
              >
                Sign up
              </button>
            </>
          ) : (
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
        </p>
      </form>
    </Modal>
  );
}
