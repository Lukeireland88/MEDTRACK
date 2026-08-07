/**
 * Shared semantic colours for dose / observation status across tracker + history.
 * Keep purple for seizures and amber for notes/measurements (distinct from dose status).
 */
export const statusTone = {
  taken: {
    text: 'text-emerald-800',
    softBg: 'bg-emerald-100',
    badge: 'bg-emerald-100 text-emerald-900 ring-1 ring-emerald-200/80',
  },
  notTaken: {
    text: 'text-rose-800',
    softBg: 'bg-rose-100',
    badge: 'bg-rose-100 text-rose-900 ring-1 ring-rose-200/80',
  },
  seizure: {
    text: 'text-purple-950',
    softBg: 'bg-purple-50',
    border: 'border-purple-200',
    badge: 'bg-purple-100 text-purple-900 ring-1 ring-purple-200/80',
  },
  note: {
    text: 'text-amber-950',
    softBg: 'bg-amber-50',
    border: 'border-amber-200',
    badge: 'bg-amber-100 text-amber-900 ring-1 ring-amber-200/80',
  },
} as const;
