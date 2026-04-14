import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, Pill, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { MedicationWithSlots, TimeSlot } from '../types';
import { sortMedicationSlotNames } from '../utils/timeSlotUtils';

interface AllMedicationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  signedIn: boolean;
  onRequireSignIn: () => void;
}

export default function AllMedicationsModal({
  isOpen,
  onClose,
  signedIn,
  onRequireSignIn,
}: AllMedicationsModalProps) {
  const navigate = useNavigate();
  const [medications, setMedications] = useState<MedicationWithSlots[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
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
      console.error('Error loading medications:', e);
      setMedications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    void load();
  }, [isOpen, load]);

  useEffect(() => {
    if (!isOpen) setQuery('');
  }, [isOpen]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return medications;
    return medications.filter((m) => {
      if (m.name.toLowerCase().includes(q)) return true;
      if (m.when_text?.toLowerCase().includes(q)) return true;
      if (m.time_slot_names?.some((s) => s.toLowerCase().includes(q))) return true;
      return false;
    });
  }, [query, medications]);

  const onEdit = (med: MedicationWithSlots) => {
    if (!signedIn) {
      onRequireSignIn();
      return;
    }
    onClose();
    navigate('/', { state: { editMedicationId: med.id } });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200/90"
        role="dialog"
        aria-labelledby="all-meds-title"
        aria-modal="true"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <Pill className="h-5 w-5 text-slate-700" aria-hidden />
            <h2 id="all-meds-title" className="text-lg font-bold text-slate-900">
              All medications
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="shrink-0 border-b border-slate-100 px-4 py-3">
          <label className="block text-xs font-semibold text-slate-600 mb-1">Search</label>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a name, session, or schedule…"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium"
          />
          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="text-xs text-slate-500">
              {loading ? 'Loading…' : `${filtered.length} medication${filtered.length === 1 ? '' : 's'}`}
            </div>
            <button
              type="button"
              onClick={() => void load()}
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50"
              title="Refresh medication list"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          {loading ? (
            <p className="text-sm text-slate-500 text-center py-6">Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-slate-600 text-center py-6">No medications found.</p>
          ) : (
            <ul className="space-y-2">
              {filtered.map((med) => (
                <li
                  key={med.id}
                  className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50/80 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="text-sm text-slate-900 font-semibold truncate">{med.name}</div>
                    <div className="mt-0.5 text-xs text-slate-600">
                      {med.when_text || '—'}
                      {med.dosing_mode === 'time_slots' && med.time_slot_names?.length ? (
                        <span className="text-slate-500"> · {med.time_slot_names.join(', ')}</span>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(med)}
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
  );
}
