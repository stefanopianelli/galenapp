import React, { useState, useEffect } from 'react';
import { Euro, Plus, Trash2, Save, FileDown, Pencil, Check, Info, Box, FlaskConical, ClipboardCheck, ListOrdered, FileText, Printer, Search, X, User, ArrowRight, AlertTriangle } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { NATIONAL_TARIFF_FEES, VAT_RATE } from '../../constants/tariffs';
import { generateWorkSheetPDF } from '../../services/pdfGenerator';
import { generateLabelPDF } from '../../services/labelGenerator';
import { calculateComplexFee } from '../../services/tariffService';
import TechOpsModal, { TechOpsList } from '../modals/TechOpsModal';
import { getDefaultControls } from '../../constants/qualityControls';
import { formatDate } from '../../utils/dateUtils';
import UniformityCheck from './UniformityCheck';
import ContactAutocomplete from '../ui/ContactAutocomplete';

function PreparationWizard({ inventory, preparations, onComplete, initialData, pharmacySettings, initialStep, canEdit, isAdmin, contacts, refreshContacts }) {
  const prepType = initialData?.prepType || 'magistrale';
  const isOfficinale = prepType === 'officinale';
  const totalSteps = isOfficinale ? 6 : 5;

  const [step, setStep] = useState(initialStep || 1);
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  
  const [currentIngredientId, setCurrentIngredientId] = useState('');
  
  // ... (omitted hooks for brevity in replace context if not needed, but keeping critical ones) ...

  const [details, setDetails] = useState({ 
    name: '', patient: '', patientPhone: '', doctor: '', notes: '', prepNumber: '', quantity: '', 
    expiryDate: '', pharmaceuticalForm: 'Capsule', posology: '', recipeDate: '', usage: 'Orale', operatingProcedures: '', prepType: 'magistrale', labelWarnings: [], customLabelWarning: '', techOps: []
  });

  // Logica Blocco: Bloccato se no permessi OR (Completata AND !Admin)
  const isLocked = !canEdit || (details.status === 'Completata' && !isAdmin);
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

  const getNextPrepNumber = () => {
    const currentYear = new Date().getFullYear().toString().slice(-2);
    let maxProg = 0;
    (preparations || []).forEach(p => {
        // Ignora bozze temporanee nel calcolo del progressivo
        if (p.prepNumber && p.prepNumber.startsWith(`${currentYear}/P`) && !p.prepNumber.startsWith('BOZZA')) {
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
      expiryDate: '', pharmaceuticalForm: 'Capsule', posology: '', recipeDate: '', usage: 'Orale', operatingProcedures: '', status: 'Bozza', prepType: 'magistrale', batches: [], worksheetItems: [], labelWarnings: [], customLabelWarning: '', techOps: [], uniformityCheck: null
    };

    if (initialData) {
        const isDuplicate = initialData.isDuplicate;
        const isNew = !initialData.id;

        setDetails({
            ...defaultDetails, 
            ...initialData,
            prepNumber: (isNew || isDuplicate) ? 'TEMP' : initialData.prepNumber,
            status: initialData.status || 'Bozza'
        });
        
        if (initialData.batches) setBatches(initialData.batches);
        
        if (initialData.worksheetItems && initialData.worksheetItems.length > 0) {
          setWorksheetItems(initialData.worksheetItems);
        } else {
          const form = initialData.pharmaceuticalForm || 'Capsule';
          const defaults = getDefaultControls(form);
          setWorksheetItems(defaults.map(text => ({ text, checked: true })));
        }

        const enrichedIngredients = (initialData.ingredients || []).map(ing => {
          const inventoryItem = (inventory || []).find(item => item.id === ing.id);
          if (!inventoryItem) {
            return { ...ing, securityData: ing.securityData || { pictograms: [] } };
          }
          let finalIsExcipient = inventoryItem.isExcipient || false;
          if (ing.savedIsExcipient !== undefined) {
              finalIsExcipient = ing.savedIsExcipient;
          } else if (ing.isExcipient !== undefined) {
              finalIsExcipient = ing.isExcipient;
          }

          return {
            id: ing.id, amountUsed: ing.amountUsed,
            stockDeduction: ing.stockDeduction || null,
            name: inventoryItem.name, ni: inventoryItem.ni, lot: inventoryItem.lot || '', unit: inventoryItem.unit,
            costPerGram: inventoryItem.costPerGram || 0,
            isExcipient: finalIsExcipient,
            isDisposed: inventoryItem.disposed === 1 || inventoryItem.disposed === true,
            isContainer: inventoryItem.isContainer || false,
            isDoping: inventoryItem.isDoping || false, isNarcotic: inventoryItem.isNarcotic || false,
            securityData: inventoryItem.securityData || { pictograms: [] }
          };
        });
        setSelectedIngredients(enrichedIngredients);
    } else {
      setDetails({ 
        ...defaultDetails,
        prepNumber: 'TEMP', 
      });
      setSelectedIngredients([]);
      const defaults = getDefaultControls('Capsule');
      setWorksheetItems(defaults.map(text => ({ text, checked: true })));
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
    if (['Preparazioni semisolide per applicazione cutanea e paste', 'Polveri composte e piante per tisane', 'Preparazioni semisolide orali vet (a peso)', 'Pillole, pastiglie e granulati (a peso)', 'Pillole omeopatiche', 'Triturazioni e diluizioni omeopatiche', 'Emulsioni, sospensioni e miscele di olii', 'Prep. oftalmiche sterili semisolide'].includes(form)) {
        return 'g';
    }
    if (['Preparazioni liquide (soluzioni)', 'Estratti liquidi e tinture', 'Soluzioni e sospensioni sterili', 'Emulsioni sterili', 'Colliri sterili (soluzioni)'].includes(form)) {
        return 'ml';
    }
    if (['Capsule', 'Suppositori e ovuli', 'Cartine e cialdini', 'Compresse e gomme da masticare medicate', 'Preparazioni semisolide orali vet (a unità)', 'Pillole, pastiglie e granulati (a unità)'].includes(form)) {
        return 'n.';
    }
    return '-';
  };

  const isStep1Valid = (() => {
    const baseFields = details.name && details.prepNumber && details.quantity && details.pharmaceuticalForm && details.expiryDate && details.posology && details.usage;
    if (!baseFields) return false;
    
    // Validazione specifica per Colliri Sterili
    if (['Colliri sterili (soluzioni)', 'Prep. oftalmiche sterili semisolide'].includes(details.pharmaceuticalForm)) {
        const qty = parseFloat(details.quantity);
        if (qty % 10 !== 0) return false;
    }

    if (isOfficinale) return true;
    return !!(details.patient && details.doctor && details.recipeDate);
  })();
  
  const calculateBatchBalance = () => {
    const totalExpected = parseFloat(details.quantity) || 0;
    const totalAllocated = batches.reduce((acc, batch) => {
      const container = selectedIngredients.find(ing => ing.id === batch.containerId);
      // Considera solo contenitori primari (non accessori)
      if (!container || (container.isExcipient && container.isContainer)) return acc;
      
      const numContainers = parseFloat(container.amountUsed) || 0;
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
    const item = inventory.find(i => String(i.id) === String(currentIngredientId));
    
    if (!item) return;

    // Logica Tolleranza
    const qtyRecipe = parseFloat(amountNeeded);
    const qtyWeighed = weighedAmount ? parseFloat(weighedAmount) : null;
    
    // Check duplicati
    const existingIndex = selectedIngredients.findIndex(ing => String(ing.id) === String(item.id));

    if (existingIndex >= 0) {
        // Merge (Somma)
        const newIngredients = [...selectedIngredients];
        const existingItem = newIngredients[existingIndex];
        
        const oldWeighed = existingItem.stockDeduction !== null ? existingItem.stockDeduction : existingItem.amountUsed;
        const newWeighedToAdd = qtyWeighed !== null ? qtyWeighed : qtyRecipe;

        newIngredients[existingIndex] = {
            ...existingItem,
            amountUsed: existingItem.amountUsed + qtyRecipe,
            stockDeduction: oldWeighed + newWeighedToAdd
        };
        setSelectedIngredients(newIngredients);
    } else {
        // Nuovo Inserimento
        setSelectedIngredients([...selectedIngredients, { 
            id: item.id,
            name: item.name,
            ni: item.ni,
            lot: item.lot,
            unit: item.unit,
            costPerGram: item.costPerGram,
            expiry: item.expiry, // Importante per controlli
            isExcipient: item.isExcipient || false,
            isContainer: false,
            isDisposed: item.disposed === 1 || item.disposed === true,
            isDoping: item.isDoping,
            isNarcotic: item.isNarcotic,
            securityData: item.securityData,
            amountUsed: qtyRecipe,
            stockDeduction: qtyWeighed
        }]);
    }
    
    setCurrentIngredientId('');
    setAmountNeeded('');
    setWeighedAmount('');
    setSubstanceSearchTerm('');
  };

  const addContainer = () => {
    if (!currentContainerId || !containerAmountNeeded) return;
    const item = inventory.find(i => String(i.id) === String(currentContainerId));
    
    if (!item) return;

    const qtyToAdd = parseFloat(containerAmountNeeded);
    const remaining = getRemainingQuantity(item);
    
    // Per i contenitori, verifichiamo la disponibilità residua (che tiene conto di quanto già aggiunto in lista)
    // Ma attenzione: getRemainingQuantity sottrae già amountUsed della lista corrente.
    // Quindi se aggiorno, devo controllare se qtyToAdd > remaining.
    
    if (qtyToAdd > remaining) {
      alert(`Quantità insufficiente!`);
      return;
    }

    const existingIndex = selectedIngredients.findIndex(ing => String(ing.id) === String(item.id));

    if (existingIndex >= 0) {
        // Merge
        const newIngredients = [...selectedIngredients];
        newIngredients[existingIndex] = {
            ...newIngredients[existingIndex],
            amountUsed: newIngredients[existingIndex].amountUsed + qtyToAdd
        };
        setSelectedIngredients(newIngredients);
    } else {
        // Nuovo
        setSelectedIngredients([...selectedIngredients, { 
            ...item, 
            amountUsed: qtyToAdd,
            isExcipient: false, // I contenitori non sono eccipienti
            isContainer: true
        }]);
    }

    setCurrentContainerId('');
    setContainerAmountNeeded('');
    setContainerSearchTerm('');
  };
  
  const removeIngredient = (idx) => {
    const newIngredients = [...selectedIngredients];
    newIngredients.splice(idx, 1);
    setSelectedIngredients(newIngredients);
  };

  const toggleExcipient = (idx) => {
    if (isLocked) return;
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
    // Calcolo Costo Sostanze
    const substancesCost = selectedIngredients.reduce((acc, ing) => {
        if (ing.isContainer) return acc;
        return acc + (ing.costPerGram ? parseFloat(ing.costPerGram) * parseFloat(ing.amountUsed) : 0);
    }, 0);

    // Calcolo Costo Contenitori
    const containersCost = selectedIngredients.reduce((acc, ing) => {
        if (!ing.isContainer) return acc;
        return acc + (ing.costPerGram ? parseFloat(ing.costPerGram) * parseFloat(ing.amountUsed) : 0);
    }, 0);

    // Calcolo Onorario Professionale (dal Service centralizzato)
    const { fee: professionalFee, breakdown } = calculateComplexFee(details, selectedIngredients);

    // Calcolo Addizionali (Veleni/Doping)
    let additional = 0;
    const hasHazardousSubstance = selectedIngredients.some(ing => (ing.securityData?.pictograms?.length > 0) || ing.isDoping || ing.isNarcotic);
    if (hasHazardousSubstance) {
        additional = 2.50;
    }

    const net = substancesCost + containersCost + professionalFee + additional;
    const vat = net * VAT_RATE;
    const final = net + vat;

    return { 
        substances: substancesCost, 
        containers: containersCost,
        fee: professionalFee, 
        additional, 
        net, 
        vat, 
        final,
        breakdown // Passiamo il breakdown alla UI
    };
  };

  const pricing = calculateTotal();

  // Recupera i dati di dettaglio direttamente dal service (evita duplicazione logica)
  const { extraOpsCount = 0, extraCompCount = 0, extraOpsFee = 0, extraCompFee = 0 } = pricing.breakdown || {};
  // Mappatura nomi variabili legacy per compatibilità UI esistente
  const extraComponentsCount = extraCompCount;
  const extraComponentsFee = extraCompFee;

  const handleDownloadWorksheet = () => generateWorkSheetPDF({ details: { ...details, worksheetItems }, ingredients: selectedIngredients, pricing }, pharmacySettings);
  
  const handlePrintLabel = () => {
      // Passiamo i dettagli correnti. Se non è salvata, l'ID potrebbe mancare per il QR, ma generiamo comunque.
      generateLabelPDF({ ...details, id: initialData?.id }, pharmacySettings);
  };

  const handleFinalSave = () => {
    if (details.name && selectedIngredients.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      
      // Controllo se gli ingredienti sono cambiati
      let hasIngredientsChanged = true;
      if (initialData && initialData.ingredients) {
          const oldIngs = initialData.ingredients;
          const newIngs = selectedIngredients;
          
          if (oldIngs.length === newIngs.length) {
              const isSame = oldIngs.every((old, i) => {
                  const curr = newIngs[i];
                  return String(old.id) === String(curr.id) &&
                         parseFloat(old.amountUsed) === parseFloat(curr.amountUsed) &&
                         parseFloat(old.stockDeduction || 0) === parseFloat(curr.stockDeduction || 0);
              });
              if (isSame) hasIngredientsChanged = false;
          }
      }

      const isConfirmingDraft = initialData?.status === 'Bozza';
      const finalDate = (initialData?.id && !hasIngredientsChanged && !isConfirmingDraft) ? initialData.date : today;

      // LAZY NUMBERING: Assegna numero reale solo ora
      let finalPrepNumber = details.prepNumber;
      if (finalPrepNumber === 'TEMP' || finalPrepNumber.startsWith('BOZZA')) {
          finalPrepNumber = getNextPrepNumber();
      }

      onComplete(selectedIngredients, { 
          ...details, 
          prepNumber: finalPrepNumber, // Salva col numero definitivo
          date: finalDate,
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
    
    // Assegna ID temporaneo se non ne ha uno
    let draftPrepNumber = details.prepNumber;
    if (draftPrepNumber === 'TEMP') {
        draftPrepNumber = `BOZZA-${Date.now().toString().slice(-6)}`;
    }

    onComplete(selectedIngredients, { 
        ...details, 
        prepNumber: draftPrepNumber,
        prepUnit: getPrepUnit(details.pharmaceuticalForm), 
        totalPrice: pricing.final, 
        batches, 
        worksheetItems, 
        pricingData: pricing 
    }, true);
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
    'Colliri sterili (soluzioni)',
    'Prep. oftalmiche sterili semisolide',
    'Emulsioni, sospensioni e miscele di olii',
    'Preparazioni semisolide per applicazione cutanea e paste',
    'Preparazioni semisolide orali vet (a peso)',
    'Preparazioni semisolide orali vet (a unità)',
    'Pillole, pastiglie e granulati (a peso)',
    'Pillole, pastiglie e granulati (a unità)',
    'Polveri composte e piante per tisane',
    'Cartine e cialdini',
    'Capsule',
    'Compresse e gomme da masticare medicate',
    'Suppositori e ovuli'
  ];
  const usageOptions = ['Orale', 'Topico', 'Sublinguale', 'Buccale', 'Rettale', 'Inalatoria', 'Transdermica', 'Vaginale', 'Parenterale'];
  
  const UNIFORMITY_FORMS = ['Capsule', 'Cartine e cialdini', 'Suppositori e ovuli', 'Compresse e gomme da masticare medicate', 'Pillole, pastiglie e granulati (a unità)'];

  return (
    <>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="mb-12 px-4">
          <div className="flex items-center justify-between relative">
            {/* Linea di sfondo */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 -z-10 rounded-full"></div>
            {/* Linea di progresso attiva */}
            <div 
                className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-teal-500 -z-10 rounded-full transition-all duration-500 ease-out" 
                style={{ width: `${((step - 1) / (stepLabels.length - 1)) * 100}%` }}
            ></div>

            {stepLabels.map((label, index) => {
                const num = index + 1;
                const isCompleted = step > num;
                const isCurrent = step === num;
                
                return (
                    <div 
                        key={num} 
                        onClick={() => handleStepClick(num)} 
                        className={`flex flex-col items-center gap-2 cursor-pointer select-none group relative ${isCurrent ? 'scale-110' : ''} transition-transform duration-300`}
                    >
                        <div className={`
                            w-10 h-10 rounded-full flex items-center justify-center border-4 shadow-sm transition-all duration-300 z-10
                            ${isCompleted ? 'bg-teal-500 border-teal-500 text-white' : 
                              isCurrent ? 'bg-white border-teal-500 text-teal-600 shadow-teal-200 ring-2 ring-teal-100 ring-offset-2' : 
                              'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}
                        `}>
                            {isCompleted ? <Check size={20} strokeWidth={3} /> : <span className="font-bold text-sm">{num}</span>}
                        </div>
                        <span className={`
                            absolute -bottom-8 text-xs font-bold whitespace-nowrap transition-colors duration-300
                            ${isCurrent ? 'text-teal-700' : isCompleted ? 'text-teal-600' : 'text-slate-400'}
                        `}>
                            {label}
                        </span>
                    </div>
                );
            })}
          </div>
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
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                      <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                          <FlaskConical className="text-teal-600" size={20}/> Dati Tecnici
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="md:col-span-2">
                              <label className="block text-sm font-bold text-slate-700 mb-1">Nome Preparazione *</label>
                              <input className="w-full border p-3 rounded-lg outline-none focus:ring-2 ring-teal-500 bg-white" value={details.name} onChange={e => setDetails({...details, name: e.target.value})} placeholder="Es. Minoxidil Lozione 5%" />
                          </div>
                          <div>
                              <label className="block text-sm font-bold text-slate-700 mb-1">Numero Preparazione</label>
                              <input className="w-full border p-3 rounded-lg outline-none bg-slate-200 text-slate-600 font-mono cursor-not-allowed" value={(details.prepNumber === 'TEMP' || details.prepNumber.startsWith('BOZZA')) ? 'BOZZA (Auto-assegnato)' : details.prepNumber} readOnly />
                          </div>
                          <div>
                              <label className="block text-sm font-bold text-slate-700 mb-1">Forma Farmaceutica *</label>
                              <select 
                                  className="w-full border p-3 rounded-lg outline-none bg-white focus:ring-2 ring-teal-500" 
                                  value={details.pharmaceuticalForm} 
                                  onChange={e => {
                                      const form = e.target.value;
                                      setDetails({...details, pharmaceuticalForm: form, uniformityCheck: null});
                                      const newCtrls = getDefaultControls(form);
                                      setWorksheetItems(newCtrls.map(text => ({ text, checked: true })));
                                  }}
                              >
                                  {pharmaForms.map(f => (<option key={f} value={f}>{f}</option>))}
                              </select>
                          </div>
                          <div>
                              <label className="block text-sm font-bold text-slate-700 mb-1">Quantità Totale ({getPrepUnit(details.pharmaceuticalForm)}) *</label>
                              <input type="number" step="0.01" className="w-full border p-3 rounded-lg outline-none focus:ring-2 ring-teal-500 bg-white" value={details.quantity} onChange={e => setDetails({...details, quantity: e.target.value})} />
                              {['Colliri sterili (soluzioni)', 'Prep. oftalmiche sterili semisolide'].includes(details.pharmaceuticalForm) && details.quantity && parseFloat(details.quantity) % 10 !== 0 && (
                                  <p className="text-xs text-red-600 mt-1 font-bold flex items-center gap-1"><Info size={12}/> Deve essere un multiplo di 10</p>
                              )}
                          </div>
                          <div>
                              <label className="block text-sm font-bold text-slate-700 mb-1">Data Scadenza *</label>
                              <input type="date" className="w-full border p-3 rounded-lg outline-none focus:ring-2 ring-teal-500 bg-white" value={details.expiryDate} onChange={e => setDetails({...details, expiryDate: e.target.value})} />
                          </div>
                      </div>
                  </div>

                  {!isOfficinale && (
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <User className="text-blue-600" size={20}/> Riferimenti Ricetta
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Paziente *</label>
                                <ContactAutocomplete 
                                    value={details.patient} 
                                    onChange={(val) => setDetails({ ...details, patient: val })} 
                                    onSelect={(c) => setDetails(prev => ({ ...prev, patientPhone: c.phone || prev.patientPhone }))}
                                    contacts={contacts} 
                                    refreshContacts={refreshContacts}
                                    type="customer" 
                                    placeholder="Nome Cognome" 
                                    className="w-full border p-3 rounded-lg outline-none focus:ring-2 ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Telefono (Opzionale)</label>
                                <input className="w-full border p-3 rounded-lg outline-none focus:ring-2 ring-blue-500" value={details.patientPhone} onChange={e => setDetails({...details, patientPhone: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Medico Prescrittore *</label>
                                <ContactAutocomplete 
                                    value={details.doctor} 
                                    onChange={(val) => setDetails({ ...details, doctor: val })} 
                                    contacts={contacts} 
                                    refreshContacts={refreshContacts}
                                    type="doctor" 
                                    placeholder="Dr. Nome Cognome" 
                                    className="w-full border p-3 rounded-lg outline-none focus:ring-2 ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Data Ricetta *</label>
                                <input type="date" className="w-full border p-3 rounded-lg outline-none focus:ring-2 ring-blue-500" value={details.recipeDate} onChange={e => setDetails({...details, recipeDate: e.target.value})} />
                            </div>
                        </div>
                    </div>
                  )}

                  <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                      <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                          <ClipboardCheck className="text-indigo-600" size={20}/> Modalità d'Uso
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="md:col-span-2">
                              <label className="block text-sm font-bold text-slate-700 mb-1">Via di Somministrazione *</label>
                              <select className="w-full border p-3 rounded-lg outline-none bg-white focus:ring-2 ring-indigo-500" value={details.usage} onChange={e => setDetails({...details, usage: e.target.value})}>
                                  {usageOptions.map(u => <option key={u} value={u}>{u}</option>)}
                              </select>
                          </div>
                          <div className="md:col-span-2">
                              <label className="block text-sm font-bold text-slate-700 mb-1">Posologia e Avvertenze *</label>
                              <textarea className="w-full border p-3 rounded-lg outline-none h-24 resize-y focus:ring-2 ring-indigo-500 bg-white" value={details.posology} onChange={e => setDetails({...details, posology: e.target.value})} placeholder="Es. 1 capsula 2 volte al dì dopo i pasti..." />
                          </div>
                      </div>
                  </div>

                  <div className="flex justify-end items-center gap-4 pt-4 mt-6">
                      {!isStep1Valid && (
                          <span className="text-sm text-red-500 font-bold bg-red-50 px-4 py-2 rounded-lg border border-red-100 animate-pulse flex items-center gap-2">
                              <AlertTriangle size={16}/> Compila i campi obbligatori
                          </span>
                      )}
                      <button 
                          disabled={!isStep1Valid} 
                          onClick={() => setStep(2)} 
                          className="bg-teal-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
                      >
                          Avanti <ArrowRight size={18}/>
                      </button>
                  </div>
              </div>
          )}
          
          {step === 2 && ( 
            <div className="space-y-6 animate-in fade-in">
                <h2 className="text-xl font-bold text-slate-800">Selezione Componenti</h2>
                <div className="bg-blue-50 p-4 rounded-md border border-blue-100 text-sm text-blue-800 mb-4 pt-4"><p>Seleziona i lotti specifici. Il sistema calcola la giacenza residua.</p></div>
                {/* Sezione Aggiunta Sostanze */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <FlaskConical className="text-teal-600" size={20}/> Sostanze e Principi Attivi
                    </h2>
                    
                    {/* Search Bar Sostanze */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Cerca Sostanza in Magazzino</label>
                        <div className="relative group">
                            <Search className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-teal-500 transition-colors" size={18} />
                            <input 
                                type="text" 
                                className={`w-full border p-3 pl-12 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 focus:bg-white transition-all ${!currentIngredientId && substanceSearchTerm ? 'border-teal-300' : 'border-slate-200'}`}
                                placeholder="Nome, N.I. o Lotto..." 
                                value={substanceSearchTerm}
                                onChange={(e) => { 
                                    setSubstanceSearchTerm(e.target.value); 
                                    setIsSearchOpen(true); 
                                    if(currentIngredientId) setCurrentIngredientId('');
                                }}
                                onFocus={() => setIsSearchOpen(true)}
                                onBlur={() => setTimeout(() => setIsSearchOpen(false), 200)}
                            />
                            {currentIngredientId && (
                                <button onClick={() => { setCurrentIngredientId(''); setSubstanceSearchTerm(''); }} className="absolute right-4 top-3.5 text-slate-400 hover:text-red-500 transition-colors">
                                    <X size={18} />
                                </button>
                            )}

                            {/* Dropdown Risultati Sostanze */}
                            {isSearchOpen && (
                                <div className="absolute z-50 w-full bg-white border border-slate-200 mt-2 rounded-xl shadow-xl max-h-72 overflow-y-auto ring-1 ring-slate-900/5">
                                    {availableSubstances
                                        .filter(item => {
                                            const term = substanceSearchTerm.toLowerCase();
                                            return !term || item.name.toLowerCase().includes(term) || (item.ni && item.ni.toLowerCase().includes(term)) || (item.lot && item.lot.toLowerCase().includes(term));
                                        })
                                        .sort((a, b) => {
                                            const nameCompare = a.name.localeCompare(b.name);
                                            if (nameCompare !== 0) return nameCompare;
                                            return new Date(a.expiry) - new Date(b.expiry);
                                        })
                                        .map(item => {
                                            const isOldest = batchCounts[item.name] > 1 && oldestBatches[item.name] && oldestBatches[item.name].id === item.id;
                                            return (
                                                <div 
                                                    key={item.id} 
                                                    onClick={() => { setCurrentIngredientId(item.id); setSubstanceSearchTerm(item.name); setIsSearchOpen(false); }}
                                                    className={`p-4 border-b border-slate-50 cursor-pointer hover:bg-teal-50 transition-colors ${isOldest ? 'bg-green-50/30' : ''}`}
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <div className="font-bold text-slate-800 flex items-center gap-2">
                                                                {item.name}
                                                                {isOldest && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold border border-green-200">FIFO</span>}
                                                            </div>
                                                            <div className="text-xs text-slate-500 mt-1 flex gap-3">
                                                                <span>N.I.: <strong className="font-mono text-slate-700">{item.ni}</strong></span>
                                                                {item.lot && <span>Lotto: <strong className="font-mono text-slate-700">{item.lot}</strong></span>}
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className={`text-xs font-bold ${isOldest ? 'text-green-700' : 'text-slate-600'}`}>Scad: {formatDate(item.expiry)}</div>
                                                            <div className="mt-1"><span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-100">Disp: {getRemainingQuantity(item).toFixed(2)} {item.unit}</span></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    {availableSubstances.filter(item => item.name.toLowerCase().includes(substanceSearchTerm.toLowerCase())).length === 0 && (
                                        <div className="p-6 text-center text-slate-400 text-sm italic">Nessuna sostanza trovata.</div>
                                    )}
                                </div>
                            )}
                        </div>
                        {!isSelectedBatchOptimal() && (
                            <div className="flex items-center gap-2 text-xs text-amber-600 font-bold bg-amber-50 p-2 rounded border border-amber-100 animate-pulse">
                                <AlertTriangle size={14} /> Attenzione: Esiste un lotto con scadenza precedente.
                            </div>
                        )}
                    </div>

                    {/* Campi Input Sostanza */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end pt-2">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Q.tà Ricetta</label>
                            <input type="number" step="0.01" placeholder="0.00" className="w-full border p-3 rounded-lg text-sm outline-none focus:ring-2 ring-teal-500" value={amountNeeded} onChange={e => setAmountNeeded(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Q.tà Pesata (Reale)</label>
                            <input type="number" step="0.01" placeholder="Auto" className="w-full border p-3 rounded-lg text-sm outline-none bg-amber-50 focus:ring-2 ring-amber-500" value={weighedAmount} onChange={e => setWeighedAmount(e.target.value)} />
                        </div>
                        <button onClick={addIngredient} disabled={!currentIngredientId || isLocked} className="bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed font-bold shadow-sm flex items-center justify-center gap-2 transition-colors">
                            <Plus size={18} /> Aggiungi
                        </button>
                    </div>
                </div>
                {/* Sezione Aggiunta Contenitori */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Box className="text-blue-600" size={20}/> Aggiungi Contenitore
                    </h2>
                    <div className="space-y-4">
                        <div className="relative w-full">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-2">Cerca Contenitore</label>
                            <div className="relative group">
                                <Search className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                                <input 
                                    type="text" 
                                    className={`w-full border p-3 pl-12 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-all ${!currentContainerId && containerSearchTerm ? 'border-blue-300' : 'border-slate-200'}`}
                                    placeholder="Nome o N.I. del contenitore..." 
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
                                    <button onClick={() => { setCurrentContainerId(''); setContainerSearchTerm(''); }} className="absolute right-4 top-3.5 text-slate-400 hover:text-red-500 transition-colors">
                                        <X size={18} />
                                    </button>
                                )}
                                
                                {/* Dropdown Contenitori */}
                                {isContainerSearchOpen && (
                                    <div className="absolute z-50 w-full bg-white border border-slate-200 mt-2 rounded-xl shadow-xl max-h-60 overflow-y-auto ring-1 ring-slate-900/5">
                                        {availableContainers
                                            .filter(item => { const term = containerSearchTerm.toLowerCase(); return !term || item.name.toLowerCase().includes(term) || (item.ni && item.ni.toLowerCase().includes(term)); })
                                            .sort((a, b) => a.name.localeCompare(b.name))
                                            .map(item => (
                                                <div 
                                                    key={item.id} 
                                                    onClick={() => { setCurrentContainerId(item.id); setContainerSearchTerm(item.name); setIsContainerSearchOpen(false); }} 
                                                    className="p-4 border-b border-slate-50 cursor-pointer hover:bg-blue-50 transition-colors"
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
                                            <div className="p-6 text-center text-slate-400 text-sm italic">Nessun contenitore trovato.</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex items-end gap-4">
                            <div className="w-32">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-2">Quantità</label>
                                <input type="number" step="1" placeholder="Pezzi" className="w-full border p-3 rounded-lg text-sm outline-none focus:ring-2 ring-blue-500 bg-slate-50 focus:bg-white transition-all" value={containerAmountNeeded} onChange={e => setContainerAmountNeeded(e.target.value)} />
                            </div>
                            <button onClick={addContainer} disabled={!currentContainerId || isLocked} className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-bold shadow-sm flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 whitespace-nowrap">
                                <Plus size={18} /> Aggiungi
                            </button>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mt-8 space-y-4"><h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><ListOrdered className="text-teal-600" size={20}/> Riepilogo Composizione</h3>
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
                            : (ing.isDisposed ? 'bg-slate-100 border-slate-300 opacity-80' : (ing.isContainer ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200'))
                    }`}>
                      <div className="flex items-center gap-3">
                        {ing.isContainer ? <Box size={20} className={isInsufficient ? "text-red-500" : "text-blue-500"}/> : <FlaskConical size={20} className={isInsufficient ? "text-red-500" : "text-teal-500"}/>}
                        <div>
                            <div className={`font-bold flex items-center gap-2 ${isInsufficient ? "text-red-700" : "text-slate-800"}`}>
                                {ing.name}
                                {ing.isDisposed && <span className="text-[9px] bg-red-600 text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shadow-sm">Dismesso</span>}
                            </div>
                            <div className="text-xs text-slate-500">N.I.: {ing.ni} | €{Number(ing.costPerGram).toFixed(ing.isContainer ? 2 : 4)}/{ing.unit}</div>
                            {isInsufficient && (
                                <div className="text-xs font-bold text-red-600 flex items-center gap-1 mt-1 animate-pulse">
                                    ⚠ GIACENZA INSUFFICIENTE (Disp: {currentStock.toFixed(2)} {ing.unit})
                                </div>
                            )}
                        </div>
                      </div>
                      
                      {/* Toggle Tipo (Attivo/Eccipiente o Primario/Accessorio) */}
                      {(!ing.isContainer || isOfficinale) && (
                          <div 
                              onClick={() => canEdit && !ing.isDisposed && toggleExcipient(idx)}
                              className={`px-2 py-1 rounded text-xs font-bold select-none ${canEdit && !ing.isDisposed ? 'cursor-pointer hover:opacity-80' : 'cursor-not-allowed opacity-50'} ${ing.isExcipient ? 'bg-slate-200 text-slate-600' : (ing.isContainer ? 'bg-blue-100 text-blue-700' : 'bg-teal-100 text-teal-700')}`}
                          >
                              {ing.isContainer 
                                  ? (ing.isExcipient ? "Accessorio" : "Primario (Lotto)") 
                                  : (ing.isExcipient ? "Eccipiente" : "Principio Attivo")}
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
                        {editingIngredientIndex === idx ? (
                            <button type="button" onClick={() => saveEditingAmount(idx)} className="text-green-600 hover:bg-green-50 p-1.5 rounded-full transition-colors"><Check size={16} /></button>
                        ) : (
                            <button 
                                type="button" 
                                onClick={() => !ing.isDisposed && startEditingAmount(idx)} 
                                disabled={ing.isDisposed || isLocked}
                                className={`p-1.5 rounded-full transition-colors ${ing.isDisposed || isLocked ? 'text-slate-300 cursor-not-allowed opacity-50' : 'text-blue-600 hover:bg-blue-50 cursor-pointer'}`}
                            >
                                <Pencil size={16} />
                            </button>
                        )}
                        <button 
                            type="button" 
                            onClick={() => removeIngredient(idx)} 
                            disabled={isLocked}
                            className={`p-1.5 rounded-full transition-colors ${isLocked ? 'text-slate-300 cursor-not-allowed opacity-50' : 'text-red-500 hover:bg-red-50 cursor-pointer'}`}
                        >
                            <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    );
                  })}
                  {selectedIngredients.length === 0 && <p className="text-center text-slate-400 italic py-4">Nessun componente selezionato.</p>}
                </div>
                              {/* Operazioni Tecnologiche */}
                              {!isOfficinale && (
                                <div className="bg-white p-6 rounded-xl border-l-4 border-l-indigo-500 border border-slate-200 shadow-md mt-8 space-y-4">
                                  <div className="flex justify-between items-center">
                                      <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><ClipboardCheck size={20} className="text-indigo-600"/> Operazioni Tecnologiche</h3>
                                      <button onClick={() => setIsTechOpsModalOpen(true)} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium px-3 py-1 rounded hover:bg-indigo-50 transition-colors">
                                          {details.techOps?.length > 0 ? "Modifica" : "+ Aggiungi"}
                                      </button>
                                  </div>
                                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 min-h-[60px] flex items-center">
                                      {details.techOps && details.techOps.length > 0 ? (
                                          <div className="flex flex-wrap gap-2">
                                              {details.techOps.map(opCode => {
                                                  const op = TechOpsList.find(o => o.code === opCode);
                                                  return <Badge key={opCode} type="neutral">{op ? op.text : opCode}</Badge>
                                              })}
                                          </div>
                                      ) : <p className="text-sm text-slate-400 italic w-full text-center">Nessuna operazione speciale selezionata.</p>}
                                  </div>
                                </div>
                              )}                <div className="pt-6 flex justify-between border-t border-slate-100 mt-8">
                    <button onClick={() => setStep(1)} className="text-slate-500 hover:text-slate-700 font-medium px-4 py-2 hover:bg-slate-100 rounded-lg transition-colors">Indietro</button>
                    <button 
                        disabled={selectedIngredients.length === 0 || (details.status !== 'Completata' && selectedIngredients.some(ing => { const item = inventory.find(i => String(i.id) === String(ing.id)); const ded = (ing.stockDeduction > 0) ? ing.stockDeduction : ing.amountUsed; return item && ded > parseFloat(item.quantity); }))} 
                        onClick={() => setStep(isOfficinale ? 4 : 3)} 
                        className="bg-teal-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
                    >
                        {isOfficinale ? "Avanti" : "Calcola Prezzo"} <ArrowRight size={18}/>
                    </button>
                </div>
            </div>
          )}
          
          {step === 3 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Euro size={24} className="text-teal-600"/> Tariffazione Nazionale</h2>
                    <Badge type="info">D.M. 22/09/2017</Badge>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-900 flex items-start gap-3 shadow-sm">
                  <Info size={20} className="mt-0.5 shrink-0 text-blue-600" />
                  <div className="leading-relaxed">
                    <strong className="block mb-1 text-blue-700">Dettaglio Applicazione Tariffa:</strong>
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
                      } else if (form.includes('Preparazioni semisolide orali vet')) {
                        return <>• Base: 13,30 € (fino a 5 unità o 50g)<br/>• Extra Q.tà: +0,30€ ogni unità/10g in più / -0,80€ ogni unità/5g in meno<br/>• Extra Componenti: +0,60€ (oltre il 2°)<br/>• Op. Tecnologiche: 3 incluse, +2,30€ per le extra</>;
                      } else if (form.includes('Pillole, pastiglie e granulati')) {
                        return <>• Base: 19,95 € (fino a 20 unità o 100g)<br/>• Extra Q.tà: +0,15€ ogni unità/50g in più / -0,30€ ogni 10 unità/50g in meno<br/>• Extra Componenti: +0,60€ (oltre il 1°)<br/>• Op. Tecnologiche: 4 incluse, +2,30€ per le extra</>;
                      } else if (form.includes('Colliri sterili') || form.includes('Prep. oftalmiche sterili')) {
                        return <>• Base: 31,65 € per recipiente (ogni 10ml o 10g)<br/>• Extra Componenti: +5,00€ (oltre il 2°)<br/>• Op. Tecnologiche: 4 incluse, +10,00€ per le extra</>;
                      } else {
                        return <>• Tariffa Tabellare Standard</>;
                      }
                    })()}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Card Materie Prime */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-full flex flex-col">
                        <h3 className="font-bold text-lg text-slate-800 mb-4 pb-3 border-b border-slate-100 flex justify-between items-center">
                            <span>Costo Materie Prime</span>
                            <FlaskConical size={18} className="text-slate-400"/>
                        </h3>
                        <div className="space-y-1 flex-1">
                            {Object.values(selectedIngredients.reduce((acc, ing) => {
                                const key = ing.name;
                                if (!acc[key]) {
                                    acc[key] = { 
                                        ...ing, 
                                        amountUsed: 0, 
                                        totalCost: 0 
                                    };
                                }
                                acc[key].amountUsed += parseFloat(ing.amountUsed);
                                acc[key].totalCost += (ing.costPerGram ? parseFloat(ing.costPerGram) * parseFloat(ing.amountUsed) : 0);
                                return acc;
                            }, {})).map((ing, i) => (
                                <div key={i} className="flex justify-between items-start gap-4 hover:bg-slate-50 p-1 rounded transition-colors">
                                    <span className="text-slate-600 text-sm leading-tight">
                                        {ing.name} <span className="text-[10px] text-slate-400">({Number(ing.amountUsed).toFixed(ing.isContainer ? 0 : 2)}{ing.unit})</span>
                                    </span>
                                    <span className="font-mono font-bold text-slate-700 whitespace-nowrap text-right shrink-0">
                                        € {ing.totalCost.toFixed(2)}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 pt-4 border-t border-slate-200 text-slate-800 space-y-2">
                            <div className="flex justify-between text-sm font-medium">
                                <span>Totale Sostanze</span>
                                <span>€ {pricing.substances.toFixed(2)}</span>
                            </div>
                            {pricing.containers > 0 && (
                                <div className="flex justify-between text-sm font-medium text-blue-700">
                                    <span>Totale Contenitori</span>
                                    <span>€ {pricing.containers.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between font-bold text-base pt-2 border-t border-slate-100">
                                <span>Totale Materiali</span>
                                <span>€ {(pricing.substances + pricing.containers).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Card Onorari */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-full flex flex-col">
                        <h3 className="font-bold text-lg text-slate-800 mb-4 pb-3 border-b border-slate-100 flex justify-between items-center">
                            <span>Onorari & Costi</span>
                            <Euro size={18} className="text-slate-400"/>
                        </h3>
                        <div className="space-y-4 flex-1">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Onorario Professionale</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-slate-400">€</span>
                                    <input type="number" className="w-full border p-2 pl-8 rounded-lg text-right font-mono font-bold bg-slate-50 text-slate-800 outline-none" value={pricing.fee.toFixed(2)} readOnly />
                                </div>
                            </div>
                            
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                <label className="block text-xs font-bold text-slate-500 mb-2">Supplementi</label>
                                <div className="flex justify-between items-center text-sm mb-1">
                                    <span className="text-slate-600">Componenti Extra</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs bg-white border px-1.5 rounded">{extraComponentsCount}</span>
                                        <span className="font-mono">€ {extraComponentsFee.toFixed(2)}</span>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-600">Op. Tecnologiche Extra</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs bg-white border px-1.5 rounded">{extraOpsCount}</span>
                                        <span className="font-mono">€ {extraOpsFee.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Costo Addizionale</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-slate-400">€</span>
                                    <input type="text" className="w-full border p-2 pl-8 rounded-lg text-right font-mono font-bold bg-slate-50 text-slate-800 outline-none" value={pricing.additional.toFixed(2)} readOnly />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Hero Card Totale */}
                <div className="bg-gradient-to-r from-teal-600 to-teal-700 p-8 rounded-2xl shadow-lg text-white flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>
                  
                  <div className="z-10 w-full md:w-auto">
                      <div className="text-teal-100 text-sm font-medium mb-1">Riepilogo Finale</div>
                      {initialData?.id && initialData.totalPrice && (
                          <div className="text-xs text-teal-200 bg-teal-800/30 px-3 py-1 rounded-full inline-block mb-2">
                              Salvato prec: € {parseFloat(initialData.totalPrice).toFixed(2)}
                          </div>
                      )}
                      <div className="space-y-1">
                          <div className="flex justify-between text-sm text-teal-100 w-48"><span>Imponibile</span> <span>€ {pricing.net.toFixed(2)}</span></div>
                          <div className="flex justify-between text-sm text-teal-100 w-48 border-b border-teal-500/50 pb-1"><span>IVA (10%)</span> <span>€ {pricing.vat.toFixed(2)}</span></div>
                      </div>
                  </div>

                  <div className="text-center md:text-right z-10">
                      <span className="block text-sm font-bold text-teal-200 uppercase tracking-widest mb-1">Prezzo al Pubblico</span>
                      <span className="text-5xl font-extrabold tracking-tight drop-shadow-sm">€ {pricing.final.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex justify-between pt-6 border-t border-slate-200">
                    <button onClick={() => setStep(2)} className="text-slate-500 hover:text-slate-700 font-medium px-4 py-2 hover:bg-slate-100 rounded-lg transition-colors">Indietro</button>
                    <button 
                        onClick={() => setStep(4)} 
                        className="bg-teal-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
                    >
                        Avanti <ArrowRight size={18}/>
                    </button>
                </div>
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
                {selectedIngredients.filter(ing => ing.isContainer && !ing.isExcipient).map((container, index) => {
                  const batchInfo = batches.find(b => b.containerId === container.id) || {};
                  return (
                    <div key={index} className="bg-slate-50 p-4 rounded-md border border-slate-200">
                      {/* Riga 1: Info Contenitore */}
                      <div className="mb-3">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Contenitore</label>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 bg-white rounded border border-slate-200">
                          <div className="flex items-center gap-2">
                            <Box size={18} className="text-blue-500 shrink-0" />
                            <span className="font-semibold text-sm text-slate-800 break-all">{container.name}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider bg-slate-100 px-2 py-1 rounded whitespace-nowrap">
                            Totale Pezzi: {Number(container.amountUsed).toFixed(0)}
                          </div>
                        </div>
                      </div>

                      {/* Riga 2: Input Lotti */}
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Q.tà / Conf.</label>
                          <input type="number" step="1" placeholder="Es. 30" value={batchInfo.productQuantity || ''} onChange={(e) => handleBatchChange(container.id, 'productQuantity', e.target.value)} className="w-full border p-2 rounded text-sm outline-none focus:ring-1 ring-blue-500" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Prezzo (€)</label>
                          <input type="number" step="0.01" placeholder="Es. 15.50" value={batchInfo.unitPrice || ''} onChange={(e) => handleBatchChange(container.id, 'unitPrice', e.target.value)} className="w-full border p-2 rounded text-sm outline-none focus:ring-1 ring-blue-500" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1 text-teal-600">Codice MINSAN</label>
                          <input type="text" placeholder="Es. 901234567" value={batchInfo.minsan || ''} onChange={(e) => handleBatchChange(container.id, 'minsan', e.target.value)} className="w-full border border-teal-200 p-2 rounded text-sm outline-none focus:ring-1 ring-teal-500 font-mono" />
                        </div>
                      </div>
                    </div>
                  )
                })}
                {selectedIngredients.filter(ing => ing.isContainer && !ing.isExcipient).length === 0 && (<p className="text-center text-slate-400 italic py-12">Nessun contenitore primario selezionato.<br/>Definisci almeno un contenitore come 'Primario (Lotto)' nello Step 2.</p>)}
              </div>
              <div className="pt-6 flex justify-between border-t border-slate-100 mt-8">
                  <button onClick={() => setStep(2)} className="text-slate-500 hover:text-slate-700 font-medium px-4 py-2 hover:bg-slate-100 rounded-lg transition-colors">Indietro</button>
                  <button 
                      disabled={Math.abs(calculateBatchBalance()) >= 0.01} 
                      onClick={() => setStep(5)} 
                      className="bg-teal-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
                  >
                      Avanti <ArrowRight size={18}/>
                  </button>
              </div>
            </div>
          )}
          
          {((isOfficinale && step === 5) || (!isOfficinale && step === 4)) && (
            <div className="space-y-6 animate-in fade-in">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 pt-4"><FileText size={24} /> Personalizzazione Foglio di Lavorazione</h2>
              <div className="space-y-2"><label className="block text-sm font-bold text-slate-700 uppercase tracking-wide">Procedure operative ed eventuali integrazioni</label><textarea className="w-full border p-3 rounded-md outline-none h-40 resize-y focus:ring-2 ring-teal-500" value={details.operatingProcedures || ''} onChange={e => setDetails({...details, operatingProcedures: e.target.value})} placeholder="Es. Miscelare le polveri in progressione geometrica..."/></div>
                            <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide">Fasi di lavorazione e controlli (per il PDF)</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 border rounded-xl bg-white shadow-inner">
                      {worksheetItems.map((item, index) => (
                          <label key={index} className="flex items-center gap-3 text-sm cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors">
                              <input type="checkbox" checked={item.checked} onChange={() => handleWorksheetItemChange(index)} className="h-5 w-5 rounded border-gray-300 text-teal-600 focus:ring-teal-500"/>
                              <span className="text-slate-700">{item.text}</span>
                          </label>
                      ))}
                  </div>
              </div>
              
              {UNIFORMITY_FORMS.includes(details.pharmaceuticalForm) && (
                  <UniformityCheck 
                      totalQuantity={details.quantity} 
                      unit={getPrepUnit(details.pharmaceuticalForm)} 
                      ingredients={selectedIngredients} 
                      savedData={details.uniformityCheck} 
                      prepType={isOfficinale ? 'officinale' : 'magistrale'}
                      onUpdate={(data) => setDetails(prev => ({ ...prev, uniformityCheck: data }))} 
                  />
              )}
              <div className="space-y-2"><label className="block text-sm font-bold text-slate-700 uppercase tracking-wide">Frasi ed avvertenze da riportare in etichetta</label><div className="space-y-2 p-4 border rounded-md bg-white">{["Tenere fuori dalla portata dei bambini", "Tenere al riparo da luce e fonti di calore"].map((warning, i) => (<label key={i} className="flex items-start gap-2 text-sm cursor-pointer hover:bg-slate-50 p-1 rounded"><input type="checkbox" checked={(details.labelWarnings || []).includes(warning)} onChange={() => handleLabelWarningChange(warning)} className="mt-0.5 h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"/><span className="text-slate-700">{warning}</span></label>))}{hasDopingIngredient && (<label className="flex items-start gap-2 text-sm cursor-pointer hover:bg-slate-50 p-1 rounded"><input type="checkbox" checked={(details.labelWarnings || []).includes(dopingWarning)} onChange={() => handleLabelWarningChange(dopingWarning)} className="mt-0.5 h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"/><span className="text-slate-700 font-bold text-red-600">{dopingWarning}</span></label>)}
                <textarea 
                  className="w-full border p-2 rounded-md outline-none h-20 resize-y text-sm mt-2 focus:ring-2 ring-teal-500" 
                  value={details.customLabelWarning || ''} 
                  onChange={e => setDetails({...details, customLabelWarning: e.target.value})} 
                  placeholder="Inserisci altre avvertenze da riportare in etichetta..."
                />
              </div></div>
              <div className="pt-6 flex justify-between border-t border-slate-100 mt-8">
                  <button onClick={() => setStep(isOfficinale ? 4 : 3)} className="text-slate-500 hover:text-slate-700 font-medium px-4 py-2 hover:bg-slate-100 rounded-lg transition-colors">Indietro</button>
                  <button 
                      onClick={() => setStep(isOfficinale ? 6 : 5)} 
                      disabled={UNIFORMITY_FORMS.includes(details.pharmaceuticalForm) && (!details.uniformityCheck?.isComplete || !details.uniformityCheck?.isCompliant)}
                      className="bg-teal-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
                  >
                      Avanti <ArrowRight size={18}/>
                  </button>
              </div>
            </div>
          )}

          {((isOfficinale && step === 6) || (!isOfficinale && step === 5)) && (
              <div className="space-y-6 animate-in fade-in">
                  <div className="text-center"><h2 className="text-xl font-bold text-slate-800 pt-4 flex items-center justify-center gap-2"><ClipboardCheck size={24} />Conferma Finale</h2><div className="bg-slate-50 p-6 border rounded-md mt-4 max-w-md mx-auto"><p className="text-slate-600">Confermi la produzione di <b>{details.name}</b>?</p><p className="text-3xl font-bold mt-2 text-teal-700">€ {pricing.final.toFixed(2)}</p></div></div>
                  {isOfficinale && batches.length > 0 && (<div className="bg-blue-50/50 p-6 border border-blue-100 rounded-md mt-4"><h3 className="text-sm font-bold text-blue-800 uppercase tracking-wider mb-4 flex items-center gap-2"><ListOrdered size={16}/> Riepilogo Lotti di Produzione</h3><div className="space-y-2">{batches.map((batch, i) => { const container = selectedIngredients.find(ing => ing.id === batch.containerId); return (<div key={i} className="flex justify-between items-center bg-white p-3 rounded border border-blue-100 shadow-sm"><div className="flex items-center gap-3"><Box size={18} className="text-blue-500" /><div><div className="font-bold text-sm text-slate-800">{container?.name || 'Contenitore'}</div><div className="text-xs text-slate-500"><span className="font-bold text-blue-600">{Number(container?.amountUsed || 0).toFixed(0)} confezioni</span> preparate con {batch.productQuantity} unità cad.</div></div></div><div className="text-right"><div className="font-mono font-bold text-blue-700">€ {parseFloat(batch.unitPrice || 0).toFixed(2)}</div><div className="text-[10px] text-slate-400 font-bold uppercase">Prezzo Unitario</div></div></div>)})}</div></div>)}
                  <div className="pt-6 flex flex-col sm:flex-row sm:justify-between items-center gap-4 border-t border-slate-100 mt-8">
                    <button onClick={() => setStep(isOfficinale ? 5 : 4)} className="text-slate-500 hover:text-slate-700 font-medium px-4 py-2 hover:bg-slate-100 rounded-lg transition-colors">Indietro</button>
                    <div className="flex flex-wrap justify-center sm:justify-end gap-3 w-full sm:w-auto">
                      {canEdit && (
                        <button 
                            onClick={handleFinalSave} 
                            className="bg-teal-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-teal-700 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center gap-2 whitespace-nowrap"
                        >
                            <Save size={20}/> Salva e Completa Produzione
                        </button>
                      )}
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
