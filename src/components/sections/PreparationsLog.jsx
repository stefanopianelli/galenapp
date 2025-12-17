import React from 'react';
import { Hash, Calendar, Pencil, Trash2 } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';

const PreparationsLog = ({ preparations, handleEditPreparation, handleDeletePreparation }) => {
  return (
    <div className="space-y-4">
      <Card>
        <div className="overflow-auto" style={{ maxHeight: '80vh' }}>
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-semibold whitespace-nowrap">Data / N.P.</th>
                <th className="px-6 py-3 font-semibold whitespace-nowrap">Preparazione & Forma</th>
                <th className="px-6 py-3 font-semibold whitespace-nowrap">Paziente / Medico</th>
                <th className="px-6 py-3 font-semibold whitespace-nowrap">Ingredienti & Lotti</th>
                <th className="px-6 py-3 font-semibold text-center whitespace-nowrap">Stato</th>
                <th className="px-6 py-3 font-semibold text-center whitespace-nowrap">Prezzo</th>
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
                    <div className="font-bold text-slate-800">{prep.name}</div>
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
                    <Badge type="success">Completata</Badge>
                  </td>
                  <td className="px-6 py-4 text-center font-bold text-teal-700 whitespace-nowrap">
                    {prep.totalPrice ? `€ ${parseFloat(prep.totalPrice).toFixed(2)}` : '-'}
                  </td>
                  <td className="px-6 py-4 text-center whitespace-nowrap">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => handleEditPreparation(prep)}
                        className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
                        title="Modifica"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDeletePreparation(prep.id)}
                        className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded transition-colors"
                        title="Elimina"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {preparations.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-slate-400 italic">
                    Nessuna preparazione registrata.
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
