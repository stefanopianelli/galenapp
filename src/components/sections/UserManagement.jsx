// src/components/sections/UserManagement.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { UserPlus, Edit2, Trash2, Shield, User, Key, X, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const { token, user: currentUser } = useAuth();

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'operator'
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`./api/api.php?action=get_users&token=${token}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.error) {
        console.error("Errore API:", data.error);
        setUsers([]); // Evita il crash su .map
      } else if (Array.isArray(data)) {
        setUsers(data);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error("Errore recupero utenti:", error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setFormData({ username: '', password: '', role: 'operator' });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (u) => {
    setEditingUser(u);
    setFormData({ username: u.username, password: '', role: u.role });
    setIsAddModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const action = editingUser ? 'update_user' : 'create_user';
    const payload = editingUser ? { ...formData, id: editingUser.id } : formData;

    try {
      const response = await fetch(`./api/api.php?action=${action}&token=${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (result.success) {
        setIsAddModalOpen(false);
        fetchUsers();
      } else {
        alert(result.error || "Errore durante l'operazione");
      }
    } catch (error) {
      console.error("Errore salvataggio utente:", error);
    }
  };

  const handleDelete = async (id) => {
    if (id === currentUser.id) {
        alert("Non puoi eliminare il tuo stesso utente!");
        return;
    }
    if (!window.confirm("Sei sicuro di voler eliminare questo utente?")) return;

    try {
      const response = await fetch(`./api/api.php?action=delete_user&token=${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ id })
      });
      const result = await response.json();
      if (result.success) fetchUsers();
    } catch (error) {
      console.error("Errore eliminazione utente:", error);
    }
  };

  if (loading && users.length === 0) {
    return <div className="flex justify-center p-12 text-slate-400"><Loader2 className="animate-spin mr-2" /> Caricamento utenti...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Gestione Utenti</h2>
          <p className="text-sm text-slate-500">Gestisci gli accessi e i permessi del laboratorio</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 flex items-center gap-2 transition-colors shadow-sm"
        >
          <UserPlus size={18} />
          Nuovo Utente
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Username</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Ruolo</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Creato il</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Azioni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-700 flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
                    <User size={16} />
                  </div>
                  {u.username}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 
                    u.role === 'pharmacist' ? 'bg-blue-100 text-blue-700' : 
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {u.role.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">
                  {new Date(u.createdAt).toLocaleDateString('it-IT')}
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button onClick={() => handleOpenEditModal(u)} className="p-2 text-slate-400 hover:text-teal-600 transition-colors">
                    <Edit2 size={18} />
                  </button>
                  <button 
                    onClick={() => handleDelete(u.id)} 
                    disabled={u.id === currentUser.id}
                    className="p-2 text-slate-400 hover:text-red-600 transition-colors disabled:opacity-30"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Aggiungi/Modifica */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">{editingUser ? 'Modifica Utente' : 'Crea Nuovo Utente'}</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-1">Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 text-slate-400" size={18} />
                  <input
                    type="text"
                    required
                    className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none focus:ring-2 ring-teal-500"
                    value={formData.username}
                    onChange={e => setFormData({...formData, username: e.target.value})}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-1">
                  {editingUser ? 'Nuova Password (lascia vuoto per non cambiare)' : 'Password'}
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 text-slate-400" size={18} />
                  <input
                    type={editingUser ? 'text' : 'password'}
                    required={!editingUser}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none focus:ring-2 ring-teal-500"
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-600 mb-1">Ruolo</label>
                <div className="relative">
                  <Shield className="absolute left-3 top-3 text-slate-400" size={18} />
                  <select
                    className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none focus:ring-2 ring-teal-500 appearance-none bg-white"
                    value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value})}
                  >
                    <option value="operator">Operatore (Sola Lettura)</option>
                    <option value="pharmacist">Farmacista (Operativo)</option>
                    <option value="admin">Amministratore (Full)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-bold shadow-sm"
                >
                  {editingUser ? 'Salva Modifiche' : 'Crea Utente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
