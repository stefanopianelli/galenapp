import React, { useState, useEffect } from 'react';
import { Euro, Plus, Trash2, Save, FileDown, Pencil, Check, Info, Box, FlaskConical, ClipboardCheck, ListOrdered, FileText } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { NATIONAL_TARIFF_FEES, VAT_RATE } from '../../constants/tariffs';
import { generateWorkSheetPDF } from '../../services/pdfGenerator';

function PreparationWizard({ inventory, preparations, onComplete, initialData, pharmacySettings, initialStep }) {
  const prepType = initialData?.prepType || 'magistrale';
  const isOfficinale = prepType === 'officinale';
  const totalSteps = isOfficinale ? 6 : 5;

  const [step, setStep] = useState(initialStep || 1);
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  
  const [currentIngredientId, setCurrentIngredientId] = useState('');
  const [amountNeeded, setAmountNeeded] = useState('');

  const [currentContainerId, setCurrentContainerId] = useState('');
  const [containerAmountNeeded, setContainerAmountNeeded] = useState('');

  const [editingIngredientIndex, setEditingIngredientIndex] = useState(null);
  const [tempAmount, setTempAmount] = useState('');
  
  const [professionalFee, setProfessionalFee] = useState(0);
  const [extraTechOps, setExtraTechOps] = useState(0);
  const [batches, setBatches] = useState([]); 

  useEffect(() => {
    setStep(initialStep || 1);
  }, [initialStep, initialData]);

  const [details, setDetails] = useState({ 
    name: '', patient: '', doctor: '', notes: '', prepNumber: '', quantity: '', 
    expiryDate: '', pharmaceuticalForm: 'Capsule', posology: '', warnings: '', recipeDate: '', usage: 'Orale', operatingProcedures: '', prepType: 'magistrale'
  });

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

  useEffect(() => {
    const defaultDetails = {
      name: '', patient: '', doctor: '', notes: '', prepNumber: '', quantity: '', 
      expiryDate: '', pharmaceuticalForm: 'Capsule', posology: '', warnings: '', recipeDate: '', usage: 'Orale', operatingProcedures: '', status: 'Bozza', prepType: 'magistrale', batches: []
    };

    if (initialData) {
        const isDuplicate = initialData.isDuplicate;
        const isNew = !initialData.id;

        setDetails({
            ...defaultDetails, 
            ...initialData,
            prepNumber: (isNew || isDuplicate) ? getNextPrepNumber() : initialData.prepNumber,
            status: initialData.status || 'Bozza'
        });
        
        if (initialData.batches) {
          setBatches(initialData.batches);
        }

        const enrichedIngredients = (initialData.ingredients || []).map(ing => {
          const inventoryItem = (inventory || []).find(item => item.id === ing.id);
          if (!inventoryItem) {
            return { ...ing, securityData: ing.securityData || { pictograms: [] } };
          }
          return {
            id: ing.id, amountUsed: ing.amountUsed,
            name: inventoryItem.name, ni: inventoryItem.ni, unit: inventoryItem.unit,
            costPerGram: inventoryItem.costPerGram || 0,
            isExcipient: inventoryItem.isExcipient || false, isContainer: inventoryItem.isContainer || false,
            isDoping: inventoryItem.isDoping || false, isNarcotic: inventoryItem.isNarcotic || false,
            securityData: inventoryItem.securityData || { pictograms: [] }
          };
        });
        setSelectedIngredients(enrichedIngredients);
    } else {
      setDetails({ 
        ...defaultDetails,
        prepNumber: getNextPrepNumber(), 
      });
      setSelectedIngredients([]);
    }
  }, [initialData, inventory, preparations]);

  const calculateComplexFee = () => {
    const qty = parseFloat(details.quantity) || 0;
    const form = details.pharmaceuticalForm;
    let fee = 0;
    if (form === 'Capsule' || form === 'Cartine') {
        const BASE_QTY = 120;
        fee = 22.00;
        if (qty > BASE_QTY) fee += (Math.ceil((qty - BASE_QTY) / 10) * 2.00);
        else if (qty < BASE_QTY && qty > 0) fee -= (Math.ceil((BASE_QTY - qty) / 10) * 1.00);
        
        const activeSubstancesCount = selectedIngredients.filter(i => !i.isExcipient && !i.isContainer).length;
        const extraComponents = Math.max(0, activeSubstancesCount - 1);
        
        fee += (Math.min(extraComponents, 4) * 0.60);
        fee += (extraTechOps * 2.30);
        fee *= 1.40;
    } else {
        fee = NATIONAL_TARIFF_FEES[form] || 8.00;
        fee += (extraTechOps * 2.30);
    }
    return fee;
  };

  useEffect(() => {
      setProfessionalFee(calculateComplexFee());
  }, [details.pharmaceuticalForm, details.quantity, selectedIngredients, extraTechOps]);

  const handleBatchChange = (containerId, field, value) => {
    setBatches(prevBatches => {
      const existingBatchIndex = prevBatches.findIndex(batch => batch.containerId === containerId);
      const numericValue = parseFloat(value);

      if (existingBatchIndex > -1) {
        const updatedBatches = [...prevBatches];
        updatedBatches[existingBatchIndex] = { ...updatedBatches[existingBatchIndex], [field]: !isNaN(numericValue) ? numericValue : value };
        return updatedBatches;
      } else {
        return [ ...prevBatches, { containerId, [field]: !isNaN(numericValue) ? numericValue : value }];
      }
    });
  };

  const getPrepUnit = (form) => {
    if (['Crema', 'Gel', 'Unguento', 'Pasta', 'Polvere'].includes(form)) return 'g';
    if (['Lozione', 'Sciroppo', 'Soluzione Cutanea', 'Soluzione Orale'].includes(form)) return 'ml';
    if (['Capsule', 'Supposte', 'Ovuli', 'Cartine'].includes(form)) return 'n.'; 
    return '-';
  };

  const isStep1Valid = (() => {
    const baseFields = details.name && details.prepNumber && details.quantity && details.pharmaceuticalForm && details.expiryDate && details.posology && details.warnings && details.usage;
    if (!baseFields) return false;
    if (isOfficinale) return true;
    return !!(details.patient && details.doctor && details.recipeDate);
  })();
  
  const calculateBatchBalance = () => {
    const totalExpected = parseFloat(details.quantity) || 0;
    const totalAllocated = batches.reduce((acc, batch) => {
      const container = selectedIngredients.find(ing => ing.id === batch.containerId);
      const numContainers = container ? parseFloat(container.amountUsed) : 0;
      const qtyPerContainer = parseFloat(batch.productQuantity) || 0;
      return acc + (numContainers * qtyPerContainer);
    }, 0);
    return totalExpected - totalAllocated;
  };

  const getRemainingQuantity = (item) => {
    const used = selectedIngredients.filter(i => i.id === item.id).reduce((acc, curr) => acc + curr.amountUsed, 0);
    return item.quantity - used;
  };

  const availableItems = (inventory || []).filter(i => !i.disposed && new Date(i.expiry) > new Date() && getRemainingQuantity(i) > 0);
  const availableSubstances = availableItems.filter(i => !i.isContainer);
  const availableContainers = availableItems.filter(i => i.isContainer);

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

  const addContainer = () => {
    if (!currentContainerId || !containerAmountNeeded) return;
    const item = inventory.find(i => i.id === parseInt(currentContainerId));
    const remaining = getRemainingQuantity(item);
    if (parseFloat(containerAmountNeeded) > remaining) {
      alert(`Quantità insufficiente!`);
      return;
    }
    setSelectedIngredients([...selectedIngredients, { ...item, amountUsed: parseFloat(containerAmountNeeded) }]);
    setCurrentContainerId('');
    setContainerAmountNeeded('');
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
    setEditingIngredientIndex(index);
    setTempAmount(selectedIngredients[index].amountUsed);
  };

  const saveEditingAmount = (index) => {
    handleIngredientAmountChange(index, tempAmount);
    setEditingIngredientIndex(null);
  };

  const calculateTotal = () => {
    const substancesCost = selectedIngredients.reduce((acc, ing) => acc + (ing.costPerGram ? ing.costPerGram * ing.amountUsed : 0), 0);
    const currentFee = parseFloat(professionalFee);
    
    let additional = 0;
    const hasHighRisk = selectedIngredients.some(ing => 
      (ing.securityData?.pictograms?.length > 0) && ing.isNarcotic
    );

    if (hasHighRisk) {
      additional = 5.00;
    } else {
      const hasMediumRisk = selectedIngredients.some(ing => 
        (ing.securityData?.pictograms?.length > 0) || ing.isDoping || ing.isNarcotic
      );
      if (hasMediumRisk) {
        additional = 2.50;
      }
    }

    const net = substancesCost + currentFee + additional;
    const vat = net * VAT_RATE;
    return { substances: substancesCost, fee: currentFee, disposal: 0, additional, net, vat, final: net + vat };
  };

  const pricing = calculateTotal();

  const handleDownloadWorksheet = () => generateWorkSheetPDF({ details, ingredients: selectedIngredients, pricing }, pharmacySettings);

  const handleFinalSave = () => {
    if (details.name && selectedIngredients.length > 0) {
      onComplete(selectedIngredients, { ...details, prepUnit: getPrepUnit(details.pharmaceuticalForm), totalPrice: pricing.final, batches }, false);
    }
  };

  const handleDraftSave = () => {
    if (!details.name) {
      alert("Per salvare una bozza, il nome della preparazione è obbligatorio.");
      return;
    }
    onComplete(selectedIngredients, { ...details, prepUnit: getPrepUnit(details.pharmaceuticalForm), totalPrice: pricing.final, batches }, true);
  };

  const handleStepClick = (targetStep) => {
    if (initialData?.id && !initialData.isDuplicate) {
      setStep(targetStep);
      return;
    }
    if (targetStep < step) {
      setStep(targetStep);
      return;
    }
    if (targetStep === 2 && isStep1Valid) setStep(2);
    else if (targetStep === 3 && isStep1Valid && selectedIngredients.length > 0) setStep(3);
    else if (targetStep === 4) {
      if (isOfficinale) {
        if (isStep1Valid && selectedIngredients.length > 0) setStep(4);
      } else {
        if (isStep1Valid && selectedIngredients.length > 0) setStep(4); // Vai a "Foglio Lav."
      }
    } else if (targetStep === 5) {
      if (isOfficinale) {
        if (isStep1Valid && selectedIngredients.length > 0 && Math.abs(calculateBatchBalance()) < 0.01) setStep(5);
      } else {
        if (isStep1Valid && selectedIngredients.length > 0) setStep(5); // Vai a "Conferma"
      }
    } else if (targetStep === 6 && isOfficinale) {
        if (isStep1Valid && selectedIngredients.length > 0) setStep(6);
    }
  };

  const getStepLabels = () => {
    const base = ["Anagrafica", "Componenti", "Tariffa"];
    if (isOfficinale) {
      return [...base, "Lotti", "Foglio Lav.", "Conferma"];
    }
    return [...base, "Foglio Lav.", "Conferma"];
  };
  const stepLabels = getStepLabels();

  const pharmaForms = ['Capsule', 'Crema', 'Gel', 'Unguento', 'Pasta', 'Lozione', 'Sciroppo', 'Soluzione Cutanea', 'Soluzione Orale', 'Polvere', 'Supposte', 'Ovuli', 'Cartine'];
  const usageOptions = ['Orale', 'Topica', 'Sublinguale', 'Buccale', 'Rettale', 'Inalatoria', 'Transdermica', 'Vaginale', 'Parenterale'];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Step Indicators (full width) */}
      <div className="flex justify-between mb-4">
        {stepLabels.map((label, index) => {
          const num = index + 1;
          return (
            <div 
              key={num} 
              onClick={() => handleStepClick(num)}
              className={`flex items-center gap-2 cursor-pointer select-none transition-colors ${
                step >= num ? 'text-teal-600 font-bold' : 'text-slate-400 hover:text-slate-500'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                step >= num ? 'border-teal-600 bg-teal-50' : 'border-slate-300 bg-white'
              }`}>
                {num}
              </div>
              <span className="text-sm hidden sm:inline">{label}</span>
            </div>
          )
        })}
      </div>

      {/* Title and Save Draft button */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-slate-800">
            {initialData?.id && !initialData.isDuplicate ? `Modifica Preparazione: ${initialData.prepNumber}` : 'Nuova Preparazione'}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <Badge type={isOfficinale ? "info" : "success"}>{isOfficinale ? "Officinale" : "Magistrale"}</Badge>
            {details.status === 'Bozza' && <Badge type="neutral">Bozza</Badge>}
          </div>
        </div>
        {(step < totalSteps) && (details.status !== 'Completata') && (
          <button 
            onClick={handleDraftSave} 
            className="bg-slate-200 text-slate-700 px-3 py-1.5 rounded-md hover:bg-slate-300 flex items-center gap-1 text-sm shadow-sm transition-colors"
            title="Salva come bozza per continuare più tardi"
          >
            <Save size={16} /> Salva Bozza
          </button>
        )}
      </div>

      <Card className="p-8 min-h-[500px]">
        {step === 1 && (
            <div className="space-y-4 animate-in fade-in">
                <h2 className="text-xl font-bold text-slate-800">Anagrafica Ricetta</h2>
                <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="col-span-2"><label className="block text-sm font-bold">Nome *</label><input className="w-full border p-3 rounded-md outline-none focus:ring-2 ring-teal-500" value={details.name} onChange={e => setDetails({...details, name: e.target.value})} /></div>
                    <div><label className="block text-sm font-bold">N.P. *</label><input className="w-full border p-3 rounded-md outline-none bg-slate-50 font-mono" value={details.prepNumber} readOnly /></div>
                    <div><label className="block text-sm font-bold">Forma *</label><select className="w-full border p-3 rounded-md outline-none bg-white" value={details.pharmaceuticalForm} onChange={e => setDetails({...details, pharmaceuticalForm: e.target.value})}>{pharmaForms.map(f => <option key={f} value={f}>{f}</option>)}</select></div>
                    <div><label className="block text-sm font-bold">Q.tà Totale ({getPrepUnit(details.pharmaceuticalForm)}) *</label><input type="number" step="0.01" className="w-full border p-3 rounded-md outline-none" value={details.quantity} onChange={e => setDetails({...details, quantity: e.target.value})} /></div>
                    <div><label className="block text-sm font-bold">Scadenza *</label><input type="date" className="w-full border p-3 rounded-md outline-none" value={details.expiryDate} onChange={e => setDetails({...details, expiryDate: e.target.value})} /></div>
                    {!isOfficinale && (
                      <>
                        <div><label className="block text-sm font-bold">Paziente *</label><input className="w-full border p-3 rounded-md outline-none" value={details.patient} onChange={e => setDetails({...details, patient: e.target.value})} /></div>
                        <div><label className="block text-sm font-bold">Medico *</label><input className="w-full border p-3 rounded-md outline-none" value={details.doctor} onChange={e => setDetails({...details, doctor: e.target.value})} /></div>
                        <div><label className="block text-sm font-bold">Data Ricetta *</label><input type="date" className="w-full border p-3 rounded-md outline-none" value={details.recipeDate} onChange={e => setDetails({...details, recipeDate: e.target.value})} /></div>
                      </>
                    )}
                    <div className="col-span-2"><label className="block text-sm font-bold">Uso *</label>
                      <select className="w-full border p-3 rounded-md outline-none bg-white" value={details.usage} onChange={e => setDetails({...details, usage: e.target.value})}>
                        {usageOptions.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                    <div className="col-span-2"><label className="block text-sm font-bold">Posologia *</label><textarea className="w-full border p-3 rounded-md outline-none h-20 resize-none" value={details.posology} onChange={e => setDetails({...details, posology: e.target.value})} /></div>
                    <div className="col-span-2"><label className="block text-sm font-bold">Avvertenze *</label><textarea className="w-full border p-3 rounded-md outline-none h-20 resize-none" value={details.warnings} onChange={e => setDetails({...details, warnings: e.target.value})} /></div>
                </div>
                <div className="flex justify-end pt-4"><button disabled={!isStep1Valid} onClick={() => setStep(2)} className="bg-teal-600 text-white px-6 py-2 rounded-md hover:bg-teal-700 disabled:opacity-50">Avanti</button></div>
            </div>
        )}
        
        {step === 2 && ( 
          <div className="space-y-6 animate-in fade-in">
              <h2 className="text-xl font-bold text-slate-800">Selezione Componenti</h2>
              <div className="bg-blue-50 p-4 rounded-md border border-blue-100 text-sm text-blue-800 mb-4 pt-4"><p>Seleziona i lotti specifici. Il sistema calcola la giacenza residua.</p></div>
              
              <div className="space-y-1 mb-4">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><FlaskConical size={14}/> Aggiungi Sostanza</label>
                <div className="flex gap-3 items-end bg-slate-50 p-4 rounded-md border border-slate-200">
                    <div className="flex-1">
                      <select className="w-full border p-2 rounded text-sm outline-none" value={currentIngredientId} onChange={e => setCurrentIngredientId(e.target.value)}>
                        <option value="">-- Seleziona Sostanza --</option>
                        {availableSubstances.map(item => <option key={item.id} value={item.id}>{item.name} (N.I.: {item.ni} | Disp: {getRemainingQuantity(item).toFixed(2)} {item.unit})</option>)}
                      </select>
                    </div>
                    <div className="w-32"><input type="number" step="0.01" placeholder="Q.tà" className="w-full border p-2 rounded text-sm outline-none" value={amountNeeded} onChange={e => setAmountNeeded(e.target.value)} /></div>
                    <button onClick={addIngredient} className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700 mb-[1px]"><Plus size={18} /></button>
                </div>
              </div>

              <div className="space-y-1 mb-6">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><Box size={14}/> Aggiungi Contenitore</label>
                <div className="flex gap-3 items-end bg-slate-50 p-4 rounded-md border border-slate-200">
                    <div className="flex-1">
                      <select className="w-full border p-2 rounded text-sm outline-none" value={currentContainerId} onChange={e => setCurrentContainerId(e.target.value)}>
                        <option value="">-- Seleziona Contenitore --</option>
                        {availableContainers.map(item => <option key={item.id} value={item.id}>{item.name} (N.I.: {item.ni} | Disp: {getRemainingQuantity(item).toFixed(0)} {item.unit})</option>)}
                      </select>
                    </div>
                    <div className="w-32"><input type="number" step="1" placeholder="N. Pezzi" className="w-full border p-2 rounded text-sm outline-none" value={containerAmountNeeded} onChange={e => setContainerAmountNeeded(e.target.value)} /></div>
                    <button onClick={addContainer} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mb-[1px]"><Plus size={18} /></button>
                </div>
              </div>

              <div className="space-y-2">
                {selectedIngredients.map((ing, idx) => (
                <div key={idx} className={`flex justify-between items-center p-3 border rounded shadow-sm ${ing.isContainer ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200'}`}>
                  <div className="flex items-center gap-3">
                    {ing.isContainer ? <Box size={20} className="text-blue-500"/> : <FlaskConical size={20} className="text-teal-500"/>}
                    <div>
                      <div className="font-bold text-slate-800">{ing.name}</div>
                      <div className="text-xs text-slate-500">N.I.: {ing.ni} | €{Number(ing.costPerGram).toFixed(ing.isContainer ? 2 : 4)}/{ing.unit}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {editingIngredientIndex === idx ? (
                      <input 
                        type="number" 
                        step={ing.isContainer ? "1" : "0.01"} 
                        value={tempAmount} 
                        onChange={(e) => setTempAmount(e.target.value)} 
                        className="w-24 border text-right p-1 rounded-md font-mono font-bold"
                        autoFocus
                        onBlur={() => saveEditingAmount(idx)}
                        onKeyDown={(e) => e.key === 'Enter' && saveEditingAmount(idx)}
                      />
                    ) : (
                      <span className="font-mono font-bold w-24 text-right">{Number(ing.amountUsed).toFixed(ing.isContainer ? 0 : 2)}</span>
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
              ))}
              {selectedIngredients.length === 0 && <p className="text-center text-slate-400 italic py-4">Nessun componente selezionato.</p>}
              </div>
              <div className="flex justify-between pt-4"><button onClick={() => setStep(1)} className="text-slate-500 hover:underline">Indietro</button><button disabled={selectedIngredients.length === 0} onClick={() => setStep(3)} className="bg-teal-600 text-white px-6 py-2 rounded-md hover:bg-teal-700 disabled:opacity-50">Calcola Prezzo</button></div>
          </div>
        )}
        
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 pt-4"><Euro size={24} className="text-teal-600"/> Tariffazione Nazionale</h2>
              <div className="bg-blue-50 border border-blue-200 rounded p-3 text-xs text-blue-800 flex items-start gap-2"><Info size={16} className="mt-0.5 shrink-0" /><div><strong>Dettaglio Calcolo:</strong><br/>{details.pharmaceuticalForm === 'Capsule' || details.pharmaceuticalForm === 'Cartine' ? <>• Base (fino a 120): 22,00 €<br/>• Extra Q.tà: +2,00€ ogni 10 oltre 120 / -1,00€ ogni 10 in meno<br/>• Extra Componenti: +0,60€ (oltre il 1°, max 4)<br/>• Op. Tecnologiche Extra: +2,30€ cad.</> : <>• Tariffa Tabellare Standard</>}</div></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-slate-50 p-4 rounded-md border border-slate-200"><h3 className="font-bold text-sm text-slate-700 mb-3 border-b pb-2">Costo Materie Prime</h3>{selectedIngredients.map((ing, i) => <div key={i} className="flex justify-between text-sm"><span>{ing.name} ({Number(ing.amountUsed).toFixed(ing.isContainer ? 0 : 2)}{ing.unit})</span><span className="font-mono">€ {(ing.costPerGram * ing.amountUsed).toFixed(2)}</span></div>)}<div className="flex justify-between font-bold text-sm mt-3 pt-2 border-t border-slate-300"><span>Totale Sostanze</span><span>€ {pricing.substances.toFixed(2)}</span></div></div>
                  <div className="bg-slate-50 p-4 rounded-md border border-slate-200 space-y-4">
                      <h3 className="font-bold text-sm text-slate-700 mb-3 border-b pb-2">Onorari & Costi</h3>
                      <div><label className="block text-xs font-bold text-slate-500 mb-1">Onorario + Suppl. 40%</label><input type="number" className="w-full border p-2 rounded text-right font-mono bg-slate-100" value={professionalFee.toFixed(2)} readOnly /></div>
                      <div><label className="block text-xs font-bold text-slate-500 mb-1">Op. Tecnologiche Extra (+2.30€)</label><input type="number" min="0" className="w-full border p-2 rounded text-right font-mono" value={extraTechOps} onChange={e => setExtraTechOps(parseInt(e.target.value)||0)} /></div>
                      <div><label className="block text-xs font-bold text-slate-500 mb-1">Addizionale</label><input type="text" className="w-full border p-2 rounded text-right font-mono bg-slate-100" value={pricing.additional.toFixed(2)} readOnly /></div>
                  </div>
              </div>
                              <div className="bg-teal-50 p-6 rounded-lg border border-teal-200 flex flex-col items-end">
                                {initialData?.id && initialData.totalPrice && (
                                  <div className="w-full flex justify-between text-sm text-slate-700 mb-1">
                                    <span>Prezzo Salvato (All'ultima modifica)</span>
                                    <span className="font-bold">€ {parseFloat(initialData.totalPrice).toFixed(2)}</span>
                                  </div>
                                )}
                                <div className="w-full flex justify-between text-sm text-teal-800 mb-1"><span>Totale Netto</span><span>€ {pricing.net.toFixed(2)}</span></div>
                                <div className="w-full flex justify-between text-sm text-teal-800 mb-2 border-b border-teal-200 pb-2"><span>IVA (10%)</span><span>€ {pricing.vat.toFixed(2)}</span></div>
                                <div className="flex items-baseline gap-4"><span className="text-lg font-bold text-teal-900">PREZZO FINALE</span><span className="text-3xl font-bold text-teal-700">€ {pricing.final.toFixed(2)}</span></div>
                              </div>              <div className="pt-4 flex justify-between"><button onClick={() => setStep(2)} className="text-slate-500 hover:underline">Indietro</button><button onClick={() => { console.log('Step 3 Next clicked. Going to step 4. isOfficinale:', isOfficinale); setStep(4); }} className="bg-teal-600 text-white px-6 py-2 rounded-md hover:bg-teal-700">Avanti a {isOfficinale ? "Lotti" : "Foglio Lav."}</button></div>
          </div>
        )}

        {isOfficinale && step === 4 && (
          <div className="space-y-6 animate-in fade-in">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 pt-4"><ListOrdered size={24} className="text-blue-600"/> Gestione Lotti e Prezzi</h2>
            
            {(() => {
              const totalExpected = parseFloat(details.quantity) || 0;
              const totalAllocated = batches.reduce((acc, batch) => {
                const container = selectedIngredients.find(ing => ing.id === batch.containerId);
                const numContainers = container ? parseFloat(container.amountUsed) : 0;
                const qtyPerContainer = parseFloat(batch.productQuantity) || 0;
                return acc + (numContainers * qtyPerContainer);
              }, 0);
              const remaining = totalExpected - totalAllocated;
              const isBalanced = Math.abs(remaining) < 0.01;

              return (
                <div className={`p-4 rounded-md border text-sm flex justify-between items-center ${isBalanced ? 'bg-green-50 border-green-200 text-green-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
                  <div>
                    <span className="block text-xs font-bold uppercase opacity-70">Totale Preparato</span>
                    <span className="text-lg font-bold">{totalExpected.toFixed(2)} {getPrepUnit(details.pharmaceuticalForm)}</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-xs font-bold uppercase opacity-70">Assegnato ai Lotti</span>
                    <span className="text-lg font-bold">{totalAllocated.toFixed(2)} {getPrepUnit(details.pharmaceuticalForm)}</span>
                  </div>
                  <div className={`text-right px-4 py-1 rounded font-mono font-bold ${isBalanced ? 'bg-green-100 text-green-700' : 'bg-white border border-amber-300 text-amber-700'}`}>
                    {remaining > 0 ? `Da assegnare: ${remaining.toFixed(2)}` : remaining < 0 ? `Eccesso: ${Math.abs(remaining).toFixed(2)}` : "BILANCIATO"}
                  </div>
                </div>
              );
            })()}

            <div className="bg-blue-50 p-4 rounded-md border border-blue-100 text-sm text-blue-800 mb-4"><p>Definisci la quantità di prodotto per ogni confezione e il prezzo di vendita finale per ciascuna.</p></div>
            
            <div className="space-y-4">
              {selectedIngredients.filter(ing => ing.isContainer).map((container, index) => {
                const batchInfo = batches.find(b => b.containerId === container.id) || {};
                return (
                  <div key={index} className="grid grid-cols-3 gap-4 items-end bg-slate-50 p-4 rounded-md border">
                    <div className="col-span-3 sm:col-span-1">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Contenitore</label>
                      <div className="flex flex-col gap-1 p-2 bg-white rounded border border-slate-200">
                        <div className="flex items-center gap-2">
                          <Box size={16} className="text-blue-500" />
                          <span className="font-semibold text-sm">{container.name}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                          Pezzi totali: {Number(container.amountUsed).toFixed(0)}
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Q.tà Prodotto / Conf.</label>
                      <input 
                        type="number" 
                        step="1"
                        placeholder="Es. 30"
                        value={batchInfo.productQuantity || ''}
                        onChange={(e) => handleBatchChange(container.id, 'productQuantity', e.target.value)}
                        className="w-full border p-2 rounded text-sm outline-none" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Prezzo Vendita / Conf. (€)</label>
                      <input 
                        type="number"
                        step="0.01"
                        placeholder="Es. 15.50"
                        value={batchInfo.unitPrice || ''}
                        onChange={(e) => handleBatchChange(container.id, 'unitPrice', e.target.value)}
                        className="w-full border p-2 rounded text-sm outline-none" 
                      />
                    </div>
                  </div>
                )
              })}
              {selectedIngredients.filter(ing => ing.isContainer).length === 0 && (
                <p className="text-center text-slate-400 italic py-12">Nessun contenitore selezionato nello Step 2.<br/>Torna indietro per aggiungerne uno.</p>
              )}
            </div>

            <div className="pt-4 flex justify-between"><button onClick={() => setStep(3)} className="text-slate-500 hover:underline">Indietro</button><button 
                disabled={Math.abs(calculateBatchBalance()) >= 0.01}
                onClick={() => setStep(5)} 
                className="bg-teal-600 text-white px-6 py-2 rounded-md hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Avanti a Foglio Lav.
              </button></div>
          </div>
        )}
        
        {((isOfficinale && step === 5) || (!isOfficinale && step === 4)) && (
          <div className="space-y-6 animate-in fade-in">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 pt-4"><FileText size={24} /> Personalizzazione Foglio di Lavorazione</h2>
            <div className="bg-blue-50 p-4 rounded-md border border-blue-100 text-sm text-blue-800 mb-4"><p>Aggiungi dettagli o modifica le sezioni che appariranno nel PDF finale.</p></div>
            
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide">Procedure operative ed eventuali integrazioni</label>
              <textarea 
                className="w-full border p-3 rounded-md outline-none h-48 resize-y focus:ring-2 ring-teal-500 text-sm" 
                value={details.operatingProcedures} 
                onChange={e => setDetails({...details, operatingProcedures: e.target.value})} 
                placeholder="Inserisci qui le fasi di lavorazione, istruzioni specifiche o note tecniche per il foglio di lavorazione..."
              />
            </div>

            <div className="pt-4 flex justify-between"><button onClick={() => setStep(isOfficinale ? 4 : 3)} className="text-slate-500 hover:underline">Indietro</button><button onClick={() => setStep(isOfficinale ? 6 : 5)} className="bg-teal-600 text-white px-6 py-2 rounded-md hover:bg-teal-700">Avanti a Conferma</button></div>
          </div>
        )}

        {((isOfficinale && step === 6) || (!isOfficinale && step === 5)) && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center">
                  <h2 className="text-xl font-bold text-slate-800 pt-4 flex items-center justify-center gap-2"><ClipboardCheck size={24} />Conferma Finale</h2>
                  <div className="bg-slate-50 p-6 border rounded-md mt-4 max-w-md mx-auto">
                    <p className="text-slate-600">Confermi la produzione di <b>{details.name}</b>?</p>
                    <p className="text-3xl font-bold mt-2 text-teal-700">€ {pricing.final.toFixed(2)}</p>
                  </div>
                </div>

                {isOfficinale && batches.length > 0 && (
                  <div className="bg-blue-50/50 p-6 border border-blue-100 rounded-md mt-4">
                    <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <ListOrdered size={16}/> Riepilogo Lotti di Produzione
                    </h3>
                    <div className="space-y-2">
                      {batches.map((batch, i) => {
                        const container = selectedIngredients.find(ing => ing.id === batch.containerId);
                        return (
                          <div key={i} className="flex justify-between items-center bg-white p-3 rounded border border-blue-100 shadow-sm">
                            <div className="flex items-center gap-3">
                              <Box size={18} className="text-blue-500" />
                              <div>
                                <div className="font-bold text-sm text-slate-800">{container?.name || 'Contenitore'}</div>
                                <div className="text-xs text-slate-500">
                                  <span className="font-bold text-blue-600">{Number(container?.amountUsed || 0).toFixed(0)} confezioni</span> preparate con {batch.productQuantity} unità cad.
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-mono font-bold text-blue-700">€ {parseFloat(batch.unitPrice || 0).toFixed(2)}</div>
                              <div className="text-[10px] text-slate-400 font-bold uppercase">Prezzo Unitario</div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
                <div className="pt-4 flex justify-between border-t border-slate-100">
                  <button onClick={() => setStep(isOfficinale ? 5 : 4)} className="text-slate-500 hover:underline">Indietro</button>
                  <div className="flex items-center gap-3">
                    <button onClick={handleDownloadWorksheet} className="bg-slate-600 text-white px-6 py-2 rounded-md hover:bg-slate-700 flex items-center gap-2">
                        <FileDown size={18}/> Scarica Foglio
                    </button>
                    {details.status !== 'Completata' && (
                      <button onClick={handleDraftSave} className="bg-slate-200 text-slate-700 px-6 py-2 rounded-md hover:bg-slate-300 flex items-center gap-2 shadow-sm transition-colors">
                          <Save size={18}/> Salva Bozza
                      </button>
                    )}
                    <button onClick={handleFinalSave} className="bg-teal-600 text-white px-6 py-2 rounded-md hover:bg-teal-700 flex items-center gap-2">
                        <Save size={18}/> Salva e Completa
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