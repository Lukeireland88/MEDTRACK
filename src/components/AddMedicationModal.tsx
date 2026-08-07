import { useState, useEffect } from 'react';
import { X, Trash2, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  DEFAULT_MEDICATION_ICON,
  MEDICATION_ICON_OPTIONS,
  normalizeMedicationIcon,
  type MedicationIconKey,
} from '../utils/medicationIcons';
import { useToast } from '../contexts/ToastContext';

interface AddMedicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (medication: MedicationFormData) => void;
  onDelete?: (medicationId: string) => void;
  editingMedication?: MedicationFormData | null;
  /** Session names from Settings (falls back to Morning/Lunch/Evening/Night if empty) */
  sessionOptions?: string[];
}

/** One row in the course start/end log (edit modal only). */
export interface MedicationCoursePeriodLogRow {
  startDate: string;
  endDate: string;
  notes: string;
}

/** One row in the pause from/until log (edit modal only; read-only). */
export interface MedicationPausePeriodLogRow {
  pauseStartDate: string;
  pauseEndDate: string;
  notes: string;
}

export interface MedicationFormData {
  id?: string;
  name: string;
  icon: MedicationIconKey;
  dosingMode: 'time_slots' | 'flexible_daily';
  timeSlots: string[];
  targetDosesPerDay: number | '';
  /** Optional safety ceiling over rolling 24h */
  maxDoses24h: number | '';
  /** Optional minimum gap between doses, in minutes */
  minIntervalMinutes: number | '';
  pattern: 'daily' | 'days_of_week' | 'every_n_days_from_start';
  daysOfWeek: number[];
  startDate: string;
  intervalDays: number;
  notes: string;
  endDate: string;
  pauseStartDate: string;
  pauseEndDate: string;
  /** Present when saving from the modal; historical courses for this med */
  coursePeriodLog?: MedicationCoursePeriodLogRow[];
}

const TIME_SLOTS = ['Morning', 'Lunch', 'Evening', 'Night'];
const DAYS_OF_WEEK = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 7, label: 'Sun' },
];

export default function AddMedicationModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  editingMedication,
  sessionOptions,
}: AddMedicationModalProps) {
  const { showError } = useToast();
  const [formData, setFormData] = useState<MedicationFormData>({
    name: '',
    icon: DEFAULT_MEDICATION_ICON,
    dosingMode: 'time_slots',
    timeSlots: [],
    targetDosesPerDay: '',
    maxDoses24h: '',
    minIntervalMinutes: '',
    pattern: 'daily',
    daysOfWeek: [],
    startDate: '',
    intervalDays: 1,
    notes: '',
    endDate: '',
    pauseStartDate: '',
    pauseEndDate: '',
  });
  const [coursePeriodLog, setCoursePeriodLog] = useState<MedicationCoursePeriodLogRow[]>([]);
  const [pausePeriodLog, setPausePeriodLog] = useState<MedicationPausePeriodLogRow[]>([]);
  const [dateErrors, setDateErrors] = useState<{
    endDate?: string;
    pauseEndDate?: string;
  }>({});
  const [showSafetyLimits, setShowSafetyLimits] = useState(false);
  const [showAdvancedSchedule, setShowAdvancedSchedule] = useState(false);

  useEffect(() => {
    if (editingMedication) {
      const { coursePeriodLog: _omit, ...rest } = editingMedication;
      setFormData({
        ...rest,
        icon: normalizeMedicationIcon(rest.icon),
        maxDoses24h: rest.maxDoses24h ?? '',
        minIntervalMinutes: rest.minIntervalMinutes ?? '',
      });
      setShowSafetyLimits(
        (rest.maxDoses24h !== '' && rest.maxDoses24h != null) ||
          (rest.minIntervalMinutes !== '' && rest.minIntervalMinutes != null)
      );
      setShowAdvancedSchedule(
        Boolean(rest.endDate || rest.pauseStartDate || rest.pauseEndDate)
      );
    } else {
      setFormData({
        name: '',
        icon: DEFAULT_MEDICATION_ICON,
        dosingMode: 'time_slots',
        timeSlots: [],
        targetDosesPerDay: '',
        maxDoses24h: '',
        minIntervalMinutes: '',
        pattern: 'daily',
        daysOfWeek: [],
        startDate: '',
        intervalDays: 1,
        notes: '',
        endDate: '',
        pauseStartDate: '',
        pauseEndDate: '',
      });
      setShowSafetyLimits(false);
      setShowAdvancedSchedule(false);
    }
    setDateErrors({});
  }, [editingMedication, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const medId = editingMedication?.id;
    if (!medId) {
      setCoursePeriodLog([]);
      setPausePeriodLog([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('medication_course_periods')
        .select('start_date, end_date, notes')
        .eq('medication_id', medId)
        .order('start_date', { ascending: false });

      if (cancelled) return;
      if (error) {
        console.error('Error loading course periods:', error);
        setCoursePeriodLog([]);
        return;
      }
      setCoursePeriodLog(
        (data || []).map((row) => ({
          startDate: row.start_date || '',
          endDate: row.end_date || '',
          notes: row.notes || '',
        }))
      );
      if ((data || []).length > 0) setShowAdvancedSchedule(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, editingMedication?.id]);

  useEffect(() => {
    if (!isOpen) return;
    const medId = editingMedication?.id;
    if (!medId) {
      setPausePeriodLog([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('medication_pause_periods')
        .select('pause_start_date, pause_end_date, notes')
        .eq('medication_id', medId)
        .order('pause_start_date', { ascending: false });

      if (cancelled) return;
      if (error) {
        console.error('Error loading pause periods:', error);
        setPausePeriodLog([]);
        return;
      }
      setPausePeriodLog(
        (data || []).map((row) => ({
          pauseStartDate: row.pause_start_date || '',
          pauseEndDate: row.pause_end_date || '',
          notes: row.notes || '',
        }))
      );
      if ((data || []).length > 0) setShowAdvancedSchedule(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, editingMedication?.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showError('Please enter a medication name.');
      return;
    }
    if (formData.dosingMode === 'time_slots' && formData.timeSlots.length === 0) {
      showError('Select at least one time of day, or switch to flexible daily dosing.');
      return;
    }
    if (formData.dosingMode === 'flexible_daily') {
      const n =
        formData.targetDosesPerDay === '' ? null : Number(formData.targetDosesPerDay);
      if (n != null && (Number.isNaN(n) || n < 1)) {
        showError('Target doses per day must be at least 1, or leave blank to track without a daily goal.');
        return;
      }
      if (formData.maxDoses24h !== '') {
        const maxN = Number(formData.maxDoses24h);
        if (Number.isNaN(maxN) || maxN < 1) {
          showError('Max doses in 24 hours must be at least 1, or leave blank.');
          return;
        }
      }
      if (formData.minIntervalMinutes !== '') {
        const minN = Number(formData.minIntervalMinutes);
        if (Number.isNaN(minN) || minN < 1) {
          showError('Minimum interval must be at least 1 minute, or leave blank.');
          return;
        }
      }
    }
    if ((formData.startDate && formData.endDate) && formData.startDate > formData.endDate) {
      showError('End date must be on or after the start date.');
      return;
    }
    if ((formData.pauseStartDate && formData.pauseEndDate) && formData.pauseStartDate > formData.pauseEndDate) {
      showError('Pause start date must be on or before the pause end date.');
      return;
    }

    const filledPeriods = coursePeriodLog.filter((r) => r.startDate.trim());
    for (const r of filledPeriods) {
      if (r.endDate.trim() && r.startDate > r.endDate) {
        showError('Course history: end date must be on or after start date for each row.');
        return;
      }
    }

    onSave({ ...formData, coursePeriodLog });
  };

  const toggleTimeSlot = (slot: string) => {
    setFormData((prev) => ({
      ...prev,
      timeSlots: prev.timeSlots.includes(slot)
        ? prev.timeSlots.filter((s) => s !== slot)
        : [...prev.timeSlots, slot],
    }));
  };

  const toggleDayOfWeek = (day: number) => {
    setFormData((prev) => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter((d) => d !== day)
        : [...prev.daysOfWeek, day],
    }));
  };

  if (!isOpen) return null;

  const sessionLabels = sessionOptions?.length ? sessionOptions : TIME_SLOTS;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        <div className="shrink-0 bg-white border-b border-gray-300 p-4 flex justify-between items-center rounded-t-2xl">
          <h2 className="text-xl font-bold">
            {editingMedication ? 'Edit medication' : 'Add medication'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-2">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Bumetanide"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Icon</label>
            <p className="text-xs text-gray-500 mb-2">
              Shown next to the name on the tracker (pill, capsule, inhaler, cream, and so on).
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 max-h-56 overflow-y-auto pr-0.5">
              {MEDICATION_ICON_OPTIONS.map(({ key, label, Icon }) => {
                const selected = formData.icon === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFormData({ ...formData, icon: key })}
                    className={`flex flex-col items-center gap-1 rounded-lg border px-2 py-2.5 text-center transition-colors ${
                      selected
                        ? 'border-brand-600 bg-brand-50 text-brand-900 ring-2 ring-brand-500/40'
                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                    title={label}
                    aria-pressed={selected}
                    aria-label={label}
                  >
                    <Icon className="w-5 h-5 shrink-0" aria-hidden />
                    <span className="text-[10px] sm:text-xs leading-tight font-medium line-clamp-2">
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">How to schedule</label>
            <div className="space-y-2">
              <label className="flex items-start gap-2 cursor-pointer p-2 rounded-lg border border-gray-200 hover:bg-gray-50">
                <input
                  type="radio"
                  name="dosingMode"
                  checked={formData.dosingMode === 'time_slots'}
                  onChange={() => setFormData({ ...formData, dosingMode: 'time_slots' })}
                  className="mt-1 accent-brand-600"
                />
                <span>
                  <span className="font-medium">Time-of-day sessions</span>
                  <span className="block text-sm text-gray-600">
                    One check per selected session (tabs at the top of the tracker).
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-2 cursor-pointer p-2 rounded-lg border border-gray-200 hover:bg-gray-50">
                <input
                  type="radio"
                  name="dosingMode"
                  checked={formData.dosingMode === 'flexible_daily'}
                  onChange={() => setFormData({ ...formData, dosingMode: 'flexible_daily' })}
                  className="mt-1 accent-brand-600"
                />
                <span>
                  <span className="font-medium">Flexible — multiple times per day</span>
                  <span className="block text-sm text-gray-600">
                    Log each dose with a timestamp; optional daily goal.
                  </span>
                </span>
              </label>
            </div>
          </div>

          {formData.dosingMode === 'time_slots' && (
            <div>
              <label className="block text-sm font-semibold mb-2">Sessions</label>
              <div className="grid grid-cols-2 gap-3">
                {sessionLabels.map((slot) => (
                  <label
                    key={slot}
                    className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-50 rounded-lg"
                  >
                    <input
                      type="checkbox"
                      checked={formData.timeSlots.includes(slot)}
                      onChange={() => toggleTimeSlot(slot)}
                      className="w-5 h-5 accent-brand-600"
                    />
                    <span>{slot}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {formData.dosingMode === 'flexible_daily' && (
            <div>
              <label className="block text-sm font-semibold mb-2">
                Target doses per day (optional)
              </label>
              <input
                type="number"
                min={1}
                placeholder="e.g. 4 — leave empty to only track count"
                value={formData.targetDosesPerDay === '' ? '' : formData.targetDosesPerDay}
                onChange={(e) => {
                  const v = e.target.value;
                  setFormData({
                    ...formData,
                    targetDosesPerDay: v === '' ? '' : parseInt(v, 10) || '',
                  });
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <p className="text-sm text-gray-600 mt-1">
                You can log more or fewer doses; this is just a daily goal for progress.
              </p>
            </div>
          )}

          {formData.dosingMode === 'flexible_daily' && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowSafetyLimits((v) => !v)}
                className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left"
                aria-expanded={showSafetyLimits}
              >
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Safety limits (optional)</h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Warn when a dose would exceed a max count or minimum gap.
                  </p>
                </div>
                <span className="text-slate-500 shrink-0" aria-hidden>
                  {showSafetyLimits ? '▾' : '▸'}
                </span>
              </button>
              {showSafetyLimits && (
              <div className="px-4 pb-4 space-y-4 border-t border-slate-200 pt-3">
              <div>
                <label className="block text-sm font-semibold mb-2" htmlFor="max-doses-24h">
                  Max doses in 24 hours
                </label>
                <input
                  id="max-doses-24h"
                  type="number"
                  min={1}
                  placeholder="e.g. 6 — leave empty for no maximum"
                  value={formData.maxDoses24h === '' ? '' : formData.maxDoses24h}
                  onChange={(e) => {
                    const v = e.target.value;
                    setFormData({
                      ...formData,
                      maxDoses24h: v === '' ? '' : parseInt(v, 10) || '',
                    });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" htmlFor="min-interval-hours">
                  Minimum hours between doses
                </label>
                <input
                  id="min-interval-hours"
                  type="number"
                  min={0.25}
                  step={0.25}
                  placeholder="e.g. 4 — leave empty for no minimum gap"
                  value={
                    formData.minIntervalMinutes === ''
                      ? ''
                      : Number((Number(formData.minIntervalMinutes) / 60).toFixed(2))
                  }
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === '') {
                      setFormData({ ...formData, minIntervalMinutes: '' });
                      return;
                    }
                    const hours = parseFloat(v);
                    if (Number.isNaN(hours) || hours <= 0) {
                      setFormData({ ...formData, minIntervalMinutes: '' });
                      return;
                    }
                    setFormData({
                      ...formData,
                      minIntervalMinutes: Math.max(1, Math.round(hours * 60)),
                    });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Stored in minutes
                  {formData.minIntervalMinutes !== ''
                    ? ` (${formData.minIntervalMinutes} min)`
                    : ''}
                  . Use decimals for partial hours (e.g. 0.5 = 30 minutes).
                </p>
              </div>
              </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold mb-2">Pattern</label>
            <select
              value={formData.pattern}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  pattern: e.target.value as MedicationFormData['pattern'],
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="daily">Daily</option>
              <option value="days_of_week">Specific days of week</option>
              <option value="every_n_days_from_start">Every N days</option>
            </select>
            <p className="text-sm text-gray-600 mt-1">Choose how often this appears.</p>
          </div>

          {formData.pattern === 'days_of_week' && (
            <div>
              <label className="block text-sm font-semibold mb-2">Select days</label>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDayOfWeek(day.value)}
                    className={`px-4 py-2 border rounded-lg font-semibold ${
                      formData.daysOfWeek.includes(day.value)
                        ? 'border-brand-600 bg-brand-50 text-brand-700'
                        : 'border-gray-300 bg-white text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {formData.pattern === 'every_n_days_from_start' && (
            <div>
              <label className="block text-sm font-semibold mb-2">
                Repeat every (days)
              </label>
              <input
                type="number"
                min="1"
                value={formData.intervalDays}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    intervalDays: parseInt(e.target.value) || 1,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold mb-2">
              Start date (optional)
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => {
                const nextStart = e.target.value;
                setFormData((prev) => {
                  const shouldClearEnd = prev.endDate && nextStart && prev.endDate < nextStart;
                  return {
                    ...prev,
                    startDate: nextStart,
                    endDate: shouldClearEnd ? '' : prev.endDate,
                  };
                });
                setDateErrors((prev) => ({
                  ...prev,
                  endDate: undefined,
                }));
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <p className="text-sm text-gray-600 mt-1">
              When you started taking this medication.
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Notes (optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any extra info..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>

          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowAdvancedSchedule((v) => !v)}
              className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left bg-slate-50/80"
              aria-expanded={showAdvancedSchedule}
            >
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Course end, pause &amp; history
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Optional end date, pause range, and past course logs.
                </p>
              </div>
              <span className="text-slate-500 shrink-0" aria-hidden>
                {showAdvancedSchedule ? '▾' : '▸'}
              </span>
            </button>
            {showAdvancedSchedule && (
            <div className="space-y-6 p-4 border-t border-slate-200">

          <div>
            <label className="block text-sm font-semibold mb-2">
              End date (optional)
            </label>
            <input
              type="date"
              value={formData.endDate}
              min={formData.startDate || undefined}
              onChange={(e) => {
                const nextEnd = e.target.value;
                if (formData.startDate && nextEnd && nextEnd < formData.startDate) {
                  setDateErrors((prev) => ({
                    ...prev,
                    endDate: 'End date must be on or after the start date.',
                  }));
                  return;
                }
                setDateErrors((prev) => ({ ...prev, endDate: undefined }));
                setFormData({ ...formData, endDate: nextEnd });
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            {dateErrors.endDate && (
              <p className="text-sm text-red-600 mt-1">{dateErrors.endDate}</p>
            )}
            <p className="text-sm text-gray-600 mt-1">
              Medication will no longer appear after this date.
            </p>
          </div>

          {editingMedication?.id && (
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/90">
              <h3 className="text-sm font-semibold text-slate-900 mb-1">
                Course history (start / end)
              </h3>
              <p className="text-sm text-slate-600 mb-3">
                Record past courses for meds that stop and restart. This is a separate log from the
                start and end dates above, which control the active schedule on the tracker.
              </p>
              {coursePeriodLog.length === 0 ? (
                <p className="text-sm text-gray-500 mb-3">No past courses logged yet.</p>
              ) : (
                <ul className="space-y-3 mb-3">
                  {coursePeriodLog.map((row, index) => (
                    <li
                      key={index}
                      className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end border border-gray-200 rounded-lg p-3 bg-white"
                    >
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                          Start
                        </label>
                        <input
                          type="date"
                          value={row.startDate}
                          onChange={(e) => {
                            const next = [...coursePeriodLog];
                            next[index] = { ...next[index], startDate: e.target.value };
                            setCoursePeriodLog(next);
                          }}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                          End (optional)
                        </label>
                        <input
                          type="date"
                          value={row.endDate}
                          onChange={(e) => {
                            const next = [...coursePeriodLog];
                            next[index] = { ...next[index], endDate: e.target.value };
                            setCoursePeriodLog(next);
                          }}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                      <div className="sm:col-span-1 col-span-1">
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                          Notes
                        </label>
                        <input
                          type="text"
                          value={row.notes}
                          onChange={(e) => {
                            const next = [...coursePeriodLog];
                            next[index] = { ...next[index], notes: e.target.value };
                            setCoursePeriodLog(next);
                          }}
                          placeholder="e.g. 7-day course"
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                      <div className="flex justify-end sm:justify-center pb-0.5">
                        <button
                          type="button"
                          onClick={() =>
                            setCoursePeriodLog(coursePeriodLog.filter((_, i) => i !== index))
                          }
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          aria-label="Remove row"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <button
                type="button"
                onClick={() =>
                  setCoursePeriodLog([
                    ...coursePeriodLog,
                    { startDate: '', endDate: '', notes: '' },
                  ])
                }
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-brand-800 border border-brand-200 rounded-lg hover:bg-brand-50"
              >
                <Plus className="w-4 h-4" />
                Add course row
              </button>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold mb-2">
              Pause date range (optional)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Pause from
                </label>
                <input
                  type="date"
                  value={formData.pauseStartDate}
                  onChange={(e) => {
                    const nextPauseStart = e.target.value;
                    setFormData((prev) => {
                      const shouldClearPauseEnd =
                        prev.pauseEndDate && nextPauseStart && prev.pauseEndDate < nextPauseStart;
                      return {
                        ...prev,
                        pauseStartDate: nextPauseStart,
                        pauseEndDate: shouldClearPauseEnd ? '' : prev.pauseEndDate,
                      };
                    });
                    setDateErrors((prev) => ({
                      ...prev,
                      pauseEndDate: undefined,
                    }));
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Pause until
                </label>
                <input
                  type="date"
                  value={formData.pauseEndDate}
                  min={formData.pauseStartDate || undefined}
                  onChange={(e) => {
                    const nextPauseEnd = e.target.value;
                    if (
                      formData.pauseStartDate &&
                      nextPauseEnd &&
                      nextPauseEnd < formData.pauseStartDate
                    ) {
                      setDateErrors((prev) => ({
                        ...prev,
                        pauseEndDate: 'Pause until must be on or after pause from.',
                      }));
                      return;
                    }
                    setDateErrors((prev) => ({ ...prev, pauseEndDate: undefined }));
                    setFormData({ ...formData, pauseEndDate: nextPauseEnd });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
            {dateErrors.pauseEndDate && (
              <p className="text-sm text-red-600 mt-2">{dateErrors.pauseEndDate}</p>
            )}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <button
                type="button"
                onClick={() => {
                  setFormData({ ...formData, pauseStartDate: '', pauseEndDate: '' });
                  setDateErrors((prev) => ({ ...prev, pauseEndDate: undefined }));
                }}
                className="px-3 py-1.5 text-xs rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Clear pause
              </button>
              <p className="text-sm text-gray-600">
                While paused, this medication appears greyed out and cannot be checked/logged.
              </p>
            </div>
          </div>

          {editingMedication?.id && (
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/90">
              <h3 className="text-sm font-semibold text-slate-900 mb-1">
                Pause history (from / until)
              </h3>
              <p className="text-sm text-slate-600 mb-3">
                Automatically logged when you clear an active pause early, or when a pause-until date has passed.
              </p>
              {pausePeriodLog.length === 0 ? (
                <p className="text-sm text-gray-500">No pause history logged yet.</p>
              ) : (
                <ul className="space-y-2">
                  {pausePeriodLog.map((row, index) => (
                    <li
                      key={`${row.pauseStartDate}-${row.pauseEndDate}-${index}`}
                      className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_2fr] gap-2 items-end border border-gray-200 rounded-lg p-3 bg-white"
                    >
                      <div>
                        <div className="block text-xs font-semibold text-gray-600 mb-1">From</div>
                        <div className="text-sm text-slate-900">{row.pauseStartDate || '—'}</div>
                      </div>
                      <div>
                        <div className="block text-xs font-semibold text-gray-600 mb-1">Until</div>
                        <div className="text-sm text-slate-900">{row.pauseEndDate || '—'}</div>
                      </div>
                      <div>
                        <div className="block text-xs font-semibold text-gray-600 mb-1">Notes</div>
                        <div className="text-sm text-slate-700">{row.notes || '—'}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
            </div>
            )}
          </div>
          </div>

          <div className="shrink-0 border-t border-gray-200 bg-white px-4 py-3 sm:px-6 flex justify-between items-center gap-3 rounded-b-2xl">
            {editingMedication && onDelete && (
              <button
                type="button"
                onClick={() => {
                  if (
                    confirm(
                      `Are you sure you want to delete ${formData.name}? This cannot be undone.`
                    )
                  ) {
                    onDelete(editingMedication.id!);
                  }
                }}
                className="px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700"
              >
                Delete
              </button>
            )}
            <div className="flex gap-3 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-brand-600 text-white rounded-xl font-semibold hover:bg-brand-700 shadow-brand-sm"
              >
                Save
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
