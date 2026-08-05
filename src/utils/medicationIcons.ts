import type { LucideIcon } from 'lucide-react';
import {
  Droplet,
  Droplets,
  FlaskConical,
  HeartPulse,
  Pill,
  Syringe,
  Tablets,
  Thermometer,
  Wind,
} from 'lucide-react';

/** Stored on `medications.icon` and shown next to the name on the tracker. */
export type MedicationIconKey =
  | 'pill'
  | 'tablets'
  | 'syringe'
  | 'droplet'
  | 'droplets'
  | 'flask'
  | 'inhaler'
  | 'heart'
  | 'thermometer';

export const DEFAULT_MEDICATION_ICON: MedicationIconKey = 'pill';

export const MEDICATION_ICON_OPTIONS: {
  key: MedicationIconKey;
  label: string;
  Icon: LucideIcon;
}[] = [
  { key: 'pill', label: 'Pill', Icon: Pill },
  { key: 'tablets', label: 'Tablets', Icon: Tablets },
  { key: 'syringe', label: 'Syringe / injection', Icon: Syringe },
  { key: 'droplet', label: 'Drop / liquid', Icon: Droplet },
  { key: 'droplets', label: 'Eye / nose drops', Icon: Droplets },
  { key: 'flask', label: 'Liquid / bottle', Icon: FlaskConical },
  { key: 'inhaler', label: 'Inhaler', Icon: Wind },
  { key: 'heart', label: 'Heart / cardiac', Icon: HeartPulse },
  { key: 'thermometer', label: 'Temperature', Icon: Thermometer },
];

const byKey = new Map(MEDICATION_ICON_OPTIONS.map((o) => [o.key, o]));

export function isMedicationIconKey(v: unknown): v is MedicationIconKey {
  return typeof v === 'string' && byKey.has(v as MedicationIconKey);
}

export function normalizeMedicationIcon(v: unknown): MedicationIconKey {
  return isMedicationIconKey(v) ? v : DEFAULT_MEDICATION_ICON;
}

export function medicationIconComponent(key: MedicationIconKey | null | undefined): LucideIcon {
  return byKey.get(normalizeMedicationIcon(key))?.Icon ?? Pill;
}
