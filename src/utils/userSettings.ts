import { isSupabaseConfigured, supabase } from '../lib/supabase';

export type Handedness = 'left' | 'right';

/** Default page wash when no custom colour is set (matches previous slate gradient feel). */
export const DEFAULT_BACKGROUND_COLOR = '#f1f5f9';

export type AppPreferences = {
  handedness: Handedness;
  /** Hex colour, e.g. #e0f2fe */
  backgroundColor: string;
};

export const defaultPrefs: AppPreferences = {
  handedness: 'left',
  backgroundColor: DEFAULT_BACKGROUND_COLOR,
};

export function parseHandedness(raw: string | null | undefined): Handedness | null {
  if (raw === 'left' || raw === 'right') return raw;
  return null;
}

export function parseHexColor(raw: string | null | undefined): string | null {
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

export function normalizePrefs(partial: Partial<AppPreferences> | null | undefined): AppPreferences {
  return {
    handedness: parseHandedness(partial?.handedness) ?? defaultPrefs.handedness,
    backgroundColor: parseHexColor(partial?.backgroundColor) ?? defaultPrefs.backgroundColor,
  };
}

export function prefsFromRemoteRow(row: {
  handedness?: string | null;
  background_color?: string | null;
} | null): AppPreferences | null {
  if (!row) return null;
  const handedness = parseHandedness(row.handedness);
  const backgroundColor = parseHexColor(row.background_color);
  if (!handedness && !backgroundColor) return null;
  return {
    handedness: handedness ?? defaultPrefs.handedness,
    backgroundColor: backgroundColor ?? defaultPrefs.backgroundColor,
  };
}

export async function fetchUserSettings(userId: string): Promise<AppPreferences | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from('user_settings')
    .select('handedness, background_color')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) return null;
  return prefsFromRemoteRow(data);
}

export async function upsertUserSettings(userId: string, prefs: AppPreferences): Promise<void> {
  if (!isSupabaseConfigured) return;
  await supabase.from('user_settings').upsert({
    user_id: userId,
    handedness: prefs.handedness,
    background_color: prefs.backgroundColor,
    updated_at: new Date().toISOString(),
  });
}
