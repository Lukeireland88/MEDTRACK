import { useEffect, useState } from 'react';
import { Plus, LogIn, LogOut } from 'lucide-react';
import { supabase } from './lib/supabase';
import { MedicationWithSlots } from './types';
import { getDefaultTimeSlot, toLocalDateOnly } from './utils/dateUtils';
import { useAuth } from './contexts/AuthContext';
import DateNav from './components/DateNav';
import TimeSlotPicker from './components/TimeSlotPicker';
import MedTable from './components/MedTable';
import Notices from './components/Notices';
import AddMedicationModal, { MedicationFormData } from './components/AddMedicationModal';
import MedicationHistoryModal from './components/MedicationHistoryModal';
import AuthModal from './components/AuthModal';

export default function App() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(toLocalDateOnly(new Date()));
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>(getDefaultTimeSlot());
  const [selectedTimeSlotId, setSelectedTimeSlotId] = useState<string>('');
  const [medications, setMedications] = useState<MedicationWithSlots[]>([]);
  const [takenStatus, setTakenStatus] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [editingMedication, setEditingMedication] = useState<MedicationFormData | null>(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyMedicationId, setHistoryMedicationId] = useState<string>('');
  const [historyMedicationName, setHistoryMedicationName] = useState<string>('');
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>(['Morning', 'Lunch', 'Evening', 'Night']);

  useEffect(() => {
    loadMedications();
    loadTakenStatus();
  }, [selectedTimeSlot, selectedDate]);

  useEffect(() => {
    loadAvailableTimeSlots();
  }, []);

  const loadAvailableTimeSlots = async () => {
    try {
      const { data: allSlots } = await supabase
        .from('medication_slots')
        .select(`
          time_slots (name)
        `);

      if (!allSlots || allSlots.length === 0) {
        setAvailableTimeSlots([]);
        return;
      }

      const uniqueSlots = new Set<string>();
      allSlots.forEach((slot: any) => {
        if (slot.time_slots?.name) {
          uniqueSlots.add(slot.time_slots.name);
        }
      });

      const sortedSlots = Array.from(uniqueSlots).sort((a, b) => {
        const order = ['Morning', 'Lunch', 'Evening', 'Night'];
        return order.indexOf(a) - order.indexOf(b);
      });

      setAvailableTimeSlots(sortedSlots);

      if (sortedSlots.length > 0 && !sortedSlots.includes(selectedTimeSlot)) {
        setSelectedTimeSlot(sortedSlots[0]);
      }
    } catch (error) {
      console.error('Error loading available time slots:', error);
    }
  };

  const loadTakenStatus = async () => {
    try {
      const { data: timeSlot } = await supabase
        .from('time_slots')
        .select('id')
        .eq('name', selectedTimeSlot)
        .maybeSingle();

      if (!timeSlot) {
        setTakenStatus({});
        return;
      }

      const dateString = toLocalDateOnly(selectedDate).toISOString().split('T')[0];

      const { data: dosesTaken } = await supabase
        .from('doses_taken')
        .select('medication_id, taken')
        .eq('time_slot_id', timeSlot.id)
        .eq('dose_date', dateString);

      const statusMap: Record<string, boolean> = {};
      dosesTaken?.forEach((dose) => {
        statusMap[dose.medication_id] = dose.taken;
      });

      setTakenStatus(statusMap);
    } catch (error) {
      console.error('Error loading taken status:', error);
    }
  };

  const loadMedications = async () => {
    setLoading(true);
    try {
      const { data: timeSlot } = await supabase
        .from('time_slots')
        .select('id')
        .eq('name', selectedTimeSlot)
        .maybeSingle();

      if (!timeSlot) {
        setMedications([]);
        setSelectedTimeSlotId('');
        setLoading(false);
        return;
      }

      setSelectedTimeSlotId(timeSlot.id);

      const { data: medSlots, error: medSlotsError } = await supabase
        .from('medication_slots')
        .select(`
          medication_id,
          medications (
            id,
            name,
            when_text,
            schedule_type,
            days_of_week,
            start_date,
            interval_days,
            notes,
            active
          )
        `)
        .eq('time_slot_id', timeSlot.id);

      if (medSlotsError) {
        console.error('Error loading medication slots:', medSlotsError);
      }

      if (!medSlots) {
        setMedications([]);
        setLoading(false);
        return;
      }

      const medIds = medSlots
        .map((ms: any) => ms.medications?.id)
        .filter(Boolean);

      if (medIds.length === 0) {
        setMedications([]);
        setLoading(false);
        return;
      }

      const { data: allSlots } = await supabase
        .from('medication_slots')
        .select(`
          medication_id,
          time_slots (name)
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

      const medsWithSlots: MedicationWithSlots[] = medSlots
        .map((ms: any) => {
          const med = ms.medications;
          if (!med) return null;

          const timeSlotNames = slotsByMed[med.id] || [];
          const sortOrder = ['Morning', 'Lunch', 'Evening', 'Night'];
          timeSlotNames.sort((a, b) => sortOrder.indexOf(a) - sortOrder.indexOf(b));

          return {
            ...med,
            time_slot_names: timeSlotNames,
            is_multiple: timeSlotNames.length > 1
          };
        })
        .filter(Boolean)
        .sort((a: any, b: any) => a.name.localeCompare(b.name));

      setMedications(medsWithSlots);
    } catch (error) {
      console.error('Error loading medications:', error);
    } finally {
      setLoading(false);
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

      const dateString = toLocalDateOnly(selectedDate).toISOString().split('T')[0];
      const newTakenValue = !takenStatus[medId];

      const { error: upsertError } = await supabase
        .from('doses_taken')
        .upsert(
          {
            medication_id: medId,
            time_slot_id: timeSlot.id,
            dose_date: dateString,
            taken: newTakenValue,
            taken_at: new Date().toISOString(),
          },
          {
            onConflict: 'medication_id,time_slot_id,dose_date',
          }
        );

      if (upsertError) throw upsertError;

      const { error: logError } = await supabase
        .from('medication_logs')
        .insert({
          medication_id: medId,
          time_slot_id: timeSlot.id,
          dose_date: dateString,
          action: newTakenValue ? 'checked' : 'unchecked',
        });

      if (logError) throw logError;

      setTakenStatus((prev) => ({
        ...prev,
        [medId]: newTakenValue
      }));
    } catch (error) {
      console.error('Error toggling taken status:', error);
      alert('Failed to update status. Please try again.');
    }
  };

  const handleSaveMedication = async (formData: MedicationFormData) => {
    try {
      const whenText = generateWhenText(formData);

      if (formData.id) {
        const { error: medError } = await supabase
          .from('medications')
          .update({
            name: formData.name,
            when_text: whenText,
            schedule_type: formData.pattern,
            days_of_week: formData.pattern === 'days_of_week' ? formData.daysOfWeek : null,
            start_date: formData.pattern === 'every_n_days_from_start' ? formData.startDate : null,
            interval_days: formData.pattern === 'every_n_days_from_start' ? formData.intervalDays : null,
            notes: formData.notes || null,
          })
          .eq('id', formData.id);

        if (medError) throw medError;

        await supabase
          .from('medication_slots')
          .delete()
          .eq('medication_id', formData.id);

        const { data: timeSlots } = await supabase
          .from('time_slots')
          .select('id, name')
          .in('name', formData.timeSlots);

        if (timeSlots) {
          const slots = timeSlots.map((slot) => ({
            medication_id: formData.id,
            time_slot_id: slot.id,
          }));

          await supabase.from('medication_slots').insert(slots);
        }
      } else {
        const { data: newMed, error: medError } = await supabase
          .from('medications')
          .insert({
            name: formData.name,
            when_text: whenText,
            schedule_type: formData.pattern,
            days_of_week: formData.pattern === 'days_of_week' ? formData.daysOfWeek : null,
            start_date: formData.pattern === 'every_n_days_from_start' ? formData.startDate : null,
            interval_days: formData.pattern === 'every_n_days_from_start' ? formData.intervalDays : null,
            notes: formData.notes || null,
          })
          .select()
          .single();

        if (medError) throw medError;

        const { data: timeSlots } = await supabase
          .from('time_slots')
          .select('id, name')
          .in('name', formData.timeSlots);

        if (timeSlots && newMed) {
          const slots = timeSlots.map((slot) => ({
            medication_id: newMed.id,
            time_slot_id: slot.id,
          }));

          await supabase.from('medication_slots').insert(slots);
        }
      }

      setIsModalOpen(false);
      setEditingMedication(null);
      await loadAvailableTimeSlots();
      loadMedications();
    } catch (error) {
      console.error('Error saving medication:', error);
      alert('Failed to save medication. Please try again.');
    }
  };

  const generateWhenText = (formData: MedicationFormData): string => {
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
      timeSlots: med.time_slot_names,
      pattern: med.schedule_type,
      daysOfWeek: med.days_of_week || [],
      startDate: med.start_date || new Date().toISOString().split('T')[0],
      intervalDays: med.interval_days || 1,
      notes: med.notes || '',
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
      await loadAvailableTimeSlots();
      loadMedications();
    } catch (error) {
      console.error('Error deleting medication:', error);
      alert('Failed to delete medication. Please try again.');
    }
  };

  const handleShowHistory = (medId: string, medName: string) => {
    setHistoryMedicationId(medId);
    setHistoryMedicationName(medName);
    setHistoryModalOpen(true);
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600 text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-2 sm:px-4 py-3 sm:py-6">
        <header className="mb-3 sm:mb-4">
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-start gap-3 mb-3">
            <h1 className="text-2xl sm:text-3xl font-bold">Medication Tracker</h1>
            <div className="flex items-center gap-2">
              {user ? (
                <>
                  <button
                    onClick={handleAddMedication}
                    className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 active:translate-y-px flex-1 sm:flex-none text-sm sm:text-base whitespace-nowrap"
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
                  className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 active:translate-y-px flex-1 text-sm sm:text-base"
                >
                  <LogIn className="w-4 h-4 sm:w-5 sm:h-5" />
                  Sign In
                </button>
              )}
            </div>
          </div>
          <DateNav selectedDate={selectedDate} onDateChange={setSelectedDate} />
        </header>

        <section className="bg-white border border-gray-300 rounded-2xl shadow-lg">
          <TimeSlotPicker
            selectedTimeSlot={selectedTimeSlot}
            onTimeSlotChange={setSelectedTimeSlot}
            availableTimeSlots={availableTimeSlots}
          />
          <Notices
            medications={medications}
            selectedDate={selectedDate}
            selectedTimeSlot={selectedTimeSlot}
          />
          <MedTable
            medications={medications}
            selectedDate={selectedDate}
            takenStatus={takenStatus}
            onToggleTaken={handleToggleTaken}
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
      />

      <MedicationHistoryModal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        medicationId={historyMedicationId}
        medicationName={historyMedicationName}
        timeSlotId={selectedTimeSlotId}
        timeSlotName={selectedTimeSlot}
        doseDate={toLocalDateOnly(selectedDate).toISOString().split('T')[0]}
      />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </div>
  );
}
