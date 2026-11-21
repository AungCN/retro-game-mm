// Game module contract v2 — see docs/architecture/GAME_MODULE_CONTRACT.md.
import type { GameManifest } from '../../domain/games/manifest';

export type GameId = string;
export type DiscId = string;
export type BrowserTier = 'tier-1' | 'tier-2' | 'mobile';

/** Shared vocabulary with OFFLINE_FIRST_DESIGN.md, DATA_MODEL.md and ADR-0003. */
export const AVAILABILITY_STATES = [
  'NOT_INSTALLED',
  'DOWNLOADING',
  'AWAITING_USER_ROM',
  'NEEDS_PERMISSION',
  'OFFLINE_READY',
  'OFFLINE_UNAVAILABLE',
  'UPDATE_AVAILABLE',
  'STORAGE_ERROR',
  'UNSUPPORTED',
] as const;
export type AvailabilityState = (typeof AVAILABILITY_STATES)[number];

export type GameStatus = 'loading' | 'ready' | 'running' | 'paused' | 'error' | 'disposed';

/** Logical controls shared by keyboard, touch and gamepad. */
export type ControlId = 'up' | 'down' | 'left' | 'right' | 'action' | 'secondary' | 'start' | 'select';

export type NormalizedInput =
  | { kind: 'button'; control: ControlId; pressed: boolean; source: 'keyboard' | 'pointer' | 'gamepad'; timestamp: number }
  | { kind: 'axis'; control: ControlId; value: number; source: 'gamepad' | 'pointer'; timestamp: number };

export interface CapabilityReport {
  tier: BrowserTier;
  crossOriginIsolated: boolean;
  sharedArrayBuffer: boolean;
  webgpu: boolean;
  fileSystemAccess: boolean;
  opfs: boolean;
  persistentStorage: boolean | 'unknown';
}

export interface GameError {
  kind: 'load' | 'runtime' | 'save' | 'restore' | 'input' | 'capability' | 'file-access';
  message: string;
  recoverable: boolean;
}

export interface DiscLinkSummary {
  discId: DiscId;
  label: string;
  state: AvailabilityState;
  storageKind: 'fs-handle' | 'opfs-copy' | 'session-file';
  sizeBytes: number;
}

export interface BlobRecord {
  data: Uint8Array;
  schemaVersion: number;
}

export interface GameHostServices {
  readonly capabilities: Readonly<CapabilityReport>;
  input: { subscribe(handler: (event: NormalizedInput) => void): () => void };
  audio: {
    playEffect(id: string): Promise<void>;
    setMuted(muted: boolean): void;
    isMuted(): boolean;
  };
  storage: {
    readSave<T>(gameId: GameId): Promise<T | undefined>;
    writeSave<T>(gameId: GameId, data: T, schemaVersion: number): Promise<void>;
    removeSave(gameId: GameId): Promise<void>;
    blobs: {
      read(gameId: GameId, key: string): Promise<BlobRecord | undefined>;
      write(gameId: GameId, key: string, data: Uint8Array, schemaVersion: number): Promise<void>;
      remove(gameId: GameId, key: string): Promise<void>;
      list(gameId: GameId, prefix?: string): Promise<string[]>;
    };
  };
  lifecycle: {
    requestPause(): void;
    reportStatus(status: GameStatus): void;
    reportError(error: GameError): void;
  };
}

export interface GameModule {
  load(container: HTMLElement, services: GameHostServices): Promise<void>;
  start(): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  save(): Promise<void>;
  restore(): Promise<void>;
  destroy(): Promise<void>;
}

export interface DiscSwappable {
  listDiscSlots(): readonly { index: number; label: string }[];
  swapDisc(index: number): Promise<void>;
}
export interface SaveStateCapable {
  saveState(slot: number): Promise<void>;
  loadState(slot: number): Promise<void>;
}
export const isDiscSwappable = (m: GameModule): m is GameModule & DiscSwappable => 'swapDisc' in m;
export const isSaveStateCapable = (m: GameModule): m is GameModule & SaveStateCapable => 'saveState' in m;

export interface GameModuleFactory {
  manifest: GameManifest;
  create(): GameModule;
}
