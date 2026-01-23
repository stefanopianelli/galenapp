import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { Trash2, Calendar, AlertTriangle, X, Search, RefreshCw } from 'lucide-react';
import { formatDate } from '../../utils/dateUtils';
import { useApi } from '../../hooks/useApi';

const Logs = ({ logs: initialLogs, preparations, handleShowPreparation, handleClearLogs, handleDeleteLog, canEdit, isAdmin }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { createApiRequest } = useApi();

  // Filtri Server-Side
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  
  // Debounce search o apply on button? Facciamo fetch su effect di pagina e filtri immediati
  // Per evitare troppe chiamate, usiamo un effetto che ascolta le dipendenze

  const fetchLogs = async () => {
      setLoading(true);
      try {
          // Costruiamo query params
          const params = new URLSearchParams({
              page: currentPage,
              limit: 50,
              type: filterType
          });
          if (searchTerm) params.append('search', searchTerm);

          const res = await createApiRequest(`get_logs_paginated&${params.toString()}`, null, false, 'GET');
          if (res && !res.error && res.data) {
              setLogs(res.data);
              setTotalPages(res.totalPages || 1);
              setCurrentPage(res.page || 1);
          }
      } catch (e) {
          console.error("Errore fetch logs:", e);
      }
      setLoading(false);
  };

  // Caricamento iniziale e su cambio pagina/filtri
  useEffect(() => {
      const timer = setTimeout(() => {
          fetchLogs();
      }, 300); // Debounce di 300ms per la ricerca
      return () => clearTimeout(timer);
  }, [currentPage, filterType, searchTerm]); // Aggiunto searchTerm alle dipendenze

  const renderNote = (note) => {
    if (!note) return '-';
    const match = note.match(/#(\d{2}\/P\d{3})/);
    if (!match) return note;
    const prepNumber = match[1];
    const prep = preparations.find(p => p.prepNumber === prepNumber);
    if (!prep) return note;
    const parts = note.split(`#${prepNumber}`);
    return (
      <span>
        {parts[0]}
        <button onClick={() => handleShowPreparation(prep.id)} className="text-teal-600 font-bold hover:underline">#{prepNumber}</button>
        {parts[1]}
      </span>
    );
  };

  const handleConfirmDelete = async (id) => {
      if (window.confirm("Sei sicuro di voler eliminare questa riga di log? Questa azione non ripristina la giacenza, elimina solo la traccia.")) {
          await handleDeleteLog(id);
          fetchLogs(); // Ricarica dopo eliminazione
      }
  };

  // Wrapper per handleClearLogs che poi ricarica
  const onClearLogs = async () => {
      await handleClearLogs();
      fetchLogs();
  };

  const [showClearPanel, setShowClearPanel] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleClearByDate = async () => {
    if (!startDate || !endDate) return alert("Date mancanti");
    if (window.confirm(`Cancellare log dal ${startDate} al ${endDate}?`)) {
        // Logica clear custom? handleClearLogs usa parametri?
        // handleClearLogs in MainApp chiama API clear_logs.
        // Qui dovremmo chiamare direttamente l'API se handleClearLogs non supporta parametri o modificarla.
        // handleClearLogs in MainApp supporta options!
        // Ma handleClearLogs (prop) è vincolata?
        // In MainApp: const handleClearLogs = async (options) => ...
        // Quindi possiamo passare options.
        await handleClearLogs({ mode: 'range', startDate, endDate });
        fetchLogs();
    }
  };

  const handleClearAll = async () => {
      if (window.confirm("Cancellare TUTTO?")) {
          await handleClearLogs({ mode: 'all' });
          fetchLogs();
      }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-md border border-slate-200 shadow-sm flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4 w-full sm:w-auto flex-1">
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-2.5 text-slate-400 h-4 w-4" />
                    <input 
                        type="text" 
                        value={searchTerm} 
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} // Reset pagina su ricerca
                        placeholder="Cerca sostanza, operatore..." 
                        className="pl-9 pr-4 py-2 border border-slate-300 rounded-md text-sm w-full focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                </div>
                <select 
                    value={filterType} 
                    onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }} 
                    className="border border-slate-300 rounded-md py-2 px-3 text-sm bg-white"
                >
                    <option value="all">Tutte le azioni</option>
                    <option value="CARICO">Carico</option>
                    <option value="SCARICO">Scarico</option>
                    <option value="SMALTIMENTO">Smaltimento</option>
                    <option value="ANNULLAMENTO">Annullamento</option>
                    <option value="RETTIFICA">Rettifica</option>
                </select>
                <button onClick={() => fetchLogs()} className="p-2 bg-slate-100 hover:bg-slate-200 rounded text-slate-600" title="Ricarica">
                    <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                </button>
            </div>
            
            {isAdmin && (
              <button
                  onClick={() => setShowClearPanel(!showClearPanel)}
                  className="flex items-center gap-2 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-md whitespace-nowrap"
              >
                  <Trash2 size={16} /> Opzioni Pulizia
              </button>
            )}
        </div>

        {showClearPanel && isAdmin && (
            <div className="border-t pt-4 space-y-4 animate-in fade-in">
                <div className="flex flex-col sm:flex-row items-end gap-4 p-4 bg-slate-50 border rounded-lg">
                    <div className="flex-1 w-full">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data Inizio</label>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full border p-2 rounded-md"/>
                    </div>
                    <div className="flex-1 w-full">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data Fine</label>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full border p-2 rounded-md"/>
                    </div>
                    <button onClick={handleClearByDate} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2 w-full sm:w-auto justify-center">
                        <Calendar size={16} /> Cancella Periodo
                    </button>
                </div>
                <div className="flex justify-center p-4 bg-red-50 border border-red-200 rounded-lg">
                    <button onClick={handleClearAll} className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-2 rounded-md flex items-center gap-2">
                        <AlertTriangle size={16} /> Cancella TUTTO
                    </button>
                </div>
            </div>
        )}
      </div>

      <Card>
        <div className="overflow-auto" style={{ maxHeight: '65vh' }}>
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-semibold whitespace-nowrap">Data</th>
                <th className="px-6 py-3 font-semibold whitespace-nowrap">Tipo</th>
                <th className="px-6 py-3 font-semibold whitespace-nowrap">Sostanza</th>
                <th className="px-6 py-3 font-semibold whitespace-nowrap">N.I.</th>
                <th className="px-6 py-3 font-semibold text-right whitespace-nowrap">Quantità</th>
                <th className="px-6 py-3 font-semibold whitespace-nowrap">Note</th>
                <th className="px-6 py-3 font-semibold text-center whitespace-nowrap">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                  <tr><td colSpan="7" className="px-6 py-8 text-center text-slate-400">Caricamento...</td></tr>
              ) : logs.length > 0 ? (
                logs.map(log => (
                  <tr key={log.id}>
                    <td className="px-6 py-3 whitespace-nowrap text-slate-700">{formatDate(log.date)}</td>
                    <td className="px-6 py-3 whitespace-nowrap"><Badge type={log.type === 'CARICO' ? 'success' : log.type === 'SMALTIMENTO' ? 'dark' : 'warning'}>{log.type}</Badge></td>
                    <td className="px-6 py-3 whitespace-nowrap font-medium text-slate-800">{log.substance}</td>
                    <td className="px-6 py-3 font-mono text-xs whitespace-nowrap">{log.ni}</td>
                    <td className={`px-6 py-3 text-right font-mono font-bold whitespace-nowrap ${(log.type === 'CARICO' || log.type === 'ANNULLAMENTO') ? 'text-green-600' : 'text-red-600'}`}>
                      {log.quantity !== null ? (
                        <>{(log.type === 'CARICO' || log.type === 'ANNULLAMENTO') ? '+' : '-'}{Number(log.quantity).toFixed(2)} {log.unit}</>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-3 text-slate-500 text-xs whitespace-nowrap max-w-xs truncate" title={log.notes}>{renderNote(log.notes)}</td>
                    <td className="px-6 py-3 text-center whitespace-nowrap">
                        {isAdmin && (
                            <button 
                                onClick={() => handleConfirmDelete(log.id)} 
                                className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-full transition-colors"
                                title="Elimina riga"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="7" className="px-6 py-8 text-center text-slate-400 italic">Nessun movimento trovato.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Paginazione */}
        <div className="flex justify-between items-center p-4 border-t border-slate-100 bg-slate-50 rounded-b-lg">
            <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} 
                disabled={currentPage === 1 || loading}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-white border border-transparent hover:border-slate-200 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
                Precedente
            </button>
            <span className="text-xs font-mono text-slate-500">
                Pagina {currentPage} di {totalPages}
            </span>
            <button 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} 
                disabled={currentPage === totalPages || loading}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-white border border-transparent hover:border-slate-200 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
                Successiva
            </button>
        </div>
      </Card>
    </div>
  );
};

export default Logs;
