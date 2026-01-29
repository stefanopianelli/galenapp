import React, { useState } from 'react';
import { Search, Plus, X, Filter, Package, Archive, Pencil, Trash2, ArrowUp, ArrowDown, FlaskConical, Box, Eye, ChevronRight, ChevronDown, Copy } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { formatDate } from '../../utils/dateUtils';

// --- COMPONENTI ESTRATTI ---

const SortIcon = ({ columnKey, sortConfig }) => {
  if (sortConfig.key !== columnKey) return null;
  return sortConfig.direction === 'asc' ? <ArrowUp size={14} className="inline ml-1" /> : <ArrowDown size={14} className="inline ml-1" />;
};

const SortableHeader = ({ label, columnKey, sortConfig, requestSort, className = "" }) => (
  <th
    className={`px-3 py-2 font-bold cursor-pointer select-none hover:bg-slate-100 transition-colors text-[10px] uppercase tracking-wider ${className}`}
    onClick={() => requestSort(columnKey)}
  >
    <div className="flex items-center gap-1">
      {label}
      <SortIcon columnKey={columnKey} sortConfig={sortConfig} />
    </div>
  </th>
);

const InventoryRow = ({ item, isChild = false, handleOpenViewModal, handleOpenEditModal, handleDuplicateInventory, handleDispose, canEdit }) => {
    const days = (new Date(item.expiry) - new Date()) / (1000 * 60 * 60 * 24);
    const isExpiring = days > 0 && days <= 30;
    const rowClass = isChild ? "bg-slate-50/50 hover:bg-slate-100" : (isExpiring ? "bg-yellow-50" : "hover:bg-slate-50");
    const paddingClass = isChild ? "pl-10" : "pl-3";

    return (
      <tr className={`${rowClass} text-xs transition-colors border-b border-slate-50 last:border-0`}>
        <td
          className={`${paddingClass} pr-3 py-2 font-bold cursor-pointer hover:text-teal-600 hover:underline whitespace-nowrap flex items-center gap-2`}
          onClick={() => handleOpenViewModal(item)}
        >
          {isChild && <div className="w-3 border-l-2 border-b-2 border-slate-300 h-3 mr-1 rounded-bl-sm"></div>}
          <span className="truncate max-w-[180px]" title={item.name}>{item.name}</span>
        </td>
        <td className="px-3 py-2 whitespace-nowrap font-mono text-[10px] text-slate-500">{item.ni}</td>
        <td className="px-3 py-2 whitespace-nowrap">{formatDate(item.expiry)}</td>
        <td className="px-3 py-2 whitespace-nowrap text-slate-400 truncate max-w-[100px]" title={item.supplier}>{item.supplier}</td>
        <td className="px-4 py-2 text-right font-mono font-bold whitespace-nowrap text-slate-700">{Number(item.quantity).toFixed(item.isContainer ? 0 : 2)} {item.unit}</td>
        <td className="px-4 py-2 text-right font-mono whitespace-nowrap text-slate-500">{item.costPerGram ? `€ ${Number(item.costPerGram).toFixed(2)}` : '-'}</td>
        <td className="px-3 py-2 text-center whitespace-nowrap text-slate-400">{item.usageCount}</td>
        <td className="px-3 py-2 text-center whitespace-nowrap scale-90">
          {parseFloat(item.quantity) === 0 ? <Badge type="neutral">Terminata</Badge> : new Date(item.expiry) < new Date() ? <Badge type="danger">Scaduto</Badge> : days <= 30 ? <Badge type="warning">In Scadenza</Badge> : parseFloat(item.quantity) <= (parseFloat(item.minStock) || (item.isContainer ? 10 : 5)) ? <Badge type="warning">Scarso</Badge> : <Badge type="success">OK</Badge>}
        </td>
        <td className="px-3 py-2 text-center">
          <div className="flex justify-center gap-1">
            {canEdit ? (
              <>
                <button onClick={() => handleOpenEditModal(item)} className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Modifica"><Pencil size={14} /></button>
                <button onClick={() => handleDuplicateInventory(item)} className="p-1 text-teal-600 hover:bg-teal-50 rounded transition-colors" title="Duplica"><Copy size={14} /></button>
                <button onClick={() => handleDispose(item.id)} className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Smaltisci"><Trash2 size={14} /></button>
              </>
            ) : (
              <button onClick={() => handleOpenEditModal(item)} className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded transition-colors" title="Visualizza"><Eye size={14} /></button>
            )}
          </div>
        </td>
      </tr>
    );
};

const groupData = (items) => {
  const groups = {};
  items.forEach(item => {
    if (!groups[item.name]) {
      groups[item.name] = { 
        name: item.name, 
        items: [], 
        totalQty: 0, 
        unit: item.unit,
        earliestExpiry: item.expiry 
      };
    }
    groups[item.name].items.push(item);
    groups[item.name].totalQty += parseFloat(item.quantity);
    if (new Date(item.expiry) < new Date(groups[item.name].earliestExpiry)) {
      groups[item.name].earliestExpiry = item.expiry;
    }
  });
  
  const orderedGroups = [];
  const seen = new Set();
  items.forEach(item => {
      if (!seen.has(item.name)) {
          orderedGroups.push(groups[item.name]);
          seen.add(item.name);
      }
  });
  return orderedGroups;
};

const InventoryTable = ({ data, type, sortConfig, requestSort, handleOpenViewModal, handleOpenEditModal, handleDuplicateInventory, handleDispose, canEdit }) => {
  const groups = groupData(data);
  const [expandedGroups, setExpandedGroups] = useState({});

  const toggleGroup = (name) => {
    setExpandedGroups(prev => ({ ...prev, [name]: !prev[name] }));
  };

  return (
  <Card>
    <div className="overflow-auto" style={{ maxHeight: '60vh' }}>
      <table className="w-full text-left text-sm">
        <thead className="sticky top-0 z-10 bg-slate-50 text-slate-600 border-b border-slate-200">
          <tr>
            <SortableHeader label={type === 'container' ? "Contenitore" : "Sostanza"} columnKey="name" sortConfig={sortConfig} requestSort={requestSort} />
            <SortableHeader label="N.I." columnKey="ni" sortConfig={sortConfig} requestSort={requestSort} />
            <SortableHeader label="Scadenza" columnKey="expiry" sortConfig={sortConfig} requestSort={requestSort} />
            <SortableHeader label="Fornitore" columnKey="supplier" sortConfig={sortConfig} requestSort={requestSort} />
            <SortableHeader label="Giacenza" columnKey="quantity" className="text-right px-4" sortConfig={sortConfig} requestSort={requestSort} />
            <SortableHeader label={type === 'container' ? "Costo Unit." : "€/g"} columnKey="costPerGram" className="text-right px-4" sortConfig={sortConfig} requestSort={requestSort} />
            <SortableHeader label="Utilizzi" columnKey="usageCount" className="text-center" sortConfig={sortConfig} requestSort={requestSort} />
            <SortableHeader label="Stato" columnKey="status" className="text-center" sortConfig={sortConfig} requestSort={requestSort} />
            <th className="px-6 py-4 text-center">Azioni</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {groups.map((group, groupIdx) => {
              if (group.items.length === 1) {
                  return (
                    <InventoryRow 
                        key={group.items[0].id} 
                        item={group.items[0]} 
                        handleOpenViewModal={handleOpenViewModal}
                        handleOpenEditModal={handleOpenEditModal}
                        handleDuplicateInventory={handleDuplicateInventory}
                        handleDispose={handleDispose}
                        canEdit={canEdit}
                    />
                  );
              }
              const isExpanded = expandedGroups[group.name];
              
              const anyExpiring = group.items.some(i => {
                  const days = (new Date(i.expiry) - new Date()) / (1000 * 60 * 60 * 24);
                  return days > 0 && days <= 30;
              });
              const anyExpired = group.items.some(i => new Date(i.expiry) < new Date());
              const totalStatus = anyExpired ? <Badge type="danger">Lotti Scaduti</Badge> : anyExpiring ? <Badge type="warning">In Scadenza</Badge> : <Badge type="success">OK</Badge>;

              return (
                  <React.Fragment key={group.name}>
                      <tr className={`${isExpanded ? 'bg-slate-100' : 'bg-slate-50 hover:bg-slate-100'} cursor-pointer font-bold text-xs transition-colors`} onClick={() => toggleGroup(group.name)}>
                          <td className="px-3 py-2 flex items-center gap-2 whitespace-nowrap text-teal-800">
                              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                              <span className="truncate max-w-[180px]">{group.name}</span>
                              <span className="ml-1 text-[9px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full">{group.items.length} Lotti</span>
                          </td>
                          <td className="px-3 py-2 text-slate-400 text-[10px] italic font-mono uppercase">MULTIPLI</td>
                          <td className="px-3 py-2 text-teal-700 font-medium">
                              <span className="whitespace-nowrap">{formatDate(group.earliestExpiry)}</span> 
                              <span className="ml-1 text-[9px] font-bold opacity-75 uppercase">(FIFO)</span>
                          </td>
                          <td className="px-3 py-2 text-slate-400 text-[10px] italic">Vari</td>
                          <td className="px-3 py-2 text-right font-mono font-bold text-slate-800">{group.totalQty.toFixed(type === 'container' ? 0 : 2)} {group.unit}</td>
                          <td className="px-3 py-2 text-right text-slate-300">-</td>
                          <td className="px-3 py-2 text-center text-slate-300">-</td>
                          <td className="px-3 py-2 text-center whitespace-nowrap scale-90">{totalStatus}</td>
                          <td className="px-3 py-2 text-center">
                              <button className="text-[10px] font-bold text-slate-400 uppercase hover:text-teal-600">
                                  {isExpanded ? 'Chiudi' : 'Dettagli'}
                              </button>
                          </td>
                      </tr>
                      {isExpanded && group.items.map(item => (
                          <InventoryRow 
                            key={item.id} 
                            item={item} 
                            isChild={true} 
                            handleOpenViewModal={handleOpenViewModal}
                            handleOpenEditModal={handleOpenEditModal}
                            handleDuplicateInventory={handleDuplicateInventory}
                            handleDispose={handleDispose}
                            canEdit={canEdit}
                          />
                      ))}
                  </React.Fragment>
              );
          })}
          {data.length === 0 && (
            <tr><td colSpan="9" className="px-6 py-8 text-center text-slate-400 italic">Nessun elemento trovato</td></tr>
          )}
        </tbody>
      </table>
    </div>
  </Card>
  );
};

// --- COMPONENTE PRINCIPALE ---

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
  handleDuplicateInventory,
  handleDispose,
  sortConfig,
  requestSort,
  activeSubstanceFilter,
  clearSubstanceFilter,
  canEdit
}) => {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [activeTab, setActiveTab] = useState('substances');

  const activeSubstances = sortedActiveInventory.filter(item => !item.isContainer);
  const activeContainers = sortedActiveInventory.filter(item => item.isContainer);

  return (
    <div className="space-y-6">
      {/* HEADER E RICERCA */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col lg:flex-row justify-between items-center gap-4 animate-in fade-in duration-300">
        <div className="flex flex-col lg:flex-row items-center gap-4 w-full lg:w-auto">
            <div className="relative w-full lg:w-auto">
                <Search className="absolute left-3 top-2.5 text-slate-400 h-4 w-4" />
                <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Cerca nel magazzino..." className="pl-9 pr-4 py-2 border border-slate-300 rounded-md text-sm w-full lg:w-64 focus:ring-2 focus:ring-teal-500 outline-none" />
            </div>
            
            <div className="flex bg-slate-100 p-1 rounded-lg gap-1 overflow-x-auto w-full lg:w-auto">
                <button onClick={() => setInventoryFilter('all')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap ${inventoryFilter === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Tutte</button>
                <button onClick={() => setInventoryFilter('expiring')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap ${inventoryFilter === 'expiring' ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>In Scadenza</button>
                <button onClick={() => setInventoryFilter('expired')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap ${inventoryFilter === 'expired' ? 'bg-white text-red-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Scadute</button>
                <button onClick={() => setInventoryFilter('lowStock')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap ${inventoryFilter === 'lowStock' ? 'bg-white text-yellow-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Sotto Scorta</button>
                <button onClick={() => setInventoryFilter('outOfStock')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap ${inventoryFilter === 'outOfStock' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Terminate</button>
            </div>
        </div>

        <div className="flex gap-2 w-full lg:w-auto justify-end">
          {canEdit && (
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
          )}
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

      {/* TABS NAVIGATION */}
      <div className="flex border-b border-slate-200 space-x-6 px-2">
        <button 
            onClick={() => setActiveTab('substances')} 
            className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${activeTab === 'substances' ? 'border-teal-600 text-teal-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
            <FlaskConical size={18} /> Sostanze <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full ml-1">{activeSubstances.length}</span>
        </button>
        <button 
            onClick={() => setActiveTab('containers')} 
            className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${activeTab === 'containers' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
            <Box size={18} /> Contenitori <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full ml-1">{activeContainers.length}</span>
        </button>
        <button 
            onClick={() => setActiveTab('archived')} 
            className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${activeTab === 'archived' ? 'border-slate-600 text-slate-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
            <Archive size={18} /> Archivio Smaltiti <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full ml-1">{sortedDisposedInventory.length}</span>
        </button>
      </div>

      {/* CONTENUTO TAB */}
      <div className="min-h-[400px]">
        {activeTab === 'substances' && (
            <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                <InventoryTable 
                    data={activeSubstances} 
                    type="substance" 
                    sortConfig={sortConfig}
                    requestSort={requestSort}
                    handleOpenViewModal={handleOpenViewModal}
                    handleOpenEditModal={handleOpenEditModal}
                    handleDuplicateInventory={handleDuplicateInventory}
                    handleDispose={handleDispose}
                    canEdit={canEdit}
                />
            </div>
        )}

        {activeTab === 'containers' && (
            <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                <InventoryTable 
                    data={activeContainers} 
                    type="container" 
                    sortConfig={sortConfig}
                    requestSort={requestSort}
                    handleOpenViewModal={handleOpenViewModal}
                    handleOpenEditModal={handleOpenEditModal}
                    handleDuplicateInventory={handleDuplicateInventory}
                    handleDispose={handleDispose}
                    canEdit={canEdit}
                />
            </div>
        )}

        {activeTab === 'archived' && (
            <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                <Card className="border-slate-100 bg-slate-50/30">
                <div className="overflow-auto" style={{ maxHeight: '60vh' }}>
                    <table className="w-full text-left text-xs opacity-80">
                    <thead className="sticky top-0 z-10 bg-slate-100 text-slate-500 border-b border-slate-200">
                        <tr>
                        <th className="px-3 py-2 font-bold uppercase">Sostanza/Cont.</th>
                        <th className="px-3 py-2 font-bold uppercase">N.I.</th>
                        <th className="px-3 py-2 font-bold uppercase">Scadenza</th>
                        <th className="px-3 py-2 font-bold uppercase">Fornitore</th>
                        <th className="px-3 py-2 font-bold uppercase text-right">Residuo</th>
                        <th className="px-3 py-2 font-bold uppercase text-right">Valore</th>
                        <th className="px-3 py-2 font-bold uppercase text-center">Stato</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {sortedDisposedInventory.map(item => (
                        <tr 
                            key={item.id} 
                            className="text-slate-500 hover:bg-white transition-colors cursor-pointer"
                            onClick={() => handleOpenViewModal(item)}
                            title="Clicca per dettagli"
                        >
                            <td className="px-3 py-2 font-bold truncate max-w-[150px]">{item.name}</td>
                            <td className="px-3 py-2 font-mono opacity-75">{item.ni}</td>
                            <td className="px-3 py-2">{formatDate(item.expiry)}</td>
                            <td className="px-3 py-2 truncate max-w-[100px]" title={item.supplier}>{item.supplier}</td>
                            <td className="px-3 py-2 text-right font-mono">{Number(item.quantity).toFixed(item.isContainer ? 0 : 2)} {item.unit}</td>
                            <td className="px-3 py-2 text-right font-mono">{item.costPerGram ? `€ ${Number(item.costPerGram).toFixed(2)}` : '-'}</td>
                            <td className="px-3 py-2 text-center"><Badge type="neutral">Smaltito</Badge></td>
                        </tr>
                        ))}
                         {sortedDisposedInventory.length === 0 && (
                            <tr><td colSpan="7" className="px-6 py-8 text-center text-slate-400 italic">Nessun elemento archiviato</td></tr>
                        )}
                    </tbody>
                    </table>
                </div>
                </Card>
            </div>
        )}
      </div>
    </div>
  );
};

export default Inventory;
