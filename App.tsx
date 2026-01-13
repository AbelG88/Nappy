
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Layout from './components/Layout';
import Tracker from './components/Tracker';
import History from './components/History';
import Statistics from './components/Statistics';
import Caregivers from './components/Caregivers';
import Settings from './components/Settings';
import { storageService } from './services/storage';
import { AppData, BathroomLog, Caregiver, AppSettings } from './types';
import { Heart, X, CreditCard } from 'lucide-react';

const generateId = () => Math.random().toString(36).substring(2, 15) + Date.now().toString(36);

const App: React.FC = () => {
  const [data, setData] = useState<AppData>(storageService.loadData());
  const [activeTab, setActiveTab] = useState('track');
  const [showDonation, setShowDonation] = useState(false);
  
  const dataRef = useRef(data);
  useEffect(() => { dataRef.current = data; }, [data]);

  useEffect(() => {
    storageService.saveData(data);
  }, [data]);

  useEffect(() => {
    const checkReminders = () => {
      const { settings, logs } = dataRef.current;
      if (!settings.remindersEnabled) return;

      const now = Date.now();
      const intervalMs = settings.reminderIntervalMinutes * 60 * 1000;
      const lastLog = logs.length > 0 ? Math.max(...logs.map(l => l.timestamp)) : 0;
      const lastEvent = Math.max(lastLog, settings.lastReminderSentAt);
      
      if (now - lastEvent >= intervalMs) {
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("¡Hora del baño! 🚽", {
            body: `Es momento de llevar a ${dataRef.current.settings.childName || 'tu peque'} al baño.`,
            icon: "/favicon.ico"
          });
          handleUpdateSettings({ lastReminderSentAt: Date.now() });
        }
      }
    };
    const intervalId = setInterval(checkReminders, 60000);
    return () => clearInterval(intervalId);
  }, []);

  const handleAddLog = (logData: Omit<BathroomLog, 'id'>) => {
    const newLog: BathroomLog = { ...logData, id: generateId() };
    setData(prev => ({ 
      ...prev, 
      logs: [newLog, ...prev.logs],
      settings: { ...prev.settings, lastReminderSentAt: Date.now() }
    }));
  };

  const handleDeleteLog = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      logs: prev.logs.filter(l => l.id !== id)
    }));
  }, []);

  const handleDeleteAllLogs = useCallback(() => {
    setData(prev => ({
      ...prev,
      logs: []
    }));
  }, []);

  const handleAddCaregiver = (name: string, role: string) => {
    const newC: Caregiver = { id: generateId(), name, role };
    setData(prev => ({ ...prev, caregivers: [...prev.caregivers, newC] }));
  };

  const handleUpdateCaregiver = (id: string, name: string, role: string) => {
    setData(prev => ({
      ...prev,
      caregivers: prev.caregivers.map(c => c.id === id ? { ...c, name, role } : c)
    }));
  };

  const handleDeleteCaregiver = (id: string) => {
    setData(prev => ({ ...prev, caregivers: prev.caregivers.filter(c => c.id !== id) }));
  };

  const handleUpdateSettings = (newSettings: Partial<AppSettings>) => {
    setData(prev => ({ ...prev, settings: { ...prev.settings, ...newSettings } }));
  };

  const handleExport = () => storageService.exportData(data);
  
  const handleImport = async (file: File) => {
    try {
      const imported = await storageService.importData(file);
      if (imported) {
        setData(prev => {
          // Fusionar logs evitando duplicados por ID
          const existingLogIds = new Set(prev.logs.map(l => l.id));
          const newLogs = imported.logs.filter(l => !existingLogIds.has(l.id));
          
          // Fusionar cuidadores evitando duplicados por ID
          const existingCaregiverIds = new Set(prev.caregivers.map(c => c.id));
          const newCaregivers = imported.caregivers.filter(c => !existingCaregiverIds.has(c.id));

          return {
            ...prev,
            logs: [...newLogs, ...prev.logs].sort((a, b) => b.timestamp - a.timestamp),
            caregivers: [...prev.caregivers, ...newCaregivers]
          };
        });
        alert('¡Datos fusionados con éxito!');
      } else {
        alert('El archivo no es un respaldo válido de Nappy.');
      }
    } catch (e) {
      alert('Error al importar el archivo.');
    }
  };

  return (
    <>
      <Layout 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        title={activeTab === 'track' ? 'Registro' : activeTab === 'history' ? 'Historial' : activeTab === 'stats' ? 'Progreso' : activeTab === 'caregivers' ? 'Equipo' : 'Ajustes'}
      >
        {activeTab === 'track' && <Tracker caregivers={data.caregivers} onAddLog={handleAddLog} />}
        {activeTab === 'history' && (
          <History 
            logs={data.logs} 
            caregivers={data.caregivers} 
            onDeleteLog={handleDeleteLog} 
            onDeleteAll={handleDeleteAllLogs}
          />
        )}
        {activeTab === 'stats' && <Statistics logs={data.logs} />}
        {activeTab === 'caregivers' && (
          <Caregivers caregivers={data.caregivers} onAdd={handleAddCaregiver} onUpdate={handleUpdateCaregiver} onDelete={handleDeleteCaregiver} />
        )}
        {activeTab === 'settings' && (
          <Settings settings={data.settings} onUpdateSettings={handleUpdateSettings} onExport={handleExport} onImport={handleImport} />
        )}
      </Layout>

      {showDonation && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white rounded-[40px] p-8 max-w-sm w-full shadow-2xl relative text-center space-y-4">
            <button onClick={() => setShowDonation(false)} className="absolute top-4 right-4 p-2 text-slate-300"><X size={20} /></button>
            <div className="inline-flex items-center justify-center w-20 h-20 bg-rose-500 text-white rounded-[32px] shadow-xl">Heart</div>
            <h3 className="text-2xl font-black text-slate-800">¿Te gusta Nappy?</h3>
            <div className="space-y-3 pt-4">
              <a href="https://paypal.me/AbelG88" target="_blank" className="w-full bg-[#0070ba] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2">PayPal</a>
              <a href="https://link.mercadopago.com.ar/abelg88" target="_blank" className="w-full bg-[#009ee3] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2">Mercado Pago</a>
            </div>
            <button onClick={() => setShowDonation(false)} className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-2">Cerrar</button>
          </div>
        </div>
      )}
    </>
  );
};

export default App;
