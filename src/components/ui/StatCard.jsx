import React from 'react';

function StatCard({ title, value, icon, color, alert, onClick }) {
  return (
    <div 
        onClick={onClick}
        className={`bg-white p-4 rounded-lg shadow-sm border border-slate-100 ${color} ${alert ? 'animate-pulse bg-red-50' : ''} ${onClick ? 'cursor-pointer hover:shadow-md transition-all active:scale-[0.98]' : ''}`}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-bold text-slate-800 mt-1">{value}</h3>
        </div>
        <div className="p-2 bg-slate-50 rounded-md">
          {icon}
        </div>
      </div>
    </div>
  );
}

export default StatCard;