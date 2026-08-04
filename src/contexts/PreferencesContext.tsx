import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

export type Handedness = 'left' | 'right';

const DEVICE_KEY = 'medtrack-handedness';

interface PreferencesContextType {
  handedness: Handedness;
  setHandedness: (value: Handedness) => void;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

function storageKeyForUser(userId: string | undefined | null): string {
  return userId ? `${DEVICE_KEY}:${userId}` : DEVICE_KEY;
}

function parseHandedness(raw: string | null): Handedness | null {
  if (raw === 'left' || raw === 'right') return raw;
  return null;
}

function readHandedness(userId: string | undefined | null): Handedness {
  try {
    const userKey = storageKeyForUser(userId);
    const fromUser = parseHandedness(localStorage.getItem(userKey));
    if (fromUser) return fromUser;

    // Signed-in with no per-user value yet: adopt device preference once.
    if (userId) {
      const fromDevice = parseHandedness(localStorage.getItem(DEVICE_KEY));
      if (fromDevice) {
        localStorage.setItem(userKey, fromDevice);
        return fromDevice;
      }
    }
  } catch {
    /* ignore */
  }
  return 'left';
}

function writeHandedness(userId: string | undefined | null, value: Handedness) {
  try {
    localStorage.setItem(storageKeyForUser(userId), value);
    // Keep device key in sync so signed-out / first-load stays sensible.
    localStorage.setItem(DEVICE_KEY, value);
  } catch {
    /* ignore */
  }
}

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [handedness, setHandednessState] = useState<Handedness>(() => readHandedness(null));

  // Reload when the signed-in account changes.
  useEffect(() => {
    setHandednessState(readHandedness(userId));
  }, [userId]);

  const setHandedness = (value: Handedness) => {
    setHandednessState(value);
    writeHandedness(userId, value);
  };

  return (
    <PreferencesContext.Provider value={{ handedness, setHandedness }}>
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
