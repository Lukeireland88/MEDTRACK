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
      <div className="px-3 pb-3">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left text-sm text-gray-600 border-b border-gray-300 p-3">
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
                    ${!due ? 'bg-gray-100 text-gray-600' : ''}
                  `}
                >
                  <td className="p-3 border-b border-gray-300">
                    <input
                      type="checkbox"
                      checked={taken}
                      disabled={!due}
                      onChange={() => onToggleTaken(med.id)}
                      className="w-6 h-6 accent-blue-600"
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
      <div className="flex flex-col sm:flex-row justify-between items-start gap-2 p-3 border-t border-gray-300 text-gray-600 text-sm">
        <div>
          <strong>{remaining} item{remaining !== 1 ? 's' : ''}</strong> left for this time.
        </div>
        <div className="text-left sm:text-right text-xs">
          Highlighted items show all times they are used. Checklist resets on refresh.
        </div>
      </div>
    </>
  );
}
