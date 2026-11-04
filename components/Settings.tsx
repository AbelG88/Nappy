import React, { useState, useRef, useEffect } from 'react';
import { BathroomLog, Caregiver, Profile } from '../types';
import { Download, Upload, Bell, Database, Info, Share2, Heart, Baby, CreditCard, Github, Trash2, FileText, ShieldCheck, Lock } from 'lucide-react';
import ReminderSettings from './ReminderSettings';
import { APP_VERSION, GOAL_OPTIONS, SEX_OPTIONS, TELLS_OPTIONS, ageInMonths, formatAge, isValidBirthDate, profileAgeMonths, todayISO } from '../constants';
import { PERIOD_OPTIONS, ReportPeriod, buildReport, deliverPdf, filterByPeriod, reportFilename } from '../services/report';
import Chip from './Chip';
import SecretInput from './SecretInput';
import DonationLinks from './DonationLinks';
import ContactForm from './ContactForm';
import LegalViewer from './LegalViewer';
import { LegalDocId } from '../services/legal';
import { AUTOLOCK_OPTIONS } from '../services/vault';
import { BackupReminder } from '../types';
import { BACKUP_FREQUENCIES, isValidEmail } from '../services/backupReminder';

interface SettingsProps {
  profile: Profile;
  /** Registros del perfil activo (para el informe). */
  logs: BathroomLog[];
  caregivers: Caregiver[];
  onUpdateProfile: (patch: Partial<Profile>) => void;
  /** Solo se puede eliminar un perfil si hay más de uno. */
  onDeleteProfile?: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  /** Último backup cifrado (ms), si hubo. */
  lastBackupAt?: number;
  backupReminder: BackupReminder;
  onBackupReminderChange: (patch: Partial<BackupReminder>) => void;
  backupEmail?: string;
  onBackupEmailChange: (email: string) => void;
  onBackup: () => void;
  /** Devuelve un mensaje de error o null si el PIN se cambió. */
  onChangePin: (current: string, next: string) => Promise<string | null>;
  onLock: () => void;
  autoLockMinutes: number;
  onAutoLockChange: (minutes: number) => void;
}

const Settings: React.FC<SettingsProps> = ({
  profile, logs, caregivers, onUpdateProfile, onDeleteProfile, onExport, onImport,
  lastBackupAt, backupReminder, onBackupReminderChange, backupEmail, onBackupEmailChange,
  onBackup, onChangePin, onLock, autoLockMinutes, onAutoLockChange,
}) => {
  const [legalDoc, setLegalDoc] = useState<LegalDocId | null>(null);
  const [emailDraft, setEmailDraft] = useState(backupEmail ?? '');
  const emailInvalid = emailDraft.trim() !== '' && !isValidEmail(emailDraft);
  const [changingPin, setChangingPin] = useState(false);
  const [curPin, setCurPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [newPin2, setNewPin2] = useState('');
  const [pinMsg, setPinMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pinBusy, setPinBusy] = useState(false);

  const submitChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin !== newPin2) return setPinMsg({ ok: false, text: 'El PIN nuevo no coincide en las dos casillas.' });
    setPinBusy(true);
    setPinMsg(null);
    try {
      const problem = await onChangePin(curPin, newPin);
      if (problem) {
        setPinMsg({ ok: false, text: problem });
      } else {
        setPinMsg({ ok: true, text: 'Listo: el PIN se cambió. Si tenés backups viejos, siguen abriéndose con su propia contraseña.' });
        setChangingPin(false);
        setCurPin(''); setNewPin(''); setNewPin2('');
      }
    } catch {
      setPinMsg({ ok: false, text: 'No se pudo cambiar el PIN. Probá de nuevo.' });
    } finally {
      setPinBusy(false);
    }
  };

  const backupLabel = lastBackupAt
    ? `Último backup: ${new Date(lastBackupAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}`
    : 'Todavía no hiciste ningún backup';

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>('month');
  const [reportBusy, setReportBusy] = useState(false);
  const [reportError, setReportError] = useState('');
  const reportCount = filterByPeriod(logs, reportPeriod).length;

  // Precarga las librerías del PDF para que el botón responda rápido (y siga valiendo el gesto del toque al compartir).
  useEffect(() => {
    import('jspdf');
    import('jspdf-autotable');
  }, []);

  const handleExportReport = async () => {
    setReportBusy(true);
    setReportError('');
    try {
      const blob = await buildReport(profile, logs, caregivers, reportPeriod);
      await deliverPdf(blob, reportFilename(profile));
    } catch (e) {
      console.error('No se pudo generar el informe', e);
      setReportError('No se pudo generar el informe. Probá de nuevo.');
    } finally {
      setReportBusy(false);
    }
  };
  const [confirmingDeleteProfile, setConfirmingDeleteProfile] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

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

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-6">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <Baby size={18} className="text-blue-500" /> Perfil de {profile.name}
        </h3>
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-3">Nombre</label>
          <input
            type="text"
            value={profile.name}
            onChange={(e) => onUpdateProfile({ name: e.target.value })}
            placeholder="Ej: Mateo, Sofía..."
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-700 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-3">Nena o nene</label>
          <div className="flex gap-2">
            {SEX_OPTIONS.map(o => (
              <Chip key={o.value} selected={profile.sex === o.value} onClick={() => onUpdateProfile({ sex: o.value })}>
                {o.emoji} {o.label}
              </Chip>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-3">Fecha de nacimiento</label>
          <input
            type="date"
            value={profile.birthDate ?? ''}
            max={todayISO()}
            onChange={(e) => {
              const v = e.target.value;
              if (isValidBirthDate(v)) onUpdateProfile({ birthDate: v, ageMonths: ageInMonths(v) ?? profile.ageMonths });
            }}
            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-3 text-sm font-bold text-slate-700 focus:border-blue-500 outline-none transition-all"
          />
          <p className="text-[11px] text-slate-400 mt-2">
            {profile.birthDate
              ? `Edad actual: ${formatAge(profileAgeMonths(profile))}. Se actualiza sola con los cumpleaños.`
              : `Edad cargada: ${formatAge(profile.ageMonths)}. Cargá la fecha de nacimiento y la edad se calcula sola.`}
          </p>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-3">Objetivo</label>
          <div className="flex flex-wrap gap-2">
            {GOAL_OPTIONS.map(o => (
              <Chip key={o.value} selected={profile.goal === o.value} onClick={() => onUpdateProfile({ goal: o.value })}>
                {o.emoji} {o.label}
              </Chip>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-3">Pañal para dormir</label>
          <div className="flex gap-2">
            <Chip selected={profile.nightDiaper} onClick={() => onUpdateProfile({ nightDiaper: true })}>Sí</Chip>
            <Chip selected={!profile.nightDiaper} onClick={() => onUpdateProfile({ nightDiaper: false })}>No</Chip>
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-3">Avisa cuando tiene ganas</label>
          <div className="flex flex-wrap gap-2">
            {TELLS_OPTIONS.map(o => (
              <Chip key={o.value} selected={profile.tellsNeed === o.value} onClick={() => onUpdateProfile({ tellsNeed: o.value })}>
                {o.label}
              </Chip>
            ))}
          </div>
        </div>
        {onDeleteProfile && (
          !confirmingDeleteProfile ? (
            <button
              onClick={() => setConfirmingDeleteProfile(true)}
              className="flex items-center gap-2 text-xs font-bold text-rose-400 active:text-rose-600"
            >
              <Trash2 size={14} /> Eliminar este perfil
            </button>
          ) : (
            <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl space-y-3">
              <p className="text-xs text-rose-700 font-bold">
                Se borra el perfil de {profile.name} y todos sus registros. No se puede deshacer.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmingDeleteProfile(false)}
                  className="flex-1 bg-white text-slate-400 font-bold py-3 rounded-xl border border-slate-200 text-xs"
                >
                  CANCELAR
                </button>
                <button
                  onClick={() => { setConfirmingDeleteProfile(false); onDeleteProfile(); }}
                  className="flex-1 bg-rose-600 text-white font-black py-3 rounded-xl text-xs active:scale-95 transition-transform"
                >
                  SÍ, ELIMINAR
                </button>
              </div>
            </div>
          )
        )}
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-6">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <Bell size={18} className="text-blue-500" /> Recordatorios de {profile.name}
        </h3>

        <ReminderSettings
          value={profile.reminders}
          onChange={(reminders) => onUpdateProfile({ reminders })}
          childName={profile.name}
        />
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-6">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <Database size={18} className="text-blue-500" /> Datos y backup
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Nappy no usa la nube: los registros viven en este celular. El backup cifrado (.nappy) es tu red de seguridad por si cambiás de celular, se borra la app o olvidás el PIN.
        </p>

        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3">
          <p className={`text-[11px] font-bold ${lastBackupAt ? 'text-slate-500' : 'text-amber-600'}`}>{backupLabel}</p>
          <button
            onClick={onBackup}
            className="w-full bg-blue-600 text-white font-black py-3.5 rounded-2xl text-sm shadow-md shadow-blue-100 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Download size={18} /> Crear backup cifrado
          </button>
        </div>

        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3">
          <label className="flex items-center justify-between gap-3 cursor-pointer">
            <span className="text-xs font-bold text-slate-600">Recordarme hacer el backup</span>
            <input
              type="checkbox"
              checked={backupReminder.enabled}
              onChange={e => onBackupReminderChange({ enabled: e.target.checked })}
              className="w-5 h-5 accent-blue-600"
            />
          </label>
          {backupReminder.enabled && (
            <div className="flex flex-wrap gap-2">
              {BACKUP_FREQUENCIES.map(f => (
                <button
                  key={f.value}
                  onClick={() => onBackupReminderChange({ frequency: f.value })}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                    backupReminder.frequency === f.value ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}
          <label className="block space-y-1.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mi correo para el backup (opcional)</span>
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              value={emailDraft}
              onChange={e => setEmailDraft(e.target.value)}
              onBlur={() => { if (!emailInvalid) onBackupEmailChange(emailDraft); }}
              placeholder="tu@correo.com"
              className="w-full bg-white border-2 border-slate-100 focus:border-blue-400 outline-none rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 transition-colors"
            />
            {emailInvalid && <span className="text-[11px] font-bold text-rose-500">Ese correo no parece válido.</span>}
          </label>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Al crear el backup, la hoja de compartir del celular te deja mandarlo por correo, Drive o WhatsApp. Con tu correo cargado, después aparece un botón para abrir el mail ya armado; el archivo lo adjuntás vos.
          </p>
        </div>

        <div className="border-t border-slate-100" />

        {!pendingFile ? (
          <>
            <div className="space-y-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Share2 size={12} /> Compartir historial con otros cuidadores
              </p>
              <p className="text-xs text-slate-500 leading-relaxed">
                Exportá y mandales tu archivo (por WhatsApp, por ejemplo): al importarlo, tus intentos se suman a los suyos sin borrar nada. Y al revés: pedile su respaldo a cada cuidador e importalo acá para tener todo junto. Si alguien instala Nappy por primera vez, puede importar tu archivo desde la pantalla de bienvenida. <b className="text-amber-600">Ojo: este archivo de historial no va cifrado</b>, mandalo solo a personas de confianza.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={onExport}
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 border border-slate-100 text-slate-600 active:bg-blue-50 active:text-blue-600 transition-all gap-2"
              >
                <Download size={24} className="text-blue-500" />
                <span className="text-xs font-bold uppercase">Compartir historial</span>
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
                  accept=".json,.nappy" 
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

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-5">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <ShieldCheck size={18} className="text-blue-500" /> Seguridad
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Tus datos están cifrados en este celular con tu PIN. Si lo olvidás y no tenés un backup, no se pueden recuperar.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onLock}
            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 border border-slate-100 text-slate-600 active:bg-blue-50 transition-all gap-2"
          >
            <Lock size={22} className="text-blue-500" />
            <span className="text-xs font-bold uppercase">Bloquear ahora</span>
          </button>
          <button
            onClick={() => { setChangingPin(c => !c); setPinMsg(null); }}
            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 border border-slate-100 text-slate-600 active:bg-indigo-50 transition-all gap-2"
          >
            <ShieldCheck size={22} className="text-indigo-500" />
            <span className="text-xs font-bold uppercase">Cambiar PIN</span>
          </button>
        </div>

        {changingPin && (
          <form onSubmit={submitChangePin} className="space-y-3 bg-blue-50 border-2 border-dashed border-blue-200 rounded-2xl p-4">
            <SecretInput label="PIN actual" value={curPin} onChange={setCurPin} passphrase autoComplete="current-password" />
            <SecretInput label="PIN o contraseña nuevos (mín. 6)" value={newPin} onChange={setNewPin} passphrase autoComplete="new-password" />
            <SecretInput label="Repetí el nuevo" value={newPin2} onChange={setNewPin2} passphrase autoComplete="new-password" />
            <button
              type="submit"
              disabled={pinBusy || !curPin || !newPin || !newPin2}
              className="w-full bg-blue-600 disabled:opacity-50 text-white font-black py-3 rounded-xl text-xs active:scale-95 transition-all"
            >
              {pinBusy ? 'CAMBIANDO…' : 'CAMBIAR PIN'}
            </button>
          </form>
        )}
        {pinMsg && (
          <p className={`text-xs font-bold ${pinMsg.ok ? 'text-emerald-600' : 'text-rose-500'}`}>{pinMsg.text}</p>
        )}

        <div className="space-y-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pedir PIN al volver a la app</p>
          <div className="flex flex-wrap gap-2">
            {AUTOLOCK_OPTIONS.map(m => (
              <button
                key={m}
                onClick={() => onAutoLockChange(m)}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                  autoLockMinutes === m ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200'
                }`}
              >
                {m === 0 ? 'Nunca' : `${m} min`}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <FileText size={18} className="text-blue-500" /> Informe para profesionales
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Genera un PDF de {profile.name} con resumen, evolución por día, franjas horarias y el detalle de cada intento, para mostrarle al pediatra o a otro profesional.
        </p>
        <div className="flex flex-wrap gap-2">
          {PERIOD_OPTIONS.map(o => (
            <Chip key={o.value} selected={reportPeriod === o.value} onClick={() => setReportPeriod(o.value)}>
              {o.label}
            </Chip>
          ))}
        </div>
        <button
          onClick={handleExportReport}
          disabled={reportBusy || reportCount === 0}
          className="w-full bg-blue-500 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-100 disabled:shadow-none transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <FileText size={18} />
          {reportBusy ? 'Generando...' : 'Exportar informe en PDF'}
        </button>
        {reportCount === 0 && (
          <p className="text-[11px] text-slate-400 text-center">Todavía no hay registros en este período.</p>
        )}
        {reportError && <p className="text-[11px] text-rose-500 text-center">{reportError}</p>}
      </div>

      <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-200 space-y-4">
        <div className="flex items-center gap-3">
           <Heart className="text-rose-500 fill-rose-500" size={24} />
           <h3 className="font-bold text-lg text-slate-800">Apoya Nappy</h3>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          Nappy es una herramienta gratuita. Si te ayuda en el día a día, considera realizar una donación para mantener el proyecto vivo.
        </p>
        <div className="pt-2">
          <DonationLinks />
        </div>
      </div>

      <ContactForm />

      <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-200 space-y-3">
        <div className="flex items-center gap-3">
          <ShieldCheck className="text-blue-500" size={24} />
          <h3 className="font-bold text-lg text-slate-800">Legal</h3>
        </div>
        {([['terms', 'Términos y Condiciones'], ['privacy', 'Política de Privacidad'], ['medical', 'Aviso médico']] as [LegalDocId, string][]).map(([id, label]) => (
          <button key={id} onClick={() => setLegalDoc(id)} className="w-full text-left bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 active:scale-[0.98] transition-transform">
            {label}
          </button>
        ))}
        <a href="./third-party-licenses.txt" target="_blank" rel="noopener noreferrer" className="block bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700">
          Licencias de terceros
        </a>
        <a href="https://github.com/AbelG88/Nappy/blob/main/LICENSE" target="_blank" rel="noopener noreferrer" className="block bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700">
          Licencia de Nappy (MIT)
        </a>
      </div>
      {legalDoc && <LegalViewer doc={legalDoc} onClose={() => setLegalDoc(null)} />}

      <div className="flex flex-col items-center justify-center gap-3 text-slate-300 py-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Info size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Versión {APP_VERSION}</span>
          </div>
          <a 
            href="https://github.com/AbelG88/Nappy" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-slate-500 transition-colors"
          >
            <Github size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Código</span>
          </a>
        </div>
        <p className="text-[9px] text-slate-300 font-medium">Hecho con ❤️ para familias en movimiento</p>
        <p className="text-[9px] text-slate-300 font-medium">© 2026 Abel García · MIT</p>
      </div>
    </div>
  );
};

export default Settings;