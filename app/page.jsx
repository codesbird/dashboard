'use client';

import { useState, useEffect, useCallback } from 'react';
import Dashboard from '../src/App.jsx';
import VillasDashboard from '../src/VillasDashboard.jsx';

export default function Page() {
  const [view, setView] = useState('financial');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'villas') setView('villas');
    setReady(true);

    const onPop = () => {
      const p = new URLSearchParams(window.location.search);
      setView(p.get('view') === 'villas' ? 'villas' : 'financial');
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const handleViewChange = useCallback((newView) => {
    setView(newView);
    const params = new URLSearchParams(window.location.search);
    params.set('view', newView);
    window.history.replaceState({}, '', `?${params.toString()}`);
  }, []);

  if (!ready) return null;

  if (view === 'villas') return <VillasDashboard onViewChange={handleViewChange} />;
  return <Dashboard onViewChange={handleViewChange} />;
}
