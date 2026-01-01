import React from 'react';
import { X } from 'lucide-react';

const operations = [
  { code: 'OP01', text: 'Pesata' },
  { code: 'OP02', text: 'Misura Volumetrica' },
  { code: 'OP03', text: 'Dissoluzione' },
  { code: 'OP04', text: 'Diluizione' },
  { code: 'OP05', text: 'Miscelazione' },
  { code: 'OP06', text: 'Ripartizione' },
  { code: 'OP07', text: 'Riscaldamento' },
  { code: 'OP08', text: 'Sterilizzazione' },
  { code: 'OP09', text: 'Filtrazione' },
  { code: 'OP10', text: 'Polverizzazione' },
  { code: 'OP11', text: 'Triturazione' },
  { code: 'OP12', text: 'Setacciatura' },
  { code: 'OP13', text: 'Test Analitici' },
  { code: 'OP14', text: 'Misura del PH' },
  { code: 'OP15', text: 'Agitazione' },
  { code: 'OP16', text: 'Dinamizzazione' },
  { code: 'OP17', text: 'Essiccamento' },
  { code: 'OP18', text: 'Estrazione' },
  { code: 'OP19', text: 'Gelificazione' },
  { code: 'OP20', text: 'Impregnazione' },
  { code: 'OP21', text: 'Incorporazione' },
  { code: 'OP22', text: 'Levigazione' },
  { code: 'OP23', text: 'Macinazione' },
  { code: 'OP24', text: 'Micronizzazione' },
  { code: 'OP25', text: 'Raffreddamento' },
  { code: 'OP26', text: 'Riempimento' },
  { code: 'OP27', text: 'Rivestimento' },
  { code: 'OP28', text: 'Misura della densità' },
  { code: 'OP29', text: 'Fusione' },
  { code: 'OP30', text: 'Concentrazione' },
  { code: 'OP31', text: 'Gastroresistenza' },
  { code: 'OP32', text: 'Compressione' },
  { code: 'OP33', text: 'Unità in capsule' },
  { code: 'OP34', text: 'Prelievo' },
  { code: 'OP35', text: 'Imbibizione' },
  { code: 'OP36', text: 'Sospensione' },
  { code: 'OP37', text: 'Sonicazione' },
  { code: 'OP38', text: 'Decarbossilazione' },
  { code: 'OP39', text: 'Corrente di azoto' },
  { code: 'OP40', text: 'Blisteratura' }
];

export const TechOpsList = operations; // Esporta la lista per poterla usare altrove

const TechOpsModal = ({ isOpen, onClose, selectedOps, onOpChange }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold text-slate-800">Seleziona Operazioni Tecnologiche</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
            {operations.map(op => (
              <label key={op.code} className="flex items-center gap-2 p-2 rounded-md hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedOps.includes(op.code)}
                  onChange={() => onOpChange(op.code)}
                  className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                <span className="text-sm font-mono text-slate-500">{op.code}</span>
                <span className="text-sm text-slate-700">{op.text}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="p-4 bg-slate-50 border-t flex justify-end">
          <button
            onClick={onClose}
            className="bg-teal-600 text-white px-6 py-2 rounded-md hover:bg-teal-700"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};

export default TechOpsModal;
