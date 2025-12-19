import React, { useState, useEffect, useMemo } from 'react';
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
} from 'lucide-react';

import { MOCK_INVENTORY, MOCK_PREPARATIONS, MOCK_LOGS } from './constants/mockData';
import SidebarItem from './components/ui/SidebarItem';
import Dashboard from './components/sections/Dashboard';
import Inventory from './components/sections/Inventory';
import PreparationsLog from './components/sections/PreparationsLog';
import Logs from './components/sections/Logs';
import AIAssistant from './components/sections/AIAssistant';
import PreparationWizard from './components/wizards/PreparationWizard';
import SubstanceModal from './components/modals/SubstanceModal';
import SettingsComponent from './components/sections/Settings';

export default function GalenicoApp() {
  const [activeTab, setActiveTab] = useState('dashboard');

  // Stati Dati
  const [inventory, setInventory] = useState([]);
  const [logs, setLogs] = useState([]);
  const [preparations, setPreparations] = useState([]);
  const [pharmacySettings, setPharmacySettings] = useState({
    name: '', address: '', zip: '', city: '', province: '', phone: ''
  });

  // Stato Modifica
  const [editingPrep, setEditingPrep] = useState(null);
  const [initialWizardStep, setInitialWizardStep] = useState(1);

  // Stato Connessione
  const [isOnline, setIsOnline] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // Stati per modali e form
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSubstance, setEditingSubstance] = useState(null);
  const [isReadOnlyMode, setIsReadOnlyMode] = useState(false);

  const [newSubstance, setNewSubstance] = useState({
    name: '', ni: '', lot: '', expiry: '', quantity: '', unit: 'g', costPerGram: '', totalCost: '', supplier: '', purity: '',
    receptionDate: '', ddtNumber: '', ddtDate: '', firstUseDate: null, endUseDate: null,
    sdsFile: null,
    securityData: null
  });

  // Stato per Ordinamento Tabella Magazzino
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  // Stato per Ricerca
  const [searchTerm, setSearchTerm] = useState('');
  const [prepSearchTerm, setPrepSearchTerm] = useState('');

  // STATO FILTRO (all, expiring, expired)
  const [inventoryFilter, setInventoryFilter] = useState('all');

  // Stato per il filtro del registro preparazioni
  const [preparationLogFilter, setPreparationLogFilter] = useState(null);

  // Stato per il filtro del magazzino per sostanza
  const [inventoryFilterSubstance, setInventoryFilterSubstance] = useState(null);

  // --- LOGICA DI GESTIONE DATI (Locale) ---

  const loadLocalData = () => {
    try {
      const savedInv = localStorage.getItem('galenico_inventory');
      const savedLogs = localStorage.getItem('galenico_logs');
      const savedPreps = localStorage.getItem('galenico_preparations');
      const savedSettings = localStorage.getItem('galenico_settings');

      setInventory(savedInv ? JSON.parse(savedInv) : MOCK_INVENTORY);
      setLogs(savedLogs ? JSON.parse(savedLogs) : MOCK_LOGS);
      setPreparations(savedPreps ? JSON.parse(savedPreps) : MOCK_PREPARATIONS);
      if (savedSettings) {
        setPharmacySettings(JSON.parse(savedSettings));
      }
    } catch (e) {
      console.error("Errore lettura localstorage", e);
      setInventory(MOCK_INVENTORY);
      setLogs(MOCK_LOGS);
      setPreparations(MOCK_PREPARATIONS);
    }
  };

  const saveData = (newInv, newLogs, newPreps = null) => {
    setInventory(newInv);
    setLogs(newLogs);
    if (newPreps) setPreparations(newPreps);

    localStorage.setItem('galenico_inventory', JSON.stringify(newInv));
    localStorage.setItem('galenico_logs', JSON.stringify(newLogs));
    if (newPreps) localStorage.setItem('galenico_preparations', JSON.stringify(newPreps));
  };

  useEffect(() => {
    setLoadingData(true);
    loadLocalData();
    setIsOnline(false);
    setLoadingData(false);
  }, []);

  useEffect(() => {
    // Salva le impostazioni della farmacia ogni volta che cambiano
    localStorage.setItem('galenico_settings', JSON.stringify(pharmacySettings));
  }, [pharmacySettings]);

  const handleShowPreparation = (prepId) => {
    setPreparationLogFilter(prepId);
    setActiveTab('preparations_log');
    setIsAddModalOpen(false);
  };

  const handleShowSubstanceInInventory = (substanceId) => {
    setInventoryFilterSubstance(substanceId);
    setActiveTab('inventory');
    setIsAddModalOpen(false);
  };
  
  // --- LOGICHE AGGIUNTIVE E HELPER ---

  // CALCOLO AUTOMATICO COSTO/GRAMMO
  useEffect(() => {
    if (newSubstance.totalCost && newSubstance.quantity && parseFloat(newSubstance.quantity) > 0) {
      const calculatedCost = (parseFloat(newSubstance.totalCost) / parseFloat(newSubstance.quantity)).toFixed(4); // Più decimali per precisione
      setNewSubstance(prev => ({ ...prev, costPerGram: calculatedCost }));
    }
  }, [newSubstance.totalCost, newSubstance.quantity]);

  // Registra semplicemente il file SDS senza analizzarlo
  const handleSdsUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setNewSubstance(prev => ({
      ...prev,
      sdsFile: file,
    }));
  };

  const handleRemoveSds = () => {
    if (window.confirm("Rimuovere la scheda di sicurezza e cancellare i dati estratti?")) {
      setNewSubstance(prev => ({
        ...prev,
        sdsFile: null,
        securityData: null
      }));
    }
  };

  const handleDownloadPdf = (e) => {
    e.preventDefault();
    if (!newSubstance.sdsFile) return;

    if (newSubstance.sdsFile instanceof File) {
      const url = window.URL.createObjectURL(newSubstance.sdsFile);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', newSubstance.sdsFile.name);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } else {
      alert(`Download simulato del file: ${newSubstance.sdsFile}`);
    }
  };

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

  const getUsageCount = (item) => {
    return preparations.reduce((count, prep) => {
      const hasIngredient = prep.ingredients.some(ing =>
        (ing.ni && ing.ni === item.ni) ||
        (ing.id === item.id)
      );
      return count + (hasIngredient ? 1 : 0);
    }, 0);
  };

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const { sortedActiveInventory, sortedDisposedInventory } = useMemo(() => {
    let filteredData = inventory;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filteredData = filteredData.filter(item =>
        item.name.toLowerCase().includes(term) ||
        item.ni.toLowerCase().includes(term) ||
        item.lot.toLowerCase().includes(term) ||
        (item.supplier && item.supplier.toLowerCase().includes(term))
      );
    }

    let sortableItems = filteredData.map(item => ({
      ...item,
      usageCount: getUsageCount(item)
    }));

    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];
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
  }, [inventory, logs, sortConfig, searchTerm, preparations, inventoryFilter]);

  const filteredPreparations = useMemo(() => {
    let filtered = preparations;

    if (preparationLogFilter) {
      return filtered.filter(p => p.id === preparationLogFilter);
    }

    if (prepSearchTerm) {
      const term = prepSearchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(term) ||
        (p.ingredients && p.ingredients.some(ing => ing.name.toLowerCase().includes(term)))
      );
    }

    return filtered;
  }, [preparations, preparationLogFilter, prepSearchTerm]);


  const getNextNi = () => {
    const currentYear = new Date().getFullYear().toString().slice(-2);
    let maxProg = 0;
    inventory.forEach(item => {
      const prefix = `${currentYear}/S`;
      if (item.ni && item.ni.toUpperCase().startsWith(prefix)) {
        const parts = item.ni.toUpperCase().split('S');
        if (parts.length > 1) {
          const progNum = parseInt(parts[1]);
          if (!isNaN(progNum) && progNum > maxProg) {
            maxProg = progNum;
          }
        }
      }
    });
    return `${currentYear}/S${(maxProg + 1).toString().padStart(3, '0')}`;
  };

  const handleOpenAddModal = () => {
    setEditingSubstance(null);
    setNewSubstance({
      name: '', ni: getNextNi(), lot: '', expiry: '', quantity: '', unit: 'g', costPerGram: '', totalCost: '', supplier: '', purity: '',
      receptionDate: '', ddtNumber: '', ddtDate: '', firstUseDate: null, endUseDate: null,
      sdsFile: null,
      securityData: null
    });
    setIsReadOnlyMode(false);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingSubstance(item);
    setNewSubstance({
      ...item,
      quantity: item.quantity.toString(),
      totalCost: item.totalCost ? item.totalCost.toString() : '',
      costPerGram: item.costPerGram !== undefined && item.costPerGram !== null ? item.costPerGram.toString() : ''
    });
    setIsReadOnlyMode(false);
    setIsAddModalOpen(true);
  };

  const handleOpenViewModal = (item) => {
    setEditingSubstance(item);
    setNewSubstance({
      ...item,
      quantity: item.quantity.toString(),
      totalCost: item.totalCost ? item.totalCost.toString() : '',
      costPerGram: item.costPerGram !== undefined && item.costPerGram !== null ? item.costPerGram.toString() : ''
    });
    setIsReadOnlyMode(true);
    setIsAddModalOpen(true);
  };

  const handleAddOrUpdateSubstance = (e) => {
    e.preventDefault();
    let updatedInventory;
    let newLog;

    const formatToNumber = (val) => val ? parseFloat(parseFloat(val).toFixed(2)) : 0;
    
    const substanceToSave = {
      ...newSubstance,
      quantity: formatToNumber(newSubstance.quantity),
      costPerGram: newSubstance.costPerGram ? parseFloat(parseFloat(newSubstance.costPerGram).toFixed(4)) : 0, // Manteniamo più precisione per il costo/g
      totalCost: formatToNumber(newSubstance.totalCost)
    };

    if (editingSubstance) {
      updatedInventory = inventory.map(item => item.id === editingSubstance.id ? {
        ...item,
        ...substanceToSave
      } : item);
      newLog = { id: Date.now(), date: new Date().toISOString().split('T')[0], type: 'RETTIFICA', substance: newSubstance.name, ni: newSubstance.ni, lot: newSubstance.lot, quantity: substanceToSave.quantity, unit: newSubstance.unit, operator: 'Sessione Corrente', notes: `Aggiornamento Anagrafica N.I. ${newSubstance.ni}` };
    } else {
      const newItem = {
        id: Date.now(),
        ...substanceToSave,
        openDate: null,
        disposed: false
      };
      updatedInventory = [...inventory, newItem];
      newLog = { id: Date.now() + 1, date: new Date().toISOString().split('T')[0], type: 'CARICO', substance: newItem.name, ni: newItem.ni, lot: newItem.lot, quantity: newItem.quantity, unit: newItem.unit, operator: 'Sessione Corrente', notes: `Carico Magazzino - N.I. ${newItem.ni}` };
    }

    saveData(updatedInventory, [newLog, ...logs]);
    setIsAddModalOpen(false);
  };

  const handleDispose = (itemId) => {
    const itemToDispose = inventory.find(i => i.id === itemId);
    if (!itemToDispose || !window.confirm(`Confermi di voler smaltire ${itemToDispose.name}?`)) return;

    const updatedInventory = inventory.map(item => item.id === itemId ? { ...item, disposed: true, endUseDate: new Date().toISOString().split('T')[0] } : item);

    const disposalLog = { id: Date.now(), date: new Date().toISOString().split('T')[0], type: 'SMALTIMENTO', substance: itemToDispose.name, ni: itemToDispose.ni, quantity: itemToDispose.quantity, unit: itemToDispose.unit, operator: 'Sessione Corrente', notes: 'Smaltimento' };
    saveData(updatedInventory, [disposalLog, ...logs]);
  };

  const handleDeletePreparation = (prepId) => {
    const prepToDelete = preparations.find(p => p.id === prepId);
    if (!prepToDelete || !window.confirm(`Eliminare prep "${prepToDelete.name}"?`)) return;
    let updatedInventory = [...inventory];
    const refundLogs = [];
    prepToDelete.ingredients.forEach(ing => {
      const invIndex = updatedInventory.findIndex(i => (ing.id && i.id === ing.id) || (i.name === ing.name && i.lot === ing.lot));
      if (invIndex >= 0) {
        updatedInventory[invIndex] = { ...updatedInventory[invIndex], quantity: updatedInventory[invIndex].quantity + ing.amountUsed };
        refundLogs.push({ id: Math.random(), date: new Date().toISOString().split('T')[0], type: 'ANNULLAMENTO', substance: ing.name, ni: ing.ni, quantity: ing.amountUsed, unit: ing.unit, operator: 'Sessione Corrente', notes: `Annullamento Prep. ${prepToDelete.prepNumber}` });
      }
    });
    saveData(updatedInventory, [...refundLogs, ...logs], preparations.filter(p => p.id !== prepId));
  };

  const handleUsage = (itemsUsed, prepDetails) => {
    let currentInventory = [...inventory];
    let currentLogs = [...logs];
    let currentPreparations = [...preparations];

    if (editingPrep) {
      editingPrep.ingredients.forEach(ing => {
        const invIndex = currentInventory.findIndex(i => (ing.id && i.id === ing.id) || (i.name === ing.name && i.lot === ing.lot));
        if (invIndex >= 0) currentInventory[invIndex].quantity += ing.amountUsed;
      });
      currentPreparations = currentPreparations.filter(p => p.id !== editingPrep.id);
      currentLogs.unshift({ id: Math.random(), date: new Date().toISOString().split('T')[0], type: 'RETTIFICA', substance: 'VARIE', ni: '-', quantity: 0, unit: '-', operator: 'Sessione', notes: `Modifica Prep ${editingPrep.prepNumber}` });
    }

    const newInventory = currentInventory.map(item => {
      const used = itemsUsed.find(u => u.id === item.id);
      if (used) {
        const newItem = { ...item, quantity: item.quantity - used.amountUsed };
        if (!newItem.firstUseDate) {
          newItem.firstUseDate = new Date().toISOString().split('T')[0];
        }
        return newItem;
      }
      return item;
    });

    const newLogsEntries = itemsUsed.map(used => ({ id: Math.random(), date: new Date().toISOString().split('T')[0], type: 'SCARICO', substance: used.name, ni: used.ni, quantity: used.amountUsed, unit: used.unit, operator: 'Sessione Corrente', notes: `Prep: ${prepDetails.name}` }));

    const newPrep = {
      id: editingPrep ? editingPrep.id : Date.now(),
      prepNumber: prepDetails.prepNumber, name: prepDetails.name, pharmaceuticalForm: prepDetails.pharmaceuticalForm, expiryDate: prepDetails.expiryDate, posology: prepDetails.posology,
      date: editingPrep ? editingPrep.date : new Date().toISOString().split('T')[0],
      patient: prepDetails.patient, doctor: prepDetails.doctor, status: 'Completata', ingredients: itemsUsed,
      quantity: prepDetails.quantity, prepUnit: prepDetails.prepUnit,
      totalPrice: prepDetails.totalPrice
    };

    saveData(newInventory, [...newLogsEntries, ...currentLogs], [newPrep, ...currentPreparations]);
    setEditingPrep(null);
    setActiveTab('preparations_log');
  };

  const handleJumpToStep = (prep, step = 1) => {
    setEditingPrep(prep);
    setInitialWizardStep(step);
    setActiveTab('preparation');
  };

  const handleNewPreparation = () => {
    setEditingPrep(null);
    setInitialWizardStep(1);
    setActiveTab('preparation');
  };

  if (loadingData) return <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-500 gap-2"><Loader2 className="animate-spin" /> Caricamento...</div>;

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard 
                  stats={stats} 
                  logs={logs} 
                  inventory={inventory} 
                  preparations={preparations}
                  setActiveTab={setActiveTab} 
                  setInventoryFilter={setInventoryFilter} 
                  handleDispose={handleDispose}
                  handleShowPreparation={handleShowPreparation}
                  handleShowSubstanceInInventory={handleShowSubstanceInInventory}
                />;
      case 'inventory':
        const filteredInventory = inventoryFilterSubstance
          ? sortedActiveInventory.filter(item => item.id === inventoryFilterSubstance)
          : sortedActiveInventory;
        const filteredDisposedInventory = inventoryFilterSubstance
          ? sortedDisposedInventory.filter(item => item.id === inventoryFilterSubstance)
          : sortedDisposedInventory;
        return <Inventory
          inventoryFilter={inventoryFilter}
          setInventoryFilter={setInventoryFilter}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          sortedActiveInventory={filteredInventory}
          sortedDisposedInventory={filteredDisposedInventory}
          handleOpenAddModal={handleOpenAddModal}
          handleOpenEditModal={handleOpenEditModal}
          handleOpenViewModal={handleOpenViewModal}
          handleDispose={handleDispose}
          sortConfig={sortConfig}
          requestSort={requestSort}
          activeSubstanceFilter={inventoryFilterSubstance}
          clearSubstanceFilter={() => setInventoryFilterSubstance(null)}
        />;
      case 'preparations_log':
        return <PreparationsLog 
                  preparations={filteredPreparations} 
                  handleJumpToStep={handleJumpToStep} 
                  handleDeletePreparation={handleDeletePreparation}
                  activeFilter={preparationLogFilter}
                  clearFilter={() => setPreparationLogFilter(null)}
                  searchTerm={prepSearchTerm}
                  setSearchTerm={setPrepSearchTerm}
               />;
      case 'preparation':
        return <PreparationWizard 
                  inventory={inventory} 
                  preparations={preparations} 
                  onComplete={handleUsage} 
                  initialData={editingPrep} 
                  pharmacySettings={pharmacySettings}
                  initialStep={initialWizardStep}
               />;
      case 'logs':
        return <Logs logs={logs} />;
      case 'ai-assistant':
        return <AIAssistant />;
      case 'settings':
        return <SettingsComponent settings={pharmacySettings} setSettings={setPharmacySettings} />;
      default:
        return null;
    }
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">

      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shadow-xl">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-3 text-white mb-1"><Beaker className="w-8 h-8 text-teal-400" /><span className="font-bold text-xl tracking-tight">Galenico<span className="text-teal-400">Lab</span></span></div>
          <p className="text-xs text-slate-500">Gestione Norme NBP</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <SidebarItem icon={<ClipboardList size={20} />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <SidebarItem icon={<Package size={20} />} label="Magazzino Sostanze" active={activeTab === 'inventory'} onClick={() => { setInventoryFilter('all'); setActiveTab('inventory'); }} />
          <SidebarItem icon={<Pill size={20} />} label={editingPrep ? "Modifica Prep." : "Nuova Prep."} active={activeTab === 'preparation'} onClick={handleNewPreparation} />
          <SidebarItem icon={<LayoutList size={20} />} label="Registro Preparazioni" active={activeTab === 'preparations_log'} onClick={() => setActiveTab('preparations_log')} />
          <SidebarItem icon={<History size={20} />} label="Registro Movimenti" active={activeTab === 'logs'} onClick={() => setActiveTab('logs')} />
          <div className="pt-4 mt-4 border-t border-slate-700">
            <SidebarItem icon={<Sparkles size={20} className="text-purple-400" />} label="Assistente IA" active={activeTab === 'ai-assistant'} onClick={() => setActiveTab('ai-assistant')} />
            <SidebarItem icon={<Settings size={20} />} label="Impostazioni" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
          </div>
        </nav>
        <div className="p-4 border-t border-slate-800"><div className="flex items-center gap-2 mb-2 text-xs">{isOnline ? <span className="flex items-center gap-1 text-green-400"><Wifi size={12} /> Online</span> : <span className="flex items-center gap-1 text-slate-500"><WifiOff size={12} /> Locale</span>}</div><p className="text-xs text-slate-500">Utente: Dr. Farmacista</p></div>
      </aside>

      <main className="flex-1 overflow-auto">
        <header className="bg-white border-b border-slate-200 p-6 flex justify-between items-center sticky top-0 z-10">
          <h1 className="text-2xl font-bold text-slate-800">
            {activeTab === 'dashboard' && 'Panoramica Laboratorio'}
            {activeTab === 'inventory' && 'Magazzino & Sostanze'}
            {activeTab === 'preparation' && (editingPrep ? `Modifica: ${editingPrep.prepNumber}` : 'Foglio di Lavorazione')}
            {activeTab === 'preparations_log' && 'Registro Generale Preparazioni'}
            {activeTab === 'logs' && 'Registro di Carico/Scarico'}
            {activeTab === 'ai-assistant' && 'Assistente Galenico IA'}
            {activeTab === 'settings' && 'Impostazioni Farmacia'}
          </h1>
          <div className="flex items-center gap-4"><div className="bg-slate-100 px-3 py-1.5 rounded-md text-sm font-medium text-slate-600 border border-slate-200">{new Date().toLocaleDateString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div></div>
        </header>

        <div className="p-6 max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>

      <SubstanceModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        isReadOnly={isReadOnlyMode}
        editingSubstance={editingSubstance}
        substanceData={newSubstance}
        setSubstanceData={setNewSubstance}
        onSubmit={handleAddOrUpdateSubstance}
        getNextNi={getNextNi}
        handleSdsUpload={handleSdsUpload}
        handleRemoveSds={handleRemoveSds}
        handleDownloadPdf={handleDownloadPdf}
        preparations={preparations}
        onShowPreparation={handleShowPreparation}
      />
    </div>
  );
}
