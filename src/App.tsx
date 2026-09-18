import { Routes, Route } from 'react-router-dom';
import TrackerPage from './pages/TrackerPage';
import HistoryReportPage from './pages/HistoryReportPage';
import SettingsPage from './pages/SettingsPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import { isSupabaseConfigured } from './lib/supabase';
import { useAuth } from './contexts/AuthContext';
import AuthCallbackBanner from './components/AuthCallbackBanner';
import EmailConfirmationScreen from './components/EmailConfirmationScreen';
import PasswordRecoveryScreen from './components/PasswordRecoveryScreen';

export default function App() {
  const {
    emailConfirmation,
    passwordRecoveryPending,
    authCallbackNotice,
    dismissAuthCallbackNotice,
    dismissEmailConfirmation,
  } = useAuth();

  if (emailConfirmation) {
    return (
      <EmailConfirmationScreen
        valid={emailConfirmation.valid}
        confirmationUrl={emailConfirmation.url}
        purpose={emailConfirmation.purpose}
        onContinue={emailConfirmation.valid ? undefined : dismissEmailConfirmation}
      />
    );
  }

  if (passwordRecoveryPending) {
    return <PasswordRecoveryScreen />;
  }

  return (
    <>
      {!isSupabaseConfigured && (
        <div className="bg-amber-100 border-b border-amber-300 text-amber-950 px-3 py-2 text-sm text-center">
          Supabase URL/key were not set at build time. Add{' '}
          <code className="font-mono text-xs">VITE_SUPABASE_URL</code> and{' '}
          <code className="font-mono text-xs">VITE_SUPABASE_ANON_KEY</code> as GitHub Actions secrets and redeploy.
        </div>
      )}
      {authCallbackNotice && (
        <AuthCallbackBanner notice={authCallbackNotice} onDismiss={dismissAuthCallbackNotice} />
      )}
      <Routes>
        <Route path="/" element={<TrackerPage />} />
        <Route path="/history" element={<HistoryReportPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
      </Routes>
    </>
  );
}
