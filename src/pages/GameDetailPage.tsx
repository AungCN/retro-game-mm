import { useCallback, useEffect, useRef, useState } from 'react';
import { useApp } from '../app/AppContext';
import { href, navigate } from '../app/router';
import { findGame, isByor } from '../domain/games/registry';
import type { GameManifest } from '../domain/games/manifest';
import type { AvailabilityState } from '../game-runtime/contracts/types';
import { StateBadge } from '../components/StateBadge';
import {
  discState, getBios, importBios, linkDisc, listDiscs, pickWithFileSystemAccess, removeBios, removeDisc, requestAccess, reselectSessionFiles,
  type BiosRecord, type DiscRecord,
} from '../platform/files/userFiles';
import { emulatorPackageState, installEmulatorPackage, removeEmulatorPackage } from '../platform/offline/offline';

const CONTROLS: Record<string, [string, string][]> = {
  'comet-courier': [
    ['Move left / right', 'Arrow keys or A / D · gamepad D-pad or left stick · on-screen buttons'],
    ['Pause / resume', 'Enter or P · gamepad Start · Pause button'],
    ['Restart after game over', 'Enter or Space · gamepad A'],
  ],
  chess: [
    ['Move a piece', 'Click or tap a piece, then its destination · or arrow keys to move around the board and Enter/Space to select'],
    ['Promotion', 'Choose the new piece from the buttons that appear'],
    ['New game, undo, opponent, level', 'Buttons and menus above the board'],
  ],
  checkers: [
    ['Move or jump', 'Click or tap a piece, then where it should land (multi-jumps are taken in one go) · arrow keys + Enter/Space'],
    ['Rules', 'Captures are mandatory; reaching the far row crowns a piece and ends the move'],
    ['New game, undo, opponent, level', 'Buttons and menus above the board'],
  ],
  reversi: [
    ['Place a disc', 'Click or tap a highlighted square · arrow keys + Enter/Space'],
    ['Passing', 'Happens automatically when a side has no legal move'],
    ['New game, undo, opponent, level', 'Buttons and menus above the board'],
  ],
  'ps1-player': [
    ['D-pad', 'Arrow keys (EmulatorJS default mapping)'],
    ['Face buttons', 'Z / X / A / S (EmulatorJS defaults); a standard gamepad also works'],
    ['Start / Select', 'Enter / V'],
    ['Pause, save states, exit', 'Use the toolbar above the player'],
  ],
};

const formatSize = (b: number) => (b > 1e9 ? `${(b / 1e9).toFixed(2)} GB` : `${(b / 1e6).toFixed(1)} MB`);
const STORAGE_LABEL: Record<DiscRecord['storageKind'], string> = {
  'fs-handle': 'Linked from your disk',
  'opfs-copy': 'Copied into browser storage',
  'session-file': 'This session only',
};

export function GameDetailPage({ id }: { id: string }) {
  const game = findGame(id);
  if (!game) {
    return (
      <section className="page">
        <h1>Game not found</h1>
        <p><a href={href('/')}>Back to the library</a></p>
      </section>
    );
  }
  return (
    <section className="page">
      <p><a href={href('/')}>← Library</a></p>
      <h1>{game.title}</h1>
      <p className="lead">{game.description}</p>
      <h2>Controls</h2>
      <table className="controls">
        <tbody>
          {(CONTROLS[game.id] ?? []).map(([a, k]) => (
            <tr key={a}><th scope="row">{a}</th><td>{k}</td></tr>
          ))}
        </tbody>
      </table>
      {isByor(game) ? <ByorSection game={game} /> : <NativeSection game={game} />}
    </section>
  );
}

function NativeSection({ game }: { game: GameManifest }) {
  return (
    <>
      <h2>Offline</h2>
      <p><StateBadge state="OFFLINE_READY" label="Included in the app" /> Once the app has loaded, this game works without a connection.</p>
      <p><a className="button button--primary" href={href(`/play/${game.id}`)}>Play</a></p>
    </>
  );
}

function ByorSection({ game }: { game: GameManifest }) {
  const { caps, prefs, online } = useApp();
  const [discs, setDiscs] = useState<{ rec: DiscRecord; state: AvailabilityState }[]>([]);
  const [pkg, setPkg] = useState<AvailabilityState>('NOT_INSTALLED');
  const [progress, setProgress] = useState<string>('');
  const [bios, setBios] = useState<BiosRecord | undefined>();
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [label, setLabel] = useState('');
  const uploadRef = useRef<HTMLInputElement>(null);
  const accepted = game.romConfig?.acceptedExtensions ?? [];

  const refresh = useCallback(async () => {
    const recs = await listDiscs(game.id);
    setDiscs(await Promise.all(recs.map(async (rec) => ({ rec, state: await discState(rec) }))));
    setPkg(await emulatorPackageState());
    setBios(await getBios());
  }, [game.id]);

  useEffect(() => {
    void refresh();
  }, [refresh, online]);

  if (!caps) return <p>Checking what this browser supports…</p>;
  if (!game.hardwareRequirements?.browserTiers.includes(caps.tier)) {
    return (
      <div className="notice notice--warn" role="status">
        <h2>Not supported here yet</h2>
        <p>The PS1 player needs a desktop browser (Chrome, Edge, Safari, or Firefox on a computer). On phones and tablets, try the included games instead.</p>
      </div>
    );
  }

  const run = async (fn: () => Promise<string | void>) => {
    setMessage(null);
    try {
      const text = await fn();
      if (text) setMessage({ kind: 'ok', text });
    } catch (e) {
      setMessage({ kind: 'error', text: e instanceof Error ? e.message : 'Something went wrong' });
    }
    await refresh();
  };

  const useUpload = caps.tier === 'tier-2' || prefs.forceUploadMode || !caps.fileSystemAccess;

  const linkFromPicker = () =>
    run(async () => {
      const handles = await pickWithFileSystemAccess(accepted);
      const rec = await linkDisc({ gameId: game.id, label: label || handles[0]?.name || 'My disc', acceptedExtensions: accepted, tier: caps.tier, preferOpfsCopy: false, handles });
      setLabel('');
      return `Linked “${rec.label}”. The files stay where they are on your disk.`;
    });

  const linkFromUpload = (files: File[]) =>
    run(async () => {
      if (files.length === 0) return;
      setProgress('Preparing disc…');
      try {
        const rec = await linkDisc({ gameId: game.id, label: label || files[0]!.name, acceptedExtensions: accepted, tier: caps.tier, preferOpfsCopy: prefs.preferOpfsCopy, files });
        setLabel('');
        return rec.storageKind === 'opfs-copy'
          ? `Copied “${rec.label}” into browser storage (${formatSize(rec.sizeBytes)}). It stays available after restarts until you remove it or clear site data.`
          : `Added “${rec.label}” for this session. You will need to select the files again after closing the browser.`;
      } finally {
        setProgress('');
      }
    });

  return (
    <>
      <h2>Emulator (offline package)</h2>
      <p>
        <StateBadge state={pkg} />{' '}
        {pkg === 'OFFLINE_READY' ? 'The PS1 player works without a connection.' : 'Download the player once to use it offline (about 3 MB).'}
      </p>
      <p className="actions">
        {(pkg === 'NOT_INSTALLED' || pkg === 'UPDATE_AVAILABLE' || pkg === 'OFFLINE_UNAVAILABLE') && (
          <button disabled={!online || progress !== ''} onClick={() => run(async () => {
            await installEmulatorPackage((d, t) => setProgress(`Downloading ${d}/${t}`));
            setProgress('');
            return 'The PS1 player is now available offline.';
          })}>
            {pkg === 'UPDATE_AVAILABLE' ? 'Update offline package' : 'Make available offline'}
          </button>
        )}
        {pkg === 'OFFLINE_READY' && <button onClick={() => run(async () => { await removeEmulatorPackage(); return 'Offline package removed.'; })}>Remove offline package</button>}
        {progress && <span role="status"> {progress}</span>}
      </p>

      <h2>Your discs</h2>
      {message && <p className={`notice notice--${message.kind === 'ok' ? 'ok' : 'error'}`} role={message.kind === 'error' ? 'alert' : 'status'}>{message.text}</p>}
      {discs.length === 0 ? <p>No discs yet. Add one of your own disc images below.</p> : (
        <ul className="discs">
          {discs.map(({ rec, state }) => (
            <li key={rec.discId} className="disc">
              <div>
                <strong>{rec.label}</strong> <StateBadge state={state} />
                <div className="meta">{STORAGE_LABEL[rec.storageKind]} · {rec.fileNames.length} file{rec.fileNames.length === 1 ? '' : 's'} · {formatSize(rec.sizeBytes)}</div>
              </div>
              <div className="actions">
                {state === 'OFFLINE_READY' && <button className="button--primary" onClick={() => navigate(`/play/${game.id}/${rec.discId}`)}>Play</button>}
                {state === 'NEEDS_PERMISSION' && <button onClick={() => run(async () => ((await requestAccess(rec)) === 'OFFLINE_READY' ? 'Access allowed.' : 'Access was not allowed.'))}>Allow access</button>}
                {state === 'AWAITING_USER_ROM' && (
                  <label className="button">
                    Select files again
                    <input type="file" multiple hidden accept={accepted.join(',')} onChange={(e) => {
                      const files = [...(e.target.files ?? [])];
                      e.target.value = '';
                      void run(async () => { await reselectSessionFiles(rec, files); return 'Ready to play for this session.'; });
                    }} />
                  </label>
                )}
                <button className="button--danger" onClick={() => {
                  const what = rec.storageKind === 'opfs-copy' ? 'the copy of this disc in browser storage' : 'the link to this disc (your files are not touched)';
                  if (confirm(`Remove “${rec.label}”? This deletes ${what}. Memory cards and save states are kept — export them in Settings if you want a backup.`)) {
                    void run(async () => { await removeDisc(rec); return 'Disc removed.'; });
                  }
                }}>Remove</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <h3>Add a disc</h3>
      <p className="meta">Accepted: {accepted.join(' ')}. For a .cue or .m3u, select it together with every file it lists. Files never leave this device.</p>
      <p className="actions">
        <label>Name <input value={label} maxLength={60} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. My disc" /></label>
        {useUpload ? (
          <label className="button">
            Choose disc files…
            <input ref={uploadRef} data-testid="disc-upload" type="file" multiple hidden accept={accepted.join(',')} onChange={(e) => {
              const files = [...(e.target.files ?? [])];
              e.target.value = '';
              void linkFromUpload(files);
            }} />
          </label>
        ) : (
          <button onClick={() => void linkFromPicker()}>Choose disc files…</button>
        )}
      </p>
      {useUpload && caps.tier === 'tier-2' && (
        <p className="meta">
          {prefs.preferOpfsCopy ? 'Discs are copied into browser storage so they work after restarts (uses space equal to the disc size).' : 'Discs are used for this session only.'} Change this in Settings.
        </p>
      )}

      <h3>BIOS (optional)</h3>
      <p>
        Without a BIOS file the player uses its built-in replacement, which runs many discs. Some discs need a real BIOS dumped from
        your own console. Retro Arcade never provides BIOS files.
      </p>
      {bios ? (
        <p className="actions">
          <span>Using <code>{bios.fileName}</code> ({formatSize(bios.sizeBytes)}, SHA-256 {bios.sha256.slice(0, 12)}…)</span>
          <button className="button--danger" onClick={() => confirm('Remove the BIOS file from this browser?') && void run(async () => { await removeBios(); return 'BIOS removed.'; })}>Remove BIOS</button>
        </p>
      ) : (
        <label className="button">
          Import BIOS file…
          <input type="file" hidden accept=".bin" onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (f) void run(async () => { const b = await importBios(f); return `Imported ${b.fileName}.`; });
          }} />
        </label>
      )}
    </>
  );
}
