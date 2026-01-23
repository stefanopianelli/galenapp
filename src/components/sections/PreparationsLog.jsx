import React, { useState, useEffect } from 'react';
import { Hash, Calendar, Pencil, Trash2, Filter, X, Search, ChevronDown, ChevronUp, Stethoscope, FlaskConical, Printer, Copy, User, Pill, ArrowRight, FileDown, LayoutGrid, LayoutList } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { generateWorkSheetPDF } from '../../services/pdfGenerator';
import { formatDate } from '../../utils/dateUtils';

const PreparationCard = ({ prep, isExpanded, toggleExpand, handleJumpToStep, handleDeletePreparation, handleDuplicatePreparation, canEdit, pharmacySettings, onPrintLabel, isAdmin }) => {
  return (
    <div className={`border rounded-lg transition-all duration-200 ${isExpanded ? 'bg-white border-teal-200 shadow-md ring-1 ring-teal-100' : 'bg-white border-slate-200 hover:border-teal-200'}`}>
      {/* HEADER CARD (Sempre visibile) */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer select-none"
        onClick={toggleExpand}
      >
        <div className="flex items-center gap-6 flex-1">
          {/* N.P. e Data */}
          <div className="flex flex-col w-24 shrink-0">
            <div className={`flex items-center gap-1 font-mono font-bold px-2 py-0.5 rounded w-fit text-sm ${prep.prepNumber.startsWith('BOZZA') || prep.prepNumber === 'TEMP' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>
              <Hash size={12} /> {(prep.prepNumber.startsWith('BOZZA') || prep.prepNumber === 'TEMP') ? 'BOZZA' : prep.prepNumber}
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <Calendar size={10} /> {formatDate(prep.date)}
            </div>
          </div>

          {/* Nome e Info Base */}
          <div className="flex-1 min-w-0">
            <div className="font-bold text-slate-800 text-lg truncate flex items-center gap-2">
              {prep.name}
              {prep.prepType === 'officinale' && <FlaskConical size={14} className="text-blue-500" title="Officinale"/>}
            </div>
            <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
              <span className="flex items-center gap-1"><Pill size={12}/> {prep.pharmaceuticalForm}</span>
            </div>
          </div>
        </div>

        {/* Stato, Prezzo e Azioni Rapide */}
        <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block">
            {prep.status === 'Bozza' ? <Badge type="neutral">Bozza</Badge> : <Badge type="success">Completata</Badge>}
          </div>
          <div className="font-mono font-bold text-teal-700 text-lg w-24 text-right">
            {prep.totalPrice ? `€ ${parseFloat(prep.totalPrice).toFixed(2)}` : '-'}
          </div>
          <div className={`p-1 rounded-full transition-transform duration-200 ${isExpanded ? 'rotate-180 bg-slate-100 text-slate-600' : 'text-slate-400'}`}>
            <ChevronDown size={20} />
          </div>
        </div>
      </div>

      {/* BODY ESPANDIBILE */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-0 border-t border-slate-100 animate-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            
            {/* Colonna 1: Dettagli Ricetta */}
            <div className="space-y-3 text-sm">
              <h4 className="font-bold text-slate-700 uppercase text-xs tracking-wider">Dettagli Ricetta</h4>
              <div className="grid grid-cols-2 gap-y-2">
                <span className="text-slate-500">Paziente:</span> <span className="font-bold text-slate-800">{prep.patient || '-'}</span>
                <span className="text-slate-500">Medico:</span> <span className="font-medium">{prep.doctor || '-'}</span>
                <span className="text-slate-500">Scadenza:</span> <span className="font-medium text-red-600">{formatDate(prep.expiryDate)}</span>
                <span className="text-slate-500">Quantità:</span> <span className="font-medium">{prep.quantity} {prep.prepUnit}</span>
              </div>
              <div className="bg-slate-50 p-2 rounded border border-slate-100 mt-2">
                <span className="block text-xs text-slate-400 uppercase font-bold mb-1">Posologia</span>
                <p className="italic text-slate-600">{prep.posology || "Nessuna posologia indicata"}</p>
              </div>
            </div>

            {/* Colonna 2: Ingredienti */}
            <div>
              <h4 className="font-bold text-slate-700 uppercase text-xs tracking-wider mb-2">Composizione</h4>
              <ul className="space-y-1">
                {prep.ingredients.map((ing, idx) => (
                  <li key={idx} className="text-xs flex items-center justify-between bg-slate-50 p-1.5 rounded border border-slate-100 hover:bg-white transition-colors">
                    <div>
                      <span className={`font-medium ${ing.isExcipient ? 'text-slate-500 italic' : 'text-teal-700'}`}>{ing.name}</span>
                      <span className="text-[10px] text-slate-400 block ml-1">
                        {[ing.lot ? 'L:'+ing.lot : null, ing.ni ? 'NI:'+ing.ni : null].filter(Boolean).join(' ') || '-'}
                      </span>
                    </div>
                    <span className="font-bold text-slate-800 font-mono">{Number(ing.amountUsed).toFixed(2)} {ing.unit}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Colonna 3: Azioni */}
            <div className="flex flex-col gap-2 justify-start">
              <h4 className="font-bold text-slate-700 uppercase text-xs tracking-wider mb-1">Azioni Rapide</h4>
              <button 
                onClick={(e) => { e.stopPropagation(); onPrintLabel(prep); }} 
                className="w-full text-left px-3 py-2 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 flex items-center gap-2 transition-colors text-sm font-medium"
              >
                <Printer size={16} /> Stampa Etichetta
              </button>

              <button 
                onClick={(e) => { e.stopPropagation(); generateWorkSheetPDF({ details: prep, ingredients: prep.ingredients, pricing: prep.pricingData }, pharmacySettings); }} 
                className="w-full text-left px-3 py-2 bg-slate-50 text-slate-700 rounded hover:bg-slate-100 flex items-center gap-2 transition-colors text-sm font-medium"
              >
                <FileDown size={16} /> Scarica Foglio
              </button>
              
              <div className="border-t border-slate-100 my-1"></div>

              <button 
                onClick={(e) => { e.stopPropagation(); handleJumpToStep(prep, 1); }} 
                className="w-full text-left px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded hover:bg-slate-50 flex items-center gap-2 transition-colors text-sm"
              >
                <Pencil size={16} /> {canEdit ? (prep.status === 'Bozza' ? 'Riprendi Lavorazione' : 'Modifica Dati') : 'Visualizza Dettagli'}
              </button>

              {canEdit && (
                <>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDuplicatePreparation(prep); }} 
                    className="w-full text-left px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded hover:bg-slate-50 flex items-center gap-2 transition-colors text-sm"
                  >
                    <Copy size={16} /> Duplica come Nuova
                  </button>
                  
                  {(isAdmin || prep.status === 'Bozza') && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); handleDeletePreparation(prep.id); }} 
                        className="w-full text-left px-3 py-2 bg-white border border-red-100 text-red-600 rounded hover:bg-red-50 flex items-center gap-2 transition-colors text-sm mt-auto"
                    >
                        <Trash2 size={16} /> Elimina
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const PreparationsTable = ({ preparations, handleJumpToStep, handleDeletePreparation, handleDuplicatePreparation, canEdit, pharmacySettings, onPrintLabel, isAdmin }) => {
    return (
        <Card className="border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                        <tr>
                            <th className="px-4 py-3 whitespace-nowrap">N.P.</th>
                            <th className="px-4 py-3 whitespace-nowrap">Data</th>
                            <th className="px-4 py-3">Nome Preparazione</th>
                            <th className="px-4 py-3">Forma</th>
                            <th className="px-4 py-3">Paziente</th>
                            <th className="px-4 py-3 text-right">Prezzo</th>
                            <th className="px-4 py-3 text-center">Stato</th>
                            <th className="px-4 py-3 text-center">Azioni</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {preparations.map(prep => (
                            <tr key={prep.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => handleJumpToStep(prep, 1)}>
                                <td className="px-4 py-3 font-mono text-xs font-bold text-slate-600 whitespace-nowrap">
                                    {(prep.prepNumber.startsWith('BOZZA') || prep.prepNumber === 'TEMP') ? <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">BOZZA</span> : prep.prepNumber}
                                </td>
                                <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatDate(prep.date)}</td>
                                <td className="px-4 py-3 font-medium text-slate-800">
                                    <div className="flex items-center gap-2">
                                        {prep.name}
                                        {prep.prepType === 'officinale' && <FlaskConical size={12} className="text-blue-500" title="Officinale"/>}
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-slate-500 max-w-[150px] truncate" title={prep.pharmaceuticalForm}>{prep.pharmaceuticalForm}</td>
                                <td className="px-4 py-3 text-slate-700 font-medium">{prep.patient || '-'}</td>
                                <td className="px-4 py-3 text-right font-mono font-bold text-teal-700 whitespace-nowrap">
                                    {prep.totalPrice ? `€ ${parseFloat(prep.totalPrice).toFixed(2)}` : '-'}
                                </td>
                                <td className="px-4 py-3 text-center">
                                    {prep.status === 'Bozza' ? <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded font-bold uppercase">Bozza</span> : <span className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded font-bold uppercase">OK</span>}
                                </td>
                                <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex justify-center gap-1">
                                        <button onClick={() => onPrintLabel(prep)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Stampa Etichetta"><Printer size={16}/></button>
                                        <button onClick={() => generateWorkSheetPDF({ details: prep, ingredients: prep.ingredients, pricing: prep.pricingData }, pharmacySettings)} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded" title="Scarica Foglio"><FileDown size={16}/></button>
                                        {canEdit && (
                                            <>
                                                <button onClick={() => handleDuplicatePreparation(prep)} className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded" title="Duplica"><Copy size={16}/></button>
                                                {(isAdmin || prep.status === 'Bozza') && (
                                                    <button onClick={() => handleDeletePreparation(prep.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded" title="Elimina"><Trash2 size={16}/></button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

const PreparationsLog = ({ preparations, handleJumpToStep, handleDeletePreparation, handleDuplicatePreparation, activeFilter, clearFilter, searchTerm, setSearchTerm, prepTypeFilter, setPrepTypeFilter, canEdit, pharmacySettings, onPrintLabel, isAdmin }) => {
  const [expandedId, setExpandedId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('prepLogViewMode') || 'cards');
  useEffect(() => { localStorage.setItem('prepLogViewMode', viewMode); }, [viewMode]);
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [statusFilter, setStatusFilter] = useState('all');
  const [formFilter, setFormFilter] = useState('all');
  
  // Paginazione
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = viewMode === 'table' ? 100 : 50; // Più item in tabella

  const filteredPrepName = activeFilter && preparations.length === 1 ? preparations[0].name : null;
  
  // Estrai forme farmaceutiche uniche per il filtro
  const uniqueForms = [...new Set(preparations.map(p => p.pharmaceuticalForm))].sort();

  const toggleExpand = (id) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  // Logica Filtro Client-Side Avanzata
  const advancedFilteredPreparations = preparations.filter(prep => {
      // Filtro Data
      if (dateRange.from) {
          const [d, m, y] = prep.date.split('/');
          const pDate = new Date(`${y}-${m}-${d}`);
          const fromDate = new Date(dateRange.from);
          if (pDate < fromDate) return false;
      }
      if (dateRange.to) {
          const [d, m, y] = prep.date.split('/');
          const pDate = new Date(`${y}-${m}-${d}`);
          const toDate = new Date(dateRange.to);
          if (pDate > toDate) return false;
      }
      // Filtro Stato
      if (statusFilter !== 'all' && prep.status !== statusFilter) return false;
      // Filtro Forma
      if (formFilter !== 'all' && prep.pharmaceuticalForm !== formFilter) return false;

      return true;
  });

  // Logica Paginazione
  const totalItems = advancedFilteredPreparations.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedPreparations = advancedFilteredPreparations.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
  );

  const handlePageChange = (newPage) => {
      if (newPage >= 1 && newPage <= totalPages) {
          setCurrentPage(newPage);
          window.scrollTo({ top: 0, behavior: 'smooth' });
      }
  };

  return (
    <div className="space-y-6">
       {/* FILTRI E RICERCA */}
       <div className="flex flex-col gap-4">
           <div className="flex flex-col xl:flex-row justify-between items-center bg-white p-4 rounded-lg border border-slate-200 shadow-sm gap-4">
            <div className="flex items-center gap-2 w-full xl:w-auto">
                <div className="relative w-full xl:w-auto flex-1">
                    <Search className="absolute left-3 top-2.5 text-slate-400 h-4 w-4" />
                    <input 
                        type="text" 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                        placeholder="Cerca per nome, paziente, n.p..." 
                        className="pl-9 pr-4 py-2 border border-slate-300 rounded-md text-sm w-full xl:w-72 focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                    />
                </div>
                <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className={`p-2 rounded-md border transition-colors ${showFilters ? 'bg-teal-50 border-teal-200 text-teal-700' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'}`}
                    title="Filtri Avanzati"
                >
                    <Filter size={18} />
                </button>
                <div className="flex border border-slate-300 rounded-md bg-white p-0.5 ml-2">
                    <button onClick={() => setViewMode('cards')} className={`p-1.5 rounded ${viewMode === 'cards' ? 'bg-slate-100 text-slate-800' : 'text-slate-400 hover:text-slate-600'}`} title="Vista Card"><LayoutGrid size={16}/></button>
                    <button onClick={() => setViewMode('table')} className={`p-1.5 rounded ${viewMode === 'table' ? 'bg-slate-100 text-slate-800' : 'text-slate-400 hover:text-slate-600'}`} title="Vista Tabella"><LayoutList size={16}/></button>
                </div>
            </div>

            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 w-full xl:w-auto overflow-x-auto">
              {['all', 'magistrale', 'officinale'].map((type) => (
                <button 
                  key={type}
                  onClick={() => setPrepTypeFilter(type)}
                  className={`flex-1 xl:flex-none px-4 py-1.5 rounded-md text-xs font-bold capitalize transition-all whitespace-nowrap ${prepTypeFilter === type ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {type === 'all' ? 'Tutte' : type}
                </button>
              ))}
            </div>
          </div>

          {/* PANNELLO FILTRI AVANZATI */}
          {showFilters && (
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-inner animate-in slide-in-from-top-2">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Data Dal</label>
                          <input type="date" value={dateRange.from} onChange={e => setDateRange({...dateRange, from: e.target.value})} className="w-full border p-2 rounded text-sm" />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Data Al</label>
                          <input type="date" value={dateRange.to} onChange={e => setDateRange({...dateRange, to: e.target.value})} className="w-full border p-2 rounded text-sm" />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Stato</label>
                          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full border p-2 rounded text-sm bg-white">
                              <option value="all">Tutti</option>
                              <option value="Bozza">Bozza</option>
                              <option value="Completata">Completata</option>
                          </select>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Forma Farmaceutica</label>
                          <select value={formFilter} onChange={e => setFormFilter(e.target.value)} className="w-full border p-2 rounded text-sm bg-white">
                              <option value="all">Tutte</option>
                              {uniqueForms.map(form => (
                                  <option key={form} value={form}>{form}</option>
                              ))}
                          </select>
                      </div>
                  </div>
                  <div className="flex justify-end mt-3">
                      <button onClick={() => { setDateRange({from:'', to:''}); setStatusFilter('all'); setFormFilter('all'); }} className="text-xs text-red-500 hover:underline flex items-center gap-1"><X size={12}/> Resetta Filtri</button>
                  </div>
              </div>
          )}
      </div>

      {activeFilter && (
        <div className="flex items-center justify-between bg-amber-50 text-amber-800 px-4 py-2 rounded-md border border-amber-200 animate-in fade-in">
            <div className="flex items-center gap-2">
                <Filter size={16} />
                <span className="font-semibold">Filtro attivo:</span>
                <span className="font-mono bg-white border px-2 py-0.5 rounded text-sm">{filteredPrepName || `#${activeFilter}`}</span>
            </div>
            <button onClick={clearFilter} className="flex items-center gap-1 hover:bg-amber-100 px-2 py-1 rounded transition-colors text-sm">
                <X size={14} /> Rimuovi
            </button>
        </div>
      )}

      {/* LISTA PREPARAZIONI (PAGINATA) */}
      <div className="space-y-3">
        {paginatedPreparations.length > 0 ? (
          <>
            {viewMode === 'cards' ? (
                paginatedPreparations.map(prep => (
                    <PreparationCard 
                    key={prep.id} 
                    prep={prep} 
                    isExpanded={expandedId === prep.id} 
                    toggleExpand={() => toggleExpand(prep.id)}
                    handleJumpToStep={handleJumpToStep}
                    handleDeletePreparation={handleDeletePreparation}
                    handleDuplicatePreparation={handleDuplicatePreparation}
                    canEdit={canEdit}
                    pharmacySettings={pharmacySettings}
                    onPrintLabel={onPrintLabel}
                    isAdmin={isAdmin}
                    />
                ))
            ) : (
                <PreparationsTable 
                    preparations={paginatedPreparations}
                    handleJumpToStep={handleJumpToStep}
                    handleDeletePreparation={handleDeletePreparation}
                    handleDuplicatePreparation={handleDuplicatePreparation}
                    canEdit={canEdit}
                    pharmacySettings={pharmacySettings}
                    onPrintLabel={onPrintLabel}
                    isAdmin={isAdmin}
                />
            )}
            
            {/* CONTROLLI PAGINAZIONE */}
            {totalPages > 1 && (
                <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                    <button 
                        onClick={() => handlePageChange(currentPage - 1)} 
                        disabled={currentPage === 1}
                        className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Precedente
                    </button>
                    <span className="text-sm text-slate-500 font-mono">
                        Pagina {currentPage} di {totalPages}
                    </span>
                    <button 
                        onClick={() => handlePageChange(currentPage + 1)} 
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Successiva
                    </button>
                </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg border border-slate-200 border-dashed">
            <div className="bg-slate-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <Search className="text-slate-400" />
            </div>
            <p className="text-slate-500 font-medium">Nessuna preparazione trovata</p>
            <p className="text-slate-400 text-sm mt-1">Prova a modificare i filtri di ricerca.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PreparationsLog;