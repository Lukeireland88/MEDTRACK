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

export type EditTimelineEventInitial = {
  id: string;
  occurredAtIso: string;
  title: string;
  notes: string | null;
};

export type EditTimelineEventPayload = {
  occurredAtIso: string;
  eventDate: string;
  notes: string | null;
};

interface EditTimelineEventModalProps {
  isOpen: boolean;
  initial: EditTimelineEventInitial | null;
  onClose: () => void;
  onConfirm: (payload: EditTimelineEventPayload) => void | Promise<void>;
}

export default function EditTimelineEventModal({ isOpen, initial, onClose, onConfirm }: EditTimelineEventModalProps) {
  const defaultDate = useMemo(() => {
    if (!initial) return new Date();
    const d = new Date(initial.occurredAtIso);
    return Number.isNaN(d.getTime()) ? new Date() : d;
  }, [initial]);

  const [occurredAtLocal, setOccurredAtLocal] = useState<string>(toDateTimeLocalValue(defaultDate));
  const [notes, setNotes] = useState<string>(initial?.notes ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen || !initial) return;
    setOccurredAtLocal(toDateTimeLocalValue(defaultDate));
    setNotes(initial.notes ?? '');
    setSaving(false);
  }, [isOpen, initial, defaultDate]);

  if (!isOpen || !initial) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const occurredAt = new Date(occurredAtLocal);
    if (Number.isNaN(occurredAt.getTime())) {
      alert('Please enter a valid date/time.');
      return;
    }

    const eventDate = toDateInputValue(new Date(occurredAt.getFullYear(), occurredAt.getMonth(), occurredAt.getDate()));

    setSaving(true);
    try {
      await onConfirm({
        occurredAtIso: occurredAt.toISOString(),
        eventDate,
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
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-gray-900">Edit note</h2>
            <p className="text-sm text-gray-600 mt-1 truncate">{initial.title}</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg" aria-label="Close">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <form onSubmit={submit} className="p-4 space-y-4">
          <div>
            <label htmlFor="edit-event-occurred" className="block text-xs font-semibold text-gray-600 mb-1">
              When
            </label>
            <input
              id="edit-event-occurred"
              type="datetime-local"
              value={occurredAtLocal}
              onChange={(e) => setOccurredAtLocal(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Changing this also updates the stored event date.</p>
          </div>

          <div>
            <label htmlFor="edit-event-notes" className="block text-xs font-semibold text-gray-600 mb-1">
              Notes (optional)
            </label>
            <textarea
              id="edit-event-notes"
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
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

