import React from 'react';
import { Package, AlertTriangle, Trash2, History } from 'lucide-react';
import StatCard from '../ui/StatCard';
import Card from '../ui/Card';
import Badge from '../ui/Badge';

const Dashboard = ({ stats, logs, inventory, setActiveTab, setInventoryFilter, handleDispose }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Totale Sostanze" value={stats.totalItems} icon={<Package className="text-blue-500" />} color="border-l-4 border-blue-500" onClick={() => { setInventoryFilter('all'); setActiveTab('inventory'); }} />
        <StatCard title="In Scadenza (<30gg)" value={stats.expiringSoon} icon={<AlertTriangle className="text-amber-500" />} color="border-l-4 border-amber-500" alert={stats.expiringSoon > 0} onClick={() => { setInventoryFilter('expiring'); setActiveTab('inventory'); }} />
        <StatCard title="Scadute (Attive)" value={stats.expired} icon={<Trash2 className="text-red-500" />} color="border-l-4 border-red-500" alert={stats.expired > 0} onClick={() => { setInventoryFilter('expired'); setActiveTab('inventory'); }} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5"><h3 className="font-bold text-lg mb-4 flex items-center gap-2"><History size={18} /> Ultime Movimentazioni</h3><div className="space-y-3">{logs.slice(0, 5).map(log => (<div key={log.id} className="flex justify-between items-center text-sm border-b border-slate-100 pb-2 last:border-0"><div><div className="font-medium">{log.substance}</div><div className="text-slate-500 text-xs">{log.date} - Lotto: {log.ni}</div></div><div className="text-right"><Badge type={log.type === 'CARICO' ? 'success' : 'warning'}>{log.type === 'CARICO' ? '+' : '-'}{log.quantity} {log.unit}</Badge></div></div>))}</div></Card>
        <Card className="p-5"><h3 className="font-bold text-lg mb-4 flex items-center gap-2"><AlertTriangle size={18} className="text-amber-600" /> Avvisi Critici</h3><div className="space-y-3">{inventory.filter(i => {
          const days = (new Date(i.expiry) - new Date()) / 86400000;
          return !i.disposed && ((days <= 30 && days > 0) || i.quantity === 0 || new Date(i.expiry) < new Date());
        }).map(item => {
          const isTerminated = item.quantity === 0;
          const isExpired = new Date(item.expiry) < new Date();
          const isExpiring = !isExpired && !isTerminated;

          if (isTerminated) return (<div key={item.id} className="bg-slate-100 p-3 rounded-md border border-slate-200 flex justify-between items-center"><div><span className="font-bold text-slate-700">TERMINATA:</span> <span className="text-slate-600">{item.name}</span><div className="text-xs text-slate-500">Lotto: {item.lot} - Giacenza esaurita</div></div><button onClick={() => handleDispose(item.id)} className="text-xs bg-white border border-slate-300 text-slate-600 px-2 py-1 rounded hover:bg-slate-50">Smaltisci</button></div>);

          if (isExpired) return (<div key={item.id} className="bg-red-50 p-3 rounded-md border border-red-100 flex justify-between items-center"><div><span className="font-bold text-red-800">SCADUTA:</span> <span className="text-red-900">{item.name}</span><div className="text-xs text-red-700">Lotto: {item.lot} - Scaduta il {item.expiry}</div></div><button onClick={() => handleDispose(item.id)} className="text-xs bg-white border border-red-200 text-red-600 px-2 py-1 rounded hover:bg-red-50">Smaltisci</button></div>);

          if (isExpiring) return (<div key={item.id} className="bg-amber-50 p-3 rounded-md border border-amber-100 flex justify-between items-center"><div><span className="font-bold text-amber-800">IN SCADENZA:</span> <span className="text-amber-900">{item.name}</span><div className="text-xs text-amber-700">Lotto: {item.lot} - Scadenza {item.expiry}</div></div></div>);

          return null;
        })}</div></Card>
      </div>
    </div>
  );
};

export default Dashboard;
