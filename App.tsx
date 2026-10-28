import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Layout from './components/Layout';
import Tracker from './components/Tracker';
import History from './components/History';
import Statistics from './components/Statistics';
import Caregivers from './components/Caregivers';
import Settings from './components/Settings';
import ProfileWizard, { WizardResult } from './components/ProfileWizard';
import { storageService } from './services/storage';
import { AppData, BathroomLog, Caregiver, AppSettings, Profile } from './types';
import { CAREGIVER_PRESETS } from './constants';
import { Heart, X, CreditCard } from 'lucide-react';

const generateId = () => Math.random().toString(36).substring(2, 15) + Date.now().toString(36);

const App: React.FC = () => {
  const [data, setData] = useState<AppData>(storageService.loadData());
  const [activeTab, setActiveTab] = useState('track');
  const [showDonation, setShowDonation] = useState(false);
  const [addingProfile, setAddingProfile] = useState(false);

  const dataRef = useRef(data);
  useEffect(() => { dataRef.current = data; }, [data]);

  useEffect(() => {
    storageService.saveData(data);
  }, [data]);

  const activeProfile: Profile | undefined =
    data.profiles.find(p => p.id === data.activeProfileId) ?? data.profiles[0];

  const profileLogs = useMemo(
    () => (activeProfile ? data.logs.filter(l => l.profileId === activeProfile.id) : []),
    [data.logs, activeProfile]
  );

  // Recordatorios: uno por peque, según su último registro.
  useEffect(() => {
    const checkReminders = () => {
      const { settings, logs, profiles } = dataRef.current;
      if (!settings.remindersEnabled) return;
      if (!("Notification" in window) || Notification.permission !== "granted") return;

      const now = Date.now();
      const intervalMs = settings.reminderIntervalMinutes * 60 * 1000;

      profiles.forEach(profile => {
        const lastLog = logs
          .filter(l => l.profileId === profile.id)
          .reduce((max, l) => Math.max(max, l.timestamp), 0);
        const lastEvent = Math.max(lastLog, profile.lastReminderSentAt, profile.createdAt);

        if (now - lastEvent >= intervalMs) {
          new Notification("¡Hora del baño! 🚽", {
            body: `Es momento de llevar a ${profile.name || 'tu peque'} al baño.`,
            icon: "favicon.svg"
          });
          handleUpdateProfile(profile.id, { lastReminderSentAt: Date.now() });
        }
      });
    };
    const intervalId = setInterval(checkReminders, 60000);
    return () => clearInterval(intervalId);
  }, []);

  const handleUpdateProfile = (id: string, patch: Partial<Profile>) => {
    setData(prev => ({
      ...prev,
      profiles: prev.profiles.map(p => (p.id === id ? { ...p, ...patch } : p))
    }));
  };

  const handleWizardComplete = (result: WizardResult) => {
    const newProfile: Profile = {
      id: generateId(),
      name: result.name,
      sex: result.sex,
      ageMonths: result.ageMonths,
      goal: result.goal,
      nightDiaper: result.nightDiaper,
      tellsNeed: result.tellsNeed,
      createdAt: Date.now(),
      lastReminderSentAt: 0,
    };

    setData(prev => {
      const caregivers = [...prev.caregivers];
      result.caregiverRoles.forEach(role => {
        const exists = caregivers.some(c => c.name === role || c.role === role);
        if (!exists) {
          const preset = CAREGIVER_PRESETS.find(p => p.role === role);
          caregivers.push({
            id: generateId(),
            name: role,
            role: preset?.role === 'Niñera' ? 'Cuidado externo' : 'Familia',
          });
        }
      });
      if (caregivers.length === 0) {
        caregivers.push({ id: generateId(), name: 'Cuidador', role: 'Principal' });
      }
      return {
        ...prev,
        profiles: [...prev.profiles, newProfile],
        activeProfileId: newProfile.id,
        caregivers,
      };
    });
    setAddingProfile(false);
    setActiveTab('track');
  };

  const handleSelectProfile = (id: string) => {
    setData(prev => ({ ...prev, activeProfileId: id }));
  };

  const handleDeleteProfile = () => {
    if (!activeProfile) return;
    const id = activeProfile.id;
    setData(prev => {
      const profiles = prev.profiles.filter(p => p.id !== id);
      return {
        ...prev,
        profiles,
        activeProfileId: profiles[0]?.id ?? null,
        logs: prev.logs.filter(l => l.profileId !== id),
      };
    });
    setActiveTab('track');
  };

  const handleAddLog = (logData: Omit<BathroomLog, 'id'>) => {
    const newLog: BathroomLog = { ...logData, id: generateId() };
    const totalAfter = dataRef.current.logs.length + 1;
    setData(prev => ({
      ...prev,
      logs: [newLog, ...prev.logs],
      profiles: prev.profiles.map(p =>
        p.id === logData.profileId ? { ...p, lastReminderSentAt: Date.now() } : p
      ),
      settings: { ...prev.settings, lastCaregiverId: logData.caregiverId },
    }));
    if (totalAfter % 10 === 0) setShowDonation(true);
  };

  const handleDeleteLog = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      logs: prev.logs.filter(l => l.id !== id)
    }));
  }, []);

  // Borra solo los registros del peque activo.
  const handleDeleteAllLogs = useCallback(() => {
    setData(prev => ({
      ...prev,
      logs: prev.logs.filter(l => l.profileId !== prev.activeProfileId)
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
          const existingProfileIds = new Set(prev.profiles.map(p => p.id));
          const newProfiles = imported.profiles.filter(p => !existingProfileIds.has(p.id));
          const existingLogIds = new Set(prev.logs.map(l => l.id));
          const newLogs = imported.logs.filter(l => !existingLogIds.has(l.id));
          const existingCaregiverIds = new Set(prev.caregivers.map(c => c.id));
          const newCaregivers = imported.caregivers.filter(c => !existingCaregiverIds.has(c.id));
          const profiles = [...prev.profiles, ...newProfiles];

          return {
            ...prev,
            profiles,
            activeProfileId: prev.activeProfileId ?? profiles[0]?.id ?? null,
            logs: [...newLogs, ...prev.logs].sort((a, b) => b.timestamp - a.timestamp),
            caregivers: [...prev.caregivers, ...newCaregivers],
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

  // Sin perfiles: wizard de bienvenida (primer uso o tras borrar el último).
  if (!activeProfile) {
    return (
      <ProfileWizard
        isFirst
        existingCaregivers={data.caregivers}
        onComplete={handleWizardComplete}
      />
    );
  }

  return (
    <>
      <Layout
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        title={activeTab === 'track' ? 'Registro' : activeTab === 'history' ? 'Historial' : activeTab === 'stats' ? 'Progreso' : activeTab === 'caregivers' ? 'Equipo' : 'Ajustes'}
        profiles={data.profiles}
        activeProfileId={activeProfile.id}
        onSelectProfile={handleSelectProfile}
        onAddProfile={() => setAddingProfile(true)}
      >
        {activeTab === 'track' && (
          <Tracker
            key={activeProfile.id}
            profile={activeProfile}
            caregivers={data.caregivers}
            logs={profileLogs}
            lastCaregiverId={data.settings.lastCaregiverId}
            onAddLog={handleAddLog}
          />
        )}
        {activeTab === 'history' && (
          <History
            logs={profileLogs}
            caregivers={data.caregivers}
            onDeleteLog={handleDeleteLog}
            onDeleteAll={handleDeleteAllLogs}
          />
        )}
        {activeTab === 'stats' && <Statistics logs={profileLogs} />}
        {activeTab === 'caregivers' && (
          <Caregivers caregivers={data.caregivers} onAdd={handleAddCaregiver} onUpdate={handleUpdateCaregiver} onDelete={handleDeleteCaregiver} />
        )}
        {activeTab === 'settings' && (
          <Settings
            key={activeProfile.id}
            profile={activeProfile}
            onUpdateProfile={(patch) => handleUpdateProfile(activeProfile.id, patch)}
            onDeleteProfile={data.profiles.length > 1 ? handleDeleteProfile : undefined}
            settings={data.settings}
            onUpdateSettings={handleUpdateSettings}
            onExport={handleExport}
            onImport={handleImport}
          />
        )}
      </Layout>

      {addingProfile && (
        <ProfileWizard
          isFirst={false}
          existingCaregivers={data.caregivers}
          onComplete={handleWizardComplete}
          onCancel={() => setAddingProfile(false)}
        />
      )}

      {showDonation && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] p-8 max-w-sm w-full shadow-2xl relative text-center space-y-5 animate-in zoom-in-95 duration-300">
            <button
              onClick={() => setShowDonation(false)}
              className="absolute top-6 right-6 p-2 text-slate-300 hover:text-slate-500 transition-colors"
            >
              <X size={24} />
            </button>
            <div className="inline-flex items-center justify-center w-24 h-24 bg-rose-500 text-white rounded-[32px] shadow-xl shadow-rose-200 animate-pulse">
              <Heart size={48} fill="currentColor" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-800">¿Te gusta Nappy?</h3>
              <p className="text-sm text-slate-500 leading-relaxed px-2">
                ¡Has completado <b>{data.logs.length}</b> registros! Tu apoyo nos ayuda a seguir mejorando esta herramienta gratuita para todos.
              </p>
            </div>
            <div className="space-y-3 pt-4">
              <a
                href="https://paypal.me/AbelG88"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-[#0070ba] hover:bg-[#005ea6] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-blue-100"
              >
                <CreditCard size={20} />
                PayPal
              </a>
              <a
                href="https://link.mercadopago.com.ar/abelg88"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-[#009ee3] hover:bg-[#008cc9] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-sky-100"
              >
                <CreditCard size={20} />
                Mercado Pago
              </a>
            </div>
            <button
              onClick={() => setShowDonation(false)}
              className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] pt-2 hover:text-slate-500 transition-colors"
            >
              Quizás más tarde
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default App;
