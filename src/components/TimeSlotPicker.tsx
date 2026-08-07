import { useState, type KeyboardEvent } from 'react';
import { ArrowUpDown } from 'lucide-react';

interface TimeSlotPickerProps {
  selectedTimeSlot: string;
  onTimeSlotChange: (timeSlot: string) => void;
  availableTimeSlots: string[];
  /** Mobile: compact reorder control in the session header (desktop uses the table header). */
  reorderMode?: boolean;
  onToggleReorder?: () => void;
}

function ReorderHeaderButton({
  reorderMode,
  onToggleReorder,
}: {
  reorderMode: boolean;
  onToggleReorder: () => void;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggleReorder();
      }}
      className={`md:hidden inline-flex items-center justify-center rounded-lg p-1.5 -ml-0.5 mr-1.5 shrink-0 transition-colors touch-manipulation ${
        reorderMode
          ? 'bg-slate-900 text-white'
          : 'text-slate-600 hover:bg-slate-200/80'
      }`}
      aria-pressed={reorderMode}
      title={reorderMode ? 'Done reordering' : 'Reorder medications'}
      aria-label={reorderMode ? 'Done reordering' : 'Reorder medications'}
    >
      <ArrowUpDown className="w-4 h-4" />
    </button>
  );
}

export default function TimeSlotPicker({
  selectedTimeSlot,
  onTimeSlotChange,
  availableTimeSlots,
  reorderMode = false,
  onToggleReorder,
}: TimeSlotPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOptions = () => {
    setIsOpen((open) => !open);
  };

  const handleTimeSlotSelect = (timeSlot: string) => {
    onTimeSlotChange(timeSlot);
    setIsOpen(false);
  };

  const onTriggerKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen(true);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const reorderBtn =
    onToggleReorder != null ? (
      <ReorderHeaderButton reorderMode={reorderMode} onToggleReorder={onToggleReorder} />
    ) : null;

  if (availableTimeSlots.length === 0) {
    return (
      <div className="px-2 py-2 sm:px-3 sm:py-2.5 border-b border-slate-200/90 bg-slate-50/95 text-center text-slate-600 text-sm sm:text-base rounded-t-2xl font-medium">
        No sessions yet — open <strong className="font-semibold text-slate-800">Settings</strong> (tracker
        header) and configure Sessions to add Morning, Evening, etc.
      </div>
    );
  }

  if (availableTimeSlots.length === 1) {
    return (
      <div className="px-2 py-2 sm:px-3 sm:py-2.5 border-b border-slate-200/90 bg-slate-50/95 font-semibold text-sm sm:text-base text-slate-800 rounded-t-2xl flex items-center">
        {reorderBtn}
        <span>Showing: {availableTimeSlots[0]}</span>
      </div>
    );
  }

  return (
    <div>
      <div className="px-2 py-2 sm:px-3 sm:py-2.5 border-b border-slate-200/90 bg-slate-50/95 flex justify-between items-center font-semibold text-sm sm:text-base text-slate-800 rounded-t-2xl gap-2">
        <div className="inline-flex items-center min-w-0 flex-1">
          {reorderBtn}
          <button
            type="button"
            className="min-w-0 flex-1 text-left touch-manipulation rounded-lg py-0.5 -my-0.5"
            onClick={toggleOptions}
            onKeyDown={onTriggerKeyDown}
            aria-expanded={isOpen}
            aria-controls="session-tablist"
            id="session-picker-trigger"
          >
            Showing: {selectedTimeSlot}
          </button>
        </div>
        <button
          type="button"
          className="text-lg shrink-0 touch-manipulation p-1 rounded-lg hover:bg-slate-200/80"
          onClick={toggleOptions}
          aria-expanded={isOpen}
          aria-controls="session-tablist"
          aria-label={isOpen ? 'Hide sessions' : 'Show sessions'}
        >
          <span aria-hidden>{isOpen ? '▲' : '▼'}</span>
        </button>
      </div>
      {isOpen && (
        <div
          id="session-tablist"
          role="tablist"
          aria-labelledby="session-picker-trigger"
          className="grid grid-cols-2 gap-2 p-2 sm:p-3 border-b border-slate-200/60 bg-white/40"
        >
          {availableTimeSlots.map((slot) => {
            const selected = selectedTimeSlot === slot;
            return (
              <button
                key={slot}
                type="button"
                role="tab"
                aria-selected={selected}
                tabIndex={selected ? 0 : -1}
                onClick={() => handleTimeSlotSelect(slot)}
                onKeyDown={(e) => {
                  const idx = availableTimeSlots.indexOf(slot);
                  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                    e.preventDefault();
                    const next = availableTimeSlots[(idx + 1) % availableTimeSlots.length];
                    onTimeSlotChange(next);
                  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                    e.preventDefault();
                    const prev =
                      availableTimeSlots[
                        (idx - 1 + availableTimeSlots.length) % availableTimeSlots.length
                      ];
                    onTimeSlotChange(prev);
                  } else if (e.key === 'Home') {
                    e.preventDefault();
                    onTimeSlotChange(availableTimeSlots[0]);
                  } else if (e.key === 'End') {
                    e.preventDefault();
                    onTimeSlotChange(availableTimeSlots[availableTimeSlots.length - 1]);
                  } else if (e.key === 'Escape') {
                    setIsOpen(false);
                  }
                }}
                className={`px-3 py-2 border rounded-xl font-semibold text-center text-sm sm:text-base touch-manipulation ${
                  selected
                    ? 'border-brand-600 bg-brand-50 text-brand-800 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-900 hover:bg-slate-50'
                }`}
              >
                {slot}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
