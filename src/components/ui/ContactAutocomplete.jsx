import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Plus, Loader2 } from 'lucide-react';
import { useApi } from '../../hooks/useApi';

const ContactAutocomplete = ({ 
    value, 
    onChange, 
    contacts, 
    type, 
    placeholder, 
    disabled, 
    className,
    onSelect,
    refreshContacts
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [filteredContacts, setFilteredContacts] = useState([]);
    const [isCreating, setIsCreating] = useState(false);
    const wrapperRef = useRef(null);
    const { createApiRequest } = useApi();

    const filteredByType = React.useMemo(() => {
        return (contacts || []).filter(c => c.type === type);
    }, [contacts, type]);

    useEffect(() => {
        if (!value) {
            setFilteredContacts(filteredByType);
        } else {
            const lowerVal = value.toLowerCase();
            setFilteredContacts(filteredByType.filter(c => c.name.toLowerCase().includes(lowerVal)));
        }
    }, [value, filteredByType]);

    // Chiudi dropdown se clicco fuori
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (contact) => {
        onChange(contact.name);
        if (onSelect) onSelect(contact);
        setIsOpen(false);
    };

    const handleCreate = async () => {
        if (!value || value.trim() === '') return;
        setIsCreating(true);
        const newContact = { name: value.trim(), type };
        try {
            const res = await createApiRequest('save_contact', newContact);
            if (res && res.success) {
                handleSelect({ ...newContact, id: res.id });
                if (refreshContacts) refreshContacts();
            } else {
                alert("Errore creazione contatto");
            }
        } catch (e) {
            console.error(e);
        }
        setIsCreating(false);
    };

    return (
        <div className="relative w-full" ref={wrapperRef}>
            <div className="relative">
                <input
                    type="text"
                    className={className}
                    value={value}
                    onChange={(e) => { onChange(e.target.value); setIsOpen(true); }}
                    onFocus={() => setIsOpen(true)}
                    placeholder={placeholder}
                    disabled={disabled}
                />
                {!disabled && (
                    <button 
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        <ChevronDown size={16} />
                    </button>
                )}
            </div>

            {isOpen && !disabled && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {filteredContacts.length > 0 ? (
                        filteredContacts.map(contact => (
                            <div
                                key={contact.id}
                                className="px-4 py-2 hover:bg-slate-50 cursor-pointer text-sm text-slate-700 flex justify-between items-center"
                                onClick={() => handleSelect(contact)}
                            >
                                <span>{contact.name}</span>
                                {contact.city && <span className="text-xs text-slate-400">{contact.city}</span>}
                            </div>
                        ))
                    ) : (
                        <div className="p-2">
                            {value && (
                                <button 
                                    onClick={handleCreate}
                                    disabled={isCreating}
                                    className="w-full text-left px-3 py-2 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md flex items-center gap-2 font-bold transition-colors"
                                >
                                    {isCreating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                                    Crea "{value}"
                                </button>
                            )}
                            {!value && <div className="px-4 py-2 text-sm text-slate-400 italic">Inizia a scrivere...</div>}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ContactAutocomplete;
