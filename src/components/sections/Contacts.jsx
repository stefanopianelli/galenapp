import React, { useState, useMemo } from 'react';
import { Search, Plus, Filter, User, Truck, Stethoscope, Pencil, Trash2, X, Phone, Mail, MapPin, History, BarChart } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { useApi } from '../../hooks/useApi';
import { formatDate } from '../../utils/dateUtils';

const ContactRow = ({ contact, onEdit, onDelete, canEdit }) => {
    const TypeIcon = {
        customer: User,
        supplier: Truck,
        doctor: Stethoscope
    }[contact.type] || User;

    return (
        <tr className="border-b border-slate-50 hover:bg-slate-50 transition-colors text-sm">
            <td className="px-4 py-3 cursor-pointer" onClick={() => onEdit(contact)}>
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${contact.type === 'supplier' ? 'bg-amber-100 text-amber-600' : contact.type === 'doctor' ? 'bg-blue-100 text-blue-600' : 'bg-teal-100 text-teal-600'}`}>
                        <TypeIcon size={16} />
                    </div>
                    <div>
                        <div className="font-bold text-slate-700 hover:text-blue-600 transition-colors">{contact.name}</div>
                        {contact.taxId && <div className="text-[10px] text-slate-400 font-mono">{contact.taxId}</div>}
                    </div>
                </div>
            </td>
            <td className="px-4 py-3 text-slate-500">
                {contact.phone && <div className="flex items-center gap-1"><Phone size={12}/> {contact.phone}</div>}
                {contact.email && <div className="flex items-center gap-1"><Mail size={12}/> {contact.email}</div>}
            </td>
            <td className="px-4 py-3 text-slate-500 text-xs">
                {contact.address && <div>{contact.address}</div>}
                {(contact.city || contact.zip) && <div>{contact.zip} {contact.city} {contact.province ? `(${contact.province})` : ''}</div>}
            </td>
            <td className="px-4 py-3 text-center">
                <Badge type={contact.type === 'supplier' ? 'warning' : contact.type === 'doctor' ? 'info' : 'success'}>
                    {contact.type === 'supplier' ? 'Fornitore' : contact.type === 'doctor' ? 'Medico' : 'Cliente'}
                </Badge>
            </td>
            <td className="px-4 py-3 text-center">
                {canEdit && (
                    <div className="flex justify-center gap-1">
                        <button onClick={() => onEdit(contact)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"><Pencil size={16} /></button>
                        <button onClick={() => onDelete(contact.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"><Trash2 size={16} /></button>
                    </div>
                )}
            </td>
        </tr>
    );
};

const ContactModal = ({ isOpen, onClose, contact, onSave, preparations, inventory, handleShowPreparation }) => {
    const defaultData = { type: 'customer', name: '', taxId: '', email: '', phone: '', address: '', city: '', zip: '', province: '', notes: '' };
    const [formData, setFormData] = useState(defaultData);
    const [activeTab, setActiveTab] = useState('info');
    const [taxIdError, setTaxIdError] = useState('');
    const [zipError, setZipError] = useState('');

    React.useEffect(() => {
        if (isOpen) {
            setFormData(contact || defaultData);
            setTaxIdError('');
            setZipError('');
            setActiveTab('info');
        }
    }, [contact, isOpen]);

    const contactHistory = useMemo(() => {
        if (!contact || !preparations || contact.type === 'supplier') return [];
        const name = contact.name.toLowerCase();
        return preparations.filter(p => {
            if (contact.type === 'customer') return (p.patient || '').toLowerCase() === name;
            if (contact.type === 'doctor') return (p.doctor || '').toLowerCase() === name;
            return false;
        }).sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [contact, preparations]);

    const supplierHistory = useMemo(() => {
        if (!contact || !inventory || contact.type !== 'supplier') return [];
        const name = contact.name.toLowerCase();
        return inventory.filter(i => (i.supplier || '').toLowerCase() === name).sort((a, b) => new Date(b.receptionDate || b.id) - new Date(a.receptionDate || a.id));
    }, [contact, inventory]);

    const stats = useMemo(() => {
        if (contact?.type === 'supplier') {
            const total = supplierHistory.length;
            const stockValue = supplierHistory.reduce((acc, i) => acc + (parseFloat(i.quantity) * parseFloat(i.costPerGram || 0)), 0);
            return { total, value: stockValue };
        } else {
            const total = contactHistory.length;
            const value = contactHistory.reduce((acc, p) => acc + parseFloat(p.totalPrice || 0), 0);
            return { total, value };
        }
    }, [contactHistory, supplierHistory, contact]);

    const validateZip = (val) => {
        if (!val) { setZipError(''); return true; }
        if (!/^\d{5}$/.test(val)) {
            setZipError('CAP non valido (5 cifre)');
            return false;
        }
        setZipError('');
        return true;
    };

    const validateTaxId = (val) => {
        if (!val) { setTaxIdError(''); return true; }
        const cleanVal = val.toUpperCase().trim();
        if (formData.type === 'supplier') {
            if (!/^[0-9]{11}$/.test(cleanVal)) {
                setTaxIdError('P.IVA non valida (11 cifre)');
                return false;
            }
        } else {
            const cfRegex = /^[A-Z]{6}[0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{3}[A-Z]$/;
            if (!cfRegex.test(cleanVal)) {
                if (/^[0-9]{11}$/.test(cleanVal)) { setTaxIdError('Formato P.IVA rilevato (atteso CF)'); return true; }
                setTaxIdError('Codice Fiscale non valido');
                return false;
            }
        }
        setTaxIdError('');
        return true;
    };

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        validateTaxId(formData.taxId);
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                    <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                        {formData.id ? formData.name : 'Nuovo Contatto'}
                        {formData.id && (
                            <div className="flex bg-slate-200 rounded-lg p-1 ml-4">
                                <button onClick={() => setActiveTab('info')} className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${activeTab === 'info' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Dati</button>
                                <button onClick={() => setActiveTab('history')} className={`px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${activeTab === 'history' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`} disabled={!contact?.id}>
                                    {contact?.type === 'supplier' ? <Truck size={12}/> : <History size={12}/>} 
                                    {contact?.type === 'supplier' ? 'Forniture' : 'Storico'}
                                </button>
                            </div>
                        )}
                    </h3>
                    <button onClick={onClose}><X className="text-slate-400 hover:text-slate-600" /></button>
                </div>
                
                <div className="overflow-y-auto p-6 flex-1">
                    {activeTab === 'info' ? (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome / Ragione Sociale *</label>
                                    <input required type="text" className="w-full border p-2 rounded-lg outline-none focus:ring-2 ring-blue-500" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo</label>
                                    <select className="w-full border p-2 rounded-lg outline-none focus:ring-2 ring-blue-500 bg-white" value={formData.type} onChange={e => { setFormData({...formData, type: e.target.value}); setTaxIdError(''); }}>
                                        <option value="customer">Cliente / Paziente</option>
                                        <option value="doctor">Medico</option>
                                        <option value="supplier">Fornitore</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Codice Fiscale / P.IVA</label>
                                    <input type="text" className={`w-full border p-2 rounded-lg outline-none focus:ring-2 font-mono uppercase ${taxIdError ? 'border-red-300 ring-red-200 bg-red-50' : 'ring-blue-500'}`} value={formData.taxId || ''} onChange={e => { setFormData({...formData, taxId: e.target.value.toUpperCase()}); setTaxIdError(''); }} onBlur={(e) => validateTaxId(e.target.value)}/>
                                    {taxIdError && <p className="text-xs text-red-600 mt-1 font-bold">{taxIdError}</p>}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Telefono</label>
                                    <input type="text" className="w-full border p-2 rounded-lg outline-none focus:ring-2 ring-blue-500" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
                                    <input type="email" className="w-full border p-2 rounded-lg outline-none focus:ring-2 ring-blue-500" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Indirizzo</label>
                                    <input type="text" className="w-full border p-2 rounded-lg outline-none focus:ring-2 ring-blue-500" value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} />
                                </div>
                            </div>

                            <div className="grid grid-cols-6 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Città</label>
                                    <input type="text" className="w-full border p-2 rounded-lg outline-none focus:ring-2 ring-blue-500" value={formData.city || ''} onChange={e => setFormData({...formData, city: e.target.value})} />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">CAP</label>
                                    <input type="text" className={`w-full border p-2 rounded-lg outline-none focus:ring-2 font-mono ${zipError ? 'border-red-300 ring-red-200 bg-red-50' : 'ring-blue-500'}`} value={formData.zip || ''} onChange={e => { setFormData({...formData, zip: e.target.value.toUpperCase()}); setZipError(''); }} onBlur={(e) => validateZip(e.target.value)} maxLength={5}/>
                                    {zipError && <p className="text-xs text-red-600 mt-1 font-bold">{zipError}</p>}
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Prov.</label>
                                    <input type="text" className="w-full border p-2 rounded-lg outline-none focus:ring-2 ring-blue-500 uppercase font-bold" maxLength={2} value={formData.province || ''} onChange={e => setFormData({...formData, province: e.target.value.toUpperCase()})} />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Note</label>
                                <textarea className="w-full border p-2 rounded-lg outline-none focus:ring-2 ring-blue-500 h-20 resize-none" value={formData.notes || ''} onChange={e => setFormData({...formData, notes: e.target.value})} />
                            </div>

                            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                                <button type="button" onClick={onClose} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">Annulla</button>
                                <button type="submit" className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-md">Salva</button>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                    <div className="text-blue-600 text-xs font-bold uppercase mb-1">
                                        {contact.type === 'supplier' ? 'Articoli in Magazzino' : 'Preparazioni Totali'}
                                    </div>
                                    <div className="text-2xl font-bold text-slate-800">{stats.total}</div>
                                </div>
                                <div className="bg-teal-50 p-4 rounded-xl border border-teal-100">
                                    <div className="text-teal-600 text-xs font-bold uppercase mb-1">
                                        {contact.type === 'supplier' ? 'Valore Giacenza' : 'Valore Totale'}
                                    </div>
                                    <div className="text-2xl font-bold text-slate-800">€ {stats.value.toFixed(2)}</div>
                                </div>
                            </div>
                            
                            <div>
                                <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                                    {contact.type === 'supplier' ? <Truck size={18} className="text-slate-400"/> : <History size={18} className="text-slate-400"/>} 
                                    {contact.type === 'supplier' ? 'Forniture Attive' : 'Storico Recente'}
                                </h4>
                                
                                {contact.type === 'supplier' ? (
                                    supplierHistory.length > 0 ? (
                                        <div className="border rounded-lg overflow-hidden">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                                                    <tr>
                                                        <th className="px-4 py-2">Sostanza</th>
                                                        <th className="px-4 py-2">Lotto</th>
                                                        <th className="px-4 py-2 text-right">Giacenza</th>
                                                        <th className="px-4 py-2 text-right">Valore</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {supplierHistory.map(item => (
                                                        <tr key={item.id} className="hover:bg-slate-50">
                                                            <td className="px-4 py-2 font-medium text-slate-700 truncate max-w-[150px]" title={item.name}>{item.name}</td>
                                                            <td className="px-4 py-2 text-xs text-slate-500">{item.lot}</td>
                                                            <td className="px-4 py-2 text-right font-mono text-xs">{parseFloat(item.quantity).toFixed(2)} {item.unit}</td>
                                                            <td className="px-4 py-2 text-right font-mono text-xs">€ {(item.quantity * (item.costPerGram || 0)).toFixed(2)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : <p className="text-slate-400 italic text-center py-4">Nessuna fornitura attiva trovata in magazzino.</p>
                                ) : (
                                    contactHistory.length > 0 ? (
                                        <div className="border rounded-lg overflow-hidden">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                                                    <tr>
                                                        <th className="px-4 py-2">Data</th>
                                                        <th className="px-4 py-2">Preparazione</th>
                                                        <th className="px-4 py-2 text-right">Prezzo</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {contactHistory.map(p => (
                                                        <tr 
                                                            key={p.id} 
                                                            className="hover:bg-slate-50 cursor-pointer transition-colors"
                                                            onClick={() => { handleShowPreparation(p.id); onClose(); }}
                                                            title="Vai alla preparazione"
                                                        >
                                                            <td className="px-4 py-2 whitespace-nowrap">{formatDate(p.date)}</td>
                                                            <td className="px-4 py-2 font-medium text-slate-700">
                                                                <div className="truncate max-w-[200px]" title={p.name}>{p.name}</div>
                                                                <div className="text-[10px] text-slate-400 font-mono">{p.prepNumber}</div>
                                                            </td>
                                                            <td className="px-4 py-2 text-right font-mono">€ {parseFloat(p.totalPrice || 0).toFixed(2)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <p className="text-slate-400 italic text-center py-4">Nessuna preparazione trovata per questo contatto.</p>
                                    )
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const Contacts = ({ canEdit, preparations, inventory, handleShowPreparation }) => {
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingContact, setEditingContact] = useState(null);
    const { createApiRequest } = useApi();

    const fetchContacts = async () => {
        setLoading(true);
        const res = await createApiRequest('get_contacts', null, false, 'GET');
        if (res && Array.isArray(res)) setContacts(res);
        setLoading(false);
    };

    React.useEffect(() => {
        fetchContacts();
    }, []);

    const handleSave = async (data) => {
        const res = await createApiRequest('save_contact', data);
        if (res && res.success) {
            setIsModalOpen(false);
            fetchContacts();
        } else {
            alert("Errore salvataggio");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Eliminare contatto?")) return;
        const res = await createApiRequest('delete_contact', { id });
        if (res && res.success) fetchContacts();
    };

    const filteredContacts = useMemo(() => {
        return contacts.filter(c => {
            const matchSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                (c.taxId && c.taxId.toLowerCase().includes(searchTerm.toLowerCase()));
            const matchType = filterType === 'all' || c.type === filterType;
            return matchSearch && matchType;
        });
    }, [contacts, searchTerm, filterType]);

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-2.5 text-slate-400 h-4 w-4" />
                        <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Cerca contatto..." className="pl-9 pr-4 py-2 border border-slate-300 rounded-md text-sm w-full focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div className="flex bg-slate-100 p-1 rounded-lg gap-1 overflow-x-auto">
                        <button onClick={() => setFilterType('all')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap ${filterType === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Tutti</button>
                        <button onClick={() => setFilterType('customer')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${filterType === 'customer' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><User size={14}/> Clienti</button>
                        <button onClick={() => setFilterType('supplier')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${filterType === 'supplier' ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><Truck size={14}/> Fornitori</button>
                        <button onClick={() => setFilterType('doctor')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${filterType === 'doctor' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><Stethoscope size={14}/> Medici</button>
                    </div>
                </div>
                {canEdit && (
                    <button onClick={() => { setEditingContact(null); setIsModalOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold shadow-sm flex items-center gap-2 transition-colors">
                        <Plus size={18} /> Nuovo Contatto
                    </button>
                )}
            </div>

            <Card>
                <div className="overflow-auto max-h-[70vh]">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-500 sticky top-0 z-10 border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3 font-bold uppercase text-xs">Nominativo</th>
                                <th className="px-4 py-3 font-bold uppercase text-xs">Contatti</th>
                                <th className="px-4 py-3 font-bold uppercase text-xs">Indirizzo</th>
                                <th className="px-4 py-3 font-bold uppercase text-xs text-center">Tipo</th>
                                <th className="px-4 py-3 font-bold uppercase text-xs text-center">Azioni</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan="5" className="p-8 text-center text-slate-400">Caricamento rubrica...</td></tr>
                            ) : filteredContacts.length > 0 ? (
                                filteredContacts.map(c => (
                                    <ContactRow key={c.id} contact={c} onEdit={(item) => { setEditingContact(item); setIsModalOpen(true); }} onDelete={handleDelete} canEdit={canEdit} />
                                ))
                            ) : (
                                <tr><td colSpan="5" className="p-8 text-center text-slate-400 italic">Nessun contatto trovato</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            <ContactModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                contact={editingContact} 
                onSave={handleSave} 
                preparations={preparations}
                inventory={inventory}
                handleShowPreparation={handleShowPreparation}
            />
        </div>
    );
};

export default Contacts;
