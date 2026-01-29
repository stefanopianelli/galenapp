import React, { useState, useEffect } from 'react';
import { Scale, AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react';
import { useConfirmation } from '../../context/ConfirmationContext';

const UniformityCheck = ({ totalQuantity, unit, ingredients, onUpdate, savedData }) => {
    const confirm = useConfirmation();
    // 1. Calcolo Campione (10% del totale, arrotondato per eccesso, minimo 5 se possibile, ma seguiamo 10% strict)
    const totalUnits = parseInt(totalQuantity) || 0;
    const sampleSize = Math.max(1, Math.ceil(totalUnits * 0.1));

    // 2. Calcolo Peso Teorico Netto (Totale Grammi Sostanze / Numero Unità) * 1000 per mg
    const totalWeightGrams = ingredients.reduce((sum, ing) => {
        // Escludi contenitori e tutto ciò che è misurato in numero (es. capsule vuote)
        if (ing.isContainer || ing.unit === 'n.' || ing.unit === 'unità') return sum;
        
        // Usa la pesata reale (stockDeduction) se c'è, altrimenti teorica
        const qty = ing.stockDeduction && ing.stockDeduction > 0 ? parseFloat(ing.stockDeduction) : parseFloat(ing.amountUsed);
        return sum + qty;
    }, 0);
    
    const theoreticalNetWeightMg = (totalWeightGrams / totalUnits) * 1000;

    // State
    const [tareWeight, setTareWeight] = useState(savedData?.tareWeight ?? '');
    const [measurements, setMeasurements] = useState(savedData?.measurements ?? Array(sampleSize).fill(''));
    
    // Aggiorna array se cambia sampleSize (es. cambio quantità step 1)
    useEffect(() => {
        if (measurements.length !== sampleSize) {
            setMeasurements(prev => {
                const newArr = Array(sampleSize).fill('');
                prev.forEach((val, i) => { if (i < sampleSize) newArr[i] = val; });
                return newArr;
            });
        }
    }, [sampleSize]);

    // Calcolo Risultati
    const results = measurements.map(gross => {
        if (!gross || !tareWeight) return null;
        const g = parseFloat(gross);
        const t = parseFloat(tareWeight);
        const net = g - t;
        const deviation = ((net - theoreticalNetWeightMg) / theoreticalNetWeightMg) * 100;
        const isCompliant = Math.abs(deviation) <= 10;
        return { net, deviation, isCompliant };
    });

    const filledCount = measurements.filter(m => m !== '').length;
    const isComplete = filledCount === sampleSize;
    const allCompliant = isComplete && results.every(r => r && r.isCompliant);
    
    // Notifica al padre
    useEffect(() => {
        onUpdate({
            enabled: true,
            targetWeight: theoreticalNetWeightMg,
            tareWeight: parseFloat(tareWeight) || 0,
            sampleSize,
            measurements: measurements.map(m => parseFloat(m) || 0),
            isCompliant: allCompliant,
            isComplete
        });
    }, [measurements, tareWeight, theoreticalNetWeightMg, allCompliant, isComplete]);

    const handleMeasurementChange = (index, value) => {
        const newM = [...measurements];
        newM[index] = value;
        setMeasurements(newM);
    };

    return (
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Scale className="text-indigo-600" size={24}/> Controllo Uniformità di Massa
                </h3>
                <div className="flex items-center gap-3">
                    {filledCount > 0 && (
                        <button 
                            onClick={() => confirm({
                                title: "Reset Pesate",
                                message: "Vuoi svuotare tutte le pesate inserite?",
                                isDangerous: true,
                                confirmText: "Svuota",
                                onConfirm: () => setMeasurements(Array(sampleSize).fill(''))
                            })}
                            className="text-[10px] font-bold text-red-400 hover:text-red-600 uppercase tracking-wider transition-colors border border-red-100 px-2 py-1 rounded hover:bg-red-50"
                        >
                            Resetta
                        </button>
                    )}
                    <div className={`px-3 py-1 rounded-full text-xs font-bold border ${isComplete ? (allCompliant ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200') : 'bg-slate-200 text-slate-600 border-slate-300'}`}>
                        {!isComplete ? 'IN CORSO...' : (allCompliant ? 'CONFORME' : 'NON CONFORME')}
                    </div>
                </div>
            </div>

            {/* Info Box */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                    <span className="block text-xs font-bold text-slate-400 uppercase">Campione (10%)</span>
                    <span className="text-xl font-mono font-bold text-slate-700">{sampleSize} <span className="text-xs font-normal text-slate-400">unità</span></span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                    <span className="block text-xs font-bold text-slate-400 uppercase">Peso Teorico Netto</span>
                    <span className="text-xl font-mono font-bold text-indigo-600">{theoreticalNetWeightMg.toFixed(1)} <span className="text-xs font-normal text-slate-400">mg</span></span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-indigo-100 shadow-sm">
                    <label className="block text-xs font-bold text-indigo-500 uppercase mb-1">Tara Media Involucro (mg)</label>
                    <input 
                        type="number" 
                        placeholder="Es. 95" 
                        className="w-full bg-indigo-50/50 border-b border-indigo-200 outline-none font-mono font-bold text-lg text-indigo-700 placeholder-indigo-200 focus:border-indigo-500 transition-colors"
                        value={tareWeight}
                        onChange={e => setTareWeight(e.target.value)}
                    />
                </div>
            </div>

            {/* Griglia Inserimento */}
            <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                    Inserimento Pesi Lordi (mg) <Info size={14} className="text-slate-400"/>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {measurements.map((val, idx) => {
                        const res = results[idx];
                        return (
                            <div key={idx} className="relative">
                                <div className="absolute top-2 left-2 text-[10px] text-slate-400 font-bold">#{idx + 1}</div>
                                <input
                                    type="number"
                                    className={`w-full pt-6 pb-2 px-3 text-right font-mono text-sm border rounded-lg outline-none focus:ring-2 transition-all ${
                                        !res ? 'border-indigo-100 bg-white text-slate-800 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm' :
                                        (res.isCompliant ? 'border-green-300 bg-green-50 focus:ring-green-500 text-green-900 font-bold' : 'border-red-300 bg-red-50 focus:ring-red-500 text-red-900 font-bold')
                                    }`}
                                    placeholder="0"
                                    value={val}
                                    onChange={e => handleMeasurementChange(idx, e.target.value)}
                                    disabled={!tareWeight}
                                />
                                {res && (
                                    <div className="flex justify-between items-center px-1 mt-1">
                                        <span className="text-[10px] text-slate-500">Net: <b>{res.net.toFixed(0)}</b></span>
                                        <span className={`text-[10px] font-bold ${res.isCompliant ? 'text-green-600' : 'text-red-600'}`}>
                                            {res.deviation > 0 ? '+' : ''}{res.deviation.toFixed(1)}%
                                        </span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
                {!tareWeight && <p className="text-xs text-amber-600 mt-2 font-medium animate-pulse">⚠ Inserisci la Tara Media per iniziare le pesate.</p>}
            </div>
        </div>
    );
};

export default UniformityCheck;
