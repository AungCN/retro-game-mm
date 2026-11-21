import { useApp } from '../app/AppContext';
import { href } from '../app/router';
import { CATALOGUE, isByor } from '../domain/games/registry';
import { StateBadge } from '../components/StateBadge';

export function CataloguePage() {
  const { caps } = useApp();
  return (
    <section className="page">
      <h1>Library</h1>
      <p className="lead">Original retro-style games, plus a player for your own PS1 discs. Everything runs in your browser and can work offline.</p>
      <ul className="cards">
        {CATALOGUE.map((g) => {
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
    </section>
  );
}
