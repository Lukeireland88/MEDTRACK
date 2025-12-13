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

  const notDueMeds = medications.filter((med) => !isDue(med, selectedDate));

  if (notDueMeds.length === 0) {
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
    <div className="mx-2 sm:mx-3 mt-2 space-y-2">
      {notDueMeds.map((med) => (
        <div key={med.id} className="bg-red-100 border border-gray-300 rounded-lg p-2 sm:p-3 text-gray-900 text-xs sm:text-sm">
          <span className="font-semibold">{med.name}</span> not due on this date (next due: {formatNextDue(nextDueDate(med, selectedDate))}).
        </div>
      ))}
    </div>
  );
}
