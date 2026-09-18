import { describe, expect, it } from 'vitest';
import {
  DEFAULT_BACKGROUND_COLOR,
  normalizePrefs,
  parseHexColor,
  parseHandedness,
  prefsFromRemoteRow,
} from './userSettings';

describe('user settings parsing', () => {
  it('accepts left and right handedness only', () => {
    expect(parseHandedness('left')).toBe('left');
    expect(parseHandedness('right')).toBe('right');
    expect(parseHandedness('both')).toBeNull();
    expect(parseHandedness(null)).toBeNull();
  });

  it('normalises 3-digit and 6-digit hex colours', () => {
    expect(parseHexColor('#E0F2FE')).toBe('#e0f2fe');
    expect(parseHexColor('#abc')).toBe('#aabbcc');
    expect(parseHexColor('blue')).toBeNull();
  });

  it('fills missing fields from defaults', () => {
    expect(normalizePrefs({})).toEqual({
      handedness: 'left',
      backgroundColor: DEFAULT_BACKGROUND_COLOR,
    });
    expect(normalizePrefs({ handedness: 'right', backgroundColor: '#dcfce7' })).toEqual({
      handedness: 'right',
      backgroundColor: '#dcfce7',
    });
  });

  it('maps a remote row onto app preferences', () => {
    expect(
      prefsFromRemoteRow({ handedness: 'right', background_color: '#EDE9FE' })
    ).toEqual({ handedness: 'right', backgroundColor: '#ede9fe' });
    expect(prefsFromRemoteRow(null)).toBeNull();
  });
});
