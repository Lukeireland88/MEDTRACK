import { useEffect, useState } from 'react';
import { X, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { DosingMode, MedicationDoseEvent, MedicationLog } from '../types';

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
  doseDate
}: MedicationHistoryModalProps) {
  const [logs, setLogs] = useState<MedicationLog[]>([]);
  const [doseEvents, setDoseEvents] = useState<MedicationDoseEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen, medicationId, timeSlotId, doseDate, dosingMode]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      if (dosingMode === 'flexible_daily') {
        const { data, error } = await supabase
          .from('medication_dose_events')
          .select('*')
          .eq('medication_id', medicationId)
          .eq('dose_date', doseDate)
          .order('taken_at', { ascending: false });

        if (error) throw error;
        setDoseEvents(data || []);
        setLogs([]);
      } else {
        const { data, error } = await supabase
          .from('medication_logs')
          .select('*')
          .eq('medication_id', medicationId)
          .eq('time_slot_id', timeSlotId)
          .eq('dose_date', doseDate)
          .order('logged_at', { ascending: false });

        if (error) throw error;
        setLogs(data || []);
        setDoseEvents([]);
      }
    } catch (error) {
      console.error('Error loading history:', error);
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
      hour12: true
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">History</h2>
            <p className="text-sm text-gray-600 mt-1">
              {medicationName}
              {dosingMode === 'time_slots' ? ` - ${timeSlotName}` : ' — flexible doses'}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {new Date(doseDate).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close history"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center text-gray-600 py-8">Loading history...</div>
          ) : dosingMode === 'flexible_daily' ? (
            doseEvents.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No doses logged on this date.
              </div>
            ) : (
              <div className="space-y-3">
                {doseEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="mt-1">
                      <Clock className="w-5 h-5 text-gray-500" />
                    </div>
                    <div className="flex-1">
                      <span className="font-semibold text-green-800">Dose logged</span>
                      <p className="text-sm text-gray-600 mt-1">
                        {formatDateTime(ev.taken_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : logs.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No history found for this medication on this date.
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="mt-1">
                    <Clock className="w-5 h-5 text-gray-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-semibold ${
                          log.action === 'checked'
                            ? 'text-green-700'
                            : 'text-orange-700'
                        }`}
                      >
                        {log.action === 'checked' ? 'Marked as taken' : 'Marked as not taken'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {formatDateTime(log.logged_at)}
                    </p>
                    {log.action === 'unchecked' && log.reason && (
                      <p className="text-sm text-amber-900 mt-2 font-medium">Reason: {log.reason}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
