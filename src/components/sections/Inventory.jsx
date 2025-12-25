import React, { useState } from 'react';
import { Search, Plus, X, Filter, Package, Archive, Pencil, Trash2, ArrowUp, ArrowDown, FlaskConical, Box } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';

const Inventory = ({
  inventoryFilter,
  setInventoryFilter,
  searchTerm,
  setSearchTerm,
  sortedActiveInventory,
  sortedDisposedInventory,
  handleOpenAddModal,
  handleOpenEditModal,
  handleOpenViewModal,
  handleDispose,
  sortConfig,
  requestSort,
  activeSubstanceFilter,
  clearSubstanceFilter,
}) => {
  const [showAddMenu, setShowAddMenu] = useState(false);

  const activeSubstances = sortedActiveInventory.filter(item => !item.isContainer);
  const activeContainers = sortedActiveInventory.filter(item => item.isContainer);

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return null;
    return sortConfig.direction === 'asc' ? <ArrowUp size={14} className="inline ml-1" /> : <ArrowDown size={14} className="inline ml-1" />;
  };

  const SortableHeader = ({ label, columnKey, className = "" }) => (
    <th
      className={`px-6 py-4 font-semibold cursor-pointer select-none hover:bg-slate-100 transition-colors ${className}`}
      onClick={() => requestSort(columnKey)}
    >
      <div className="flex items-center gap-1">
        {label}
        <SortIcon columnKey={columnKey} />
      </div>
    </th>
  );

  const InventoryTable = ({ data, type }) => (
    <Card>
      <div className="overflow-auto" style={{ maxHeight: '60vh' }}>
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 z-10 bg-slate-50 text-slate-600 border-b border-slate-200">
            <tr>
              <SortableHeader label={type === 'container' ? "Contenitore" : "Sostanza"} columnKey="name" />
              <SortableHeader label="N.I." columnKey="ni" />
              <SortableHeader label="Scadenza" columnKey="expiry" />
              <SortableHeader label="Fornitore" columnKey="supplier" />
              <SortableHeader label="Giacenza" columnKey="quantity" className="text-right" />
              <SortableHeader label={type === 'container' ? "Costo Unit." : "€/g"} columnKey="costPerGram" className="text-right" />
              <SortableHeader label="Utilizzi" columnKey="usageCount" className="text-center" />
              <SortableHeader label="Stato" columnKey="status" className="text-center" />
              <th className="px-6 py-4 text-center">Azioni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map(item => {
              const days = (new Date(item.expiry) - new Date()) / (1000 * 60 * 60 * 24);
              const isExpiring = days > 0 && days <= 30;
              return (
                <tr key={item.id} className={isExpiring ? "bg-yellow-50" : "hover:bg-slate-50"}>
                  <td
                    className="px-6 py-4 font-medium cursor-pointer hover:text-teal-600 hover:underline whitespace-nowrap"
                    onClick={() => handleOpenViewModal(item)}
                  >
                    {item.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap"><span className="text-xs font-mono bg-slate-100 px-1 rounded">{item.ni}</span></td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.expiry}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.supplier}</td>
                  <td className="px-6 py-4 text-right font-mono font-medium whitespace-nowrap">{Number(item.quantity).toFixed(type === 'container' ? 0 : 2)} {item.unit}</td>
                  <td className="px-6 py-4 text-right font-mono whitespace-nowrap">{item.costPerGram ? `€ ${Number(item.costPerGram).toFixed(2)}` : '-'}</td>
                  <td className="px-6 py-4 text-center whitespace-nowrap">{item.usageCount}</td>
                  <td className="px-6 py-4 text-center whitespace-nowrap">
                    {item.quantity === 0 ? <Badge type="neutral">Terminata</Badge> : new Date(item.expiry) < new Date() ? <Badge type="danger">Scaduto</Badge> : days <= 30 ? <Badge type="warning">In Scadenza</Badge> : item.quantity <= (item.minStock || (type === 'container' ? 10 : 5)) ? <Badge type="warning">Scarso</Badge> : <Badge type="success">OK</Badge>}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => handleOpenEditModal(item)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-full transition-colors" title="Modifica"><Pencil size={16} /></button>
                      <button onClick={() => handleDispose(item.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors" title="Smaltisci"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {data.length === 0 && (
              <tr><td colSpan="9" className="px-6 py-8 text-center text-slate-400 italic">Nessun elemento trovato</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="relative"><Search className="absolute left-3 top-2.5 text-slate-400 h-4 w-4" /><input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Cerca per nome, N.I. o lotto..." className="pl-9 pr-4 py-2 border border-slate-300 rounded-md text-sm w-64 focus:ring-2 focus:ring-teal-500 outline-none" /></div>
        <div className="flex gap-2">
          {inventoryFilter !== 'all' && (<div className="flex items-center gap-2 bg-amber-50 text-amber-800 px-3 py-1 rounded border border-amber-200 text-sm"><Filter size={14} /> Filtro: {inventoryFilter === 'expiring' ? 'In Scadenza' : 'Scadute'}<button onClick={() => setInventoryFilter('all')} className="hover:text-amber-900"><X size={14} /></button></div>)}
          <div className="relative">
            <button 
              onClick={() => setShowAddMenu(!showAddMenu)} 
              className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
            >
              <Plus size={16} /> Nuovo Carico
            </button>
            {showAddMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-slate-100 z-50 py-1 animate-in fade-in slide-in-from-top-2">
                <button 
                  onClick={() => { handleOpenAddModal('substance'); setShowAddMenu(false); }}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-2 text-slate-700 text-sm"
                >
                  <FlaskConical size={16} className="text-teal-600"/> Nuova Sostanza
                </button>
                <button 
                  onClick={() => { handleOpenAddModal('container'); setShowAddMenu(false); }}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-2 text-slate-700 border-t border-slate-50 text-sm"
                >
                  <Box size={16} className="text-blue-600"/> Nuovo Contenitore
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {activeSubstanceFilter && (
        <div className="flex items-center justify-between bg-blue-50 text-blue-800 px-4 py-2 rounded-md border border-blue-200">
            <div className="flex items-center gap-2">
                <Filter size={16} />
                <span className="font-semibold">Filtro Sostanza:</span>
                <span className="font-mono bg-white border px-2 py-0.5 rounded text-sm">{sortedActiveInventory.length > 0 ? sortedActiveInventory[0].name : ''}</span>
            </div>
            <button onClick={clearSubstanceFilter} className="flex items-center gap-1 hover:bg-blue-100 px-2 py-1 rounded transition-colors text-sm">
                <X size={14} /> Rimuovi filtro
            </button>
        </div>
      )}

      <div>
        <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2"><FlaskConical className="text-teal-600" size={20} /> Giacenze Attive (Sostanze)</h3>
        <InventoryTable data={activeSubstances} type="substance" />
      </div>

      <div>
        <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2"><Box className="text-blue-600" size={20} /> Giacenze Attive (Contenitori)</h3>
        <InventoryTable data={activeContainers} type="container" />
      </div>

      <div>
        <h3 className="text-lg font-bold text-slate-500 mb-3 flex items-center gap-2"><Archive className="text-slate-400" size={20} /> Archivio Smaltiti</h3>
        <Card className="border-slate-100 bg-slate-50/50">
          <div className="overflow-auto" style={{ maxHeight: '250px' }}>
            <table className="w-full text-left text-sm opacity-75">
              <thead className="sticky top-0 z-10 bg-slate-100 text-slate-500 border-b border-slate-200"><tr><th className="px-6 py-4">Sostanza/Cont.</th><th className="px-6 py-4">N.I.</th><th className="px-6 py-4">Scadenza</th><th className="px-6 py-4">Fornitore</th><th className="px-6 py-4 text-right">Residuo</th><th className="px-6 py-4 text-right">Valore</th><th className="px-6 py-4 text-center">Stato</th></tr></thead>
              <tbody className="divide-y divide-slate-100">{sortedDisposedInventory.map(item => (
                <tr key={item.id} className="text-slate-400">
                  <td
                    className="px-6 py-4 font-medium cursor-pointer hover:text-teal-600 hover:underline whitespace-nowrap"
                    onClick={() => handleOpenViewModal(item)}
                  >
                    {item.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.ni}</td><td className="px-6 py-4 whitespace-nowrap">{item.expiry}</td><td className="px-6 py-4 whitespace-nowrap">{item.supplier}</td><td className="px-6 py-4 text-right whitespace-nowrap">{Number(item.quantity).toFixed(item.isContainer ? 0 : 2)} {item.unit}</td><td className="px-6 py-4 text-right whitespace-nowrap">{item.costPerGram ? `€ ${Number(item.costPerGram).toFixed(2)}` : '-'}</td><td className="px-6 py-4 text-center"><Badge type="dark">Smaltito</Badge></td>
                </tr>))}</tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Inventory;