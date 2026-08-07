import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { RiSearchLine, RiCloseLine, RiBuildingLine, RiUserLine, RiMoneyDollarCircleLine } from 'react-icons/ri';
import { useSuperAdmin } from '../../../context/SuperAdminContext';
import api from '../../../services/api';

const GlobalSearchModal = () => {
  const { searchOpen, closeSearch, searchQuery, setSearchQuery } = useSuperAdmin();
  const [results, setResults] = useState({ businesses: [], users: [], payments: [] });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => { if (searchOpen) setTimeout(() => inputRef.current?.focus(), 50); }, [searchOpen]);

  useEffect(() => {
    if (!searchQuery.trim()) { setResults({ businesses: [], users: [], payments: [] }); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const [bRes, uRes] = await Promise.all([
          api.get('/super-admin/businesses', { params: { search: searchQuery, limit: 5 } }),
          api.get('/super-admin/users',      { params: { search: searchQuery, limit: 5 } }),
        ]);
        setResults({ businesses: bRes.data.data || [], users: uRes.data.data || [], payments: [] });
      } catch { /* ignore */ }
      finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  if (!searchOpen) return null;

  const go = (path) => { closeSearch(); navigate(path); };

  const total = results.businesses.length + results.users.length + results.payments.length;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4 bg-black/70 backdrop-blur-sm"
      onClick={closeSearch}>
      <div className="w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: '#0d1424', border: '1px solid rgba(255,255,255,0.12)' }}
        onClick={e => e.stopPropagation()}>
        {/* Input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
          <RiSearchLine className="text-slate-400 text-lg flex-shrink-0" />
          <input ref={inputRef} value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search businesses, users, payments..."
            className="flex-1 bg-transparent text-white text-base outline-none placeholder-slate-600" />
          {loading && <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />}
          <button onClick={closeSearch} className="text-slate-500 hover:text-white transition-colors">
            <RiCloseLine className="text-xl" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto p-2">
          {!searchQuery.trim() && (
            <p className="text-slate-600 text-sm text-center py-8">Start typing to search across businesses, users and payments</p>
          )}
          {searchQuery.trim() && !loading && total === 0 && (
            <p className="text-slate-600 text-sm text-center py-8">No results for "{searchQuery}"</p>
          )}

          {results.businesses.length > 0 && (
            <div className="mb-2">
              <p className="text-slate-600 text-xs font-semibold uppercase tracking-wider px-3 py-2">Businesses</p>
              {results.businesses.map(b => (
                <button key={b._id} onClick={() => go(`/super-admin/businesses/${b._id}`)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors text-left">
                  <RiBuildingLine className="text-purple-400 text-base flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-white text-sm font-medium truncate">{b.name}</p>
                    <p className="text-slate-500 text-xs truncate">{b.adminUser?.email}</p>
                  </div>
                  <span className={`ml-auto text-xs px-2 py-0.5 rounded-full border capitalize flex-shrink-0 ${
                    b.status === 'active' ? 'bg-green-400/10 border-green-400/20 text-green-400' : 'bg-slate-400/10 border-slate-400/20 text-slate-400'
                  }`}>{b.status}</span>
                </button>
              ))}
            </div>
          )}

          {results.users.length > 0 && (
            <div>
              <p className="text-slate-600 text-xs font-semibold uppercase tracking-wider px-3 py-2">Users</p>
              {results.users.map(u => (
                <button key={u._id} onClick={() => go(`/super-admin/users`)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors text-left">
                  <RiUserLine className="text-blue-400 text-base flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-white text-sm font-medium truncate">{u.name}</p>
                    <p className="text-slate-500 text-xs truncate">{u.email}</p>
                  </div>
                  <span className="ml-auto text-xs text-slate-500 capitalize flex-shrink-0">{u.role}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="px-5 py-2.5 border-t border-white/5 flex items-center gap-4">
          <span className="text-slate-600 text-xs">Press <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400 font-mono text-xs">Esc</kbd> to close</span>
        </div>
      </div>
    </div>
  );
};

export default GlobalSearchModal;
