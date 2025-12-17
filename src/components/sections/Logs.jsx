import React from 'react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';

const Logs = ({ logs }) => {
  return (
    <div className="space-y-4">
      <Card>
        <div className="overflow-auto" style={{ maxHeight: '80vh' }}>
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
                  <td className="px-6 py-3 text-right font-mono font-bold whitespace-nowrap">{log.quantity} {log.unit}</td>
                  <td className="px-6 py-3 text-slate-500 text-xs whitespace-nowrap">{log.notes}</td>
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
