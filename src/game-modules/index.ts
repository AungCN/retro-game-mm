// Native game module factories, keyed by manifest id. The PS1 player is created separately (it needs a disc).
import type { GameModuleFactory } from '../game-runtime/contracts/types';
import { cometCourier } from './comet-courier/module';
import { chess } from './chess/module';
import { checkers } from './checkers/module';
import { reversi } from './reversi/module';

export const NATIVE_GAMES: Readonly<Record<string, GameModuleFactory>> = Object.freeze({
  [cometCourier.manifest.id]: cometCourier,
  [chess.manifest.id]: chess,
  [checkers.manifest.id]: checkers,
  [reversi.manifest.id]: reversi,
});
