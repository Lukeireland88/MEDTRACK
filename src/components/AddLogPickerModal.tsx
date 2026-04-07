import { X, Activity, StickyNote } from 'lucide-react';

interface AddLogPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPickSeizure: () => void;
  onPickNote: () => void;
}

export default function AddLogPickerModal({
  isOpen,
  onClose,
  onPickSeizure,
  onPickNote,
}: AddLogPickerModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="flex items-start justify-between gap-3 p-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Add log</h2>
            <p className="text-sm text-gray-600 mt-1">Choose what you want to record.</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg" aria-label="Close">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <button
            type="button"
            onClick={onPickSeizure}
            className="w-full inline-flex items-center justify-between gap-3 p-3 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-left"
          >
            <span className="inline-flex items-center gap-2 font-semibold text-purple-950">
              <Activity className="w-5 h-5" />
              Seizure
            </span>
            <span className="text-sm text-purple-800">Duration + notes</span>
          </button>

          <button
            type="button"
            onClick={onPickNote}
            className="w-full inline-flex items-center justify-between gap-3 p-3 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-left"
          >
            <span className="inline-flex items-center gap-2 font-semibold text-amber-950">
              <StickyNote className="w-5 h-5" />
              Note / measurement
            </span>
            <span className="text-sm text-amber-800">Visits + measurements</span>
          </button>
        </div>

        <div className="p-4 pt-0 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg font-semibold text-gray-800 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

