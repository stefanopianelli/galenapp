import React, { useState, useEffect } from 'react';
import { Euro, Plus, Trash2, Save, FileDown, Pencil, Check, Info, Box, FlaskConical, ClipboardCheck, ListOrdered, FileText, Printer, Search, X } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { NATIONAL_TARIFF_FEES, VAT_RATE } from '../../constants/tariffs';
import { generateWorkSheetPDF } from '../../services/pdfGenerator';
import { generateLabelPDF } from '../../services/labelGenerator';
import { calculateComplexFee } from '../../services/tariffService';
import TechOpsModal, { TechOpsList } from '../modals/TechOpsModal';
import { formatDate } from '../../utils/dateUtils';

function PreparationWizard({ inventory, preparations, onComplete, initialData, pharmacySettings, initialStep, canEdit }) {
  const prepType = initialData?.prepType || 'magistrale';
  const isOfficinale = prepType === 'officinale';
  const totalSteps = isOfficinale ? 6 : 5;

  const [step, setStep] = useState(initialStep || 1);
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  
  const [currentIngredientId, setCurrentIngredientId] = useState('');
  const [substanceSearchTerm, setSubstanceSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  const [currentContainerId, setCurrentContainerId] = useState('');
  const [containerSearchTerm, setContainerSearchTerm] = useState('');
  const [isContainerSearchOpen, setIsContainerSearchOpen] = useState(false);
  
  const [amountNeeded, setAmountNeeded] = useState('');
  const [weighedAmount, setWeighedAmount] = useState('');

  const [containerAmountNeeded, setContainerAmountNeeded] = useState('');

  const [editingIngredientIndex, setEditingIngredientIndex] = useState(null);
  const [tempAmount, setTempAmount] = useState('');
  const [tempWeighedAmount, setTempWeighedAmount] = useState('');
  
  const [professionalFee, setProfessionalFee] = useState(0);
  const [batches, setBatches] = useState([]); 
  const [worksheetItems, setWorksheetItems] = useState([]);
  const [isTechOpsModalOpen, setIsTechOpsModalOpen] = useState(false);

  useEffect(() => {
    setStep(initialStep || 1);
  }, [initialStep, initialData]);

  // Sync Smart Search con selezione corrente
  useEffect(() => {
      if (!currentIngredientId) {
          setSubstanceSearchTerm('');
      } else {
          const item = inventory?.find(i => String(i.id) === String(currentIngredientId));
          if (item) setSubstanceSearchTerm(item.name);
      }
  }, [currentIngredientId, inventory]);

  useEffect(() => {
      if (!currentContainerId) {
          setContainerSearchTerm('');
      } else {
          const item = inventory?.find(i => String(i.id) === String(currentContainerId));
          if (item) setContainerSearchTerm(item.name);
      }
  }, [currentContainerId, inventory]);

  const [details, setDetails] = useState({ 
    name: '', patient: '', patientPhone: '', doctor: '', notes: '', prepNumber: '', quantity: '', 
    expiryDate: '', pharmaceuticalForm: 'Capsule', posology: '', recipeDate: '', usage: 'Orale', operatingProcedures: '', prepType: 'magistrale', labelWarnings: [], customLabelWarning: '', techOps: []
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
      name: '', patient: '', patientPhone: '', doctor: '', notes: '', prepNumber: '', quantity: '', 
      expiryDate: '', pharmaceuticalForm: 'Capsule', posology: '', recipeDate: '', usage: 'Orale', operatingProcedures: '', status: 'Bozza', prepType: 'magistrale', batches: [], worksheetItems: [], labelWarnings: [], customLabelWarning: '', techOps: []
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
        
        if (initialData.batches) setBatches(initialData.batches);
        
        if (initialData.worksheetItems && initialData.worksheetItems.length > 0) {
          setWorksheetItems(initialData.worksheetItems);
        } else {
          setWorksheetItems([
            { text: 'Verifica fonti documentali e calcoli', checked: true },
            { text: 'Controllo corrispondenza materie prime', checked: true },
            { text: 'Pesata/misura dei componenti', checked: true },
            { text: 'Miscelazione / Lavorazione', checked: true },
            { text: 'Allestimento / Incapsulamento / Ripartizione', checked: true },
            { text: 'Controllo di uniformità e aspetto', checked: true },
            { text: 'Etichettatura e confezionamento', checked: true }
          ]);
        }

        const enrichedIngredients = (initialData.ingredients || []).map(ing => {
          const inventoryItem = (inventory || []).find(item => item.id === ing.id);
          if (!inventoryItem) {
            return { ...ing, securityData: ing.securityData || { pictograms: [] } };
          }
          // Determina il ruolo (Attivo/Eccipiente)
          let finalIsExcipient = inventoryItem.isExcipient || false; // Default Inventario
          if (ing.savedIsExcipient !== undefined) {
              finalIsExcipient = ing.savedIsExcipient; // Priorità assoluta al salvataggio
          } else if (ing.isExcipient !== undefined) {
              finalIsExcipient = ing.isExcipient; // Fallback legacy
          }

          return {
            id: ing.id, amountUsed: ing.amountUsed,
            stockDeduction: ing.stockDeduction || null, // Carica la tolleranza salvata
            name: inventoryItem.name, ni: inventoryItem.ni, lot: inventoryItem.lot || '', unit: inventoryItem.unit,
            costPerGram: inventoryItem.costPerGram || 0,
            isExcipient: finalIsExcipient,
            isContainer: inventoryItem.isContainer || false,
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
       setWorksheetItems([
        { text: 'Verifica fonti documentali e calcoli', checked: true },
        { text: 'Controllo corrispondenza materie prime', checked: true },
        { text: 'Pesata/misura dei componenti', checked: true },
        { text: 'Miscelazione / Lavorazione', checked: true },
        { text: 'Allestimento / Incapsulamento / Ripartizione', checked: true },
        { text: 'Controllo di uniformità e aspetto', checked: true },
        { text: 'Etichettatura e confezionamento', checked: true }
      ]);
    }
  }, [initialData, inventory, preparations]);

  useEffect(() => {
      setProfessionalFee(calculateComplexFee(details, selectedIngredients));
  }, [details.pharmaceuticalForm, details.quantity, selectedIngredients, details.techOps]);

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
  
  const handleWorksheetItemChange = (index) => {
    const newItems = [...worksheetItems];
    newItems[index].checked = !newItems[index].checked;
    setWorksheetItems(newItems);
  };

  const handleLabelWarningChange = (warning) => {
    setDetails(prev => {
      const current = prev.labelWarnings || [];
      if (current.includes(warning)) {
        return { ...prev, labelWarnings: current.filter(w => w !== warning) };
      } else {
        return { ...prev, labelWarnings: [...current, warning] };
      }
    });
  };
  
  const handleTechOpChange = (opCode) => {
    setDetails(prev => {
      const current = prev.techOps || [];
      if (current.includes(opCode)) {
        return { ...prev, techOps: current.filter(o => o !== opCode) };
      } else {
        return { ...prev, techOps: [...current, opCode] };
      }
    });
  };

  const hasDopingIngredient = selectedIngredients.some(ing => ing.isDoping);
  const dopingWarning = "Per chi svolge attività sportiva: l’uso del farmaco senza necessità terapeutica costituisce doping e può determinare comunque positività ai test antidoping.";

  const getPrepUnit = (form) => {
    if (['Preparazioni semisolide per applicazione cutanea e paste', 'Polveri composte e piante per tisane', 'Preparazioni semisolide per uso orale veterinario', 'Pillole omeopatiche', 'Triturazioni e diluizioni omeopatiche', 'Emulsioni, sospensioni e miscele di olii'].includes(form)) {
        return 'g';
    }
    if (['Preparazioni liquide (soluzioni)', 'Estratti liquidi e tinture', 'Colliri e preparazioni oftalmiche semisolide', 'Soluzioni e sospensioni sterili', 'Emulsioni sterili'].includes(form)) {
        return 'ml';
    }
    if (['Capsule', 'Suppositori e ovuli', 'Cartine e cialdini', 'Compresse e gomme da masticare medicate', 'Pillole, pastiglie e granulati'].includes(form)) {
        return 'n.';
    }
    return '-';
  };

  const isStep1Valid = (() => {
    const baseFields = details.name && details.prepNumber && details.quantity && details.pharmaceuticalForm && details.expiryDate && details.posology && details.usage;
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
    const used = selectedIngredients.filter(i => String(i.id) === String(item.id)).reduce((acc, curr) => {
        // Forza conversione numerica per evitare errori di tipo
        const recipeQty = Number(curr.amountUsed) || 0;
        const weighedQty = Number(curr.stockDeduction) || 0;
        
        // La quantità da scalare è la pesata se presente (>0), altrimenti quella di ricetta
        const actualDeduction = (weighedQty > 0) ? weighedQty : recipeQty;
        
        return acc + actualDeduction;
    }, 0);
    return Number(item.quantity) - used;
  };

  // FIFO Logic: Sort by expiry date (oldest first)
  const availableItems = (inventory || [])
    .filter(i => !i.disposed && new Date(i.expiry) > new Date() && getRemainingQuantity(i) > 0.001)
    .sort((a, b) => new Date(a.expiry) - new Date(b.expiry));

  const availableSubstances = availableItems.filter(i => !i.isContainer);
  const availableContainers = availableItems.filter(i => i.isContainer);

  // Map to find the oldest batch for each substance name and count occurrences
  const oldestBatches = {};
  const batchCounts = {};
  
  availableSubstances.forEach(item => {
      // Count batches
      batchCounts[item.name] = (batchCounts[item.name] || 0) + 1;
      
      // Track oldest
      if (!oldestBatches[item.name] || new Date(item.expiry) < new Date(oldestBatches[item.name].expiry)) {
          oldestBatches[item.name] = item;
      }
  });

  const isSelectedBatchOptimal = () => {
      if (!currentIngredientId) return true;
      const selectedItem = availableSubstances.find(i => i.id === parseInt(currentIngredientId));
      if (!selectedItem) return true;
      // Is optimal if it's the oldest OR if it's the only one
      const bestItem = oldestBatches[selectedItem.name];
      return (batchCounts[selectedItem.name] <= 1) || (bestItem && bestItem.id === selectedItem.id);
  };

  const addIngredient = () => {
    if (!currentIngredientId || !amountNeeded) return;
    const item = inventory.find(i => i.id === parseInt(currentIngredientId));
    
    // Logica Tolleranza
    const qtyRecipe = parseFloat(amountNeeded);
    const qtyWeighed = weighedAmount ? parseFloat(weighedAmount) : qtyRecipe;
    
    const remaining = getRemainingQuantity(item);
    if (qtyWeighed > remaining) {
      alert(`Quantità insufficiente in magazzino! (Richiesti: ${qtyWeighed} ${item.unit}, Disp: ${remaining} ${item.unit})`);
      return;
    }
    
    setSelectedIngredients([...selectedIngredients, { 
        ...item, 
        amountUsed: qtyRecipe,
        stockDeduction: weighedAmount ? qtyWeighed : null
    }]);
    
    setCurrentIngredientId('');
    setAmountNeeded('');
    setWeighedAmount('');
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

  const toggleExcipient = (idx) => {
    if (!canEdit) return;
    const newIngredients = [...selectedIngredients];
    newIngredients[idx].isExcipient = !newIngredients[idx].isExcipient;
    setSelectedIngredients(newIngredients);
  };

  const handleIngredientAmountChange = (index, newAmount, newWeighedAmount) => {
    const newAmountValue = parseFloat(newAmount);
    // Se pesata non inserita, assume uguale a ricetta
    const newWeighedValue = newWeighedAmount ? parseFloat(newWeighedAmount) : newAmountValue;
    
    if (isNaN(newAmountValue) || newAmountValue < 0) return;
    
    const updatedIngredients = [...selectedIngredients];
    const ingredient = updatedIngredients[index];
    const originalItem = inventory.find(i => i.id === ingredient.id);
    
    // Vecchia pesata caricata per confronto
    const oldWeighedValue = Number(ingredient.stockDeduction || ingredient.amountUsed);
    
    // Calcolo del Delta (quanto stiamo chiedendo in PIU' rispetto a prima)
    const delta = newWeighedValue - oldWeighedValue;
    
    // Se stiamo aumentando (delta > 0), controlliamo la giacenza effettiva in magazzino
    if (delta > 0) {
        // La giacenza in magazzino è originalItem.quantity
        // (Nota: non sottraiamo gli altri usi della stessa preparazione qui perché originalItem.quantity 
        // nel database riflette lo stato reale post-scarico se la prep era completata, 
        // o lo stato ante-scarico se è una bozza).
        
        // MA per essere sicuri consideriamo anche altre righe della STESSA preparazione se duplicate
        const otherUsesInCurrentPrep = selectedIngredients.filter((ing, idx) => idx !== index && ing.id === ingredient.id).reduce((acc, curr) => {
            const qty = (curr.stockDeduction > 0) ? curr.stockDeduction : curr.amountUsed;
            return acc + Number(qty);
        }, 0);

        const availableNow = Number(originalItem.quantity) - otherUsesInCurrentPrep;

        if (delta > availableNow) {
            alert(`Giacenza insufficiente per l'aumento richiesto. Disponibile: ${availableNow.toFixed(2)} ${ingredient.unit}`);
            return;
        }
    }

    // Se delta <= 0, stiamo diminuendo o non cambiando lo scarico reale, quindi procediamo sempre.
    updatedIngredients[index].amountUsed = newAmountValue;
    updatedIngredients[index].stockDeduction = (newWeighedAmount && parseFloat(newWeighedAmount) !== newAmountValue) ? parseFloat(newWeighedAmount) : null;
    
    setSelectedIngredients(updatedIngredients);
    setEditingIngredientIndex(null);
  };
  
  const startEditingAmount = (index) => {
    setEditingIngredientIndex(index);
    setTempAmount(selectedIngredients[index].amountUsed);
    setTempWeighedAmount(selectedIngredients[index].stockDeduction || '');
  };

  const saveEditingAmount = (index) => {
    handleIngredientAmountChange(index, tempAmount, tempWeighedAmount);
  };

  const calculateTotal = () => {
    const substancesCost = selectedIngredients.reduce((acc, ing) => acc + (ing.costPerGram ? ing.costPerGram * ing.amountUsed : 0), 0);
    const currentFee = parseFloat(professionalFee);
    
    let additional = 0;
    
    // Logica cumulativa per categoria (Max 7.50€)
    const hasPictograms = selectedIngredients.some(ing => ing.securityData?.pictograms?.length > 0);
    const hasNarcotic = selectedIngredients.some(ing => ing.isNarcotic);
    const hasDoping = selectedIngredients.some(ing => ing.isDoping);

    if (hasPictograms) additional += 2.50;
    if (hasNarcotic) additional += 2.50;
    if (hasDoping) additional += 2.50;

    const net = substancesCost + currentFee + additional;
    const vat = net * VAT_RATE;
    return { substances: substancesCost, fee: currentFee, disposal: 0, additional, net, vat, final: net + vat };
  };

  const pricing = calculateTotal();

  let extraOpsCount = 0;
  let extraComponentsCount = 0;
  let extraOpsFee = 0;
  let extraComponentsFee = 0;
  
  const form = details.pharmaceuticalForm;
  const activeSubstancesCount = selectedIngredients.filter(i => !i.isExcipient && !i.isContainer).length;
  const techOpsCount = (details.techOps || []).length;

  if (form === 'Capsule' || form === 'Cartine e cialdini') {
      extraOpsCount = Math.max(0, techOpsCount - 3);
      extraComponentsCount = Math.max(0, activeSubstancesCount - 1);
      extraComponentsFee = Math.min(extraComponentsCount, 4) * 0.60;
  } else if (form === 'Suppositori e ovuli') {
      extraOpsCount = Math.max(0, techOpsCount - 4);
      extraComponentsCount = Math.max(0, activeSubstancesCount - 3);
      extraComponentsFee = extraComponentsCount * 0.60;
  } else if (form === 'Preparazioni liquide (soluzioni)') {
      extraOpsCount = Math.max(0, techOpsCount - 2);
      extraComponentsCount = Math.max(0, activeSubstancesCount - 2);
      extraComponentsFee = extraComponentsCount * 0.80;
  } else if (form === 'Estratti liquidi e tinture') {
      extraOpsCount = Math.max(0, techOpsCount - 2);
      extraComponentsCount = Math.max(0, activeSubstancesCount - 2);
      extraComponentsFee = extraComponentsCount * 0.80;
  } else if (form === 'Emulsioni, sospensioni e miscele di olii') {
      extraOpsCount = Math.max(0, techOpsCount - 2);
      extraComponentsCount = Math.max(0, activeSubstancesCount - 2);
      extraComponentsFee = extraComponentsCount * 0.70;
  } else if (form === 'Preparazioni semisolide per applicazione cutanea e paste') {
      extraOpsCount = Math.max(0, techOpsCount - 2);
      extraComponentsCount = Math.max(0, activeSubstancesCount - 2);
      extraComponentsFee = extraComponentsCount * 0.75;
  } else if (form === 'Polveri composte e piante per tisane') {
      extraOpsCount = Math.max(0, techOpsCount - 2);
      extraComponentsCount = Math.max(0, activeSubstancesCount - 2);
      extraComponentsFee = extraComponentsCount * 0.75;
  } else if (form === 'Compresse e gomme da masticare medicate') {
      extraOpsCount = Math.max(0, techOpsCount - 3);
      extraComponentsCount = Math.max(0, activeSubstancesCount - 4); // 4 componenti inclusi
      extraComponentsFee = 0; // Nessun costo per componenti extra
  } else {
      extraOpsCount = techOpsCount;
      extraComponentsCount = 0;
      extraComponentsFee = 0;
  }
  extraOpsFee = extraOpsCount * 2.30;

  const handleDownloadWorksheet = () => generateWorkSheetPDF({ details: { ...details, worksheetItems }, ingredients: selectedIngredients, pricing }, pharmacySettings);
  
  const handlePrintLabel = () => {
      // Passiamo i dettagli correnti. Se non è salvata, l'ID potrebbe mancare per il QR, ma generiamo comunque.
      generateLabelPDF({ ...details, id: initialData?.id }, pharmacySettings);
  };

  const handleFinalSave = () => {
    if (details.name && selectedIngredients.length > 0) {
      // Aggiorna la data di preparazione alla data odierna di completamento
      const today = new Date().toISOString().split('T')[0];
      onComplete(selectedIngredients, { 
          ...details, 
          date: today, // Forza la data di oggi
          prepUnit: getPrepUnit(details.pharmaceuticalForm), 
          totalPrice: pricing.final, 
          batches, 
          worksheetItems, 
          pricingData: pricing 
      }, false);
    }
  };

  const handleDraftSave = () => {
    if (!details.name) {
      alert("Per salvare una bozza, il nome della preparazione è obbligatorio.");
      return;
    }
    onComplete(selectedIngredients, { ...details, prepUnit: getPrepUnit(details.pharmaceuticalForm), totalPrice: pricing.final, batches, worksheetItems, pricingData: pricing }, true);
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
        if (isStep1Valid && selectedIngredients.length > 0) setStep(4);
      }
    } else if (targetStep === 5) {
      if (isOfficinale) {
        if (isStep1Valid && selectedIngredients.length > 0 && Math.abs(calculateBatchBalance()) < 0.01) setStep(5);
      } else {
        if (isStep1Valid && selectedIngredients.length > 0) setStep(5);
      }
    } else if (targetStep === 6 && isOfficinale) {
        if (isStep1Valid && selectedIngredients.length > 0) setStep(6);
    }
  };

  const getStepLabels = () => {
    const base = ["Anagrafica", "Componenti", "Tariffa"];
    if (isOfficinale) return [...base, "Lotti", "Foglio Lav.", "Conferma"];
    return [...base, "Foglio Lav.", "Conferma"];
  };
  const stepLabels = getStepLabels();

  const pharmaForms = [
    'Preparazioni liquide (soluzioni)',
    'Estratti liquidi e tinture',
    'Emulsioni, sospensioni e miscele di olii',
    'Preparazioni semisolide per applicazione cutanea e paste',
    'Polveri composte e piante per tisane',
    'Cartine e cialdini',
    'Capsule',
    'Compresse e gomme da masticare medicate',
    'Pillole, pastiglie e granulati',
    'Preparazioni semisolide per uso orale veterinario',
    'Suppositori e ovuli',
    'Colliri e preparazioni oftalmiche semisolide',
    'Soluzioni e sospensioni sterili',
    'Emulsioni sterili',
    'Triturazioni e diluizioni omeopatiche',
    'Pillole omeopatiche'
  ];
  const usageOptions = ['Orale', 'Topica', 'Sublinguale', 'Buccale', 'Rettale', 'Inalatoria', 'Transdermica', 'Vaginale', 'Parenterale'];

  return (
    <>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex justify-between mb-4">
          {stepLabels.map((label, index) => {
            const num = index + 1;
            return (
              <div key={num} onClick={() => handleStepClick(num)} className={`flex items-center gap-2 cursor-pointer select-none transition-colors ${step >= num ? 'text-teal-600 font-bold' : 'text-slate-400 hover:text-slate-500'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${step >= num ? 'border-teal-600 bg-teal-50' : 'border-slate-300 bg-white'}`}>
                  {num}
                </div>
                <span className="text-sm hidden sm:inline">{label}</span>
              </div>
            )
          })}
        </div>

        <div className="flex justify-between items-center mb-6">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-slate-800">{initialData?.id && !initialData.isDuplicate ? `Modifica Preparazione: ${initialData.prepNumber}` : 'Nuova Preparazione'}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge type={isOfficinale ? "info" : "success"}>{isOfficinale ? "Officinale" : "Magistrale"}</Badge>
              {details.status === 'Bozza' && <Badge type="neutral">Bozza</Badge>}
              {!canEdit && <Badge type="danger">SOLA LETTURA</Badge>}
            </div>
          </div>
          {(details.status !== 'Completata') && canEdit && (
            <button onClick={handleDraftSave} className="bg-slate-200 text-slate-700 px-3 py-1.5 rounded-md hover:bg-slate-300 flex items-center gap-1 text-sm shadow-sm transition-colors" title="Salva come bozza per continuare più tardi"><Save size={16} /> Salva Bozza</button>
          )}
        </div>

        {!canEdit && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md mb-6 flex items-center gap-2">
                <Info size={20} />
                <strong>Accesso Limitato:</strong> Non hai i permessi per modificare o salvare questa preparazione.
            </div>
        )}

        <Card className="p-8 min-h-[500px]">
          {step === 1 && (
              <div className="space-y-4 animate-in fade-in">
                  <h2 className="text-xl font-bold text-slate-800">Anagrafica Ricetta</h2>
                  <div className="grid grid-cols-2 gap-4 pt-4">
                      <div className="col-span-2"><label className="block text-sm font-bold">Nome *</label><input className="w-full border p-3 rounded-md outline-none focus:ring-2 ring-teal-500" value={details.name} onChange={e => setDetails({...details, name: e.target.value})} /></div>
                      <div><label className="block text-sm font-bold">N.P. *</label><input className="w-full border p-3 rounded-md outline-none bg-slate-50 font-mono" value={details.prepNumber} readOnly /></div>
                                        <div><label className="block text-sm font-bold">Forma *</label><select className="w-full border p-3 rounded-md outline-none bg-white" value={details.pharmaceuticalForm} onChange={e => setDetails({...details, pharmaceuticalForm: e.target.value})}>{pharmaForms.map(f => {
                                      const implementedForms = ['Capsule', 'Cartine e cialdini', 'Suppositori e ovuli', 'Preparazioni liquide (soluzioni)', 'Estratti liquidi e tinture', 'Emulsioni, sospensioni e miscele di olii', 'Preparazioni semisolide per applicazione cutanea e paste', 'Polveri composte e piante per tisane', 'Compresse e gomme da masticare medicate'];
                                      const indicator = implementedForms.includes(f) ? '✓ ' : '○ ';
                                      return <option key={f} value={f}>{indicator}{f}</option>
                                    })}</select></div>                      <div><label className="block text-sm font-bold">Q.tà Totale ({getPrepUnit(details.pharmaceuticalForm)}) *</label><input type="number" step="0.01" className="w-full border p-3 rounded-md outline-none" value={details.quantity} onChange={e => setDetails({...details, quantity: e.target.value})} /></div>
                      <div><label className="block text-sm font-bold">Scadenza *</label><input type="date" className="w-full border p-3 rounded-md outline-none" value={details.expiryDate} onChange={e => setDetails({...details, expiryDate: e.target.value})} /></div>
                      {!isOfficinale && (
                        <>
                          <div className="col-span-2 grid grid-cols-2 gap-4">
                            <div><label className="block text-sm font-bold">Paziente *</label><input className="w-full border p-3 rounded-md outline-none" value={details.patient} onChange={e => setDetails({...details, patient: e.target.value})} /></div>
                            <div><label className="block text-sm font-bold">Telefono Paziente</label><input className="w-full border p-3 rounded-md outline-none" value={details.patientPhone} onChange={e => setDetails({...details, patientPhone: e.target.value})} placeholder="Opzionale" /></div>
                          </div>
                          <div className="col-span-2 grid grid-cols-2 gap-4">
                            <div><label className="block text-sm font-bold">Medico *</label><input className="w-full border p-3 rounded-md outline-none" value={details.doctor} onChange={e => setDetails({...details, doctor: e.target.value})} /></div>
                            <div><label className="block text-sm font-bold">Data Ricetta *</label><input type="date" className="w-full border p-3 rounded-md outline-none" value={details.recipeDate} onChange={e => setDetails({...details, recipeDate: e.target.value})} /></div>
                          </div>
                        </>
                      )}
                      <div className="col-span-2"><label className="block text-sm font-bold">Uso *</label>
                        <select className="w-full border p-3 rounded-md outline-none bg-white" value={details.usage} onChange={e => setDetails({...details, usage: e.target.value})}>
                          {usageOptions.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </div>
                      <div className="col-span-2"><label className="block text-sm font-bold">Posologia *</label><textarea className="w-full border p-3 rounded-md outline-none h-20 resize-none" value={details.posology} onChange={e => setDetails({...details, posology: e.target.value})} /></div>
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
                  <div className="bg-slate-50 p-4 rounded-md border border-slate-200 space-y-3">
                      <div className="relative">
                        <div className="relative">
                            <Search className="absolute left-3 top-3 text-slate-400 h-4 w-4" />
                            <input 
                                type="text" 
                                className={`w-full border p-2 pl-9 rounded text-sm outline-none focus:ring-2 focus:ring-teal-500 ${!currentIngredientId && substanceSearchTerm ? 'border-teal-300' : ''}`}
                                placeholder="Cerca sostanza (Nome, N.I. o Lotto)..." 
                                value={substanceSearchTerm}
                                onChange={(e) => { 
                                    setSubstanceSearchTerm(e.target.value); 
                                    setIsSearchOpen(true); 
                                    if(currentIngredientId) setCurrentIngredientId(''); // Reset selezione se scrivo
                                }}
                                onFocus={() => setIsSearchOpen(true)}
                                onBlur={() => setTimeout(() => setIsSearchOpen(false), 200)} // Ritardo per permettere il click
                            />
                            {currentIngredientId && (
                                <button onClick={() => { setCurrentIngredientId(''); setSubstanceSearchTerm(''); }} className="absolute right-3 top-2.5 text-slate-400 hover:text-red-500">
                                    <X size={16} />
                                </button>
                            )}
                        </div>

                        {isSearchOpen && (
                            <div className="absolute z-50 w-full bg-white border border-slate-200 mt-1 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                {availableSubstances
                                    .filter(item => {
                                        const term = substanceSearchTerm.toLowerCase();
                                        return !term || 
                                            item.name.toLowerCase().includes(term) || 
                                            (item.ni && item.ni.toLowerCase().includes(term)) || 
                                            (item.lot && item.lot.toLowerCase().includes(term));
                                    })
                                    .sort((a, b) => {
                                        // 1. Ordine Alfabetico Nome
                                        const nameCompare = a.name.localeCompare(b.name);
                                        if (nameCompare !== 0) return nameCompare;
                                        // 2. A parità di nome, Ordine Cronologico Scadenza (FIFO)
                                        return new Date(a.expiry) - new Date(b.expiry);
                                    })
                                    .map(item => {
                                        const isOldest = batchCounts[item.name] > 1 && oldestBatches[item.name] && oldestBatches[item.name].id === item.id;
                                        return (
                                            <div 
                                                key={item.id} 
                                                onClick={() => {
                                                    setCurrentIngredientId(item.id);
                                                    setSubstanceSearchTerm(item.name);
                                                    setIsSearchOpen(false);
                                                }}
                                                className={`p-3 border-b border-slate-50 cursor-pointer hover:bg-teal-50 transition-colors ${isOldest ? 'bg-green-50/50' : ''}`}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <div className="font-bold text-slate-800 flex items-center gap-2">
                                                            {item.name}
                                                            {isOldest && <span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded border border-green-200 uppercase tracking-wide">Prioritario (FIFO)</span>}
                                                        </div>
                                                        <div className="text-xs text-slate-500 mt-0.5">
                                                            N.I.: <span className="font-mono text-slate-700">{item.ni}</span> 
                                                            {item.lot && <span className="ml-2">| Lotto: <span className="font-mono text-slate-700">{item.lot}</span></span>}
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className={`text-xs font-bold whitespace-nowrap ${isOldest ? 'text-green-700' : 'text-slate-600'}`}>
                                                            Scad: {formatDate(item.expiry)}
                                                        </div>
                                                        <div className="mt-1 flex justify-end">
                                                            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 shadow-sm">
                                                                Disp: {getRemainingQuantity(item).toFixed(2)} {item.unit}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                {availableSubstances.filter(item => item.name.toLowerCase().includes(substanceSearchTerm.toLowerCase())).length === 0 && (
                                    <div className="p-4 text-center text-slate-400 text-xs italic">Nessuna sostanza trovata.</div>
                                )}
                            </div>
                        )}
                      </div>

                      {/* Campi Quantità e Bottone Aggiungi */}
                      <div className="flex flex-wrap gap-3 items-end mt-2 pt-2 border-t border-slate-200">
                        <div className="flex-1 min-w-[120px]">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Q.tà in Ricetta</label>
                            <input type="number" step="0.01" placeholder="Valore" className="w-full border p-2 rounded text-sm outline-none focus:ring-1 ring-teal-500" value={amountNeeded} onChange={e => setAmountNeeded(e.target.value)} title="Quantità prevista in formula" />
                        </div>

                        <div className="flex-1 min-w-[120px]">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                                Q.tà Pesata ({currentIngredientId ? inventory.find(i => String(i.id) === String(currentIngredientId))?.unit : '-'})
                            </label>
                            <input 
                                type="number" 
                                step="0.01" 
                                placeholder="Auto" 
                                className="w-full border p-2 rounded text-sm outline-none bg-amber-50 focus:ring-1 ring-amber-500" 
                                value={weighedAmount} 
                                onChange={e => setWeighedAmount(e.target.value)} 
                                title="Quantità effettiva pesata (se diversa, es. perdite)"
                            />
                        </div>

                        <button onClick={addIngredient} className="bg-teal-600 text-white px-6 py-2 rounded hover:bg-teal-700 h-[38px] flex items-center gap-2 font-bold shadow-sm">
                            <Plus size={18} /> Aggiungi
                        </button>
                      </div>
                  </div>
                  {!isSelectedBatchOptimal() && (
                      <div className="text-xs text-amber-600 font-bold px-1 animate-pulse">
                          ⚠ Attenzione: Esiste un lotto con scadenza precedente per questa sostanza. Considera di usare quello prioritario.
                      </div>
                  )}
                </div>
                <div className="space-y-1 mb-6">
                  <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><Box size={14}/> Aggiungi Contenitore</label>
                  <div className="bg-slate-50 p-4 rounded-md border border-slate-200 space-y-3">
                      <div className="relative">
                        <div className="relative">
                            <Search className="absolute left-3 top-3 text-slate-400 h-4 w-4" />
                            <input 
                                type="text" 
                                className={`w-full border p-2 pl-9 rounded text-sm outline-none focus:ring-2 focus:ring-blue-500 ${!currentContainerId && containerSearchTerm ? 'border-blue-300' : ''}`}
                                placeholder="Cerca contenitore (Nome o N.I.)..." 
                                value={containerSearchTerm}
                                onChange={(e) => { 
                                    setContainerSearchTerm(e.target.value); 
                                    setIsContainerSearchOpen(true); 
                                    if(currentContainerId) setCurrentContainerId('');
                                }}
                                onFocus={() => setIsContainerSearchOpen(true)}
                                onBlur={() => setTimeout(() => setIsContainerSearchOpen(false), 200)}
                            />
                            {currentContainerId && (
                                <button onClick={() => { setCurrentContainerId(''); setContainerSearchTerm(''); }} className="absolute right-3 top-2.5 text-slate-400 hover:text-red-500">
                                    <X size={16} />
                                </button>
                            )}
                        </div>

                        {isContainerSearchOpen && (
                            <div className="absolute z-50 w-full bg-white border border-slate-200 mt-1 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                {availableContainers
                                    .filter(item => {
                                        const term = containerSearchTerm.toLowerCase();
                                        return !term || 
                                            item.name.toLowerCase().includes(term) || 
                                            (item.ni && item.ni.toLowerCase().includes(term));
                                    })
                                    .sort((a, b) => a.name.localeCompare(b.name))
                                    .map(item => (
                                        <div 
                                            key={item.id} 
                                            onClick={() => {
                                                setCurrentContainerId(item.id);
                                                setContainerSearchTerm(item.name);
                                                setIsContainerSearchOpen(false);
                                            }}
                                            className="p-3 border-b border-slate-50 cursor-pointer hover:bg-blue-50 transition-colors"
                                        >
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <div className="font-bold text-slate-800">{item.name}</div>
                                                    <div className="text-xs text-slate-500 mt-0.5">N.I.: <span className="font-mono text-slate-700">{item.ni}</span></div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 shadow-sm">
                                                        Disp: {getRemainingQuantity(item).toFixed(0)} pz
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                {availableContainers.filter(item => item.name.toLowerCase().includes(containerSearchTerm.toLowerCase())).length === 0 && (
                                    <div className="p-4 text-center text-slate-400 text-xs italic">Nessun contenitore trovato.</div>
                                )}
                            </div>
                        )}
                      </div>

                      <div className="flex gap-3 items-end pt-2 border-t border-slate-200">
                          <div className="flex-1">
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">N. Confezioni</label>
                              <input type="number" step="1" placeholder="Pezzi" className="w-full border p-2 rounded text-sm outline-none focus:ring-1 ring-blue-500" value={containerAmountNeeded} onChange={e => setContainerAmountNeeded(e.target.value)} />
                          </div>
                          <button onClick={addContainer} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 h-[38px] flex items-center gap-2 font-bold shadow-sm">
                              <Plus size={18} /> Aggiungi
                          </button>
                      </div>
                  </div>
                </div>
                <div className="space-y-2">
                  {selectedIngredients.map((ing, idx) => {
                    const originalItem = inventory.find(i => String(i.id) === String(ing.id));
                    // Calcolo validazione giacenza per bozze riprese
                    // Se l'ingrediente è un contenitore, usiamo amountUsed direttamente (pezzi), altrimenti grammi/ml
                    const currentStock = originalItem ? parseFloat(originalItem.quantity) : 0;
                    const deduction = (ing.stockDeduction > 0) ? ing.stockDeduction : ing.amountUsed;
                    // FIX: Controllo giacenza solo se NON è completata
                    const isInsufficient = details.status !== 'Completata' && originalItem && deduction > currentStock;

                    return (
                    <div key={idx} className={`flex justify-between items-center p-3 border rounded shadow-sm transition-colors ${
                        isInsufficient 
                            ? 'bg-red-50 border-red-300' 
                            : (ing.isContainer ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200')
                    }`}>
                      <div className="flex items-center gap-3">
                        {ing.isContainer ? <Box size={20} className={isInsufficient ? "text-red-500" : "text-blue-500"}/> : <FlaskConical size={20} className={isInsufficient ? "text-red-500" : "text-teal-500"}/>}
                        <div>
                            <div className={`font-bold ${isInsufficient ? "text-red-700" : "text-slate-800"}`}>{ing.name}</div>
                            <div className="text-xs text-slate-500">N.I.: {ing.ni} | €{Number(ing.costPerGram).toFixed(ing.isContainer ? 2 : 4)}/{ing.unit}</div>
                            {isInsufficient && (
                                <div className="text-xs font-bold text-red-600 flex items-center gap-1 mt-1 animate-pulse">
                                    ⚠ GIACENZA INSUFFICIENTE (Disp: {currentStock.toFixed(2)} {ing.unit})
                                </div>
                            )}
                        </div>
                      </div>
                      {!ing.isContainer && (
                          <div 
                              onClick={() => canEdit && toggleExcipient(idx)}
                              className={`px-2 py-1 rounded text-xs font-bold select-none ${canEdit ? 'cursor-pointer hover:opacity-80' : ''} ${ing.isExcipient ? 'bg-slate-200 text-slate-600' : 'bg-teal-100 text-teal-700'}`}
                          >
                              {ing.isExcipient ? "Eccipiente" : "Principio Attivo"}
                          </div>
                      )}
                      <div className="flex items-center gap-2">
                        {editingIngredientIndex === idx ? (
                            <div className="flex gap-1">
                                <input type="number" step="0.01" value={tempAmount} onChange={(e) => setTempAmount(e.target.value)} className="w-20 border text-right p-1 rounded-md font-mono font-bold" autoFocus title="Q.tà Ricetta" />
                                <input type="number" step="0.01" value={tempWeighedAmount} onChange={(e) => setTempWeighedAmount(e.target.value)} className="w-20 border text-right p-1 rounded-md font-mono font-bold bg-amber-50" placeholder="Auto" title="Q.tà Pesata (Reale)" />
                            </div>
                        ) : (
                            <div className="flex flex-col items-end w-24">
                                <span className={`font-mono font-bold text-right ${isInsufficient ? 'text-red-600' : ''}`}>{Number(ing.amountUsed).toFixed(ing.isContainer ? 0 : 2)}</span>
                                {ing.stockDeduction && (
                                    <span className="text-[10px] text-amber-700 font-bold whitespace-nowrap" title="Quantità effettivamente scaricata dal magazzino">
                                        (Reale: {Number(ing.stockDeduction).toFixed(2)})
                                    </span>
                                )}
                            </div>
                        )}
                        <span className="text-sm font-mono w-8">{ing.unit}</span>
                        {editingIngredientIndex === idx ? (<button type="button" onClick={() => saveEditingAmount(idx)} className="text-green-600 hover:bg-green-50 p-1.5 rounded-full"><Check size={16} /></button>) : (<button type="button" onClick={() => startEditingAmount(idx)} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-full"><Pencil size={16} /></button>)}
                        <button type="button" onClick={() => removeIngredient(idx)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-full"><Trash2 size={16} /></button>
                      </div>
                    </div>
                    );
                  })}
                  {selectedIngredients.length === 0 && <p className="text-center text-slate-400 italic py-4">Nessun componente selezionato.</p>}
                </div>
                              {/* Operazioni Tecnologiche */}
                              {!isOfficinale && (
                                <div className="space-y-4 pt-6 border-t mt-6">
                                  <h3 className="text-lg font-bold text-slate-700">Operazioni Tecnologiche</h3>
                                  <div className="bg-slate-50 p-4 rounded-md border border-slate-200 min-h-[60px]">
                                      {details.techOps && details.techOps.length > 0 ? (
                                          <div className="flex flex-wrap gap-2">
                                              {details.techOps.map(opCode => {
                                                  const op = TechOpsList.find(o => o.code === opCode);
                                                  return <Badge key={opCode} type="neutral">{op ? op.text : opCode}</Badge>
                                              })}
                                          </div>
                                      ) : <p className="text-sm text-slate-500 italic">Nessuna operazione selezionata.</p>}
                                  </div>
                                  <button onClick={() => setIsTechOpsModalOpen(true)} className="text-sm bg-slate-200 text-slate-700 px-4 py-2 rounded-md hover:bg-slate-300">
                                      Modifica Operazioni Tecnologiche
                                  </button>
                                </div>
                              )}                <div className="flex justify-between pt-4"><button onClick={() => setStep(1)} className="text-slate-500 hover:underline">Indietro</button><button disabled={selectedIngredients.length === 0 || (details.status !== 'Completata' && selectedIngredients.some(ing => { const item = inventory.find(i => String(i.id) === String(ing.id)); const ded = (ing.stockDeduction > 0) ? ing.stockDeduction : ing.amountUsed; return item && ded > parseFloat(item.quantity); }))} onClick={() => setStep(3)} className="bg-teal-600 text-white px-6 py-2 rounded-md hover:bg-teal-700 disabled:opacity-50 disabled:bg-slate-400 disabled:cursor-not-allowed">Calcola Prezzo</button></div>
            </div>
          )}
          
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 pt-4"><Euro size={24} className="text-teal-600"/> Tariffazione Nazionale</h2>
                <div className="bg-blue-50 border border-blue-200 rounded p-3 text-xs text-blue-800 flex items-start gap-2"><Info size={16} className="mt-0.5 shrink-0" />
                  <div>
                    <strong>Dettaglio Calcolo:</strong><br/>
                    {(() => {
                      const form = details.pharmaceuticalForm;
                      if (form === 'Capsule') {
                        return <>• Base (fino a 120): 22,00 €<br/>• Extra Q.tà: +2,00€ ogni 10 oltre 120 / -1,00€ ogni 10 in meno<br/>• Extra Componenti: +0,60€ (oltre il 1°, max 4)<br/>• Op. Tecnologiche: 3 incluse, +2,30€ per le extra</>;
                      } else if (form === 'Cartine e cialdini') {
                        return <>• Base (fino a 10): 11,00 €<br/>• Extra Q.tà: +0,25€ per unità oltre 10 / -0,35€ per unità in meno<br/>• Extra Componenti: +0,60€ (oltre il 1°, max 4)<br/>• Op. Tecnologiche: 3 incluse, +2,30€ per le extra</>;
                      } else if (form === 'Suppositori e ovuli') {
                        return <>• Base (fino a 6): 13,30 €<br/>• Extra Q.tà: +0,60€ per unità oltre 6 / -1,10€ per unità in meno<br/>• Extra Componenti: +0,60€ (oltre il 3°)<br/>• Op. Tecnologiche: 4 incluse, +2,30€ per le extra</>;
                      } else if (form === 'Preparazioni liquide (soluzioni)') {
                        return <>• Base: 6,65 € (fino a 2 comp., 2 op. tec.)<br/>• Extra Componenti: +0,80 € cad.<br/>• Op. Tecnologiche Extra: +2,30 € cad.</>;
                      } else if (form === 'Estratti liquidi e tinture') {
                        return <>• Base: 8,00 € (fino a 2 comp., 2 op. tec.)<br/>• Extra Componenti: +0,80 € cad.<br/>• Op. Tecnologiche Extra: +2,30 € cad.</>;
                      } else if (form === 'Emulsioni, sospensioni e miscele di olii') {
                        return <>• Base: 13,30 € (fino a 250g, 2 comp., 2 op. tec.)<br/>• Extra Q.tà: +0,70 € ogni 100g oltre 250g<br/>• Extra Componenti: +0,70 € cad.<br/>• Op. Tecnologiche Extra: +2,30 € cad.</>;
                      } else if (form === 'Preparazioni semisolide per applicazione cutanea e paste') {
                        return <>• Base: 13,30 € (fino a 50g, 2 comp., 2 op. tec.)<br/>• Extra Q.tà: +0,75 € ogni 50g oltre 50g<br/>• Extra Componenti: +0,75 € cad.<br/>• Op. Tecnologiche Extra: +2,30 € cad.</>;
                      } else if (form === 'Polveri composte e piante per tisane') {
                        return <>• Base: 6,65 € (fino a 2 comp., 2 op. tec.)<br/>• Extra Componenti: +0,75 € cad.<br/>• Op. Tecnologiche Extra: +2,30 € cad.</>;
                      } else if (form === 'Compresse e gomme da masticare medicate') {
                        return <>• Base: 33,25 € (fino a 100 unità, 4 comp., 3 op. tec.)<br/>• Extra Q.tà: +3,00€ ogni 10 unità / -2,00€ ogni 10 in meno<br/>• Op. Tecnologiche Extra: +2,30 € cad.</>;
                      } else {
                        return <>• Tariffa Tabellare Standard</>;
                      }
                    })()}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-50 p-4 rounded-md border border-slate-200"><h3 className="font-bold text-sm text-slate-700 mb-3 border-b pb-2">Costo Materie Prime</h3>{selectedIngredients.map((ing, i) => <div key={i} className="flex justify-between text-sm"><span>{ing.name} ({Number(ing.amountUsed).toFixed(ing.isContainer ? 0 : 2)}{ing.unit})</span><span className="font-mono">€ {(ing.costPerGram * ing.amountUsed).toFixed(2)}</span></div>)}<div className="flex justify-between font-bold text-sm mt-3 pt-2 border-t border-slate-300"><span>Totale Sostanze</span><span>€ {pricing.substances.toFixed(2)}</span></div></div>
                    <div className="bg-slate-50 p-4 rounded-md border border-slate-200 space-y-4">
                        <h3 className="font-bold text-sm text-slate-700 mb-3 border-b pb-2">Onorari & Costi</h3>
                        <div><label className="block text-xs font-bold text-slate-500 mb-1">Onorario Professionale</label><input type="number" className="w-full border p-2 rounded text-right font-mono bg-slate-100" value={professionalFee.toFixed(2)} readOnly /></div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Componenti Attivi Extra (+0.60€ cad.)</label>
                            <div className="w-full flex justify-between items-center bg-slate-100 p-2 rounded text-sm font-mono">
                                <span>{extraComponentsCount} comp.</span>
                                <span>€ {extraComponentsFee.toFixed(2)}</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Op. Tecnologiche Extra (+2.30€ cad.)</label>
                            <div className="w-full flex justify-between items-center bg-slate-100 p-2 rounded text-sm font-mono">
                                <span>{extraOpsCount} oper.</span>
                                <span>€ {extraOpsFee.toFixed(2)}</span>
                            </div>
                        </div>
                        <div><label className="block text-xs font-bold text-slate-500 mb-1">Addizionale</label><input type="text" className="w-full border p-2 rounded text-right font-mono bg-slate-100" value={pricing.additional.toFixed(2)} readOnly /></div>
                    </div>
                </div>
                <div className="bg-teal-50 p-6 rounded-lg border border-teal-200 flex flex-col items-end">
                  {initialData?.id && initialData.totalPrice && (<div className="w-full flex justify-between text-sm text-slate-700 mb-1"><span>Prezzo Salvato (All'ultima modifica)</span><span className="font-bold">€ {parseFloat(initialData.totalPrice).toFixed(2)}</span></div>)}
                  <div className="w-full flex justify-between text-sm text-teal-800 mb-1"><span>Totale Netto</span><span>€ {pricing.net.toFixed(2)}</span></div>
                  <div className="w-full flex justify-between text-sm text-teal-800 mb-2 border-b border-teal-200 pb-2"><span>IVA (10%)</span><span>€ {pricing.vat.toFixed(2)}</span></div>
                  <div className="flex items-baseline gap-4"><span className="text-lg font-bold text-teal-900">PREZZO FINALE</span><span className="text-3xl font-bold text-teal-700">€ {pricing.final.toFixed(2)}</span></div>
                </div>
                <div className="pt-4 flex justify-between"><button onClick={() => setStep(2)} className="text-slate-500 hover:underline">Indietro</button><button onClick={() => setStep(4)} className="bg-teal-600 text-white px-6 py-2 rounded-md hover:bg-teal-700">Avanti</button></div>
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
                return (<div className={`p-4 rounded-md border text-sm flex justify-between items-center ${isBalanced ? 'bg-green-50 border-green-200 text-green-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}><div><span className="block text-xs font-bold uppercase opacity-70">Totale Preparato</span><span className="text-lg font-bold">{totalExpected.toFixed(2)} {getPrepUnit(details.pharmaceuticalForm)}</span></div><div className="text-right"><span className="block text-xs font-bold uppercase opacity-70">Assegnato ai Lotti</span><span className="text-lg font-bold">{totalAllocated.toFixed(2)} {getPrepUnit(details.pharmaceuticalForm)}</span></div><div className={`text-right px-4 py-1 rounded font-mono font-bold ${isBalanced ? 'bg-green-100 text-green-700' : 'bg-white border border-amber-300 text-amber-700'}`}>{remaining > 0 ? `Da assegnare: ${remaining.toFixed(2)}` : remaining < 0 ? `Eccesso: ${Math.abs(remaining).toFixed(2)}` : "BILANCIATO"}</div></div>);
              })()}
              <div className="bg-blue-50 p-4 rounded-md border border-blue-100 text-sm text-blue-800 mb-4"><p>Definisci la quantità di prodotto per ogni confezione e il prezzo di vendita finale per ciascuna.</p></div>
              <div className="space-y-4">
                {selectedIngredients.filter(ing => ing.isContainer).map((container, index) => {
                  const batchInfo = batches.find(b => b.containerId === container.id) || {};
                  return (
                    <div key={index} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end bg-slate-50 p-4 rounded-md border">
                      <div className="sm:col-span-1">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Contenitore</label>
                        <div className="flex flex-col gap-1 p-2 bg-white rounded border border-slate-200">
                          <div className="flex items-center gap-2">
                            <Box size={16} className="text-blue-500" />
                            <span className="font-semibold text-sm truncate">{container.name}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Tot: {Number(container.amountUsed).toFixed(0)}</div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Q.tà / Conf.</label>
                        <input type="number" step="1" placeholder="Es. 30" value={batchInfo.productQuantity || ''} onChange={(e) => handleBatchChange(container.id, 'productQuantity', e.target.value)} className="w-full border p-2 rounded text-sm outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Prezzo (€)</label>
                        <input type="number" step="0.01" placeholder="Es. 15.50" value={batchInfo.unitPrice || ''} onChange={(e) => handleBatchChange(container.id, 'unitPrice', e.target.value)} className="w-full border p-2 rounded text-sm outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1 text-teal-600">Codice MINSAN</label>
                        <input type="text" placeholder="Es. 901234567" value={batchInfo.minsan || ''} onChange={(e) => handleBatchChange(container.id, 'minsan', e.target.value)} className="w-full border border-teal-200 p-2 rounded text-sm outline-none focus:ring-1 ring-teal-500 font-mono" />
                      </div>
                    </div>
                  )
                })}
                {selectedIngredients.filter(ing => ing.isContainer).length === 0 && (<p className="text-center text-slate-400 italic py-12">Nessun contenitore selezionato nello Step 2.<br/>Torna indietro per aggiungerne uno.</p>)}
              </div>
              <div className="pt-4 flex justify-between"><button onClick={() => setStep(3)} className="text-slate-500 hover:underline">Indietro</button><button disabled={Math.abs(calculateBatchBalance()) >= 0.01} onClick={() => setStep(5)} className="bg-teal-600 text-white px-6 py-2 rounded-md hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed">Avanti</button></div>
            </div>
          )}
          
          {((isOfficinale && step === 5) || (!isOfficinale && step === 4)) && (
            <div className="space-y-6 animate-in fade-in">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 pt-4"><FileText size={24} /> Personalizzazione Foglio di Lavorazione</h2>
              <div className="space-y-2"><label className="block text-sm font-bold text-slate-700 uppercase tracking-wide">Procedure operative ed eventuali integrazioni</label><textarea className="w-full border p-3 rounded-md outline-none h-40 resize-y focus:ring-2 ring-teal-500" value={details.operatingProcedures || ''} onChange={e => setDetails({...details, operatingProcedures: e.target.value})} placeholder="Es. Miscelare le polveri in progressione geometrica..."/></div>
              <div className="space-y-2"><label className="block text-sm font-bold text-slate-700 uppercase tracking-wide">Fasi di lavorazione e controlli (per il PDF)</label><div className="grid grid-cols-2 gap-x-4 gap-y-2 p-4 border rounded-md bg-white">{worksheetItems.map((item, index) => (<label key={index} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-50 p-1 rounded"><input type="checkbox" checked={item.checked} onChange={() => handleWorksheetItemChange(index)} className="mt-0.5 h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"/><span className="text-slate-700">{item.text}</span></label>))}</div></div>
              <div className="space-y-2"><label className="block text-sm font-bold text-slate-700 uppercase tracking-wide">Frasi ed avvertenze da riportare in etichetta</label><div className="space-y-2 p-4 border rounded-md bg-white">{["Tenere fuori dalla portata dei bambini", "Tenere al riparo da luce e fonti di calore"].map((warning, i) => (<label key={i} className="flex items-start gap-2 text-sm cursor-pointer hover:bg-slate-50 p-1 rounded"><input type="checkbox" checked={(details.labelWarnings || []).includes(warning)} onChange={() => handleLabelWarningChange(warning)} className="mt-0.5 h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"/><span className="text-slate-700">{warning}</span></label>))}{hasDopingIngredient && (<label className="flex items-start gap-2 text-sm cursor-pointer hover:bg-slate-50 p-1 rounded"><input type="checkbox" checked={(details.labelWarnings || []).includes(dopingWarning)} onChange={() => handleLabelWarningChange(dopingWarning)} className="mt-0.5 h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"/><span className="text-slate-700 font-bold text-red-600">{dopingWarning}</span></label>)}
                <textarea 
                  className="w-full border p-2 rounded-md outline-none h-20 resize-y text-sm mt-2 focus:ring-2 ring-teal-500" 
                  value={details.customLabelWarning || ''} 
                  onChange={e => setDetails({...details, customLabelWarning: e.target.value})} 
                  placeholder="Inserisci altre avvertenze da riportare in etichetta..."
                />
              </div></div>
              <div className="pt-4 flex justify-between"><button onClick={() => setStep(isOfficinale ? 4 : 3)} className="text-slate-500 hover:underline">Indietro</button><button onClick={() => setStep(isOfficinale ? 6 : 5)} className="bg-teal-600 text-white px-6 py-2 rounded-md hover:bg-teal-700">Avanti</button></div>
            </div>
          )}

          {((isOfficinale && step === 6) || (!isOfficinale && step === 5)) && (
              <div className="space-y-6 animate-in fade-in">
                  <div className="text-center"><h2 className="text-xl font-bold text-slate-800 pt-4 flex items-center justify-center gap-2"><ClipboardCheck size={24} />Conferma Finale</h2><div className="bg-slate-50 p-6 border rounded-md mt-4 max-w-md mx-auto"><p className="text-slate-600">Confermi la produzione di <b>{details.name}</b>?</p><p className="text-3xl font-bold mt-2 text-teal-700">€ {pricing.final.toFixed(2)}</p></div></div>
                  {isOfficinale && batches.length > 0 && (<div className="bg-blue-50/50 p-6 border border-blue-100 rounded-md mt-4"><h3 className="text-sm font-bold text-blue-800 uppercase tracking-wider mb-4 flex items-center gap-2"><ListOrdered size={16}/> Riepilogo Lotti di Produzione</h3><div className="space-y-2">{batches.map((batch, i) => { const container = selectedIngredients.find(ing => ing.id === batch.containerId); return (<div key={i} className="flex justify-between items-center bg-white p-3 rounded border border-blue-100 shadow-sm"><div className="flex items-center gap-3"><Box size={18} className="text-blue-500" /><div><div className="font-bold text-sm text-slate-800">{container?.name || 'Contenitore'}</div><div className="text-xs text-slate-500"><span className="font-bold text-blue-600">{Number(container?.amountUsed || 0).toFixed(0)} confezioni</span> preparate con {batch.productQuantity} unità cad.</div></div></div><div className="text-right"><div className="font-mono font-bold text-blue-700">€ {parseFloat(batch.unitPrice || 0).toFixed(2)}</div><div className="text-[10px] text-slate-400 font-bold uppercase">Prezzo Unitario</div></div></div>)})}</div></div>)}
                  <div className="pt-4 flex flex-col-reverse sm:flex-row sm:justify-between items-center gap-4 border-t border-slate-100">
                    <button onClick={() => setStep(isOfficinale ? 5 : 4)} className="text-slate-500 hover:underline w-full sm:w-auto text-center sm:text-left">Indietro</button>
                    <div className="flex flex-wrap justify-center sm:justify-end gap-3 w-full sm:w-auto">
                      <button onClick={handlePrintLabel} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2 whitespace-nowrap"><Printer size={18}/> Stampa Etichetta</button>
                      <button onClick={handleDownloadWorksheet} className="bg-slate-600 text-white px-4 py-2 rounded-md hover:bg-slate-700 flex items-center gap-2 whitespace-nowrap"><FileDown size={18}/> Scarica Foglio</button>
                      {canEdit && <button onClick={handleFinalSave} className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 flex items-center gap-2 whitespace-nowrap"><Save size={18}/> Salva e Completa</button>}
                    </div>
                  </div>
              </div>
          )}
        </Card>
      </div>

      <TechOpsModal 
        isOpen={isTechOpsModalOpen}
        onClose={() => setIsTechOpsModalOpen(false)}
        selectedOps={details.techOps || []}
        onOpChange={handleTechOpChange}
      />
    </>
  );
}

export default PreparationWizard;
