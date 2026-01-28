import React, { useState, useMemo } from 'react';
import { Search, Plus, Filter, User, Truck, Stethoscope, Pencil, Trash2, X, Phone, Mail, MapPin } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { useApi } from '../../hooks/useApi';

const ContactRow = ({ contact, onEdit, onDelete, canEdit }) => {
    const TypeIcon = {
        customer: User,
        supplier: Truck,
        doctor: Stethoscope
    }[contact.type] || User;

    return (
        <tr className="border-b border-slate-50 hover:bg-slate-50 transition-colors text-sm">
            <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${contact.type === 'supplier' ? 'bg-amber-100 text-amber-600' : contact.type === 'doctor' ? 'bg-blue-100 text-blue-600' : 'bg-teal-100 text-teal-600'}`}>
                        <TypeIcon size={16} />
                    </div>
                    <div>
                        <div className="font-bold text-slate-700">{contact.name}</div>
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

const ContactModal = ({ isOpen, onClose, contact, onSave }) => {
    const [formData, setFormData] = useState(contact || { type: 'customer', name: '', taxId: '', email: '', phone: '', address: '', city: '', zip: '', province: '', notes: '' });

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-lg text-slate-800">{formData.id ? 'Modifica Contatto' : 'Nuovo Contatto'}</h3>
                    <button onClick={onClose}><X className="text-slate-400 hover:text-slate-600" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome / Ragione Sociale *</label>
                            <input required type="text" className="w-full border p-2 rounded-lg outline-none focus:ring-2 ring-blue-500" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo</label>
                            <select className="w-full border p-2 rounded-lg outline-none focus:ring-2 ring-blue-500 bg-white" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                                <option value="customer">Cliente / Paziente</option>
                                <option value="doctor">Medico</option>
                                <option value="supplier">Fornitore</option>
                            </select>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Codice Fiscale / P.IVA</label>
                            <input type="text" className="w-full border p-2 rounded-lg outline-none focus:ring-2 ring-blue-500 font-mono" value={formData.taxId || ''} onChange={e => setFormData({...formData, taxId: e.target.value})} />
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
                            <input type="text" className="w-full border p-2 rounded-lg outline-none focus:ring-2 ring-blue-500" value={formData.zip || ''} onChange={e => setFormData({...formData, zip: e.target.value})} />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Prov.</label>
                            <input type="text" className="w-full border p-2 rounded-lg outline-none focus:ring-2 ring-blue-500 uppercase" maxLength={2} value={formData.province || ''} onChange={e => setFormData({...formData, province: e.target.value})} />
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
            </div>
        </div>
    );
};

const Contacts = ({ canEdit }) => {
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
                    <select value={filterType} onChange={e => setFilterType(e.target.value)} className="border border-slate-300 rounded-md py-2 px-3 text-sm bg-white outline-none focus:ring-2 ring-blue-500">
                        <option value="all">Tutti i tipi</option>
                        <option value="customer">Clienti</option>
                        <option value="supplier">Fornitori</option>
                        <option value="doctor">Medici</option>
                    </select>
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
            />
        </div>
    );
};

export default Contacts;
