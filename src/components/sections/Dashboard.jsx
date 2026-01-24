import React from 'react';
import { 
  AlertTriangle, 
  Package, 
  FileText, 
  Plus, 
  Search, 
  ArrowRight, 
  Clock, 
  Calendar,
  Box,
  FlaskConical,
  Activity,
  Check
} from 'lucide-react';
import Card from '../ui/Card';
import { formatDate } from '../../utils/dateUtils';

const StatWidget = ({ title, value, icon: Icon, color, onClick, subtext }) => (
  <div 
    onClick={onClick}
    className={`bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden`}
  >
    <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity`}>
        <Icon size={64} className={`text-${color}-600`} />
    </div>
    <div className="flex items-center gap-4">
      <div className={`p-3 rounded-lg bg-${color}-50 text-${color}-600`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-slate-500 text-sm font-medium uppercase tracking-wide">{title}</p>
        <h3 className="text-3xl font-bold text-slate-800">{value}</h3>
      </div>
    </div>
    {subtext && <p className="mt-4 text-xs text-slate-400 font-medium flex items-center gap-1">
      {subtext}
    </p>}
  </div>
);

const ActionButton = ({ label, icon: Icon, onClick, color = "teal" }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center gap-2 p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-${color}-300 hover:bg-${color}-50 transition-all group w-full h-full`}
  >
    <div className={`p-3 rounded-full bg-slate-50 text-slate-600 group-hover:bg-white group-hover:text-${color}-600 transition-colors`}>
      <Icon size={24} />
    </div>
    <span className="text-sm font-bold text-slate-700 group-hover:text-${color}-700">{label}</span>
  </button>
);

const Dashboard = ({ inventory, preparations, setActiveTab, setInventoryFilter, setPreparationLogFilter, onNewPreparation, onOpenAddModal, user }) => {
  const today = new Date();
  
  // 1. Scadenze e Scaduti (inclusi nel widget)
  const expiringItems = inventory.filter(item => {
    if (!item.expiry || item.disposed) return false;
    const expiryDate = new Date(item.expiry);
    const diffTime = expiryDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 60; // Include scaduti (negativi) e prossimi 60gg
  }).sort((a, b) => new Date(a.expiry) - new Date(b.expiry));

  const lowStockItems = inventory.filter(item => {
    return !item.disposed && parseFloat(item.quantity) <= parseFloat(item.minStock || 0);
  });

  const activeDrafts = preparations.filter(p => p.status === 'Bozza');
  const recentPreps = preparations.slice(0, 5);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header (Senza Data) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Bentornato, {user?.username || 'Farmacista'} 👋
          </h1>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatWidget 
          title="Scadenze / Scaduti" 
          value={expiringItems.length} 
          icon={Clock} 
          color="amber" 
          onClick={() => { setInventoryFilter('expiring'); setActiveTab('inventory'); }}
          subtext={expiringItems.length > 0 ? "Controllare magazzino" : "Tutto in ordine"}
        />
        <StatWidget 
          title="Sotto Scorta" 
          value={lowStockItems.length} 
          icon={AlertTriangle} 
          color="red" 
          onClick={() => { setInventoryFilter('lowStock'); setActiveTab('inventory'); }}
          subtext="Da riordinare"
        />
        <StatWidget 
          title="Bozze Aperte" 
          value={activeDrafts.length} 
          icon={FileText} 
          color="blue" 
          onClick={() => { setPreparationLogFilter('Bozza'); setActiveTab('preparations_log'); }}
          subtext="Da completare"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <ActionButton label="Nuova Magistrale" icon={FlaskConical} onClick={() => onNewPreparation('magistrale')} color="teal" />
        <ActionButton label="Nuova Officinale" icon={Box} onClick={() => onNewPreparation('officinale')} color="indigo" />
        <ActionButton label="Carico Sostanza" icon={Package} onClick={() => onOpenAddModal('substance')} color="emerald" />
        <ActionButton label="Carico Contenitore" icon={Box} onClick={() => onOpenAddModal('container')} color="blue" />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Scadenze Imminenti + Scaduti */}
        <Card className="flex flex-col h-full border-t-4 border-t-amber-400 shadow-md">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm uppercase tracking-wider">
              <Clock size={18} className="text-amber-500"/> Scadenze e Scaduti
            </h3>
            <button onClick={() => setActiveTab('inventory')} className="text-[10px] text-slate-400 hover:text-slate-600 font-bold uppercase">Vedi Tutte</button>
          </div>
          <div className="p-0 flex-1 overflow-hidden">
            {expiringItems.length > 0 ? (
              <div className="divide-y divide-slate-50">
                {expiringItems.slice(0, 6).map(item => {
                  const isExpired = new Date(item.expiry) < new Date();
                  return (
                  <div key={item.id} className={`p-3 flex items-center justify-between hover:bg-slate-50 transition-colors ${isExpired ? 'bg-red-50/30' : ''}`}>
                    <div className="min-w-0 flex-1">
                      <p className={`font-bold text-xs truncate ${isExpired ? 'text-red-700' : 'text-slate-700'}`}>{item.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">Lotto: {item.lot || 'N/D'}</p>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${isExpired ? 'text-red-600 bg-white border-red-200' : 'text-amber-600 bg-amber-50 border-amber-100'}`}>
                        {isExpired ? 'SCADUTO' : formatDate(item.expiry)}
                      </span>
                    </div>
                  </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
                <Check size={32} className="text-green-200" />
                Nessuna scadenza.
              </div>
            )}
          </div>
        </Card>

        {/* Ultime Preparazioni */}
        <Card className="flex flex-col h-full border-t-4 border-t-teal-500 shadow-md">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm uppercase tracking-wider">
              <Activity size={18} className="text-teal-500"/> Ultime Attività
            </h3>
            <button onClick={() => setActiveTab('preparations_log')} className="text-[10px] text-slate-400 hover:text-slate-600 font-bold uppercase">Registro</button>
          </div>
          <div className="p-0 flex-1 overflow-hidden">
            {recentPreps.length > 0 ? (
              <div className="divide-y divide-slate-50">
                {recentPreps.map(prep => (
                  <div key={prep.id} className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${prep.status === 'Bozza' ? 'bg-slate-100 text-slate-500' : 'bg-teal-100 text-teal-600'}`}>
                        {prep.status === 'Bozza' ? 'B' : 'P'}
                      </div>
                      <div className="truncate">
                        <p className="font-bold text-xs text-slate-700 group-hover:text-teal-700 transition-colors truncate">
                          <span className="text-slate-400 mr-1">{prep.prepNumber === 'TEMP' ? '#' : prep.prepNumber}</span> 
                          {prep.name}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="text-[10px] text-slate-400 font-mono">{formatDate(prep.date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-sm">
                Nessuna preparazione.
              </div>
            )}
          </div>
        </Card>

      </div>
    </div>
  );
};

export default Dashboard;
