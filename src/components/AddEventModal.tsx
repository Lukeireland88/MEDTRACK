import { useEffect, useMemo, useState, type ComponentType } from 'react';
import { Angry, Annoyed, Frown, Laugh, Meh, Smile, SmilePlus, X, type LucideProps } from 'lucide-react';
import { toDateInputValue } from '../utils/dateUtils';

/** Simple crying face — Lucide has no Cry icon in our version. */
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
  measurementType: string | null;
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

const MEASUREMENT_TYPES: { id: string; label: string; placeholder?: string }[] = [
  { id: 'spo2', label: 'SpO₂', placeholder: 'e.g. 92%' },
  { id: 'pulse', label: 'Pulse', placeholder: 'e.g. 84 bpm' },
  { id: 'bp', label: 'Blood pressure', placeholder: 'e.g. 120/80' },
  { id: 'temp', label: 'Temperature', placeholder: 'e.g. 37.8°C' },
  { id: 'pain_score', label: 'Pain score', placeholder: 'e.g. 4 / 10' },
  { id: 'alertness', label: 'Alertness', placeholder: 'e.g. Alert / drowsy' },
];

type Template = {
  id: string;
  label: string;
  eventType: string;
  measurementType: string | null;
  title: string;
  valuePrefill?: string;
};

const TEMPLATES: Template[] = [
  { id: 'call-for-help', label: 'Call for help', eventType: 'note', measurementType: null, title: 'Call for help' },
  { id: 'out-of-hours-gp', label: 'Out-of-hours GP', eventType: 'visit', measurementType: null, title: 'Out-of-hours GP' },
  { id: 'pain-score', label: 'Pain score', eventType: 'measurement', measurementType: 'pain_score', title: 'Pain score', valuePrefill: '' },
  { id: 'alertness', label: 'Alertness', eventType: 'measurement', measurementType: 'alertness', title: 'Alertness', valuePrefill: '' },
  { id: 'spo2', label: 'SpO₂', eventType: 'measurement', measurementType: 'spo2', title: 'SpO₂', valuePrefill: '' },
  { id: 'bp', label: 'BP', eventType: 'measurement', measurementType: 'bp', title: 'Blood pressure', valuePrefill: '' },
  { id: 'temp', label: 'Temp', eventType: 'measurement', measurementType: 'temp', title: 'Temperature', valuePrefill: '' },
];

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

export default function AddEventModal({ isOpen, selectedDate, onClose, onConfirm }: AddEventModalProps) {
  const defaultDateTime = useMemo(() => {
    const now = new Date();
    const isSameDay = toDateInputValue(now) === toDateInputValue(selectedDate);
    return isSameDay ? now : selectedDate;
  }, [selectedDate]);

  const [occurredAtLocal, setOccurredAtLocal] = useState<string>(toDateTimeLocalValue(defaultDateTime));
  const [eventType, setEventType] = useState<string>('note');
  const [measurementType, setMeasurementType] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [valueText, setValueText] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setOccurredAtLocal(toDateTimeLocalValue(defaultDateTime));
    setEventType('note');
    setMeasurementType('');
    setTitle('');
    setValueText('');
    setNotes('');
    setSaving(false);
  }, [isOpen, defaultDateTime]);

  useEffect(() => {
    if (eventType !== 'measurement') {
      setMeasurementType('');
    }
  }, [eventType]);

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
        measurementType: eventType === 'measurement' && measurementType ? measurementType : null,
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
            <h2 className="text-lg font-bold text-gray-900">Add note / measurement</h2>
            <p className="text-sm text-gray-600 mt-1">Record a timestamped note, visit, or measurement (backdating supported).</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg" aria-label="Close">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <form onSubmit={submit} className="p-4 space-y-4">
          <div>
            <div className="overflow-x-auto -mx-1 px-1">
              <div className="flex flex-nowrap gap-2 min-w-max">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setEventType(t.eventType);
                    setMeasurementType(t.measurementType ?? '');
                    setTitle(t.title);
                    if (t.valuePrefill != null) setValueText(t.valuePrefill);
                  }}
                  className="px-3 py-1.5 text-xs rounded-full border border-gray-300 bg-white text-gray-800 hover:bg-gray-50 font-semibold"
                  title="Fill from template"
                >
                  {t.label}
                </button>
              ))}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">Quick templates (optional).</p>
          </div>

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
            {eventType === 'measurement' && (
              <div>
                <label htmlFor="event-measure-type" className="block text-xs font-semibold text-gray-600 mb-1">
                  Measurement type
                </label>
                <select
                  id="event-measure-type"
                  value={measurementType}
                  onChange={(e) => setMeasurementType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium bg-white"
                >
                  <option value="">Other</option>
                  {MEASUREMENT_TYPES.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {eventType === 'measurement' && (
            <div>
              <label htmlFor="event-value-measure" className="block text-xs font-semibold text-gray-600 mb-1">
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
                id="event-value-measure"
                value={valueText}
                onChange={(e) => setValueText(e.target.value)}
                placeholder={
                  MEASUREMENT_TYPES.find((m) => m.id === measurementType)?.placeholder ??
                  'e.g. 92%'
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          )}

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
              {saving ? 'Saving…' : 'Save note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

