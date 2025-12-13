import { Edit2, History } from 'lucide-react';
import { MedicationWithSlots } from '../types';
import { isDue } from '../utils/scheduleUtils';

interface MedTableProps {
  medications: MedicationWithSlots[];
  selectedDate: Date;
  takenStatus: Record<string, boolean>;
  onToggleTaken: (medId: string) => void;
  onEditMedication: (med: MedicationWithSlots) => void;
  onShowHistory: (medId: string, medName: string) => void;
}

export default function MedTable({
  medications,
  selectedDate,
  takenStatus,
  onToggleTaken,
  onEditMedication,
  onShowHistory
}: MedTableProps) {
  const remaining = medications.filter(
    (med) => isDue(med, selectedDate) && !takenStatus[med.id]
  ).length;

  const sortedMedications = [...medications].sort((a, b) => {
    const aDue = isDue(a, selectedDate);
    const bDue = isDue(b, selectedDate);

    // Not due meds go to the bottom
    if (aDue && !bDue) return -1;
    if (!aDue && bDue) return 1;

    // Within due meds: daily first, then multiple
    if (aDue && bDue) {
      if (!a.is_multiple && b.is_multiple) return -1;
      if (a.is_multiple && !b.is_multiple) return 1;
    }

    // Alphabetical within each group
    return a.name.localeCompare(b.name);
  });

  return (
    <>
      {/* Desktop table view */}
      <div className="hidden md:block px-3 pb-3">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left text-sm text-gray-600 border-b border-gray-300 p-3 w-14">
                Taken
              </th>
              <th className="text-left text-sm text-gray-600 border-b border-gray-300 p-3">
                Medication
              </th>
              <th className="text-left text-sm text-gray-600 border-b border-gray-300 p-3">
                When
              </th>
              <th className="text-left text-sm text-gray-600 border-b border-gray-300 p-3">
                Notes
              </th>
              <th className="text-left text-sm text-gray-600 border-b border-gray-300 p-3 w-20">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedMedications.map((med) => {
              const due = isDue(med, selectedDate);
              const taken = takenStatus[med.id] || false;

              return (
                <tr
                  key={med.id}
                  className={`
                    ${taken ? 'text-gray-500 line-through' : ''}
                    ${med.is_multiple ? 'bg-yellow-50' : ''}
                    ${!due ? 'bg-gray-200 text-gray-600' : ''}
                  `}
                >
                  <td className="p-3 border-b border-gray-300">
                    <input
                      type="checkbox"
                      checked={taken}
                      disabled={!due}
                      onChange={() => onToggleTaken(med.id)}
                      className="w-6 h-6 accent-blue-600 cursor-pointer"
                    />
                  </td>
                  <td className="p-3 border-b border-gray-300 font-semibold">
                    {med.name}
                    {med.is_multiple && (
                      <span className="block mt-1 text-xs px-2 py-1 border border-gray-300 rounded-full w-fit text-gray-600">
                        Multiple: {med.time_slot_names.join(', ')}
                      </span>
                    )}
                  </td>
                  <td className="p-3 border-b border-gray-300">{med.when_text}</td>
                  <td className="p-3 border-b border-gray-300 text-sm text-gray-600">
                    {med.notes || '—'}
                  </td>
                  <td className="p-3 border-b border-gray-300">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onShowHistory(med.id, med.name)}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                        title="View history"
                        aria-label="View history"
                      >
                        <History className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => onEditMedication(med)}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                        title="Edit medication"
                        aria-label="Edit medication"
                      >
                        <Edit2 className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile card view */}
      <div className="md:hidden px-2 pb-3 space-y-2">
        {sortedMedications.map((med) => {
          const due = isDue(med, selectedDate);
          const taken = takenStatus[med.id] || false;

          return (
            <div
              key={med.id}
              className={`
                border border-gray-300 rounded-lg p-3
                ${taken ? 'text-gray-500' : ''}
                ${med.is_multiple ? 'bg-yellow-50' : 'bg-white'}
                ${!due ? 'bg-gray-200 text-gray-600' : ''}
              `}
            >
              <div className="flex items-start gap-3 mb-2">
                <input
                  type="checkbox"
                  checked={taken}
                  disabled={!due}
                  onChange={() => onToggleTaken(med.id)}
                  className="w-6 h-6 mt-0.5 accent-blue-600 cursor-pointer flex-shrink-0 touch-manipulation"
                />
                <div className="flex-1 min-w-0">
                  <div className={`font-semibold text-sm mb-1 ${taken ? 'line-through' : ''}`}>
                    {med.name}
                  </div>
                  <div className="text-xs text-gray-600 mb-1">
                    {med.when_text}
                  </div>
                  {med.is_multiple && (
                    <span className="inline-block text-xs px-2 py-0.5 border border-gray-300 rounded-full text-gray-600">
                      Multiple: {med.time_slot_names.join(', ')}
                    </span>
                  )}
                </div>
              </div>

              {(med.notes || true) && (
                <div className="flex items-start justify-between gap-3 pt-2 border-t border-gray-300">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-500 mb-0.5">Notes:</div>
                    <div className="text-xs text-gray-600">
                      {med.notes || '—'}
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <button
                      onClick={() => onShowHistory(med.id, med.name)}
                      className="p-2 hover:bg-gray-200 rounded-lg transition-colors touch-manipulation"
                      title="View history"
                      aria-label="View history"
                    >
                      <History className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => onEditMedication(med)}
                      className="p-2 hover:bg-gray-200 rounded-lg transition-colors touch-manipulation"
                      title="Edit medication"
                      aria-label="Edit medication"
                    >
                      <Edit2 className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start gap-2 px-2 sm:px-3 py-2 sm:py-3 border-t border-gray-300 text-gray-600 text-xs sm:text-sm">
        <div>
          <strong>{remaining} item{remaining !== 1 ? 's' : ''}</strong> left for this time.
        </div>
        <div className="text-left sm:text-right text-xs">
          Highlighted items show all times they are used.
        </div>
      </div>
    </>
  );
}
