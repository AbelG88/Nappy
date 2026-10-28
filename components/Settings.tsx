import React, { useState, useRef, useEffect } from 'react';
import { BathroomLog, Caregiver, Profile } from '../types';
import { Download, Upload, Bell, Info, Share2, Heart, Baby, CreditCard, Github, Trash2, FileText } from 'lucide-react';
import ReminderSettings from './ReminderSettings';
import { AGE_OPTIONS, GOAL_OPTIONS, SEX_OPTIONS, TELLS_OPTIONS } from '../constants';
import { PERIOD_OPTIONS, ReportPeriod, buildReport, deliverPdf, filterByPeriod, reportFilename } from '../services/report';
import Chip from './Chip';

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
}

const Settings: React.FC<SettingsProps> = ({ profile, logs, caregivers, onUpdateProfile, onDeleteProfile, onExport, onImport }) => {
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
          <label className="block text-xs font-bold text-slate-400 uppercase mb-3">Edad</label>
          <div className="flex flex-wrap gap-2">
            {AGE_OPTIONS.map(o => (
              <Chip key={o.months} selected={profile.ageMonths === o.months} onClick={() => onUpdateProfile({ ageMonths: o.months })}>
                {o.label}
              </Chip>
            ))}
          </div>
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
          <Share2 size={18} className="text-blue-500" /> Datos y Sincronización
        </h3>
        
        {!pendingFile ? (
          <>
            <p className="text-xs text-slate-500 leading-relaxed">
              Nappy no usa la nube: los registros viven en este celular. Exportar e importar sirve para dos cosas:
            </p>
            <ul className="text-xs text-slate-500 leading-relaxed space-y-2">
              <li className="flex gap-2">
                <span className="shrink-0">💾</span>
                <span><b className="text-slate-600">Tener un respaldo</b> por si cambiás de celular o se borra la app.</span>
              </li>
              <li className="flex gap-2">
                <span className="shrink-0">🤝</span>
                <span>
                  <b className="text-slate-600">Compartir el historial con otros cuidadores.</b> Exportá y mandales tu archivo (por WhatsApp, por ejemplo): al importarlo, tus intentos se suman a los suyos sin borrar nada. Y al revés: pedile su respaldo a cada cuidador e importalo acá para tener todo junto. Si alguien instala Nappy por primera vez, puede importar tu archivo desde la pantalla de bienvenida.
                </span>
              </li>
            </ul>
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

      <div className="flex flex-col items-center justify-center gap-3 text-slate-300 py-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Info size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Versión 1.1.0</span>
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
      </div>
    </div>
  );
};

export default Settings;