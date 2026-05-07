import React from 'react';

const StatCard = ({ icon: Icon, label, value, unit, trend, color = 'brand', subtitle }) => {
  const colorMap = {
    brand: { bg: 'bg-brand-500/10', text: 'text-brand-400', border: 'border-brand-500/20' },
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
    orange: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
    purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
    red: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
    yellow: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20' },
  };

  const c = colorMap[color] || colorMap.brand;

  return (
    <div className="stat-card group">
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 ${c.bg} border ${c.border} rounded-xl flex items-center justify-center flex-shrink-0`}>
          {Icon && <Icon className={`text-lg ${c.text}`} />}
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${trend >= 0 ? 'text-brand-400 bg-brand-500/10' : 'text-red-400 bg-red-500/10'}`}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <div className="mt-3">
        <p className="text-dark-400 text-xs font-medium uppercase tracking-wide">{label}</p>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-2xl font-bold text-white">{value ?? '—'}</span>
          {unit && <span className="text-dark-400 text-sm">{unit}</span>}
        </div>
        {subtitle && <p className="text-dark-500 text-xs mt-1">{subtitle}</p>}
      </div>
    </div>
  );
};

export default StatCard;
