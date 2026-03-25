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
  dosingMode: 'time_slots' | 'flexible_daily';
  timeSlots: string[];
  targetDosesPerDay: number | '';
  pattern: 'daily' | 'days_of_week' | 'every_n_days_from_start';
  daysOfWeek: number[];
  startDate: string;
  intervalDays: number;
  notes: string;
  endDate: string;
  pauseStartDate: string;
  pauseEndDate: string;
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
    dosingMode: 'time_slots',
    timeSlots: [],
    targetDosesPerDay: '',
    pattern: 'daily',
    daysOfWeek: [],
    startDate: '',
    intervalDays: 1,
    notes: '',
    endDate: '',
    pauseStartDate: '',
    pauseEndDate: '',
  });

  useEffect(() => {
    if (editingMedication) {
      setFormData(editingMedication);
    } else {
      setFormData({
        name: '',
        dosingMode: 'time_slots',
        timeSlots: [],
        targetDosesPerDay: '',
        pattern: 'daily',
        daysOfWeek: [],
        startDate: '',
        intervalDays: 1,
        notes: '',
        endDate: '',
        pauseStartDate: '',
        pauseEndDate: '',
      });
    }
  }, [editingMedication, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Please enter a medication name.');
      return;
    }
    if (formData.dosingMode === 'time_slots' && formData.timeSlots.length === 0) {
      alert('Select at least one time of day, or switch to flexible daily dosing.');
      return;
    }
    if (formData.dosingMode === 'flexible_daily') {
      const n =
        formData.targetDosesPerDay === '' ? null : Number(formData.targetDosesPerDay);
      if (n != null && (Number.isNaN(n) || n < 1)) {
        alert('Target doses per day must be at least 1, or leave blank to track without a daily goal.');
        return;
      }
    }
    if ((formData.pauseStartDate && formData.pauseEndDate) && formData.pauseStartDate > formData.pauseEndDate) {
      alert('Pause start date must be on or before the pause end date.');
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
            <label className="block text-sm font-semibold mb-2">How to schedule</label>
            <div className="space-y-2">
              <label className="flex items-start gap-2 cursor-pointer p-2 rounded-lg border border-gray-200 hover:bg-gray-50">
                <input
                  type="radio"
                  name="dosingMode"
                  checked={formData.dosingMode === 'time_slots'}
                  onChange={() => setFormData({ ...formData, dosingMode: 'time_slots' })}
                  className="mt-1 accent-blue-600"
                />
                <span>
                  <span className="font-medium">Morning / Lunch / Evening / Night</span>
                  <span className="block text-sm text-gray-600">
                    One check per selected time block (same as now).
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-2 cursor-pointer p-2 rounded-lg border border-gray-200 hover:bg-gray-50">
                <input
                  type="radio"
                  name="dosingMode"
                  checked={formData.dosingMode === 'flexible_daily'}
                  onChange={() => setFormData({ ...formData, dosingMode: 'flexible_daily' })}
                  className="mt-1 accent-blue-600"
                />
                <span>
                  <span className="font-medium">Flexible — multiple times per day</span>
                  <span className="block text-sm text-gray-600">
                    Log each dose with a timestamp; optional daily goal.
                  </span>
                </span>
              </label>
            </div>
          </div>

          {formData.dosingMode === 'time_slots' && (
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
          )}

          {formData.dosingMode === 'flexible_daily' && (
            <div>
              <label className="block text-sm font-semibold mb-2">
                Target doses per day (optional)
              </label>
              <input
                type="number"
                min={1}
                placeholder="e.g. 4 — leave empty to only track count"
                value={formData.targetDosesPerDay === '' ? '' : formData.targetDosesPerDay}
                onChange={(e) => {
                  const v = e.target.value;
                  setFormData({
                    ...formData,
                    targetDosesPerDay: v === '' ? '' : parseInt(v, 10) || '',
                  });
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-sm text-gray-600 mt-1">
                You can log more or fewer doses; this is just a daily goal for progress.
              </p>
            </div>
          )}

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
          )}

          <div>
            <label className="block text-sm font-semibold mb-2">
              Start date (optional)
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) =>
                setFormData({ ...formData, startDate: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-sm text-gray-600 mt-1">
              When you started taking this medication.
            </p>
          </div>

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

          <div>
            <label className="block text-sm font-semibold mb-2">
              Pause date range (optional)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Pause from
                </label>
                <input
                  type="date"
                  value={formData.pauseStartDate}
                  onChange={(e) =>
                    setFormData({ ...formData, pauseStartDate: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Pause until
                </label>
                <input
                  type="date"
                  value={formData.pauseEndDate}
                  onChange={(e) =>
                    setFormData({ ...formData, pauseEndDate: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, pauseStartDate: '', pauseEndDate: '' })}
                className="px-3 py-1.5 text-xs rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Clear pause
              </button>
              <p className="text-sm text-gray-600">
                While paused, this medication appears greyed out and cannot be checked/logged.
              </p>
            </div>
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
