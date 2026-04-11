import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, RotateCcw, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { MedicationWithSlots, TimeSlot } from '../types';
import { toDateKeyFromDb, toLocalDateKey } from '../utils/dateUtils';
import { sortMedicationSlotNames } from '../utils/timeSlotUtils';

interface EndedCoursesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EndedCoursesModal({ isOpen, onClose }: EndedCoursesModalProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [endedList, setEndedList] = useState<MedicationWithSlots[]>([]);
  const [loading, setLoading] = useState(true);
  const [restartingMedId, setRestartingMedId] = useState<string | null>(null);
  const [restartPromptMed, setRestartPromptMed] = useState<MedicationWithSlots | null>(null);
  const [restartNewStartDate, setRestartNewStartDate] = useState('');

  const load = useCallback(async () => {
    if (!user) {
      setEndedList([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data: defs } = await supabase
        .from('time_slots')
        .select('id, name, sort_order, default_after_hour')
        .order('sort_order', { ascending: true });
      const slotDefs = (defs as TimeSlot[]) ?? [];

      const legacyOrder = ['Morning', 'Lunch', 'Evening', 'Night'];
      const legacyDefaultHours = [0, 12, 15, 19];
      const orderForSort: TimeSlot[] =
        slotDefs.length > 0
          ? slotDefs
          : legacyOrder.map((name, i) => ({
              id: '',
              name,
              sort_order: i + 1,
              default_after_hour: legacyDefaultHours[i] ?? 12,
            }));

      const { data: allMeds, error: medsError } = await supabase
        .from('medications')
        .select('*')
        .eq('active', true);

      if (medsError || !allMeds?.length) {
        setEndedList([]);
        return;
      }

      const medIds = allMeds.map((m) => m.id);
      const { data: allSlots } = await supabase
        .from('medication_slots')
        .select(`medication_id, time_slots (name, id)`)
        .in('medication_id', medIds);

      const slotsByMed: Record<string, string[]> = {};
      allSlots?.forEach((slot: { medication_id: string; time_slots?: { name: string } | null }) => {
        const medId = slot.medication_id;
        const slotName = slot.time_slots?.name;
        if (!slotsByMed[medId]) slotsByMed[medId] = [];
        if (slotName && !slotsByMed[medId].includes(slotName)) {
          slotsByMed[medId].push(slotName);
        }
      });

      const viewingDate = toLocalDateKey(new Date());

      const mappedWithSlots: MedicationWithSlots[] = allMeds.map((med: Record<string, unknown>) => {
        const timeSlotNames = sortMedicationSlotNames(slotsByMed[med.id as string] || [], orderForSort);
        const dosingMode = (med.dosing_mode as MedicationWithSlots['dosing_mode']) ?? 'time_slots';
        const targetDoses =
          med.target_doses_per_day != null ? Number(med.target_doses_per_day) : null;

        return {
          ...med,
          dosing_mode: dosingMode,
          target_doses_per_day: targetDoses,
          time_slot_names: timeSlotNames,
          is_multiple: dosingMode === 'time_slots' && timeSlotNames.length > 1,
        } as MedicationWithSlots;
      });

      const endedResumable = mappedWithSlots
        .filter(
          (med) =>
            med.end_date != null && med.end_date !== '' && med.end_date < viewingDate
        )
        .sort((a, b) => a.name.localeCompare(b.name));

      setEndedList(endedResumable);
    } catch (e) {
      console.error(e);
      setEndedList([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (isOpen) void load();
  }, [isOpen, load]);

  useEffect(() => {
    if (!isOpen) {
      setRestartPromptMed(null);
      setRestartNewStartDate('');
    }
  }, [isOpen]);

  const handleRestartMedication = async (med: MedicationWithSlots, newStartDate: string) => {
    if (!user) return;
    setRestartingMedId(med.id);
    try {
      const { data: freshRow, error: freshErr } = await supabase
        .from('medications')
        .select('start_date, end_date')
        .eq('id', med.id)
        .single();

      if (freshErr) throw freshErr;

      const courseEnd = toDateKeyFromDb(freshRow?.end_date ?? null);
      const courseStartRaw = toDateKeyFromDb(freshRow?.start_date ?? null);
      const courseStart = courseStartRaw || courseEnd;

      if (courseEnd) {
        const { error: logError } = await supabase.from('medication_course_periods').insert({
          medication_id: med.id,
          start_date: courseStart,
          end_date: courseEnd,
          notes: 'Auto-logged (tracker restart)',
        });
        if (logError) throw logError;
      }

      const { error } = await supabase
        .from('medications')
        .update({ end_date: null, start_date: newStartDate || null })
        .eq('id', med.id);

      if (error) throw error;

      await load();
    } catch (error) {
      console.error('Error restarting medication:', error);
      alert('Failed to restart medication. Please try again.');
    } finally {
      setRestartingMedId(null);
    }
  };

  const openRestartPrompt = (med: MedicationWithSlots) => {
    setRestartPromptMed(med);
    setRestartNewStartDate(toLocalDateKey(new Date()));
  };

  const handleEdit = (med: MedicationWithSlots) => {
    onClose();
    navigate('/', { state: { editMedicationId: med.id } });
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div
          className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200/90"
          role="dialog"
          aria-labelledby="ended-courses-title"
          aria-modal="true"
        >
          <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3">
            <h2 id="ended-courses-title" className="text-lg font-bold text-slate-900">
              Ended courses
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <p className="border-b border-slate-100 px-4 py-2 text-sm text-slate-600">
            Medications with an end date before today. Restart a course (for example rescue meds or antibiotics) or
            open edit to change details before returning to the tracker.
          </p>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
            {!user ? (
              <p className="text-center text-sm text-slate-500">Sign in to manage ended courses.</p>
            ) : loading ? (
              <p className="text-center text-sm text-slate-500">Loading…</p>
            ) : endedList.length === 0 ? (
              <p className="text-center text-sm text-slate-600">
                No ended courses. When you set an end date on a medication and that date passes, it will appear
                here.
              </p>
            ) : (
              <ul className="space-y-2">
                {endedList.map((med) => (
                  <li
                    key={med.id}
                    className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50/80 p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 text-sm text-slate-800">
                      <span className="font-medium">{med.name}</span>
                      {med.end_date ? (
                        <span className="text-slate-500"> · ended {med.end_date}</span>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={restartingMedId === med.id}
                        onClick={() => openRestartPrompt(med)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
                      >
                        <RotateCcw className="h-4 w-4" />
                        {restartingMedId === med.id ? 'Restarting…' : 'Restart'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEdit(med)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {restartPromptMed && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200/90">
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 p-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Restart medication</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Choose the new start date. We’ll log the previous course to history using the old start/end dates.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRestartPromptMed(null)}
                className="rounded-lg p-2 hover:bg-slate-100"
                aria-label="Close"
              >
                <X className="h-5 w-5 text-slate-600" />
              </button>
            </div>

            <div className="space-y-4 p-4">
              <div className="text-sm text-slate-900">
                <span className="font-semibold">{restartPromptMed.name}</span>
              </div>
              <div>
                <label htmlFor="restart-start-ended-modal" className="mb-1 block text-xs font-semibold text-slate-600">
                  New start date
                </label>
                <input
                  id="restart-start-ended-modal"
                  type="date"
                  value={restartNewStartDate}
                  onChange={(e) => setRestartNewStartDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium"
                  required
                />
                <p className="mt-1 text-xs text-slate-500">
                  This updates the medication’s start date so repeat courses don’t keep the original start.
                </p>
              </div>

              <div className="flex flex-wrap justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRestartPromptMed(null)}
                  className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-800 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!restartNewStartDate || restartingMedId === restartPromptMed.id}
                  onClick={async () => {
                    const med = restartPromptMed;
                    const start = restartNewStartDate;
                    setRestartPromptMed(null);
                    await handleRestartMedication(med, start);
                  }}
                  className="rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
                >
                  {restartingMedId === restartPromptMed.id ? 'Restarting…' : 'Restart'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
