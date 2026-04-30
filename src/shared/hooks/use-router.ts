import { useState, useEffect } from 'react';

export function useHashRouter() {
  const [hash, setHash] = useState(() => window.location.hash || '#home');

  useEffect(() => {
    const handleHashChange = () => {
      setHash(window.location.hash || '#home');
    };
    
    // Set initial if empty
    if (!window.location.hash) {
      window.history.replaceState(null, '', '#home');
      setHash('#home');
    }

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return hash;
}
