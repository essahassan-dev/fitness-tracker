import React, { useState, useEffect } from 'react';
import { RiDeleteBinLine, RiShieldCheckLine, RiFilterLine, RiRefreshLine } from 'react-icons/ri';
import { superAdminAPI } from '../../../services/api';
import { SkeletonTable } from '../shared/SkeletonKPI';
import ConfirmDialog from '../shared/ConfirmDialog';
import StatusBadge from '../shared/StatusBadge';
import toast from 'react-hot-toast';

const SessionsTab = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [target, setTarget]     = useState(null);

  const load = async () => {
    setLoading(true);
    try { const r = await superAdminAPI.listSessions(); setSessions(r.data.data || []); }
    catch { toast.error('Failed to load sessions'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const forceLogout = async () => {
    try { await superAdminAPI.forceLogout(target); toast.success('Session terminated'); setTarget(null); load(); }
    catch { toast.error('Failed'); }
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleString() : '—';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold">Active Sessions</h3>
        <button onClick={load} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-slate-400 hover:text-white bg-white/[0.04] border border-white/[0.08] transition-all">
          <RiRefreshLine /> Refresh
        </button>
      </div>
      {loading ? <SkeletonTable rows={3} cols={4} /> : sessions.length === 0 ? (
        <p className="text-slate-500 text-sm text-center py-8">No active sessions found</p>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ border:'1px solid rgba(255,255,255,0.07)' }}>
          {sessions.map((s, i) => (
            <div key={s._id} className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors"
              style={{ borderBottom: i < sessions.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
              <div className="flex-1 grid grid-cols-4 gap-4 text-sm">
                <div><p className="text-slate-500 text-xs mb-0.5">Device</p><p className="text-white">{s.device || '—'}</p></div>
                <div><p className="text-slate-500 text-xs mb-0.5">Browser</p><p className="text-white">{s.browser || '—'}</p></div>
                <div><p className="text-slate-500 text-xs mb-0.5">IP</p><p className="text-slate-300">{s.ipAddress || '—'}</p></div>
                <div><p className="text-slate-500 text-xs mb-0.5">Last seen</p><p className="text-slate-300 text-xs">{fmtDate(s.lastSeenAt)}</p></div>
              </div>
              <button onClick={() => setTarget(s._id)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-red-400 border border-red-400/20 bg-red-400/8 hover:bg-red-400/15 transition-colors flex-shrink-0">
                <RiDeleteBinLine /> Force Logout
              </button>
            </div>
          ))}
        </div>
      )}
      <ConfirmDialog isOpen={!!target} onClose={() => setTarget(null)} onConfirm={forceLogout}
        title="Force Logout" confirmLabel="Force Logout"
        message="This will immediately invalidate the session. The user will need to log in again."
        confirmClassName="bg-red-500 hover:bg-red-600 text-white" />
    </div>
  );
};

const AuditLogTab = () => {
  const [logs, setLogs]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);
  const [pagination, setPagination] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const r = await superAdminAPI.listAuditLogs({ page, limit: 25 });
      setLogs(r.data.data || []);
      setPagination(r.data.pagination || {});
    } catch { toast.error('Failed to load audit logs'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page]);

  const fmtDate = (d) => d ? new Date(d).toLocaleString() : '—';

  return (
    <div className="space-y-4">
      <h3 className="text-white font-semibold">Audit Log</h3>
      {loading ? <SkeletonTable rows={8} cols={5} /> : (
        <div className="rounded-2xl overflow-hidden" style={{ border:'1px solid rgba(255,255,255,0.07)' }}>
          <div className="grid grid-cols-12 gap-3 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-600"
            style={{ background:'rgba(255,255,255,0.02)', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
            <div className="col-span-2">Action</div>
            <div className="col-span-2">Target</div>
            <div className="col-span-2">Entity</div>
            <div className="col-span-2">Outcome</div>
            <div className="col-span-2">IP</div>
            <div className="col-span-2">Time</div>
          </div>
          {logs.map((l, i) => (
            <div key={l._id} className="grid grid-cols-12 gap-3 px-5 py-3 items-center hover:bg-white/[0.02] transition-colors"
              style={{ borderBottom: i < logs.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
              <div className="col-span-2"><p className="text-slate-300 text-xs font-mono truncate">{l.actionType}</p></div>
              <div className="col-span-2"><p className="text-slate-400 text-xs truncate">{l.targetName || '—'}</p></div>
              <div className="col-span-2"><p className="text-slate-400 text-xs">{l.targetEntity}</p></div>
              <div className="col-span-2">
                <span className={`text-xs font-semibold ${l.outcome === 'success' ? 'text-green-400' : 'text-red-400'}`}>{l.outcome}</span>
              </div>
              <div className="col-span-2"><p className="text-slate-500 text-xs font-mono">{l.ipAddress || '—'}</p></div>
              <div className="col-span-2"><p className="text-slate-500 text-xs">{fmtDate(l.createdAt)}</p></div>
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
    </div>
  );
};

const SASecurityPage = () => {
  const [tab, setTab] = useState('sessions');
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <RiShieldCheckLine className="text-purple-400 text-xl" />
        <div>
          <h1 className="text-xl font-bold text-white">Security</h1>
          <p className="text-slate-500 text-sm mt-0.5">Sessions, audit logs and access controls</p>
        </div>
      </div>
      <div className="flex items-center gap-1 bg-white/[0.03] rounded-xl p-1 w-fit border border-white/[0.07]">
        {[{ id:'sessions', label:'Sessions' }, { id:'audit', label:'Audit Log' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab===t.id ? 'text-white bg-purple-600/40 border border-purple-500/40' : 'text-slate-500 hover:text-white'}`}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'sessions' ? <SessionsTab /> : <AuditLogTab />}
    </div>
  );
};

export default SASecurityPage;
