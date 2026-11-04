import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Layout from './components/Layout';
import Tracker from './components/Tracker';
import History from './components/History';
import Statistics from './components/Statistics';
import Caregivers from './components/Caregivers';
import Settings from './components/Settings';
import ProfileWizard, { WizardResult } from './components/ProfileWizard';
import LockScreen, { LockMode } from './components/LockScreen';
import BackupDialog from './components/BackupDialog';
import PasswordPrompt from './components/PasswordPrompt';
import { storageService, mergeData } from './services/storage';
import { EncryptedBlob, WrongSecretError, validateSecret } from './services/crypto';
import {
  changePin,
  getAutoLockMinutes,
  hasPlainData,
  requestPersistentStorage,
  saveVault,
  setAutoLockMinutes,
  setSecretKind,
  vaultExists,
  verifyPin,
} from './services/vault';
import { AppData, BathroomLog, Caregiver, Profile } from './types';
import { dueEvents, intervalDue, todayKey } from './services/reminders';
import { notificationPermission, notify } from './services/notifications';
import { CAREGIVER_PRESETS } from './constants';
import { Heart, X, CreditCard } from 'lucide-react';

const generateId = () => Math.random().toString(36).substring(2, 15) + Date.now().toString(36);

const MainApp: React.FC<{ initialData: AppData }> = ({ initialData }) => {
  const [data, setData] = useState<AppData>(initialData);
  const [locked, setLocked] = useState(false);
  const [autoLock, setAutoLock] = useState<number>(getAutoLockMinutes());
  const [showBackup, setShowBackup] = useState(false);
  const [pendingEncrypted, setPendingEncrypted] = useState<EncryptedBlob | null>(null);
  const [activeTab, setActiveTab] = useState('track');
  const [showDonation, setShowDonation] = useState(false);
  const [addingProfile, setAddingProfile] = useState(false);

  const dataRef = useRef(data);
  useEffect(() => { dataRef.current = data; }, [data]);

  // Guardado cifrado con una pequeña espera, así varios cambios seguidos se guardan juntos.
  useEffect(() => {
    const t = setTimeout(() => { saveVault(data); }, 300);
    return () => clearTimeout(t);
  }, [data]);

  // Pide al navegador que no borre los datos de Nappy si falta espacio.
  useEffect(() => { requestPersistentStorage(); }, []);

  // Al pasar a segundo plano se guarda en el momento; al volver, si pasó mucho tiempo, se pide el PIN.
  // La pantalla de bloqueo va por encima y la app sigue viva debajo, así los recordatorios siguen funcionando.
  const hiddenAt = useRef<number | null>(null);
  const autoLockRef = useRef(autoLock);
  useEffect(() => { autoLockRef.current = autoLock; }, [autoLock]);
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAt.current = Date.now();
        saveVault(dataRef.current);
      } else {
        const mins = autoLockRef.current;
        if (hiddenAt.current && mins > 0 && Date.now() - hiddenAt.current >= mins * 60000) setLocked(true);
        hiddenAt.current = null;
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  const activeProfile: Profile | undefined =
    data.profiles.find(p => p.id === data.activeProfileId) ?? data.profiles[0];

  const profileLogs = useMemo(
    () => (activeProfile ? data.logs.filter(l => l.profileId === activeProfile.id) : []),
    [data.logs, activeProfile]
  );

  // Recordatorios por peque: a la hora pactada de cada momento del día, o cada cierto tiempo.
  useEffect(() => {
    const checkReminders = () => {
      if (notificationPermission() !== 'granted') return;
      const { logs, profiles } = dataRef.current;
      const now = Date.now();

      profiles.forEach(profile => {
        const r = profile.reminders;
        if (!r?.enabled) return;
        const name = profile.name || 'tu peque';

        if (r.format === 'events') {
          const due = dueEvents(r, now);
          if (due.length === 0) return;
          const today = todayKey(now);
          due.forEach(ev =>
            notify('¡Hora del baño! 🚽', `${ev.label}: es momento de llevar a ${name} al baño.`, `${profile.id}-${ev.id}`)
          );
          handleUpdateProfile(profile.id, {
            reminders: { ...r, firedOn: { ...r.firedOn, ...Object.fromEntries(due.map(e => [e.id, today])) } },
          });
        } else if (intervalDue(profile, logs, now)) {
          notify('¡Hora del baño! 🚽', `Es momento de llevar a ${name} al baño.`, `${profile.id}-interval`);
          handleUpdateProfile(profile.id, { lastReminderSentAt: now });
        }
      });
    };

    // Al volver a abrir la app también se revisa, por si el celular durmió el temporizador.
    const onVisible = () => { if (document.visibilityState === 'visible') checkReminders(); };
    checkReminders();
    const intervalId = setInterval(checkReminders, 30000);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisible);
    };
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
      reminders: result.reminders,
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

  const handleExport = () => { storageService.exportData(data); };

  const handleBackup = async (password: string): Promise<boolean> => {
    const delivered = await storageService.exportEncryptedBackup(dataRef.current, password);
    if (delivered) {
      setData(prev => ({ ...prev, settings: { ...prev.settings, lastBackupAt: Date.now() } }));
    }
    return delivered;
  };

  const handleChangePin = async (current: string, next: string): Promise<string | null> => {
    const problem = validateSecret(next);
    if (problem) return problem;
    if (!(await verifyPin(current))) return 'El PIN actual no es correcto.';
    await changePin(next, dataRef.current);
    setSecretKind(/^\d+$/.test(next) ? 'pin' : 'text');
    return null;
  };

  const handleAutoLockChange = (minutes: number) => {
    setAutoLockMinutes(minutes);
    setAutoLock(minutes);
  };

  const mergeImported = (imported: AppData) => {
    const { data: merged, addedLogs, addedProfiles } = mergeData(dataRef.current, imported);
    setData(merged);
    const parts = [`${addedLogs} ${addedLogs === 1 ? 'registro nuevo' : 'registros nuevos'}`];
    if (addedProfiles > 0) parts.push(`${addedProfiles} ${addedProfiles === 1 ? 'perfil nuevo' : 'perfiles nuevos'}`);
    alert(`¡Listo! Se sumaron ${parts.join(' y ')}.`);
  };

  const handleImport = async (file: File) => {
    try {
      const res = await storageService.importData(file);
      if (!res) {
        alert('El archivo no es un respaldo válido de Nappy.');
      } else if (res.kind === 'encrypted') {
        setPendingEncrypted(res.blob);
      } else {
        mergeImported(res.data);
      }
    } catch (e) {
      alert('Error al importar el archivo.');
    }
  };

  const openEncryptedImport = async (password: string): Promise<string | null> => {
    if (!pendingEncrypted) return null;
    try {
      const imported = await storageService.openEncryptedBackup(pendingEncrypted, password);
      if (!imported) return 'El backup no tiene un formato válido.';
      setPendingEncrypted(null);
      mergeImported(imported);
      return null;
    } catch (e) {
      return e instanceof WrongSecretError ? 'Contraseña incorrecta.' : 'No se pudo abrir el backup.';
    }
  };

  const overlays = (
    <>
      {locked && (
        <div className="fixed inset-0 z-[300] overflow-y-auto bg-blue-50">
          <LockScreen
            mode="unlock"
            onUnlocked={(restoredData, source) => {
              // Si se restauró un backup o se empezó de cero, esos datos reemplazan a los de pantalla.
              if (source !== 'unlock') setData(restoredData);
              setLocked(false);
            }}
          />
        </div>
      )}
      {pendingEncrypted && (
        <PasswordPrompt
          title="Backup cifrado"
          description="Ingresá la contraseña de ese backup para sumar sus datos a los tuyos."
          onSubmit={openEncryptedImport}
          onCancel={() => setPendingEncrypted(null)}
        />
      )}
    </>
  );

  // Sin perfiles: wizard de bienvenida (primer uso o tras borrar el último).
  if (!activeProfile) {
    return (
      <>
        <ProfileWizard
          isFirst
          existingCaregivers={data.caregivers}
          onComplete={handleWizardComplete}
          onImport={handleImport}
        />
        {overlays}
      </>
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
            logs={profileLogs}
            caregivers={data.caregivers}
            onUpdateProfile={(patch) => handleUpdateProfile(activeProfile.id, patch)}
            onDeleteProfile={data.profiles.length > 1 ? handleDeleteProfile : undefined}
            onExport={handleExport}
            onImport={handleImport}
            lastBackupAt={data.settings.lastBackupAt}
            onBackup={() => setShowBackup(true)}
            onChangePin={handleChangePin}
            onLock={() => setLocked(true)}
            autoLockMinutes={autoLock}
            onAutoLockChange={handleAutoLockChange}
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

      {!data.settings.backupNoticeAck && (
        <BackupDialog
          notice
          onExport={handleBackup}
          onClose={() => {}}
          onAcknowledge={() => setData(prev => ({ ...prev, settings: { ...prev.settings, backupNoticeAck: true } }))}
        />
      )}

      {showBackup && data.settings.backupNoticeAck && (
        <BackupDialog onExport={handleBackup} onClose={() => setShowBackup(false)} />
      )}

      {overlays}

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

type Gate = { kind: LockMode } | { kind: 'ready'; data: AppData };

const App: React.FC = () => {
  const [gate, setGate] = useState<Gate>(() =>
    vaultExists() ? { kind: 'unlock' } : hasPlainData() ? { kind: 'migrate' } : { kind: 'setup' }
  );

  if (gate.kind !== 'ready') {
    return <LockScreen mode={gate.kind} onUnlocked={data => setGate({ kind: 'ready', data })} />;
  }
  return <MainApp initialData={gate.data} />;
};

export default App;
