import { AlertTriangle } from 'lucide-react';
import Modal from './ui/Modal';
import Button from './ui/Button';

interface DoseLimitWarningModalProps {
  isOpen: boolean;
  medicationName: string;
  messages: string[];
  onCancel: () => void;
  onContinue: () => void;
  continuing?: boolean;
}

export default function DoseLimitWarningModal({
  isOpen,
  medicationName,
  messages,
  onCancel,
  onContinue,
  continuing = false,
}: DoseLimitWarningModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      zIndexClass="z-[70]"
      role="alertdialog"
      title={
        <span className="inline-flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
            <AlertTriangle className="w-5 h-5" aria-hidden />
          </span>
          Dose limit warning
        </span>
      }
      description={medicationName}
      footer={
        <div className="flex flex-wrap gap-2 justify-end">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={continuing}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onContinue}
            disabled={continuing}
            className="!bg-amber-600 hover:!bg-amber-700 shadow-none"
          >
            {continuing ? 'Saving…' : 'Log anyway'}
          </Button>
        </div>
      }
    >
      <div className="p-4 sm:p-5 space-y-2 text-sm text-slate-800">
        <p>This dose may exceed a safety setting for this medication:</p>
        <ul className="list-disc list-inside space-y-1.5 text-slate-700">
          {messages.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
        <p className="text-slate-600 pt-1">
          You can cancel, or continue if you still want to record it.
        </p>
      </div>
    </Modal>
  );
}
