import React, { useState, useEffect, useRef } from 'react';
import { Hash, Calendar, Pencil, Trash2, Filter, X, Search, ArrowUp, ArrowDown, Stethoscope, FlaskConical, Eye } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';

const PreparationsLog = ({ preparations, handleJumpToStep, handleDeletePreparation, handleDuplicatePreparation, activeFilter, clearFilter, searchTerm, setSearchTerm, sortConfig, requestSort, prepTypeFilter, setPrepTypeFilter, canEdit }) => {
  const filteredPrepName = activeFilter && preparations.length === 1 ? preparations[0].name : null;
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef]);

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return null;
    return sortConfig.direction === 'asc' ? <ArrowUp size={14} className="inline ml-1" /> : <ArrowDown size={14} className="inline ml-1" />;
  };

  const SortableHeader = ({ label, columnKey, className = "" }) => (
    <th
      className={`px-6 py-3 font-semibold whitespace-nowrap cursor-pointer select-none hover:bg-slate-100 transition-colors ${className}`}
      onClick={() => requestSort(columnKey)}
    >
      <div className={`flex items-center gap-1 ${className.includes('text-center') ? 'justify-center' : ''}`}>
        {label}
        <SortIcon columnKey={columnKey} />
      </div>
    </th>
  );
  return (
    <div className="space-y-4">
       <div className="flex justify-between items-center bg-white p-4 rounded-md border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400 h-4 w-4" />
              <input 
                  type="text" 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  placeholder="Cerca preparazione..." 
                  className="pl-9 pr-4 py-2 border border-slate-300 rounded-md text-sm w-64 focus:ring-2 focus:ring-teal-500 outline-none"
              />
          </div>

          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button 
              onClick={() => setPrepTypeFilter('all')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${prepTypeFilter === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Tutte
            </button>
            <button 
              onClick={() => setPrepTypeFilter('magistrale')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all ${prepTypeFilter === 'magistrale' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Stethoscope size={14} /> Magistrali
            </button>
            <button 
              onClick={() => setPrepTypeFilter('officinale')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all ${prepTypeFilter === 'officinale' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <FlaskConical size={14} /> Officinali
            </button>
          </div>
        </div>
      </div>

      {activeFilter && (
        <div className="flex items-center justify-between bg-amber-50 text-amber-800 px-4 py-2 rounded-md border border-amber-200">
            <div className="flex items-center gap-2">
                <Filter size={16} />
                <span className="font-semibold">Filtro attivo:</span>
                <span className="font-mono bg-white border px-2 py-0.5 rounded text-sm">{filteredPrepName || `#${activeFilter}`}</span>
            </div>
            <button onClick={clearFilter} className="flex items-center gap-1 hover:bg-amber-100 px-2 py-1 rounded transition-colors text-sm">
                <X size={14} /> Rimuovi filtro
            </button>
        </div>
      )}
      <Card>
        <div className="overflow-auto h-[calc(100vh-240px)]">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <SortableHeader label="Data / N.P." columnKey="prepNumber" />
                <SortableHeader label="Preparazione & Forma" columnKey="name" />
                <SortableHeader label="Paziente / Medico" columnKey="patient" />
                <th className="px-6 py-3 font-semibold whitespace-nowrap">Ingredienti & Lotti</th>
                <th className="px-6 py-3 font-semibold text-center whitespace-nowrap">Stato</th>
                <SortableHeader label="Prezzo" columnKey="totalPrice" className="text-center" />
                <th className="px-6 py-3 font-semibold text-center whitespace-nowrap">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {preparations.map(prep => (
                <tr key={prep.id} className="hover:bg-slate-50 align-top whitespace-nowrap">
                  <td className="px-6 py-4 whitespace-nowrap text-slate-500 font-mono">
                    <div>{prep.date}</div>
                    <div className="mt-1 flex items-center gap-1 text-slate-800 font-bold bg-slate-100 px-2 rounded w-fit">
                      <Hash size={12} /> {prep.prepNumber}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div 
                      className="font-bold text-slate-800 cursor-pointer hover:underline hover:text-teal-600"
                      onClick={() => handleJumpToStep(prep, 1)}
                    >
                      {prep.name}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge type="neutral">{prep.pharmaceuticalForm}</Badge>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Calendar size={10} /> Scad: {prep.expiryDate}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-2 italic bg-slate-50 p-1.5 rounded border border-slate-100 max-w-[250px] overflow-hidden text-ellipsis">
                      Posologia: {prep.posology}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-slate-700"><span className="font-semibold">Pz:</span> {prep.patient}</div>
                    <div className="text-slate-500 text-xs mt-1"><span className="font-semibold">Dr:</span> {prep.doctor}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <ul className="space-y-1">
                      {prep.ingredients.map((ing, idx) => (
                        <li key={idx} className="text-xs flex items-center justify-between bg-slate-50 p-1 rounded border border-slate-100">
                          <span className="font-medium text-slate-700">{ing.name}</span>
                          <span className="text-slate-500 font-mono mx-2">N.I.: {ing.ni}</span>
                          <span className="font-bold text-slate-800">{Number(ing.amountUsed).toFixed(2)} {ing.unit}</span>
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="px-6 py-4 text-center whitespace-nowrap">
                    {prep.status === 'Bozza' ? <Badge type="neutral">Bozza</Badge> : <Badge type="success">Completata</Badge>}
                  </td>
                  <td className="px-6 py-4 text-center font-bold text-teal-700 whitespace-nowrap">
                    {prep.totalPrice ? `€ ${parseFloat(prep.totalPrice).toFixed(2)}` : '-'}
                  </td>
                  <td className="px-6 py-4 text-center whitespace-nowrap">
                    <div className="relative flex justify-center gap-2">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === prep.id ? null : prep.id)}
                        className={`p-1.5 rounded-full transition-colors ${canEdit ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' : 'text-slate-400 hover:text-blue-600 hover:bg-slate-50'}`}
                        title={canEdit ? "Modifica" : "Visualizza"}
                      >
                        {canEdit ? <Pencil size={16} /> : <Eye size={16} />}
                      </button>
                      {openMenuId === prep.id && (
                        <div 
                          ref={menuRef}
                          className="absolute right-0 top-full mt-2 w-48 bg-white rounded-md shadow-lg z-20 border"
                        >
                          {prep.status === 'Bozza' ? (
                            <button onClick={() => { handleJumpToStep(prep, 1); setOpenMenuId(null); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">{canEdit ? 'Riprendi Bozza' : 'Visualizza Bozza'}</button>
                          ) : (
                            <>
                              <button onClick={() => { handleJumpToStep(prep, 1); setOpenMenuId(null); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">{canEdit ? 'Modifica Anagrafica' : 'Visualizza Anagrafica'}</button>
                              <button onClick={() => { handleJumpToStep(prep, 2); setOpenMenuId(null); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">{canEdit ? 'Modifica Componenti' : 'Visualizza Componenti'}</button>
                              <button onClick={() => { handleJumpToStep(prep, 3); setOpenMenuId(null); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">{canEdit ? 'Modifica Tariffa' : 'Visualizza Tariffa'}</button>
                              {prep.prepType === 'officinale' && (
                                <button onClick={() => { handleJumpToStep(prep, 4); setOpenMenuId(null); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">{canEdit ? 'Modifica Lotti' : 'Visualizza Lotti'}</button>
                              )}
                              <button onClick={() => { handleJumpToStep(prep, prep.prepType === 'officinale' ? 5 : 4); setOpenMenuId(null); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">{canEdit ? 'Mod. Foglio Lav.' : 'Vis. Foglio Lav.'}</button>
                            </>
                          )}
                          {canEdit && (
                            <>
                              <div className="border-t my-1"></div>
                              <button onClick={() => { handleDuplicatePreparation(prep); setOpenMenuId(null); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Duplica Preparazione</button>
                            </>
                          )}
                        </div>
                      )}
                      {canEdit && (
                        <button
                          onClick={() => handleDeletePreparation(prep.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                          title="Elimina"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {preparations.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-slate-400 italic">
                    {activeFilter || searchTerm ? "Nessuna preparazione trovata con i criteri specificati." : "Nessuna preparazione registrata."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default PreparationsLog;