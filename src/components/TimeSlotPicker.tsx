import { useState } from 'react';
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
    setIsOpen(!isOpen);
  };

  const handleTimeSlotSelect = (timeSlot: string) => {
    onTimeSlotChange(timeSlot);
    setIsOpen(false);
  };

  const reorderBtn =
    onToggleReorder != null ? (
      <ReorderHeaderButton reorderMode={reorderMode} onToggleReorder={onToggleReorder} />
    ) : null;

  if (availableTimeSlots.length === 0) {
    return (
      <div className="px-2 py-2 sm:px-3 sm:py-2.5 border-b border-slate-200/90 bg-slate-50/95 text-center text-slate-600 text-sm sm:text-base rounded-t-2xl font-medium">
        No sessions yet — open <strong className="font-semibold text-slate-800">Settings</strong> (tracker header)
        and configure Sessions to add Morning, Evening, etc.
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
      <div
        className="px-2 py-2 sm:px-3 sm:py-2.5 border-b border-slate-200/90 bg-slate-50/95 flex justify-between items-center cursor-pointer font-semibold text-sm sm:text-base text-slate-800 touch-manipulation rounded-t-2xl"
        onClick={toggleOptions}
      >
        <span className="inline-flex items-center min-w-0">
          {reorderBtn}
          <span>Showing: {selectedTimeSlot}</span>
        </span>
        <span className="text-lg shrink-0">{isOpen ? '▲' : '▼'}</span>
      </div>
      {isOpen && (
        <div className="grid grid-cols-2 gap-2 p-2 sm:p-3 border-b border-slate-200/60 bg-white/40">
          {availableTimeSlots.map((slot) => (
            <button
              key={slot}
              onClick={() => handleTimeSlotSelect(slot)}
              aria-pressed={selectedTimeSlot === slot}
              className={`px-3 py-2 border rounded-xl font-semibold text-center text-sm sm:text-base touch-manipulation ${
                selectedTimeSlot === slot
                  ? 'border-brand-600 bg-brand-50 text-brand-800 shadow-sm'
                  : 'border-slate-200 bg-white text-slate-900 hover:bg-slate-50'
              }`}
            >
              {slot}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
