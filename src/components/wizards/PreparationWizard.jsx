import React, { useState, useEffect } from 'react';
import { Euro, Plus, Trash2, Save, Sparkles, Loader2, Info, FileDown, Pencil, Check } from 'lucide-react';
import Card from '../ui/Card';
import { NATIONAL_TARIFF_FEES, VAT_RATE, DISPOSAL_FEE, ADDITIONAL_FEE } from '../../constants/tariffs';
import { callGemini } from '../../services/gemini';
import { generateWorkSheetPDF } from '../../services/pdfGenerator';

function PreparationWizard({ inventory, preparations, onComplete, initialData, pharmacySettings, initialStep }) {
  console.log("Wizard Initialized with data:", initialData);
  const [step, setStep] = useState(initialStep || 1);
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  
  const [currentIngredientId, setCurrentIngredientId] = useState('');
  const [amountNeeded, setAmountNeeded] = useState('');

  const [editingIngredientIndex, setEditingIngredientIndex] = useState(null);
  const [tempAmount, setTempAmount] = useState('');
  
  const [containerCost, setContainerCost] = useState(1.50);
  const [professionalFee, setProfessionalFee] = useState(0);
  const [applySurcharge, setApplySurcharge] = useState(false);
  const [applyDisposalFee, setApplyDisposalFee] = useState(false);
  const [extraTechOps, setExtraTechOps] = useState(0);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    setStep(initialStep || 1);
  }, [initialStep, initialData]);

  const [details, setDetails] = useState({ 
    name: '', 
    patient: '', 
    doctor: '', 
    notes: '',
    prepNumber: '', 
    quantity: '', 
    expiryDate: '', 
    pharmaceuticalForm: 'Capsule',
    posology: '' 
  });

  useEffect(() => {
    if (initialData) {
        const isDuplicate = initialData.isDuplicate;
        setDetails({
            name: initialData.name,
            patient: initialData.patient,
            doctor: initialData.doctor,
            notes: initialData.notes || '',
            prepNumber: isDuplicate ? getNextPrepNumber() : initialData.prepNumber,
            quantity: initialData.quantity || '',
            expiryDate: initialData.expiryDate,
            pharmaceuticalForm: initialData.pharmaceuticalForm,
            posology: initialData.posology
        });

        const enrichedIngredients = initialData.ingredients.map(ing => {
            const inventoryItem = (inventory || []).find(item => item.id === ing.id);
            return { ...ing, costPerGram: inventoryItem ? inventoryItem.costPerGram : 0 };
        });
        setSelectedIngredients(enrichedIngredients);
    } else {
      // Reset for new preparation
      setDetails({ 
        name: '', patient: '', doctor: '', notes: '',
        prepNumber: getNextPrepNumber(), 
        quantity: '', expiryDate: '', pharmaceuticalForm: 'Capsule', posology: '' 
      });
      setSelectedIngredients([]);
    }
  }, [initialData, inventory, preparations]);

  const getNextPrepNumber = () => {
    const currentYear = new Date().getFullYear().toString().slice(-2);
    let maxProg = 0;
    (preparations || []).forEach(p => {
        if (p.prepNumber && p.prepNumber.startsWith(`${currentYear}/P`)) {
            try {
                const progNum = parseInt(p.prepNumber.split('/P')[1]);
                if (!isNaN(progNum) && progNum > maxProg) maxProg = progNum;
            } catch (e) { console.error("Could not parse prep number:", p.prepNumber); }
        }
    });
    return `${currentYear}/P${(maxProg + 1).toString().padStart(3, '0')}`;
  };

  const calculateComplexFee = () => {
    const qty = parseFloat(details.quantity) || 0;
    const form = details.pharmaceuticalForm;
    let fee = 0;
    if (form === 'Capsule' || form === 'Cartine') {
        const BASE_QTY = 120;
        fee = 22.00;
        if (qty > BASE_QTY) fee += (Math.ceil((qty - BASE_QTY) / 10) * 2.00);
        else if (qty < BASE_QTY && qty > 0) fee -= (Math.ceil((BASE_QTY - qty) / 10) * 1.00);
        const extraComponents = Math.max(0, selectedIngredients.length - 1);
        fee += (Math.min(extraComponents, 4) * 0.60);
        fee += (extraTechOps * 2.30);
    } else {
        fee = NATIONAL_TARIFF_FEES[form] || 8.00;
        fee += (extraTechOps * 2.30);
    }
    return fee;
  };

  useEffect(() => {
      setProfessionalFee(calculateComplexFee());
  }, [details.pharmaceuticalForm, details.quantity, selectedIngredients, extraTechOps]);

  const getPrepUnit = (form) => {
    if (['Crema', 'Gel', 'Unguento', 'Pasta', 'Polvere'].includes(form)) return 'g';
    if (['Lozione', 'Sciroppo', 'Soluzione Cutanea', 'Soluzione Orale'].includes(form)) return 'ml';
    if (['Capsule', 'Supposte', 'Ovuli', 'Cartine'].includes(form)) return 'n.'; 
    return '-';
  };

  const isStep1Valid = details.name && details.prepNumber && details.quantity && details.pharmaceuticalForm && details.expiryDate && details.patient && details.doctor;

  const getRemainingQuantity = (item) => {
    const used = selectedIngredients.filter(i => i.id === item.id).reduce((acc, curr) => acc + curr.amountUsed, 0);
    return item.quantity - used;
  };

  const availableIngredients = (inventory || []).filter(i => !i.disposed && new Date(i.expiry) > new Date() && getRemainingQuantity(i) > 0);

  const addIngredient = () => {
    if (!currentIngredientId || !amountNeeded) return;
    const item = inventory.find(i => i.id === parseInt(currentIngredientId));
    const remaining = getRemainingQuantity(item);
    if (parseFloat(amountNeeded) > remaining) {
      alert(`Quantità insufficiente!`);
      return;
    }
    setSelectedIngredients([...selectedIngredients, { ...item, amountUsed: parseFloat(amountNeeded) }]);
    setCurrentIngredientId('');
    setAmountNeeded('');
  };
  
  const removeIngredient = (idx) => {
    const newIngredients = [...selectedIngredients];
    newIngredients.splice(idx, 1);
    setSelectedIngredients(newIngredients);
  };

  const handleIngredientAmountChange = (index, newAmount) => {
    const newAmountValue = parseFloat(newAmount);
    if (isNaN(newAmountValue) || newAmountValue < 0) return;
    const updatedIngredients = [...selectedIngredients];
    const ingredient = updatedIngredients[index];
    const originalItem = inventory.find(i => i.id === ingredient.id);
    const otherUses = selectedIngredients.filter((ing, idx) => idx !== index && ing.id === ingredient.id).reduce((acc, curr) => acc + curr.amountUsed, 0);
    const maxAvailable = originalItem.quantity - otherUses;
    if (newAmountValue > maxAvailable) {
      alert(`Quantità non disponibile. Massima disponibile: ${maxAvailable.toFixed(2)} ${ingredient.unit}`);
      updatedIngredients[index].amountUsed = maxAvailable;
    } else {
      updatedIngredients[index].amountUsed = newAmountValue;
    }
    setSelectedIngredients(updatedIngredients);
  };
  
  const startEditingAmount = (index) => {
    console.log("startEditingAmount called for index:", index);
    setEditingIngredientIndex(index);
    setTempAmount(selectedIngredients[index].amountUsed);
  };

  const saveEditingAmount = (index) => {
    handleIngredientAmountChange(index, tempAmount);
    setEditingIngredientIndex(null);
  };

  const calculateTotal = () => {
    const substancesCost = selectedIngredients.reduce((acc, ing) => acc + (ing.costPerGram ? ing.costPerGram * ing.amountUsed : 0), 0);
    let currentFee = parseFloat(professionalFee);
    if (applySurcharge) currentFee += (currentFee * 0.40);
    const disposal = applyDisposalFee ? DISPOSAL_FEE : 0;
    const additional = ADDITIONAL_FEE;
    const net = substancesCost + parseFloat(containerCost) + currentFee + disposal + additional;
    const vat = net * VAT_RATE;
    return { substances: substancesCost, fee: currentFee, disposal, additional, net, vat, final: net + vat };
  };

  const pricing = calculateTotal();

  const handleDownloadWorksheet = () => generateWorkSheetPDF({ details, ingredients: selectedIngredients, pricing }, pharmacySettings);
  const handleSavePreparation = () => {
    if (details.name && selectedIngredients.length > 0) {
      onComplete(selectedIngredients, { ...details, prepUnit: getPrepUnit(details.pharmaceuticalForm), totalPrice: pricing.final });
    }
  };

  const pharmaForms = ['Capsule', 'Crema', 'Gel', 'Unguento', 'Pasta', 'Lozione', 'Sciroppo', 'Soluzione Cutanea', 'Soluzione Orale', 'Polvere', 'Supposte', 'Ovuli', 'Cartine'];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex justify-between mb-8">
        {[1, 2, 3, 4].map(num => (
          <div key={num} className={`flex items-center gap-2 ${step >= num ? 'text-teal-600 font-bold' : 'text-slate-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= num ? 'border-teal-600 bg-teal-50' : 'border-slate-300'}`}>{num}</div>
            <span className="text-sm">{num === 1 ? 'Anagrafica' : num === 2 ? 'Componenti' : num === 3 ? 'Tariffa' : 'Conferma'}</span>
          </div>
        ))}
      </div>

      <Card className="p-8 min-h-[500px]">
        {step === 1 && (
            <div className="space-y-4 animate-in fade-in">
                <h2 className="text-xl font-bold text-slate-800">Anagrafica Ricetta</h2>
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2"><label className="block text-sm font-bold">Nome *</label><input className="w-full border p-3 rounded-md outline-none focus:ring-2 ring-teal-500" value={details.name} onChange={e => setDetails({...details, name: e.target.value})} /></div>
                    <div><label className="block text-sm font-bold">N.P. *</label><input className="w-full border p-3 rounded-md outline-none bg-slate-50 font-mono" value={details.prepNumber} onChange={e => setDetails({...details, prepNumber: e.target.value})} /></div>
                    <div><label className="block text-sm font-bold">Forma *</label><select className="w-full border p-3 rounded-md outline-none bg-white" value={details.pharmaceuticalForm} onChange={e => setDetails({...details, pharmaceuticalForm: e.target.value})}>{pharmaForms.map(f => <option key={f} value={f}>{f}</option>)}</select></div>
                    <div><label className="block text-sm font-bold">Q.tà Totale ({getPrepUnit(details.pharmaceuticalForm)}) *</label><input type="number" step="0.01" className="w-full border p-3 rounded-md outline-none" value={details.quantity} onChange={e => setDetails({...details, quantity: e.target.value})} /></div>
                    <div><label className="block text-sm font-bold">Scadenza *</label><input type="date" className="w-full border p-3 rounded-md outline-none" value={details.expiryDate} onChange={e => setDetails({...details, expiryDate: e.target.value})} /></div>
                    <div><label className="block text-sm font-bold">Paziente *</label><input className="w-full border p-3 rounded-md outline-none" value={details.patient} onChange={e => setDetails({...details, patient: e.target.value})} /></div>
                    <div><label className="block text-sm font-bold">Medico *</label><input className="w-full border p-3 rounded-md outline-none" value={details.doctor} onChange={e => setDetails({...details, doctor: e.target.value})} /></div>
                    <div className="col-span-2"><label className="block text-sm font-bold">Posologia *</label><textarea className="w-full border p-3 rounded-md outline-none h-20 resize-none" value={details.posology} onChange={e => setDetails({...details, posology: e.target.value})} /></div>
                </div>
                <div className="flex justify-end pt-4"><button disabled={!isStep1Valid} onClick={() => setStep(2)} className="bg-teal-600 text-white px-6 py-2 rounded-md hover:bg-teal-700 disabled:opacity-50">Avanti</button></div>
            </div>
        )}
        {step === 2 && (
            <div className="space-y-6 animate-in fade-in">
                <h2 className="text-xl font-bold text-slate-800">Selezione Componenti</h2>
                <div className="bg-blue-50 p-4 rounded-md border border-blue-100 text-sm text-blue-800 mb-4"><p>Seleziona i lotti specifici. Il sistema calcola la giacenza residua.</p></div>
                <div className="flex gap-3 items-end bg-slate-50 p-4 rounded-md border border-slate-200">
                    <div className="flex-1"><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Sostanza (N.I.)</label><select className="w-full border p-2 rounded text-sm outline-none" value={currentIngredientId} onChange={e => setCurrentIngredientId(e.target.value)}><option value="">-- Seleziona --</option>{availableIngredients.map(item => <option key={item.id} value={item.id}>{item.name} (N.I.: {item.ni} | Disp: {getRemainingQuantity(item).toFixed(2)} {item.unit})</option>)}</select></div>
                    <div className="w-32"><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Q.tà</label><input type="number" step="0.01" className="w-full border p-2 rounded text-sm outline-none" value={amountNeeded} onChange={e => setAmountNeeded(e.target.value)} /></div>
                    <button onClick={addIngredient} className="bg-slate-800 text-white px-4 py-2 rounded hover:bg-slate-700 mb-[1px]"><Plus size={18} /></button>
                </div>
                <div className="space-y-2">{selectedIngredients.map((ing, idx) => {
                  console.log(`Render row ${idx}, editingIngredientIndex is: ${editingIngredientIndex}`);
                  return (
                  <div key={idx} className="flex justify-between items-center bg-white p-3 border rounded shadow-sm">
                    <div>
                      <div className="font-bold">{ing.name}</div>
                      <div className="text-xs text-slate-500">N.I.: {ing.ni} | €{ing.costPerGram}/g</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {editingIngredientIndex === idx ? (
                        <input 
                          type="number" 
                          step="0.01" 
                          value={tempAmount} 
                          onChange={(e) => setTempAmount(e.target.value)} 
                          className="w-24 border text-right p-1 rounded-md font-mono font-bold"
                          autoFocus
                          onBlur={() => saveEditingAmount(idx)}
                          onKeyDown={(e) => e.key === 'Enter' && saveEditingAmount(idx)}
                        />
                      ) : (
                        <span className="font-mono font-bold w-24 text-right">{Number(ing.amountUsed).toFixed(2)}</span>
                      )}
                      <span className="text-sm font-mono">{ing.unit}</span>
                      {editingIngredientIndex === idx ? (
                        <button type="button" onClick={() => saveEditingAmount(idx)} className="text-green-600 hover:bg-green-50 p-1.5 rounded-full"><Check size={16} /></button>
                      ) : (
                        <button type="button" onClick={() => startEditingAmount(idx)} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-full"><Pencil size={16} /></button>
                      )}
                      <button type="button" onClick={() => removeIngredient(idx)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-full"><Trash2 size={16} /></button>
                    </div>
                  </div>
                )})}</div>
                <div className="flex justify-between pt-4"><button onClick={() => setStep(1)} className="text-slate-500 hover:underline">Indietro</button><button disabled={selectedIngredients.length === 0} onClick={() => setStep(3)} className="bg-teal-600 text-white px-6 py-2 rounded-md hover:bg-teal-700 disabled:opacity-50">Calcola Prezzo</button></div>
            </div>
        )}
        {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Euro size={24} className="text-teal-600"/> Tariffazione Nazionale</h2>
                <div className="bg-blue-50 border border-blue-200 rounded p-3 text-xs text-blue-800 flex items-start gap-2"><Info size={16} className="mt-0.5 shrink-0" /><div><strong>Dettaglio Calcolo:</strong><br/>{details.pharmaceuticalForm === 'Capsule' || details.pharmaceuticalForm === 'Cartine' ? <>• Base (fino a 120): 22,00 €<br/>• Extra Q.tà: +2,00€ ogni 10 oltre 120 / -1,00€ ogni 10 in meno<br/>• Extra Componenti: +0,60€ (oltre il 1°, max 4)<br/>• Op. Tecnologiche Extra: +2,30€ cad.</> : <>• Tariffa Tabellare Standard</>}</div></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-50 p-4 rounded-md border border-slate-200"><h3 className="font-bold text-sm text-slate-700 mb-3 border-b pb-2">Costo Materie Prime</h3>{selectedIngredients.map((ing, i) => <div key={i} className="flex justify-between text-sm"><span>{ing.name} ({Number(ing.amountUsed).toFixed(2)}{ing.unit})</span><span className="font-mono">€ {(ing.costPerGram * ing.amountUsed).toFixed(2)}</span></div>)}<div className="flex justify-between font-bold text-sm mt-3 pt-2 border-t border-slate-300"><span>Totale Sostanze</span><span>€ {pricing.substances.toFixed(2)}</span></div></div>
                    <div className="bg-slate-50 p-4 rounded-md border border-slate-200 space-y-4">
                        <h3 className="font-bold text-sm text-slate-700 mb-3 border-b pb-2">Onorari & Costi</h3>
                        <div><label className="block text-xs font-bold text-slate-500 mb-1">{applySurcharge ? 'Onorario + 40%' : 'Onorario'}</label><input type="number" className="w-full border p-2 rounded text-right font-mono bg-slate-100" value={professionalFee.toFixed(2)} readOnly /></div>
                        <div className="flex gap-2"><input type="checkbox" checked={applySurcharge} onChange={e => setApplySurcharge(e.target.checked)} /><label className="text-xs text-slate-600">Supplemento 40% (Sost. Pericolose)</label></div>
                        <div><label className="block text-xs font-bold text-slate-500 mb-1">Op. Tecnologiche Extra (+2.30€)</label><input type="number" min="0" className="w-full border p-2 rounded text-right font-mono" value={extraTechOps} onChange={e => setExtraTechOps(parseInt(e.target.value)||0)} /></div>
                        <div><label className="block text-xs font-bold text-slate-500 mb-1">Addizionale</label><input type="text" className="w-full border p-2 rounded text-right font-mono bg-slate-100" value={pricing.additional.toFixed(2)} readOnly /></div>
                        <div className="flex gap-2 mt-2"><input type="checkbox" checked={applyDisposalFee} onChange={e => setApplyDisposalFee(e.target.checked)} /><label className="text-xs text-slate-600">Smaltimento/Sanificazione (+2.50€)</label></div>
                        <div><label className="block text-xs font-bold text-slate-500 mb-1">Costo Recipiente</label><input type="number" step="0.10" className="w-full border p-2 rounded text-right font-mono" value={containerCost} onChange={e => setContainerCost(parseFloat(e.target.value)||0)} /></div>
                    </div>
                </div>
                <div className="bg-teal-50 p-6 rounded-lg border border-teal-200 flex flex-col items-end"><div className="w-full flex justify-between text-sm text-teal-800 mb-1"><span>Totale Netto</span><span>€ {pricing.net.toFixed(2)}</span></div><div className="w-full flex justify-between text-sm text-teal-800 mb-2 border-b border-teal-200 pb-2"><span>IVA (10%)</span><span>€ {pricing.vat.toFixed(2)}</span></div><div className="flex items-baseline gap-4"><span className="text-lg font-bold text-teal-900">PREZZO FINALE</span><span className="text-3xl font-bold text-teal-700">€ {pricing.final.toFixed(2)}</span></div></div>
                <div className="pt-4 flex justify-between"><button onClick={() => setStep(2)} className="text-slate-500 hover:underline">Indietro</button><button onClick={() => setStep(4)} className="bg-teal-600 text-white px-6 py-2 rounded-md hover:bg-teal-700">Avanti a Conferma</button></div>
            </div>
        )}
        {step === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center"><h2 className="text-xl font-bold text-slate-800">Conferma Finale</h2><div className="bg-slate-50 p-6 border rounded-md mt-4"><p className="text-slate-600">Confermi la produzione di <b>{details.name}</b>?</p><p className="text-3xl font-bold mt-2 text-teal-700">€ {pricing.final.toFixed(2)}</p></div></div>
                <div className="pt-4 flex justify-between border-t border-slate-100">
                  <button onClick={() => setStep(3)} className="text-slate-500 hover:underline">Indietro</button>
                  <div className="flex items-center gap-3">
                    <button onClick={handleDownloadWorksheet} className="bg-slate-600 text-white px-6 py-2 rounded-md hover:bg-slate-700 flex items-center gap-2">
                        <FileDown size={18}/> Scarica Foglio
                    </button>
                    <button onClick={handleSavePreparation} className="bg-teal-600 text-white px-6 py-2 rounded-md hover:bg-teal-700 flex items-center gap-2">
                        <Save size={18}/> Salva Preparazione
                    </button>
                  </div>
                </div>
            </div>
        )}
      </Card>
    </div>
  );
}

export default PreparationWizard;
