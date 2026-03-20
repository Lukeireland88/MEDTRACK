import { Routes, Route } from 'react-router-dom';
import TrackerPage from './pages/TrackerPage';
import HistoryReportPage from './pages/HistoryReportPage';
import { isSupabaseConfigured } from './lib/supabase';

export default function App() {
  return (
    <>
      {!isSupabaseConfigured && (
        <div className="bg-amber-100 border-b border-amber-300 text-amber-950 px-3 py-2 text-sm text-center">
          Supabase URL/key were not set at build time. Add{' '}
          <code className="font-mono text-xs">VITE_SUPABASE_URL</code> and{' '}
          <code className="font-mono text-xs">VITE_SUPABASE_ANON_KEY</code> as GitHub Actions secrets and redeploy.
        </div>
      )}
      <Routes>
        <Route path="/" element={<TrackerPage />} />
        <Route path="/history" element={<HistoryReportPage />} />
      </Routes>
    </>
  );
}
