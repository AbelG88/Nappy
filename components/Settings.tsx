import React, { useState, useRef } from 'react';
import { AppSettings } from '../types';
import { Download, Upload, Bell, Info, Share2, Heart, ShieldAlert, Baby, CreditCard, X, Check, AlertTriangle } from 'lucide-react';

interface SettingsProps {
  settings: AppSettings;
  onUpdateSettings: (settings: Partial<AppSettings>) => void;
  onExport: () => void;
  onImport: (file: File) => void;
}

const Settings: React.FC<SettingsProps> = ({ settings, onUpdateSettings, onExport, onImport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPendingFile(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const confirmImport = () => {
    if (pendingFile) {
      onImport(pendingFile);
      setPendingFile(null);
    }
  };

  const triggerImport = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const requestPermission = async () => {
    if (!("Notification" in window)) {
      alert("Tu navegador no soporta notificaciones.");
      return;
    }
    const permission = await Notification.requestPermission();
    setNotifPermission(permission);
    if (permission === 'granted') {
      onUpdateSettings({ remindersEnabled: true });
    }
  };

  const handleToggleReminders = () => {
    if (settings.remindersEnabled) {
      onUpdateSettings({ remindersEnabled: false });
    } else {
      if (notifPermission === 'granted') {
        onUpdateSettings({ remindersEnabled: true });
      } else {
        requestPermission();
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-6">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <Baby size={18} className="text-blue-500" /> Perfil del Niño
        </h3>
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-3">Nombre del Niño</label>
          <input
            type="text"
            value={settings.childName}
            onChange={(e) => onUpdateSettings({ childName: e.target.value })}
            placeholder="Ej: Mateo, Sofía..."
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-700 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
          />
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-6">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <Bell size={18} className="text-blue-500" /> Recordatorios
        </h3>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-slate-700">Habilitar Alarmas</p>
            <p className="text-xs text-slate-400">Notificación para ir al baño</p>
          </div>
          <button
            onClick={handleToggleReminders}
            className={`w-14 h-8 rounded-full p-1 transition-colors ${settings.remindersEnabled ? 'bg-blue-500' : 'bg-slate-200'}`}
          >
            <div className={`w-6 h-6 bg-white rounded-full transition-transform ${settings.remindersEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>

        {notifPermission === 'denied' && (
          <div className="bg-rose-50 p-4 rounded-2xl flex items-start gap-3 border border-rose-100">
            <ShieldAlert className="text-rose-500 shrink-0 mt-0.5" size={18} />
            <p className="text-[10px] text-rose-700 font-bold uppercase tracking-wider leading-relaxed">
              Notificaciones bloqueadas por el sistema.
            </p>
          </div>
        )}

        {settings.remindersEnabled && (
          <div className="space-y-4">
            <label className="block text-xs font-bold text-slate-400 uppercase mb-3">Frecuencia (minutos)</label>
            <select
              value={settings.reminderIntervalMinutes}
              onChange={(e) => onUpdateSettings({ reminderIntervalMinutes: parseInt(e.target.value) })}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-700 font-bold"
            >
              <option value={30}>Cada 30 min</option>
              <option value={60}>Cada 1 hora</option>
              <option value={90}>Cada 1.5 horas</option>
              <option value={120}>Cada 2 horas</option>
            </select>
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-6">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <Share2 size={18} className="text-blue-500" /> Datos y Sincronización
        </h3>
        
        {!pendingFile ? (
          <>
            <p className="text-xs text-slate-500">
              No guardamos tus datos en la nube. Exporta tus datos para tener un respaldo.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={onExport}
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 border border-slate-100 text-slate-600 active:bg-blue-50 active:text-blue-600 transition-all gap-2"
              >
                <Download size={24} className="text-blue-500" />
                <span className="text-xs font-bold uppercase">Exportar</span>
              </button>
              
              <button
                onClick={triggerImport}
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 border border-slate-100 text-slate-600 active:bg-indigo-50 active:text-indigo-600 transition-all gap-2"
              >
                <Upload size={24} className="text-indigo-500" />
                <span className="text-xs font-bold uppercase">Importar</span>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  accept=".json" 
                  onChange={handleFileChange} 
                  className="hidden" 
                />
              </button>
            </div>
          </>
        ) : (
          <div className="bg-blue-50 border-2 border-dashed border-blue-200 p-5 rounded-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-blue-700">
              <Upload className="shrink-0" />
              <div className="min-w-0">
                <p className="font-bold text-sm">¿Fusionar datos?</p>
                <p className="text-[10px] truncate italic">{pendingFile.name}</p>
              </div>
            </div>
            <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">Los nuevos registros se sumarán a tu historial.</p>
            <div className="flex gap-2">
              <button 
                onClick={() => setPendingFile(null)}
                className="flex-1 bg-white text-slate-400 font-bold py-3 rounded-xl border border-slate-200 text-xs"
              >
                CANCELAR
              </button>
              <button 
                onClick={confirmImport}
                className="flex-1 bg-blue-600 text-white font-black py-3 rounded-xl text-xs shadow-md active:scale-95 transition-transform"
              >
                ¡SUMAR DATOS!
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-200 space-y-4">
        <div className="flex items-center gap-3">
           <Heart className="text-rose-500 fill-rose-500" size={24} />
           <h3 className="font-bold text-lg text-slate-800">Apoya Nappy</h3>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          Nappy es una herramienta gratuita. Si te ayuda en el día a día, considera realizar una donación para mantener el proyecto vivo.
        </p>
        <div className="space-y-2 pt-2">
          <a 
            href="https://paypal.me/AbelG88" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="w-full bg-[#0070ba] hover:bg-[#005ea6] text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-100 transition-all active:scale-95"
          >
            <CreditCard size={18} /> PayPal
          </a>
          <a 
            href="https://link.mercadopago.com.ar/abelg88" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="w-full bg-[#009ee3] hover:bg-[#008cc9] text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-sky-100 transition-all active:scale-95"
          >
            <CreditCard size={18} /> Mercado Pago
          </a>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center gap-2 text-slate-300 py-4">
        <div className="flex items-center gap-2">
          <Info size={14} />
          <span className="text-[10px] font-bold uppercase tracking-widest">Versión 1.0.0 Alpha</span>
        </div>
        <p className="text-[9px] text-slate-300 font-medium">Hecho con ❤️ para familias en movimiento</p>
      </div>
    </div>
  );
};

export default Settings;