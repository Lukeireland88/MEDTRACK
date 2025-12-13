import { MedicationWithSlots } from '../types';
import { isDue, nextDueDate } from '../utils/scheduleUtils';

interface NoticesProps {
  medications: MedicationWithSlots[];
  selectedDate: Date;
  selectedTimeSlot: string;
}

export default function Notices({ medications, selectedDate, selectedTimeSlot }: NoticesProps) {
  if (selectedTimeSlot !== 'Morning') {
    return null;
  }

  const ferrousMed = medications.find((m) => m.name.toLowerCase().includes('ferrous'));
  const azithroMed = medications.find((m) => m.name.toLowerCase().includes('azithromycin'));

  const ferrousNotDue = ferrousMed && !isDue(ferrousMed, selectedDate);
  const azithroNotDue = azithroMed && !isDue(azithroMed, selectedDate);

  if (!ferrousNotDue && !azithroNotDue) {
    return null;
  }

  const formatNextDue = (date: Date) => {
    return date.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="mx-3 mt-2 space-y-2">
      {ferrousNotDue && ferrousMed && (
        <div className="bg-red-100 border border-gray-300 rounded-lg p-3 text-gray-900">
          {ferrousMed.name} not due on this date (next due: {formatNextDue(nextDueDate(ferrousMed, selectedDate))}).
        </div>
      )}
      {azithroNotDue && azithroMed && (
        <div className="bg-red-100 border border-gray-300 rounded-lg p-3 text-gray-900">
          {azithroMed.name} not due on this date (next due: {formatNextDue(nextDueDate(azithroMed, selectedDate))}).
        </div>
      )}
    </div>
  );
}
