import React, { useState } from 'react';
import { Plus, ShieldAlert, Trash2, Send } from 'lucide-react';
import { ReminderEvent, ReminderFormat, Reminders } from '../types';
import { INTERVAL_OPTIONS, sortEvents } from '../services/reminders';
import { notify, notificationPermission, requestNotificationPermission } from '../services/notifications';
import Chip from './Chip';

interface ReminderSettingsProps {
  value: Reminders;
  onChange: (next: Reminders) => void;
  childName: string;
}

const newId = () => `ev-${Math.random().toString(36).slice(2, 8)}`;

const Switch: React.FC<{ on: boolean; onClick: () => void; label: string }> = ({ on, onClick, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={on}
    aria-label={label}
    onClick={onClick}
    className={`w-12 h-7 rounded-full p-1 transition-colors shrink-0 ${on ? 'bg-blue-500' : 'bg-slate-200'}`}
  >
    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${on ? 'translate-x-5' : 'translate-x-0'}`} />
  </button>
);

const ReminderSettings: React.FC<ReminderSettingsProps> = ({ value, onChange, childName }) => {
  const [permission, setPermission] = useState(notificationPermission());
  const [message, setMessage] = useState('');
  const [testing, setTesting] = useState(false);

  const askPermission = async (): Promise<boolean> => {
    const result = await requestNotificationPermission();
    setPermission(result);
    if (result === 'granted') {
      setMessage('');
      return true;
    }
    setMessage(
      result === 'unsupported'
        ? 'Este navegador no permite notificaciones.'
        : 'Las notificaciones están bloqueadas. Activalas desde los ajustes del navegador o de la app para este sitio.'
    );
    return false;
  };

  const handleYes = async () => {
    if (await askPermission()) onChange({ ...value, enabled: true });
  };

  const handleNo = () => {
    setMessage('');
    onChange({ ...value, enabled: false });
  };

  const setFormat = (format: ReminderFormat) => onChange({ ...value, format });

  const updateEvent = (id: string, patch: Partial<ReminderEvent>) => {
    const firedOn = { ...value.firedOn };
    if (patch.time !== undefined || patch.enabled === true) delete firedOn[id]; // si cambia la hora, vuelve a avisar hoy
    onChange({ ...value, firedOn, events: value.events.map(e => (e.id === id ? { ...e, ...patch } : e)) });
  };

  const addEvent = () =>
    onChange({
      ...value,
      events: [...value.events, { id: newId(), label: 'Otro aviso', time: '12:00', enabled: true, custom: true }],
    });

  const removeEvent = (id: string) => onChange({ ...value, events: value.events.filter(e => e.id !== id) });

  const sendTest = async () => {
    setTesting(true);
    await notify('¡Hora del baño! 🚽', `Así va a verse el aviso para ${childName || 'tu peque'}.`, 'nappy-test');
    setTesting(false);
  };

  const needsPermission = value.enabled && permission !== 'granted';

  return (
    <div className="space-y-5 text-left">
      <div className="space-y-3">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">¿Querés recordatorios?</p>
        <div className="flex gap-2">
          <Chip tone="green" selected={value.enabled} onClick={handleYes}>Sí</Chip>
          <Chip selected={!value.enabled} onClick={handleNo}>No</Chip>
        </div>
      </div>

      {message && (
        <div className="bg-rose-50 p-4 rounded-2xl flex items-start gap-3 border border-rose-100">
          <ShieldAlert className="text-rose-500 shrink-0 mt-0.5" size={18} />
          <p className="text-xs text-rose-700 font-medium leading-relaxed">{message}</p>
        </div>
      )}

      {needsPermission && !message && (
        <div className="bg-amber-50 p-4 rounded-2xl space-y-3 border border-amber-100">
          <p className="text-xs text-amber-800 font-medium leading-relaxed">
            Falta el permiso de notificaciones en este celular para que los avisos suenen.
          </p>
          <button
            type="button"
            onClick={askPermission}
            className="bg-amber-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl active:scale-95 transition-transform"
          >
            Dar permiso
          </button>
        </div>
      )}

      {value.enabled && (
        <>
          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">¿Cómo querés los avisos?</p>
            <div className="flex flex-wrap gap-2">
              <Chip selected={value.format === 'events'} onClick={() => setFormat('events')}>🕒 Por horarios</Chip>
              <Chip selected={value.format === 'interval'} onClick={() => setFormat('interval')}>🔁 Cada tanto tiempo</Chip>
            </div>
          </div>

          {value.format === 'events' ? (
            <div className="space-y-3">
              <p className="text-xs text-slate-400 leading-relaxed">
                Suena a la hora que pongas, pensada para después de cada momento del día. Tocá una hora para cambiarla.
              </p>
              <div className="space-y-2">
                {sortEvents(value.events).map(e => (
                  <div key={e.id} className={`flex items-center gap-3 p-3 rounded-2xl border ${e.enabled ? 'bg-white border-slate-100' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                    <Switch on={e.enabled} onClick={() => updateEvent(e.id, { enabled: !e.enabled })} label={`Aviso: ${e.label}`} />
                    {e.custom ? (
                      <input
                        value={e.label}
                        onChange={(ev) => updateEvent(e.id, { label: ev.target.value })}
                        aria-label="Nombre del aviso"
                        className="flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <span className="flex-1 min-w-0 text-sm font-bold text-slate-700 leading-tight">{e.label}</span>
                    )}
                    <input
                      type="time"
                      value={e.time}
                      onChange={(ev) => ev.target.value && updateEvent(e.id, { time: ev.target.value })}
                      aria-label={`Hora de ${e.label}`}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {e.custom && (
                      <button type="button" onClick={() => removeEvent(e.id)} className="p-1 text-slate-300 active:text-rose-500" aria-label="Quitar aviso">
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addEvent}
                className="flex items-center gap-2 text-sm font-bold text-blue-600 active:text-blue-800"
              >
                <Plus size={16} /> Agregar horario
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-slate-400 leading-relaxed">
                Avisa si pasó este tiempo desde el último registro o aviso.
              </p>
              <div className="flex flex-wrap gap-2">
                {INTERVAL_OPTIONS.map(o => (
                  <Chip key={o.minutes} selected={value.intervalMinutes === o.minutes} onClick={() => onChange({ ...value, intervalMinutes: o.minutes })}>
                    {o.label}
                  </Chip>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <button
              type="button"
              onClick={sendTest}
              disabled={testing || permission !== 'granted'}
              className="flex items-center gap-2 text-sm font-bold text-slate-500 disabled:text-slate-300 active:text-slate-700"
            >
              <Send size={14} /> Enviar un aviso de prueba
            </button>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Los avisos suenan con Nappy abierta o en segundo plano. Si cerrás la app del todo, el celular no los recibe.
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default ReminderSettings;
