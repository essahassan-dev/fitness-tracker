import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RiShieldCheckLine, RiAlertLine, RiErrorWarningLine,
  RiFileTextLine, RiCheckboxCircleLine, RiSendPlaneLine,
  RiCloseLine, RiGroupLine, RiUserLine, RiArrowLeftLine,
} from 'react-icons/ri';
import { violationAPI, adminAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const severityConfig = {
  warning:  { label: 'Warning',  color: 'text-yellow-400',  bg: 'bg-yellow-500/10 border-yellow-500/20', dot: 'bg-yellow-400' },
  severe:   { label: 'Severe',   color: 'text-orange-400',  bg: 'bg-orange-500/10 border-orange-500/20', dot: 'bg-orange-400' },
  critical: { label: 'Critical', color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/20',       dot: 'bg-red-400'    },
};

const Rules = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rules, setRules]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showReport, setShowReport] = useState(false);
  const [users, setUsers]           = useState([]);
  const [form, setForm] = useState({ targetUserId: '', rule: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  // Back destination by role
  const backPath = user?.role === 'admin' ? '/admin'
    : user?.role === 'trainer' ? '/trainer'
    : user?.role === 'super_admin' ? '/super-admin'
    : '/dashboard';

  useEffect(() => {
    violationAPI.getRules()
      .then(r => setRules(r.data.data))
      .catch(() => toast.error('Failed to load rules'))
      .finally(() => setLoading(false));
  }, []);

  const openReport = async () => {
    setShowReport(true);
    if (users.length === 0) {
      try {
        const res = await adminAPI.getUsers({ limit: 200 });
        setUsers((res.data.data || []).filter(u => u._id !== user._id && u.role !== 'super_admin'));
      } catch { /* ignore */ }
    }
  };

  const handleReport = async (e) => {
    e.preventDefault();
    if (!form.targetUserId || !form.rule || !form.description.trim())
      return toast.error('Fill in all fields');
    setSubmitting(true);
    try {
      await violationAPI.report(form);
      toast.success('Report submitted. Super admin has been notified.');
      setShowReport(false);
      setForm({ targetUserId: '', rule: '', description: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit report');
    } finally { setSubmitting(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-dark-950">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Top bar */}
      <div className="sticky top-0 z-20 bg-dark-900/90 backdrop-blur-sm border-b border-dark-800 px-4 sm:px-6 py-3 flex items-center gap-3">
        <button onClick={() => navigate(backPath)}
          className="flex items-center gap-2 text-dark-400 hover:text-white transition-colors text-sm">
          <RiArrowLeftLine className="text-base" /> Back
        </button>
        <div className="h-4 w-px bg-dark-700" />
        <div className="flex items-center gap-2">
          <RiShieldCheckLine className="text-brand-400 text-base" />
          <span className="text-white font-semibold text-sm">Rules & Regulations</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6 pb-12">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-dark-700 p-6"
        style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(15,23,42,0.9))' }}>
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #3b82f6 1px, transparent 0)', backgroundSize: '24px 24px' }} />
        <div className="relative flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
            <RiShieldCheckLine className="text-white text-2xl" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white mb-1">Rules & Regulations</h1>
            <p className="text-dark-400 text-sm leading-relaxed">
              FitStack is committed to a safe and fair environment for all members.
              These rules apply to every user, trainer, and admin on the platform.
              Violations may result in warnings, temporary suspension, or permanent blacklisting.
            </p>
          </div>
        </div>
        {/* Note: does not apply to super admin shown subtly */}
        {user?.role !== 'super_admin' && (
          <div className="relative mt-4 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500/10 border border-brand-500/20">
            <RiCheckboxCircleLine className="text-brand-400 text-lg flex-shrink-0" />
            <p className="text-brand-300 text-xs">
              By using FitStack you agree to abide by these rules. Violations are reviewed by our platform owner.
            </p>
          </div>
        )}
      </div>

      {/* Rules grid */}
      <div className="space-y-3">
        {rules.map((rule, i) => {
          const sev = severityConfig[rule.severity] || severityConfig.warning;
          return (
            <div key={rule.id}
              className="group relative overflow-hidden rounded-xl border border-dark-700 bg-dark-800/60 hover:border-dark-600 transition-all duration-200 p-5">
              <div className="flex items-start gap-4">
                {/* Rule number */}
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-dark-700/80 border border-dark-600">
                  <span className="text-brand-400 text-sm font-bold">{rule.id}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap mb-1.5">
                    <h3 className="text-white font-semibold text-base">{rule.title}</h3>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${sev.bg} ${sev.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${sev.dot}`} />
                      {sev.label}
                    </span>
                  </div>
                  <p className="text-dark-400 text-sm leading-relaxed">{rule.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Severity legend */}
      <div className="rounded-xl border border-dark-700 bg-dark-800/40 p-5">
        <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
          <RiAlertLine className="text-yellow-400 text-base" />
          Violation Severity Guide
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {Object.entries(severityConfig).map(([key, cfg]) => (
            <div key={key} className={`rounded-lg border p-3 ${cfg.bg}`}>
              <div className={`font-semibold text-sm ${cfg.color} mb-1`}>{cfg.label}</div>
              <p className="text-dark-400 text-xs">
                {key === 'warning'  && 'First-time or minor violations. Formal notice issued.'}
                {key === 'severe'   && 'Repeated or significant violations. Account may be suspended.'}
                {key === 'critical' && 'Serious offences. Account is immediately blacklisted.'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Report a violation CTA — not shown to super admin */}
      {user?.role !== 'super_admin' && (
        <div className="rounded-xl border border-dark-700 bg-dark-800/40 p-5 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <RiErrorWarningLine className="text-orange-400 text-xl flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-white font-semibold text-sm">Witness a Violation?</h3>
              <p className="text-dark-400 text-xs mt-0.5">
                If you believe another user, trainer, or admin has broken these rules, you can report it.
                The platform owner will be notified immediately.
              </p>
            </div>
          </div>
          <button onClick={openReport}
            className="btn-primary flex items-center gap-2 text-sm whitespace-nowrap">
            <RiSendPlaneLine /> Report Violation
          </button>
        </div>
      )}

      {/* Report Modal */}
      {showReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-dark-900 rounded-2xl border border-dark-700 shadow-2xl overflow-hidden animate-modal-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-dark-700">
              <h2 className="text-white font-bold text-lg">Report a Violation</h2>
              <button onClick={() => setShowReport(false)} className="text-dark-400 hover:text-white transition-colors">
                <RiCloseLine className="text-xl" />
              </button>
            </div>
            <form onSubmit={handleReport} className="p-6 space-y-4">
              {/* Target user */}
              <div>
                <label className="block text-dark-300 text-sm font-medium mb-1.5">
                  <RiUserLine className="inline mr-1" />Who broke the rules?
                </label>
                <select value={form.targetUserId} onChange={e => setForm(p => ({ ...p, targetUserId: e.target.value }))}
                  className="input w-full" required>
                  <option value="">Select user...</option>
                  {users.map(u => (
                    <option key={u._id} value={u._id}>
                      {u.name} ({u.email}) — {u.role}
                    </option>
                  ))}
                </select>
              </div>
              {/* Rule violated */}
              <div>
                <label className="block text-dark-300 text-sm font-medium mb-1.5">
                  <RiFileTextLine className="inline mr-1" />Which rule was violated?
                </label>
                <select value={form.rule} onChange={e => setForm(p => ({ ...p, rule: e.target.value }))}
                  className="input w-full" required>
                  <option value="">Select rule...</option>
                  {rules.map(r => (
                    <option key={r.id} value={r.title}>{r.id} — {r.title}</option>
                  ))}
                </select>
              </div>
              {/* Description */}
              <div>
                <label className="block text-dark-300 text-sm font-medium mb-1.5">Details / Evidence</label>
                <textarea value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  rows={3} className="input w-full resize-none"
                  placeholder="Describe what happened..."
                  required maxLength={500} />
                <p className="text-dark-500 text-xs mt-1 text-right">{form.description.length}/500</p>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowReport(false)}
                  className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {submitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <><RiSendPlaneLine /> Submit Report</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </div>
  );
};

export default Rules;
