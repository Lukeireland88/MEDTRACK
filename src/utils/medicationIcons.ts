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
} from 'lucide-react';
import {
  CapsuleIcon,
  CreamTubeIcon,
  DropperIcon,
  InhalerIcon,
  LiquidSpoonIcon,
  MedicineBottleIcon,
  NasalSprayIcon,
} from '../components/icons/medicationFormIcons';

/** Stored on `medications.icon` and shown next to the name on the tracker. */
export type MedicationIconKey =
  | 'pill'
  | 'tablets'
  | 'capsule'
  | 'syringe'
  | 'droplet'
  | 'droplets'
  | 'dropper'
  | 'liquid_spoon'
  | 'bottle'
  | 'flask'
  | 'inhaler'
  | 'cream'
  | 'nasal_spray'
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
  { key: 'capsule', label: 'Capsule', Icon: CapsuleIcon as LucideIcon },
  { key: 'syringe', label: 'Syringe / injection', Icon: Syringe },
  { key: 'dropper', label: 'Dropper', Icon: DropperIcon as LucideIcon },
  { key: 'droplet', label: 'Drop', Icon: Droplet },
  { key: 'droplets', label: 'Eye / nose drops', Icon: Droplets },
  { key: 'liquid_spoon', label: 'Liquid + spoon', Icon: LiquidSpoonIcon as LucideIcon },
  { key: 'bottle', label: 'Medicine bottle', Icon: MedicineBottleIcon as LucideIcon },
  { key: 'flask', label: 'Liquid measure', Icon: FlaskConical },
  { key: 'inhaler', label: 'Inhaler', Icon: InhalerIcon as LucideIcon },
  { key: 'cream', label: 'Cream / ointment', Icon: CreamTubeIcon as LucideIcon },
  { key: 'nasal_spray', label: 'Nasal spray', Icon: NasalSprayIcon as LucideIcon },
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
