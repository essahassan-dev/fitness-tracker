import React from 'react';

export const SkeletonKPI = () => (
  <div className="rounded-2xl p-5 animate-pulse" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
    <div className="h-3 w-24 rounded-full bg-white/10 mb-3" />
    <div className="h-8 w-16 rounded-lg bg-white/10 mb-2" />
    <div className="h-3 w-20 rounded-full bg-white/10" />
  </div>
);

export const SkeletonTable = ({ rows = 5, cols = 4 }) => (
  <div className="space-y-2 animate-pulse">
    {[...Array(rows)].map((_, i) => (
      <div key={i} className="flex gap-4 px-5 py-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)' }}>
        {[...Array(cols)].map((_, j) => (
          <div key={j} className="h-4 flex-1 rounded-full bg-white/10" style={{ flexGrow: j === 0 ? 2 : 1 }} />
        ))}
      </div>
    ))}
  </div>
);

export default SkeletonKPI;
