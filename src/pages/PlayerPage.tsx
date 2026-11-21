import { useEffect, useRef, useState } from 'react';
import { useApp } from '../app/AppContext';
import { href, navigate } from '../app/router';
import { findGame, isByor } from '../domain/games/registry';
import { GameHost } from '../game-runtime/host/GameHost';
import type { ControlId, GameError, GameModule, GameStatus } from '../game-runtime/contracts/types';
import { isDiscSwappable, isSaveStateCapable } from '../game-runtime/contracts/types';
import { NATIVE_GAMES } from '../game-modules';
import { LibretroAdapter } from '../game-runtime/adapters/wasm-libretro/LibretroAdapter';
import { discState, getBios, getDisc, openDiscFiles } from '../platform/files/userFiles';
import { writeZip } from '../platform/zip/zip';

async function discGameFile(files: File[]): Promise<File> {
  if (files.length === 1) return files[0]!;
  // Multi-file disc (.cue + .bin, or .m3u set): bundle as one stored zip; EmulatorJS extracts it and prefers the .m3u/.cue.
  // Names are kept as-is because .cue/.m3u sheets reference them; writeZip rejects anything unsafe.
  let zip: Blob;
  try {
    zip = await writeZip(files.map((f) => ({ name: f.name, data: f })));
  } catch {
    throw new Error('Some disc file names contain unusual characters. Rename them using letters, numbers, spaces, and ( ) [ ] - _ . and link the disc again.');
  }
  return new File([zip], 'disc.zip', { type: 'application/zip' });
}

export function PlayerPage({ id, discId }: { id: string; discId?: string | undefined }) {
  const game = findGame(id);
  const { caps, prefs } = useApp();
  const container = useRef<HTMLDivElement>(null);
  const hostRef = useRef<GameHost | null>(null);
  const [status, setStatus] = useState<GameStatus>('loading');
  const [error, setError] = useState<GameError | null>(null);
  const [notice, setNotice] = useState('');
  const [muted, setMuted] = useState(prefs.muted);
  const [module, setModule] = useState<GameModule | null>(null);

  useEffect(() => {
    if (!game || !caps || !container.current) return;
    let cancelled = false;
    const host = new GameHost(caps, { onStatus: setStatus, onError: setError });
    hostRef.current = host;
    host.audio.setMuted(prefs.muted);
    (async () => {
      let mod: GameModule;
      if (!isByor(game)) {
        const factory = NATIVE_GAMES[game.id];
        if (!factory) throw new Error('This game is not available in this version.');
        mod = factory.create();
      } else {
        if (!discId) throw new Error('Choose a disc from the PS1 Player page first.');
        if (!game.hardwareRequirements?.browserTiers.includes(caps.tier)) throw new Error('The PS1 player is not supported in this browser yet.');
        const rec = await getDisc(discId);
        if (!rec || rec.gameId !== game.id) throw new Error('That disc is no longer in your library.');
        const state = await discState(rec);
        if (state !== 'OFFLINE_READY') throw new Error('This disc needs attention first (allow access or select the files again).');
        const [files, bios] = await Promise.all([openDiscFiles(rec), getBios()]);
        const biosFile = bios ? new File([bios.data as BlobPart], bios.fileName) : null;
        mod = new LibretroAdapter({ gameId: game.id, discId, game: await discGameFile(files), bios: biosFile });
      }
      if (cancelled) return;
      setModule(mod);
      await host.mount(mod, container.current!);
    })().catch((e: unknown) => {
      setError({ kind: 'load', message: e instanceof Error ? e.message : 'The game could not be loaded.', recoverable: false });
      setStatus('error');
    });
    return () => {
      cancelled = true;
      hostRef.current = null;
      void host.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game?.id, discId, caps]);

  if (!game) return <section className="page"><h1>Game not found</h1><a href={href('/')}>Back</a></section>;

  const host = hostRef.current;
  const touch = (control: ControlId) => ({
    onPointerDown: (e: React.PointerEvent) => { e.preventDefault(); host?.input.pointer(control, true); },
    onPointerUp: () => host?.input.pointer(control, false),
    onPointerLeave: () => host?.input.pointer(control, false),
  });
  const saveStates = module && isSaveStateCapable(module) ? module : null;
  const swappable = module && isDiscSwappable(module) ? module : null;
  const discSlots = swappable?.listDiscSlots() ?? [];
  const exit = () => navigate(`/game/${game.id}`);
  // After Start/Resume, give keyboard focus to the game (board games move it to their board themselves).
  const focusStage = () => {
    const stage = container.current;
    if (stage && !stage.contains(document.activeElement)) stage.focus({ preventScroll: true });
  };

  const act = async (fn: () => Promise<void>, ok: string) => {
    try {
      await fn();
      setNotice(ok);
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'That did not work.');
    }
  };

  return (
    <section className="player" aria-label={`${game.title} player`}>
      <div className="player__bar" role="toolbar" aria-label="Game controls">
        <button onClick={exit}>← Exit</button>
        <strong className="player__title">{game.title}</strong>
        {status === 'ready' && <button className="button--primary" onClick={() => void host?.start().then(focusStage)}>{isByor(game) ? 'Load disc' : 'Start'}</button>}
        {status === 'running' && <button onClick={() => void host?.pause()}>Pause</button>}
        {status === 'paused' && <button className="button--primary" onClick={() => void host?.resume().then(focusStage)}>Resume</button>}
        <button aria-pressed={muted} onClick={() => { const m = !muted; setMuted(m); host?.audio.setMuted(m); }}>{muted ? 'Unmute' : 'Mute'}</button>
        {saveStates && (status === 'running' || status === 'paused') && [1, 2, 3].map((slot) => (
          <span key={slot} className="slot">
            <button onClick={() => void act(() => saveStates.saveState(slot), `Saved to slot ${slot}.`)}>Save {slot}</button>
            <button onClick={() => void act(() => saveStates.loadState(slot), `Loaded slot ${slot}.`)}>Load {slot}</button>
          </span>
        ))}
        {discSlots.length > 1 && (
          <label>Disc <select onChange={(e) => void swappable?.swapDisc(Number(e.target.value))}>{discSlots.map((d) => <option key={d.index} value={d.index}>{d.label}</option>)}</select></label>
        )}
        <span className="player__status" role="status">{status === 'loading' ? 'Loading…' : status === 'paused' ? 'Paused' : notice}</span>
      </div>
      {error && (
        <div className="notice notice--error" role="alert">
          {error.message} {!error.recoverable && <button onClick={exit}>Back to game page</button>}
          {error.recoverable && <button onClick={() => setError(null)}>Dismiss</button>}
        </div>
      )}
      <div className={game.genre === 'board' ? 'player__stage player__stage--board' : 'player__stage'} ref={container} tabIndex={-1} aria-label={`${game.title} game area`} />
      {game.input.controllerProfile === 'dpad-standard' && (
        <div className="touch-controls" aria-hidden="true">
          <button {...touch('left')}>◀</button>
          <button {...touch('start')}>❚❚</button>
          <button {...touch('right')}>▶</button>
        </div>
      )}
      {isByor(game) && status === 'ready' && <p className="player__hint">Press “Load disc”, then press Start inside the player. Keyboard input goes to the player while it has focus.</p>}
    </section>
  );
}
