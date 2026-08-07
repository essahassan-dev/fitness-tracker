import React, { createContext, useContext, useState, useCallback } from 'react';

const SuperAdminContext = createContext(null);

export const SuperAdminProvider = ({ children }) => {
  const [searchQuery,  setSearchQuery]  = useState('');
  const [searchOpen,   setSearchOpen]   = useState(false);
  const [notifCount,   setNotifCount]   = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const openSearch  = useCallback(() => setSearchOpen(true),  []);
  const closeSearch = useCallback(() => { setSearchOpen(false); setSearchQuery(''); }, []);

  // Keyboard shortcut: Ctrl+K / Cmd+K
  React.useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(s => !s);
      }
      if (e.key === 'Escape') setSearchOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <SuperAdminContext.Provider value={{
      searchQuery, setSearchQuery,
      searchOpen, openSearch, closeSearch,
      notifCount, setNotifCount,
      sidebarCollapsed, setSidebarCollapsed,
    }}>
      {children}
    </SuperAdminContext.Provider>
  );
};

export const useSuperAdmin = () => {
  const ctx = useContext(SuperAdminContext);
  if (!ctx) throw new Error('useSuperAdmin must be used within SuperAdminProvider');
  return ctx;
};
