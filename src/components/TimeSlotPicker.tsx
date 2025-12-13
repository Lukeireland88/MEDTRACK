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
      <div className="p-2 sm:p-3 border-b border-gray-300 text-center text-gray-500 text-sm sm:text-base">
        No medications scheduled
      </div>
    );
  }

  if (availableTimeSlots.length === 1) {
    return (
      <div className="p-2 sm:p-3 border-b border-gray-300 font-semibold text-sm sm:text-base">
        <span>Showing: {availableTimeSlots[0]}</span>
      </div>
    );
  }

  return (
    <div>
      <div
        className="p-2 sm:p-3 border-b border-gray-300 flex justify-between items-center cursor-pointer font-semibold text-sm sm:text-base touch-manipulation"
        onClick={toggleOptions}
      >
        <span>Showing: {selectedTimeSlot}</span>
        <span className="text-lg">{isOpen ? '▲' : '▼'}</span>
      </div>
      {isOpen && (
        <div className="grid grid-cols-2 gap-2 p-2 sm:p-3 border-b border-gray-300">
          {availableTimeSlots.map((slot) => (
            <button
              key={slot}
              onClick={() => handleTimeSlotSelect(slot)}
              aria-pressed={selectedTimeSlot === slot}
              className={`px-3 py-2 border rounded-xl font-semibold text-center text-sm sm:text-base touch-manipulation ${
                selectedTimeSlot === slot
                  ? 'border-blue-600 bg-blue-50 text-blue-600'
                  : 'border-gray-300 bg-white text-gray-900 hover:bg-gray-50'
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
