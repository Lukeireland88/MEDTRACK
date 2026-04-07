import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { toDateInputValue } from '../utils/dateUtils';

function toDateTimeLocalValue(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

export type AddEventPayload = {
  occurredAtIso: string;
  eventDate: string;
  eventType: string;
  title: string;
  valueText: string | null;
  notes: string | null;
};

interface AddEventModalProps {
  isOpen: boolean;
  selectedDate: Date;
  onClose: () => void;
  onConfirm: (payload: AddEventPayload) => void | Promise<void>;
}

const EVENT_TYPES: { id: string; label: string }[] = [
  { id: 'note', label: 'Note' },
  { id: 'measurement', label: 'Measurement' },
  { id: 'visit', label: 'Visit' },
];

export default function AddEventModal({ isOpen, selectedDate, onClose, onConfirm }: AddEventModalProps) {
  const defaultDateTime = useMemo(() => {
    const now = new Date();
    const isSameDay = toDateInputValue(now) === toDateInputValue(selectedDate);
    return isSameDay ? now : selectedDate;
  }, [selectedDate]);

  const [occurredAtLocal, setOccurredAtLocal] = useState<string>(toDateTimeLocalValue(defaultDateTime));
  const [eventType, setEventType] = useState<string>('note');
  const [title, setTitle] = useState<string>('');
  const [valueText, setValueText] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setOccurredAtLocal(toDateTimeLocalValue(defaultDateTime));
    setEventType('note');
    setTitle('');
    setValueText('');
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
    if (!title.trim()) {
      alert('Please enter a title.');
      return;
    }

    const eventDate = toDateInputValue(new Date(occurredAt.getFullYear(), occurredAt.getMonth(), occurredAt.getDate()));

    setSaving(true);
    try {
      await onConfirm({
        occurredAtIso: occurredAt.toISOString(),
        eventDate,
        eventType,
        title: title.trim(),
        valueText: valueText.trim() ? valueText.trim() : null,
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
            <h2 className="text-lg font-bold text-gray-900">Add note</h2>
            <p className="text-sm text-gray-600 mt-1">Record a timestamped note, visit, or measurement (backdating supported).</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg" aria-label="Close">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <form onSubmit={submit} className="p-4 space-y-4">
          <div>
            <label htmlFor="event-occurred" className="block text-xs font-semibold text-gray-600 mb-1">
              When
            </label>
            <input
              id="event-occurred"
              type="datetime-local"
              value={occurredAtLocal}
              onChange={(e) => setOccurredAtLocal(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="event-type" className="block text-xs font-semibold text-gray-600 mb-1">
                Type
              </label>
              <select
                id="event-type"
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium"
              >
                {EVENT_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="event-value" className="block text-xs font-semibold text-gray-600 mb-1">
                Value (optional)
              </label>
              <input
                id="event-value"
                value={valueText}
                onChange={(e) => setValueText(e.target.value)}
                placeholder="e.g. SpO2 92%"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="event-title" className="block text-xs font-semibold text-gray-600 mb-1">
              Title
            </label>
            <input
              id="event-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Out-of-hours GP"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium"
              required
            />
          </div>

          <div>
            <label htmlFor="event-notes" className="block text-xs font-semibold text-gray-600 mb-1">
              Notes (optional)
            </label>
            <textarea
              id="event-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="Details to remember later…"
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
              className="px-4 py-2 bg-indigo-700 text-white rounded-lg font-semibold hover:bg-indigo-800 disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

