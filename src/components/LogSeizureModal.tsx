import { useEffect, useMemo, useState } from 'react';
import { toDateInputValue } from '../utils/dateUtils';
import Modal from './ui/Modal';
import Button from './ui/Button';
import { useToast } from '../contexts/ToastContext';

function toDateTimeLocalValue(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

function parseDurationToSeconds(mins: string, secs: string): number | null {
  const m = mins.trim() === '' ? 0 : Number(mins);
  const s = secs.trim() === '' ? 0 : Number(secs);
  if (!Number.isFinite(m) || !Number.isFinite(s)) return null;
  if (m < 0 || s < 0) return null;
  return Math.round(m * 60 + s);
}

interface LogSeizureModalProps {
  isOpen: boolean;
  selectedDate: Date;
  onClose: () => void;
  onConfirm: (payload: {
    occurredAtIso: string;
    eventDate: string;
    durationSeconds: number;
    notes: string | null;
  }) => void | Promise<void>;
}

export default function LogSeizureModal({
  isOpen,
  selectedDate,
  onClose,
  onConfirm,
}: LogSeizureModalProps) {
  const { showError } = useToast();
  const defaultDateTime = useMemo(() => {
    const now = new Date();
    const isSameDay = toDateInputValue(now) === toDateInputValue(selectedDate);
    return isSameDay ? now : selectedDate;
  }, [selectedDate]);

  const [occurredAtLocal, setOccurredAtLocal] = useState<string>(
    toDateTimeLocalValue(defaultDateTime)
  );
  const [durationMins, setDurationMins] = useState<string>('');
  const [durationSecs, setDurationSecs] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setOccurredAtLocal(toDateTimeLocalValue(defaultDateTime));
    setDurationMins('');
    setDurationSecs('');
    setNotes('');
    setSaving(false);
  }, [isOpen, defaultDateTime]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    const occurredAt = new Date(occurredAtLocal);
    if (Number.isNaN(occurredAt.getTime())) {
      showError('Please enter a valid date/time.');
      return;
    }

    const durationSeconds = parseDurationToSeconds(durationMins, durationSecs);
    if (durationSeconds == null) {
      showError('Please enter a valid duration.');
      return;
    }
    if (durationSeconds === 0) {
      showError('Duration cannot be 0 seconds.');
      return;
    }

    const eventDate = toDateInputValue(
      new Date(occurredAt.getFullYear(), occurredAt.getMonth(), occurredAt.getDate())
    );

    setSaving(true);
    try {
      await onConfirm({
        occurredAtIso: occurredAt.toISOString(),
        eventDate,
        durationSeconds,
        notes: notes.trim() ? notes.trim() : null,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title="Log seizure"
      description="Record when it happened and how long it lasted."
      footer={
        <div className="flex flex-wrap gap-2 justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="log-seizure-form"
            disabled={saving}
            className="!bg-purple-700 hover:!bg-purple-800 shadow-none"
          >
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      }
    >
      <form id="log-seizure-form" onSubmit={submit} className="p-4 sm:p-5 space-y-4">
        <div>
          <label htmlFor="seizure-occurred" className="block text-xs font-semibold text-slate-600 mb-1">
            When
          </label>
          <input
            id="seizure-occurred"
            type="datetime-local"
            value={occurredAtLocal}
            onChange={(e) => setOccurredAtLocal(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-medium"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="seizure-dur-min" className="block text-xs font-semibold text-slate-600 mb-1">
              Duration (minutes)
            </label>
            <input
              id="seizure-dur-min"
              inputMode="numeric"
              value={durationMins}
              onChange={(e) => setDurationMins(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-medium"
              placeholder="0"
            />
          </div>
          <div>
            <label htmlFor="seizure-dur-sec" className="block text-xs font-semibold text-slate-600 mb-1">
              Duration (seconds)
            </label>
            <input
              id="seizure-dur-sec"
              inputMode="numeric"
              value={durationSecs}
              onChange={(e) => setDurationSecs(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-medium"
              placeholder="0"
            />
          </div>
        </div>

        <div>
          <label htmlFor="seizure-notes" className="block text-xs font-semibold text-slate-600 mb-1">
            Notes (optional)
          </label>
          <textarea
            id="seizure-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
            placeholder="e.g. After lunch, fell to ground, recovered quickly"
          />
        </div>
      </form>
    </Modal>
  );
}
