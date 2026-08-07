import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { DosingMode, MedicationDoseEvent, MedicationLog } from '../types';
import { fromDateInputValue } from '../utils/dateUtils';
import Modal from './ui/Modal';
import Button from './ui/Button';

interface MedicationHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  medicationId: string;
  medicationName: string;
  dosingMode: DosingMode;
  timeSlotId: string;
  timeSlotName: string;
  doseDate: string;
}

export default function MedicationHistoryModal({
  isOpen,
  onClose,
  medicationId,
  medicationName,
  dosingMode,
  timeSlotId,
  timeSlotName,
  doseDate,
}: MedicationHistoryModalProps) {
  const [logs, setLogs] = useState<MedicationLog[]>([]);
  const [doseEvents, setDoseEvents] = useState<MedicationDoseEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      void loadHistory();
    }
  }, [isOpen, medicationId, timeSlotId, doseDate, dosingMode]);

  const loadHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      if (dosingMode === 'flexible_daily') {
        const { data, error: queryError } = await supabase
          .from('medication_dose_events')
          .select('*')
          .eq('medication_id', medicationId)
          .eq('dose_date', doseDate)
          .order('taken_at', { ascending: false });

        if (queryError) throw queryError;
        setDoseEvents(data || []);
        setLogs([]);
      } else {
        const { data, error: queryError } = await supabase
          .from('medication_logs')
          .select('*')
          .eq('medication_id', medicationId)
          .eq('time_slot_id', timeSlotId)
          .eq('dose_date', doseDate)
          .order('logged_at', { ascending: false });

        if (queryError) throw queryError;
        setLogs(data || []);
        setDoseEvents([]);
      }
    } catch (err) {
      console.error('Error loading history:', err);
      setError('Could not load history. Please try again.');
      setLogs([]);
      setDoseEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const dateLabel = fromDateInputValue(doseDate).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title="History"
      description={
        <>
          <span>
            {medicationName}
            {dosingMode === 'time_slots' ? ` — ${timeSlotName}` : ' — flexible doses'}
          </span>
          <span className="block text-xs text-slate-500 mt-0.5">{dateLabel}</span>
        </>
      }
    >
      <div className="p-4 sm:p-6">
        {loading ? (
          <div className="text-center text-slate-600 py-8 animate-pulse">Loading history…</div>
        ) : error ? (
          <div className="text-center py-6 space-y-3" role="alert">
            <p className="text-sm text-rose-800">{error}</p>
            <Button size="sm" variant="secondary" onClick={() => void loadHistory()}>
              Retry
            </Button>
          </div>
        ) : dosingMode === 'flexible_daily' ? (
          doseEvents.length === 0 ? (
            <div className="text-center text-slate-500 py-8">No doses logged on this date.</div>
          ) : (
            <div className="space-y-3">
              {doseEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200"
                >
                  <Clock className="w-5 h-5 text-slate-500 mt-1 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-emerald-800">Dose logged</span>
                    <p className="text-sm text-slate-600 mt-1">{formatDateTime(ev.taken_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : logs.length === 0 ? (
          <div className="text-center text-slate-500 py-8">
            No history found for this medication on this date.
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200"
              >
                <Clock className="w-5 h-5 text-slate-500 mt-1 shrink-0" />
                <div className="flex-1 min-w-0">
                  <span
                    className={`font-semibold ${
                      log.action === 'checked' ? 'text-emerald-800' : 'text-amber-800'
                    }`}
                  >
                    {log.action === 'checked' ? 'Marked as taken' : 'Marked as not taken'}
                  </span>
                  <p className="text-sm text-slate-600 mt-1">{formatDateTime(log.logged_at)}</p>
                  {log.action === 'unchecked' && log.reason && (
                    <p className="text-sm text-amber-900 mt-2 font-medium">Reason: {log.reason}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
