import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ClipboardList, Download } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toDateInputValue, toLocalDateOnly } from '../utils/dateUtils';

type HistoryEventVariant = 'slot_taken' | 'slot_not_taken' | 'flexible_dose' | 'seizure' | 'timeline_event';

type EventFilter = 'all' | HistoryEventVariant;

type UnifiedRow = {
  id: string;
  at: string;
  doseDate: string;
  medicationId: string;
  medicationName: string;
  kind: 'slot' | 'flexible' | 'symptom' | 'timeline';
  detail: string;
  variant: HistoryEventVariant;
};

function measurementTypeLabel(t: string | null): string | null {
  if (!t) return null;
  switch (t) {
    case 'spo2':
      return 'SpO₂';
    case 'pulse':
      return 'Pulse';
    case 'bp':
      return 'Blood pressure';
    case 'temp':
      return 'Temperature';
    default:
      return t;
  }
}

function rowVariantBgClass(v: HistoryEventVariant): string {
  switch (v) {
    case 'slot_taken':
      return 'bg-emerald-50/90';
    case 'slot_not_taken':
      return 'bg-rose-50/90';
    case 'flexible_dose':
      return 'bg-sky-50/90';
    case 'seizure':
      return 'bg-purple-50/90';
    case 'timeline_event':
      return 'bg-amber-50/90';
  }
}

/** Desktop table rows — left border works reliably on table rows. */
function rowVariantTableClass(v: HistoryEventVariant): string {
  switch (v) {
    case 'slot_taken':
      return `${rowVariantBgClass(v)} border-l-4 border-l-emerald-500`;
    case 'slot_not_taken':
      return `${rowVariantBgClass(v)} border-l-4 border-l-rose-500`;
    case 'flexible_dose':
      return `${rowVariantBgClass(v)} border-l-4 border-l-sky-500`;
    case 'seizure':
      return `${rowVariantBgClass(v)} border-l-4 border-l-purple-500`;
    case 'timeline_event':
      return `${rowVariantBgClass(v)} border-l-4 border-l-amber-500`;
  }
}

/** Mobile: solid strip (avoids border-l bugs with divide-y / overflow). */
function variantAccentBarClass(v: HistoryEventVariant): string {
  switch (v) {
    case 'slot_taken':
      return 'bg-emerald-500';
    case 'slot_not_taken':
      return 'bg-rose-500';
    case 'flexible_dose':
      return 'bg-sky-500';
    case 'seizure':
      return 'bg-purple-500';
    case 'timeline_event':
      return 'bg-amber-500';
  }
}

function variantBadge(v: HistoryEventVariant): { label: string; className: string } {
  switch (v) {
    case 'slot_taken':
      return { label: 'Taken', className: 'bg-emerald-100 text-emerald-900 ring-1 ring-emerald-200/80' };
    case 'slot_not_taken':
      return { label: 'Not taken', className: 'bg-rose-100 text-rose-900 ring-1 ring-rose-200/80' };
    case 'flexible_dose':
      return { label: 'Dose logged', className: 'bg-sky-100 text-sky-900 ring-1 ring-sky-200/80' };
    case 'seizure':
      return { label: 'Seizure', className: 'bg-purple-100 text-purple-900 ring-1 ring-purple-200/80' };
    case 'timeline_event':
      return { label: 'Note', className: 'bg-amber-100 text-amber-900 ring-1 ring-amber-200/80' };
  }
}

function csvQuote(value: string): string {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function downloadTextFile(filename: string, text: string, mime: string) {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function todayRange(): { from: string; to: string } {
  const day = toLocalDateOnly(new Date());
  const v = toDateInputValue(day);
  return { from: v, to: v };
}

function last7DaysRange(): { from: string; to: string } {
  const end = toLocalDateOnly(new Date());
  const start = new Date(end);
  start.setDate(start.getDate() - 7);
  return { from: toDateInputValue(start), to: toDateInputValue(end) };
}

export default function HistoryReportPage() {
  const initial = useMemo(() => todayRange(), []);
  const [dateFrom, setDateFrom] = useState(initial.from);
  const [dateTo, setDateTo] = useState(initial.to);
  const [medicationIds, setMedicationIds] = useState<string[]>([]);
  const [medications, setMedications] = useState<{ id: string; name: string }[]>([]);
  const [rows, setRows] = useState<UnifiedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [medPickerOpen, setMedPickerOpen] = useState(false);
  const medPickerRef = useRef<HTMLDivElement | null>(null);
  const [eventFilter, setEventFilter] = useState<EventFilter>('all');

  const toggleLegendFilter = (v: HistoryEventVariant) => {
    setEventFilter((prev) => (prev === v ? 'all' : v));
  };

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

  useEffect(() => {
    if (!medPickerOpen) return;
    const onPointerDown = (ev: PointerEvent) => {
      const el = medPickerRef.current;
      if (!el) return;
      if (ev.target instanceof Node && !el.contains(ev.target)) {
        setMedPickerOpen(false);
      }
    };
    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') setMedPickerOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [medPickerOpen]);

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
          reason,
          medication_id,
          medications!inner(name),
          time_slots!inner(name)
        `
        )
        .gte('dose_date', from)
        .lte('dose_date', to);

      if (medicationIds.length > 0) {
        logsQuery = logsQuery.in('medication_id', medicationIds);
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

      if (medicationIds.length > 0) {
        dosesQuery = dosesQuery.in('medication_id', medicationIds);
      }

      const { data: doses, error: dosesError } = await dosesQuery;
      if (dosesError) throw dosesError;

      const { data: symptoms, error: symptomsError } = await supabase
        .from('symptom_events')
        .select('id, occurred_at, event_date, duration_seconds, notes, event_type')
        .gte('event_date', from)
        .lte('event_date', to)
        .order('occurred_at', { ascending: false });
      if (symptomsError) throw symptomsError;

      const { data: events, error: eventsError } = await supabase
        .from('timeline_events')
        .select('id, occurred_at, event_date, event_type, measurement_type, title, value_text, notes')
        .gte('event_date', from)
        .lte('event_date', to)
        .order('occurred_at', { ascending: false });
      if (eventsError) throw eventsError;

        const unified: UnifiedRow[] = [];

      (logs as any[])?.forEach((log) => {
        const med = log.medications as { name: string } | null;
        const slot = log.time_slots as { name: string } | null;
        const name = med?.name ?? 'Unknown';
        const slotName = slot?.name ?? '—';
        const actionLabel =
          log.action === 'checked' ? 'Marked taken' : 'Marked not taken';
        const reasonSuffix =
          log.action === 'unchecked' && log.reason ? ` · ${log.reason}` : '';
        unified.push({
          id: `log-${log.id}`,
          at: log.logged_at,
          doseDate: log.dose_date,
          medicationId: log.medication_id,
          medicationName: name,
          kind: 'slot',
          detail: `${slotName} · ${actionLabel}${reasonSuffix}`,
          variant: log.action === 'checked' ? 'slot_taken' : 'slot_not_taken',
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
          variant: 'flexible_dose',
        });
      });

      (symptoms as any[])?.forEach((s) => {
        if (s.event_type !== 'seizure') return;
        const dur = Number(s.duration_seconds) || 0;
        const mins = Math.floor(dur / 60);
        const secs = dur % 60;
        const durationLabel = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
        const notes = (s.notes as string | null) ?? null;
        unified.push({
          id: `sym-${s.id}`,
          at: s.occurred_at,
          doseDate: s.event_date,
          medicationId: '',
          medicationName: 'Seizure',
          kind: 'symptom',
          detail: `Duration: ${durationLabel}${notes ? ` · ${notes}` : ''}`,
          variant: 'seizure',
        });
      });

      (events as any[])?.forEach((ev) => {
        const typeLabel = (ev.event_type as string | null) ?? 'event';
        const measurementType = (ev.measurement_type as string | null) ?? null;
        const value = (ev.value_text as string | null) ?? null;
        const notes = (ev.notes as string | null) ?? null;
        const metricLabel = measurementTypeLabel(measurementType);
        const parts = [
          typeLabel,
          metricLabel ? `Metric: ${metricLabel}` : null,
          value ? `Value: ${value}` : null,
          notes ? `Notes: ${notes}` : null,
        ].filter(Boolean);
        unified.push({
          id: `evt-${ev.id}`,
          at: ev.occurred_at,
          doseDate: ev.event_date,
          medicationId: '',
          medicationName: ev.title ?? 'Note',
          kind: 'timeline',
          detail: parts.join(' · '),
          variant: 'timeline_event',
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
  }, [dateFrom, dateTo, medicationIds]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const setToday = () => {
    const day = toLocalDateOnly(new Date());
    const v = toDateInputValue(day);
    setDateFrom(v);
    setDateTo(v);
  };

  const setYesterday = () => {
    const day = toLocalDateOnly(new Date());
    day.setDate(day.getDate() - 1);
    const v = toDateInputValue(day);
    setDateFrom(v);
    setDateTo(v);
  };

  const setLast7Days = () => {
    const r = last7DaysRange();
    setDateFrom(r.from);
    setDateTo(r.to);
  };

  const medicationSummary = useMemo(() => {
    if (medicationIds.length === 0) return 'All medications';
    const byId = new Map(medications.map((m) => [m.id, m.name] as const));
    const names = medicationIds.map((id) => byId.get(id) ?? 'Unknown');
    if (names.length <= 2) return names.join(', ');
    return `${names.slice(0, 2).join(', ')} +${names.length - 2} more`;
  }, [medicationIds, medications]);

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

  const filteredRows = useMemo(() => {
    if (eventFilter === 'all') return rows;
    return rows.filter((r) => r.variant === eventFilter);
  }, [rows, eventFilter]);

  const exportFilteredCsv = () => {
    if (filteredRows.length === 0) return;

    const from = dateFrom <= dateTo ? dateFrom : dateTo;
    const to = dateFrom <= dateTo ? dateTo : dateFrom;
    const filename = `medication-history_${from}_to_${to}.csv`;

    const header = [
      'Logged at (ISO)',
      'Logged at',
      'Dose date',
      'Dose day',
      'Medication',
      'Status',
      'Type',
      'Detail',
    ].map(csvQuote);

    const dataLines = filteredRows.map((row) => {
      const status = variantBadge(row.variant).label;
      const type =
        row.kind === 'flexible'
          ? 'Flexible dose'
          : row.kind === 'symptom'
            ? 'Symptom'
            : row.kind === 'timeline'
              ? 'Note'
              : 'Time slot';
      return [
        csvQuote(row.at),
        csvQuote(formatWhen(row.at)),
        csvQuote(row.doseDate),
        csvQuote(formatDoseDay(row.doseDate)),
        csvQuote(row.medicationName),
        csvQuote(status),
        csvQuote(type),
        csvQuote(row.detail),
      ].join(',');
    });

    const csv = `\ufeff${[header.join(','), ...dataLines].join('\r\n')}`;
    downloadTextFile(filename, csv, 'text/csv;charset=utf-8;');
  };

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
            Time-slot taken / not-taken events, flexible dose logs, and timestamped events in one place. Filter by date,
            medication, and event type.
          </p>
        </header>

        <div className="bg-white border border-gray-300 rounded-2xl shadow-lg p-4 sm:p-5 mb-4">
          <div className="space-y-5">
            {/* Date range + quick presets */}
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-2">Date range</p>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
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
                      className="w-full min-w-[10.5rem] px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium"
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
                      className="w-full min-w-[10.5rem] px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 sm:ml-1">
                  <button
                    type="button"
                    onClick={setToday}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-800 hover:bg-gray-50 whitespace-nowrap"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={setYesterday}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-800 hover:bg-gray-50 whitespace-nowrap"
                  >
                    Yesterday
                  </button>
                  <button
                    type="button"
                    onClick={setLast7Days}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-800 hover:bg-gray-50 whitespace-nowrap"
                  >
                    Last 7 days
                  </button>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-5">
              <p className="text-xs font-semibold text-gray-600 mb-3">Filters</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 md:items-end">
                <div className="min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <label htmlFor="hist-med" className="text-xs font-semibold text-gray-600">
                      Medication
                    </label>
                    <button
                      type="button"
                      onClick={() => setMedicationIds([])}
                      className="text-xs font-semibold text-blue-700 hover:text-blue-900 disabled:text-gray-400 disabled:pointer-events-none"
                      disabled={medicationIds.length === 0}
                    >
                      Clear
                    </button>
                  </div>
                  <div className="relative" ref={medPickerRef}>
                    <button
                      id="hist-med"
                      type="button"
                      onClick={() => setMedPickerOpen((v) => !v)}
                      aria-haspopup="listbox"
                      aria-expanded={medPickerOpen}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium bg-white text-left hover:bg-gray-50 min-h-[42px]"
                    >
                      <span className="block truncate text-gray-900">{medicationSummary}</span>
                    </button>
                    {medPickerOpen && (
                      <div className="absolute z-20 mt-2 w-full rounded-xl border border-gray-300 bg-white shadow-lg">
                        <div className="p-2 border-b border-gray-200 flex items-center justify-between gap-2">
                          <div className="text-xs font-semibold text-gray-600">
                            Select medication(s)
                          </div>
                          <button
                            type="button"
                            onClick={() => setMedicationIds([])}
                            className="px-2 py-1 text-xs rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                          >
                            Clear
                          </button>
                        </div>
                        <div className="max-h-64 overflow-auto p-2">
                          {medications.length === 0 ? (
                            <div className="p-2 text-sm text-gray-500">No medications found.</div>
                          ) : (
                            <ul role="listbox" aria-label="Medications" className="space-y-1">
                              {medications.map((m) => {
                                const checked = medicationIds.includes(m.id);
                                return (
                                  <li key={m.id}>
                                    <label className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => {
                                          setMedicationIds((prev) =>
                                            prev.includes(m.id)
                                              ? prev.filter((x) => x !== m.id)
                                              : [...prev, m.id]
                                          );
                                        }}
                                        className="w-4 h-4 accent-blue-600"
                                      />
                                      <span className="text-sm text-gray-900">{m.name}</span>
                                    </label>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </div>
                        <div className="p-2 border-t border-gray-200 flex items-center justify-end">
                          <button
                            type="button"
                            onClick={() => setMedPickerOpen(false)}
                            className="px-3 py-1.5 text-xs rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1.5">
                    {medicationIds.length === 0
                      ? 'Reporting on all medications.'
                      : `Selected ${medicationIds.length} medication${medicationIds.length !== 1 ? 's' : ''}.`}
                  </p>
                </div>

                <div className="min-w-0">
                  <label htmlFor="hist-event" className="block text-xs font-semibold text-gray-600 mb-1">
                    Event type
                  </label>
                  <select
                    id="hist-event"
                    value={eventFilter}
                    onChange={(e) => setEventFilter(e.target.value as EventFilter)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium bg-white min-h-[42px]"
                  >
                    <option value="all">All events</option>
                    <option value="slot_taken">Taken (time slot)</option>
                    <option value="slot_not_taken">Not taken (time slot)</option>
                    <option value="flexible_dose">Flexible dose</option>
                    <option value="seizure">Seizure</option>
                    <option value="timeline_event">Notes (visits/measurements)</option>
                  </select>
                </div>
              </div>
            </div>
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
              {medicationIds.length > 0 ? ' for the selected medication(s)' : ''}.
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="p-8 text-center text-gray-500 space-y-2">
              <p>No events match the selected event type filter.</p>
              <button
                type="button"
                onClick={() => setEventFilter('all')}
                className="text-sm font-semibold text-blue-700 hover:text-blue-900"
              >
                Show all events
              </button>
            </div>
          ) : (
            <>
              <div className="px-3 py-2 border-b border-gray-200 bg-gray-50 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600 min-w-0">
                  <span>
                    {filteredRows.length} event{filteredRows.length !== 1 ? 's' : ''}
                    {eventFilter !== 'all' && rows.length !== filteredRows.length
                      ? ` (of ${rows.length})`
                      : ''}
                  </span>
                  <span className="text-gray-400 hidden sm:inline" aria-hidden>
                    |
                  </span>
                  <div className="flex flex-wrap items-center gap-1 text-gray-500">
                    <button
                      type="button"
                      onClick={() => toggleLegendFilter('slot_taken')}
                      aria-pressed={eventFilter === 'slot_taken'}
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md hover:bg-gray-200/70 ${
                        eventFilter === 'slot_taken' ? 'bg-gray-200/80 text-gray-900' : ''
                      }`}
                      title="Filter: Taken"
                    >
                      <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" aria-hidden />
                      Taken
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleLegendFilter('slot_not_taken')}
                      aria-pressed={eventFilter === 'slot_not_taken'}
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md hover:bg-gray-200/70 ${
                        eventFilter === 'slot_not_taken' ? 'bg-gray-200/80 text-gray-900' : ''
                      }`}
                      title="Filter: Not taken"
                    >
                      <span className="inline-block w-2 h-2 rounded-full bg-rose-500" aria-hidden />
                      Not taken
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleLegendFilter('flexible_dose')}
                      aria-pressed={eventFilter === 'flexible_dose'}
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md hover:bg-gray-200/70 ${
                        eventFilter === 'flexible_dose' ? 'bg-gray-200/80 text-gray-900' : ''
                      }`}
                      title="Filter: Flexible dose"
                    >
                      <span className="inline-block w-2 h-2 rounded-full bg-sky-500" aria-hidden />
                      Flexible
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleLegendFilter('seizure')}
                      aria-pressed={eventFilter === 'seizure'}
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md hover:bg-gray-200/70 ${
                        eventFilter === 'seizure' ? 'bg-gray-200/80 text-gray-900' : ''
                      }`}
                      title="Filter: Seizure"
                    >
                      <span className="inline-block w-2 h-2 rounded-full bg-purple-500" aria-hidden />
                      Seizure
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleLegendFilter('timeline_event')}
                      aria-pressed={eventFilter === 'timeline_event'}
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md hover:bg-gray-200/70 ${
                        eventFilter === 'timeline_event' ? 'bg-gray-200/80 text-gray-900' : ''
                      }`}
                      title="Filter: Notes"
                    >
                      <span className="inline-block w-2 h-2 rounded-full bg-amber-500" aria-hidden />
                      Notes
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={exportFilteredCsv}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg border border-gray-300 bg-white text-gray-800 hover:bg-gray-50 shrink-0"
                  title="Download visible rows as CSV (for your records or to share with a clinician)"
                >
                  <Download className="w-4 h-4 shrink-0" aria-hidden />
                  Export CSV
                </button>
              </div>

              {/* Mobile: stacked cards — no horizontal scroll */}
              <ul className="md:hidden divide-y divide-gray-100">
                {filteredRows.map((row) => {
                  const badge = variantBadge(row.variant);
                  return (
                    <li
                      key={row.id}
                      className={`flex min-h-0 text-sm ${rowVariantBgClass(row.variant)}`}
                    >
                      <div
                        className={`w-1 shrink-0 self-stretch ${variantAccentBarClass(row.variant)}`}
                        aria-hidden
                      />
                      <div className="flex-1 min-w-0 pr-4 py-3 pl-3">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span
                            className={`text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                        </div>
                        <p className="font-semibold text-gray-900 break-words">{row.medicationName}</p>
                        <p className="text-gray-600 mt-1">{formatWhen(row.at)}</p>
                        <p className="text-gray-700 mt-2">
                          <span className="text-gray-500">
                            {row.kind === 'flexible' ? 'Flexible dose' : 'Time slot'}
                          </span>
                          <span className="mx-1.5 text-gray-300" aria-hidden>
                            ·
                          </span>
                          <span>{row.detail}</span>
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>

              {/* md+: table; dose day only on xl+ (redundant with When on smaller widths) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full border-collapse min-w-0 table-fixed">
                  <thead>
                    <tr className="bg-gray-50 text-left text-xs sm:text-sm text-gray-600 border-b border-gray-200">
                      <th className="p-3 font-semibold">When</th>
                      <th className="hidden xl:table-cell p-3 font-semibold whitespace-nowrap">Dose day</th>
                      <th className="p-3 font-semibold">Medication</th>
                      <th className="p-3 font-semibold">Status</th>
                      <th className="p-3 font-semibold">Type</th>
                      <th className="p-3 font-semibold">Detail</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((row) => {
                      const badge = variantBadge(row.variant);
                      return (
                        <tr
                          key={row.id}
                          className={`border-b border-gray-100 text-sm ${rowVariantTableClass(row.variant)}`}
                        >
                          <td className="p-3 pl-4 align-top text-gray-900">{formatWhen(row.at)}</td>
                          <td className="hidden xl:table-cell p-3 align-top text-gray-700 whitespace-nowrap">
                            {formatDoseDay(row.doseDate)}
                          </td>
                          <td className="p-3 align-top font-medium text-gray-900 break-words">
                            {row.medicationName}
                          </td>
                          <td className="p-3 align-top">
                            <span
                              className={`inline-block text-xs font-semibold px-2 py-1 rounded-full ${badge.className}`}
                            >
                              {badge.label}
                            </span>
                          </td>
                          <td className="p-3 align-top text-gray-700">
                            {row.kind === 'flexible' ? 'Flexible dose' : 'Time slot'}
                          </td>
                          <td className="p-3 align-top text-gray-700 break-words">{row.detail}</td>
                        </tr>
                      );
                    })}
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
