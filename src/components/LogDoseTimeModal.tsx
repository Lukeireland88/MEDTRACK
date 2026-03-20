import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { combineLocalDateWithTime, toTimeInputValue } from '../utils/dateUtils';

interface LogDoseTimeModalProps {
  isOpen: boolean;
  medicationName: string;
  selectedDate: Date;
  onClose: () => void;
  onConfirm: (takenAtIso: string) => void | Promise<void>;
}

export default function LogDoseTimeModal({
  isOpen,
  medicationName,
  selectedDate,
  onClose,
  onConfirm,
}: LogDoseTimeModalProps) {
  const [time, setTime] = useState(() => toTimeInputValue(new Date()));
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTime(toTimeInputValue(new Date()));
      setSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const takenAtIso = combineLocalDateWithTime(selectedDate, time);
      await onConfirm(takenAtIso);
      onClose();
    } catch {
      // Parent typically shows alert; keep modal open so user can retry
    } finally {
      setSubmitting(false);
    }
  };

  const dateLabel = selectedDate.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
        role="dialog"
        aria-labelledby="log-dose-title"
      >
        <div className="flex justify-between items-start gap-3 mb-4">
          <div>
            <h2 id="log-dose-title" className="text-lg font-bold text-gray-900">
              Log dose
            </h2>
            <p className="text-sm text-gray-600 mt-1">{medicationName}</p>
            <p className="text-xs text-gray-500 mt-0.5">{dateLabel}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg shrink-0"
            aria-label="Close"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="dose-time" className="block text-sm font-semibold text-gray-800 mb-2">
              Time taken
            </label>
            <input
              id="dose-time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-2">
              Defaults to now — change this if you&apos;re logging a dose from earlier.
            </p>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-60"
            >
              {submitting ? 'Saving…' : 'Log dose'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
