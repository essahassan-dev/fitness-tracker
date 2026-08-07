import React from 'react';

const CONFIGS = {
  active:         { label: 'Active',         cls: 'bg-green-400/10 border-green-400/20 text-green-400' },
  suspended:      { label: 'Suspended',      cls: 'bg-red-400/10 border-red-400/20 text-red-400' },
  trial:          { label: 'Trial',          cls: 'bg-blue-400/10 border-blue-400/20 text-blue-400' },
  expired:        { label: 'Expired',        cls: 'bg-slate-400/10 border-slate-400/20 text-slate-400' },
  deleted:        { label: 'Deleted',        cls: 'bg-slate-600/10 border-slate-600/20 text-slate-600' },
  pending:        { label: 'Pending',        cls: 'bg-yellow-400/10 border-yellow-400/20 text-yellow-400' },
  approved:       { label: 'Approved',       cls: 'bg-green-400/10 border-green-400/20 text-green-400' },
  rejected:       { label: 'Rejected',       cls: 'bg-red-400/10 border-red-400/20 text-red-400' },
  'info-requested':{ label: 'Info Needed',   cls: 'bg-purple-400/10 border-purple-400/20 text-purple-400' },
  completed:      { label: 'Completed',      cls: 'bg-green-400/10 border-green-400/20 text-green-400' },
  failed:         { label: 'Failed',         cls: 'bg-red-400/10 border-red-400/20 text-red-400' },
  refunded:       { label: 'Refunded',       cls: 'bg-orange-400/10 border-orange-400/20 text-orange-400' },
  enabled:        { label: 'Enabled',        cls: 'bg-green-400/10 border-green-400/20 text-green-400' },
  disabled:       { label: 'Disabled',       cls: 'bg-slate-400/10 border-slate-400/20 text-slate-400' },
};

const StatusBadge = ({ status, label: overrideLabel, className = '' }) => {
  const key = (status || '').toLowerCase();
  const cfg = CONFIGS[key] || { label: status, cls: 'bg-slate-400/10 border-slate-400/20 text-slate-400' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.cls} ${className}`}>
      {overrideLabel || cfg.label}
    </span>
  );
};

export default StatusBadge;
