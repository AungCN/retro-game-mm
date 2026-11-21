import type { BrowserTier, CapabilityReport } from '../../game-runtime/contracts/types';

export interface UaHints {
  userAgent: string;
  mobileHint?: boolean | undefined;
  maxTouchPoints: number;
  platform: string;
  hasFilePickers: boolean;
}

/** Tier rules from MVP_SCOPE.md: Tier 1 = desktop Chromium (File System Access pickers), Tier 2 = other desktop, mobile = no BYOR. */
export function classifyTier(h: UaHints): BrowserTier {
  const ua = h.userAgent;
  const iPadAsMac = h.platform === 'MacIntel' && h.maxTouchPoints > 1;
  const mobile = h.mobileHint === true || /Android|iPhone|iPad|iPod|Mobile/i.test(ua) || iPadAsMac;
  if (mobile) return 'mobile';
  return h.hasFilePickers ? 'tier-1' : 'tier-2';
}

export async function detectCapabilities(): Promise<CapabilityReport> {
  const nav = navigator as Navigator & { userAgentData?: { mobile?: boolean } };
  const tier = classifyTier({
    userAgent: nav.userAgent,
    mobileHint: nav.userAgentData?.mobile,
    maxTouchPoints: nav.maxTouchPoints ?? 0,
    platform: nav.platform ?? '',
    hasFilePickers: 'showOpenFilePicker' in window,
  });
  let sab = false;
  try {
    new SharedArrayBuffer(8);
    sab = true;
  } catch {
    sab = false;
  }
  let persisted: boolean | 'unknown' = 'unknown';
  try {
    persisted = (await navigator.storage?.persisted?.()) ?? 'unknown';
  } catch {
    persisted = 'unknown';
  }
  return {
    tier,
    crossOriginIsolated: self.crossOriginIsolated === true,
    sharedArrayBuffer: sab,
    webgpu: 'gpu' in navigator,
    fileSystemAccess: 'showOpenFilePicker' in window,
    opfs: typeof navigator.storage?.getDirectory === 'function',
    persistentStorage: persisted,
  };
}
