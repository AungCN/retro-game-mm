import { useEffect, useState } from 'react';
import { AppProvider, useApp } from './AppContext';
import { href, useRoute } from './router';
import { CataloguePage } from '../pages/CataloguePage';
import { GameDetailPage } from '../pages/GameDetailPage';
import { PlayerPage } from '../pages/PlayerPage';
import { SettingsPage } from '../pages/SettingsPage';
import { AboutPage } from '../pages/AboutPage';
import { applyUpdate, onUpdateAvailable } from '../platform/offline/offline';

function Shell() {
  const route = useRoute();
  const { online } = useApp();
  const [update, setUpdate] = useState(false);
  useEffect(() => onUpdateAvailable((w) => setUpdate(w !== null)), []);
  useEffect(() => {
    document.getElementById('main')?.focus({ preventScroll: true });
  }, [route]);

  const playing = route.name === 'play';
  return (
    <div className={playing ? 'app app--playing' : 'app'}>
      <button type="button" className="skip-link" onClick={() => document.getElementById('main')?.focus()}>
        Skip to content
      </button>
      {!playing && (
        <header className="topbar">
          <a className="brand" href={href('/')}>Retro Arcade</a>
          <nav aria-label="Main">
            <a href={href('/')} aria-current={route.name === 'catalogue' ? 'page' : undefined}>Library</a>
            <a href={href('/settings')} aria-current={route.name === 'settings' ? 'page' : undefined}>Settings</a>
            <a href={href('/about')} aria-current={route.name === 'about' ? 'page' : undefined}>About</a>
          </nav>
          <span className={online ? 'pill pill--ok' : 'pill pill--warn'} role="status">
            {online ? 'Online' : 'Offline'}
          </span>
        </header>
      )}
      {update && !playing && (
        <div className="banner" role="status">
          A new version is ready. <button onClick={applyUpdate}>Update now</button>
        </div>
      )}
      <main id="main" tabIndex={-1}>
        {route.name === 'catalogue' && <CataloguePage />}
        {route.name === 'game' && <GameDetailPage id={route.id} />}
        {route.name === 'play' && <PlayerPage id={route.id} discId={route.discId} />}
        {route.name === 'settings' && <SettingsPage />}
        {route.name === 'about' && <AboutPage />}
        {route.name === 'not-found' && (
          <section className="page">
            <h1>Page not found</h1>
            <p><a href={href('/')}>Back to the library</a></p>
          </section>
        )}
      </main>
    </div>
  );
}

export function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
