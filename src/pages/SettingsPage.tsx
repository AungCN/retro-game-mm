import { useEffect, useState } from 'react';
import { useApp } from '../app/AppContext';
import { CATALOGUE } from '../domain/games/registry';
import { applyImport, exportSaves, planImport, type ImportPlan } from '../platform/storage/backup';

export function SettingsPage() {
  const { prefs, setPrefs, caps, refreshCaps } = useApp();
  const [usage, setUsage] = useState('');
  const [msg, setMsg] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [plan, setPlan] = useState<ImportPlan | null>(null);

  const refreshUsage = async () => {
    try {
      const e = await navigator.storage.estimate();
      setUsage(`${((e.usage ?? 0) / 1e6).toFixed(1)} MB used of about ${((e.quota ?? 0) / 1e9).toFixed(1)} GB available to this site`);
    } catch {
      setUsage('Storage usage is not available in this browser.');
    }
  };
  useEffect(() => {
    void refreshUsage();
  }, []);

  const doExport = async () => {
    try {
      const { blob, count } = await exportSaves();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `retro-arcade-saves-${new Date().toISOString().slice(0, 10)}.zip`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
      setMsg({ kind: 'ok', text: `Exported ${count} save item${count === 1 ? '' : 's'}. BIOS files and discs are never included.` });
    } catch (e) {
      setMsg({ kind: 'error', text: e instanceof Error ? e.message : 'Export failed' });
    }
  };

  return (
    <section className="page">
      <h1>Settings</h1>

      <h2>Sound</h2>
      <label className="check"><input type="checkbox" checked={prefs.muted} onChange={(e) => setPrefs({ ...prefs, muted: e.target.checked })} /> Start games muted</label>

      <h2>PS1 discs</h2>
      <label className="check">
        <input type="checkbox" checked={prefs.preferOpfsCopy} onChange={(e) => setPrefs({ ...prefs, preferOpfsCopy: e.target.checked })} />
        When a disc is added by upload, copy it into browser storage so it works after restarts (uses space equal to the disc size)
      </label>
      <label className="check">
        <input type="checkbox" checked={prefs.forceUploadMode} onChange={(e) => setPrefs({ ...prefs, forceUploadMode: e.target.checked })} />
        Add discs by upload instead of linking files from disk
      </label>
      <p className="meta">Browser: {caps ? `${caps.tier === 'tier-1' ? 'Tier 1 (file linking available)' : caps.tier === 'tier-2' ? 'Tier 2 (upload)' : 'mobile (PS1 player not supported yet)'} · cross-origin isolated: ${caps.crossOriginIsolated ? 'yes' : 'no'} · persistent storage: ${String(caps.persistentStorage)}` : 'checking…'}</p>

      <h2>Storage</h2>
      <p>{usage}</p>
      <p className="actions">
        <button onClick={() => void navigator.storage.persist?.().then((granted) => {
          setMsg({ kind: granted ? 'ok' : 'error', text: granted ? 'This browser will keep your data unless you clear it.' : 'The browser did not grant persistent storage. Export your saves regularly.' });
          refreshCaps();
        })}>Ask the browser to keep my data</button>
      </p>
      <p className="meta">Clearing this site's data in your browser deletes saves, memory cards, imported BIOS files, and copied discs.</p>

      <h2>Save backups</h2>
      <p>Export memory cards, save states, and game saves to a .zip file, or restore them from one.</p>
      {msg && <p className={`notice notice--${msg.kind}`} role={msg.kind === 'error' ? 'alert' : 'status'}>{msg.text}</p>}
      <p className="actions">
        <button onClick={() => void doExport()}>Export saves</button>
        <label className="button">
          Import saves…
          <input type="file" hidden accept=".zip,application/zip" onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (!f) return;
            planImport(f, CATALOGUE.map((g) => g.id))
              .then((p) => { setPlan(p); setMsg(null); })
              .catch((err: unknown) => setMsg({ kind: 'error', text: err instanceof Error ? err.message : 'Import failed' }));
          }} />
        </label>
      </p>
      {plan && (
        <div className="notice notice--warn" role="status">
          This backup contains {plan.blobs.length} memory card/save-state item(s) and {plan.saves.length} game save(s). Importing replaces items with the same names.{' '}
          <button className="button--primary" onClick={() => void applyImport(plan).then((n) => { setPlan(null); setMsg({ kind: 'ok', text: `Imported ${n} item(s).` }); })}>Import</button>{' '}
          <button onClick={() => setPlan(null)}>Cancel</button>
        </div>
      )}
    </section>
  );
}
