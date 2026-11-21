import type { AvailabilityState } from '../game-runtime/contracts/types';

/** Text + colour, never colour alone (ACCESSIBILITY.md). */
const LABELS: Record<AvailabilityState, { text: string; tone: 'ok' | 'warn' | 'bad' | 'info' }> = {
  NOT_INSTALLED: { text: 'Not available offline', tone: 'info' },
  DOWNLOADING: { text: 'Downloading…', tone: 'info' },
  AWAITING_USER_ROM: { text: 'Select disc files', tone: 'warn' },
  NEEDS_PERMISSION: { text: 'Allow access to play', tone: 'warn' },
  OFFLINE_READY: { text: 'Ready offline', tone: 'ok' },
  OFFLINE_UNAVAILABLE: { text: 'Unavailable', tone: 'bad' },
  UPDATE_AVAILABLE: { text: 'Update available', tone: 'info' },
  STORAGE_ERROR: { text: 'Storage problem', tone: 'bad' },
  UNSUPPORTED: { text: 'Not supported here yet', tone: 'bad' },
};

export function StateBadge({ state, label }: { state: AvailabilityState; label?: string }) {
  const l = LABELS[state];
  return <span className={`pill pill--${l.tone}`}>{label ?? l.text}</span>;
}
