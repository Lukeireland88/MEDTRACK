import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface AddMedicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (medication: MedicationFormData) => void;
  onDelete?: (medicationId: string) => void;
  editingMedication?: MedicationFormData | null;
}

export interface MedicationFormData {
  id?: string;
  name: string;
  timeSlots: string[];
  pattern: 'daily' | 'days_of_week' | 'every_n_days_from_start';
  daysOfWeek: number[];
  startDate: string;
  intervalDays: number;
  notes: string;
  endDate: string;
}

const TIME_SLOTS = ['Morning', 'Lunch', 'Evening', 'Night'];
const DAYS_OF_WEEK = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 7, label: 'Sun' },
];

export default function AddMedicationModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  editingMedication,
}: AddMedicationModalProps) {
  const [formData, setFormData] = useState<MedicationFormData>({
    name: '',
    timeSlots: [],
    pattern: 'daily',
    daysOfWeek: [],
    startDate: new Date().toISOString().split('T')[0],
    intervalDays: 1,
    notes: '',
    endDate: '',
  });

  useEffect(() => {
    if (editingMedication) {
      setFormData(editingMedication);
    } else {
      setFormData({
        name: '',
        timeSlots: [],
        pattern: 'daily',
        daysOfWeek: [],
        startDate: new Date().toISOString().split('T')[0],
        intervalDays: 1,
        notes: '',
        endDate: '',
      });
    }
  }, [editingMedication, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || formData.timeSlots.length === 0) {
      alert('Please enter a medication name and select at least one time of day.');
      return;
    }
    onSave(formData);
  };

  const toggleTimeSlot = (slot: string) => {
    setFormData((prev) => ({
      ...prev,
      timeSlots: prev.timeSlots.includes(slot)
        ? prev.timeSlots.filter((s) => s !== slot)
        : [...prev.timeSlots, slot],
    }));
  };

  const toggleDayOfWeek = (day: number) => {
    setFormData((prev) => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter((d) => d !== day)
        : [...prev.daysOfWeek, day],
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-300 p-4 flex justify-between items-center rounded-t-2xl">
          <h2 className="text-xl font-bold">
            {editingMedication ? 'Edit medication' : 'Add medication'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-2">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Bumetanide"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Times of day</label>
            <div className="grid grid-cols-2 gap-3">
              {TIME_SLOTS.map((slot) => (
                <label
                  key={slot}
                  className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-50 rounded-lg"
                >
                  <input
                    type="checkbox"
                    checked={formData.timeSlots.includes(slot)}
                    onChange={() => toggleTimeSlot(slot)}
                    className="w-5 h-5 accent-blue-600"
                  />
                  <span>{slot}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Pattern</label>
            <select
              value={formData.pattern}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  pattern: e.target.value as MedicationFormData['pattern'],
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="daily">Daily</option>
              <option value="days_of_week">Specific days of week</option>
              <option value="every_n_days_from_start">Every N days</option>
            </select>
            <p className="text-sm text-gray-600 mt-1">Choose how often this appears.</p>
          </div>

          {formData.pattern === 'days_of_week' && (
            <div>
              <label className="block text-sm font-semibold mb-2">Select days</label>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDayOfWeek(day.value)}
                    className={`px-4 py-2 border rounded-lg font-semibold ${
                      formData.daysOfWeek.includes(day.value)
                        ? 'border-blue-600 bg-blue-50 text-blue-600'
                        : 'border-gray-300 bg-white text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {formData.pattern === 'every_n_days_from_start' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Start date</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Repeat every (days)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.intervalDays}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      intervalDays: parseInt(e.target.value) || 1,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold mb-2">
              Notes (optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any extra info..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              End date (optional)
            </label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-sm text-gray-600 mt-1">
              Medication will no longer appear after this date.
            </p>
          </div>

          <div className="flex justify-between items-center gap-3 pt-4">
            {editingMedication && onDelete && (
              <button
                type="button"
                onClick={() => {
                  if (
                    confirm(
                      `Are you sure you want to delete ${formData.name}? This cannot be undone.`
                    )
                  ) {
                    onDelete(editingMedication.id!);
                  }
                }}
                className="px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700"
              >
                Delete
              </button>
            )}
            <div className="flex gap-3 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
