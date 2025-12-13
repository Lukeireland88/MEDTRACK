import { useState } from 'react';

interface TimeSlotPickerProps {
  selectedTimeSlot: string;
  onTimeSlotChange: (timeSlot: string) => void;
}

const TIME_SLOTS = ['Morning', 'Lunch', 'Evening', 'Night'];

export default function TimeSlotPicker({ selectedTimeSlot, onTimeSlotChange }: TimeSlotPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOptions = () => {
    setIsOpen(!isOpen);
  };

  const handleTimeSlotSelect = (timeSlot: string) => {
    onTimeSlotChange(timeSlot);
    setIsOpen(false);
  };

  return (
    <div>
      <div
        className="p-3 border-b border-gray-300 flex justify-between items-center cursor-pointer font-semibold"
        onClick={toggleOptions}
      >
        <span>Showing: {selectedTimeSlot}</span>
        <span>{isOpen ? '▲' : '▼'}</span>
      </div>
      {isOpen && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 border-b border-gray-300">
          {TIME_SLOTS.map((slot) => (
            <button
              key={slot}
              onClick={() => handleTimeSlotSelect(slot)}
              aria-pressed={selectedTimeSlot === slot}
              className={`px-3 py-2 border rounded-xl font-semibold text-center ${
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
