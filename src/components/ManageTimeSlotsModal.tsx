import { useCallback, useEffect, useState } from 'react';
import { Plus, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import type { TimeSlot } from '../types';
import Modal from './ui/Modal';
import Button from './ui/Button';

interface ManageTimeSlotsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function ManageTimeSlotsModal({ isOpen, onClose, onSaved }: ManageTimeSlotsModalProps) {
  const { user } = useAuth();
  const { showError } = useToast();
  const [rows, setRows] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [hourEdits, setHourEdits] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    if (!user) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('time_slots')
        .select('id, name, sort_order, default_after_hour')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      setRows((data as TimeSlot[]) || []);
      setEdits({});
      setHourEdits({});
    } catch (e) {
      console.error(e);
      showError('Could not load sessions.');
    } finally {
      setLoading(false);
    }
  }, [user, showError]);

  useEffect(() => {
    if (isOpen) load();
  }, [isOpen, load]);

  const usageCounts = async (timeSlotId: string): Promise<{ meds: number; doses: number }> => {
    const [{ count: medCount }, { count: doseCount }] = await Promise.all([
      supabase.from('medication_slots').select('*', { count: 'exact', head: true }).eq('time_slot_id', timeSlotId),
      supabase.from('doses_taken').select('*', { count: 'exact', head: true }).eq('time_slot_id', timeSlotId),
    ]);
    return { meds: medCount ?? 0, doses: doseCount ?? 0 };
  };

  const handleRenameBlur = async (id: string, originalName: string) => {
    const raw = (edits[id] ?? originalName).trim();
    if (raw === originalName) return;
    if (!raw) {
      setEdits((e) => ({ ...e, [id]: originalName }));
      showError('Name cannot be empty.');
      return;
    }
    setSavingId(id);
    try {
      const { error } = await supabase.from('time_slots').update({ name: raw }).eq('id', id);
      if (error) throw error;
      await load();
      onSaved();
    } catch (e: unknown) {
      console.error(e);
      setEdits((ed) => ({ ...ed, [id]: originalName }));
      showError(
        e && typeof e === 'object' && 'message' in e
          ? String((e as { message: string }).message)
          : 'Could not rename (duplicate name?).'
      );
    } finally {
      setSavingId(null);
    }
  };

  const move = async (index: number, dir: -1 | 1) => {
    const next = index + dir;
    if (next < 0 || next >= rows.length) return;
    const a = rows[index];
    const b = rows[next];
    setSavingId('reorder');
    try {
      await supabase.from('time_slots').update({ sort_order: b.sort_order }).eq('id', a.id);
      await supabase.from('time_slots').update({ sort_order: a.sort_order }).eq('id', b.id);
      await load();
      onSaved();
    } catch (e) {
      console.error(e);
      showError('Could not reorder.');
    } finally {
      setSavingId(null);
    }
  };

  const handleAdd = async () => {
    if (!user) {
      showError('Sign in to add sessions.');
      return;
    }
    const name = newName.trim();
    if (!name) {
      showError('Enter a name for the new session.');
      return;
    }
    const maxOrder = rows.reduce((m, r) => Math.max(m, r.sort_order), 0);
    setSavingId('add');
    try {
      const { error } = await supabase.from('time_slots').insert({
        name,
        sort_order: maxOrder + 1,
        default_after_hour: 12,
        user_id: user.id,
      });
      if (error) throw error;
      setNewName('');
      await load();
      onSaved();
    } catch (e: unknown) {
      console.error(e);
      showError(
        e && typeof e === 'object' && 'message' in e
          ? String((e as { message: string }).message)
          : 'Could not add session (duplicate name?).'
      );
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (slot: TimeSlot) => {
    const { meds, doses } = await usageCounts(slot.id);
    if (meds > 0 || doses > 0) {
      showError(
        `This session is in use (${meds} medication link(s), ${doses} dose record(s)). Remove it from medications first, or rename it instead.`
      );
      return;
    }
    if (!window.confirm(`Delete session “${slot.name}”?`)) return;
    setSavingId(slot.id);
    try {
      const { error } = await supabase.from('time_slots').delete().eq('id', slot.id);
      if (error) throw error;
      await load();
      onSaved();
    } catch (e) {
      console.error(e);
      showError('Could not delete.');
    } finally {
      setSavingId(null);
    }
  };

  const handleHourBlur = async (slot: TimeSlot) => {
    const raw = (hourEdits[slot.id] ?? String(slot.default_after_hour ?? 12)).trim();
    let n = parseInt(raw, 10);
    if (Number.isNaN(n)) {
      setHourEdits((h) => {
        const next = { ...h };
        delete next[slot.id];
        return next;
      });
      return;
    }
    n = Math.max(0, Math.min(23, n));
    if (n === (slot.default_after_hour ?? 12)) {
      setHourEdits((h) => {
        const next = { ...h };
        delete next[slot.id];
        return next;
      });
      return;
    }
    setSavingId(slot.id);
    try {
      const { error } = await supabase.from('time_slots').update({ default_after_hour: n }).eq('id', slot.id);
      if (error) throw error;
      await load();
      onSaved();
    } catch (e) {
      console.error(e);
      showError('Could not update default hour.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title="Sessions"
      description={
        <>
          Names appear in the day tabs and when scheduling medications. Order is left-to-right in the picker.{' '}
          <strong className="font-medium text-slate-800">Default at (hour)</strong> sets which tab opens first when
          the app loads (local time).
        </>
      }
      footer={
        <Button type="button" variant="secondary" onClick={onClose} className="w-full">
          Done
        </Button>
      }
    >
      <div className="px-4 sm:px-5 py-4">
        {loading ? (
          <p className="text-center text-sm text-slate-500">Loading…</p>
        ) : (
          <ul className="space-y-2">
            {rows.map((slot, index) => (
              <li
                key={slot.id}
                className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-2 py-2 sm:flex-nowrap"
              >
                <div className="flex flex-col gap-0.5">
                  <button
                    type="button"
                    className="rounded p-0.5 text-slate-600 hover:bg-white disabled:opacity-40"
                    disabled={index === 0 || savingId !== null}
                    onClick={() => void move(index, -1)}
                    aria-label="Move up"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="rounded p-0.5 text-slate-600 hover:bg-white disabled:opacity-40"
                    disabled={index === rows.length - 1 || savingId !== null}
                    onClick={() => void move(index, 1)}
                    aria-label="Move down"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
                <input
                  type="text"
                  value={edits[slot.id] ?? slot.name}
                  onChange={(e) => setEdits((prev) => ({ ...prev, [slot.id]: e.target.value }))}
                  onBlur={() => void handleRenameBlur(slot.id, slot.name)}
                  className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  disabled={savingId === slot.id}
                />
                <div className="flex shrink-0 items-center gap-1.5">
                  <label className="whitespace-nowrap text-xs text-slate-600" htmlFor={`hour-${slot.id}`}>
                    Default at
                  </label>
                  <input
                    id={`hour-${slot.id}`}
                    type="number"
                    min={0}
                    max={23}
                    inputMode="numeric"
                    value={hourEdits[slot.id] ?? String(slot.default_after_hour ?? 12)}
                    onChange={(e) => setHourEdits((prev) => ({ ...prev, [slot.id]: e.target.value }))}
                    onBlur={() => void handleHourBlur(slot)}
                    className="w-14 rounded-lg border border-slate-200 bg-white px-2 py-2 text-center text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    disabled={savingId === slot.id}
                    title="Local hour (0–23) when this session becomes the default tab"
                  />
                  <span className="text-xs text-slate-500">h</span>
                </div>
                <button
                  type="button"
                  onClick={() => void handleDelete(slot)}
                  className="shrink-0 rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-40"
                  disabled={savingId !== null}
                  title="Delete session"
                  aria-label={`Delete ${slot.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <label htmlFor="new-session" className="mb-1 block text-xs font-semibold text-slate-600">
              New session
            </label>
            <input
              id="new-session"
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Afternoon"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void handleAdd();
                }
              }}
            />
          </div>
          <Button
            type="button"
            onClick={() => void handleAdd()}
            disabled={savingId !== null || !newName.trim()}
          >
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>
      </div>
    </Modal>
  );
}
