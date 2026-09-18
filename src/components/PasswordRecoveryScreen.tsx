import { Pill } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';

/** Full-page recovery gate: do not mount the signed-in tracker behind the password form. */
export default function PasswordRecoveryScreen() {
  const { signOut } = useAuth();

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
      <AuthModal
        isOpen
        onClose={() => {
          void signOut();
        }}
        initialMode="updatePassword"
        lockMode
      />
    </div>
  );
}
