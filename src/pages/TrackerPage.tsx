import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, LogIn, LogOut, ClipboardList, Pill } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { DosingMode, MedicationDoseEvent, MedicationWithSlots, SlotDoseState, TimeSlot } from '../types';
import {
  getDefaultTimeSlot,
  toLocalDateKey,
  toLocalDateOnly,
} from '../utils/dateUtils';
import { fetchMedicationWithSlotsById } from '../utils/fetchMedicationWithSlots';
import {
  getDefaultTimeSlotFromOrder,
  pickDefaultSessionForHour,
  sortMedicationSlotNames,
} from '../utils/timeSlotUtils';
import { useAuth } from '../contexts/AuthContext';
import DateNav from '../components/DateNav';
import TimeSlotPicker from '../components/TimeSlotPicker';
import MedTable from '../components/MedTable';
import Notices from '../components/Notices';
import AddMedicationModal, { MedicationFormData } from '../components/AddMedicationModal';
import MedicationHistoryModal from '../components/MedicationHistoryModal';
import AuthModal from '../components/AuthModal';
import MarkNotTakenModal from '../components/MarkNotTakenModal';
import LogSeizureModal from '../components/LogSeizureModal';
import AddEventModal, { AddEventPayload } from '../components/AddEventModal';
import AddLogPickerModal from '../components/AddLogPickerModal';

export default function TrackerPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(toLocalDateOnly(new Date()));
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>(getDefaultTimeSlot());
  const [slotDefinitions, setSlotDefinitions] = useState<TimeSlot[]>([]);
  const [selectedTimeSlotId, setSelectedTimeSlotId] = useState<string>('');
  const [medications, setMedications] = useState<MedicationWithSlots[]>([]);
  const [slotDoseByMedId, setSlotDoseByMedId] = useState<Record<string, SlotDoseState>>({});
  const [markNotTakenMedId, setMarkNotTakenMedId] = useState<string | null>(null);
  const [flexibleDoseEvents, setFlexibleDoseEvents] = useState<
    Record<string, Pick<MedicationDoseEvent, 'id' | 'taken_at'>[]>
  >({});
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [editingMedication, setEditingMedication] = useState<MedicationFormData | null>(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyMedicationId, setHistoryMedicationId] = useState<string>('');
  const [historyMedicationName, setHistoryMedicationName] = useState<string>('');
  const [historyDosingMode, setHistoryDosingMode] = useState<DosingMode>('time_slots');
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [addLogPickerOpen, setAddLogPickerOpen] = useState(false);
  const [logSeizureOpen, setLogSeizureOpen] = useState(false);
  const [addEventOpen, setAddEventOpen] = useState(false);

  const refreshSlotDefinitions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('time_slots')
        .select('id, name, sort_order, default_after_hour')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      const defs = (data as TimeSlot[]) ?? [];
      setSlotDefinitions(defs);
      const names = defs.map((d) => d.name);
      if (names.length > 0) {
        setSelectedTimeSlot((prev) => {
          if (names.includes(prev)) return prev;
          return pickDefaultSessionForHour(defs, names);
        });
      }
    } catch (e) {
      console.error('Error loading time slots:', e);
    }
  }, []);

  useEffect(() => {
    void refreshSlotDefinitions();
  }, [refreshSlotDefinitions]);

  useEffect(() => {
    loadMedications();
    loadTakenStatus();
  }, [selectedTimeSlot, selectedDate, slotDefinitions]);

  const loadTakenStatus = async () => {
    try {
      const { data: timeSlot } = await supabase
        .from('time_slots')
        .select('id')
        .eq('name', selectedTimeSlot)
        .maybeSingle();

      if (!timeSlot) {
        setSlotDoseByMedId({});
        return;
      }

      const dateString = toLocalDateKey(selectedDate);

      const { data: dosesTaken } = await supabase
        .from('doses_taken')
        .select('medication_id, taken, not_taken_reason')
        .eq('time_slot_id', timeSlot.id)
        .eq('dose_date', dateString);

      const statusMap: Record<string, SlotDoseState> = {};
      dosesTaken?.forEach((dose: { medication_id: string; taken: boolean; not_taken_reason: string | null }) => {
        statusMap[dose.medication_id] = {
          taken: dose.taken,
          notTakenReason: dose.not_taken_reason ?? null,
        };
      });

      setSlotDoseByMedId(statusMap);
    } catch (error) {
      console.error('Error loading taken status:', error);
    }
  };

  const loadMedications = async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    try {
      // Load ALL active medications
      const { data: allMeds, error: medsError } = await supabase
        .from('medications')
        .select('*')
        .eq('active', true);

      if (medsError) {
        console.error('Error loading medications:', medsError);
        setMedications([]);
        setFlexibleDoseEvents({});
        if (!opts?.silent) setLoading(false);
        return;
      }

      if (!allMeds || allMeds.length === 0) {
        setMedications([]);
        setAvailableTimeSlots([]);
        setFlexibleDoseEvents({});
        if (!opts?.silent) setLoading(false);
        return;
      }

      const medIds = allMeds.map(m => m.id);

      // Load all time slots for all medications
      const { data: allSlots } = await supabase
        .from('medication_slots')
        .select(`
          medication_id,
          time_slots (name, id)
        `)
        .in('medication_id', medIds);

      const slotsByMed: Record<string, string[]> = {};
      allSlots?.forEach((slot: any) => {
        const medId = slot.medication_id;
        const slotName = slot.time_slots?.name;
        if (!slotsByMed[medId]) {
          slotsByMed[medId] = [];
        }
        if (slotName && !slotsByMed[medId].includes(slotName)) {
          slotsByMed[medId].push(slotName);
        }
      });

      const viewingDate = toLocalDateKey(selectedDate);
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

      // Create medication objects with time slots (before hiding ended / future-start)
      const mappedWithSlots: MedicationWithSlots[] = allMeds.map((med: any) => {
        const timeSlotNames = sortMedicationSlotNames(slotsByMed[med.id] || [], orderForSort);

        const dosingMode = (med.dosing_mode as MedicationWithSlots['dosing_mode']) ?? 'time_slots';
        const targetDoses =
          med.target_doses_per_day != null ? Number(med.target_doses_per_day) : null;

        return {
          ...med,
          dosing_mode: dosingMode,
          target_doses_per_day: targetDoses,
          time_slot_names: timeSlotNames,
          is_multiple: dosingMode === 'time_slots' && timeSlotNames.length > 1,
        };
      });

      const allMedsWithSlots: MedicationWithSlots[] = mappedWithSlots
        .filter((med: any) => {
          if (med.start_date && med.start_date > viewingDate) return false;
          if (med.end_date && med.end_date < viewingDate) return false;
          return true;
        })
        .sort((a: any, b: any) => a.name.localeCompare(b.name));

      // Tabs: only sessions that have at least one medication (hide empty sessions).
      // If only flexible-daily meds exist, show all configured sessions so tabs stay usable.
      const activeTimeSlots = new Set<string>();
      allMedsWithSlots.forEach((med: any) => {
        med.time_slot_names.forEach((slot: string) => activeTimeSlots.add(slot));
      });
      const hasFlexibleDaily = allMedsWithSlots.some(
        (m: MedicationWithSlots) => m.dosing_mode === 'flexible_daily'
      );
      const orderNames =
        slotDefinitions.length > 0
          ? slotDefinitions.map((s) => s.name)
          : legacyOrder;
      let sortedSlots = orderNames.filter((slot) => activeTimeSlots.has(slot));
      if (sortedSlots.length === 0 && hasFlexibleDaily) {
        sortedSlots = [...orderNames];
      }
      setAvailableTimeSlots(sortedSlots);

      // Reset selected tab if hidden; otherwise pick default by time of day (configurable per session).
      if (sortedSlots.length > 0 && !sortedSlots.includes(selectedTimeSlot)) {
        setSelectedTimeSlot(
          slotDefinitions.length > 0
            ? pickDefaultSessionForHour(slotDefinitions, sortedSlots)
            : getDefaultTimeSlotFromOrder(sortedSlots)
        );
      }

      // Time-slot meds for this tab; flexible meds appear on every tab
      const medsForSelectedSlot = allMedsWithSlots.filter((med: any) => {
        if (med.dosing_mode === 'flexible_daily') return true;
        return med.time_slot_names.includes(selectedTimeSlot);
      });

      setMedications(medsForSelectedSlot);

      const flexibleIds = allMedsWithSlots
        .filter((m: MedicationWithSlots) => m.dosing_mode === 'flexible_daily')
        .map((m: MedicationWithSlots) => m.id);

      if (flexibleIds.length > 0) {
        const { data: doseRows } = await supabase
          .from('medication_dose_events')
          .select('id, medication_id, taken_at')
          .in('medication_id', flexibleIds)
          .eq('dose_date', viewingDate)
          .order('taken_at', { ascending: true });

        const byMed: Record<string, Pick<MedicationDoseEvent, 'id' | 'taken_at'>[]> = {};
        flexibleIds.forEach((id) => {
          byMed[id] = [];
        });
        doseRows?.forEach((row: { id: string; medication_id: string; taken_at: string }) => {
          if (!byMed[row.medication_id]) byMed[row.medication_id] = [];
          byMed[row.medication_id].push({ id: row.id, taken_at: row.taken_at });
        });
        setFlexibleDoseEvents(byMed);
      } else {
        setFlexibleDoseEvents({});
      }

      // Update selectedTimeSlotId for the current time slot
      const { data: timeSlot } = await supabase
        .from('time_slots')
        .select('id')
        .eq('name', selectedTimeSlot)
        .maybeSingle();

      setSelectedTimeSlotId(timeSlot?.id || '');
    } catch (error) {
      console.error('Error loading medications:', error);
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  };

  const handleToggleTaken = async (medId: string) => {
    try {
      const { data: timeSlot } = await supabase
        .from('time_slots')
        .select('id')
        .eq('name', selectedTimeSlot)
        .maybeSingle();

      if (!timeSlot) return;

      const dateString = toLocalDateKey(selectedDate);
      const row = slotDoseByMedId[medId];
      const currentlyTaken = row?.taken === true;
      const newTakenValue = !currentlyTaken;

      if (newTakenValue) {
        const { error: upsertError } = await supabase
          .from('doses_taken')
          .upsert(
            {
              medication_id: medId,
              time_slot_id: timeSlot.id,
              dose_date: dateString,
              taken: true,
              not_taken_reason: null,
              taken_at: new Date().toISOString(),
            },
            {
              onConflict: 'medication_id,time_slot_id,dose_date',
            }
          );
        if (upsertError) throw upsertError;

        const { error: clearLogsError } = await supabase
          .from('medication_logs')
          .delete()
          .eq('medication_id', medId)
          .eq('time_slot_id', timeSlot.id)
          .eq('dose_date', dateString);
        if (clearLogsError) throw clearLogsError;

        const { error: logError } = await supabase.from('medication_logs').insert({
          medication_id: medId,
          time_slot_id: timeSlot.id,
          dose_date: dateString,
          action: 'checked',
        });
        if (logError) throw logError;

        setSlotDoseByMedId((prev) => ({
          ...prev,
          [medId]: { taken: true, notTakenReason: null },
        }));
      } else {
        const { error: delDoseError } = await supabase
          .from('doses_taken')
          .delete()
          .eq('medication_id', medId)
          .eq('time_slot_id', timeSlot.id)
          .eq('dose_date', dateString);
        if (delDoseError) throw delDoseError;

        const { error: clearLogsError } = await supabase
          .from('medication_logs')
          .delete()
          .eq('medication_id', medId)
          .eq('time_slot_id', timeSlot.id)
          .eq('dose_date', dateString);
        if (clearLogsError) throw clearLogsError;

        setSlotDoseByMedId((prev) => {
          const next = { ...prev };
          delete next[medId];
          return next;
        });
      }
    } catch (error) {
      console.error('Error toggling taken status:', error);
      alert('Failed to update status. Please try again.');
    }
  };

  const handleMarkNotTaken = async (medId: string, reason: string) => {
    try {
      const { data: timeSlot } = await supabase
        .from('time_slots')
        .select('id')
        .eq('name', selectedTimeSlot)
        .maybeSingle();

      if (!timeSlot) return;

      const dateString = toLocalDateKey(selectedDate);

      const { error: upsertError } = await supabase
        .from('doses_taken')
        .upsert(
          {
            medication_id: medId,
            time_slot_id: timeSlot.id,
            dose_date: dateString,
            taken: false,
            not_taken_reason: reason,
            taken_at: new Date().toISOString(),
          },
          {
            onConflict: 'medication_id,time_slot_id,dose_date',
          }
        );
      if (upsertError) throw upsertError;

      const { error: clearLogsError } = await supabase
        .from('medication_logs')
        .delete()
        .eq('medication_id', medId)
        .eq('time_slot_id', timeSlot.id)
        .eq('dose_date', dateString);
      if (clearLogsError) throw clearLogsError;

      const { error: logError } = await supabase.from('medication_logs').insert({
        medication_id: medId,
        time_slot_id: timeSlot.id,
        dose_date: dateString,
        action: 'unchecked',
        reason,
      });
      if (logError) throw logError;

      setSlotDoseByMedId((prev) => ({
        ...prev,
        [medId]: { taken: false, notTakenReason: reason },
      }));
    } catch (error) {
      console.error('Error marking not taken:', error);
      alert('Failed to save. Please try again.');
      throw error;
    }
  };

  const handleLogSeizure = async (payload: { occurredAtIso: string; eventDate: string; durationSeconds: number; notes: string | null }) => {
    try {
      const { error } = await supabase.from('symptom_events').insert({
        event_type: 'seizure',
        occurred_at: payload.occurredAtIso,
        event_date: payload.eventDate,
        duration_seconds: payload.durationSeconds,
        notes: payload.notes,
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error logging seizure:', error);
      alert('Failed to save seizure log. Please try again.');
      throw error;
    }
  };

  const handleAddEvent = async (payload: AddEventPayload) => {
    try {
      const { error } = await supabase.from('timeline_events').insert({
        event_type: payload.eventType,
        measurement_type: payload.measurementType,
        occurred_at: payload.occurredAtIso,
        event_date: payload.eventDate,
        title: payload.title,
        value_text: payload.valueText,
        notes: payload.notes,
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error adding event:', error);
      alert('Failed to save event. Please try again.');
      throw error;
    }
  };

  const handleLogFlexibleDose = async (medId: string, takenAtIso: string) => {
    // Use the actual taken timestamp to determine the local dose day.
    // This prevents a dose taken just after midnight from being stored under the previous selected day.
    const dateString = toLocalDateKey(new Date(takenAtIso));
    try {
      const { data: row, error } = await supabase
        .from('medication_dose_events')
        .insert({
          medication_id: medId,
          dose_date: dateString,
          taken_at: takenAtIso,
        })
        .select('id, taken_at')
        .single();

      if (error) throw error;

      setFlexibleDoseEvents((prev) => {
        const next = { ...prev };
        const list = [...(next[medId] || [])];
        if (row) list.push({ id: row.id, taken_at: row.taken_at });
        list.sort(
          (a, b) => new Date(a.taken_at).getTime() - new Date(b.taken_at).getTime()
        );
        next[medId] = list;
        return next;
      });
    } catch (error) {
      console.error('Error logging dose:', error);
      alert('Failed to log dose. Please try again.');
      throw error;
    }
  };

  const handleRemoveLastFlexibleDose = async (medId: string) => {
    const events = flexibleDoseEvents[medId];
    if (!events?.length) return;
    const last = events[events.length - 1];
    try {
      const { error } = await supabase.from('medication_dose_events').delete().eq('id', last.id);
      if (error) throw error;

      setFlexibleDoseEvents((prev) => {
        const next = { ...prev };
        const list = [...(next[medId] || [])].slice(0, -1);
        next[medId] = list;
        return next;
      });
    } catch (error) {
      console.error('Error removing dose:', error);
      alert('Failed to remove dose. Please try again.');
    }
  };

  const handleSaveMedication = async (formData: MedicationFormData) => {
    try {
      const whenText = generateWhenText(formData);
      const isFlexible = formData.dosingMode === 'flexible_daily';
      const targetDoses =
        isFlexible && formData.targetDosesPerDay !== ''
          ? Number(formData.targetDosesPerDay)
          : null;

      const todayLocal = toLocalDateKey(new Date());
      const pauseStartRaw = formData.pauseStartDate || '';
      const pauseEndRaw = formData.pauseEndDate || '';
      const pauseStart =
        pauseStartRaw || (pauseEndRaw ? todayLocal : '');
      const pauseEnd =
        pauseEndRaw || (pauseStartRaw ? pauseStartRaw : '');

      if (pauseStart && pauseEnd && pauseStart > pauseEnd) {
        alert('Pause start date must be on or before the pause end date.');
        return;
      }

      const medPayload = {
        name: formData.name,
        when_text: whenText,
        schedule_type: formData.pattern,
        days_of_week: formData.pattern === 'days_of_week' ? formData.daysOfWeek : null,
        start_date: formData.startDate || null,
        interval_days: formData.pattern === 'every_n_days_from_start' ? formData.intervalDays : null,
        notes: formData.notes || null,
        end_date: formData.endDate || null,
        pause_start_date: pauseStart || null,
        pause_end_date: pauseEnd || null,
        dosing_mode: formData.dosingMode,
        target_doses_per_day: isFlexible ? targetDoses : null,
      };

      const nameNorm = formData.name.trim().toLowerCase();
      if (nameNorm) {
        const { data: activeForDupCheck, error: dupCheckError } = await supabase
          .from('medications')
          .select('id, name')
          .eq('active', true);

        if (dupCheckError) throw dupCheckError;

        const conflicting = activeForDupCheck?.find(
          (m) => m.name.trim().toLowerCase() === nameNorm && m.id !== formData.id
        );

        if (conflicting) {
          const proceed = window.confirm(
            `You already have a medication named "${conflicting.name}". Adding or saving this creates a separate entry and splits dose history.\n\nContinue anyway?`
          );
          if (!proceed) return;
        }
      }

      const logRows = formData.coursePeriodLog ?? [];
      const filledPeriods = logRows.filter((r) => r.startDate.trim());
      for (const r of filledPeriods) {
        if (r.endDate.trim() && r.startDate > r.endDate) {
          alert('Course history: end date must be on or after start date for each row.');
          return;
        }
      }

      let savedMedId: string;

      if (formData.id) {
        const { error: medError } = await supabase
          .from('medications')
          .update(medPayload)
          .eq('id', formData.id);

        if (medError) throw medError;

        await supabase.from('medication_slots').delete().eq('medication_id', formData.id);

        if (!isFlexible) {
          const { data: timeSlots } = await supabase
            .from('time_slots')
            .select('id, name')
            .in('name', formData.timeSlots);

          if (timeSlots?.length) {
            const slots = timeSlots.map((slot) => ({
              medication_id: formData.id,
              time_slot_id: slot.id,
            }));
            await supabase.from('medication_slots').insert(slots);
          }
        }
        savedMedId = formData.id;
      } else {
        const { data: newMed, error: medError } = await supabase
          .from('medications')
          .insert(medPayload)
          .select()
          .single();

        if (medError) throw medError;
        if (!newMed) throw new Error('No medication returned after insert');

        if (!isFlexible) {
          const { data: timeSlots } = await supabase
            .from('time_slots')
            .select('id, name')
            .in('name', formData.timeSlots);

          if (timeSlots?.length) {
            const slots = timeSlots.map((slot) => ({
              medication_id: newMed.id,
              time_slot_id: slot.id,
            }));
            await supabase.from('medication_slots').insert(slots);
          }
        }
        savedMedId = newMed.id;
      }

      const { error: delPeriodsError } = await supabase
        .from('medication_course_periods')
        .delete()
        .eq('medication_id', savedMedId);
      if (delPeriodsError) throw delPeriodsError;

      if (filledPeriods.length > 0) {
        const { error: insPeriodsError } = await supabase
          .from('medication_course_periods')
          .insert(
            filledPeriods.map((r) => ({
              medication_id: savedMedId,
              start_date: r.startDate,
              end_date: r.endDate.trim() ? r.endDate : null,
              notes: r.notes.trim() ? r.notes : null,
            }))
          );
        if (insPeriodsError) throw insPeriodsError;
      }

      setIsModalOpen(false);
      setEditingMedication(null);
      void refreshSlotDefinitions();
      loadMedications();
    } catch (error) {
      console.error('Error saving medication:', error);
      alert('Failed to save medication. Please try again.');
    }
  };

  const generateWhenText = (formData: MedicationFormData): string => {
    if (formData.dosingMode === 'flexible_daily') {
      if (formData.targetDosesPerDay === '' || formData.targetDosesPerDay === null) {
        return 'Flexible daily (log each dose)';
      }
      const n = Number(formData.targetDosesPerDay);
      return `${n} dose${n !== 1 ? 's' : ''} per day (flexible times)`;
    }
    if (formData.pattern === 'daily') {
      return 'Daily';
    } else if (formData.pattern === 'days_of_week') {
      const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const selectedDays = formData.daysOfWeek
        .sort()
        .map((day) => dayNames[day - 1]);
      return selectedDays.join(', ');
    } else {
      return `Every ${formData.intervalDays} day${formData.intervalDays > 1 ? 's' : ''}`;
    }
  };

  const handleEditMedication = (med: MedicationWithSlots) => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    setEditingMedication({
      id: med.id,
      name: med.name,
      dosingMode: med.dosing_mode ?? 'time_slots',
      timeSlots: med.time_slot_names,
      targetDosesPerDay:
        med.target_doses_per_day != null ? med.target_doses_per_day : '',
      pattern: med.schedule_type,
      daysOfWeek: med.days_of_week || [],
      startDate: med.start_date || '',
      intervalDays: med.interval_days || 1,
      notes: med.notes || '',
      endDate: med.end_date || '',
      pauseStartDate: (med.pause_start_date as string | null) || '',
      pauseEndDate: (med.pause_end_date as string | null) || '',
    });
    setIsModalOpen(true);
  };

  const handleAddMedication = () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    setEditingMedication(null);
    setIsModalOpen(true);
  };

  const handleDeleteMedication = async (medicationId: string) => {
    try {
      await supabase
        .from('medication_slots')
        .delete()
        .eq('medication_id', medicationId);

      const { error } = await supabase
        .from('medications')
        .delete()
        .eq('id', medicationId);

      if (error) throw error;

      setIsModalOpen(false);
      setEditingMedication(null);
      void refreshSlotDefinitions();
      loadMedications();
    } catch (error) {
      console.error('Error deleting medication:', error);
      alert('Failed to delete medication. Please try again.');
    }
  };

  const handleShowHistory = (medId: string, medName: string, dosingMode: DosingMode = 'time_slots') => {
    setHistoryMedicationId(medId);
    setHistoryMedicationName(medName);
    setHistoryDosingMode(dosingMode);
    setHistoryModalOpen(true);
  };

  /** Open edit modal when navigating from Settings → Ended courses → Edit */
  useEffect(() => {
    const editId = (location.state as { editMedicationId?: string } | null)?.editMedicationId;
    if (!editId || !user || authLoading) return;

    let cancelled = false;
    (async () => {
      const med = await fetchMedicationWithSlotsById(editId, slotDefinitions);
      if (cancelled) return;
      navigate('.', { replace: true, state: {} });
      if (med) {
        handleEditMedication(med);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional one-shot from navigation state
  }, [location.state, user, authLoading, slotDefinitions]);

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100/95 flex items-center justify-center">
        <div className="text-slate-500 text-sm font-medium animate-pulse">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100/95">
      <div className="max-w-4xl mx-auto px-2 sm:px-4 py-3 sm:py-6">
        <header className="mb-3 sm:mb-4">
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-start gap-3 mb-3">
            <div className="flex items-start gap-3 min-w-0">
              <div
                className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-800 text-white shadow-brand-sm"
                aria-hidden
              >
                <Pill className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                  Today&apos;s medications
                </h1>
                <p className="text-sm text-slate-500 mt-0.5">Daily schedule · mark doses as you go</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {user ? (
                <>
                  <button
                    onClick={() => setAddLogPickerOpen(true)}
                    className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-950 active:translate-y-px text-sm sm:text-base whitespace-nowrap"
                    title="Add a log"
                  >
                    <ClipboardList className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline">Add log</span>
                    <span className="sm:hidden">Log</span>
                  </button>
                  <button
                    onClick={handleAddMedication}
                    className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-brand-600 text-white rounded-xl font-semibold hover:bg-brand-700 active:translate-y-px flex-1 sm:flex-none text-sm sm:text-base whitespace-nowrap shadow-brand-sm"
                  >
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline">Add medication</span>
                    <span className="sm:hidden">Add</span>
                  </button>
                  <button
                    onClick={signOut}
                    className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 active:translate-y-px text-sm sm:text-base"
                    title="Sign out"
                  >
                    <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-brand-600 text-white rounded-xl font-semibold hover:bg-brand-700 active:translate-y-px flex-1 text-sm sm:text-base shadow-brand-sm"
                >
                  <LogIn className="w-4 h-4 sm:w-5 sm:h-5" />
                  Sign In
                </button>
              )}
            </div>
          </div>
          <DateNav selectedDate={selectedDate} onDateChange={setSelectedDate} />
        </header>

        <section className="overflow-hidden bg-white border border-slate-200/90 rounded-2xl shadow-brand-sm ring-1 ring-slate-200/80">
          <TimeSlotPicker
            selectedTimeSlot={selectedTimeSlot}
            onTimeSlotChange={setSelectedTimeSlot}
            availableTimeSlots={availableTimeSlots}
          />
          <Notices
            medications={medications}
            selectedDate={selectedDate}
            selectedTimeSlot={selectedTimeSlot}
            firstSessionName={availableTimeSlots[0] ?? ''}
          />
          <MedTable
            medications={medications}
            selectedDate={selectedDate}
            slotDoseByMedId={slotDoseByMedId}
            flexibleDoseEvents={flexibleDoseEvents}
            onToggleTaken={handleToggleTaken}
            onOpenMarkNotTaken={setMarkNotTakenMedId}
            onLogFlexibleDose={handleLogFlexibleDose}
            onRemoveLastFlexibleDose={handleRemoveLastFlexibleDose}
            onEditMedication={handleEditMedication}
            onShowHistory={handleShowHistory}
          />
        </section>
      </div>

      <AddMedicationModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingMedication(null);
        }}
        onSave={handleSaveMedication}
        onDelete={handleDeleteMedication}
        editingMedication={editingMedication}
        sessionOptions={slotDefinitions.map((s) => s.name)}
      />

      <MedicationHistoryModal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        medicationId={historyMedicationId}
        medicationName={historyMedicationName}
        dosingMode={historyDosingMode}
        timeSlotId={selectedTimeSlotId}
        timeSlotName={selectedTimeSlot}
        doseDate={toLocalDateKey(selectedDate)}
      />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      <AddLogPickerModal
        isOpen={addLogPickerOpen}
        onClose={() => setAddLogPickerOpen(false)}
        onPickSeizure={() => {
          setAddLogPickerOpen(false);
          setLogSeizureOpen(true);
        }}
        onPickNote={() => {
          setAddLogPickerOpen(false);
          setAddEventOpen(true);
        }}
      />

      <MarkNotTakenModal
        isOpen={markNotTakenMedId !== null}
        medicationName={
          markNotTakenMedId
            ? medications.find((m) => m.id === markNotTakenMedId)?.name ?? 'Medication'
            : ''
        }
        onClose={() => setMarkNotTakenMedId(null)}
        onConfirm={async (reason) => {
          if (!markNotTakenMedId) return;
          await handleMarkNotTaken(markNotTakenMedId, reason);
        }}
      />

      <LogSeizureModal
        isOpen={logSeizureOpen}
        selectedDate={selectedDate}
        onClose={() => setLogSeizureOpen(false)}
        onConfirm={handleLogSeizure}
      />

      <AddEventModal
        isOpen={addEventOpen}
        selectedDate={selectedDate}
        onClose={() => setAddEventOpen(false)}
        onConfirm={handleAddEvent}
      />
    </div>
  );
}
