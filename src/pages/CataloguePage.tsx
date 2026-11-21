import { useMemo, useState } from 'react';
import { useApp } from '../app/AppContext';
import { href } from '../app/router';
import { CATALOGUE, isByor } from '../domain/games/registry';
import { StateBadge } from '../components/StateBadge';

const GENRES = ['all', ...Array.from(new Set(CATALOGUE.map((g) => g.genre)))];

export function CataloguePage() {
  const { caps } = useApp();
  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState('all');

  const games = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CATALOGUE.filter((g) => (genre === 'all' || g.genre === genre) && (!q || `${g.title} ${g.description} ${g.genre}`.toLowerCase().includes(q)));
  }, [query, genre]);

  return (
    <section className="page">
      <h1>Library</h1>
      <p className="lead">Original retro-style games, classic board games, and a player for your own PS1 discs. Everything runs in your browser and can work offline.</p>
      <div className="filters">
        <label>
          Search <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find a game" maxLength={60} />
        </label>
        <div role="group" aria-label="Filter by type" className="chips">
          {GENRES.map((g) => (
            <button key={g} type="button" aria-pressed={genre === g} onClick={() => setGenre(g)}>
              {g === 'all' ? 'All' : g[0]!.toUpperCase() + g.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <p className="meta" role="status">{games.length} game{games.length === 1 ? '' : 's'}</p>
      <ul className="cards">
        {games.map((g) => {
          const unsupported = isByor(g) && caps !== null && !g.hardwareRequirements?.browserTiers.includes(caps.tier);
          return (
            <li key={g.id} className="card">
              <div className={`card__art card__art--${g.id}`} aria-hidden="true" />
              <h2><a href={href(`/game/${g.id}`)}>{g.title}</a></h2>
              <p>{g.description}</p>
              <p className="meta">
                {g.genre} · {isByor(g) ? 'Bring your own disc' : 'Included'}{' '}
                {unsupported ? <StateBadge state="UNSUPPORTED" /> : !isByor(g) && <StateBadge state="OFFLINE_READY" label="Works offline" />}
              </p>
            </li>
          );
        })}
      </ul>
      {games.length === 0 && <p>No games match. <button type="button" onClick={() => { setQuery(''); setGenre('all'); }}>Clear filters</button></p>}
    </section>
  );
}
