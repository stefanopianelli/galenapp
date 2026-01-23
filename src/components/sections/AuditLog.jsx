import React, { useState, useEffect } from 'react';
import { Shield, Search, RefreshCw } from 'lucide-react';
import Card from '../ui/Card';
import { useApi } from '../../hooks/useApi';

const AuditLog = () => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { createApiRequest } = useApi();

  const fetchAuditLogs = async (page = 1) => {
      setLoading(true);
      try {
          const res = await createApiRequest(`get_audit_logs&page=${page}&limit=50`, null, false, 'GET');
          if (res && !res.error && res.data) {
              setAuditLogs(res.data);
              setTotalPages(res.totalPages || 1);
              setCurrentPage(res.page || 1);
          } else {
              setAuditLogs([]);
          }
      } catch (e) {
          console.error("Errore fetch audit logs:", e);
      }
      setLoading(false);
  };

  useEffect(() => {
      fetchAuditLogs(currentPage);
  }, [currentPage]);

  const handlePageChange = (newPage) => {
      if (newPage >= 1 && newPage <= totalPages) {
          setCurrentPage(newPage);
      }
  };

  const filteredLogs = auditLogs.filter(log => 
      (log.username && log.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.action && log.action.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.details && log.details.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-lg border border-slate-200 shadow-sm gap-4">
          <div className="flex items-center gap-2">
              <Shield className="text-indigo-600" size={24} />
              <h2 className="text-xl font-bold text-slate-800">Audit Log di Sistema</h2>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-2.5 text-slate-400 h-4 w-4" />
                  <input 
                      type="text" 
                      value={searchTerm} 
                      onChange={(e) => setSearchTerm(e.target.value)} 
                      placeholder="Filtra nella pagina corrente..." 
                      className="pl-9 pr-4 py-2 border border-slate-300 rounded-md text-sm w-full outline-none focus:ring-2 ring-indigo-500"
                  />
              </div>
              <button onClick={() => fetchAuditLogs(currentPage)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-md text-slate-600" title="Aggiorna">
                  <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
              </button>
          </div>
      </div>

      <Card className="border-t-4 border-t-indigo-500">
          <div className="overflow-auto" style={{ maxHeight: '65vh' }}>
              <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-semibold sticky top-0 z-10 border-b border-slate-200">
                      <tr>
                          <th className="p-4 whitespace-nowrap">Data e Ora</th>
                          <th className="p-4 whitespace-nowrap">Utente</th>
                          <th className="p-4 whitespace-nowrap">Ruolo</th>
                          <th className="p-4 whitespace-nowrap">Azione</th>
                          <th className="p-4 w-full">Dettagli</th>
                          <th className="p-4 whitespace-nowrap">IP</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      {loading ? (
                          <tr><td colSpan="6" className="p-8 text-center text-slate-400">Caricamento in corso...</td></tr>
                      ) : filteredLogs.length > 0 ? (
                          filteredLogs.map(log => (
                              <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                  <td className="p-4 whitespace-nowrap text-slate-500 font-mono">{new Date(log.timestamp).toLocaleString()}</td>
                                  <td className="p-4 font-bold text-indigo-900">{log.username}</td>
                                  <td className="p-4 text-slate-500"><span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">{log.role}</span></td>
                                  <td className="p-4"><span className="font-mono font-bold text-slate-700 bg-slate-50 border border-slate-200 px-2 py-1 rounded">{log.action}</span></td>
                                  <td className="p-4 text-slate-600 font-mono text-[11px] leading-tight break-all">{log.details}</td>
                                  <td className="p-4 font-mono text-slate-400 text-[10px]">{log.ip_address}</td>
                              </tr>
                          ))
                      ) : (
                          <tr><td colSpan="6" className="p-8 text-center text-slate-400 italic">Nessun log trovato in questa pagina.</td></tr>
                      )}
                  </tbody>
              </table>
          </div>
          {/* Paginazione */}
          <div className="flex justify-between items-center p-4 border-t border-slate-100 bg-slate-50 rounded-b-lg">
              <button 
                  onClick={() => handlePageChange(currentPage - 1)} 
                  disabled={currentPage === 1 || loading}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-white border border-transparent hover:border-slate-200 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                  Precedente
              </button>
              <span className="text-xs font-mono text-slate-500">
                  Pagina {currentPage} di {totalPages}
              </span>
              <button 
                  onClick={() => handlePageChange(currentPage + 1)} 
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

export default AuditLog;
