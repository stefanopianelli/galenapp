import React, { useState, useEffect } from 'react';
import { Package, Biohazard, Loader2, FileUp, FileText, Trash2, ScanSearch, FileDown, History } from 'lucide-react';
import { UPLOADS_BASE_URL } from '../../constants/config';

const SubstanceModal = ({
  isOpen,
  onClose,
  isReadOnly,
  editingSubstance,
  substanceData,
  setSubstanceData,
  onSubmit,
  getNextNi,
  handleSdsUpload,
  isAnalyzingPdf,
  handleRemoveSds,
  handleDownloadPdf,
  preparations,
  onShowPreparation
}) => {
  const [activeModalTab, setActiveModalTab] = useState('general');

  useEffect(() => {
    if (isOpen) {
      setActiveModalTab('general');
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const relatedPreparations = substanceData?.id && preparations
    ? preparations.filter(p => 
        p.ingredients.some(ing => Number(ing.id) === Number(substanceData.id))
      ) 
    : [];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl p-0 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
            <Package className="text-teal-600" />
            {isReadOnly ? "Dettaglio Sostanza" : editingSubstance ? "Modifica Sostanza" : "Nuovo Carico Sostanza"}
          </h2>
          <div className="flex bg-slate-200 rounded-lg p-1 gap-1">
            <button
              onClick={() => setActiveModalTab('general')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${activeModalTab === 'general' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Dati Generali
            </button>
            <button
              disabled={!substanceData.securityData}
              onClick={() => setActiveModalTab('security')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-all flex items-center gap-1 ${activeModalTab === 'security' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 disabled:text-slate-400'}`}
            >
               <Biohazard size={14} /> Dati Sicurezza
            </button>
             <button
              disabled={relatedPreparations.length === 0}
              onClick={() => setActiveModalTab('preparations')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-all flex items-center gap-1 ${activeModalTab === 'preparations' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 disabled:text-slate-400'}`}
            >
              <History size={14} /> Preparazioni ({relatedPreparations.length})
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {activeModalTab === 'general' ? (
            <form id="substanceForm" onSubmit={onSubmit} className="space-y-4">
               <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nome Sostanza</label>
                  <input required className="w-full border p-2 rounded focus:ring-2 ring-teal-500 outline-none disabled:bg-slate-50 disabled:text-slate-500"
                    value={substanceData.name} onChange={e => setSubstanceData({ ...substanceData, name: e.target.value })} placeholder="Es. Minoxidil Base" disabled={isReadOnly} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Numero Interno (N.I.)</label>
                  <input required className="w-full border p-2 rounded outline-none disabled:bg-slate-50 disabled:text-slate-500"
                    value={substanceData.ni} onChange={e => setSubstanceData({ ...substanceData, ni: e.target.value })} placeholder="Es. 24/S001" disabled={editingSubstance || isReadOnly} />
                  {!editingSubstance && !isReadOnly && <p className="text-[10px] text-slate-400 mt-1">Sugg.: {getNextNi()}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Lotto Fornitore</label>
                  <input required className="w-full border p-2 rounded outline-none disabled:bg-slate-50 disabled:text-slate-500"
                    value={substanceData.lot} onChange={e => setSubstanceData({ ...substanceData, lot: e.target.value })} disabled={isReadOnly} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Data Scadenza</label>
                  <input required type="date" className="w-full border p-2 rounded outline-none disabled:bg-slate-50 disabled:text-slate-500"
                    value={substanceData.expiry} onChange={e => setSubstanceData({ ...substanceData, expiry: e.target.value })} disabled={isReadOnly} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Data Ricezione</label>
                  <input type="date" className="w-full border p-2 rounded outline-none disabled:bg-slate-50 disabled:text-slate-500"
                    value={substanceData.receptionDate} onChange={e => setSubstanceData({ ...substanceData, receptionDate: e.target.value })} disabled={isReadOnly} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Fornitore</label>
                  <input required className="w-full border p-2 rounded outline-none disabled:bg-slate-50 disabled:text-slate-500"
                    value={substanceData.supplier} onChange={e => setSubstanceData({ ...substanceData, supplier: e.target.value })} disabled={isReadOnly} />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">N. DDT</label>
                    <input className="w-full border p-2 rounded outline-none disabled:bg-slate-50 disabled:text-slate-500"
                      value={substanceData.ddtNumber} onChange={e => setSubstanceData({ ...substanceData, ddtNumber: e.target.value })} disabled={isReadOnly} />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Data DDT</label>
                    <input type="date" className="w-full border p-2 rounded outline-none disabled:bg-slate-50 disabled:text-slate-500"
                      value={substanceData.ddtDate} onChange={e => setSubstanceData({ ...substanceData, ddtDate: e.target.value })} disabled={isReadOnly} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Quantità</label>
                    <input required type="number" step="0.01" className="w-full border p-2 rounded outline-none disabled:bg-slate-50 disabled:text-slate-500"
                      value={substanceData.quantity} onChange={e => setSubstanceData({ ...substanceData, quantity: e.target.value })} disabled={isReadOnly} />
                  </div>
                  <div className="w-24">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Unità</label>
                    <select className="w-full border p-2 rounded outline-none disabled:bg-slate-50 disabled:text-slate-500"
                      value={substanceData.unit} onChange={e => setSubstanceData({ ...substanceData, unit: e.target.value })} disabled={isReadOnly}>
                      <option value="g">g</option>
                      <option value="ml">ml</option>
                      <option value="kg">kg</option>
                      <option value="mg">mg</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Costo Sostanza (€)</label>
                    <input type="number" step="0.01" className="w-full border p-2 rounded outline-none disabled:bg-slate-50 disabled:text-slate-500"
                      value={substanceData.totalCost} onChange={e => setSubstanceData({ ...substanceData, totalCost: e.target.value })} placeholder="0.00" disabled={isReadOnly} />
                  </div>
                  <div className="w-32">
                    <label className="block text-sm font-medium text-slate-700 mb-1">€/g (Auto)</label>
                    <input type="text" className="w-full border p-2 rounded outline-none bg-slate-100 disabled:text-slate-500"
                      value={substanceData.costPerGram} readOnly placeholder="0.00" disabled={isReadOnly} />
                  </div>
                </div>
                <div className="col-span-2 flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Data Primo Utilizzo</label>
                    <input type="date" className="w-full border p-2 rounded outline-none bg-slate-50 disabled:text-slate-500"
                      value={substanceData.firstUseDate || ''} disabled />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Data Fine Utilizzo</label>
                    <input type="date" className="w-full border p-2 rounded outline-none bg-slate-50 disabled:text-slate-500"
                      value={substanceData.endUseDate || ''} disabled />
                  </div>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-4 mt-6">
                <label className="block text-sm font-bold text-blue-800 mb-2 flex items-center gap-2">
                  <FileUp size={16} /> Carica Scheda di Sicurezza (PDF)
                </label>
                {substanceData.sdsFile ? (
                  <div className="flex items-center justify-between bg-white p-2 rounded border border-blue-200">
                    <div className="flex items-center gap-2 text-sm text-blue-800 truncate">
                      <FileText size={16} />
                      <span className="truncate">{substanceData.sdsFile instanceof File ? substanceData.sdsFile.name : substanceData.sdsFile}</span>
                    </div>
                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={handleRemoveSds}
                        className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                        title="Rimuovi SDS"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleSdsUpload}
                      disabled={isReadOnly}
                      className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    {isAnalyzingPdf && <span className="text-xs text-blue-600 animate-pulse font-medium">Analisi...</span>}
                  </div>
                )}
                <p className="text-[10px] text-blue-400 mt-2">
                  Il sistema analizzerà automaticamente il PDF per estrarre CAS, Pittogrammi e Indicazioni di Pericolo.
                </p>
              </div>
            </form>
          ) : activeModalTab === 'security' ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg flex items-start gap-3"><ScanSearch className="text-amber-600 mt-1" /><div><h4 className="font-bold text-amber-900 text-sm">Dati Estratti da SDS</h4><p className="text-xs text-amber-700 mt-1">Questi dati sono in sola lettura per garantire la conformità.</p></div></div>
              <div className="grid grid-cols-2 gap-6">
                <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Numero CAS</label><div className="p-2 bg-slate-100 rounded border border-slate-200 font-mono text-sm">{substanceData.securityData?.cas || '-'}</div></div>
                <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Numero CE</label><div className="p-2 bg-slate-100 rounded border border-slate-200 font-mono text-sm">{substanceData.securityData?.ceNumber || '-'}</div></div>
                <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Formula Chimica</label><div className="p-2 bg-slate-100 rounded border border-slate-200 font-mono text-sm">{substanceData.securityData?.formula || '-'}</div></div>
                <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Peso Molecolare</label><div className="p-2 bg-slate-100 rounded border border-slate-200 font-mono text-sm">{substanceData.securityData?.molecularWeight || '-'}</div></div>
                <div className="col-span-2"><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Indicazioni di Pericolo (H)</label><div className="p-3 bg-red-50 rounded border border-red-100 text-red-800 text-sm font-medium">{substanceData.securityData?.hazardStatements || '-'}</div></div>
                <div className="col-span-2"><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Pittogrammi GHS</label><div className="flex gap-4 p-4 bg-white border border-slate-200 rounded-lg justify-center">{substanceData.securityData?.pictograms?.map(pic => (<div key={pic} className="flex flex-col items-center"><div className="w-12 h-12 border-2 border-red-600 transform rotate-45 flex items-center justify-center bg-white mb-2"><div className="transform -rotate-45 text-slate-900 font-bold text-xs">{pic === 'GHS02' ? <Flame size={24}/> : pic === 'GHS06' ? <Skull size={24}/> : <AlertTriangle size={24}/>}</div></div><span className="text-[10px] font-mono text-slate-500">{pic}</span></div>))}</div></div>
              </div>
              {substanceData.sdsFile && <div className="mt-4 pt-4 border-t flex justify-between items-center"><div className="flex items-center gap-3"><div className="bg-red-50 p-2 rounded text-red-600"><FileText size={24} /></div><div><h5 className="font-bold text-slate-800 text-sm">Scheda Originale</h5><p className="text-xs text-slate-500">{substanceData.sdsFile instanceof File ? substanceData.sdsFile.name : substanceData.sdsFile}</p></div></div><a href={UPLOADS_BASE_URL} onClick={handleDownloadPdf} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-2 rounded-md transition-colors"><FileDown size={16}/> Scarica PDF</a></div>}
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in">
              <h3 className="font-bold text-slate-800">Storico Preparazioni per {substanceData.name} (Lotto: {substanceData.lot})</h3>
              {relatedPreparations.length > 0 ? (
                <ul className="divide-y divide-slate-200 border-t border-b">
                  {relatedPreparations.map(prep => (
                    <li key={prep.id} className="p-3 hover:bg-slate-50">
                      <button onClick={() => onShowPreparation(prep.id)} className="w-full text-left">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-teal-700">{prep.name}</span>
                          <span className="text-sm font-mono bg-slate-100 px-2 py-0.5 rounded">{prep.prepNumber}</span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          <span>Data: {prep.date}</span> | <span>Paziente: {prep.patient}</span>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center text-slate-500 italic py-8">Nessuna preparazione trovata per questa sostanza.</p>
              )}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          {isReadOnly ? (
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-900 shadow-sm transition-colors">Chiudi</button>
          ) : (
            <>
              <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded transition-colors">Annulla</button>
              {activeModalTab === 'general' ? (
                <button type="submit" form="substanceForm" className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 shadow-sm transition-colors">
                  {editingSubstance ? "Salva Modifiche" : "Registra Carico"}
                </button>
              ) : (
                <button type="button" onClick={() => setActiveModalTab('general')} className="px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-900 shadow-sm transition-colors">
                  Torna a Generali
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubstanceModal;
