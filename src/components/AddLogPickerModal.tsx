import { Activity, StickyNote } from 'lucide-react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import { statusTone } from '../utils/statusTone';

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
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Observations"
      description="Choose what you want to record."
      footer={
        <div className="flex justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      }
    >
      <div className="p-4 sm:p-5 space-y-3">
        <button
          type="button"
          onClick={onPickSeizure}
          className={`w-full inline-flex items-center justify-between gap-3 p-3 rounded-xl border ${statusTone.seizure.border} ${statusTone.seizure.softBg} hover:bg-purple-100 text-left`}
        >
          <span className={`inline-flex items-center gap-2 font-semibold ${statusTone.seizure.text}`}>
            <Activity className="w-5 h-5" />
            Seizure
          </span>
          <span className="text-sm text-purple-800">Duration + notes</span>
        </button>

        <button
          type="button"
          onClick={onPickNote}
          className={`w-full inline-flex items-center justify-between gap-3 p-3 rounded-xl border ${statusTone.note.border} ${statusTone.note.softBg} hover:bg-amber-100 text-left`}
        >
          <span className={`inline-flex items-center gap-2 font-semibold ${statusTone.note.text}`}>
            <StickyNote className="w-5 h-5" />
            Note / measurement
          </span>
          <span className="text-sm text-amber-800">Visits + measurements</span>
        </button>
      </div>
    </Modal>
  );
}
