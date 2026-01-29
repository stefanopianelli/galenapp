import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';

const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = "Conferma", 
  cancelText = "Annulla",
  isDangerous = false 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md animate-in fade-in zoom-in-95 border border-slate-100">
        
        <div className="flex flex-col items-center text-center mb-6">
          <div className={`p-3 rounded-full mb-4 ${isDangerous ? 'bg-red-100 text-red-500' : 'bg-amber-100 text-amber-500'}`}>
            {isDangerous ? <AlertTriangle size={32} /> : <Info size={32} />}
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">
            {title}
          </h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            {message}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className={`flex-1 px-4 py-2.5 rounded-lg font-bold text-white shadow-lg transition-all ${
              isDangerous 
                ? 'bg-red-500 hover:bg-red-600 shadow-red-500/30' 
                : 'bg-teal-600 hover:bg-teal-700 shadow-teal-600/30'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;