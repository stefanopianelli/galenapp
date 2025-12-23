import React, { useState, useEffect } from 'react';
import { Package, Biohazard, FileUp, FileText, Trash2, FileDown, History, Pencil, Check, Box } from 'lucide-react';
import { UPLOADS_BASE_URL } from '../../constants/config';
import { GHS_PICTOGRAMS } from '../../constants/ghsPictograms';

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
  handleRemoveSds,
  handleTechnicalSheetUpload,
  handleRemoveTechnicalSheet,
  handleDownloadPdf,
  preparations,
  onShowPreparation,
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
  
  const handleSecurityDataChange = (e) => {
    const { name, value } = e.target;
    setSubstanceData(prev => ({
        ...prev,
        securityData: {
            ...(prev.securityData || {}),
            [name]: value
        }
    }));
  };

  const handlePictogramChange = (code) => {
    const currentPictograms = substanceData.securityData?.pictograms || [];
    const newPictograms = currentPictograms.includes(code)
      ? currentPictograms.filter(p => p !== code)
      : [...currentPictograms, code];

    setSubstanceData(prev => ({
      ...prev,
      securityData: {
        ...prev.securityData,
        pictograms: newPictograms,
      },
    }));
  };

  const relatedPreparations = substanceData?.id && preparations
    ? preparations.filter(p => 
        p.ingredients.some(ing => Number(ing.id) === Number(substanceData.id))
      ) 
    : [];

  const SecurityInput = ({ label, name, value }) => (
    <div>
        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{label}</label>
        <input 
            type="text"
            name={name}
            value={value || ''}
            onChange={handleSecurityDataChange}
            disabled={isReadOnly}
            className="w-full border p-2 rounded outline-none focus:ring-2 ring-teal-500 disabled:bg-slate-50 disabled:text-slate-500"
        />
    </div>
  );
  
  const isContainer = substanceData.isContainer;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl p-0 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
            {isContainer ? <Box className="text-blue-600" /> : <Package className="text-teal-600" />}
            {isReadOnly ? (isContainer ? "Dettaglio Contenitore" : "Dettaglio Sostanza") : editingSubstance ? (isContainer ? "Modifica Contenitore" : "Modifica Sostanza") : (isContainer ? "Nuovo Contenitore" : "Nuovo Carico Sostanza")}
          </h2>
          <div className="flex bg-slate-200 rounded-lg p-1 gap-1">
            <button onClick={() => setActiveModalTab('general')} className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${activeModalTab === 'general' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              Dati Generali
            </button>
            <button onClick={() => setActiveModalTab('security')} className={`px-3 py-1 rounded-md text-sm font-medium transition-all flex items-center gap-1 ${activeModalTab === 'security' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              <Biohazard size={14} /> Dati Sicurezza
            </button>
            <button disabled={relatedPreparations.length === 0} onClick={() => setActiveModalTab('preparations')} className={`px-3 py-1 rounded-md text-sm font-medium transition-all flex items-center gap-1 ${activeModalTab === 'preparations' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 disabled:text-slate-400'}`}>
              <History size={14} /> Preparazioni ({relatedPreparations.length})
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <form id="substanceForm" onSubmit={onSubmit} className="space-y-4">
            {activeModalTab === 'general' && (
              <div className="grid grid-cols-2 gap-4 animate-in fade-in">
                 {!isContainer && (
                   <div className="col-span-2 flex items-center gap-2 bg-slate-50 p-2 rounded border border-slate-200">
                      <input 
                        type="checkbox" 
                        id="isExcipient"
                        checked={substanceData.isExcipient || false} 
                        onChange={e => setSubstanceData({ ...substanceData, isExcipient: e.target.checked })}
                        disabled={isReadOnly}
                        className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500 cursor-pointer"
                      />
                      <label htmlFor="isExcipient" className="text-sm font-bold text-slate-700 cursor-pointer select-none">
                        Questa sostanza è un Eccipiente
                      </label>
                   </div>
                 )}
                 <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">{isContainer ? "Nome Contenitore" : "Nome Sostanza"}</label>
                  <input required className="w-full border p-2 rounded focus:ring-2 ring-teal-500 outline-none disabled:bg-slate-50 disabled:text-slate-500"
                    value={substanceData.name} onChange={e => setSubstanceData({ ...substanceData, name: e.target.value })} placeholder={isContainer ? "Es. Flacone 100ml" : "Es. Minoxidil Base"} disabled={isReadOnly} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Numero Interno (N.I.)</label>
                  <input required className="w-full border p-2 rounded outline-none disabled:bg-slate-50 disabled:text-slate-500"
                    value={substanceData.ni} onChange={e => setSubstanceData({ ...substanceData, ni: e.target.value })} placeholder="Es. 24/S001" disabled={editingSubstance || isReadOnly} />
                  {!editingSubstance && !isReadOnly && <p className="text-[10px] text-slate-400 mt-1">Sugg.: {getNextNi(isContainer)}</p>}
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
                    <input required type="number" step={isContainer ? "1" : "0.01"} className="w-full border p-2 rounded outline-none disabled:bg-slate-50 disabled:text-slate-500"
                      value={substanceData.quantity} onChange={e => setSubstanceData({ ...substanceData, quantity: e.target.value })} disabled={isReadOnly} />
                  </div>
                  <div className="w-24">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Unità</label>
                    <select className="w-full border p-2 rounded outline-none disabled:bg-slate-50 disabled:text-slate-500"
                      value={substanceData.unit} onChange={e => setSubstanceData({ ...substanceData, unit: e.target.value })} disabled={isReadOnly || isContainer}>
                      {isContainer ? (
                        <option value="n.">n.</option>
                      ) : (
                        <>
                          <option value="g">g</option>
                          <option value="ml">ml</option>
                          <option value="kg">kg</option>
                          <option value="mg">mg</option>
                        </>
                      )}
                    </select>
                  </div>
                  <div className="w-32">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Scorta Minima</label>
                    <input type="number" step={isContainer ? "1" : "0.01"} className="w-full border p-2 rounded outline-none disabled:bg-slate-50 disabled:text-slate-500"
                      value={substanceData.minStock || ''} onChange={e => setSubstanceData({ ...substanceData, minStock: e.target.value })} placeholder="Es. 10" disabled={isReadOnly} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Costo Totale (€)</label>
                    <input type="number" step="0.01" className="w-full border p-2 rounded outline-none disabled:bg-slate-50 disabled:text-slate-500"
                      value={substanceData.totalCost} onChange={e => setSubstanceData({ ...substanceData, totalCost: e.target.value })} placeholder="0.00" disabled={isReadOnly} />
                  </div>
                  <div className="w-32">
                    <label className="block text-sm font-medium text-slate-700 mb-1">{isContainer ? "Costo Unitario" : "€/g (Auto)"}</label>
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
            )}
            {activeModalTab === 'security' && (
              <div className="space-y-6 animate-in fade-in">
                <SecurityInput label="Numero CAS" name="cas" value={substanceData.securityData?.cas} />
                <SecurityInput label="Numero CE" name="ceNumber" value={substanceData.securityData?.ceNumber} />
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Indicazioni di Pericolo (H)</label>
                  <textarea 
                      name="hazardStatements"
                      value={substanceData.securityData?.hazardStatements || ''}
                      onChange={handleSecurityDataChange}
                      disabled={isReadOnly}
                      className="w-full border p-2 rounded outline-none focus:ring-2 ring-teal-500 disabled:bg-slate-50 disabled:text-slate-500"
                      rows={3}
                      placeholder="Es. H302, H315"
                  />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Pittogrammi GHS</label>
                    <div className="grid grid-cols-3 gap-x-4 gap-y-2 mt-2 p-4 border rounded-md">
                        {GHS_PICTOGRAMS.map(p => (
                            <label key={p.code} className="flex items-center gap-2 text-sm">
                                <input 
                                    type="checkbox"
                                    checked={substanceData.securityData?.pictograms?.includes(p.code) || false}
                                    onChange={() => handlePictogramChange(p.code)}
                                    disabled={isReadOnly}
                                    className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                                />
                                <img src={p.image} alt={p.description} className="w-8 h-8" />
                                <span>{p.description} ({p.code})</span>
                            </label>
                        ))}
                    </div>
                </div>
                
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mt-6">
                  <label className="block text-sm font-bold text-blue-800 mb-2 flex items-center gap-2">
                    <FileUp size={16} /> Scheda di Sicurezza (SDS)
                  </label>
                  {substanceData.sdsFile ? (
                    <div className="flex items-center justify-between bg-white p-2 rounded border border-blue-200">
                      <div className="flex items-center gap-2 text-sm text-blue-800 truncate">
                        <FileText size={16} />
                        <span className="truncate">{substanceData.sdsFile instanceof File ? substanceData.sdsFile.name : substanceData.sdsFile}</span>
                      </div>
                      <div className="flex items-center">
                        <a href="#" onClick={(e) => handleDownloadPdf(e, substanceData.sdsFile)} className="text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-50 rounded" title="Scarica"><FileDown size={16}/></a>
                        {!isReadOnly && (
                          <button type="button" onClick={handleRemoveSds} className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded" title="Rimuovi"><Trash2 size={16} /></button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <input type="file" accept=".pdf" onChange={handleSdsUpload} disabled={isReadOnly} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed" />
                  )}
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <label className="block text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                    <FileUp size={16} /> Scheda Tecnica
                  </label>
                  {substanceData.technicalSheetFile ? (
                    <div className="flex items-center justify-between bg-white p-2 rounded border border-gray-300">
                      <div className="flex items-center gap-2 text-sm text-gray-800 truncate">
                        <FileText size={16} />
                        <span className="truncate">{substanceData.technicalSheetFile instanceof File ? substanceData.technicalSheetFile.name : substanceData.technicalSheetFile}</span>
                      </div>
                      <div className="flex items-center">
                        <a href="#" onClick={(e) => handleDownloadPdf(e, substanceData.technicalSheetFile)} className="text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-50 rounded" title="Scarica"><FileDown size={16}/></a>
                        {!isReadOnly && (
                          <button type="button" onClick={handleRemoveTechnicalSheet} className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded" title="Rimuovi"><Trash2 size={16} /></button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <input type="file" accept=".pdf" onChange={handleTechnicalSheetUpload} disabled={isReadOnly} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed" />
                  )}
                </div>
              </div>
            )}
             {activeModalTab === 'preparations' && (
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
          </form>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          {isReadOnly ? (
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-900 shadow-sm transition-colors">Chiudi</button>
          ) : (
            <>
              <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded transition-colors">Annulla</button>
              <button type="submit" form="substanceForm" className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 shadow-sm transition-colors">
                {editingSubstance ? "Salva Modifiche" : "Registra Carico"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubstanceModal;