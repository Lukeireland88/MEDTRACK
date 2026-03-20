import { Routes, Route } from 'react-router-dom';
import TrackerPage from './pages/TrackerPage';
import HistoryReportPage from './pages/HistoryReportPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<TrackerPage />} />
      <Route path="/history" element={<HistoryReportPage />} />
    </Routes>
  );
}
