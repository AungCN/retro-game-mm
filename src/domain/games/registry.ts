import { assertManifest, type GameManifest } from './manifest';
import cometManifest from '../../game-modules/comet-courier/manifest.json';
import ps1Manifest from '../../game-modules/ps1-player/manifest.json';

/** Catalogue registry. Bundled manifests only — no remote catalogue or code (SYSTEM_OVERVIEW constraints). */
export const CATALOGUE: readonly GameManifest[] = Object.freeze([assertManifest(cometManifest), assertManifest(ps1Manifest)]);

export function findGame(id: string): GameManifest | undefined {
  return CATALOGUE.find((g) => g.id === id);
}

export const isByor = (m: GameManifest) => m.offline.contentSource === 'user-supplied';
