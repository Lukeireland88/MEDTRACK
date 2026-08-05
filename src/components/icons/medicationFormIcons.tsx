import type { LucideProps } from 'lucide-react';
import type { ForwardRefExoticComponent, ReactNode, RefAttributes } from 'react';

type MedIcon = ForwardRefExoticComponent<
  Omit<LucideProps, 'ref'> & RefAttributes<SVGSVGElement>
>;

function medIcon(displayName: string, children: ReactNode): MedIcon {
  const Icon = ({ size = 24, className, color, strokeWidth = 2, ...props }: LucideProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? 'currentColor'}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {children}
    </svg>
  );
  Icon.displayName = displayName;
  return Icon as MedIcon;
}

/** Capsule / softgel */
export const CapsuleIcon = medIcon(
  'CapsuleIcon',
  <>
    <path d="M8.5 15.5 15.5 8.5" />
    <rect x="5.2" y="9.2" width="13.6" height="5.6" rx="2.8" transform="rotate(-45 12 12)" />
  </>
);

/** Eye / ear dropper */
export const DropperIcon = medIcon(
  'DropperIcon',
  <>
    <path d="M14.5 3.5 18 7l-1.2 1.2a2 2 0 0 1-2.8 0L12.8 7" />
    <path d="m11.5 8.5-6 6a2.5 2.5 0 0 0 0 3.5l.5.5a2.5 2.5 0 0 0 3.5 0l6-6" />
    <path d="M8 17.5 6.5 19" />
  </>
);

/** Liquid medicine poured onto a spoon */
export const LiquidSpoonIcon = medIcon(
  'LiquidSpoonIcon',
  <>
    <path d="M8 3h5a2 2 0 0 1 2 2v3H6V5a2 2 0 0 1 2-2Z" />
    <path d="M6 8h9v1.5a2.5 2.5 0 0 1-2.5 2.5h-4A2.5 2.5 0 0 1 6 9.5V8Z" />
    <path d="M10.5 7v1" />
    <path d="M14 14.5c0 1.4-1.3 2.5-3 2.5s-3-1.1-3-2.5 1.3-2 3-2 3 .6 3 2Z" />
    <path d="M14 14.5h5.5" />
    <path d="M10.2 11.5 9 14" />
  </>
);

/** Medicine bottle */
export const MedicineBottleIcon = medIcon(
  'MedicineBottleIcon',
  <>
    <path d="M9 3h6v2.5H9z" />
    <path d="M8 5.5h8v2H8z" />
    <path d="M7.5 7.5h9v13a1.5 1.5 0 0 1-1.5 1.5h-6a1.5 1.5 0 0 1-1.5-1.5z" />
    <rect x="9.5" y="11" width="5" height="5" rx="0.5" />
  </>
);

/** Asthma / respiratory inhaler */
export const InhalerIcon = medIcon(
  'InhalerIcon',
  <>
    <path d="M9 4h5.5a1.5 1.5 0 0 1 1.5 1.5V12H9.5A1.5 1.5 0 0 1 8 10.5V5.5A1.5 1.5 0 0 1 9.5 4" />
    <path d="M8 12v5.5A2.5 2.5 0 0 0 10.5 20H14" />
    <path d="M14 12h3.5a1.5 1.5 0 0 1 1.5 1.5V18a2 2 0 0 1-2 2h-3" />
    <path d="M10 7h3" />
  </>
);

/** Cream / ointment tube */
export const CreamTubeIcon = medIcon(
  'CreamTubeIcon',
  <>
    <path d="M10 3h4v3h-4z" />
    <path d="M9 6h6l1.5 2.5v9.5a2 2 0 0 1-2 2h-5a2 2 0 0 1-2-2V8.5Z" />
    <path d="M9.5 12h5" />
    <path d="M9.5 15h5" />
  </>
);

/** Nasal spray bottle */
export const NasalSprayIcon = medIcon(
  'NasalSprayIcon',
  <>
    <path d="M11 3h2v3h-2z" />
    <path d="M10.5 6h3l1 2H9.5Z" />
    <path d="M9 8h6v10.5a2.5 2.5 0 0 1-2.5 2.5h-1A2.5 2.5 0 0 1 9 18.5Z" />
    <path d="M12 3c1.2 0 2.2.5 2.8 1.2" />
    <path d="M14.8 3.5 16 2.8" />
  </>
);
