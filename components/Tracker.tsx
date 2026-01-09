
import React, { useState } from 'react';
import { LogType, BathroomLog, Caregiver } from '../types';
import { Check, X, Droplet, Ghost, AlertCircle } from 'lucide-react';

interface TrackerProps {
  caregivers: Caregiver[];
  onAddLog: (log: Omit<BathroomLog, 'id'>) => void;
}

const Tracker: React.FC<TrackerProps> = ({ caregivers, onAddLog }) => {
  const [type, setType] = useState<LogType>(LogType.PEE);
  const [success, setSuccess] = useState<boolean>(true);
  const [notes, setNotes] = useState('');
  const [caregiverId, setCaregiverId] = useState(caregivers[0]?.id || '');
  const [showSuccessMsg, setShowSuccessMsg] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddLog({
      timestamp: Date.now(),
      type,
      success,
      notes,
      caregiverId
    });
    setNotes('');
    setShowSuccessMsg(true);
    setTimeout(() => setShowSuccessMsg(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-blue-400 to-indigo-500 p-6 rounded-3xl text-white shadow-lg text-center">
        <h2 className="text-2xl font-bold mb-2">¿Cómo fue hoy?</h2>
        <p className="text-blue-100 opacity-90">Cada intento es un paso más hacia el éxito 🌟</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-6">
        <div>
          <label className="block text-sm font-bold text-slate-500 mb-3 uppercase tracking-wider">Tipo de Intento</label>
          <div className="grid grid-cols-3 gap-3">
            {[LogType.PEE, LogType.POOP, LogType.BOTH].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${
                  type === t
                    ? 'border-blue-500 bg-blue-50 text-blue-600'
                    : 'border-slate-100 bg-slate-50 text-slate-400'
                }`}
              >
                {t === LogType.PEE && <Droplet className="mb-1" />}
                {t === LogType.POOP && <Ghost className="mb-1" />}
                {t === LogType.BOTH && (
                  <div className="flex -space-x-1 mb-1">
                    <Droplet size={16} />
                    <Ghost size={16} />
                  </div>
                )}
                <span className="text-xs font-bold">{t === LogType.PEE ? 'Pis' : t === LogType.POOP ? 'Caca' : 'Ambos'}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-500 mb-3 uppercase tracking-wider">¿Fue exitoso?</label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setSuccess(true)}
              className={`flex items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                success ? 'border-green-500 bg-green-50 text-green-600' : 'border-slate-100 bg-slate-50 text-slate-400'
              }`}
            >
              <Check size={20} />
              <span className="font-bold">Sí</span>
            </button>
            <button
              type="button"
              onClick={() => setSuccess(false)}
              className={`flex items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                !success ? 'border-rose-500 bg-rose-50 text-rose-600' : 'border-slate-100 bg-slate-50 text-slate-400'
              }`}
            >
              <X size={20} />
              <span className="font-bold">No</span>
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-500 mb-2 uppercase tracking-wider">Observaciones (Opcional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ej: Tenía mucha ganas, casi llega..."
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            rows={2}
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-500 mb-2 uppercase tracking-wider">Cuidador</label>
          <select
            value={caregiverId}
            onChange={(e) => setCaregiverId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {caregivers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-200 transition-all active:scale-95"
        >
          Guardar Registro
        </button>
      </form>

      {showSuccessMsg && (
        <div className="bg-green-100 text-green-700 p-4 rounded-2xl flex items-center gap-2 animate-bounce">
          <Check size={20} />
          <span className="font-bold">¡Registro guardado con éxito!</span>
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
    </div>
  );
};

export default Tracker;
