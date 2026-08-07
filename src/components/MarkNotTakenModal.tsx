import { useState, type FormEvent } from 'react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import { useToast } from '../contexts/ToastContext';

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
  const { showError } = useToast();
  const [preset, setPreset] = useState<NotTakenPreset>('Refused');
  const [otherDetail, setOtherDetail] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
      showError('Please add a short note for “Other”.');
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Mark not taken"
      description={medicationName}
      footer={
        <div className="flex flex-wrap gap-2 justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="mark-not-taken-form"
            disabled={submitting}
            className="!bg-amber-600 hover:!bg-amber-700 shadow-none"
          >
            {submitting ? 'Saving…' : 'Save'}
          </Button>
        </div>
      }
    >
      <form id="mark-not-taken-form" onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
        <fieldset>
          <legend className="text-sm font-semibold text-slate-800 mb-2">Reason</legend>
          <div className="space-y-2">
            {NOT_TAKEN_PRESETS.map((p) => (
              <label
                key={p}
                className="flex items-center gap-2 text-sm text-slate-800 cursor-pointer"
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
            <label htmlFor="not-taken-other" className="block text-xs font-semibold text-slate-600 mb-1">
              Details (required)
            </label>
            <textarea
              id="not-taken-other"
              value={otherDetail}
              onChange={(e) => setOtherDetail(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="e.g. Left medication at home"
            />
          </div>
        )}
      </form>
    </Modal>
  );
}
