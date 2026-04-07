import { MedicationWithSlots } from '../types';
import { isDue, nextDueDate } from '../utils/scheduleUtils';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';

interface NoticesProps {
  medications: MedicationWithSlots[];
  selectedDate: Date;
  selectedTimeSlot: string;
}

export default function Notices({ medications, selectedDate, selectedTimeSlot }: NoticesProps) {
  if (selectedTimeSlot !== 'Morning') {
    return null;
  }

  const notDueMeds = useMemo(
    () => medications.filter((med) => !isDue(med, selectedDate)),
    [medications, selectedDate]
  );
  const [open, setOpen] = useState(false);

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

  const count = notDueMeds.length;
  const first = notDueMeds[0];
  const summaryLine = first
    ? `${first.name} not due on this date (next due: ${formatNextDue(nextDueDate(first, selectedDate))}).`
    : 'Some medications are not due on this date.';

  return (
    <div className="mx-2 sm:mx-3 mt-2">
      <div className="bg-red-100 border border-gray-300 rounded-lg text-gray-900 text-xs sm:text-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-start justify-between gap-3 p-2 sm:p-3 text-left"
          aria-expanded={open}
        >
          <div className="min-w-0">
            <div className="font-semibold">Not due</div>
            <div className="text-gray-900 mt-0.5 break-words">
              {summaryLine}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 pt-0.5">
            <span className="inline-flex items-center justify-center min-w-6 h-6 px-2 rounded-full bg-white/70 border border-gray-300 font-semibold">
              {count}
            </span>
            {open ? (
              <ChevronDown className="w-5 h-5 text-gray-800" aria-hidden />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-800" aria-hidden />
            )}
          </div>
        </button>

        {open && (
          <div className="border-t border-gray-300/70 px-2 sm:px-3 pb-2 sm:pb-3">
            <ul className="mt-2 space-y-2">
              {notDueMeds.map((med) => (
                <li
                  key={med.id}
                  className="bg-white/60 border border-gray-300 rounded-lg p-2 text-gray-900"
                >
                  <span className="font-semibold">{med.name}</span> not due on this date (next due: {formatNextDue(nextDueDate(med, selectedDate))}).
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
