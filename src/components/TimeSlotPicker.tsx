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
      <div className="p-2 sm:p-3 border-b border-slate-200 bg-slate-50/80 text-center text-slate-500 text-sm sm:text-base rounded-t-2xl">
        No medications scheduled
      </div>
    );
  }

  if (availableTimeSlots.length === 1) {
    return (
      <div className="p-2 sm:p-3 border-b border-slate-200 bg-slate-50/80 font-semibold text-sm sm:text-base text-slate-800 rounded-t-2xl">
        <span>Showing: {availableTimeSlots[0]}</span>
      </div>
    );
  }

  return (
    <div>
      <div
        className="p-2 sm:p-3 border-b border-slate-200 bg-slate-50/80 flex justify-between items-center cursor-pointer font-semibold text-sm sm:text-base text-slate-800 touch-manipulation rounded-t-2xl"
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
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
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
