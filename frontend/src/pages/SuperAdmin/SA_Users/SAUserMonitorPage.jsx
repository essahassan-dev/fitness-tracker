import React, { useState, useEffect, useCallback } from 'react';
import { RiSearchLine, RiEyeLine, RiCloseLine, RiUserLine, RiRefreshLine } from 'react-icons/ri';
import { superAdminAPI } from '../../../services/api';
import StatusBadge from '../shared/StatusBadge';
import { SkeletonTable } from '../shared/SkeletonKPI';
import toast from 'react-hot-toast';

const UserDetailDrawer = ({ user, onClose }) => {
  if (!user) return null;
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString() : '—';
  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="w-full max-w-sm h-full overflow-y-auto shadow-2xl"
        style={{ background:'#0d1424', borderLeft:'1px solid rgba(255,255,255,0.1)' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 sticky top-0" style={{ background:'#0d1424' }}>
          <h2 className="text-white font-bold">User Profile</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><RiCloseLine className="text-xl" /></button>
        </div>
        <div className="p-5 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg"
              style={{ background:'rgba(96,165,250,0.2)', border:'1px solid rgba(96,165,250,0.3)' }}>
              {user.name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <p className="text-white font-bold">{user.name}</p>
              <p className="text-slate-400 text-xs">{user.email}</p>
            </div>
          </div>
          <div className="space-y-2.5">
            {[
              ['Role',       user.role],
              ['Status',     user.isActive ? 'Active' : 'Inactive'],
              ['Subscription', user.subscription?.type || 'FREE'],
              ['Joined',     fmtDate(user.createdAt)],
              ['Last Updated', fmtDate(user.updatedAt)],
            ].map(([k,v]) => (
              <div key={k} className="flex justify-between py-2 border-b border-white/5">
                <span className="text-slate-500 text-sm">{k}</span>
                <span className="text-slate-200 text-sm capitalize">{v}</span>
              </div>
            ))}
          </div>
          <div className="rounded-xl p-3 text-xs text-slate-500 text-center"
            style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)' }}>
            Read-only view — user data cannot be modified from here
          </div>
        </div>
      </div>
    </div>
  );
};

const SAUserMonitorPage = () => {
  const [users, setUsers]       = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [role, setRole]         = useState('all');
  const [page, setPage]         = useState(1);
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await superAdminAPI.getAllUsers({ page, limit: 20, search, role });
      setUsers(r.data.data || []);
      setPagination(r.data.pagination || {});
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  }, [page, search, role]);

  useEffect(() => { load(); }, [load]);

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString() : '—';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">User Monitoring</h1>
          <p className="text-slate-500 text-sm mt-0.5">Read-only view of all platform users — {pagination.total || 0} total</p>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-slate-400 hover:text-white bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] transition-all">
          <RiRefreshLine /> Refresh
        </button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <RiSearchLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name or email..."
            className="w-full pl-9 pr-4 py-2 rounded-xl text-sm text-white placeholder-slate-600 outline-none bg-white/[0.04] border border-white/[0.08] focus:border-purple-500/40" />
        </div>
        {['all','user','trainer','admin'].map(r => (
          <button key={r} onClick={() => { setRole(r); setPage(1); }}
            className={`px-3 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${role===r ? 'bg-purple-600/40 border border-purple-500/40 text-white' : 'text-slate-500 hover:text-white bg-white/[0.03] border border-white/[0.07]'}`}>
            {r}
          </button>
        ))}
      </div>

      {loading ? <SkeletonTable rows={8} cols={5} /> : (
        <div className="rounded-2xl overflow-hidden" style={{ border:'1px solid rgba(255,255,255,0.07)' }}>
          <div className="grid grid-cols-12 gap-3 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-600"
            style={{ background:'rgba(255,255,255,0.02)', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
            <div className="col-span-4">User</div>
            <div className="col-span-2">Role</div>
            <div className="col-span-2">Plan</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-1">Joined</div>
            <div className="col-span-1 text-right">View</div>
          </div>
          {users.length === 0 ? (
            <div className="text-center py-16 text-slate-500"><p className="font-medium text-white">No users found</p></div>
          ) : users.map((u, i) => (
            <div key={u._id} className="grid grid-cols-12 gap-3 px-5 py-3.5 items-center hover:bg-white/[0.02] transition-colors"
              style={{ borderBottom: i < users.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
              <div className="col-span-4 flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
                  style={{ background:'rgba(96,165,250,0.15)', border:'1px solid rgba(96,165,250,0.25)' }}>
                  {u.name?.charAt(0)?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-white text-sm font-medium truncate">{u.name}</p>
                  <p className="text-slate-500 text-xs truncate">{u.email}</p>
                </div>
              </div>
              <div className="col-span-2"><span className="text-slate-300 text-sm capitalize">{u.role}</span></div>
              <div className="col-span-2"><span className="text-slate-400 text-sm">{u.subscription?.type || 'FREE'}</span></div>
              <div className="col-span-2"><StatusBadge status={u.isActive ? 'active' : 'suspended'} /></div>
              <div className="col-span-1"><span className="text-slate-500 text-xs">{fmtDate(u.createdAt)}</span></div>
              <div className="col-span-1 flex justify-end">
                <button onClick={() => setSelected(u)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                  <RiEyeLine />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1} className="px-3 py-1.5 rounded-lg text-sm text-slate-400 border border-white/10 hover:text-white hover:bg-white/5 disabled:opacity-40">Prev</button>
          <span className="text-slate-500 text-sm">Page {page} of {pagination.pages}</span>
          <button onClick={() => setPage(p => Math.min(pagination.pages,p+1))} disabled={page===pagination.pages} className="px-3 py-1.5 rounded-lg text-sm text-slate-400 border border-white/10 hover:text-white hover:bg-white/5 disabled:opacity-40">Next</button>
        </div>
      )}

      <UserDetailDrawer user={selected} onClose={() => setSelected(null)} />
    </div>
  );
};

export default SAUserMonitorPage;
