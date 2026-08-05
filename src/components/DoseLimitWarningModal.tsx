import { AlertTriangle, X } from 'lucide-react';

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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4">
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
        role="alertdialog"
        aria-labelledby="dose-limit-title"
        aria-describedby="dose-limit-desc"
      >
        <div className="flex justify-between items-start gap-3 mb-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
              <AlertTriangle className="w-5 h-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <h2 id="dose-limit-title" className="text-lg font-bold text-gray-900">
                Dose limit warning
              </h2>
              <p className="text-sm text-gray-600 mt-1">{medicationName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1 hover:bg-gray-100 rounded-lg shrink-0"
            aria-label="Cancel"
            disabled={continuing}
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        <div id="dose-limit-desc" className="space-y-2 text-sm text-gray-800 mb-5">
          <p>This dose may exceed a safety setting for this medication:</p>
          <ul className="list-disc list-inside space-y-1.5 text-gray-700">
            {messages.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
          <p className="text-gray-600 pt-1">
            You can cancel, or continue if you still want to record it.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={continuing}
            className="px-4 py-2 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onContinue}
            disabled={continuing}
            className="px-4 py-2 bg-amber-600 text-white rounded-xl font-semibold hover:bg-amber-700 disabled:opacity-60"
          >
            {continuing ? 'Saving…' : 'Log anyway'}
          </button>
        </div>
      </div>
    </div>
  );
}
