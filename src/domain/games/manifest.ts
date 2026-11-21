// Manifest model (manifest version 1). docs/architecture/game-manifest.schema.json is authoritative;
// tests/unit/manifests.test.ts validates every bundled manifest against it, and this runtime check rejects
// anything structurally unexpected before the catalogue uses it.

export type Platform = 'web-native' | 'ps1' | 'ps2';
export type RuntimeAdapter = 'native-canvas' | 'wasm-libretro' | 'wasm-ps2';
export type BrowserTierName = 'tier-1' | 'tier-2' | 'mobile';

export interface GameManifest {
  manifestVersion: 1;
  id: string;
  title: string;
  version: string;
  platform: Platform;
  runtimeAdapter: RuntimeAdapter;
  description: string;
  genre: string;
  orientation: 'any' | 'landscape' | 'portrait';
  hardwareRequirements?: {
    requiresSharedArrayBuffer: boolean;
    requiresWebGPU: boolean;
    recommendedRamMB?: number;
    browserTiers: BrowserTierName[];
  };
  romConfig?: {
    coreId: string;
    acceptedExtensions: string[];
    biosMode: 'required' | 'optional' | 'none';
    maxDiscs?: number;
    supportsM3uPlaylist?: boolean;
  };
  input: {
    keyboard: boolean;
    touch: boolean;
    gamepad: boolean;
    controllerProfile?: 'arcade-4btn' | 'dpad-standard' | 'ps1-digital-pad' | 'ps1-analog-pad' | 'ps2-analog-pad';
  };
  offline: { supported: boolean; contentSource: 'bundled' | 'user-supplied'; requiredAssets?: string[] };
  save: { supported: boolean; schemaVersion: number; supportsSaveStates?: boolean; supportsVirtualMemoryCard?: boolean };
  rightsRecord: string;
  assets: { path: string; required: boolean; mediaType?: string; sha256?: string }[];
  thumbnail?: string;
  releaseStatus?: 'idea' | 'spec-draft' | 'rights-review-required' | 'rights-cleared' | 'in-development' | 'qa' | 'accepted' | 'retired';
}

const PLATFORM_ADAPTER: Record<Platform, RuntimeAdapter> = {
  'web-native': 'native-canvas',
  ps1: 'wasm-libretro',
  ps2: 'wasm-ps2',
};

export class ManifestError extends Error {}

/** Structural runtime check. Throws ManifestError with a reason; never trusts unvalidated input. */
export function assertManifest(value: unknown): GameManifest {
  const fail = (why: string): never => {
    throw new ManifestError(`Invalid manifest: ${why}`);
  };
  if (typeof value !== 'object' || value === null) fail('not an object');
  const m = value as Partial<GameManifest>;
  if (m.manifestVersion !== 1) fail('unsupported manifestVersion');
  if (typeof m.id !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(m.id) || m.id.length > 64) fail('bad id');
  if (typeof m.title !== 'string' || m.title.length < 1 || m.title.length > 80) fail('bad title');
  if (!m.platform || !(m.platform in PLATFORM_ADAPTER)) fail('bad platform');
  if (m.runtimeAdapter !== PLATFORM_ADAPTER[m.platform as Platform]) fail('platform/adapter mismatch');
  if (!m.offline || typeof m.offline.supported !== 'boolean') fail('bad offline block');
  const byor = m.runtimeAdapter !== 'native-canvas';
  if (byor && (!m.romConfig || !m.hardwareRequirements)) fail('emulated entries need romConfig and hardwareRequirements');
  if (!byor && m.romConfig) fail('native entries must not declare romConfig');
  if (m.offline?.contentSource !== (byor ? 'user-supplied' : 'bundled')) fail('contentSource does not match adapter');
  if (!m.save || !Number.isInteger(m.save.schemaVersion) || m.save.schemaVersion < 1) fail('bad save block');
  return m as GameManifest;
}
