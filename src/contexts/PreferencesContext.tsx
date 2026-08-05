import { createContext, useContext, useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { applyBrandPaletteToDocument } from '../utils/themeColors';

export type Handedness = 'left' | 'right';

/** Default page wash when no custom colour is set (matches previous slate gradient feel). */
export const DEFAULT_BACKGROUND_COLOR = '#f1f5f9';

const PREFS_KEY = 'medtrack-preferences';
const LEGACY_HANDEDNESS_KEY = 'medtrack-handedness';

export type AppPreferences = {
  handedness: Handedness;
  /** Hex colour, e.g. #e0f2fe */
  backgroundColor: string;
};

interface PreferencesContextType {
  handedness: Handedness;
  setHandedness: (value: Handedness) => void;
  backgroundColor: string;
  setBackgroundColor: (value: string) => void;
  resetBackgroundColor: () => void;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

const defaultPrefs: AppPreferences = {
  handedness: 'left',
  backgroundColor: DEFAULT_BACKGROUND_COLOR,
};

function storageKeyForUser(userId: string | undefined | null): string {
  return userId ? `${PREFS_KEY}:${userId}` : PREFS_KEY;
}

function parseHandedness(raw: string | null): Handedness | null {
  if (raw === 'left' || raw === 'right') return raw;
  return null;
}

function parseHexColor(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const v = raw.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(v)) return v.toLowerCase();
  if (/^#[0-9a-fA-F]{3}$/.test(v)) {
    const r = v[1];
    const g = v[2];
    const b = v[3];
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return null;
}

function readPrefs(userId: string | undefined | null): AppPreferences {
  try {
    const userKey = storageKeyForUser(userId);
    const raw = localStorage.getItem(userKey);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AppPreferences>;
      const handedness = parseHandedness(parsed.handedness ?? null) ?? defaultPrefs.handedness;
      const backgroundColor =
        parseHexColor(parsed.backgroundColor) ?? defaultPrefs.backgroundColor;
      return { handedness, backgroundColor };
    }

    // Migrate legacy handedness-only key once.
    const legacyKey = userId ? `${LEGACY_HANDEDNESS_KEY}:${userId}` : LEGACY_HANDEDNESS_KEY;
    const legacyHand = parseHandedness(localStorage.getItem(legacyKey));
    const deviceLegacy = parseHandedness(localStorage.getItem(LEGACY_HANDEDNESS_KEY));
    const handedness = legacyHand ?? (userId ? deviceLegacy : null) ?? defaultPrefs.handedness;

    const prefs: AppPreferences = { ...defaultPrefs, handedness };
    localStorage.setItem(userKey, JSON.stringify(prefs));
    return prefs;
  } catch {
    return { ...defaultPrefs };
  }
}

function writePrefs(userId: string | undefined | null, prefs: AppPreferences) {
  try {
    localStorage.setItem(storageKeyForUser(userId), JSON.stringify(prefs));
    // Device fallback for signed-out first paint / account switch adopt.
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
}

function applyThemeToDocument(backgroundColor: string) {
  document.documentElement.style.setProperty('--app-bg', backgroundColor);
  document.body.style.backgroundColor = backgroundColor;
  applyBrandPaletteToDocument(backgroundColor);
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [prefs, setPrefs] = useState<AppPreferences>(() => readPrefs(null));

  useEffect(() => {
    const next = readPrefs(userId);
    setPrefs(next);
    applyThemeToDocument(next.backgroundColor);
  }, [userId]);

  useEffect(() => {
    applyThemeToDocument(prefs.backgroundColor);
  }, [prefs.backgroundColor]);

  const update = (partial: Partial<AppPreferences>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...partial };
      writePrefs(userId, next);
      return next;
    });
  };

  const setHandedness = (value: Handedness) => update({ handedness: value });
  const setBackgroundColor = (value: string) => {
    const hex = parseHexColor(value);
    if (!hex) return;
    update({ backgroundColor: hex });
  };
  const resetBackgroundColor = () => update({ backgroundColor: DEFAULT_BACKGROUND_COLOR });

  return (
    <PreferencesContext.Provider
      value={{
        handedness: prefs.handedness,
        setHandedness,
        backgroundColor: prefs.backgroundColor,
        setBackgroundColor,
        resetBackgroundColor,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
}

/** Shared page shell background — custom colour or soft default wash. */
export function usePageBackgroundProps() {
  const { backgroundColor } = usePreferences();
  return {
    className: 'min-h-screen',
    style: { backgroundColor } as CSSProperties,
  };
}
