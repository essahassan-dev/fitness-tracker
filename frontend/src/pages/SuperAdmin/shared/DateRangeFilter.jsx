import React, { useState } from 'react';
import { RiCalendarLine, RiArrowDownSLine } from 'react-icons/ri';

const PRESETS = [
  { label: 'Last 7 days',   days: 7 },
  { label: 'Last 30 days',  days: 30 },
  { label: 'Last 90 days',  days: 90 },
  { label: 'Last 12 months',days: 365 },
  { label: 'All time',      days: null },
];

const DateRangeFilter = ({ onChange }) => {
  const [active, setActive] = useState('Last 30 days');

  const select = (preset) => {
    setActive(preset.label);
    if (!preset.days) { onChange({ from: null, to: null }); return; }
    const to   = new Date();
    const from = new Date(Date.now() - preset.days * 86400000);
    onChange({ from: from.toISOString(), to: to.toISOString() });
  };

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {PRESETS.map(p => (
        <button key={p.label} onClick={() => select(p)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            active === p.label
              ? 'bg-purple-600/40 border border-purple-500/40 text-white'
              : 'text-slate-500 hover:text-white bg-white/[0.03] border border-white/[0.07]'
          }`}>
          {p.label}
        </button>
      ))}
    </div>
  );
};

export default DateRangeFilter;
