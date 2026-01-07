import React from 'react';

const Badge = ({ children, type = 'info' }) => {
  const colors = {
    info: 'bg-blue-100 text-blue-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-amber-100 text-amber-800',
    danger: 'bg-red-100 text-red-800',
    neutral: 'bg-slate-100 text-slate-800',
    dark: 'bg-slate-200 text-slate-600',
    magic: 'bg-purple-100 text-purple-800 border border-purple-200'
  };
  const colorClass = colors[type] || colors['neutral'];
  return <span className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${colorClass}`}>{children}</span>;
};

export default Badge;
