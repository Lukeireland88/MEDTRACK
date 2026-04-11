import { useState } from 'react';

interface TimeSlotPickerProps {
  selectedTimeSlot: string;
  onTimeSlotChange: (timeSlot: string) => void;
  availableTimeSlots: string[];
}

export default function TimeSlotPicker({ selectedTimeSlot, onTimeSlotChange, availableTimeSlots }: TimeSlotPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOptions = () => {
    setIsOpen(!isOpen);
  };

  const handleTimeSlotSelect = (timeSlot: string) => {
    onTimeSlotChange(timeSlot);
    setIsOpen(false);
  };

  if (availableTimeSlots.length === 0) {
    return (
      <div className="p-2 sm:p-3 border-b border-brand-100/80 bg-gradient-to-r from-brand-50/90 to-slate-50/80 text-center text-brand-800/80 text-sm sm:text-base rounded-t-2xl font-medium">
        No medications scheduled
      </div>
    );
  }

  if (availableTimeSlots.length === 1) {
    return (
      <div className="p-2 sm:p-3 border-b border-brand-100/80 bg-gradient-to-r from-brand-50/90 to-slate-50/80 font-semibold text-sm sm:text-base text-brand-950 rounded-t-2xl">
        <span>Showing: {availableTimeSlots[0]}</span>
      </div>
    );
  }

  return (
    <div>
      <div
        className="p-2 sm:p-3 border-b border-brand-100/80 bg-gradient-to-r from-brand-50/90 to-slate-50/80 flex justify-between items-center cursor-pointer font-semibold text-sm sm:text-base text-brand-950 touch-manipulation rounded-t-2xl"
        onClick={toggleOptions}
      >
        <span>Showing: {selectedTimeSlot}</span>
        <span className="text-lg">{isOpen ? '▲' : '▼'}</span>
      </div>
      {isOpen && (
        <div className="grid grid-cols-2 gap-2 p-2 sm:p-3 border-b border-slate-200 bg-white">
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
