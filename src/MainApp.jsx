import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from './context/AuthContext';
import {
  Beaker,
  ClipboardList,
  Package,
  Pill,
  LayoutList,
  History,
  Sparkles,
  Wifi,
  WifiOff,
  Loader2,
  Settings,
  Shield,
  QrCode,
  BarChart2,
} from 'lucide-react';

const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true';
let MOCK_INVENTORY, MOCK_PREPARATIONS, MOCK_LOGS;
if (USE_MOCK_DATA) {
  ({ MOCK_INVENTORY, MOCK_PREPARATIONS, MOCK_LOGS } = await import('./constants/mockData.js'));
}

import SidebarItem from './components/ui/SidebarItem';
import Dashboard from './components/sections/Dashboard';
import Inventory from './components/sections/Inventory';
import PreparationsLog from './components/sections/PreparationsLog';
import Logs from './components/sections/Logs';
import Reporting from './components/sections/Reporting';
import AIAssistant from './components/sections/AIAssistant';
import PreparationWizard from './components/wizards/PreparationWizard';
import SubstanceModal from './components/modals/SubstanceModal';
import PrepTypeSelectionModal from './components/modals/PrepTypeSelectionModal';
import SettingsComponent from './components/sections/Settings';
import UserManagement from './components/sections/UserManagement';
import QRScannerModal from './components/modals/QRScannerModal';
import { useApi } from './hooks/useApi';

export default function MainApp() {
  const { logout, AUTH_ENABLED, user } = useAuth();
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('activeTab') || 'dashboard');

  const canEdit = useMemo(() => {
    if (!AUTH_ENABLED) return true;
    return user?.role === 'admin' || user?.role === 'pharmacist';
  }, [AUTH_ENABLED, user]);

  const [inventory, setInventory] = useState([]);
  const [logs, setLogs] = useState([]);
  const [preparations, setPreparations] = useState([]);
  const [pharmacySettings, setPharmacySettings] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('galenico_settings')) || {
        name: '', address: '', zip: '', city: '', province: '', phone: ''
      };
    } catch (e) {
      return { name: '', address: '', zip: '', city: '', province: '', phone: '' };
    }
  });

  const [editingPrep, setEditingPrep] = useState(null);
  const [initialWizardStep, setInitialWizardStep] = useState(1);
  const [isOnline, setIsOnline] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSubstance, setEditingSubstance] = useState(null);
  const [isReadOnlyMode, setIsReadOnlyMode] = useState(false);
  const [isPrepTypeModalOpen, setIsPrepTypeModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const handleScanSuccess = (prepId) => {
      setPreparationLogFilter(parseInt(prepId));
      handleTabChange('preparations_log');
  };

  const [newSubstance, setNewSubstance] = useState({
    name: '', ni: '', lot: '', expiry: '', quantity: '', unit: 'g', costPerGram: '', totalCost: '', supplier: '', purity: '',
    receptionDate: '', ddtNumber: '', ddtDate: '', firstUseDate: null, endUseDate: null,
    minStock: '', isExcipient: false, isContainer: false, isDoping: false, isNarcotic: false,
    sdsFile: null, technicalSheetFile: null, securityData: { pictograms: [] }
  });

  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [prepSortConfig, setPrepSortConfig] = useState({ key: 'prepNumber', direction: 'asc' });
  const [searchTerm, setSearchTerm] = useState('');
  const [prepSearchTerm, setPrepSearchTerm] = useState('');
  const [inventoryFilter, setInventoryFilter] = useState('all');
  const [prepTypeFilter, setPrepTypeFilter] = useState('all');
  const [preparationLogFilter, setPreparationLogFilter] = useState(null);
  const [inventoryFilterSubstance, setInventoryFilterSubstance] = useState(null);

  // --- HELPER CHIAMATE API ---
  const { createApiRequest } = useApi();

  const loadData = useCallback(async () => {
    setLoadingData(true);
    if (USE_MOCK_DATA || !AUTH_ENABLED) {
      setInventory(MOCK_INVENTORY);
      setPreparations(MOCK_PREPARATIONS);
      setLogs(MOCK_LOGS);
      setIsOnline(false);
      setLoadingData(false);
      return;
    }

    try {
      // Usa l'helper specificando GET
      const data = await createApiRequest('get_all_data', null, false, 'GET');
      
      if (data.error) {
        console.error("Errore API:", data.error);
        setIsOnline(false);
      } else {
        setInventory(data.inventory || []);
        setPreparations(data.preparations || []);
        setLogs(data.logs || []);
        setIsOnline(true);
      }

      // Carica Settings
      const settingsData = await createApiRequest('get_settings', null, false, 'GET');
      if (settingsData && !settingsData.error) {
          setPharmacySettings(prev => ({ ...prev, ...settingsData }));
      }

    } catch (e) {
      console.error("Errore caricamento dati:", e);
      setIsOnline(false);
    } finally {
      setLoadingData(false);
    }
  }, [createApiRequest, AUTH_ENABLED]);

  const saveInventoryData = useCallback(async (itemToSave) => {
    if (USE_MOCK_DATA || !AUTH_ENABLED) {
      const updatedInventory = itemToSave.id 
        ? inventory.map(item => String(item.id) === String(itemToSave.id) ? { ...item, ...itemToSave } : item)
        : [...inventory, { ...itemToSave, id: Date.now() }];
      setInventory(updatedInventory);
      return { success: true, id: itemToSave.id || Date.now() };
    }
    return { success: true };
  }, [inventory, AUTH_ENABLED]);

  const disposeInventoryData = useCallback(async (id) => {
    if (USE_MOCK_DATA || !AUTH_ENABLED) {
      setInventory(inventory.map(item => item.id === id ? { ...item, disposed: true, endUseDate: new Date().toISOString().split('T')[0] } : item));
      return { success: true, id };
    } else {
      return await createApiRequest('dispose_inventory', { id });
    }
  }, [inventory, createApiRequest, AUTH_ENABLED]);

  const savePreparationData = useCallback(async (itemsUsed, prepDetails, isDraft) => {
    if (USE_MOCK_DATA || !AUTH_ENABLED) {
      const isNewPrep = !prepDetails.id;
      const finalStatus = isDraft ? 'Bozza' : 'Completata';
      let updatedInventory = [...inventory];
      let updatedLogs = [...logs];
      let updatedPreparations = [...preparations];
      if (isNewPrep) {
          const newPrep = { ...prepDetails, id: Date.now(), date: new Date().toISOString().split('T')[0], status: finalStatus, ingredients: itemsUsed };
          if (!isDraft) {
              itemsUsed.forEach(used => {
                  const invIndex = updatedInventory.findIndex(i => i.id === used.id);
                  if (invIndex > -1) updatedInventory[invIndex] = { ...updatedInventory[invIndex], quantity: updatedInventory[invIndex].quantity - used.amountUsed };
                  updatedLogs.unshift({ id: Math.random(), date: new Date().toISOString().split('T')[0], type: 'SCARICO', substance: used.name, ni: used.ni, quantity: used.amountUsed, unit: used.unit, notes: `Nuova Prep. #${newPrep.prepNumber}` });
              });
          }
          updatedPreparations.unshift(newPrep);
      } else {
          const oldPrep = preparations.find(p => p.id === prepDetails.id);
          const wasDraft = oldPrep?.status === 'Bozza';
          if (!isDraft && wasDraft) {
              itemsUsed.forEach(used => {
                  const invIndex = updatedInventory.findIndex(i => i.id === used.id);
                  if (invIndex > -1) updatedInventory[invIndex] = { ...updatedInventory[invIndex], quantity: updatedInventory[invIndex].quantity - used.amountUsed };
                  updatedLogs.unshift({ id: Math.random(), date: new Date().toISOString().split('T')[0], type: 'SCARICO', substance: used.name, ni: used.ni, quantity: used.amountUsed, unit: used.unit, notes: `Complet. Prep. #${prepDetails.prepNumber}` });
              });
          } else if (!isDraft && !wasDraft) {
              const oldIngredients = oldPrep.ingredients || [];
              itemsUsed.forEach(newIng => {
                  const oldIng = oldIngredients.find(o => o.id === newIng.id);
                  const invIndex = updatedInventory.findIndex(i => i.id === newIng.id);
                  if (invIndex === -1) return;
                  const diff = newIng.amountUsed - (oldIng ? oldIng.amountUsed : 0);
                  if (diff > 0) {
                      updatedInventory[invIndex] = { ...updatedInventory[invIndex], quantity: updatedInventory[invIndex].quantity - diff };
                      updatedLogs.unshift({ id: Math.random(), date: new Date().toISOString().split('T')[0], type: 'SCARICO', substance: newIng.name, ni: newIng.ni, quantity: diff, unit: newIng.unit, notes: `Modifica Prep. #${prepDetails.prepNumber}` });
                  } else if (diff < 0) {
                      updatedInventory[invIndex] = { ...updatedInventory[invIndex], quantity: updatedInventory[invIndex].quantity + Math.abs(diff) };
                      updatedLogs.unshift({ id: Math.random(), date: new Date().toISOString().split('T')[0], type: 'ANNULLAMENTO', substance: newIng.name, ni: newIng.ni, quantity: Math.abs(diff), unit: newIng.unit, notes: `Modifica Prep. #${prepDetails.prepNumber}` });
                  }
              });
              oldIngredients.forEach(oldIng => {
                  if (!itemsUsed.some(n => n.id === oldIng.id)) {
                      const invIndex = updatedInventory.findIndex(i => i.id === oldIng.id);
                      if (invIndex > -1) {
                          updatedInventory[invIndex] = { ...updatedInventory[invIndex], quantity: updatedInventory[invIndex].quantity + oldIng.amountUsed };
                          updatedLogs.unshift({ id: Math.random(), date: new Date().toISOString().split('T')[0], type: 'ANNULLAMENTO', substance: oldIng.name, ni: oldIng.ni, quantity: oldIng.amountUsed, unit: oldIng.unit, notes: `Modifica Prep. #${prepDetails.prepNumber}` });
                      }
                  }
              });
          }
          const prepIndex = updatedPreparations.findIndex(p => p.id === prepDetails.id);
          if (prepIndex > -1) updatedPreparations[prepIndex] = { ...updatedPreparations[prepIndex], ...prepDetails, ingredients: itemsUsed, status: finalStatus };
      }
      setInventory(updatedInventory); setLogs(updatedLogs); setPreparations(updatedPreparations);
      return { success: true, id: prepDetails.id || Date.now() };
    } else {
      return await createApiRequest('save_preparation', { prepDetails, itemsUsed, isDraft });
    }
  }, [createApiRequest, AUTH_ENABLED, inventory, preparations, logs]);

  const deletePreparationData = useCallback(async (id) => {
    if (USE_MOCK_DATA || !AUTH_ENABLED) {
      setPreparations(preparations.filter(p => p.id !== id));
      return { success: true, id };
    } else {
      return await createApiRequest('delete_preparation', { id });
    }
  }, [preparations, createApiRequest, AUTH_ENABLED]);

  const handleClearLogs = async (options) => {
    if (USE_MOCK_DATA || !AUTH_ENABLED) {
      if (options.mode === 'all') setLogs([]);
      else if (options.mode === 'range') {
        const start = new Date(options.startDate); const end = new Date(options.endDate);
        setLogs(logs.filter(log => { const logDate = new Date(log.date); return logDate < start || logDate > end; }));
      }
    } else {
      try {
        const result = await createApiRequest('clear_logs', options);
        if (result.error) throw new Error(result.error);
        await loadData();
      } catch (error) {
        console.error("Errore pulizia log:", error);
        alert("Errore durante la pulizia dei log.");
      }
    }
  };

  const handleSaveSettings = async (newSettings) => {
      let settingsObj = newSettings;
      let isMultipart = false;

      if (newSettings instanceof FormData) {
          isMultipart = true;
          settingsObj = {};
          newSettings.forEach((value, key) => {
              // Ignoriamo il file binario nello stato locale immediato
              if (typeof value === 'string') settingsObj[key] = value;
          });
      }

      setPharmacySettings(prev => ({ ...prev, ...settingsObj }));
      
      if (USE_MOCK_DATA || !AUTH_ENABLED) {
          localStorage.setItem('galenico_settings', JSON.stringify(settingsObj));
      } else {
          try {
              const result = await createApiRequest('save_settings', newSettings, isMultipart);
              if (result.error) throw new Error(result.error);
              // Aggiorna con i dati ritornati dal server (es. path del logo nuovo)
              if (result.data) {
                  setPharmacySettings(prev => ({ ...prev, ...result.data }));
              }
          } catch (e) {
              console.error("Errore salvataggio settings:", e);
              alert("Errore durante il salvataggio delle impostazioni.");
          }
      }
  };

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { localStorage.setItem('galenico_settings', JSON.stringify(pharmacySettings)); }, [pharmacySettings]);
  useEffect(() => { 
      // Sicurezza: se sono su user_management ma non sono admin, torno alla dashboard
      if (AUTH_ENABLED && activeTab === 'user_management' && user?.role !== 'admin') {
          setActiveTab('dashboard');
      }
      localStorage.setItem('activeTab', activeTab); 
  }, [activeTab, AUTH_ENABLED, user]);

  const handleTabChange = (tab) => {
    if (activeTab === 'preparation' && window.confirm('Sei sicuro di voler uscire? Le modifiche non salvate andranno perse.')) {
      setEditingPrep(null); setActiveTab(tab);
    } else if (activeTab !== 'preparation') {
      setActiveTab(tab);
    }
  };
  const handleShowPreparation = (prepId) => { setPreparationLogFilter(prepId); handleTabChange('preparations_log'); setIsAddModalOpen(false); };
  const handleShowSubstanceInInventory = (substanceId) => { setInventoryFilterSubstance(substanceId); handleTabChange('inventory'); setIsAddModalOpen(false); };
  useEffect(() => {
    if (newSubstance.totalCost && newSubstance.quantity && parseFloat(newSubstance.quantity) > 0) {
      const calculatedCost = (parseFloat(newSubstance.totalCost) / parseFloat(newSubstance.quantity)).toFixed(4);
      setNewSubstance(prev => ({ ...prev, costPerGram: calculatedCost }));
    }
  }, [newSubstance.totalCost, newSubstance.quantity]);

  const getStats = () => {
    if (!inventory) return { expiringSoon: 0, expired: 0, lowStock: 0, totalItems: 0 };
    const activeInventory = inventory.filter(i => !i.disposed);
    const expiringSoon = activeInventory.filter(item => {
      const days = (new Date(item.expiry) - new Date()) / (1000 * 60 * 60 * 24);
      return days > 0 && days <= 30;
    }).length;
    const expired = activeInventory.filter(item => new Date(item.expiry) < new Date()).length;
    const lowStock = activeInventory.filter(item => item.quantity < 50 && item.quantity > 0).length;
    return { expiringSoon, expired, lowStock, totalItems: inventory.length };
  };
  const stats = getStats();
  const getUsageCount = (item) => preparations.reduce((count, prep) => count + (prep.ingredients.some(ing => ing.id === item.id) ? 1 : 0), 0);
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };
  const requestPrepSort = (key) => {
    let direction = 'asc';
    if (prepSortConfig.key === key && prepSortConfig.direction === 'asc') direction = 'desc';
    setPrepSortConfig({ key, direction });
  };
  const { sortedActiveInventory, sortedDisposedInventory } = useMemo(() => {
    let filteredData = inventory || [];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filteredData = filteredData.filter(item => item.name.toLowerCase().includes(term) || item.ni.toLowerCase().includes(term) || item.lot.toLowerCase().includes(term) || (item.supplier && item.supplier.toLowerCase().includes(term)));
    }
    if (inventoryFilterSubstance) filteredData = filteredData.filter(i => i.id === inventoryFilterSubstance);
    let sortableItems = filteredData.map(item => ({...item, usageCount: getUsageCount(item)}));
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        let aVal = a[sortConfig.key]; let bVal = b[sortConfig.key];
        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return {
      sortedActiveInventory: sortableItems.filter(i => {
        if (i.disposed) return false;
        const daysUntilExpiry = (new Date(i.expiry) - new Date()) / (1000 * 60 * 60 * 24);
        const isExpired = new Date(i.expiry) < new Date();
        const isExpiring = !isExpired && daysUntilExpiry > 0 && daysUntilExpiry <= 30;
        if (inventoryFilter === 'expiring') return isExpiring;
        if (inventoryFilter === 'expired') return isExpired;
        return true;
      }),
      sortedDisposedInventory: sortableItems.filter(i => i.disposed)
    };
  }, [inventory, sortConfig, searchTerm, preparations, inventoryFilter, inventoryFilterSubstance]);
  const filteredPreparations = useMemo(() => {
    let filtered = preparations || [];
    if (preparationLogFilter) filtered = filtered.filter(p => p.id === preparationLogFilter);
    if (prepTypeFilter !== 'all') filtered = filtered.filter(p => p.prepType === prepTypeFilter || (prepTypeFilter === 'magistrale' && !p.prepType));
    if (prepSearchTerm) {
      const term = prepSearchTerm.toLowerCase();
      filtered = filtered.filter(p => p.name.toLowerCase().includes(term) || (p.ingredients && p.ingredients.some(ing => ing.name.toLowerCase().includes(term))));
    }
    if (prepSortConfig.key) {
      filtered.sort((a, b) => {
        let aVal = a[prepSortConfig.key]; let bVal = b[prepSortConfig.key];
        if (prepSortConfig.key === 'totalPrice') { aVal = parseFloat(aVal || 0); bVal = parseFloat(bVal || 0); }
        else { if (typeof aVal === 'string') aVal = aVal.toLowerCase(); if (typeof bVal === 'string') bVal = bVal.toLowerCase(); }
        if (aVal < bVal) return prepSortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return prepSortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return filtered;
  }, [preparations, preparationLogFilter, prepSearchTerm, prepSortConfig, prepTypeFilter]);
  const getNextNi = (isContainer = false) => {
    const currentYear = new Date().getFullYear().toString().slice(-2); const typeChar = isContainer ? 'C' : 'S';
    let maxProg = 0;
    inventory.forEach(item => {
      const prefix = `${currentYear}/${typeChar}`;
      if (item.ni && item.ni.toUpperCase().startsWith(prefix)) {
        const parts = item.ni.toUpperCase().split(typeChar);
        if (parts.length > 1) { const progNum = parseInt(parts[1]); if (!isNaN(progNum) && progNum > maxProg) maxProg = progNum; }
      }
    });
    return `${currentYear}/${typeChar}${(maxProg + 1).toString().padStart(3, '0')}`;
  };
  const handleOpenAddModal = (type = 'substance') => {
    setEditingSubstance(null); const isContainer = type === 'container';
    setNewSubstance({
      name: '', ni: getNextNi(isContainer), lot: '', expiry: '', quantity: '', unit: isContainer ? 'n.' : 'g', costPerGram: '', totalCost: '', supplier: '', purity: '',
      receptionDate: '', ddtNumber: '', ddtDate: '', firstUseDate: null, endUseDate: null, minStock: isContainer ? '10' : '5',
      isExcipient: false, isContainer: isContainer, isDoping: false, isNarcotic: false, sdsFile: null, technicalSheetFile: null, securityData: { pictograms: [] }
    });
    setIsReadOnlyMode(false); setIsAddModalOpen(true);
  };
    const handleOpenEditModal = (item) => {
      setEditingSubstance(item);
      setNewSubstance({ ...item, quantity: item.quantity.toString(), minStock: item.minStock || (item.isContainer ? '10' : '5'),
        totalCost: item.totalCost ? item.totalCost.toString() : '', costPerGram: item.costPerGram?.toString() || '' });
      setIsReadOnlyMode(!canEdit);
      setIsAddModalOpen(true);
    };
  const handleOpenViewModal = (item) => {
    setEditingSubstance(item);
    setNewSubstance({ ...item, quantity: item.quantity.toString(), minStock: item.minStock || (item.isContainer ? '10' : '5'),
      totalCost: item.totalCost ? item.totalCost.toString() : '', costPerGram: item.costPerGram?.toString() || '' });
    setIsReadOnlyMode(true); setIsAddModalOpen(true);
  };
  const handleSdsUpload = (e) => { const file = e.target.files[0]; if (!file) return; setNewSubstance(prev => ({ ...prev, sdsFile: file })); };
  const handleTechnicalSheetUpload = (e) => { const file = e.target.files[0]; if (!file) return; setNewSubstance(prev => ({ ...prev, technicalSheetFile: file })); };
  const handleRemoveSds = () => { if (window.confirm("Rimuovere la Scheda di Sicurezza?")) setNewSubstance(prev => ({ ...prev, sdsFile: null })); };
  const handleRemoveTechnicalSheet = () => { if (window.confirm("Rimuovere la Scheda Tecnica?")) setNewSubstance(prev => ({ ...prev, technicalSheetFile: null })); };
  const handleDownloadPdf = (e, file) => {
    e.preventDefault(); if (!file) return;
    if (file instanceof File) {
      const url = window.URL.createObjectURL(file); const link = document.createElement('a');
      link.href = url; link.setAttribute('download', file.name); document.body.appendChild(link); link.click(); link.parentNode.removeChild(link);
    } else {
      const fileUrl = `./api/uploads/${file}`; window.open(fileUrl, '_blank');
    }
  };
  const handleAddOrUpdateSubstance = async (e) => {
    e.preventDefault(); 
    if (!canEdit) { alert("Permesso negato"); return; }
    const formData = new FormData();
    const textFields = ['id', 'name', 'ni', 'lot', 'expiry', 'quantity', 'unit', 'totalCost', 'costPerGram', 'supplier', 'purity', 'receptionDate', 'ddtNumber', 'ddtDate', 'minStock', 'isExcipient', 'isContainer', 'isDoping', 'isNarcotic'];
    textFields.forEach(field => { if (newSubstance[field] !== undefined && newSubstance[field] !== null) formData.append(field, newSubstance[field]); });
    if (newSubstance.securityData) formData.append('securityData', JSON.stringify(newSubstance.securityData));
    if (newSubstance.sdsFile instanceof File) formData.append('sdsFile', newSubstance.sdsFile);
    if (newSubstance.technicalSheetFile instanceof File) formData.append('technicalSheetFile', newSubstance.technicalSheetFile);
    try {
      if (USE_MOCK_DATA || !AUTH_ENABLED) {
        // Mock logic here if needed
      } else {
        const result = await createApiRequest('add_or_update_inventory', formData, true);
        if (result.error) throw new Error(result.error);
        await loadData();
      }
      setIsAddModalOpen(false);
    } catch(error) {
      console.error("Errore salvataggio sostanza:", error); alert("Errore durante il salvataggio della sostanza.");
    }
  };
      const handleDispose = async (itemId) => {
        if (!canEdit) { alert("Permesso negato"); return; }
        if (!window.confirm(`Confermi di voler smaltire l'elemento?`)) return;      try {
        const result = await disposeInventoryData(itemId);
        if (result.error) throw new Error(result.error);
        if (!USE_MOCK_DATA && AUTH_ENABLED) await loadData();
      } catch (error) {
        console.error("Errore smaltimento:", error);
        alert("Errore durante lo smaltimento.");
      }
    };
      const handleDeletePreparation = async (prepId) => {
        if (!canEdit) { alert("Permesso negato"); return; }
        if (!window.confirm(`Eliminare la preparazione?`)) return;      try {
        const result = await deletePreparationData(prepId);
        if (result.error) throw new Error(result.error);
        if (!USE_MOCK_DATA && AUTH_ENABLED) await loadData();
      } catch (error) {
        console.error("Errore eliminazione preparazione:", error);
        alert("Errore durante l'eliminazione della preparazione.");
      }
    };
      const handleSavePreparation = async (itemsUsed, prepDetails, isDraft = false) => {
        if (!canEdit) { alert("Permesso negato"); return; }
        try {        const result = await savePreparationData(itemsUsed, prepDetails, isDraft);
        if (result.error) throw new Error(result.error);
        setEditingPrep(null); setActiveTab('preparations_log');
        if (!USE_MOCK_DATA && AUTH_ENABLED) await loadData();
      } catch (error) {
        console.error("Errore salvataggio preparazione:", error);
        alert("Errore durante il salvataggio della preparazione.");
      }
    };
  const handleJumpToStep = (prep, step = 1) => { setEditingPrep(prep); setInitialWizardStep(step); setActiveTab('preparation'); };
  const handleDuplicatePreparation = (prepToDuplicate) => {
    const duplicatedData = { ...prepToDuplicate, isDuplicate: true, status: 'Bozza' };
    delete duplicatedData.id; delete duplicatedData.date;
    setEditingPrep(duplicatedData); setInitialWizardStep(1); setActiveTab('preparation');
  };
  const handleNewPreparation = () => {
    if (activeTab === 'preparation' && window.confirm('Sei sicuro di voler iniziare una nuova preparazione? Le modifiche non salvate andranno perse.')) {
      setEditingPrep(null); setInitialWizardStep(1); setIsPrepTypeModalOpen(true);
    } else if (activeTab !== 'preparation') {
      setEditingPrep(null); setInitialWizardStep(1); setIsPrepTypeModalOpen(true);
    }
  };
  const startNewPreparation = (type) => { setEditingPrep({ prepType: type }); setIsPrepTypeModalOpen(false); setActiveTab('preparation'); };
  
  if (loadingData) return <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-500 gap-2"><Loader2 className="animate-spin" /> Caricamento...</div>;
  
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard stats={stats} logs={logs} inventory={inventory} preparations={preparations} setActiveTab={handleTabChange} setInventoryFilter={setInventoryFilter} handleDispose={handleDispose} handleShowPreparation={handleShowPreparation} handleShowSubstanceInInventory={handleShowSubstanceInInventory} />;
      case 'inventory':
        return <Inventory inventoryFilter={inventoryFilter} setInventoryFilter={setInventoryFilter} searchTerm={searchTerm} setSearchTerm={setSearchTerm} sortedActiveInventory={sortedActiveInventory} sortedDisposedInventory={sortedDisposedInventory} handleOpenAddModal={handleOpenAddModal} handleOpenEditModal={handleOpenEditModal} handleOpenViewModal={handleOpenViewModal} handleDispose={handleDispose} sortConfig={sortConfig} requestSort={requestSort} activeSubstanceFilter={inventoryFilterSubstance} clearSubstanceFilter={() => setInventoryFilterSubstance(null)} canEdit={canEdit} />;
      case 'preparations_log':
        return <PreparationsLog preparations={filteredPreparations} handleJumpToStep={handleJumpToStep} handleDuplicatePreparation={handleDuplicatePreparation} handleDeletePreparation={handleDeletePreparation} activeFilter={preparationLogFilter} clearFilter={() => setPreparationLogFilter(null)} searchTerm={prepSearchTerm} setSearchTerm={setPrepSearchTerm} sortConfig={prepSortConfig} requestSort={requestPrepSort} prepTypeFilter={prepTypeFilter} setPrepTypeFilter={setPrepTypeFilter} canEdit={canEdit} pharmacySettings={pharmacySettings} />;
      case 'preparation':
        return <PreparationWizard inventory={inventory} preparations={preparations} onComplete={handleSavePreparation} initialData={editingPrep} pharmacySettings={pharmacySettings} initialStep={initialWizardStep} canEdit={canEdit} />;
      case 'logs':
        return <Logs logs={logs} preparations={preparations} handleShowPreparation={handleShowPreparation} handleClearLogs={handleClearLogs} canEdit={canEdit} />;
      case 'reporting':
        return <Reporting preparations={preparations} inventory={inventory} />;
      case 'settings':
        return <SettingsComponent settings={pharmacySettings} setSettings={handleSaveSettings} />;
      case 'user_management':
        return <UserManagement />;
      case 'ai-assistant':
        return <AIAssistant pharmacySettings={pharmacySettings} setPharmacySettings={handleSaveSettings} handleTabChange={handleTabChange} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shadow-xl">
        <div className="p-6 border-b border-slate-700"><div className="flex items-center gap-3 text-white mb-1"><Beaker className="w-8 h-8 text-teal-400" /><span className="font-bold text-xl tracking-tight">Galenico<span className="text-teal-400">Lab</span></span></div><p className="text-xs text-slate-500">Gestione Norme NBP</p></div>
        <nav className="flex-1 p-4 space-y-2">
          <SidebarItem icon={<ClipboardList size={20} />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => handleTabChange('dashboard')} />
          <SidebarItem icon={<Package size={20} />} label="Magazzino Sostanze" active={activeTab === 'inventory'} onClick={() => { setInventoryFilter('all'); handleTabChange('inventory'); }} />
          {canEdit && <SidebarItem icon={<Pill size={20} />} label={editingPrep ? "Modifica Prep." : "Nuova Prep. (+)"} active={activeTab === 'preparation'} onClick={handleNewPreparation} />}
          <SidebarItem icon={<LayoutList size={20} />} label="Registro Preparazioni" active={activeTab === 'preparations_log'} onClick={() => handleTabChange('preparations_log')} />
          <SidebarItem icon={<History size={20} />} label="Registro Movimenti" active={activeTab === 'logs'} onClick={() => handleTabChange('logs')} />
          {canEdit && <SidebarItem icon={<BarChart2 size={20} />} label="Analisi & Report" active={activeTab === 'reporting'} onClick={() => handleTabChange('reporting')} />}
                    <div className="pt-4 mt-4 border-t border-slate-700">
                                  <SidebarItem icon={<Sparkles size={20} className="text-purple-400" />} label="Assistente IA" active={activeTab === 'ai-assistant'} onClick={() => handleTabChange('ai-assistant')} />
                                  <SidebarItem icon={<Settings size={20} />} label="Impostazioni" active={activeTab === 'settings'} onClick={() => handleTabChange('settings')} />
                                  {(!AUTH_ENABLED || user?.role === 'admin') && (
                                    <SidebarItem icon={<Shield size={20} />} label="Gestione Utenti" active={activeTab === 'user_management'} onClick={() => handleTabChange('user_management')} />
                                  )}
                                </div>        </nav>
        <div className="p-4 border-t border-slate-800">
            <div className="flex items-center gap-2 mb-2 text-xs">
                {isOnline ? <span className="flex items-center gap-1 text-green-400"><Wifi size={12} /> Online</span> : <span className="flex items-center gap-1 text-slate-500"><WifiOff size={12} /> Locale</span>}
            </div>
            {AUTH_ENABLED && user && <p className="text-xs text-slate-400">Utente: {user.username}</p>}
            {AUTH_ENABLED && <button onClick={logout} className="text-xs text-red-400 hover:underline w-full text-left mt-2">Logout</button>}
            {!AUTH_ENABLED && <p className="text-xs text-slate-500">Utente: Dr. Farmacista</p>}
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <header className="bg-white border-b border-slate-200 p-6 flex justify-between items-center sticky top-0 z-10">
          <h1 className="text-2xl font-bold text-slate-800">
            {activeTab === 'dashboard' && 'Panoramica Laboratorio'}
            {activeTab === 'inventory' && 'Magazzino & Sostanze'}
            {activeTab === 'preparation' && (editingPrep ? `Modifica: ${editingPrep.prepNumber}` : 'Foglio di Lavorazione')}
            {activeTab === 'preparations_log' && 'Registro Generale Preparazioni'}
            {activeTab === 'logs' && 'Registro di Carico/Scarico'}
            {activeTab === 'reporting' && 'Analisi e Reportistica'}
            {activeTab === 'ai-assistant' && 'Assistente Galenico IA'}
            {activeTab === 'settings' && 'Impostazioni Farmacia'}
            {activeTab === 'user_management' && 'Gestione Utenti Laboratorio'}
          </h1>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsScannerOpen(true)} className="bg-slate-100 p-2 rounded-md hover:bg-slate-200 text-slate-600 transition-colors" title="Scansiona QR"><QrCode size={20} /></button>
            <div className="bg-slate-100 px-3 py-1.5 rounded-md text-sm font-medium text-slate-600 border border-slate-200">{new Date().toLocaleDateString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
          </div>
        </header>
        <div className="p-6 max-w-7xl mx-auto">{renderContent()}</div>
      </main>
      <SubstanceModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} isReadOnly={isReadOnlyMode} editingSubstance={editingSubstance} substanceData={newSubstance} setSubstanceData={setNewSubstance} onSubmit={handleAddOrUpdateSubstance} getNextNi={getNextNi} preparations={preparations} inventory={inventory} onShowPreparation={handleShowPreparation} handleSdsUpload={handleSdsUpload} handleRemoveSds={handleRemoveSds} handleTechnicalSheetUpload={handleTechnicalSheetUpload} handleRemoveTechnicalSheet={handleRemoveTechnicalSheet} handleDownloadPdf={handleDownloadPdf} />
      <PrepTypeSelectionModal isOpen={isPrepTypeModalOpen} onClose={() => setIsPrepTypeModalOpen(false)} onSelectType={startNewPreparation} />
      <QRScannerModal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} onScanSuccess={handleScanSuccess} />
    </div>
  );
}