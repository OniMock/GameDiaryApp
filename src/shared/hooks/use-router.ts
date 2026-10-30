import { useState, useEffect, useCallback } from 'react';
import { getCleanPathname } from '../../i18n/utils/routing';

export type AppRoute = 'home' | 'stats' | 'download' | 'tools' | 'tools/game_sessions' | 'tools/db_merge' | 'tools/data_management';

function getRouteFromLocation(): AppRoute {
  if (typeof window === 'undefined') return 'home';

  const cleanPath = getCleanPathname(window.location.pathname);
  const hash = window.location.hash;

  if (cleanPath === '/stats' || hash === '#stats') {
    return 'stats';
  }
  if (cleanPath === '/download' || hash === '#download') {
    return 'download';
  }
  if (
    cleanPath === '/tools/game_sessions' || 
    cleanPath === '/tools/game-sessions' || 
    hash === '#tools/game_sessions'
  ) {
    return 'tools/game_sessions';
  }
  if (
    cleanPath === '/tools/db_merge' || 
    cleanPath === '/tools/db-merge' || 
    hash === '#tools/db_merge'
  ) {
    return 'tools/db_merge';
  }
  if (
    cleanPath === '/tools/data_management' ||
    cleanPath === '/tools/data-management' ||
    hash === '#tools/data_management'
  ) {
    return 'tools/data_management';
  }
  if (cleanPath === '/tools' || hash === '#tools') {
    return 'tools';
  }

  return 'home';
}

const NAVIGATION_EVENT = 'gamediary_navigate';

export function navigateTo(to: string) {
  if (typeof window === 'undefined') return;

  if (window.location.pathname + window.location.hash !== to) {
    window.history.pushState(null, '', to);
    window.dispatchEvent(new Event(NAVIGATION_EVENT));
  }
}

export function useAppRouter() {
  const [route, setRoute] = useState<AppRoute>(() => getRouteFromLocation());
  const [pathname, setPathname] = useState<string>(() => 
    typeof window !== 'undefined' ? window.location.pathname : '/'
  );
  const [hash, setHash] = useState<string>(() => 
    typeof window !== 'undefined' ? window.location.hash : ''
  );

  const syncState = useCallback(() => {
    setRoute(getRouteFromLocation());
    setPathname(window.location.pathname);
    setHash(window.location.hash);
  }, []);

  useEffect(() => {
    window.addEventListener('popstate', syncState);
    window.addEventListener('hashchange', syncState);
    window.addEventListener(NAVIGATION_EVENT, syncState);

    return () => {
      window.removeEventListener('popstate', syncState);
      window.removeEventListener('hashchange', syncState);
      window.removeEventListener(NAVIGATION_EVENT, syncState);
    };
  }, [syncState]);

  return {
    route,
    pathname,
    hash,
    cleanPath: getCleanPathname(pathname),
    navigate: navigateTo,
  };
}

/**
 * Backward compatibility hook for existing components using useHashRouter
 */
export function useHashRouter(): string {
  const { route, hash } = useAppRouter();

  if (route === 'download') return '#download';
  if (route === 'tools/game_sessions') return '#tools/game_sessions';
  if (route === 'tools/db_merge') return '#tools/db_merge';
  if (route === 'tools/data_management') return '#tools/data_management';
  if (route === 'tools') return '#tools';
  if (hash === '#support') return '#support';
  return '#home';
}
