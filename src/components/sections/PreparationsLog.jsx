import React, { useState } from 'react';
import { Hash, Calendar, Pencil, Trash2, Filter, X, Search, ChevronDown, ChevronUp, Stethoscope, FlaskConical, Printer, Copy, User, Pill, ArrowRight } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { generateLabelPDF } from '../../services/labelGenerator';

const PreparationCard = ({ prep, isExpanded, toggleExpand, handleJumpToStep, handleDeletePreparation, handleDuplicatePreparation, canEdit, pharmacySettings }) => {
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
            <div className="flex items-center gap-1 font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded w-fit text-sm">
              <Hash size={12} /> {prep.prepNumber}
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <Calendar size={10} /> {prep.date}
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
                <span className="text-slate-500">Scadenza:</span> <span className="font-medium text-red-600">{prep.expiryDate}</span>
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
                      <span className="text-[10px] text-slate-400 block ml-1">Lotto/NI: {ing.ni || ing.lot || '-'}</span>
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
                onClick={(e) => { e.stopPropagation(); generateLabelPDF(prep, pharmacySettings); }} 
                className="w-full text-left px-3 py-2 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 flex items-center gap-2 transition-colors text-sm font-medium"
              >
                <Printer size={16} /> Stampa Etichetta
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
                  
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDeletePreparation(prep.id); }} 
                    className="w-full text-left px-3 py-2 bg-white border border-red-100 text-red-600 rounded hover:bg-red-50 flex items-center gap-2 transition-colors text-sm mt-auto"
                  >
                    <Trash2 size={16} /> Elimina
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const PreparationsLog = ({ preparations, handleJumpToStep, handleDeletePreparation, handleDuplicatePreparation, activeFilter, clearFilter, searchTerm, setSearchTerm, prepTypeFilter, setPrepTypeFilter, canEdit, pharmacySettings }) => {
  const [expandedId, setExpandedId] = useState(null);
  const filteredPrepName = activeFilter && preparations.length === 1 ? preparations[0].name : null;

  const toggleExpand = (id) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  return (
    <div className="space-y-6">
       {/* FILTRI E RICERCA */}
       <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-lg border border-slate-200 shadow-sm gap-4">
        <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-2.5 text-slate-400 h-4 w-4" />
            <input 
                type="text" 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                placeholder="Cerca per nome, paziente, n.p..." 
                className="pl-9 pr-4 py-2 border border-slate-300 rounded-md text-sm w-full sm:w-72 focus:ring-2 focus:ring-teal-500 outline-none transition-all"
            />
        </div>

        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 w-full sm:w-auto">
          {['all', 'magistrale', 'officinale'].map((type) => (
            <button 
              key={type}
              onClick={() => setPrepTypeFilter(type)}
              className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-xs font-bold capitalize transition-all ${prepTypeFilter === type ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {type === 'all' ? 'Tutte' : type}
            </button>
          ))}
        </div>
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

      {/* LISTA PREPARAZIONI (ACCORDION) */}
      <div className="space-y-3">
        {preparations.length > 0 ? (
          preparations.map(prep => (
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
            />
          ))
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
