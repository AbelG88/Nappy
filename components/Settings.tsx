
import React, { useState, useEffect } from 'react';
import { AppSettings, AppData } from '../types';
import { Download, Upload, Bell, BellOff, Info, Share2, Heart, ShieldAlert, Baby, CreditCard } from 'lucide-react';

interface SettingsProps {
  settings: AppSettings;
  onUpdateSettings: (settings: Partial<AppSettings>) => void;
  onExport: () => void;
  onImport: (file: File) => void;
}

const Settings: React.FC<SettingsProps> = ({ settings, onUpdateSettings, onExport, onImport }) => {
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImport(file);
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
    } else if (permission === 'denied') {
      alert("Las notificaciones están bloqueadas. Por favor, habilítalas en la configuración de tu navegador.");
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

  const testNotification = () => {
    if (notifPermission === 'granted') {
      new Notification("¡Prueba exitosa! 🚽", {
        body: `Así se verán los recordatorios para ${settings.childName || 'tu peque'}.`,
      });
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
          <p className="text-[10px] text-slate-400 mt-2 italic px-1">
            Este nombre se usará en las notificaciones de recordatorio.
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-6">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <Bell size={18} className="text-blue-500" /> Recordatorios
        </h3>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-slate-700">Habilitar Alarmas</p>
            <p className="text-xs text-slate-400">Recordatorio para ir al baño</p>
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
              Notificaciones bloqueadas por el sistema. Revisa los ajustes de tu celular/navegador.
            </p>
          </div>
        )}

        {settings.remindersEnabled && (
          <div className="animate-in fade-in zoom-in-95 space-y-4">
            <div>
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
                <option value={180}>Cada 3 horas</option>
              </select>
            </div>
            
            <button
              onClick={testNotification}
              className="w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs font-bold uppercase tracking-widest hover:border-blue-200 hover:text-blue-500 transition-colors"
            >
              Probar Notificación
            </button>
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-6">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <Share2 size={18} className="text-blue-500" /> Datos y Sincronización
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          No guardamos tus datos en la nube. Usa la exportación para pasar la información a otros cuidadores o para tener un respaldo.
        </p>
        
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onExport}
            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 border border-slate-100 text-slate-600 hover:bg-slate-100 transition-all gap-2"
          >
            <Download size={24} className="text-blue-500" />
            <span className="text-xs font-bold uppercase">Exportar</span>
          </button>
          
          <label className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 border border-slate-100 text-slate-600 hover:bg-slate-100 transition-all gap-2 cursor-pointer">
            <Upload size={24} className="text-indigo-500" />
            <span className="text-xs font-bold uppercase">Importar</span>
            <input type="file" accept=".json" onChange={handleFileChange} className="hidden" />
          </label>
        </div>
      </div>

      <div className="bg-blue-600 p-6 rounded-3xl text-white shadow-lg space-y-4">
        <div className="flex items-center gap-3">
           <Heart className="fill-white" size={24} />
           <h3 className="font-bold text-lg">Apoya el proyecto</h3>
        </div>
        <p className="text-blue-100 text-xs leading-relaxed">
          Nappy es gratuito. Tu apoyo nos ayuda a seguir mejorando para todas las familias.
        </p>
        <div className="space-y-2">
          <a 
            href="https://www.paypal.me" 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-full bg-white text-[#0070ba] font-bold py-3 rounded-2xl flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all"
          >
            <CreditCard size={18} />
            PayPal
          </a>
          <a 
            href="https://www.mercadopago.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-full bg-white text-[#009ee3] font-bold py-3 rounded-2xl flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all"
          >
            <CreditCard size={18} />
            Mercado Pago
          </a>
        </div>
        <button className="w-full bg-blue-500/30 text-white border border-white/20 font-bold py-3 rounded-2xl active:scale-95 transition-all mt-2">
          Recomendar App 🌟
        </button>
      </div>

      <div className="flex justify-center items-center gap-2 text-slate-300 py-4">
        <Info size={14} />
        <span className="text-[10px] font-bold uppercase tracking-widest">Versión 1.0.0 Alpha</span>
      </div>
    </div>
  );
};

export default Settings;
