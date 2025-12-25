import React from 'react';
import { FlaskConical, Stethoscope } from 'lucide-react';

const PrepTypeSelectionModal = ({ isOpen, onClose, onSelectType }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md animate-in fade-in zoom-in-95">
        <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">
          Seleziona Tipo di Preparazione
        </h2>
        <div className="flex flex-col gap-4">
          <button
            onClick={() => onSelectType('magistrale')}
            className="flex items-center justify-center gap-3 p-4 bg-teal-500 text-white rounded-lg text-lg font-semibold hover:bg-teal-600 transition-colors shadow-md"
          >
            <Stethoscope size={24} /> Preparazione Magistrale
          </button>
          <button
            onClick={() => onSelectType('officinale')}
            className="flex items-center justify-center gap-3 p-4 bg-blue-500 text-white rounded-lg text-lg font-semibold hover:bg-blue-600 transition-colors shadow-md"
          >
            <FlaskConical size={24} /> Preparazione Officinale
          </button>
        </div>
        <div className="mt-6 text-center">
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 text-sm"
          >
            Annulla
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrepTypeSelectionModal;
