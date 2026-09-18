import { createContext, useContext, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { applyBrandPaletteToDocument } from '../utils/themeColors';
import {
  DEFAULT_BACKGROUND_COLOR,
  defaultPrefs,
  fetchUserSettings,
  parseHexColor,
  parseHandedness,
  type AppPreferences,
  type Handedness,
  normalizePrefs,
  upsertUserSettings,
} from '../utils/userSettings';

export { DEFAULT_BACKGROUND_COLOR, type AppPreferences, type Handedness };

// Legacy localStorage keys retained so existing users keep their saved preferences.
const PREFS_KEY = 'medtrack-preferences';
const LEGACY_HANDEDNESS_KEY = 'medtrack-handedness';
const REMOTE_SAVE_DEBOUNCE_MS = 400;

interface PreferencesContextType {
  handedness: Handedness;
  setHandedness: (value: Handedness) => void;
  backgroundColor: string;
  setBackgroundColor: (value: string) => void;
  resetBackgroundColor: () => void;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

function storageKeyForUser(userId: string | undefined | null): string {
  return userId ? `${PREFS_KEY}:${userId}` : PREFS_KEY;
}

function readPrefs(userId: string | undefined | null): AppPreferences {
  try {
    const userKey = storageKeyForUser(userId);
    const raw = localStorage.getItem(userKey);
    if (raw) {
      return normalizePrefs(JSON.parse(raw) as Partial<AppPreferences>);
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
  const prefsRef = useRef(prefs);
  const localEpochRef = useRef(0);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  prefsRef.current = prefs;

  const flushRemote = (uid: string, next: AppPreferences) => {
    void upsertUserSettings(uid, next);
  };

  const scheduleRemote = (uid: string, next: AppPreferences, immediate: boolean) => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    if (immediate) {
      flushRemote(uid, next);
      return;
    }
    saveTimerRef.current = setTimeout(() => {
      saveTimerRef.current = null;
      flushRemote(uid, prefsRef.current);
    }, REMOTE_SAVE_DEBOUNCE_MS);
  };

  useEffect(() => {
    const next = readPrefs(userId);
    localEpochRef.current += 1;
    const loadEpoch = localEpochRef.current;
    setPrefs(next);
    applyThemeToDocument(next.backgroundColor);

    if (!userId) return;

    let cancelled = false;
    void (async () => {
      const remote = await fetchUserSettings(userId);
      if (cancelled || loadEpoch !== localEpochRef.current) return;
      if (remote) {
        setPrefs(remote);
        writePrefs(userId, remote);
        applyThemeToDocument(remote.backgroundColor);
        return;
      }
      // Avoid writing defaults from a new device over a colour that has not been synced yet.
      if (
        next.handedness !== defaultPrefs.handedness ||
        next.backgroundColor !== defaultPrefs.backgroundColor
      ) {
        await upsertUserSettings(userId, next);
      }
    })();

    return () => {
      cancelled = true;
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
        flushRemote(userId, prefsRef.current);
      }
    };
  }, [userId]);

  useEffect(() => {
    applyThemeToDocument(prefs.backgroundColor);
  }, [prefs.backgroundColor]);

  const update = (partial: Partial<AppPreferences>, persistRemoteImmediately = true) => {
    setPrefs((prev) => {
      const next = { ...prev, ...partial };
      localEpochRef.current += 1;
      writePrefs(userId, next);
      if (userId) scheduleRemote(userId, next, persistRemoteImmediately);
      return next;
    });
  };

  const setHandedness = (value: Handedness) => update({ handedness: value }, true);
  const setBackgroundColor = (value: string) => {
    const hex = parseHexColor(value);
    if (!hex) return;
    update({ backgroundColor: hex }, false);
  };
  const resetBackgroundColor = () => update({ backgroundColor: DEFAULT_BACKGROUND_COLOR }, true);

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
