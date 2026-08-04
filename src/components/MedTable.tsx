import { useState, type ReactNode } from 'react';
import { Pencil, History, CircleX, X } from 'lucide-react';
import { DosingMode, MedicationDoseEvent, MedicationWithSlots, SlotDoseState } from '../types';
import { isDue, isPaused } from '../utils/scheduleUtils';
import LogDoseTimeModal from './LogDoseTimeModal';
import { fromDateInputValue } from '../utils/dateUtils';
import { usePreferences } from '../contexts/PreferencesContext';

interface MedTableProps {
  medications: MedicationWithSlots[];
  selectedDate: Date;
  slotDoseByMedId: Record<string, SlotDoseState>;
  flexibleDoseEvents: Record<string, Pick<MedicationDoseEvent, 'id' | 'taken_at'>[]>;
  onToggleTaken: (medId: string) => void;
  onOpenMarkNotTaken: (medId: string) => void;
  onLogFlexibleDose: (medId: string, takenAtIso: string) => void | Promise<void>;
  onRemoveLastFlexibleDose: (medId: string) => void;
  onEditMedication: (med: MedicationWithSlots) => void;
  onShowHistory: (medId: string, medName: string, dosingMode?: DosingMode) => void;
}

/** Checkbox for pending/taken; X-in-box when explicitly not taken (click marks taken). */
function SlotTakenControl({
  medId,
  taken,
  notTakenRecorded,
  onToggleTaken,
  className = '',
}: {
  medId: string;
  taken: boolean;
  notTakenRecorded: boolean;
  onToggleTaken: (id: string) => void;
  className?: string;
}) {
  if (notTakenRecorded) {
    return (
      <button
        type="button"
        onClick={() => onToggleTaken(medId)}
        className={`w-6 h-6 shrink-0 rounded border-2 border-gray-500 bg-white flex items-center justify-center cursor-pointer hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1 ${className}`}
        title="Not taken — click to mark as taken"
        aria-label="Not taken. Click to mark as taken."
      >
        <X className="w-4 h-4 text-gray-800" strokeWidth={2.5} aria-hidden />
      </button>
    );
  }
  return (
    <input
      type="checkbox"
      checked={taken}
      onChange={() => onToggleTaken(medId)}
      className={`w-6 h-6 accent-brand-600 cursor-pointer ${className}`}
      title="Mark as taken"
    />
  );
}

function MarkNotTakenButton({
  notTakenRecorded,
  onClick,
  className = '',
  iconClassName = 'w-4 h-4',
}: {
  notTakenRecorded: boolean;
  onClick: () => void;
  className?: string;
  iconClassName?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        p-2 rounded-lg transition-colors
        ${
          notTakenRecorded
            ? 'text-rose-800 bg-rose-100 hover:bg-rose-200'
            : 'text-gray-600 hover:bg-gray-100'
        }
        ${className}
      `}
      title={
        notTakenRecorded ? 'Update missed-dose reason' : 'Mark as missed (with reason)'
      }
      aria-label={
        notTakenRecorded ? 'Update missed-dose reason' : 'Mark as missed with reason'
      }
    >
      <CircleX className={iconClassName} strokeWidth={2} aria-hidden />
    </button>
  );
}

function flexibleRemaining(
  med: MedicationWithSlots,
  selectedDate: Date,
  events: Pick<MedicationDoseEvent, 'taken_at'>[] | undefined
): number {
  if (!isDue(med, selectedDate)) return 0;
  const count = events?.length ?? 0;
  const target = med.target_doses_per_day;
  if (target != null && count < target) return target - count;
  return 0;
}

function orderSides(controlsFirst: boolean, controls: ReactNode, middle: ReactNode, actions: ReactNode) {
  return controlsFirst ? (
    <>
      {controls}
      {middle}
      {actions}
    </>
  ) : (
    <>
      {actions}
      {middle}
      {controls}
    </>
  );
}

export default function MedTable({
  medications,
  selectedDate,
  slotDoseByMedId,
  flexibleDoseEvents,
  onToggleTaken,
  onOpenMarkNotTaken,
  onLogFlexibleDose,
  onRemoveLastFlexibleDose,
  onEditMedication,
  onShowHistory
}: MedTableProps) {
  const { handedness } = usePreferences();
  const controlsFirst = handedness === 'left';
  const [logDoseMedId, setLogDoseMedId] = useState<string | null>(null);

  const formatResumesOn = (med: Pick<MedicationWithSlots, 'pause_end_date'>): string | null => {
    if (!med.pause_end_date) return null;
    const resume = fromDateInputValue(med.pause_end_date);
    resume.setDate(resume.getDate() + 1);
    return resume.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const remaining = medications.reduce((acc, med) => {
    if (med.dosing_mode === 'flexible_daily') {
      return acc + flexibleRemaining(med, selectedDate, flexibleDoseEvents[med.id]);
    }
    if (isDue(med, selectedDate) && slotDoseByMedId[med.id] === undefined) return acc + 1;
    return acc;
  }, 0);

  const sortedMedications = [...medications].sort((a, b) => {
    const aDue = isDue(a, selectedDate);
    const bDue = isDue(b, selectedDate);

    // Not due meds go to the bottom
    if (aDue && !bDue) return -1;
    if (!aDue && bDue) return 1;

    const aFlex = a.dosing_mode === 'flexible_daily';
    const bFlex = b.dosing_mode === 'flexible_daily';

    // Within due: time-slot meds first, flexible daily last
    if (aDue && bDue) {
      if (aFlex && !bFlex) return 1;
      if (!aFlex && bFlex) return -1;
      if (!aFlex && !bFlex) {
        if (!a.is_multiple && b.is_multiple) return -1;
        if (a.is_multiple && !b.is_multiple) return 1;
      }
    }

    // Within not-due: same — flexible rows at the bottom of that group
    if (!aDue && !bDue) {
      if (aFlex && !bFlex) return 1;
      if (!aFlex && bFlex) return -1;
    }

    return a.name.localeCompare(b.name);
  });

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

  return (
    <>
      {/* Desktop table view */}
      <div className="hidden md:block px-3 pb-3">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-100/90">
              {orderSides(
                controlsFirst,
                <th className="text-left text-sm text-slate-600 border-b border-slate-200 p-3 w-14">
                  Taken
                </th>,
                <>
                  <th className="text-left text-sm text-slate-600 border-b border-slate-200 p-3">
                    Medication
                  </th>
                  <th className="text-left text-sm text-slate-600 border-b border-slate-200 p-3">
                    When
                  </th>
                  <th className="text-left text-sm text-slate-600 border-b border-slate-200 p-3">
                    Notes
                  </th>
                </>,
                <th className="text-left text-sm text-slate-600 border-b border-slate-200 p-3 w-32">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {sortedMedications.map((med) => {
              const due = isDue(med, selectedDate);
              const paused = isPaused(med, selectedDate);
              const resumesOn = paused ? formatResumesOn(med) : null;
              const slotDose = slotDoseByMedId[med.id];
              const taken = slotDose?.taken === true;
              const notTakenRecorded = slotDose !== undefined && slotDose.taken === false;
              const isFlexible = med.dosing_mode === 'flexible_daily';
              const flexEvents = flexibleDoseEvents[med.id] || [];
              const flexCount = flexEvents.length;
              const target = med.target_doses_per_day;
              const flexComplete =
                isFlexible &&
                target != null &&
                flexCount >= target &&
                due;
              const tone = paused
                ? 'bg-gray-200 text-gray-600 opacity-70'
                : !due
                  ? 'bg-gray-50 text-gray-500 opacity-80'
                  : '';

              const takenCell = (
                <td className="p-3 border-b border-slate-200 align-top">
                  {isFlexible ? (
                    due ? (
                      <div className="flex flex-col gap-1.5 min-w-[7rem]">
                        <button
                          type="button"
                          onClick={() => setLogDoseMedId(med.id)}
                          className="px-2 py-1.5 text-xs font-semibold rounded-lg bg-brand-600 text-white hover:bg-brand-700"
                        >
                          Log dose
                        </button>
                        {flexCount > 0 && (
                          <button
                            type="button"
                            onClick={() => onRemoveLastFlexibleDose(med.id)}
                            className="px-2 py-1 text-xs rounded-lg border border-slate-200 text-gray-700 hover:bg-gray-100"
                          >
                            Undo last
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="w-6 h-6 flex items-center justify-center text-gray-400 text-xs font-semibold">
                        —
                      </div>
                    )
                  ) : due ? (
                    <SlotTakenControl
                      medId={med.id}
                      taken={taken}
                      notTakenRecorded={notTakenRecorded}
                      onToggleTaken={onToggleTaken}
                    />
                  ) : (
                    <div className="w-6 h-6 flex items-center justify-center text-gray-400 text-xs font-semibold">
                      —
                    </div>
                  )}
                </td>
              );

              const middleCells = (
                <>
                  <td className="p-3 border-b border-slate-200 font-semibold">
                    {med.name}
                    {paused && (
                      <span className="ml-2 inline-flex flex-col align-middle text-xs px-2 py-1 border border-gray-400 rounded-full text-gray-700 bg-gray-100">
                        <span>Paused</span>
                        {resumesOn && (
                          <span className="font-normal text-[11px] text-gray-600 leading-tight">
                            Resumes on {resumesOn}
                          </span>
                        )}
                      </span>
                    )}
                    {isFlexible && (
                      <span className="block mt-1 text-sm font-normal text-gray-800">
                        {target != null ? (
                          <>
                            <strong>{flexCount}</strong> / {target} doses today
                          </>
                        ) : (
                          <>
                            <strong>{flexCount}</strong> dose{flexCount !== 1 ? 's' : ''} logged today
                          </>
                        )}
                      </span>
                    )}
                    {isFlexible && flexEvents.length > 0 && (
                      <ul className="mt-1.5 text-xs font-normal text-gray-600 list-disc list-inside space-y-0.5">
                        {flexEvents.map((ev) => (
                          <li key={ev.id}>{formatTime(ev.taken_at)}</li>
                        ))}
                      </ul>
                    )}
                    {!isFlexible && med.is_multiple && (
                      <span className="block mt-1 text-xs px-2 py-1 border border-slate-200 rounded-full w-fit text-gray-600">
                        Multiple: {med.time_slot_names.join(', ')}
                      </span>
                    )}
                    {notTakenRecorded && slotDose?.notTakenReason && (
                      <p className="block mt-1.5 text-xs text-gray-700 font-medium leading-snug max-w-md">
                        Not taken: {slotDose.notTakenReason}
                      </p>
                    )}
                  </td>
                  <td className="p-3 border-b border-slate-200">{med.when_text}</td>
                  <td className="p-3 border-b border-slate-200 text-sm text-gray-600">
                    {med.notes || '—'}
                  </td>
                </>
              );

              const actionsCell = (
                <td className="p-3 border-b border-slate-200">
                  <div className="flex items-center gap-0.5">
                    {due && !isFlexible && (
                      <MarkNotTakenButton
                        notTakenRecorded={notTakenRecorded}
                        onClick={() => onOpenMarkNotTaken(med.id)}
                      />
                    )}
                    <button
                      onClick={() => onShowHistory(med.id, med.name, med.dosing_mode)}
                      className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                      title="View history"
                      aria-label="View history"
                    >
                      <History className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => onEditMedication(med)}
                      className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                      title="Edit medication"
                      aria-label="Edit medication"
                    >
                      <Pencil className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </td>
              );

              return (
                <tr
                  key={med.id}
                  className={`
                    ${!isFlexible && taken ? 'text-gray-500 line-through' : ''}
                    ${isFlexible && flexComplete ? 'text-gray-500' : ''}
                    ${!isFlexible && med.is_multiple ? 'bg-yellow-50' : ''}
                    ${isFlexible ? 'bg-brand-50/90' : ''}
                    ${tone}
                  `}
                >
                  {orderSides(controlsFirst, takenCell, middleCells, actionsCell)}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile card view */}
      <div className="md:hidden px-2 pb-3 space-y-2">
        {sortedMedications.map((med) => {
          const due = isDue(med, selectedDate);
          const paused = isPaused(med, selectedDate);
          const resumesOn = paused ? formatResumesOn(med) : null;
          const slotDose = slotDoseByMedId[med.id];
          const taken = slotDose?.taken === true;
          const notTakenRecorded = slotDose !== undefined && slotDose.taken === false;
          const isFlexible = med.dosing_mode === 'flexible_daily';
          const flexEvents = flexibleDoseEvents[med.id] || [];
          const flexCount = flexEvents.length;
          const target = med.target_doses_per_day;
          const flexComplete =
            isFlexible && target != null && flexCount >= target && due;
          const tone = paused
            ? 'bg-gray-200 text-gray-600 opacity-70'
            : !due
              ? 'bg-gray-50 text-gray-500 opacity-80'
              : '';

          const takenControl = isFlexible ? (
            due ? (
              <div className="flex flex-col gap-1.5 flex-shrink-0 mt-0.5">
                <button
                  type="button"
                  onClick={() => setLogDoseMedId(med.id)}
                  className="px-3 py-2 text-xs font-semibold rounded-lg bg-brand-600 text-white hover:bg-brand-700 touch-manipulation"
                >
                  Log dose
                </button>
                {flexCount > 0 && (
                  <button
                    type="button"
                    onClick={() => onRemoveLastFlexibleDose(med.id)}
                    className="px-2 py-1.5 text-xs rounded-lg border border-slate-200 text-gray-700 hover:bg-gray-100 touch-manipulation"
                  >
                    Undo last
                  </button>
                )}
              </div>
            ) : (
              <div className="w-6 h-6 mt-0.5 flex-shrink-0 flex items-center justify-center text-gray-400 text-xs font-semibold">
                —
              </div>
            )
          ) : due ? (
            <SlotTakenControl
              medId={med.id}
              taken={taken}
              notTakenRecorded={notTakenRecorded}
              onToggleTaken={onToggleTaken}
              className="mt-0.5 flex-shrink-0 touch-manipulation"
            />
          ) : (
            <div className="w-6 h-6 mt-0.5 flex-shrink-0 flex items-center justify-center text-gray-400 text-xs font-semibold">
              —
            </div>
          );

          const middle = (
            <div className="flex-1 min-w-0">
              <div
                className={`font-semibold text-sm mb-1 ${!isFlexible && taken ? 'line-through' : ''}`}
              >
                {med.name}
                {paused && (
                  <span className="ml-2 inline-flex flex-col align-middle text-[11px] px-2 py-0.5 border border-gray-400 rounded-full text-gray-700 bg-gray-100">
                    <span>Paused</span>
                    {resumesOn && (
                      <span className="font-normal text-[10px] text-gray-600 leading-tight">
                        Resumes {resumesOn}
                      </span>
                    )}
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-600 mb-1">
                {med.when_text}
              </div>
              {notTakenRecorded && slotDose?.notTakenReason && (
                <div className="text-xs text-gray-700 mb-1 font-medium">
                  Not taken: {slotDose.notTakenReason}
                </div>
              )}
              {isFlexible && (
                <div className="text-xs text-gray-800 mb-1">
                  {target != null ? (
                    <>
                      <strong>{flexCount}</strong> / {target} doses today
                    </>
                  ) : (
                    <>
                      <strong>{flexCount}</strong> dose{flexCount !== 1 ? 's' : ''} logged today
                    </>
                  )}
                </div>
              )}
              {isFlexible && flexEvents.length > 0 && (
                <ul className="text-xs text-gray-600 list-disc list-inside space-y-0.5 mb-1">
                  {flexEvents.map((ev) => (
                    <li key={ev.id}>{formatTime(ev.taken_at)}</li>
                  ))}
                </ul>
              )}
              {!isFlexible && med.is_multiple && (
                <span className="inline-block text-xs px-2 py-0.5 border border-slate-200 rounded-full text-gray-600">
                  Multiple: {med.time_slot_names.join(', ')}
                </span>
              )}
              {med.notes && (
                <div className="mt-2 pt-2 border-t border-slate-200">
                  <div className="text-xs text-gray-500 mb-0.5">Notes:</div>
                  <div className="text-xs text-gray-600">
                    {med.notes}
                  </div>
                </div>
              )}
            </div>
          );

          const actions = (
            <div className="flex items-center gap-0.5 flex-shrink-0">
              {due && !isFlexible && (
                <MarkNotTakenButton
                  notTakenRecorded={notTakenRecorded}
                  onClick={() => onOpenMarkNotTaken(med.id)}
                  className="touch-manipulation"
                  iconClassName="w-5 h-5"
                />
              )}
              <button
                onClick={() => onShowHistory(med.id, med.name, med.dosing_mode)}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors touch-manipulation"
                title="View history"
                aria-label="View history"
              >
                <History className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={() => onEditMedication(med)}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors touch-manipulation"
                title="Edit medication"
                aria-label="Edit medication"
              >
                <Pencil className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          );

          return (
            <div
              key={med.id}
              className={`
                border border-slate-200 rounded-lg p-3
                ${!isFlexible && taken ? 'text-gray-500' : ''}
                ${isFlexible && flexComplete ? 'text-gray-500' : ''}
                ${!isFlexible && med.is_multiple ? 'bg-yellow-50' : ''}
                ${isFlexible ? 'bg-brand-50/90' : !med.is_multiple ? 'bg-white' : ''}
                ${tone}
              `}
            >
              <div className="flex items-start gap-3">
                {orderSides(controlsFirst, takenControl, middle, actions)}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start gap-2 px-2 sm:px-3 py-2 sm:py-3 border-t border-slate-200 text-slate-600 text-xs sm:text-sm">
        <div>
          <strong>{remaining} item{remaining !== 1 ? 's' : ''}</strong> left for this time.
        </div>
        <div className="text-left sm:text-right text-xs">
          Yellow: multiple time blocks. Blue: flexible doses. X in box: not taken (click to mark taken). ✕ in circle: mark as missed with a reason.
        </div>
      </div>

      <LogDoseTimeModal
        isOpen={logDoseMedId !== null}
        medicationName={
          logDoseMedId
            ? medications.find((m) => m.id === logDoseMedId)?.name ?? 'Medication'
            : ''
        }
        selectedDate={selectedDate}
        onClose={() => setLogDoseMedId(null)}
        onConfirm={async (takenAtIso) => {
          if (!logDoseMedId) return;
          await onLogFlexibleDose(logDoseMedId, takenAtIso);
        }}
      />
    </>
  );
}
