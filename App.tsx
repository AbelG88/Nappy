
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Layout from './components/Layout';
import Tracker from './components/Tracker';
import History from './components/History';
import Statistics from './components/Statistics';
import Caregivers from './components/Caregivers';
import Settings from './components/Settings';
import { storageService } from './services/storage';
import { AppData, BathroomLog, Caregiver, AppSettings } from './types';
import { Heart, X } from 'lucide-react';

const App: React.FC = () => {
  const [data, setData] = useState<AppData>(storageService.loadData());
  const [activeTab, setActiveTab] = useState('track');
  const [showDonation, setShowDonation] = useState(false);
  
  // Refs to avoid stale closures in intervals
  const dataRef = useRef(data);
  useEffect(() => { dataRef.current = data; }, [data]);

  // Persistence
  useEffect(() => {
    storageService.saveData(data);
  }, [data]);

  // Periodic Donation Prompt
  useEffect(() => {
    const checkDonation = () => {
      const now = Date.now();
      const twelveHours = 12 * 60 * 60 * 1000;
      if (now - data.settings.lastDonationPrompt > twelveHours) {
        setShowDonation(true);
      }
    };
    checkDonation();
  }, [data.settings.lastDonationPrompt]);

  // Notification Logic
  useEffect(() => {
    const checkReminders = () => {
      const { settings, logs } = dataRef.current;
      if (!settings.remindersEnabled) return;

      const now = Date.now();
      const intervalMs = settings.reminderIntervalMinutes * 60 * 1000;
      
      // Calculate time since last event (log or last reminder)
      const lastLog = logs.length > 0 ? [...logs].sort((a,b) => b.timestamp - a.timestamp)[0].timestamp : 0;
      const lastEvent = Math.max(lastLog, settings.lastReminderSentAt);
      
      if (now - lastEvent >= intervalMs) {
        triggerNotification();
      }
    };

    const triggerNotification = () => {
      if (!("Notification" in window)) return;
      
      if (Notification.permission === "granted") {
        new Notification("¡Hora del baño! 🚽", {
          body: `Es momento de llevar a ${dataRef.current.settings.childName || 'tu peque'} al baño.`,
          icon: "/favicon.ico"
        });
        
        // Update last reminder time to avoid spam
        handleUpdateSettings({ lastReminderSentAt: Date.now() });
      }
    };

    const intervalId = setInterval(checkReminders, 30000); // Check every 30 seconds
    return () => clearInterval(intervalId);
  }, []);

  const handleAddLog = (logData: Omit<BathroomLog, 'id'>) => {
    const newLog: BathroomLog = {
      ...logData,
      id: crypto.randomUUID()
    };
    setData(prev => ({ 
      ...prev, 
      logs: [...prev.logs, newLog],
      // Reset reminder timer when a log is added manually
      settings: { ...prev.settings, lastReminderSentAt: Date.now() }
    }));
  };

  const handleDeleteLog = (id: string) => {
    setData(prev => ({ ...prev, logs: prev.logs.filter(l => l.id !== id) }));
  };

  const handleDeleteAllLogs = () => {
    setData(prev => ({ ...prev, logs: [] }));
  };

  const handleAddCaregiver = (name: string, role: string) => {
    const newC: Caregiver = { id: crypto.randomUUID(), name, role };
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
    setData(prev => ({
      ...prev,
      settings: { ...prev.settings, ...newSettings }
    }));
  };

  const handleExport = () => {
    storageService.exportData(data);
  };

  const handleImport = async (file: File) => {
    const imported = await storageService.importData(file);
    if (imported) {
      if (confirm('¿Deseas reemplazar todos tus datos actuales con el archivo importado?')) {
        setData(imported);
        alert('Datos importados correctamente.');
      }
    } else {
      alert('Error al importar el archivo. Formato no válido.');
    }
  };

  const closeDonation = () => {
    setShowDonation(false);
    handleUpdateSettings({ lastDonationPrompt: Date.now() });
  };

  const getTitle = () => {
    switch(activeTab) {
      case 'track': return 'Nuevo Registro';
      case 'history': return 'Historial';
      case 'stats': return 'Progreso';
      case 'caregivers': return 'Equipo de Cuidado';
      case 'settings': return 'Configuración';
      default: return 'PottyTime';
    }
  };

  return (
    <>
      <Layout activeTab={activeTab} setActiveTab={setActiveTab} title={getTitle()}>
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
          <Caregivers 
            caregivers={data.caregivers} 
            onAdd={handleAddCaregiver} 
            onUpdate={handleUpdateCaregiver} 
            onDelete={handleDeleteCaregiver} 
          />
        )}
        {activeTab === 'settings' && (
          <Settings 
            settings={data.settings} 
            onUpdateSettings={handleUpdateSettings} 
            onExport={handleExport}
            onImport={handleImport}
          />
        )}
      </Layout>

      {/* Donation Modal Overlay */}
      {showDonation && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] p-8 max-w-sm w-full shadow-2xl relative overflow-hidden">
            <button 
              onClick={closeDonation}
              className="absolute top-4 right-4 p-2 text-slate-300 hover:text-slate-500"
            >
              <X size={20} />
            </button>
            
            <div className="absolute -top-12 -left-12 w-32 h-32 bg-rose-50 rounded-full" />
            
            <div className="relative text-center space-y-4">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-rose-500 text-white rounded-[32px] shadow-xl shadow-rose-200">
                <Heart size={40} className="fill-white" />
              </div>
              
              <h3 className="text-2xl font-black text-slate-800 leading-tight">
                ¿Te gusta PottyTime?
              </h3>
              
              <p className="text-slate-500 text-sm leading-relaxed">
                Esta app es gratuita y sin anuncios. Tu apoyo nos ayuda a seguir ayudando a miles de familias en este gran paso.
              </p>
              
              <div className="space-y-3 pt-4">
                <button 
                  onClick={() => {
                    alert('¡Gracias! Abriendo enlace de donación...');
                    closeDonation();
                  }}
                  className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-rose-200 transition-all active:scale-95"
                >
                  Hacer una Donación ☕
                </button>
                <button 
                  onClick={() => {
                    alert('¡Gracias por recomendarnos!');
                    closeDonation();
                  }}
                  className="w-full bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold py-4 rounded-2xl transition-all"
                >
                  Recomendar la App
                </button>
              </div>
              
              <button 
                onClick={closeDonation}
                className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-2 hover:text-slate-600"
              >
                Quizás más tarde
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default App;
