import { useEffect, useState } from 'react';
import { combineLocalDateWithTime, toTimeInputValue } from '../utils/dateUtils';
import Modal from './ui/Modal';
import Button from './ui/Button';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const takenAtIso = combineLocalDateWithTime(selectedDate, time);
      await onConfirm(takenAtIso);
      onClose();
    } catch {
      // Parent shows toast; keep modal open so user can retry
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      zIndexClass="z-[60]"
      title="Log dose"
      description={
        <>
          <span>{medicationName}</span>
          <span className="block text-xs text-slate-500 mt-0.5">{dateLabel}</span>
        </>
      }
      footer={
        <div className="flex gap-2 justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="log-dose-form" disabled={submitting}>
            {submitting ? 'Saving…' : 'Log dose'}
          </Button>
        </div>
      }
    >
      <form id="log-dose-form" onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
        <div>
          <label htmlFor="dose-time" className="block text-sm font-semibold text-slate-800 mb-2">
            Time taken
          </label>
          <input
            id="dose-time"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full px-4 py-3 text-lg border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <p className="text-xs text-slate-500 mt-2">
            Defaults to now — change this if you&apos;re logging a dose from earlier.
          </p>
        </div>
      </form>
    </Modal>
  );
}
