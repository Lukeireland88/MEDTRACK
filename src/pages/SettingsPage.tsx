import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Archive, ArrowLeft, ListOrdered, Pencil, Pill, Settings } from 'lucide-react';
import ManageTimeSlotsModal from '../components/ManageTimeSlotsModal';
import EndedCoursesModal from '../components/EndedCoursesModal';
import AuthModal from '../components/AuthModal';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { MedicationWithSlots, TimeSlot } from '../types';
import { sortMedicationSlotNames } from '../utils/timeSlotUtils';

export default function SettingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sessionsOpen, setSessionsOpen] = useState(false);
  const [endedCoursesOpen, setEndedCoursesOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [medications, setMedications] = useState<MedicationWithSlots[]>([]);
  const [loadingMeds, setLoadingMeds] = useState(false);
  const [medQuery, setMedQuery] = useState('');

  const loadMedications = useCallback(async () => {
    setLoadingMeds(true);
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
        setMedications([]);
        return;
      }

      const medIds = allMeds.map((m) => m.id);
      const { data: allSlots } = await supabase
        .from('medication_slots')
        .select(`medication_id, time_slots (name, id)`)
        .in('medication_id', medIds);

      const slotsByMed: Record<string, string[]> = {};
      allSlots?.forEach((slot: any) => {
        const medId = slot.medication_id;
        const slotName = Array.isArray(slot.time_slots)
          ? slot.time_slots[0]?.name
          : slot.time_slots?.name;
        if (!slotsByMed[medId]) slotsByMed[medId] = [];
        if (slotName && !slotsByMed[medId].includes(slotName)) {
          slotsByMed[medId].push(slotName);
        }
      });

      const mappedWithSlots: MedicationWithSlots[] = allMeds
        .map((med: Record<string, unknown>) => {
          const timeSlotNames = sortMedicationSlotNames(
            slotsByMed[med.id as string] || [],
            orderForSort
          );
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
        })
        .sort((a, b) => a.name.localeCompare(b.name));

      setMedications(mappedWithSlots);
    } catch (e) {
      console.error('Error loading medications for settings:', e);
      setMedications([]);
    } finally {
      setLoadingMeds(false);
    }
  }, []);

  useEffect(() => {
    void loadMedications();
  }, [loadMedications]);

  const filteredMeds = useMemo(() => {
    const q = medQuery.trim().toLowerCase();
    if (!q) return medications;
    return medications.filter((m) => {
      if (m.name.toLowerCase().includes(q)) return true;
      if (m.when_text?.toLowerCase().includes(q)) return true;
      if (m.time_slot_names?.some((s) => s.toLowerCase().includes(q))) return true;
      return false;
    });
  }, [medQuery, medications]);

  const handleEditMedicationFromSettings = (med: MedicationWithSlots) => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    navigate('/', { state: { editMedicationId: med.id } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100/95">
      <div className="mx-auto max-w-2xl px-2 py-3 sm:px-4 sm:py-6">
        <header className="mb-6">
          <Link
            to="/"
            className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-brand-800 transition-colors hover:text-brand-950"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to tracker
          </Link>
          <div className="flex items-start gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-800 text-white shadow-brand-sm sm:h-12 sm:w-12"
              aria-hidden
            >
              <Settings className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Settings</h1>
              <p className="mt-1 text-sm text-slate-600">Configure how Medication Tracker works for you.</p>
            </div>
          </div>
        </header>

        <ul className="space-y-3">
          <li>
            <button
              type="button"
              onClick={() => setSessionsOpen(true)}
              className="flex w-full items-start gap-4 rounded-2xl border border-slate-200/90 bg-white p-4 text-left shadow-brand-sm ring-1 ring-slate-200/80 transition-colors hover:border-slate-300 hover:bg-slate-50/80"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <ListOrdered className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-slate-900">Sessions</div>
                <p className="mt-0.5 text-sm text-slate-600">
                  Name and order day tabs (Morning, Lunch, Evening, …), set which tab opens first by time of day, and
                  add or remove sessions.
                </p>
                <span className="mt-2 inline-block text-sm font-semibold text-brand-700">Configure →</span>
              </div>
            </button>
          </li>
          <li>
            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-brand-sm ring-1 ring-slate-200/80">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  <Pill className="h-5 w-5" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="font-semibold text-slate-900">All medications</div>
                      <p className="mt-0.5 text-sm text-slate-600">
                        Edit any medication directly from Settings (no need to find it on today’s tracker tabs).
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void loadMedications()}
                      className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                      title="Refresh medication list"
                    >
                      Refresh
                    </button>
                  </div>

                  <div className="mt-3">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Search
                    </label>
                    <input
                      type="text"
                      value={medQuery}
                      onChange={(e) => setMedQuery(e.target.value)}
                      placeholder="Type a name, session, or schedule…"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium"
                    />
                  </div>

                  <div className="mt-3">
                    {loadingMeds ? (
                      <p className="text-sm text-slate-500">Loading…</p>
                    ) : filteredMeds.length === 0 ? (
                      <p className="text-sm text-slate-600">No medications found.</p>
                    ) : (
                      <ul className="space-y-2">
                        {filteredMeds.map((med) => (
                          <li
                            key={med.id}
                            className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50/80 p-3 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="min-w-0">
                              <div className="text-sm text-slate-900 font-semibold truncate">
                                {med.name}
                              </div>
                              <div className="mt-0.5 text-xs text-slate-600">
                                {med.when_text || '—'}
                                {med.dosing_mode === 'time_slots' && med.time_slot_names?.length ? (
                                  <span className="text-slate-500">
                                    {' '}
                                    · {med.time_slot_names.join(', ')}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                            <div className="flex shrink-0 gap-2">
                              <button
                                type="button"
                                onClick={() => handleEditMedicationFromSettings(med)}
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
                    {!loadingMeds && (
                      <p className="mt-2 text-xs text-slate-500">
                        Tip: “Edit” opens the medication editor on the tracker page.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </li>
          {user ? (
            <li>
              <button
                type="button"
                onClick={() => setEndedCoursesOpen(true)}
                className="flex w-full items-start gap-4 rounded-2xl border border-slate-200/90 bg-white p-4 text-left shadow-brand-sm ring-1 ring-slate-200/80 transition-colors hover:border-slate-300 hover:bg-slate-50/80"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  <Archive className="h-5 w-5" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-slate-900">Ended courses</div>
                  <p className="mt-0.5 text-sm text-slate-600">
                    Restart rescue meds or past antibiotic courses, or edit medications that are past their end date.
                  </p>
                  <span className="mt-2 inline-block text-sm font-semibold text-brand-700">Configure →</span>
                </div>
              </button>
            </li>
          ) : (
            <li>
              <div className="rounded-2xl border border-slate-200/90 bg-slate-50/80 p-4 text-sm text-slate-600">
                Sign in to manage ended courses.
              </div>
            </li>
          )}
        </ul>
      </div>

      <ManageTimeSlotsModal
        isOpen={sessionsOpen}
        onClose={() => setSessionsOpen(false)}
        onSaved={() => {
          /* Tracker reloads slot list on next visit; optional: could broadcast a custom event */
        }}
      />
      <EndedCoursesModal isOpen={endedCoursesOpen} onClose={() => setEndedCoursesOpen(false)} />
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
}
