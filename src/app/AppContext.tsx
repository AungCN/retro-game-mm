import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { CapabilityReport } from '../game-runtime/contracts/types';
import { detectCapabilities } from '../platform/capabilities/detect';
import { onConnectivity } from '../platform/offline/offline';
import { DEFAULT_PREFS, loadPrefs, savePrefs, type Preferences } from '../platform/storage/prefs';

interface AppState {
  caps: CapabilityReport | null;
  online: boolean;
  prefs: Preferences;
  setPrefs(p: Preferences): void;
  refreshCaps(): void;
}

const Ctx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [caps, setCaps] = useState<CapabilityReport | null>(null);
  const [online, setOnline] = useState(navigator.onLine);
  const [prefs, setPrefsState] = useState<Preferences>(DEFAULT_PREFS);

  const refreshCaps = () => void detectCapabilities().then(setCaps);
  useEffect(() => {
    refreshCaps();
    void loadPrefs().then(setPrefsState);
    return onConnectivity(setOnline);
  }, []);

  const setPrefs = (p: Preferences) => {
    setPrefsState(p);
    void savePrefs(p).catch(() => undefined);
  };

  return <Ctx.Provider value={{ caps, online, prefs, setPrefs, refreshCaps }}>{children}</Ctx.Provider>;
}

export function useApp(): AppState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp outside AppProvider');
  return v;
}
