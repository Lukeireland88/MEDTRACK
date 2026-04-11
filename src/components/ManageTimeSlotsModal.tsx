import { useCallback, useEffect, useState } from 'react';
import { X, Plus, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { TimeSlot } from '../types';

interface ManageTimeSlotsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function ManageTimeSlotsModal({ isOpen, onClose, onSaved }: ManageTimeSlotsModalProps) {
  const [rows, setRows] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [edits, setEdits] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('time_slots')
        .select('id, name, sort_order')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      setRows((data as TimeSlot[]) || []);
      setEdits({});
    } catch (e) {
      console.error(e);
      alert('Could not load sessions.');
    } finally {
      setLoading(false);
    }
  }, []);

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
      alert('Name cannot be empty.');
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
      setEdits((e) => ({ ...e, [id]: originalName }));
      alert(
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
      alert('Could not reorder.');
    } finally {
      setSavingId(null);
    }
  };

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) {
      alert('Enter a name for the new session.');
      return;
    }
    const maxOrder = rows.reduce((m, r) => Math.max(m, r.sort_order), 0);
    setSavingId('add');
    try {
      const { error } = await supabase.from('time_slots').insert({
        name,
        sort_order: maxOrder + 1,
      });
      if (error) throw error;
      setNewName('');
      await load();
      onSaved();
    } catch (e: unknown) {
      console.error(e);
      alert(
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
      alert(
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
      alert('Could not delete.');
    } finally {
      setSavingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200/90"
        role="dialog"
        aria-labelledby="sessions-title"
        aria-modal="true"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 id="sessions-title" className="text-lg font-bold text-slate-900">
            Sessions
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="border-b border-slate-100 px-4 py-2 text-sm text-slate-600">
          Names appear in the day tabs and when scheduling medications. Order is left-to-right in the picker.
        </p>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          {loading ? (
            <p className="text-center text-sm text-slate-500">Loading…</p>
          ) : (
            <ul className="space-y-2">
              {rows.map((slot, index) => (
                <li
                  key={slot.id}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-2 py-2"
                >
                  <div className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      className="rounded p-0.5 text-slate-600 hover:bg-white disabled:opacity-40"
                      disabled={index === 0 || savingId !== null}
                      onClick={() => move(index, -1)}
                      aria-label="Move up"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="rounded p-0.5 text-slate-600 hover:bg-white disabled:opacity-40"
                      disabled={index === rows.length - 1 || savingId !== null}
                      onClick={() => move(index, 1)}
                      aria-label="Move down"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={edits[slot.id] ?? slot.name}
                    onChange={(e) => setEdits((prev) => ({ ...prev, [slot.id]: e.target.value }))}
                    onBlur={() => handleRenameBlur(slot.id, slot.name)}
                    className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    disabled={savingId === slot.id}
                  />
                  <button
                    type="button"
                    onClick={() => handleDelete(slot)}
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
                    handleAdd();
                  }
                }}
              />
            </div>
            <button
              type="button"
              onClick={handleAdd}
              disabled={savingId !== null || !newName.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-brand-sm hover:bg-brand-700 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          </div>
        </div>

        <div className="shrink-0 border-t border-slate-200 px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
