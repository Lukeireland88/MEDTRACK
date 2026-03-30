import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { toDateInputValue } from '../utils/dateUtils';

function toDateTimeLocalValue(d: Date): string {
  // YYYY-MM-DDTHH:mm in local time for <input type="datetime-local" />
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
  onConfirm: (payload: { occurredAtIso: string; eventDate: string; durationSeconds: number; notes: string | null }) => void | Promise<void>;
}

export default function LogSeizureModal({ isOpen, selectedDate, onClose, onConfirm }: LogSeizureModalProps) {
  const defaultDateTime = useMemo(() => {
    const now = new Date();
    const isSameDay = toDateInputValue(now) === toDateInputValue(selectedDate);
    return isSameDay ? now : selectedDate;
  }, [selectedDate]);

  const [occurredAtLocal, setOccurredAtLocal] = useState<string>(toDateTimeLocalValue(defaultDateTime));
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

  if (!isOpen) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    const occurredAt = new Date(occurredAtLocal);
    if (Number.isNaN(occurredAt.getTime())) {
      alert('Please enter a valid date/time.');
      return;
    }

    const durationSeconds = parseDurationToSeconds(durationMins, durationSecs);
    if (durationSeconds == null) {
      alert('Please enter a valid duration.');
      return;
    }
    if (durationSeconds === 0) {
      alert('Duration cannot be 0 seconds.');
      return;
    }

    const eventDate = toDateInputValue(new Date(occurredAt.getFullYear(), occurredAt.getMonth(), occurredAt.getDate()));

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3 p-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Log seizure</h2>
            <p className="text-sm text-gray-600 mt-1">Record when it happened and how long it lasted.</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg" aria-label="Close">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <form onSubmit={submit} className="p-4 space-y-4">
          <div>
            <label htmlFor="seizure-occurred" className="block text-xs font-semibold text-gray-600 mb-1">
              When
            </label>
            <input
              id="seizure-occurred"
              type="datetime-local"
              value={occurredAtLocal}
              onChange={(e) => setOccurredAtLocal(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="seizure-dur-min" className="block text-xs font-semibold text-gray-600 mb-1">
                Duration (minutes)
              </label>
              <input
                id="seizure-dur-min"
                inputMode="numeric"
                value={durationMins}
                onChange={(e) => setDurationMins(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium"
                placeholder="0"
              />
            </div>
            <div>
              <label htmlFor="seizure-dur-sec" className="block text-xs font-semibold text-gray-600 mb-1">
                Duration (seconds)
              </label>
              <input
                id="seizure-dur-sec"
                inputMode="numeric"
                value={durationSecs}
                onChange={(e) => setDurationSecs(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label htmlFor="seizure-notes" className="block text-xs font-semibold text-gray-600 mb-1">
              Notes (optional)
            </label>
            <textarea
              id="seizure-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="e.g. After lunch, fell to ground, recovered quickly"
            />
          </div>

          <div className="flex flex-wrap gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg font-semibold text-gray-800 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-purple-700 text-white rounded-lg font-semibold hover:bg-purple-800 disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

