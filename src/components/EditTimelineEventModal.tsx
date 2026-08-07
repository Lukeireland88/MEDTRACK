import { useEffect, useMemo, useState, type ComponentType } from 'react';
import { Angry, Annoyed, Frown, Laugh, Meh, Smile, SmilePlus, type LucideProps } from 'lucide-react';
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

function CryingFace({ className, strokeWidth = 2, ...props }: LucideProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M8 15c1.2-1.2 2.5-1.8 4-1.8s2.8.6 4 1.8" />
      <path d="M9 9.2h.01" />
      <path d="M15 9.2h.01" />
      <path d="M8.2 12.5c0 1.2-.6 2.3-1.4 2.8" />
      <path d="M15.8 12.5c0 1.2.6 2.3 1.4 2.8" />
    </svg>
  );
}

const PAIN_SCORE_OPTIONS: {
  score: string;
  Face: ComponentType<LucideProps>;
  faceClass: string;
}[] = [
  { score: '0', Face: Laugh, faceClass: 'text-emerald-600' },
  { score: '1', Face: SmilePlus, faceClass: 'text-emerald-600' },
  { score: '2', Face: Smile, faceClass: 'text-lime-600' },
  { score: '3', Face: Smile, faceClass: 'text-lime-600' },
  { score: '4', Face: Meh, faceClass: 'text-amber-500' },
  { score: '5', Face: Meh, faceClass: 'text-amber-600' },
  { score: '6', Face: Frown, faceClass: 'text-orange-500' },
  { score: '7', Face: Frown, faceClass: 'text-orange-600' },
  { score: '8', Face: Annoyed, faceClass: 'text-rose-500' },
  { score: '9', Face: Angry, faceClass: 'text-rose-600' },
  { score: '10', Face: CryingFace, faceClass: 'text-rose-700' },
];

const ALERTNESS_OPTIONS = [
  { value: 'Alert', label: 'Alert' },
  { value: 'Drowsy', label: 'Drowsy' },
  { value: 'Confused', label: 'Confused' },
  { value: 'Responds to voice', label: 'Voice' },
  { value: 'Responds to pain', label: 'Pain' },
  { value: 'Unresponsive', label: 'Unresponsive' },
];

export type EditTimelineEventInitial = {
  id: string;
  occurredAtIso: string;
  title: string;
  notes: string | null;
  valueText: string | null;
  eventType: string | null;
  measurementType: string | null;
};

export type EditTimelineEventPayload = {
  occurredAtIso: string;
  eventDate: string;
  notes: string | null;
  valueText: string | null;
};

interface EditTimelineEventModalProps {
  isOpen: boolean;
  initial: EditTimelineEventInitial | null;
  onClose: () => void;
  onConfirm: (payload: EditTimelineEventPayload) => void | Promise<void>;
}

export default function EditTimelineEventModal({ isOpen, initial, onClose, onConfirm }: EditTimelineEventModalProps) {
  const { showError } = useToast();
  const defaultDate = useMemo(() => {
    if (!initial) return new Date();
    const d = new Date(initial.occurredAtIso);
    return Number.isNaN(d.getTime()) ? new Date() : d;
  }, [initial]);

  const [occurredAtLocal, setOccurredAtLocal] = useState<string>(toDateTimeLocalValue(defaultDate));
  const [notes, setNotes] = useState<string>(initial?.notes ?? '');
  const [valueText, setValueText] = useState<string>(initial?.valueText ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen || !initial) return;
    setOccurredAtLocal(toDateTimeLocalValue(defaultDate));
    setNotes(initial.notes ?? '');
    setValueText(initial.valueText ?? '');
    setSaving(false);
  }, [isOpen, initial, defaultDate]);

  const isMeasurement = initial?.eventType === 'measurement';
  const measurementType = initial?.measurementType ?? '';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!initial) return;
    const occurredAt = new Date(occurredAtLocal);
    if (Number.isNaN(occurredAt.getTime())) {
      showError('Please enter a valid date/time.');
      return;
    }

    const eventDate = toDateInputValue(new Date(occurredAt.getFullYear(), occurredAt.getMonth(), occurredAt.getDate()));

    setSaving(true);
    try {
      await onConfirm({
        occurredAtIso: occurredAt.toISOString(),
        eventDate,
        notes: notes.trim() ? notes.trim() : null,
        valueText: valueText.trim() ? valueText.trim() : null,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen && !!initial}
      onClose={onClose}
      size="md"
      title="Edit note"
      description={initial?.title}
      footer={
        <div className="flex flex-wrap gap-2 justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="edit-timeline-form" disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      }
    >
        <form id="edit-timeline-form" onSubmit={submit} className="p-4 sm:p-5 space-y-4">
          <div>
            <label htmlFor="edit-event-occurred" className="block text-xs font-semibold text-slate-600 mb-1">
              When
            </label>
            <input
              id="edit-event-occurred"
              type="datetime-local"
              value={occurredAtLocal}
              onChange={(e) => setOccurredAtLocal(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-medium"
              required
            />
            <p className="text-xs text-slate-500 mt-1">Changing this also updates the stored event date.</p>
          </div>

          {isMeasurement && (
            <div>
              <label htmlFor="edit-event-value" className="block text-xs font-semibold text-gray-600 mb-1">
                Value (optional)
              </label>
              {measurementType === 'pain_score' && (
                <div className="mb-2 flex flex-wrap gap-1.5" role="group" aria-label="Pain score 0 to 10">
                  {PAIN_SCORE_OPTIONS.map(({ score, Face, faceClass }) => {
                    const selected = valueText === `${score}/10` || valueText === score;
                    return (
                      <button
                        key={score}
                        type="button"
                        onClick={() => setValueText(`${score}/10`)}
                        className={`inline-flex min-w-[2.5rem] flex-col items-center gap-0.5 px-1.5 py-1.5 text-sm font-semibold rounded-lg border transition-colors ${
                          selected
                            ? 'border-brand-600 bg-brand-50 text-brand-900'
                            : 'border-gray-300 bg-white text-gray-800 hover:bg-gray-50'
                        }`}
                        aria-label={`Pain score ${score} out of 10`}
                        title={`${score} / 10`}
                      >
                        <Face
                          className={`w-5 h-5 ${selected ? 'text-brand-700' : faceClass}`}
                          strokeWidth={2}
                          aria-hidden
                        />
                        <span className="leading-none tabular-nums">{score}</span>
                      </button>
                    );
                  })}
                </div>
              )}
              {measurementType === 'alertness' && (
                <div className="mb-2 flex flex-wrap gap-1.5" role="group" aria-label="Alertness">
                  {ALERTNESS_OPTIONS.map((opt) => {
                    const selected = valueText === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setValueText(opt.value)}
                        className={`px-2.5 py-1.5 text-xs sm:text-sm font-semibold rounded-lg border transition-colors ${
                          selected
                            ? 'border-brand-600 bg-brand-50 text-brand-900'
                            : 'border-gray-300 bg-white text-gray-800 hover:bg-gray-50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              )}
              <input
                id="edit-event-value"
                value={valueText}
                onChange={(e) => setValueText(e.target.value)}
                placeholder="e.g. 92% or 120/80"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          )}

          <div>
            <label htmlFor="edit-event-notes" className="block text-xs font-semibold text-slate-600 mb-1">
              Notes (optional)
            </label>
            <textarea
              id="edit-event-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
              placeholder="Details to remember later…"
            />
          </div>
        </form>
    </Modal>
  );
}
