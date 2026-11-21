import { useEffect, useState } from 'react';

export type Route =
  | { name: 'catalogue' }
  | { name: 'game'; id: string }
  | { name: 'play'; id: string; discId?: string }
  | { name: 'settings' }
  | { name: 'about' }
  | { name: 'not-found' };

const ID = '[a-z0-9]+(?:-[a-z0-9]+)*';
const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';

/** Parses the hash path. Every parameter is matched against a strict pattern; anything else is "not found". */
export function parseRoute(hash: string): Route {
  const path = hash.replace(/^#/, '') || '/';
  let m: RegExpExecArray | null;
  if (path === '/' || path === '') return { name: 'catalogue' };
  if (path === '/settings') return { name: 'settings' };
  if (path === '/about') return { name: 'about' };
  if ((m = new RegExp(`^/game/(${ID})$`).exec(path))) return { name: 'game', id: m[1]! };
  if ((m = new RegExp(`^/play/(${ID})$`).exec(path))) return { name: 'play', id: m[1]! };
  if ((m = new RegExp(`^/play/(${ID})/(${UUID})$`).exec(path))) return { name: 'play', id: m[1]!, discId: m[2]! };
  return { name: 'not-found' };
}

export const href = (path: string) => `#${path}`;

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseRoute(location.hash));
  useEffect(() => {
    const on = () => setRoute(parseRoute(location.hash));
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

export function navigate(path: string) {
  location.hash = path;
}
