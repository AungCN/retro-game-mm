import { idbGet, idbPut } from './db';

export interface Preferences {
  muted: boolean;
  /** Tier 2 (D3, provisional): copy linked discs into browser storage (OPFS) so they survive restarts. */
  preferOpfsCopy: boolean;
  /** Use a file-upload control instead of linking (also useful for testing the Tier 2 path on Chromium). */
  forceUploadMode: boolean;
}

export const DEFAULT_PREFS: Preferences = { muted: false, preferOpfsCopy: true, forceUploadMode: false };

export async function loadPrefs(): Promise<Preferences> {
  try {
    const p = await idbGet<Partial<Preferences>>('prefs', 'user');
    return {
      muted: typeof p?.muted === 'boolean' ? p.muted : DEFAULT_PREFS.muted,
      preferOpfsCopy: typeof p?.preferOpfsCopy === 'boolean' ? p.preferOpfsCopy : DEFAULT_PREFS.preferOpfsCopy,
      forceUploadMode: typeof p?.forceUploadMode === 'boolean' ? p.forceUploadMode : DEFAULT_PREFS.forceUploadMode,
    };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export const savePrefs = (p: Preferences) => idbPut('prefs', 'user', p);
