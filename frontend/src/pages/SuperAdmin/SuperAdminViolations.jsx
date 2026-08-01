import React, { useState, useEffect, useCallback } from 'react';
import {
  RiShieldCheckLine, RiAlertLine, RiErrorWarningLine,
  RiCloseLine, RiCheckLine, RiUserLine, RiGroupLine,
  RiAddLine, RiSearchLine, RiRefreshLine, RiFilterLine,
  RiProhibitedLine, RiCheckboxCircleLine, RiFileTextLine,
} from 'react-icons/ri';
import { violationAPI, superAdminAPI } from '../../services/api';
import toast from 'react-hot-toast';

const severityConfig = {
  warning:  { label: 'Warning',  color: 'text-yellow-400',  bg: 'bg-yellow-500/10 border-yellow-500/20' },
  severe:   { label: 'Severe',   color: 'text-orange-400',  bg: 'bg-orange-500/10 border-orange-500/20' },
  critical: { label: 'Critical', color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/20'       },
};
const statusConfig = {
  active:   { label: 'Active',   color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/20'       },
  resolved: { label: 'Resolved', color: 'text-green-400',   bg: 'bg-green-500/10 border-green-500/20'   },
  dismissed:{ label: 'Dismissed',color: 'text-dark-400',    bg: 'bg-dark-700/40 border-dark-600'        },
};

const tabs = [
  { id: 'violations', label: 'All Violations', icon: RiAlertLine      },
  { id: 'blacklist',  label: 'Blacklist',       icon: RiProhibitedLine },
];

export default function SuperAdminViolations() {
  const [activeTab, setActiveTab]     = useState('violations');
  const [violations, setViolations]   = useState([]);
  const [blacklist, setBlacklist]     = useState([]);
  const [rules, setRules]             = useState([]);
  const [allUsers, setAllUsers]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [filters, setFilters]         = useState({ status: 'all', severity: 'all' });
  const [showCreate, setShowCreate]   = useState(false);
  const [showResolve, setShowResolve] = useState(null); // violation obj
  const [resolveNote, setResolveNote] = useState('');
  const [creating, setCreating]       = useState(false);
  const [newVio, setNewVio]           = useState({ userId: '', rule: '', description: '', severity: 'warning' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [vRes, bRes, rRes, uRes] = await Promise.all([
        violationAPI.getAll(filters),
        violationAPI.getBlacklist(),
        violationAPI.getRules(),
        superAdminAPI.getAllUsers({ limit: 500 }),
      ]);
      setViolations(vRes.data.data);
      setBlacklist(bRes.data.data);
      setRules(rRes.data.data);
      setAllUsers((uRes.data.data || []).filter(u => u.role !== 'super_admin'));
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newVio.userId || !newVio.rule || !newVio.description.trim())
      return toast.error('Fill all fields');
    setCreating(true);
    try {
      await violationAPI.create(newVio);
      toast.success('Violation filed. User notified.');
      setShowCreate(false);
      setNewVio({ userId: '', rule: '', description: '', severity: 'warning' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setCreating(false); }
  };

  const handleResolve = async () => {
    try {
      await violationAPI.resolve(showResolve._id, { resolvedNote });
      toast.success('Violation resolved');
      setShowResolve(null);
      setResolveNote('');
      load();
    } catch { toast.error('Failed to resolve'); }
  };

  const handleDismiss = async (id) => {
    if (!window.confirm('Dismiss this violation?')) return;
    try {
      await violationAPI.dismiss(id);
      toast.success('Violation dismissed');
      load();
    } catch { toast.error('Failed'); }
  };

  const handleUnban = async (userId) => {
    if (!window.confirm('Unban this user?')) return;
    try {
      await superAdminAPI.banUser(userId, { reason: 'Unbanned by super admin' });
      toast.success('User unbanned');
      load();
    } catch { toast.error('Failed to unban'); }
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Rules Enforcement</h1>
          <p className="text-dark-400 text-sm mt-0.5">Manage violations, warnings, and blacklisted accounts</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="btn-secondary flex items-center gap-2 text-sm">
            <RiRefreshLine /> Refresh
          </button>
          <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2 text-sm">
            <RiAddLine /> File Violation
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Violations', value: violations.length, color: 'text-brand-400' },
          { label: 'Active',           value: violations.filter(v => v.status === 'active').length,   color: 'text-red-400' },
          { label: 'Resolved',         value: violations.filter(v => v.status === 'resolved').length, color: 'text-green-400' },
          { label: 'Blacklisted',      value: blacklist.length,  color: 'text-orange-400' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-dark-700 bg-dark-800/60 p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-dark-400 text-xs mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-dark-800/60 rounded-xl p-1 w-fit border border-dark-700">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === t.id ? 'bg-brand-600 text-white shadow' : 'text-dark-400 hover:text-white'
            }`}>
            <t.icon className="text-base" /> {t.label}
          </button>
        ))}
      </div>

      {/* Violations Tab */}
      {activeTab === 'violations' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <select value={filters.status} onChange={e => setFilters(p => ({ ...p, status: e.target.value }))}
              className="input text-sm py-2 pl-3 pr-8">
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="resolved">Resolved</option>
              <option value="dismissed">Dismissed</option>
            </select>
            <select value={filters.severity} onChange={e => setFilters(p => ({ ...p, severity: e.target.value }))}
              className="input text-sm py-2 pl-3 pr-8">
              <option value="all">All Severities</option>
              <option value="warning">Warning</option>
              <option value="severe">Severe</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : violations.length === 0 ? (
            <div className="text-center py-20 text-dark-500">
              <RiShieldCheckLine className="text-4xl mx-auto mb-3 text-green-500/40" />
              <p className="font-medium text-white">No violations found</p>
              <p className="text-sm mt-1">All clear — no rules have been broken</p>
            </div>
          ) : (
            <div className="space-y-3">
              {violations.map(v => {
                const sev = severityConfig[v.severity] || severityConfig.warning;
                const sta = statusConfig[v.status]     || statusConfig.active;
                return (
                  <div key={v._id} className="rounded-xl border border-dark-700 bg-dark-800/60 p-5 hover:border-dark-600 transition-all">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${sev.bg} ${sev.color}`}>{sev.label}</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${sta.bg} ${sta.color}`}>{sta.label}</span>
                          <span className="text-dark-500 text-xs">{fmtDate(v.createdAt)}</span>
                        </div>
                        <h3 className="text-white font-semibold text-sm">{v.rule}</h3>
                        <p className="text-dark-400 text-sm mt-1">{v.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-dark-500">
                          <span className="flex items-center gap-1">
                            <RiUserLine /> User: <span className="text-white">{v.user?.name || '—'}</span>
                            ({v.user?.email}) — <span className="capitalize text-brand-400">{v.user?.role}</span>
                          </span>
                          {v.reportedBy && (
                            <span>Filed by: <span className="text-white">{v.reportedBy.name}</span></span>
                          )}
                        </div>
                        {v.resolvedNote && (
                          <p className="text-green-400 text-xs mt-2 italic">Note: {v.resolvedNote}</p>
                        )}
                      </div>
                      {v.status === 'active' && (
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button onClick={() => { setShowResolve(v); setResolveNote(''); }}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs hover:bg-green-500/20 transition-colors">
                            <RiCheckLine /> Resolve
                          </button>
                          <button onClick={() => handleDismiss(v._id)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-dark-700/60 border border-dark-600 text-dark-400 text-xs hover:text-white hover:bg-dark-700 transition-colors">
                            <RiCloseLine /> Dismiss
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Blacklist Tab */}
      {activeTab === 'blacklist' && (
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : blacklist.length === 0 ? (
            <div className="text-center py-20 text-dark-500">
              <RiCheckboxCircleLine className="text-4xl mx-auto mb-3 text-green-500/40" />
              <p className="font-medium text-white">No blacklisted accounts</p>
              <p className="text-sm mt-1">All accounts are currently in good standing</p>
            </div>
          ) : (
            <div className="space-y-3">
              {blacklist.map(u => (
                <div key={u._id} className="rounded-xl border border-red-500/20 bg-red-500/5 p-5 hover:border-red-500/30 transition-all">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                        <RiProhibitedLine className="text-red-400 text-lg" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-white font-semibold">{u.name}</h3>
                          <span className="px-2 py-0.5 rounded-full bg-dark-700 text-dark-300 text-xs capitalize border border-dark-600">{u.role}</span>
                          <span className="px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 text-xs border border-red-500/20">Blacklisted</span>
                        </div>
                        <p className="text-dark-400 text-sm mt-0.5">{u.email}</p>
                        {u.latestViolation ? (
                          <div className="mt-2 px-3 py-2 rounded-lg bg-dark-800/60 border border-dark-700 text-xs space-y-0.5">
                            <p className="text-dark-300 font-medium">Violation: <span className="text-white">{u.latestViolation.rule}</span></p>
                            <p className="text-dark-400">{u.latestViolation.description}</p>
                            <p className="text-dark-500">Filed: {fmtDate(u.latestViolation.createdAt)}</p>
                          </div>
                        ) : (
                          <p className="text-dark-500 text-xs mt-1">Banned manually (no violation on file)</p>
                        )}
                      </div>
                    </div>
                    <button onClick={() => handleUnban(u._id)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm hover:bg-green-500/20 transition-colors flex-shrink-0">
                      <RiCheckboxCircleLine /> Unban
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Violation Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-dark-900 rounded-2xl border border-dark-700 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-dark-700">
              <h2 className="text-white font-bold text-lg flex items-center gap-2">
                <RiAlertLine className="text-orange-400" /> File a Violation
              </h2>
              <button onClick={() => setShowCreate(false)} className="text-dark-400 hover:text-white"><RiCloseLine className="text-xl" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-dark-300 text-sm font-medium mb-1.5">Target User / Admin</label>
                <select value={newVio.userId} onChange={e => setNewVio(p => ({ ...p, userId: e.target.value }))}
                  className="input w-full" required>
                  <option value="">Select account...</option>
                  {allUsers.map(u => (
                    <option key={u._id} value={u._id}>{u.name} ({u.email}) — {u.role}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-dark-300 text-sm font-medium mb-1.5">Rule Violated</label>
                <select value={newVio.rule} onChange={e => setNewVio(p => ({ ...p, rule: e.target.value }))}
                  className="input w-full" required>
                  <option value="">Select rule...</option>
                  {rules.map(r => <option key={r.id} value={r.title}>{r.id} — {r.title}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-dark-300 text-sm font-medium mb-1.5">Severity</label>
                <select value={newVio.severity} onChange={e => setNewVio(p => ({ ...p, severity: e.target.value }))}
                  className="input w-full">
                  <option value="warning">Warning — formal notice</option>
                  <option value="severe">Severe — risk of suspension</option>
                  <option value="critical">Critical — immediate blacklist</option>
                </select>
                {newVio.severity === 'critical' && (
                  <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                    <RiAlertLine /> Critical violations will immediately blacklist the user
                  </p>
                )}
              </div>
              <div>
                <label className="block text-dark-300 text-sm font-medium mb-1.5">Description / Evidence</label>
                <textarea value={newVio.description}
                  onChange={e => setNewVio(p => ({ ...p, description: e.target.value }))}
                  rows={3} className="input w-full resize-none"
                  placeholder="Describe the violation in detail..." required maxLength={600} />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={creating} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {creating ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <><RiAddLine /> File Violation</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resolve Modal */}
      {showResolve && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-dark-900 rounded-2xl border border-dark-700 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-dark-700">
              <h2 className="text-white font-bold text-lg flex items-center gap-2">
                <RiCheckLine className="text-green-400" /> Resolve Violation
              </h2>
              <button onClick={() => setShowResolve(null)} className="text-dark-400 hover:text-white"><RiCloseLine className="text-xl" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="rounded-xl bg-dark-800/60 border border-dark-700 p-4 text-sm space-y-1">
                <p className="text-dark-400">User: <span className="text-white">{showResolve.user?.name}</span></p>
                <p className="text-dark-400">Rule: <span className="text-white">{showResolve.rule}</span></p>
              </div>
              <div>
                <label className="block text-dark-300 text-sm font-medium mb-1.5">Resolution Note (optional)</label>
                <textarea value={resolveNote} onChange={e => setResolveNote(e.target.value)}
                  rows={3} className="input w-full resize-none"
                  placeholder="e.g. User acknowledged violation, warned not to repeat..." maxLength={300} />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowResolve(null)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={handleResolve} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  <RiCheckLine /> Mark Resolved
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
