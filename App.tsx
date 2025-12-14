import React, { useState, useEffect } from 'react';
import { StoreFront } from './components/StoreFront';
import { AdminPanel } from './components/AdminPanel';
import { ViewMode } from './types';

const App: React.FC = () => {
  const [view, setView] = useState<ViewMode>(ViewMode.CUSTOMER);

  // Simple hash router implementation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === '/admin') {
        setView(ViewMode.ADMIN);
      } else {
        setView(ViewMode.CUSTOMER);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Check initial hash

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return (
    <div className="min-h-screen transition-colors duration-300">
      {view === ViewMode.ADMIN ? <AdminPanel /> : <StoreFront />}
      
      {/* View Switcher Button */}
      <div className="fixed bottom-6 left-6 z-50">
        <button
          onClick={() => {
            window.location.hash = view === ViewMode.CUSTOMER ? '/admin' : '/';
          }}
          className="bg-lime-400 hover:bg-lime-300 text-black font-bold text-xs px-4 py-2 rounded-full shadow-[0_0_15px_rgba(163,230,53,0.3)] transition transform hover:scale-105 active:scale-95 border border-lime-300"
        >
          Switch to {view === ViewMode.CUSTOMER ? 'Admin Panel' : 'Store Front'}
        </button>
      </div>
    </div>
  );
};

export default App;