import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronRight, ClipboardList, Download, LogIn, Pencil } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { usePageBackgroundProps } from '../contexts/PreferencesContext';
import { toDateInputValue, toLocalDateKey, toLocalDateOnly } from '../utils/dateUtils';
import { inferUnrecordedDoseRows } from '../utils/inferUnrecordedDoses';
import EditTimelineEventModal, { EditTimelineEventInitial } from '../components/EditTimelineEventModal';
import AuthModal from '../components/AuthModal';

type HistoryEventVariant =
  | 'slot_taken'
  | 'slot_not_taken'
  | 'slot_unrecorded'
  | 'flexible_dose'
  | 'seizure'
  | 'timeline_event';

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
  timeline?: {
    id: string;
    occurredAt: string;
    title: string;
    notes: string | null;
    valueText: string | null;
    eventType: string | null;
    measurementType: string | null;
  };
};

type MedicationLogRow = {
  id: string;
  logged_at: string;
  dose_date: string;
  action: 'checked' | 'unchecked';
  reason: string | null;
  medication_id: string;
  medications: { name: string } | null;
  time_slots: { name: string } | null;
};

type DoseEventRow = {
  id: string;
  taken_at: string;
  dose_date: string;
  medication_id: string;
  medications: { name: string } | null;
};

type SymptomEventRow = {
  id: string;
  occurred_at: string;
  event_date: string;
  duration_seconds: number | null;
  notes: string | null;
  event_type: string;
};

type TimelineEventRow = {
  id: string;
  occurred_at: string;
  event_date: string;
  event_type: string | null;
  measurement_type: string | null;
  title: string | null;
  value_text: string | null;
  notes: string | null;
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
    case 'pain_score':
      return 'Pain score';
    case 'alertness':
      return 'Alertness';
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
    case 'slot_unrecorded':
      return 'bg-slate-100/90';
    case 'flexible_dose':
      return 'bg-brand-50/90';
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
    case 'slot_unrecorded':
      return `${rowVariantBgClass(v)} border-l-4 border-l-slate-400`;
    case 'flexible_dose':
      return `${rowVariantBgClass(v)} border-l-4 border-l-brand-500`;
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
    case 'slot_unrecorded':
      return 'bg-slate-400';
    case 'flexible_dose':
      return 'bg-brand-500';
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
    case 'slot_unrecorded':
      return { label: 'Not recorded', className: 'bg-slate-200 text-slate-800 ring-1 ring-slate-300/80' };
    case 'flexible_dose':
      return { label: 'Dose logged', className: 'bg-brand-100 text-brand-900 ring-1 ring-brand-200/80' };
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

function isValidDateKey(v: string | null): v is string {
  return !!v && /^\d{4}-\d{2}-\d{2}$/.test(v);
}

export default function HistoryReportPage() {
  const { user, loading: authLoading } = useAuth();
  const pageBg = usePageBackgroundProps();
  const [searchParams] = useSearchParams();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const trackerDate = searchParams.get('date');
  const initial = useMemo(() => {
    if (isValidDateKey(trackerDate)) return { from: trackerDate, to: trackerDate };
    return todayRange();
  }, [trackerDate]);
  const [dateFrom, setDateFrom] = useState(initial.from);
  const [dateTo, setDateTo] = useState(initial.to);
  const [medicationIds, setMedicationIds] = useState<string[]>([]);

  // When opened from the tracker History button, adopt that day's date picker value.
  useEffect(() => {
    if (!isValidDateKey(trackerDate)) return;
    setDateFrom(trackerDate);
    setDateTo(trackerDate);
  }, [trackerDate]);
  const [medications, setMedications] = useState<{ id: string; name: string }[]>([]);
  const [rows, setRows] = useState<UnifiedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [medPickerOpen, setMedPickerOpen] = useState(false);
  const medTriggerRef = useRef<HTMLButtonElement | null>(null);
  const medPopoverRef = useRef<HTMLDivElement | null>(null);
  const [medPopoverPos, setMedPopoverPos] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const updateMedPopoverPos = useCallback(() => {
    const el = medTriggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const gap = 8;
    const margin = 8;
    const maxPopoverH = Math.min(22 * 16, window.innerHeight - margin * 2);
    let top = r.bottom + gap;
    const overflowBottom = top + maxPopoverH - (window.innerHeight - margin);
    if (overflowBottom > 0) {
      top = Math.max(margin, top - overflowBottom);
    }
    setMedPopoverPos({ top, left: r.left, width: r.width });
  }, []);
  const [eventFilter, setEventFilter] = useState<EventFilter>('all');
  const [editingNote, setEditingNote] = useState<EditTimelineEventInitial | null>(null);

  const toggleLegendFilter = (v: HistoryEventVariant) => {
    setEventFilter((prev) => (prev === v ? 'all' : v));
  };

  useEffect(() => {
    if (!user) {
      setMedications([]);
      return;
    }
    (async () => {
      const { data, error: e } = await supabase
        .from('medications')
        .select('id, name')
        .eq('active', true)
        .order('name');
      if (!e && data) setMedications(data);
    })();
  }, [user]);

  useLayoutEffect(() => {
    if (!medPickerOpen) {
      setMedPopoverPos(null);
      return;
    }
    updateMedPopoverPos();
    window.addEventListener('resize', updateMedPopoverPos);
    window.addEventListener('scroll', updateMedPopoverPos, true);
    return () => {
      window.removeEventListener('resize', updateMedPopoverPos);
      window.removeEventListener('scroll', updateMedPopoverPos, true);
    };
  }, [medPickerOpen, updateMedPopoverPos]);

  useEffect(() => {
    if (!medPickerOpen) return;
    const onPointerDown = (ev: PointerEvent) => {
      const node = ev.target;
      if (!(node instanceof Node)) return;
      if (medTriggerRef.current?.contains(node) || medPopoverRef.current?.contains(node)) return;
      setMedPickerOpen(false);
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
    if (!user) {
      setRows([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const from = dateFrom <= dateTo ? dateFrom : dateTo;
      const to = dateFrom <= dateTo ? dateTo : dateFrom;
      const todayLocal = toLocalDateKey(new Date());
      const toEffective = to > todayLocal ? todayLocal : to;

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

      const logRows = (logs ?? []) as unknown as MedicationLogRow[];
      logRows.forEach((log) => {
        const med = log.medications;
        const slot = log.time_slots;
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

      const doseRows = (doses ?? []) as unknown as DoseEventRow[];
      doseRows.forEach((d) => {
        const med = d.medications;
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

      const symptomRows = (symptoms ?? []) as SymptomEventRow[];
      symptomRows.forEach((s) => {
        if (s.event_type !== 'seizure') return;
        const dur = Number(s.duration_seconds) || 0;
        const mins = Math.floor(dur / 60);
        const secs = dur % 60;
        const durationLabel = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
        const notes = s.notes ?? null;
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

      const timelineRows = (events ?? []) as TimelineEventRow[];
      timelineRows.forEach((ev) => {
        const typeLabel = ev.event_type ?? 'event';
        const measurementType = ev.measurement_type ?? null;
        const value = ev.value_text ?? null;
        const notes = ev.notes ?? null;
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
          timeline: {
            id: String(ev.id),
            occurredAt: String(ev.occurred_at),
            title: String(ev.title ?? 'Note'),
            notes,
            valueText: value,
            eventType: ev.event_type ?? null,
            measurementType,
          },
        });
      });

      // Infer due doses that were never marked taken / not taken (and flexible with zero logs).
      if (from <= toEffective) {
        const { data: allMeds, error: medsErr } = await supabase
          .from('medications')
          .select(
            'id, name, schedule_type, days_of_week, start_date, interval_days, pause_start_date, pause_end_date, end_date, dosing_mode, active'
          )
          .eq('active', true);
        if (medsErr) throw medsErr;

        const medList = allMeds ?? [];
        const medIds = medList.map((m) => m.id as string);

        type SlotJoin = {
          medication_id: string;
          time_slot_id: string;
          time_slots:
            | { id: string; name: string }
            | { id: string; name: string }[]
            | null;
        };

        let slotLinks: SlotJoin[] = [];
        if (medIds.length > 0) {
          const { data: links, error: linksErr } = await supabase
            .from('medication_slots')
            .select('medication_id, time_slot_id, time_slots (id, name)')
            .in('medication_id', medIds);
          if (linksErr) throw linksErr;
          slotLinks = (links ?? []) as unknown as SlotJoin[];
        }

        const slotsByMed = new Map<string, { id: string; name: string }[]>();
        slotLinks.forEach((row) => {
          const ts = Array.isArray(row.time_slots) ? row.time_slots[0] : row.time_slots;
          if (!ts?.id) return;
          const list = slotsByMed.get(row.medication_id) ?? [];
          list.push({
            id: ts.id,
            name: ts.name,
          });
          slotsByMed.set(row.medication_id, list);
        });

        let takenQuery = supabase
          .from('doses_taken')
          .select('medication_id, time_slot_id, dose_date')
          .gte('dose_date', from)
          .lte('dose_date', toEffective);
        if (medicationIds.length > 0) {
          takenQuery = takenQuery.in('medication_id', medicationIds);
        }
        const { data: takenRows, error: takenErr } = await takenQuery;
        if (takenErr) throw takenErr;

        const recordedSlotKeys = new Set(
          (takenRows ?? []).map(
            (r) => `${r.medication_id}|${r.time_slot_id}|${r.dose_date}`
          )
        );

        const flexibleDoseCounts = new Map<string, number>();
        doseRows.forEach((d) => {
          const key = `${d.medication_id}|${d.dose_date}`;
          flexibleDoseCounts.set(key, (flexibleDoseCounts.get(key) ?? 0) + 1);
        });

        const medsForInference = medList.map((m) => ({
          id: m.id as string,
          name: m.name as string,
          when_text: '',
          schedule_type: m.schedule_type as
            | 'daily'
            | 'days_of_week'
            | 'every_n_days_from_start',
          days_of_week: (m.days_of_week as number[] | null) ?? null,
          start_date: (m.start_date as string | null) ?? null,
          interval_days: (m.interval_days as number | null) ?? null,
          pause_start_date: (m.pause_start_date as string | null) ?? null,
          pause_end_date: (m.pause_end_date as string | null) ?? null,
          end_date: (m.end_date as string | null) ?? null,
          active: true,
          dosing_mode:
            ((m.dosing_mode as string) ?? 'time_slots') === 'flexible_daily'
              ? ('flexible_daily' as const)
              : ('time_slots' as const),
          slots: slotsByMed.get(m.id as string) ?? [],
        }));

        const unrecorded = inferUnrecordedDoseRows({
          from,
          toEffective,
          todayLocal,
          medications: medsForInference,
          recordedSlotKeys,
          flexibleDoseCounts,
          medicationFilterIds: medicationIds,
        });

        unrecorded.forEach((u) => {
          unified.push({
            id: u.id,
            at: u.at,
            doseDate: u.doseDate,
            medicationId: u.medicationId,
            medicationName: u.medicationName,
            kind: u.kind,
            detail: u.detail,
            variant: 'slot_unrecorded',
          });
        });
      }

      // Logged events first (newest → oldest); Not recorded always at the bottom.
      unified.sort((a, b) => {
        const aUnrec = a.variant === 'slot_unrecorded' ? 1 : 0;
        const bUnrec = b.variant === 'slot_unrecorded' ? 1 : 0;
        if (aUnrec !== bUnrec) return aUnrec - bUnrec;
        return new Date(b.at).getTime() - new Date(a.at).getTime();
      });
      setRows(unified);
    } catch (e: unknown) {
      console.error(e);
      setError('Could not load history. Check your connection and try again.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [user, dateFrom, dateTo, medicationIds]);

  const saveEditedNote = useCallback(
    async (payload: {
      occurredAtIso: string;
      eventDate: string;
      notes: string | null;
      valueText: string | null;
    }) => {
      if (!editingNote) return;
      try {
        const { error: updateError } = await supabase
          .from('timeline_events')
          .update({
            occurred_at: payload.occurredAtIso,
            event_date: payload.eventDate,
            notes: payload.notes,
            value_text: payload.valueText,
          })
          .eq('id', editingNote.id);
        if (updateError) throw updateError;
        await loadReport();
      } catch (e) {
        console.error(e);
        alert('Failed to update note. Please try again.');
        throw e;
      }
    },
    [editingNote, loadReport]
  );

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

  const eventFilterSummary = useMemo(() => {
    switch (eventFilter) {
      case 'all':
        return 'All events';
      case 'slot_taken':
        return 'Taken';
      case 'slot_not_taken':
        return 'Not taken';
      case 'slot_unrecorded':
        return 'Not recorded';
      case 'flexible_dose':
        return 'Flexible';
      case 'seizure':
        return 'Seizure';
      case 'timeline_event':
        return 'Notes';
      default:
        return 'All events';
    }
  }, [eventFilter]);

  const [filtersExpanded, setFiltersExpanded] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.matchMedia('(min-width: 768px)').matches;
  });

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
    <div className={pageBg.className} style={pageBg.style}>
      <div className="max-w-5xl mx-auto px-2 sm:px-4 py-3 sm:py-6">
        <EditTimelineEventModal
          isOpen={Boolean(editingNote)}
          initial={editingNote}
          onClose={() => setEditingNote(null)}
          onConfirm={saveEditedNote}
        />
        <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
        <header className="mb-4 sm:mb-6">
          <Link
            to="/"
            className="app-page-link inline-flex items-center gap-2 text-sm font-semibold mb-3 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to tracker
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div
                className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 via-brand-600 to-brand-800 text-white shadow-brand-sm"
                aria-hidden
              >
                <ClipboardList className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <h1 className="app-page-title text-2xl sm:text-3xl font-bold tracking-tight">History report</h1>
              </div>
            </div>
          </div>
          <p className="app-page-muted text-sm mt-2 max-w-2xl">
            Time-slot taken / not-taken events, flexible dose logs, and timestamped events in one place. Filter by date,
            medication, and event type.
          </p>
        </header>

        {authLoading ? (
          <div className="rounded-2xl surface-glass p-8 text-center text-sm text-slate-500">
            Loading…
          </div>
        ) : !user ? (
          <div className="rounded-2xl surface-glass p-8 text-center">
            <p className="text-sm text-slate-600">Sign in to view your history report.</p>
            <button
              type="button"
              onClick={() => setAuthModalOpen(true)}
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-brand-sm hover:bg-brand-700"
            >
              <LogIn className="h-4 w-4" />
              Sign in
            </button>
          </div>
        ) : (
          <>
        <div className="mb-4 overflow-hidden rounded-2xl surface-glass">
          <div className="px-4 pb-4 pt-4 sm:px-5 sm:pt-5">
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

          <button
            type="button"
            onClick={() => setFiltersExpanded((v) => !v)}
            className="flex w-full items-center justify-between gap-3 border-t border-gray-200 p-3 text-left hover:bg-gray-50 sm:p-4"
            aria-expanded={filtersExpanded}
            aria-controls="history-detail-filters"
            id="history-detail-filters-toggle"
          >
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-gray-900">Filters</div>
              {!filtersExpanded && (
                <p className="mt-1 line-clamp-2 text-xs text-gray-600">
                  <span className="font-medium text-gray-700">{medicationSummary}</span>
                  <span className="text-gray-400"> · </span>
                  {eventFilterSummary}
                </p>
              )}
            </div>
            <span className="shrink-0 text-gray-700" aria-hidden>
              {filtersExpanded ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronRight className="h-5 w-5" />
              )}
            </span>
          </button>

          {filtersExpanded && (
            <div
              id="history-detail-filters"
              className="border-t border-gray-200 px-4 pb-4 pt-4 sm:px-5 sm:pb-5"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 md:items-start">
                <div className="flex min-w-0 flex-col">
                  <div className="mb-1 flex min-h-[1.75rem] items-center justify-between gap-2">
                    <label htmlFor="hist-med" className="text-xs font-semibold text-gray-600">
                      Medication
                    </label>
                    <div className="flex shrink-0 justify-end">
                      <button
                        type="button"
                        onClick={() => setMedicationIds([])}
                        className="text-xs font-semibold text-brand-800 hover:text-brand-950 disabled:text-gray-400 disabled:pointer-events-none"
                        disabled={medicationIds.length === 0}
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <div>
                    <button
                      ref={medTriggerRef}
                      id="hist-med"
                      type="button"
                      onClick={() => setMedPickerOpen((v) => !v)}
                      aria-haspopup="listbox"
                      aria-expanded={medPickerOpen}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium bg-white text-left hover:bg-gray-50 min-h-[42px]"
                    >
                      <span className="block truncate text-gray-900">{medicationSummary}</span>
                    </button>
                    {medPickerOpen &&
                      medPopoverPos &&
                      createPortal(
                        <div
                          ref={medPopoverRef}
                          className="fixed z-[300] flex max-h-[min(22rem,calc(100dvh-1.5rem))] flex-col overflow-hidden rounded-xl border border-gray-300 bg-white shadow-xl outline-none"
                          style={{
                            top: medPopoverPos.top,
                            left: medPopoverPos.left,
                            width: medPopoverPos.width,
                          }}
                          role="dialog"
                          aria-label="Select medications"
                        >
                          <div className="shrink-0 border-b border-gray-200 p-2 flex items-center justify-between gap-2">
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
                          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
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
                                          className="w-4 h-4 accent-brand-600"
                                        />
                                        <span className="text-sm text-gray-900">{m.name}</span>
                                      </label>
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
                          </div>
                          <div className="shrink-0 border-t border-gray-200 p-2 flex items-center justify-end">
                            <button
                              type="button"
                              onClick={() => setMedPickerOpen(false)}
                              className="px-3 py-1.5 text-xs rounded-xl bg-brand-600 text-white hover:bg-brand-700 shadow-brand-sm"
                            >
                              Done
                            </button>
                          </div>
                        </div>,
                        document.body
                      )}
                  </div>
                  <p className="mt-1.5 min-h-[2.5rem] text-xs leading-snug text-gray-500">
                    {medicationIds.length === 0
                      ? 'Reporting on all medications.'
                      : `Selected ${medicationIds.length} medication${medicationIds.length !== 1 ? 's' : ''}.`}
                  </p>
                </div>

                <div className="flex min-w-0 flex-col">
                  <div className="mb-1 flex min-h-[1.75rem] items-center justify-between gap-2">
                    <label htmlFor="hist-event" className="text-xs font-semibold text-gray-600">
                      Event type
                    </label>
                    {/* Keeps label row height aligned with Medication + Clear */}
                    <div className="min-w-[2.75rem] shrink-0" aria-hidden />
                  </div>
                  <select
                    id="hist-event"
                    value={eventFilter}
                    onChange={(e) => setEventFilter(e.target.value as EventFilter)}
                    className="w-full min-h-[42px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium"
                  >
                    <option value="all">All events</option>
                    <option value="slot_taken">Taken (time slot)</option>
                    <option value="slot_not_taken">Not taken (time slot)</option>
                    <option value="slot_unrecorded">Not recorded</option>
                    <option value="flexible_dose">Flexible dose</option>
                    <option value="seizure">Seizure</option>
                    <option value="timeline_event">Notes (visits/measurements)</option>
                  </select>
                  <p className="mt-1.5 min-h-[2.5rem] text-xs leading-snug text-gray-500">
                    Slot doses, unrecorded doses, flexible doses, seizures, and notes.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <section className="overflow-hidden rounded-2xl surface-glass">
          {loading ? (
            <div className="p-8 text-center text-slate-500 text-sm animate-pulse">Loading…</div>
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
                className="text-sm font-semibold text-brand-800 hover:text-brand-950"
              >
                Show all events
              </button>
            </div>
          ) : (
            <>
              <div className="px-3 py-2 border-b border-slate-200 bg-slate-50/90 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 min-w-0">
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
                      onClick={() => toggleLegendFilter('slot_unrecorded')}
                      aria-pressed={eventFilter === 'slot_unrecorded'}
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md hover:bg-gray-200/70 ${
                        eventFilter === 'slot_unrecorded' ? 'bg-gray-200/80 text-gray-900' : ''
                      }`}
                      title="Filter: Not recorded"
                    >
                      <span className="inline-block w-2 h-2 rounded-full bg-slate-400" aria-hidden />
                      Not recorded
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
                      <span className="inline-block w-2 h-2 rounded-full bg-brand-500" aria-hidden />
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
              <ul className="lg:hidden divide-y divide-gray-100">
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
                          {row.variant === 'timeline_event' && row.timeline && (
                            <button
                              type="button"
                              onClick={() =>
                                setEditingNote({
                                  id: row.timeline!.id,
                                  occurredAtIso: row.timeline!.occurredAt,
                                  title: row.timeline!.title,
                                  notes: row.timeline!.notes,
                                  valueText: row.timeline!.valueText,
                                  eventType: row.timeline!.eventType,
                                  measurementType: row.timeline!.measurementType,
                                })
                              }
                              className="ml-auto inline-flex items-center justify-center p-1.5 rounded-lg border border-amber-200 bg-white/70 text-amber-900 hover:bg-white"
                              title="Edit note"
                              aria-label="Edit note"
                            >
                              <Pencil className="w-4 h-4" aria-hidden />
                            </button>
                          )}
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
              <div className="hidden lg:block overflow-x-auto">
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
                          <td className="p-3 align-top text-gray-700 break-words">
                            <div className="flex items-start gap-2">
                              <div className="min-w-0 flex-1 break-words">{row.detail}</div>
                              {row.variant === 'timeline_event' && row.timeline && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setEditingNote({
                                      id: row.timeline!.id,
                                      occurredAtIso: row.timeline!.occurredAt,
                                      title: row.timeline!.title,
                                      notes: row.timeline!.notes,
                                      valueText: row.timeline!.valueText,
                                      eventType: row.timeline!.eventType,
                                      measurementType: row.timeline!.measurementType,
                                    })
                                  }
                                  className="shrink-0 inline-flex items-center justify-center p-1.5 rounded-lg border border-amber-200 bg-white text-amber-900 hover:bg-amber-50"
                                  title="Edit note"
                                  aria-label="Edit note"
                                >
                                  <Pencil className="w-4 h-4" aria-hidden />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
          </>
        )}
      </div>
    </div>
  );
}
