import { MedicationWithSlots } from '../types';
import { isDue, nextDueDate } from '../utils/scheduleUtils';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';

interface NoticesProps {
  medications: MedicationWithSlots[];
  selectedDate: Date;
  selectedTimeSlot: string;
  /** First session in sort order (e.g. “Morning”) — “not due” notice only shows in this tab */
  firstSessionName: string;
}

export default function Notices({
  medications,
  selectedDate,
  selectedTimeSlot,
  firstSessionName,
}: NoticesProps) {
  const notDueMeds = useMemo(
    () => medications.filter((med) => !isDue(med, selectedDate)),
    [medications, selectedDate]
  );
  const [open, setOpen] = useState(false);

  if (!firstSessionName || selectedTimeSlot !== firstSessionName || notDueMeds.length === 0) {
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
  const isCollapsible = count > 1;

  return (
    <div className="mx-2 sm:mx-3 mt-2 mb-2">
      <div className="bg-amber-50 border border-amber-200 rounded-lg text-slate-900 text-xs sm:text-sm overflow-hidden">
        <button
          type="button"
          onClick={() => {
            if (!isCollapsible) return;
            setOpen((v) => !v);
          }}
          className="w-full flex items-center justify-between gap-3 p-2 sm:p-3 text-left"
          aria-expanded={isCollapsible ? open : true}
        >
          <div className="font-semibold text-amber-950">Not due</div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center justify-center min-w-6 h-6 px-2 rounded-full bg-white/80 border border-amber-200 font-semibold text-amber-900">
              {count}
            </span>
            {isCollapsible &&
              (open ? (
                <ChevronDown className="w-5 h-5 text-amber-900" aria-hidden />
              ) : (
                <ChevronRight className="w-5 h-5 text-amber-900" aria-hidden />
              ))}
          </div>
        </button>

        {(!isCollapsible || open) && (
          <div className="border-t border-amber-200/80 px-2 sm:px-3 pb-2 sm:pb-3">
            <ul className="mt-2 space-y-2">
              {notDueMeds.map((med) => (
                <li
                  key={med.id}
                  className="bg-white/70 border border-amber-100 rounded-lg p-2 text-slate-900"
                >
                  <span className="font-semibold">{med.name}</span> not due on this date (next due:{' '}
                  {formatNextDue(nextDueDate(med, selectedDate))}).
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
