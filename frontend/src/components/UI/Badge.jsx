import React from 'react';

const Badge = ({ children, color = 'default', size = 'sm' }) => {
  const colors = {
    default: 'bg-dark-700 text-dark-300',
    green: 'bg-brand-500/10 text-brand-400',
    blue: 'bg-blue-500/10 text-blue-400',
    orange: 'bg-orange-500/10 text-orange-400',
    purple: 'bg-purple-500/10 text-purple-400',
    red: 'bg-red-500/10 text-red-400',
    yellow: 'bg-yellow-500/10 text-yellow-400',
  };

  const sizes = {
    xs: 'px-1.5 py-0.5 text-xs',
    sm: 'px-2.5 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  return (
    <span className={`badge ${colors[color]} ${sizes[size]} font-medium`}>
      {children}
    </span>
  );
};

export default Badge;
