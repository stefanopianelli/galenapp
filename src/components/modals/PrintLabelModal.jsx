import React, { useState } from 'react';
import { Printer, X, Check } from 'lucide-react';

const ROLL_FORMATS = [
  { value: 62, label: '62mm (Standard)' },
  { value: 54, label: '54mm' },
  { value: 50, label: '50mm' }
  // { value: 38, label: '38mm' },
  // { value: 29, label: '29mm' }
];

const PrintLabelModal = ({ isOpen, onClose, onConfirm }) => {
  const [selectedFormat, setSelectedFormat] = useState(62);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
        <div className="flex justify-between items-center mb-4 border-b pb-3">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Printer size={20} className="text-teal-600" /> Stampa Etichetta
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-3">Seleziona Larghezza Rotolo:</label>
          <div className="grid grid-cols-1 gap-2">
            {ROLL_FORMATS.map((fmt) => (
              <button
                key={fmt.value}
                onClick={() => setSelectedFormat(fmt.value)}
                className={`flex items-center justify-between px-4 py-3 rounded-md border text-sm transition-all ${
                  selectedFormat === fmt.value
                    ? 'border-teal-500 bg-teal-50 text-teal-800 font-bold ring-1 ring-teal-500'
                    : 'border-slate-200 hover:border-teal-300 text-slate-600'
                }`}
              >
                <span>{fmt.label}</span>
                {selectedFormat === fmt.value && <Check size={16} className="text-teal-600" />}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-md transition-colors text-sm">
            Annulla
          </button>
          <button 
            onClick={() => onConfirm(selectedFormat)} 
            className="px-6 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 font-bold shadow-sm transition-colors text-sm flex items-center gap-2"
          >
            <Printer size={16} /> Stampa
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrintLabelModal;