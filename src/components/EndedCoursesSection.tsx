import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronRight, Pencil, RotateCcw, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { MedicationWithSlots, TimeSlot } from '../types';
import { toDateKeyFromDb, toLocalDateKey } from '../utils/dateUtils';
import { sortMedicationSlotNames } from '../utils/timeSlotUtils';

/**
 * Ended medication courses (restart / edit) — lives under Settings so the main tracker stays clean.
 */
export default function EndedCoursesSection() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [endedList, setEndedList] = useState<MedicationWithSlots[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(true);
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
    void load();
  }, [load]);

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
    navigate('/', { state: { editMedicationId: med.id } });
  };

  if (!user) {
    return (
      <li>
        <div className="rounded-2xl border border-slate-200/90 bg-slate-50/80 p-4 text-sm text-slate-600">
          Sign in to manage ended courses.
        </div>
      </li>
    );
  }

  if (loading) {
    return (
      <li>
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 text-sm text-slate-500">Loading…</div>
      </li>
    );
  }

  if (endedList.length === 0) {
    return null;
  }

  return (
    <li>
      <div className="overflow-hidden rounded-2xl border border-amber-200/90 bg-amber-50/90 shadow-sm ring-1 ring-amber-900/[0.06]">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left font-semibold text-amber-950"
          >
            <span>
              Ended courses ({endedList.length})
              <span className="ml-1.5 font-normal text-amber-800/90 text-sm">
                — restart rescue meds or past antibiotic courses
              </span>
            </span>
            {open ? (
              <ChevronDown className="h-5 w-5 shrink-0 text-amber-900" />
            ) : (
              <ChevronRight className="h-5 w-5 shrink-0 text-amber-900" />
            )}
          </button>
          {open && (
            <ul className="space-y-2 border-t border-amber-200/80 px-4 pb-4 pt-2">
              {endedList.map((med) => (
                <li
                  key={med.id}
                  className="flex flex-col gap-2 rounded-xl border border-amber-200/70 bg-white/80 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 text-sm text-gray-800">
                    <span className="font-medium">{med.name}</span>
                    {med.end_date ? (
                      <span className="text-gray-500"> · ended {med.end_date}</span>
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
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-semibold text-gray-800 hover:bg-gray-50"
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

      {restartPromptMed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-gray-200 p-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Restart medication</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Choose the new start date. We’ll log the previous course to history using the old start/end dates.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRestartPromptMed(null)}
                className="rounded-lg p-2 hover:bg-gray-100"
                aria-label="Close"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            <div className="space-y-4 p-4">
              <div className="text-sm text-gray-900">
                <span className="font-semibold">{restartPromptMed.name}</span>
              </div>
              <div>
                <label htmlFor="restart-start-settings" className="mb-1 block text-xs font-semibold text-gray-600">
                  New start date
                </label>
                <input
                  id="restart-start-settings"
                  type="date"
                  value={restartNewStartDate}
                  onChange={(e) => setRestartNewStartDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  This updates the medication’s start date so repeat courses don’t keep the original start.
                </p>
              </div>

              <div className="flex flex-wrap justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRestartPromptMed(null)}
                  className="rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gray-800 hover:bg-gray-50"
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
    </li>
  );
}
