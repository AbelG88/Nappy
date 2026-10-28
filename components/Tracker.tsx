import React, { useMemo, useState } from 'react';
import { LogType, BathroomLog, Caregiver, Profile, Initiative } from '../types';
import { Check, Droplet, Ghost, Plus, X, MessageSquare, AlertCircle } from 'lucide-react';
import Chip from './Chip';
import Avatar from './Avatar';
import { formatAge } from '../constants';

interface TrackerProps {
  profile: Profile;
  caregivers: Caregiver[];
  /** Registros del perfil activo. */
  logs: BathroomLog[];
  lastCaregiverId?: string;
  onAddLog: (log: Omit<BathroomLog, 'id'>) => void;
}

type Outcome = 'success' | 'attempt' | 'accident';

const WHEN_OPTIONS: { minutes: number; label: string }[] = [
  { minutes: 0, label: 'Ahora' },
  { minutes: 15, label: 'Hace 15 min' },
  { minutes: 30, label: 'Hace 30 min' },
  { minutes: 60, label: 'Hace 1 h' },
];

const defaultType = (profile: Profile): LogType =>
  profile.goal === 'poop' ? LogType.POOP : LogType.PEE;

const timeAgo = (ts: number): string => {
  const mins = Math.max(0, Math.round((Date.now() - ts) / 60000));
  if (mins < 1) return 'recién';
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours} h`;
  return `hace ${Math.floor(hours / 24)} d`;
};

const Tracker: React.FC<TrackerProps> = ({ profile, caregivers, logs, lastCaregiverId, onAddLog }) => {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<LogType>(defaultType(profile));
  const [outcome, setOutcome] = useState<Outcome>('success');
  const [caregiverId, setCaregiverId] = useState('');
  const [initiative, setInitiative] = useState<Initiative | null>(null);
  const [whenMinutes, setWhenMinutes] = useState(0);
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [showSuccessMsg, setShowSuccessMsg] = useState(false);

  const today = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const todays = logs.filter(l => l.timestamp >= start.getTime());
    return { total: todays.length, success: todays.filter(l => l.success).length };
  }, [logs]);

  const lastLog = useMemo(
    () => logs.reduce((acc: BathroomLog | null, l: BathroomLog) => (!acc || l.timestamp > acc.timestamp ? l : acc), null),
    [logs]
  );

  const openSheet = () => {
    setType(defaultType(profile));
    setOutcome('success');
    const preferred = caregivers.find(c => c.id === lastCaregiverId) ?? caregivers[0];
    setCaregiverId(preferred?.id ?? '');
    setInitiative(null);
    setWhenMinutes(0);
    setNotes('');
    setShowNotes(false);
    setOpen(true);
  };

  const handleSave = () => {
    onAddLog({
      profileId: profile.id,
      timestamp: Date.now() - whenMinutes * 60000,
      type,
      success: outcome === 'success',
      ...(outcome === 'accident' ? { accident: true } : {}),
      ...(initiative ? { initiative } : {}),
      notes: notes.trim(),
      caregiverId,
    });
    setOpen(false);
    setShowSuccessMsg(true);
    setTimeout(() => setShowSuccessMsg(false), 2500);
  };

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-br from-blue-400 to-indigo-500 p-6 rounded-3xl text-white shadow-lg">
        <div className="flex items-center gap-4">
          <Avatar sex={profile.sex} size="lg" />
          <div className="min-w-0">
            <h2 className="text-2xl font-black truncate">{profile.name}</h2>
            <p className="text-blue-100 text-sm">{formatAge(profile.ageMonths)}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-5">
          <div className="bg-white/20 rounded-2xl p-3 text-center">
            <p className="text-2xl font-black">{today.success}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-50">Logrados hoy</p>
          </div>
          <div className="bg-white/20 rounded-2xl p-3 text-center">
            <p className="text-2xl font-black">{today.total}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-50">Intentos hoy</p>
          </div>
        </div>
      </div>

      <button
        onClick={openSheet}
        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-black text-lg py-5 rounded-3xl shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center justify-center gap-2"
      >
        <Plus size={24} /> Registrar intento
      </button>

      {lastLog && (
        <p className="text-center text-xs text-slate-400 font-medium">
          Último intento {timeAgo(lastLog.timestamp)}
        </p>
      )}

      {showSuccessMsg && (
        <div className="bg-green-100 text-green-700 p-4 rounded-2xl flex items-center gap-2 animate-bounce">
          <Check size={20} />
          <span className="font-bold">¡Registro guardado!</span>
        </div>
      )}

      <div className="bg-amber-50 border border-amber-100 p-4 rounded-3xl flex items-start gap-3">
        <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={20} />
        <div>
          <h4 className="text-amber-800 font-bold text-sm">Consejo del día</h4>
          <p className="text-amber-700 text-xs mt-1">
            Mantén la calma si hay accidentes. Es parte del aprendizaje. ¡Tú puedes!
          </p>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-[150] flex items-end justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setOpen(false)}>
          <div
            className="w-full max-w-md bg-white rounded-t-[32px] p-6 pb-8 max-h-[92vh] overflow-y-auto no-scrollbar space-y-5 animate-in slide-in-from-bottom-8 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar sex={profile.sex} size="sm" />
                <h3 className="text-lg font-black text-slate-800">Intento de {profile.name}</h3>
              </div>
              <button onClick={() => setOpen(false)} className="p-2 text-slate-300 active:text-slate-500" aria-label="Cerrar">
                <X size={22} />
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">¿Qué fue?</p>
              <div className="flex flex-wrap gap-2">
                <Chip selected={type === LogType.PEE} onClick={() => setType(LogType.PEE)}><Droplet size={16} /> Pis</Chip>
                <Chip selected={type === LogType.POOP} onClick={() => setType(LogType.POOP)}><Ghost size={16} /> Caca</Chip>
                <Chip selected={type === LogType.BOTH} onClick={() => setType(LogType.BOTH)}>
                  <span className="flex -space-x-1"><Droplet size={14} /><Ghost size={14} /></span> Ambos
                </Chip>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">¿Cómo salió?</p>
              <div className="flex flex-wrap gap-2">
                <Chip tone="green" selected={outcome === 'success'} onClick={() => setOutcome('success')}>✅ Logrado</Chip>
                <Chip tone="amber" selected={outcome === 'attempt'} onClick={() => setOutcome('attempt')}>🙂 No salió</Chip>
                <Chip tone="rose" selected={outcome === 'accident'} onClick={() => setOutcome('accident')}>💦 Accidente</Chip>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">¿Quién lo acompañó?</p>
              <div className="flex flex-wrap gap-2">
                {caregivers.map(c => (
                  <Chip key={c.id} selected={caregiverId === c.id} onClick={() => setCaregiverId(c.id)}>{c.name}</Chip>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">¿Quién tuvo la iniciativa?</p>
              <div className="flex flex-wrap gap-2">
                <Chip selected={initiative === 'asked'} onClick={() => setInitiative(initiative === 'asked' ? null : 'asked')}>🗣️ Avisó solo</Chip>
                <Chip selected={initiative === 'taken'} onClick={() => setInitiative(initiative === 'taken' ? null : 'taken')}>🚶 Lo llevamos</Chip>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">¿Cuándo?</p>
              <div className="flex flex-wrap gap-2">
                {WHEN_OPTIONS.map(o => (
                  <Chip key={o.minutes} selected={whenMinutes === o.minutes} onClick={() => setWhenMinutes(o.minutes)}>{o.label}</Chip>
                ))}
              </div>
            </div>

            {showNotes ? (
              <textarea
                autoFocus
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej: Tenía muchas ganas, casi llega..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                rows={2}
              />
            ) : (
              <button
                type="button"
                onClick={() => setShowNotes(true)}
                className="flex items-center gap-2 text-sm font-bold text-slate-400 active:text-slate-600"
              >
                <MessageSquare size={16} /> Agregar observación
              </button>
            )}

            <button
              onClick={handleSave}
              disabled={!caregiverId}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-200 transition-all active:scale-95"
            >
              Guardar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tracker;
