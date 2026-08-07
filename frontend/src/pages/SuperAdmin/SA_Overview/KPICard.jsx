import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const useCountUp = (target, duration = 1200) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!target) { setVal(0); return; }
    let start = null;
    const num = Number(target);
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setVal(Math.floor(p * num));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return val;
};

const KPICard = ({ label, value, prefix = '', suffix = '', accent = '#a78bfa', link, trend, loading, error }) => {
  const count = useCountUp(loading ? 0 : Number(value) || 0);
  const navigate = useNavigate();

  if (loading) return (
    <div className="rounded-2xl p-5 animate-pulse" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="h-3 w-20 rounded-full bg-white/10 mb-3" />
      <div className="h-8 w-14 rounded-lg bg-white/10 mb-2" />
      <div className="h-3 w-16 rounded-full bg-white/10" />
    </div>
  );

  if (error) return (
    <div className="rounded-2xl p-5" style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)' }}>
      <p className="text-slate-500 text-xs mb-1">{label}</p>
      <p className="text-red-400 text-sm">Failed to load</p>
    </div>
  );

  return (
    <div onClick={link ? () => navigate(link) : undefined}
      className={`rounded-2xl p-5 transition-all ${link ? 'cursor-pointer hover:scale-[1.02]' : ''}`}
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <p className="text-slate-500 text-xs font-medium mb-2">{label}</p>
      <p className="text-2xl font-black mb-1" style={{ color: accent }}>
        {prefix}{typeof value === 'number' || !isNaN(value) ? count.toLocaleString() : value}{suffix}
      </p>
      {trend !== undefined && (
        <div className="flex items-center gap-1">
          <span className={`text-xs font-semibold ${trend > 0 ? 'text-green-400' : trend < 0 ? 'text-red-400' : 'text-slate-500'}`}>
            {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'} {Math.abs(trend)}%
          </span>
          <span className="text-slate-600 text-xs">vs last period</span>
        </div>
      )}
    </div>
  );
};

export default KPICard;
