import React, { useState } from 'react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { Trash2, Calendar, AlertTriangle } from 'lucide-react';

const Logs = ({ logs, preparations, handleShowPreparation, handleClearLogs }) => {
  const [showClearPanel, setShowClearPanel] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

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

  const handleClearByDate = () => {
    if (!startDate || !endDate) {
      alert("Seleziona sia una data di inizio che una data di fine.");
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
        alert("La data di inizio non può essere successiva alla data di fine.");
        return;
    }
    if (window.confirm(`Sei sicuro di voler cancellare tutti i movimenti dal ${startDate} al ${endDate}? L'operazione è irreversibile.`)) {
      handleClearLogs({ mode: 'range', startDate, endDate });
    }
  };

  const handleClearAll = () => {
    if (window.confirm("ATTENZIONE: Stai per cancellare TUTTO il registro movimenti. L'operazione è irreversibile. Sei assolutamente sicuro?")) {
      handleClearLogs({ mode: 'all' });
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-md border border-slate-200 shadow-sm flex flex-col gap-4">
        <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800">Opzioni Registro</h2>
            <button
                onClick={() => setShowClearPanel(!showClearPanel)}
                className="flex items-center gap-2 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-md"
            >
                <Trash2 size={16} /> Pulisci Registro
            </button>
        </div>
        {showClearPanel && (
            <div className="border-t pt-4 space-y-4 animate-in fade-in">
                <div className="flex items-end gap-4 p-4 bg-slate-50 border rounded-lg">
                    <div className="flex-1">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data Inizio</label>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full border p-2 rounded-md"/>
                    </div>
                    <div className="flex-1">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data Fine</label>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full border p-2 rounded-md"/>
                    </div>
                    <button
                        onClick={handleClearByDate}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
                    >
                        <Calendar size={16} /> Cancella per Data
                    </button>
                </div>
                <div className="flex items-center justify-center p-4 bg-red-50 border border-red-200 rounded-lg">
                    <button
                        onClick={handleClearAll}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-2 rounded-md flex items-center gap-2"
                    >
                        <AlertTriangle size={16} /> Cancella TUTTO il Registro
                    </button>
                </div>
            </div>
        )}
      </div>

      <Card>
        <div className="overflow-auto" style={{ maxHeight: '70vh' }}>
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-semibold whitespace-nowrap">Data</th>
                <th className="px-6 py-3 font-semibold whitespace-nowrap">Tipo</th>
                <th className="px-6 py-3 font-semibold whitespace-nowrap">Sostanza</th>
                <th className="px-6 py-3 font-semibold whitespace-nowrap">N.I.</th>
                <th className="px-6 py-3 font-semibold text-right whitespace-nowrap">Quantità</th>
                <th className="px-6 py-3 font-semibold whitespace-nowrap">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map(log => (
                <tr key={log.id}>
                  <td className="px-6 py-3 whitespace-nowrap text-slate-700">{log.date}</td>
                  <td className="px-6 py-3 whitespace-nowrap"><Badge type={log.type === 'CARICO' ? 'success' : log.type === 'SMALTIMENTO' ? 'dark' : 'warning'}>{log.type}</Badge></td>
                  <td className="px-6 py-3 whitespace-nowrap font-medium text-slate-800">{log.substance}</td>
                  <td className="px-6 py-3 font-mono text-xs whitespace-nowrap">{log.ni}</td>
                  <td className={`px-6 py-3 text-right font-mono font-bold whitespace-nowrap ${(log.type === 'CARICO' || log.type === 'ANNULLAMENTO') ? 'text-green-600' : 'text-red-600'}`}>
                    {log.quantity !== null ? (
                      <>{(log.type === 'CARICO' || log.type === 'ANNULLAMENTO') ? '+' : '-'}{Number(log.quantity).toFixed(2)} {log.unit}</>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-6 py-3 text-slate-500 text-xs whitespace-nowrap">{renderNote(log.notes)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Logs;