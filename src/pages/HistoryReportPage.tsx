import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ClipboardList } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toDateInputValue, toLocalDateOnly } from '../utils/dateUtils';

type UnifiedRow = {
  id: string;
  at: string;
  doseDate: string;
  medicationId: string;
  medicationName: string;
  kind: 'slot' | 'flexible';
  detail: string;
};

function defaultRange(): { from: string; to: string } {
  const end = toLocalDateOnly(new Date());
  const start = new Date(end);
  start.setDate(start.getDate() - 7);
  return {
    from: toDateInputValue(start),
    to: toDateInputValue(end),
  };
}

export default function HistoryReportPage() {
  const initial = useMemo(() => defaultRange(), []);
  const [dateFrom, setDateFrom] = useState(initial.from);
  const [dateTo, setDateTo] = useState(initial.to);
  const [medicationId, setMedicationId] = useState<string>('');
  const [medications, setMedications] = useState<{ id: string; name: string }[]>([]);
  const [rows, setRows] = useState<UnifiedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error: e } = await supabase
        .from('medications')
        .select('id, name')
        .eq('active', true)
        .order('name');
      if (!e && data) setMedications(data);
    })();
  }, []);

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const from = dateFrom <= dateTo ? dateFrom : dateTo;
      const to = dateFrom <= dateTo ? dateTo : dateFrom;

      let logsQuery = supabase
        .from('medication_logs')
        .select(
          `
          id,
          logged_at,
          dose_date,
          action,
          medication_id,
          medications!inner(name),
          time_slots!inner(name)
        `
        )
        .gte('dose_date', from)
        .lte('dose_date', to);

      if (medicationId) {
        logsQuery = logsQuery.eq('medication_id', medicationId);
      }

      const { data: logs, error: logsError } = await logsQuery;
      if (logsError) throw logsError;

      let dosesQuery = supabase
        .from('medication_dose_events')
        .select(
          `
          id,
          taken_at,
          dose_date,
          medication_id,
          medications!inner(name)
        `
        )
        .gte('dose_date', from)
        .lte('dose_date', to);

      if (medicationId) {
        dosesQuery = dosesQuery.eq('medication_id', medicationId);
      }

      const { data: doses, error: dosesError } = await dosesQuery;
      if (dosesError) throw dosesError;

      const unified: UnifiedRow[] = [];

      (logs as any[])?.forEach((log) => {
        const med = log.medications as { name: string } | null;
        const slot = log.time_slots as { name: string } | null;
        const name = med?.name ?? 'Unknown';
        const slotName = slot?.name ?? '—';
        const actionLabel =
          log.action === 'checked' ? 'Marked taken' : 'Marked not taken';
        unified.push({
          id: `log-${log.id}`,
          at: log.logged_at,
          doseDate: log.dose_date,
          medicationId: log.medication_id,
          medicationName: name,
          kind: 'slot',
          detail: `${slotName} · ${actionLabel}`,
        });
      });

      (doses as any[])?.forEach((d) => {
        const med = d.medications as { name: string } | null;
        unified.push({
          id: `dose-${d.id}`,
          at: d.taken_at,
          doseDate: d.dose_date,
          medicationId: d.medication_id,
          medicationName: med?.name ?? 'Unknown',
          kind: 'flexible',
          detail: 'Dose logged',
        });
      });

      unified.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
      setRows(unified);
    } catch (e: unknown) {
      console.error(e);
      setError('Could not load history. Check your connection and try again.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, medicationId]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const setLast7Days = () => {
    const r = defaultRange();
    setDateFrom(r.from);
    setDateTo(r.to);
  };

  const formatWhen = (iso: string) =>
    new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

  const formatDoseDay = (d: string) =>
    new Date(d + 'T12:00:00').toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-2 sm:px-4 py-3 sm:py-6">
        <header className="mb-4 sm:mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-900 mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to tracker
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-8 h-8 text-gray-700" />
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">History report</h1>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2 max-w-2xl">
            All time-slot check/uncheck events and flexible dose logs in one place. Adjust the range or filter by
            medication.
          </p>
        </header>

        <div className="bg-white border border-gray-300 rounded-2xl shadow-lg p-3 sm:p-4 mb-4">
          <div className="flex flex-col lg:flex-row lg:flex-wrap gap-3 lg:items-end">
            <div className="flex flex-wrap gap-2 sm:gap-3 items-end">
              <div>
                <label htmlFor="hist-from" className="block text-xs font-semibold text-gray-600 mb-1">
                  From
                </label>
                <input
                  id="hist-from"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium"
                />
              </div>
              <div>
                <label htmlFor="hist-to" className="block text-xs font-semibold text-gray-600 mb-1">
                  To
                </label>
                <input
                  id="hist-to"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium"
                />
              </div>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label htmlFor="hist-med" className="block text-xs font-semibold text-gray-600 mb-1">
                Medication
              </label>
              <select
                id="hist-med"
                value={medicationId}
                onChange={(e) => setMedicationId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium bg-white"
              >
                <option value="">All medications</option>
                {medications.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={setLast7Days}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-800 hover:bg-gray-50 self-end"
            >
              Last 7 days
            </button>
          </div>
        </div>

        <section className="bg-white border border-gray-300 rounded-2xl shadow-lg overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-600">Loading…</div>
          ) : error ? (
            <div className="p-8 text-center text-red-700">{error}</div>
          ) : rows.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No history in this range
              {medicationId ? ' for this medication' : ''}.
            </div>
          ) : (
            <>
              <div className="px-3 py-2 border-b border-gray-200 bg-gray-50 text-xs text-gray-600">
                {rows.length} event{rows.length !== 1 ? 's' : ''}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-[640px]">
                  <thead>
                    <tr className="bg-gray-50 text-left text-xs sm:text-sm text-gray-600 border-b border-gray-200">
                      <th className="p-3 font-semibold whitespace-nowrap">When</th>
                      <th className="p-3 font-semibold whitespace-nowrap">Dose day</th>
                      <th className="p-3 font-semibold">Medication</th>
                      <th className="p-3 font-semibold whitespace-nowrap">Type</th>
                      <th className="p-3 font-semibold">Detail</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr
                        key={row.id}
                        className={`border-b border-gray-100 text-sm ${
                          row.kind === 'flexible' ? 'bg-sky-50/60' : ''
                        }`}
                      >
                        <td className="p-3 whitespace-nowrap text-gray-900">{formatWhen(row.at)}</td>
                        <td className="p-3 whitespace-nowrap text-gray-700">{formatDoseDay(row.doseDate)}</td>
                        <td className="p-3 font-medium text-gray-900">{row.medicationName}</td>
                        <td className="p-3 whitespace-nowrap text-gray-700">
                          {row.kind === 'flexible' ? 'Flexible dose' : 'Time slot'}
                        </td>
                        <td className="p-3 text-gray-700">{row.detail}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
