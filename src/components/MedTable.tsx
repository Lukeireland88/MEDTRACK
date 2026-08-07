import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type ReactNode,
} from 'react';
import {
  Pencil,
  History,
  GripVertical,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Check,
  X,
} from 'lucide-react';
import { DosingMode, MedicationDoseEvent, MedicationWithSlots, SlotDoseState } from '../types';
import { isDue, isPaused } from '../utils/scheduleUtils';
import { medicationIconComponent } from '../utils/medicationIcons';
import LogDoseTimeModal from './LogDoseTimeModal';
import { fromDateInputValue, toLocalDateKey } from '../utils/dateUtils';
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
  /** Persist a new display order for the currently visible medication ids. */
  onReorderMedications: (orderedIds: string[]) => void | Promise<void>;
  reorderMode: boolean;
  onReorderModeChange: (next: boolean) => void;
}

/**
 * Split button: primary Log dose (pending) / ✓ (taken) / ✕ (not taken);
 * chevron menu for less-used Not taken.
 * Primary toggles taken ↔ pending (or switches from not-taken → taken via parent toggle).
 * Not taken opens the reason modal (or edits reason if already not taken).
 */
function DoseStatusControl({
  taken,
  notTakenRecorded,
  onMarkTaken,
  onMarkNotTaken,
  disabled = false,
  className = '',
}: {
  taken: boolean;
  notTakenRecorded: boolean;
  onMarkTaken: () => void;
  onMarkNotTaken: () => void;
  disabled?: boolean;
  className?: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (disabled) setMenuOpen(false);
  }, [disabled]);

  return (
    <div
      ref={rootRef}
      className={`relative inline-flex ${className}`}
      role="group"
      aria-label="Dose status"
    >
      <div
        className={`inline-flex min-h-8 w-[5.75rem] overflow-hidden rounded-md border ${
          notTakenRecorded
            ? 'border-rose-400 bg-rose-50'
            : taken
              ? 'border-emerald-600 bg-emerald-600'
              : 'border-slate-300 bg-white'
        }`}
      >
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            setMenuOpen(false);
            onMarkTaken();
          }}
          aria-pressed={taken}
          aria-label={
            taken
              ? 'Taken. Click to clear.'
              : notTakenRecorded
                ? 'Not taken. Click to mark as taken.'
                : 'Log dose'
          }
          className={`min-h-8 flex-1 px-1.5 text-xs font-semibold inline-flex items-center justify-center whitespace-nowrap transition-colors disabled:opacity-50 touch-manipulation ${
            taken
              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
              : notTakenRecorded
                ? 'bg-rose-50 text-rose-800 hover:bg-rose-100'
                : 'bg-white text-slate-700 hover:bg-slate-100'
          }`}
          title={taken ? 'Clear taken mark' : notTakenRecorded ? 'Mark as taken' : 'Log dose'}
        >
          {taken ? (
            <Check className="w-4 h-4" strokeWidth={2.5} aria-hidden />
          ) : notTakenRecorded ? (
            <X className="w-4 h-4" strokeWidth={2.5} aria-hidden />
          ) : (
            'Log dose'
          )}
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          aria-label={
            notTakenRecorded
              ? 'More options. Not taken is recorded.'
              : 'More dose options'
          }
          className={`min-h-8 w-7 shrink-0 border-l flex items-center justify-center transition-colors disabled:opacity-50 touch-manipulation ${
            notTakenRecorded
              ? 'border-rose-300 bg-rose-600 text-white hover:bg-rose-700'
              : taken
                ? 'border-emerald-500/80 bg-emerald-600 text-white hover:bg-emerald-700'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
          }`}
          title={
            notTakenRecorded
              ? 'Not taken recorded — open menu'
              : 'More options'
          }
        >
          <ChevronDown className="w-3.5 h-3.5" aria-hidden />
        </button>
      </div>

      {menuOpen && !disabled && (
        <div
          role="menu"
          className="absolute left-0 top-full z-30 mt-1 min-w-[8.5rem] whitespace-nowrap rounded-md border border-slate-200 bg-white py-0.5 shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setMenuOpen(false);
              onMarkNotTaken();
            }}
            className={`w-full px-2.5 py-2 text-left text-xs font-semibold touch-manipulation ${
              notTakenRecorded
                ? 'bg-rose-50 text-rose-800'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            {notTakenRecorded ? 'Update not taken…' : 'Not taken…'}
          </button>
        </div>
      )}
    </div>
  );
}

/** Background (and left accent) for a tracker row based on due/pause and dose status.
 * Status accent uses inset shadow so it does not shift layout (unlike border-l).
 */
function medRowSurfaceClass({
  paused,
  due,
  isFlexible,
  taken,
  notTakenRecorded,
  isMultiple,
  mobile = false,
}: {
  paused: boolean;
  due: boolean;
  isFlexible: boolean;
  taken: boolean;
  notTakenRecorded: boolean;
  isMultiple: boolean;
  mobile?: boolean;
}): string {
  if (paused) return 'bg-gray-200 text-gray-600 opacity-70';
  if (!due) return 'bg-gray-50 text-gray-500 opacity-80';
  if (!isFlexible && taken) {
    return 'bg-emerald-100/90 shadow-[inset_4px_0_0_0_theme(colors.emerald.500)]';
  }
  if (!isFlexible && notTakenRecorded) {
    return 'bg-rose-100/90 shadow-[inset_4px_0_0_0_theme(colors.rose.500)]';
  }
  if (isFlexible) return 'bg-brand-50/70';
  if (isMultiple) return 'bg-yellow-50/70';
  return mobile ? 'bg-white/55' : '';
}

function RowActions({
  med,
  onShowHistory,
  onEditMedication,
  touch = false,
}: {
  med: MedicationWithSlots;
  onShowHistory: (medId: string, medName: string, dosingMode?: DosingMode) => void;
  onEditMedication: (med: MedicationWithSlots) => void;
  touch?: boolean;
}) {
  const touchClass = touch ? 'touch-manipulation' : '';
  const iconSize = touch ? 'w-5 h-5' : 'w-4 h-4';

  return (
    <div className="flex items-center gap-0.5 flex-shrink-0">
      <button
        type="button"
        onClick={() => onShowHistory(med.id, med.name, med.dosing_mode)}
        className={`p-2 hover:bg-gray-200 rounded-lg transition-colors ${touchClass}`}
        title="View history"
        aria-label="View history"
      >
        <History className={`${iconSize} text-gray-600`} />
      </button>
      <button
        type="button"
        onClick={() => onEditMedication(med)}
        className={`p-2 hover:bg-gray-200 rounded-lg transition-colors ${touchClass}`}
        title="Edit medication"
        aria-label="Edit medication"
      >
        <Pencil className={`${iconSize} text-gray-600`} />
      </button>
    </div>
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

function sortByDisplayOrder(meds: MedicationWithSlots[]): MedicationWithSlots[] {
  return [...meds].sort((a, b) => {
    const ao = a.sort_order ?? 0;
    const bo = b.sort_order ?? 0;
    if (ao !== bo) return ao - bo;
    return a.name.localeCompare(b.name);
  });
}

/** Due meds first (custom order preserved), then not-due (custom order preserved). */
function partitionDueFirst(
  ids: string[],
  medById: Map<string, MedicationWithSlots>,
  selectedDate: Date
): string[] {
  const meds = ids
    .map((id) => medById.get(id))
    .filter(Boolean) as MedicationWithSlots[];
  const due = meds.filter((m) => isDue(m, selectedDate));
  const notDue = meds.filter((m) => !isDue(m, selectedDate));
  return [...due, ...notDue].map((m) => m.id);
}

function moveId(ids: string[], fromId: string, toId: string): string[] {
  if (fromId === toId) return ids;
  const next = [...ids];
  const from = next.indexOf(fromId);
  const to = next.indexOf(toId);
  if (from < 0 || to < 0) return ids;
  next.splice(from, 1);
  next.splice(to, 0, fromId);
  return next;
}

function moveIdByDelta(
  ids: string[],
  id: string,
  delta: -1 | 1,
  canCross?: (fromId: string, toId: string) => boolean
): string[] {
  const from = ids.indexOf(id);
  if (from < 0) return ids;
  const to = from + delta;
  if (to < 0 || to >= ids.length) return ids;
  if (canCross && !canCross(ids[from], ids[to])) return ids;
  const next = [...ids];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
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
  onShowHistory,
  onReorderMedications,
  reorderMode,
  onReorderModeChange,
}: MedTableProps) {
  const { handedness } = usePreferences();
  const controlsFirst = handedness === 'left';
  const [logDoseMedId, setLogDoseMedId] = useState<string | null>(null);
  const [orderedIds, setOrderedIds] = useState<string[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);

  const medicationsKey = medications.map((m) => m.id).join('|');
  const selectedDateKey = toLocalDateKey(selectedDate);

  const medById = useMemo(() => {
    const map = new Map<string, MedicationWithSlots>();
    medications.forEach((m) => map.set(m.id, m));
    return map;
  }, [medications]);

  useEffect(() => {
    const base = sortByDisplayOrder(medications).map((m) => m.id);
    setOrderedIds(partitionDueFirst(base, medById, selectedDate));
  }, [medicationsKey, selectedDateKey, medById, medications, selectedDate]);

  const sortedMedications = useMemo(() => {
    const list = orderedIds.map((id) => medById.get(id)).filter(Boolean) as MedicationWithSlots[];
    const seen = new Set(orderedIds);
    medications.forEach((m) => {
      if (!seen.has(m.id)) list.push(m);
    });
    const ids = partitionDueFirst(
      list.map((m) => m.id),
      medById,
      selectedDate
    );
    return ids.map((id) => medById.get(id)).filter(Boolean) as MedicationWithSlots[];
  }, [orderedIds, medById, medications, selectedDate]);

  const dueCount = useMemo(
    () => sortedMedications.filter((m) => isDue(m, selectedDate)).length,
    [sortedMedications, selectedDate]
  );

  const sameDueGroup = (aId: string, bId: string) => {
    const a = medById.get(aId);
    const b = medById.get(bId);
    if (!a || !b) return false;
    return isDue(a, selectedDate) === isDue(b, selectedDate);
  };

  const commitOrder = async (nextIds: string[]) => {
    const partitioned = partitionDueFirst(nextIds, medById, selectedDate);
    setOrderedIds(partitioned);
    setSavingOrder(true);
    try {
      await onReorderMedications(partitioned);
    } catch (e) {
      console.error(e);
      const base = sortByDisplayOrder(medications).map((m) => m.id);
      setOrderedIds(partitionDueFirst(base, medById, selectedDate));
      alert('Could not save order. Please try again.');
    } finally {
      setSavingOrder(false);
    }
  };

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

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

  const reorderHandle = (medId: string, index: number) => {
    const displayIds = sortedMedications.map((m) => m.id);
    const atSectionTop = index === 0 || index === dueCount;
    const atSectionBottom =
      index === sortedMedications.length - 1 || index === dueCount - 1;

    return (
    <div className="flex items-center gap-0.5 shrink-0">
      <button
        type="button"
        draggable={!savingOrder}
        onDragStart={(e) => {
          setDraggingId(medId);
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', medId);
        }}
        onDragEnd={() => setDraggingId(null)}
        className="hidden pointer-fine:inline-flex p-1.5 rounded-lg text-slate-500 cursor-grab active:cursor-grabbing hover:bg-slate-200"
        title="Drag to reorder"
        aria-label={`Drag to reorder ${medById.get(medId)?.name ?? 'medication'}`}
        disabled={savingOrder}
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <div className="flex flex-col">
        <button
          type="button"
          className="p-1.5 sm:p-1 rounded-lg text-slate-600 hover:bg-slate-200 disabled:opacity-30 touch-manipulation"
          disabled={atSectionTop || savingOrder}
          onClick={() =>
            void commitOrder(moveIdByDelta(displayIds, medId, -1, sameDueGroup))
          }
          aria-label="Move up"
        >
          <ChevronUp className="w-5 h-5 sm:w-4 sm:h-4" />
        </button>
        <button
          type="button"
          className="p-1.5 sm:p-1 rounded-lg text-slate-600 hover:bg-slate-200 disabled:opacity-30 touch-manipulation"
          disabled={atSectionBottom || savingOrder}
          onClick={() =>
            void commitOrder(moveIdByDelta(displayIds, medId, 1, sameDueGroup))
          }
          aria-label="Move down"
        >
          <ChevronDown className="w-5 h-5 sm:w-4 sm:h-4" />
        </button>
      </div>
    </div>
    );
  };

  const rowDragProps = (medId: string) =>
    reorderMode
      ? {
          onDragOver: (e: DragEvent) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
          },
          onDrop: (e: DragEvent) => {
            e.preventDefault();
            const fromId = e.dataTransfer.getData('text/plain') || draggingId;
            if (!fromId) return;
            if (!sameDueGroup(fromId, medId)) {
              setDraggingId(null);
              return;
            }
            const displayIds = sortedMedications.map((m) => m.id);
            void commitOrder(moveId(displayIds, fromId, medId));
            setDraggingId(null);
          },
        }
      : {};

  return (
    <>
      {/* Desktop table view */}
      <div className="hidden md:block px-3 pb-3">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-100/50">
              <th className="text-left text-sm text-slate-600 border-b border-slate-200 p-2 w-10">
                <button
                  type="button"
                  onClick={() => onReorderModeChange(!reorderMode)}
                  className={`inline-flex items-center justify-center rounded-lg p-1.5 transition-colors ${
                    reorderMode
                      ? 'bg-slate-900 text-white hover:bg-slate-800'
                      : 'text-slate-600 hover:bg-slate-200/80'
                  }`}
                  aria-pressed={reorderMode}
                  title={
                    reorderMode
                      ? savingOrder
                        ? 'Saving order…'
                        : 'Done reordering'
                      : 'Reorder medications'
                  }
                  aria-label={reorderMode ? 'Done reordering' : 'Reorder medications'}
                >
                  <ArrowUpDown className="w-4 h-4" />
                </button>
              </th>
              {orderSides(
                controlsFirst,
                <th className="text-left text-sm text-slate-600 border-b border-slate-200 p-3 w-24">
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
                <th className="text-left text-sm text-slate-600 border-b border-slate-200 p-3 w-24">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {sortedMedications.map((med, index) => {
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
              const rowSurface = medRowSurfaceClass({
                paused,
                due,
                isFlexible,
                taken,
                notTakenRecorded,
                isMultiple: med.is_multiple,
              });
              const MedIcon = medicationIconComponent(med.icon);

              const takenCell = (
                <td className="p-3 border-b border-slate-200 align-top">
                  {isFlexible ? (
                    due ? (
                      <div className="flex flex-col gap-1 min-w-0">
                        <button
                          type="button"
                          onClick={() => setLogDoseMedId(med.id)}
                          disabled={reorderMode}
                          className="px-2 py-1 text-xs font-semibold rounded-md bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 whitespace-nowrap"
                        >
                          Log dose
                        </button>
                        {flexCount > 0 && (
                          <button
                            type="button"
                            onClick={() => onRemoveLastFlexibleDose(med.id)}
                            disabled={reorderMode}
                            className="px-1.5 py-0.5 text-[11px] rounded-md border border-slate-200 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
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
                    <DoseStatusControl
                      taken={taken}
                      notTakenRecorded={notTakenRecorded}
                      onMarkTaken={() => onToggleTaken(med.id)}
                      onMarkNotTaken={() => onOpenMarkNotTaken(med.id)}
                      disabled={reorderMode}
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
                    <span className="inline-flex items-center gap-2 min-w-0">
                      <MedIcon className="w-4 h-4 shrink-0 text-slate-500" aria-hidden />
                      <span className="min-w-0">{med.name}</span>
                    </span>
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
                  <RowActions
                    med={med}
                    onShowHistory={onShowHistory}
                    onEditMedication={onEditMedication}
                  />
                </td>
              );

              return (
                <tr
                  key={med.id}
                  {...rowDragProps(med.id)}
                  className={`
                    ${!isFlexible && taken ? 'text-gray-500 line-through' : ''}
                    ${isFlexible && flexComplete ? 'text-gray-500' : ''}
                    ${rowSurface}
                    ${draggingId === med.id ? 'opacity-60 ring-2 ring-brand-400' : ''}
                    ${reorderMode ? 'cursor-default' : ''}
                  `}
                >
                  <td className="p-2 border-b border-slate-200 align-middle w-10">
                    {reorderMode ? reorderHandle(med.id, index) : null}
                  </td>
                  {orderSides(controlsFirst, takenCell, middleCells, actionsCell)}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile card view */}
      <div className="md:hidden px-2 pt-2 pb-3 space-y-2">
        {reorderMode && (
          <p className="text-xs text-slate-600 px-0.5">
            Use the up/down arrows to move a row{savingOrder ? ' · Saving…' : ''}.
          </p>
        )}
        {sortedMedications.map((med, index) => {
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
          const rowSurface = medRowSurfaceClass({
            paused,
            due,
            isFlexible,
            taken,
            notTakenRecorded,
            isMultiple: med.is_multiple,
            mobile: true,
          });
          const MedIcon = medicationIconComponent(med.icon);

          const takenControl = isFlexible ? (
            due ? (
              <div className="flex flex-col gap-1 flex-shrink-0 mt-0.5">
                <button
                  type="button"
                  onClick={() => setLogDoseMedId(med.id)}
                  disabled={reorderMode}
                  className="px-2 py-1 text-xs font-semibold rounded-md bg-brand-600 text-white hover:bg-brand-700 touch-manipulation disabled:opacity-50 whitespace-nowrap"
                >
                  Log dose
                </button>
                {flexCount > 0 && (
                  <button
                    type="button"
                    onClick={() => onRemoveLastFlexibleDose(med.id)}
                    disabled={reorderMode}
                    className="px-1.5 py-1 text-[11px] rounded-md border border-slate-200 text-gray-700 hover:bg-gray-100 touch-manipulation disabled:opacity-50"
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
            <DoseStatusControl
              taken={taken}
              notTakenRecorded={notTakenRecorded}
              onMarkTaken={() => onToggleTaken(med.id)}
              onMarkNotTaken={() => onOpenMarkNotTaken(med.id)}
              disabled={reorderMode}
              className="flex-shrink-0 mt-0.5"
            />
          ) : (
            <div className="w-6 h-6 mt-0.5 flex-shrink-0 flex items-center justify-center text-gray-400 text-xs font-semibold">
              —
            </div>
          );

          const middle = (
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm mb-1 inline-flex items-center gap-2 min-w-0">
                <MedIcon className="w-4 h-4 shrink-0 text-slate-500" aria-hidden />
                <span className={`min-w-0 ${!isFlexible && taken ? 'line-through' : ''}`}>
                  {med.name}
                </span>
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
            <RowActions
              med={med}
              onShowHistory={onShowHistory}
              onEditMedication={onEditMedication}
              touch
            />
          );

          return (
            <div
              key={med.id}
              {...rowDragProps(med.id)}
              className={`
                border border-slate-200 rounded-lg p-3
                ${!isFlexible && taken ? 'text-gray-500' : ''}
                ${isFlexible && flexComplete ? 'text-gray-500' : ''}
                ${rowSurface}
                ${draggingId === med.id ? 'opacity-60 ring-2 ring-brand-400' : ''}
              `}
            >
              <div className="flex items-start gap-2">
                {reorderMode && reorderHandle(med.id, index)}
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  {orderSides(controlsFirst, takenControl, middle, actions)}
                </div>
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
          Yellow: multiple time blocks. Blue: flexible doses. Log dose (✓ / ✕ when set); use ▾ for Not taken (asks for a reason).
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
