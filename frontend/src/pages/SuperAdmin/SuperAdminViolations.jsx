import React, { useState, useEffect, useCallback } from 'react';
import {
  RiShieldCheckLine, RiAlertLine, RiCloseLine, RiCheckLine,
  RiUserLine, RiAddLine, RiRefreshLine, RiProhibitedLine,
  RiCheckboxCircleLine, RiFileTextLine, RiTimeLine, RiArrowRightLine,
} from 'react-icons/ri';
import { violationAPI, superAdminAPI } from '../../services/api';
import toast from 'react-hot-toast';

const SEV = {
  warning:  { label: 'Warning',  dot: 'bg-yellow-400', text: 'text-yellow-400', badge: 'bg-yellow-400/10 border-yellow-400/20 text-yellow-400' },
  severe:   { label: 'Severe',   dot: 'bg-orange-400', text: 'text-orange-400', badge: 'bg-orange-400/10 border-orange-400/20 text-orange-400' },
  critical: { label: 'Critical', dot: 'bg-red-400',    text: 'text-red-400',    badge: 'bg-red-400/10    border-red-400/20    text-red-400'    },
};
const STA = {
  active:    { label: 'Open',      badge: 'bg-red-400/10    border-red-400/20    text-red-400'    },
  resolved:  { label: 'Resolved',  badge: 'bg-green-400/10  border-green-400/20  text-green-400'  },
  dismissed: { label: 'Dismissed', badge: 'bg-slate-400/10  border-slate-400/20  text-slate-400'  },
};

const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  : '—';

const Badge = ({ cfg, label }) => (
  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.badge}`}>
    {label}
  </span>
);

const Spinner = () => (
  <div className="flex items-center justify-center py-24">
    <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

export default function SuperAdminViolations() {
  const [tab, setTab]             = useState('violations');
  const [violations, setViolations] = useState([]);
  const [blacklist, setBlacklist]   = useState([]);
  const [rules, setRules]           = useState([]);
  const [allUsers, setAllUsers]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [filters, setFilters]       = useState({ status: 'all', severity: 'all' });
  const [showCreate, setShowCreate] = useState(false);
  const [showResolve, setShowResolve] = useState(null);
  const [resolveNote, setResolveNote] = useState('');
  const [creating, setCreating]     = useState(false);
  const [newVio, setNewVio]         = useState({ userId:'', rule:'', description:'', severity:'warning' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [vR, bR, rR, uR] = await Promise.all([
        violationAPI.getAll(filters),
        violationAPI.getBlacklist(),
        violationAPI.getRules(),
        superAdminAPI.getAllUsers({ limit: 500 }),
      ]);
      setViolations(vR.data.data);
      setBlacklist(bR.data.data);
      setRules(rR.data.data);
      setAllUsers((uR.data.data || []).filter(u => u.role !== 'super_admin'));
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newVio.userId || !newVio.rule || !newVio.description.trim()) return toast.error('Please fill all fields');
    setCreating(true);
    try {
      await violationAPI.create(newVio);
      toast.success('Violation filed successfully. User has been notified.');
      setShowCreate(false);
      setNewVio({ userId:'', rule:'', description:'', severity:'warning' });
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to file violation'); }
    finally { setCreating(false); }
  };

  const handleResolve = async () => {
    try {
      await violationAPI.resolve(showResolve._id, { resolvedNote });
      toast.success('Violation resolved');
      setShowResolve(null); setResolveNote(''); load();
    } catch { toast.error('Failed to resolve'); }
  };

  const handleDismiss = async (id) => {
    if (!window.confirm('Dismiss this violation? This action cannot be undone.')) return;
    try { await violationAPI.dismiss(id); toast.success('Violation dismissed'); load(); }
    catch { toast.error('Failed to dismiss'); }
  };

  const handleUnban = async (userId) => {
    if (!window.confirm('Restore this account? The user will regain full access.')) return;
    try { await superAdminAPI.banUser(userId, { reason: 'Unbanned by super admin' }); toast.success('Account restored'); load(); }
    catch { toast.error('Failed to restore account'); }
  };

  const stats = [
    { label: 'Total',      value: violations.length,                                      accent: '#a78bfa' },
    { label: 'Open',       value: violations.filter(v=>v.status==='active').length,        accent: '#f87171' },
    { label: 'Resolved',   value: violations.filter(v=>v.status==='resolved').length,      accent: '#4ade80' },
    { label: 'Blacklisted',value: blacklist.length,                                        accent: '#fb923c' },
  ];

  return (
    <div className="space-y-6">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Rules Enforcement</h1>
          <p className="text-slate-500 text-sm mt-0.5">Review violations, manage warnings, and maintain platform integrity</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] transition-all">
            <RiRefreshLine className="text-base"/> Refresh
          </button>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all"
            style={{background:'linear-gradient(135deg,#7c3aed,#6d28d9)', boxShadow:'0 0 20px rgba(124,58,237,0.3)'}}>
            <RiAddLine className="text-base"/> File Violation
          </button>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(s => (
          <div key={s.label} className="rounded-2xl p-4" style={{background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)'}}>
            <p className="text-2xl font-black mb-0.5" style={{color:s.accent}}>{s.value}</p>
            <p className="text-slate-500 text-xs font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div className="flex items-center gap-0 rounded-xl overflow-hidden w-fit" style={{border:'1px solid rgba(255,255,255,0.08)', background:'rgba(255,255,255,0.03)'}}>
        {[
          { id:'violations', label:'Violations', icon:RiAlertLine },
          { id:'blacklist',  label:'Blacklist',  icon:RiProhibitedLine },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold transition-all ${
              tab === t.id
                ? 'text-white'
                : 'text-slate-500 hover:text-slate-300'
            }`}
            style={tab === t.id ? {background:'rgba(124,58,237,0.3)', borderRight:'1px solid rgba(124,58,237,0.3)'} : {}}>
            <t.icon className="text-base"/> {t.label}
            {t.id==='violations' && violations.filter(v=>v.status==='active').length > 0 && (
              <span className="w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center text-white"
                style={{background:'#ef4444'}}>
                {violations.filter(v=>v.status==='active').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Violations tab ── */}
      {tab === 'violations' && (
        <div className="space-y-4">
          {/* Filter bar */}
          <div className="flex items-center gap-3 flex-wrap">
            {['all','active','resolved','dismissed'].map(s => (
              <button key={s} onClick={() => setFilters(p=>({...p, status:s}))}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  filters.status===s
                    ? 'text-white bg-purple-600/40 border border-purple-500/40'
                    : 'text-slate-500 hover:text-white bg-white/[0.03] border border-white/[0.07] hover:border-white/[0.15]'
                }`}>
                {s === 'all' ? 'All Statuses' : s}
              </button>
            ))}
            <div className="w-px h-5 bg-white/10"/>
            {['all','warning','severe','critical'].map(s => (
              <button key={s} onClick={() => setFilters(p=>({...p, severity:s}))}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  filters.severity===s
                    ? 'text-white bg-purple-600/40 border border-purple-500/40'
                    : 'text-slate-500 hover:text-white bg-white/[0.03] border border-white/[0.07] hover:border-white/[0.15]'
                }`}>
                {s === 'all' ? 'All Severities' : s}
              </button>
            ))}
          </div>

          {loading ? <Spinner/> : violations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                style={{background:'rgba(74,222,128,0.08)', border:'1px solid rgba(74,222,128,0.15)'}}>
                <RiShieldCheckLine className="text-green-400 text-2xl"/>
              </div>
              <p className="text-white font-semibold text-base">No violations found</p>
              <p className="text-slate-500 text-sm mt-1">Platform is in good standing</p>
            </div>
          ) : (
            <div className="rounded-2xl overflow-hidden" style={{border:'1px solid rgba(255,255,255,0.07)'}}>
              {/* Table header */}
              <div className="grid grid-cols-12 gap-4 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-600"
                style={{background:'rgba(255,255,255,0.02)', borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
                <div className="col-span-3">User</div>
                <div className="col-span-3">Rule</div>
                <div className="col-span-2">Severity</div>
                <div className="col-span-1">Status</div>
                <div className="col-span-1">Date</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>
              {violations.map((v, i) => {
                const sev = SEV[v.severity] || SEV.warning;
                const sta = STA[v.status]   || STA.active;
                return (
                  <div key={v._id}
                    className="grid grid-cols-12 gap-4 px-5 py-4 items-center hover:bg-white/[0.02] transition-colors group"
                    style={{borderBottom: i < violations.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none'}}>
                    {/* User */}
                    <div className="col-span-3 flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
                        style={{background:'rgba(124,58,237,0.2)', border:'1px solid rgba(124,58,237,0.3)'}}>
                        {v.user?.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-white text-sm font-medium truncate">{v.user?.name || '—'}</p>
                        <p className="text-slate-500 text-xs truncate">{v.user?.email}</p>
                      </div>
                    </div>
                    {/* Rule */}
                    <div className="col-span-3 min-w-0">
                      <p className="text-slate-200 text-sm font-medium truncate">{v.rule}</p>
                      {v.description && <p className="text-slate-500 text-xs truncate mt-0.5">{v.description}</p>}
                    </div>
                    {/* Severity */}
                    <div className="col-span-2">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${sev.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sev.dot}`}/>
                        {sev.label}
                      </span>
                    </div>
                    {/* Status */}
                    <div className="col-span-1">
                      <span className={`px-2 py-0.5 rounded-md text-xs font-medium border ${sta.badge}`}>{sta.label}</span>
                    </div>
                    {/* Date */}
                    <div className="col-span-1">
                      <p className="text-slate-500 text-xs">{fmtDate(v.createdAt)}</p>
                    </div>
                    {/* Actions */}
                    <div className="col-span-2 flex items-center justify-end gap-2">
                      {v.status === 'active' && (
                        <>
                          <button onClick={() => { setShowResolve(v); setResolveNote(''); }}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-green-400 border border-green-400/20 bg-green-400/8 hover:bg-green-400/15 transition-colors flex items-center gap-1">
                            <RiCheckLine/> Resolve
                          </button>
                          <button onClick={() => handleDismiss(v._id)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-400 border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] transition-colors flex items-center gap-1">
                            <RiCloseLine/> Dismiss
                          </button>
                        </>
                      )}
                      {v.status !== 'active' && v.resolvedNote && (
                        <p className="text-slate-600 text-xs italic truncate max-w-[120px]" title={v.resolvedNote}>{v.resolvedNote}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Blacklist tab ── */}
      {tab === 'blacklist' && (
        loading ? <Spinner/> : blacklist.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{background:'rgba(74,222,128,0.08)', border:'1px solid rgba(74,222,128,0.15)'}}>
              <RiCheckboxCircleLine className="text-green-400 text-2xl"/>
            </div>
            <p className="text-white font-semibold">No blacklisted accounts</p>
            <p className="text-slate-500 text-sm mt-1">All accounts are in good standing</p>
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden" style={{border:'1px solid rgba(255,255,255,0.07)'}}>
            <div className="grid grid-cols-12 gap-4 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-600"
              style={{background:'rgba(255,255,255,0.02)', borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
              <div className="col-span-3">Account</div>
              <div className="col-span-2">Role</div>
              <div className="col-span-4">Violation Reason</div>
              <div className="col-span-1">Date</div>
              <div className="col-span-2 text-right">Action</div>
            </div>
            {blacklist.map((u, i) => (
              <div key={u._id}
                className="grid grid-cols-12 gap-4 px-5 py-4 items-center hover:bg-white/[0.02] transition-colors"
                style={{borderBottom: i < blacklist.length-1 ? '1px solid rgba(255,255,255,0.04)':'none'}}>
                {/* Account */}
                <div className="col-span-3 flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold text-red-400"
                    style={{background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)'}}>
                    {u.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white text-sm font-medium truncate">{u.name}</p>
                    <p className="text-slate-500 text-xs truncate">{u.email}</p>
                  </div>
                </div>
                {/* Role */}
                <div className="col-span-2">
                  <span className="px-2 py-0.5 rounded-md text-xs font-medium border border-white/10 bg-white/[0.04] text-slate-300 capitalize">{u.role}</span>
                </div>
                {/* Reason */}
                <div className="col-span-4 min-w-0">
                  {u.latestViolation ? (
                    <div>
                      <p className="text-slate-300 text-xs font-medium truncate">{u.latestViolation.rule}</p>
                      <p className="text-slate-500 text-xs truncate mt-0.5">{u.latestViolation.description}</p>
                    </div>
                  ) : (
                    <p className="text-slate-600 text-xs italic">No violation on file — manually banned</p>
                  )}
                </div>
                {/* Date */}
                <div className="col-span-1">
                  <p className="text-slate-500 text-xs">{fmtDate(u.latestViolation?.createdAt)}</p>
                </div>
                {/* Action */}
                <div className="col-span-2 flex justify-end">
                  <button onClick={() => handleUnban(u._id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-green-400 border border-green-400/20 bg-green-400/8 hover:bg-green-400/15 transition-colors">
                    <RiCheckboxCircleLine/> Restore
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ── File Violation Modal ── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
            style={{background:'#0d1424', border:'1px solid rgba(124,58,237,0.25)'}}>
            <div className="flex items-center justify-between px-6 py-4" style={{borderBottom:'1px solid rgba(255,255,255,0.07)'}}>
              <div>
                <h2 className="text-white font-bold text-base">File a Violation</h2>
                <p className="text-slate-500 text-xs mt-0.5">The user will be notified immediately</p>
              </div>
              <button onClick={() => setShowCreate(false)} className="text-slate-500 hover:text-white p-1 transition-colors"><RiCloseLine className="text-xl"/></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-1.5 tracking-wide">TARGET ACCOUNT</label>
                <select value={newVio.userId} onChange={e=>setNewVio(p=>({...p,userId:e.target.value}))} className="input w-full" required>
                  <option value="">Select user or admin...</option>
                  {allUsers.map(u => <option key={u._id} value={u._id}>{u.name} ({u.role}) — {u.email}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-1.5 tracking-wide">RULE VIOLATED</label>
                <select value={newVio.rule} onChange={e=>setNewVio(p=>({...p,rule:e.target.value}))} className="input w-full" required>
                  <option value="">Select a rule...</option>
                  {rules.map(r => <option key={r.id} value={r.title}>{r.id} — {r.title}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-1.5 tracking-wide">SEVERITY LEVEL</label>
                <div className="grid grid-cols-3 gap-2">
                  {['warning','severe','critical'].map(s => (
                    <button type="button" key={s} onClick={() => setNewVio(p=>({...p,severity:s}))}
                      className={`py-2.5 rounded-xl text-xs font-semibold capitalize border transition-all ${
                        newVio.severity===s
                          ? s==='warning' ? 'bg-yellow-400/15 border-yellow-400/40 text-yellow-400'
                          : s==='severe'  ? 'bg-orange-400/15 border-orange-400/40 text-orange-400'
                          :                 'bg-red-400/15    border-red-400/40    text-red-400'
                          : 'bg-white/[0.03] border-white/[0.08] text-slate-500 hover:text-white'
                      }`}>{s}</button>
                  ))}
                </div>
                {newVio.severity==='critical' && (
                  <p className="text-red-400 text-xs mt-2 flex items-center gap-1.5 bg-red-400/8 border border-red-400/20 rounded-lg px-3 py-2">
                    <RiAlertLine/> Critical violations immediately suspend the account
                  </p>
                )}
              </div>
              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-1.5 tracking-wide">DESCRIPTION & EVIDENCE</label>
                <textarea value={newVio.description} onChange={e=>setNewVio(p=>({...p,description:e.target.value}))}
                  rows={3} className="input w-full resize-none" placeholder="Describe the violation with specific details..." required maxLength={600}/>
                <p className="text-slate-600 text-xs mt-1 text-right">{newVio.description.length}/600</p>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-400 border border-white/10 hover:text-white hover:bg-white/5 transition-all">Cancel</button>
                <button type="submit" disabled={creating} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  style={{background:'linear-gradient(135deg,#7c3aed,#6d28d9)'}}>
                  {creating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <><RiAddLine/> File Violation</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Resolve Modal ── */}
      {showResolve && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
            style={{background:'#0d1424', border:'1px solid rgba(74,222,128,0.2)'}}>
            <div className="flex items-center justify-between px-6 py-4" style={{borderBottom:'1px solid rgba(255,255,255,0.07)'}}>
              <div>
                <h2 className="text-white font-bold text-base">Resolve Violation</h2>
                <p className="text-slate-500 text-xs mt-0.5">Mark as resolved and optionally add a note</p>
              </div>
              <button onClick={() => setShowResolve(null)} className="text-slate-500 hover:text-white p-1"><RiCloseLine className="text-xl"/></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="rounded-xl p-4 space-y-2" style={{background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)'}}>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">User</span>
                  <span className="text-white font-medium">{showResolve.user?.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Rule</span>
                  <span className="text-slate-200 text-right max-w-[200px]">{showResolve.rule}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Filed</span>
                  <span className="text-slate-400">{fmtDate(showResolve.createdAt)}</span>
                </div>
              </div>
              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-1.5 tracking-wide">RESOLUTION NOTE <span className="text-slate-600 font-normal normal-case">(optional)</span></label>
                <textarea value={resolveNote} onChange={e => setResolveNote(e.target.value)}
                  rows={3} className="input w-full resize-none" placeholder="e.g. User acknowledged the violation and agreed to comply..." maxLength={300}/>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowResolve(null)} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-400 border border-white/10 hover:text-white hover:bg-white/5 transition-all">Cancel</button>
                <button onClick={handleResolve} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all"
                  style={{background:'linear-gradient(135deg,#16a34a,#15803d)'}}>
                  <RiCheckLine/> Mark Resolved
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
