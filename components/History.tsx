
import React, { useState, useMemo } from 'react';
import { BathroomLog, Caregiver, LogType } from '../types';
import { Trash2, Droplet, Ghost, CheckCircle2, XCircle, Calendar, AlertTriangle, X, Check } from 'lucide-react';

interface HistoryProps {
  logs: BathroomLog[];
  caregivers: Caregiver[];
  onDeleteLog: (id: string) => void;
  onDeleteAll: () => void;
}

const History: React.FC<HistoryProps> = ({ logs, caregivers, onDeleteLog, onDeleteAll }) => {
  const [typeFilter, setTypeFilter] = useState<LogType | 'ALL'>('ALL');
  const [isConfirmingDeleteAll, setIsConfirmingDeleteAll] = useState(false);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);

  const filteredLogs = useMemo(() => {
    let res = [...logs];
    if (typeFilter !== 'ALL') res = res.filter(l => l.type === typeFilter);
    return res.sort((a, b) => b.timestamp - a.timestamp);
  }, [logs, typeFilter]);

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400 text-center p-6">
        <div className="bg-slate-100 p-6 rounded-full mb-4">
          <Calendar size={48} className="opacity-20" />
        </div>
        <p className="font-bold">El historial está vacío.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      <div className="flex justify-between items-center mb-4 px-1">
        <h2 className="text-xl font-black text-slate-800">Historial</h2>
        
        {!isConfirmingDeleteAll ? (
          <button
            type="button"
            onClick={() => setIsConfirmingDeleteAll(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-500 text-white rounded-2xl text-xs font-bold shadow-lg active:scale-95 transition-all"
          >
            <AlertTriangle size={14} />
            BORRAR TODO
          </button>
        ) : (
          <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
            <button
              onClick={() => setIsConfirmingDeleteAll(false)}
              className="p-2.5 bg-slate-200 text-slate-600 rounded-2xl"
            >
              <X size={16} />
            </button>
            <button
              onClick={() => {
                onDeleteAll();
                setIsConfirmingDeleteAll(false);
              }}
              className="px-4 py-2.5 bg-rose-600 text-white rounded-2xl text-xs font-black shadow-inner animate-pulse"
            >
              ¡CONFIRMAR!
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
        {['ALL', LogType.PEE, LogType.POOP, LogType.BOTH].map(t => (
          <button
            key={t}
            onClick={() => setTypeFilter(t as any)}
            className={`px-5 py-2 rounded-full text-xs font-bold border transition-all whitespace-nowrap ${
              typeFilter === t ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-400'
            }`}
          >
            {t === 'ALL' ? 'Todos' : t === LogType.PEE ? 'Pis' : t === LogType.POOP ? 'Caca' : 'Ambos'}
          </button>
        ))}
      </div>

      <div className="space-y-3 mt-4">
        {filteredLogs.map(log => {
          const isConfirmingThis = confirmingDeleteId === log.id;
          
          return (
            <div key={log.id} className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-3 relative overflow-hidden">
              <div className={`p-3 rounded-2xl shrink-0 ${log.success ? 'bg-green-50 text-green-500' : 'bg-rose-50 text-rose-500'}`}>
                {log.type === LogType.PEE && <Droplet size={20} />}
                {log.type === LogType.POOP && <Ghost size={20} />}
                {log.type === LogType.BOTH && <div className="flex -space-x-1"><Droplet size={14} /><Ghost size={14} /></div>}
              </div>

              <div className="flex-1 min-w-0 pr-12">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-slate-800 text-sm">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  <div className={`flex items-center gap-1 text-[9px] font-black uppercase ${log.success ? 'text-green-600' : 'text-rose-600'}`}>
                    {log.success ? 'Logrado' : 'Intento'}
                  </div>
                </div>
                <p className="text-[10px] text-slate-400">{new Date(log.timestamp).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</p>
                <p className="text-[10px] text-slate-400 mt-1 font-bold">Por: {caregivers.find(c => c.id === log.caregiverId)?.name || '?'}</p>
              </div>

              {/* Contenedor de botones de borrado dinámico */}
              <div className="absolute right-0 top-0 bottom-0 flex items-stretch">
                {!isConfirmingThis ? (
                  <button
                    type="button"
                    onClick={() => setConfirmingDeleteId(log.id)}
                    className="px-4 text-slate-300 hover:text-rose-500 active:bg-rose-50 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                ) : (
                  <div className="flex items-stretch animate-in slide-in-from-right-full duration-200">
                    <button
                      onClick={() => setConfirmingDeleteId(null)}
                      className="px-3 bg-slate-100 text-slate-400"
                    >
                      <X size={16} />
                    </button>
                    <button
                      onClick={() => {
                        onDeleteLog(log.id);
                        setConfirmingDeleteId(null);
                      }}
                      className="px-4 bg-rose-500 text-white font-black text-[10px]"
                    >
                      ¡SÍ!
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default History;
