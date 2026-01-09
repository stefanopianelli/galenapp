import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import Card from '../ui/Card';

const InputField = ({ label, name, value, onChange, ...props }) => (
  <div>
    <label className="block text-sm font-bold text-slate-600 mb-1">{label}</label>
    <input
      type="text"
      name={name}
      value={value}
      onChange={onChange}
      className="w-full border p-3 rounded-md outline-none focus:ring-2 ring-teal-500"
      {...props}
    />
  </div>
);

const SettingsComponent = ({ settings, setSettings }) => {
  const [localSettings, setLocalSettings] = useState(settings);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(settings.logo ? `./api/uploads/${settings.logo}` : null);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
    if (settings.logo) setLogoPreview(`./api/uploads/${settings.logo}`);
  }, [settings]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLocalSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (e) => {
      const file = e.target.files[0];
      if (file) {
          setLogoFile(file);
          setLogoPreview(URL.createObjectURL(file));
      }
  };

  const handleSave = (e) => {
    e.preventDefault();
    
    // Usiamo FormData per gestire sia testo che file
    const formData = new FormData();
    Object.keys(localSettings).forEach(key => {
        formData.append(key, localSettings[key]);
    });
    
    if (logoFile) {
        formData.append('logo', logoFile);
    }

    setSettings(formData); // setSettings in MainApp deve gestire FormData
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  return (
    <Card className="p-8">
      <form onSubmit={handleSave} className="space-y-6">
        <div className="flex justify-between items-start">
            <h2 className="text-xl font-bold text-slate-800">Anagrafica Farmacia</h2>
            <div className="flex flex-col items-center gap-2">
                <div className="w-24 h-24 border-2 border-dashed border-slate-300 rounded-md flex items-center justify-center bg-slate-50 overflow-hidden relative">
                    {logoPreview ? (
                        <img src={logoPreview} alt="Logo Farmacia" className="w-full h-full object-contain" />
                    ) : (
                        <span className="text-xs text-slate-400 text-center px-1">Nessun Logo</span>
                    )}
                </div>
                <label className="cursor-pointer text-xs bg-slate-200 hover:bg-slate-300 px-2 py-1 rounded text-slate-700">
                    Carica Logo
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                </label>
            </div>
        </div>
        
        <InputField label="Nome Farmacia" name="name" value={localSettings.name} onChange={handleChange} />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputField label="Indirizzo (Via e N.)" name="address" value={localSettings.address} onChange={handleChange} />
          <InputField label="CAP" name="zip" value={localSettings.zip} onChange={handleChange} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputField label="Città" name="city" value={localSettings.city} onChange={handleChange} />
          <InputField label="Provincia" name="province" value={localSettings.province} onChange={handleChange} />
        </div>
        
        <InputField label="Numero di Telefono" name="phone" value={localSettings.phone} onChange={handleChange} />
        
        <div className="pt-4 flex items-center gap-4">
          <button type="submit" className="bg-teal-600 text-white px-6 py-2 rounded-md hover:bg-teal-700 flex items-center gap-2">
            <Save size={18} />
            Salva Impostazioni
          </button>
          {showSuccess && <span className="text-green-600 animate-in fade-in">Impostazioni salvate con successo!</span>}
        </div>
      </form>
    </Card>
  );
};

export default SettingsComponent;
