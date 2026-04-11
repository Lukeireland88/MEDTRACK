import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';

export const NOT_TAKEN_PRESETS = [
  'Refused',
  'Asleep',
  'Nausea / unwell',
  'Away from home',
  'Out of stock',
  'Forgot',
  'Other',
] as const;

export type NotTakenPreset = (typeof NOT_TAKEN_PRESETS)[number];

interface MarkNotTakenModalProps {
  isOpen: boolean;
  medicationName: string;
  onClose: () => void;
  onConfirm: (reason: string) => void | Promise<void>;
}

export default function MarkNotTakenModal({
  isOpen,
  medicationName,
  onClose,
  onConfirm,
}: MarkNotTakenModalProps) {
  const [preset, setPreset] = useState<NotTakenPreset>('Refused');
  const [otherDetail, setOtherDetail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const buildReason = (): string | null => {
    if (preset === 'Other') {
      const t = otherDetail.trim();
      return t.length > 0 ? `Other: ${t}` : null;
    }
    return preset;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const reason = buildReason();
    if (!reason) {
      alert('Please add a short note for “Other”.');
      return;
    }
    setSubmitting(true);
    try {
      await onConfirm(reason);
      setOtherDetail('');
      setPreset('Refused');
      onClose();
    } catch {
      // Stay open so the user can retry
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3 p-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Mark not taken</h2>
            <p className="text-sm text-gray-600 mt-1">{medicationName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <fieldset>
            <legend className="text-sm font-semibold text-gray-800 mb-2">Reason</legend>
            <div className="space-y-2">
              {NOT_TAKEN_PRESETS.map((p) => (
                <label
                  key={p}
                  className="flex items-center gap-2 text-sm text-gray-800 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="not-taken-reason"
                    checked={preset === p}
                    onChange={() => setPreset(p)}
                    className="accent-brand-600"
                  />
                  {p}
                </label>
              ))}
            </div>
          </fieldset>
          {preset === 'Other' && (
            <div>
              <label htmlFor="not-taken-other" className="block text-xs font-semibold text-gray-600 mb-1">
                Details (required)
              </label>
              <textarea
                id="not-taken-other"
                value={otherDetail}
                onChange={(e) => setOtherDetail(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="e.g. Left medication at home"
              />
            </div>
          )}
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
              disabled={submitting}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 disabled:opacity-60"
            >
              {submitting ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
