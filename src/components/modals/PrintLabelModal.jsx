import React, { useState } from 'react';
import { Printer, X, Check } from 'lucide-react';

const ROLL_HEIGHTS = [
  { value: 62, label: '62mm' },
  { value: 57, label: '57mm' },
  { value: 54, label: '54mm' },
  { value: 40, label: '40mm' }
];

const LABEL_LENGTHS = [
  { value: 60, label: '60mm (Piccola)' },
  { value: 80, label: '80mm (Media)' },
  { value: 100, label: '100mm (Standard)' },
  { value: 130, label: '130mm (Lunga)' }
];

const PrintLabelModal = ({ isOpen, onClose, onConfirm }) => {
  const [selectedHeight, setSelectedHeight] = useState(62);
  const [selectedLength, setSelectedLength] = useState(100);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-6 border-b pb-3">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Printer size={20} className="text-teal-600" /> Stampa Etichetta
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6 mb-8">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">1. Altezza Rotolo (mm)</label>
            <div className="grid grid-cols-4 gap-2">
              {ROLL_HEIGHTS.map((h) => (
                <button
                  key={h.value}
                  onClick={() => setSelectedHeight(h.value)}
                  className={`py-2 px-1 rounded-md text-sm font-medium transition-all border ${
                    selectedHeight === h.value
                      ? 'bg-teal-600 text-white border-teal-600 shadow-md'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300'
                  }`}
                >
                  {h.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">2. Lunghezza Taglio (mm)</label>
            <div className="grid grid-cols-2 gap-2">
              {LABEL_LENGTHS.map((l) => (
                <button
                  key={l.value}
                  onClick={() => setSelectedLength(l.value)}
                  className={`py-2 px-3 rounded-md text-sm font-medium transition-all border flex justify-between items-center ${
                    selectedLength === l.value
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                  }`}
                >
                  <span>{l.label}</span>
                  {selectedLength === l.value && <Check size={16} />}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-md transition-colors text-sm font-medium">
            Annulla
          </button>
          <button 
            onClick={() => onConfirm({ width: selectedLength, height: selectedHeight })} 
            className="px-6 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 font-bold shadow-sm transition-colors text-sm flex items-center gap-2"
          >
            <Printer size={18} /> Stampa
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrintLabelModal;