import { supabase } from '../lib/supabase';
import type { MedicationWithSlots, TimeSlot } from '../types';
import { normalizeMedicationIcon } from './medicationIcons';
import { sortMedicationSlotNames } from './timeSlotUtils';

/** Load a single active medication with time slot names for edit flows (e.g. deep link from Settings). */
export async function fetchMedicationWithSlotsById(
  medId: string,
  slotDefinitions: TimeSlot[]
): Promise<MedicationWithSlots | null> {
  const legacyOrder = ['Morning', 'Lunch', 'Evening', 'Night'];
  const legacyDefaultHours = [0, 12, 15, 19];
  const orderForSort: TimeSlot[] =
    slotDefinitions.length > 0
      ? slotDefinitions
      : legacyOrder.map((name, i) => ({
          id: '',
          name,
          sort_order: i + 1,
          default_after_hour: legacyDefaultHours[i] ?? 12,
        }));

  const { data: med, error: medErr } = await supabase
    .from('medications')
    .select('*')
    .eq('id', medId)
    .eq('active', true)
    .maybeSingle();

  if (medErr || !med) return null;

  const { data: slotRows } = await supabase
    .from('medication_slots')
    .select(`time_slots (name)`)
    .eq('medication_id', medId);

  const names: string[] = [];
  slotRows?.forEach((row: any) => {
    const n = Array.isArray(row.time_slots)
      ? row.time_slots[0]?.name
      : row.time_slots?.name;
    if (n && !names.includes(n)) names.push(n);
  });
  const timeSlotNames = sortMedicationSlotNames(names, orderForSort);
  const dosingMode = (med.dosing_mode as MedicationWithSlots['dosing_mode']) ?? 'time_slots';
  const targetDoses = med.target_doses_per_day != null ? Number(med.target_doses_per_day) : null;

  return {
    ...med,
    dosing_mode: dosingMode,
    target_doses_per_day: targetDoses,
    icon: normalizeMedicationIcon(med.icon),
    time_slot_names: timeSlotNames,
    is_multiple: dosingMode === 'time_slots' && timeSlotNames.length > 1,
  };
}
