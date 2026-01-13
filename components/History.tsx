
import React, { useState, useMemo, useRef } from 'react';
import { BathroomLog, Caregiver, LogType } from '../types';
import { Trash2, Droplet, Ghost, CheckCircle2, XCircle, Calendar, Filter, User, AlertTriangle, Search } from 'lucide-react';

interface HistoryProps {
  logs: BathroomLog[];
  caregivers: Caregiver[];
  onDeleteLog: (id: string) => void;
  onDeleteAll: () => void;
}

const SwipeableItem: React.FC<{
  log: BathroomLog;
  caregiverName: string;
  onDelete: (id: string) => void;
}> = ({ log, caregiverName, onDelete }) => {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const startX = useRef(0);
  const maxSwipe = 80; // Pixels to reveal the button

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX.current;
    
    // Only allow swiping to the left (negative values)
    if (diff < 0) {
      // Use math to make it slightly resistant as it goes further
      const offset = Math.max(diff, -maxSwipe - 20);
      setSwipeOffset(offset);
    } else {
      setSwipeOffset(0);
    }
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);
    if (swipeOffset < -maxSwipe / 2) {
      setSwipeOffset(-maxSwipe);
    } else {
      setSwipeOffset(0);
    }
  };

  const resetSwipe = () => setSwipeOffset(0);

  return (
    <div className="relative overflow-hidden rounded-3xl mb-4 group">
      {/* Background Action Area (Delete Button) */}
      <div 
        className="absolute inset-y-0 right-0 w-20 bg-rose-500 flex items-center justify-center text-white cursor-pointer"
        onClick={() => {
          onDelete(log.id);
          resetSwipe();
        }}
      >
        <Trash2 size={24} />
      </div>

      {/* Foreground Content */}
      <div 
        className="relative bg-white p-4 shadow-sm border border-slate-100 flex items-center gap-4 transition-transform duration-200 ease-out z-10"
        style={{ transform: `translateX(${swipeOffset}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={swipeOffset !== 0 ? resetSwipe : undefined}
      >
        <div className={`p-3 rounded-2xl shrink-0 ${
          log.success ? 'bg-green-50 text-green-500' : 'bg-rose-50 text-rose-500'
        }`}>
          {log.type === LogType.PEE && <Droplet size={24} />}
          {log.type === LogType.POOP && <Ghost size={24} />}
          {log.type === LogType.BOTH && (
            <div className="flex -space-x-1">
              <Droplet size={18} />
              <Ghost size={18} />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <p className="font-bold text-slate-800">
              {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
            <div className="flex items-center gap-1">
              {log.success ? 
                <CheckCircle2 size={16} className="text-green-500" /> : 
                <XCircle size={16} className="text-rose-500" />
              }
              <span className={`text-[10px] font-bold uppercase tracking-wider ${log.success ? 'text-green-600' : 'text-rose-600'}`}>
                {log.success ? 'Logrado' : 'Intento'}
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            {new Date(log.timestamp).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
          </p>
          {log.notes && <p className="text-xs text-slate-600 italic mt-1 truncate">{log.notes}</p>}
          <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
            Por: <span className="font-bold text-slate-500">{caregiverName}</span>
          </p>
        </div>
        
        {/* Subtle indicator for mobile users that this can be swiped */}
        <div className="w-1.5 h-8 bg-slate-100 rounded-full shrink-0 flex items-center justify-center opacity-40">
           <div className="w-0.5 h-4 bg-slate-300 rounded-full" />
        </div>
      </div>
    </div>
  );
};

const History: React.FC<HistoryProps> = ({ logs, caregivers, onDeleteLog, onDeleteAll }) => {
  const [typeFilter, setTypeFilter] = useState<LogType | 'ALL'>('ALL');
  const [caregiverFilter, setCaregiverFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const getCaregiverName = (id: string) => caregivers.find(c => c.id === id)?.name || 'Desconocido';

  const filteredLogs = useMemo(() => {
    let result = [...logs];
    
    if (typeFilter !== 'ALL') {
      result = result.filter(log => log.type === typeFilter);
    }
    
    if (caregiverFilter !== 'ALL') {
      result = result.filter(log => log.caregiverId === caregiverFilter);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(log => {
        const cName = getCaregiverName(log.caregiverId).toLowerCase();
        const notes = log.notes.toLowerCase();
        return cName.includes(term) || notes.includes(term);
      });
    }

    return result.sort((a, b) => b.timestamp - a.timestamp);
  }, [logs, typeFilter, caregiverFilter, searchTerm, caregivers]);

  const handleDeleteAll = () => {
    if (window.confirm('¿Estás seguro de que quieres borrar TODOS los registros? Esta acción no se puede deshacer.')) {
      onDeleteAll();
    }
  };

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400 space-y-4">
        <div className="bg-slate-100 p-6 rounded-full">
          <Calendar size={48} className="opacity-50" />
        </div>
        <p className="font-medium">Aún no hay registros guardados.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="px-1">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-slate-700">Historial de Intentos</h2>
          <button
            onClick={handleDeleteAll}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold hover:bg-rose-100 transition-colors border border-rose-100"
          >
            <AlertTriangle size={14} />
            Borrar Todo
          </button>
        </div>
        
        {/* Filter UI */}
        <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 space-y-4 mb-6">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
            <Filter size={14} />
            <span>Filtros y Búsqueda</span>
          </div>
          
          <div className="space-y-3">
            {/* Search Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-slate-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por notas o cuidador..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-2 pl-10 pr-4 text-xs font-bold text-slate-600 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
              />
            </div>

            <div>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {['ALL', LogType.PEE, LogType.POOP, LogType.BOTH].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTypeFilter(t as any)}
                    className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                      typeFilter === t
                        ? 'bg-blue-500 border-blue-500 text-white shadow-md shadow-blue-100'
                        : 'bg-white border-slate-100 text-slate-400'
                    }`}
                  >
                    {t === 'ALL' ? 'Todos' : t === LogType.PEE ? 'Pis' : t === LogType.POOP ? 'Caca' : 'Ambos'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-100">
              <User size={16} className="text-slate-400 ml-2" />
              <select
                value={caregiverFilter}
                onChange={(e) => setCaregiverFilter(e.target.value)}
                className="flex-1 bg-transparent text-xs font-bold text-slate-600 focus:outline-none py-1"
              >
                <option value="ALL">Todos los cuidadores</option>
                {caregivers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {filteredLogs.length === 0 ? (
        <div className="text-center py-10 text-slate-400">
          <p className="text-sm font-medium">No se encontraron registros con estos filtros.</p>
          <button 
            onClick={() => { setTypeFilter('ALL'); setCaregiverFilter('ALL'); setSearchTerm(''); }}
            className="text-xs text-blue-500 font-bold mt-2"
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div className="space-y-0">
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-3 px-1 italic">
            Desliza a la izquierda para eliminar
          </p>
          {filteredLogs.map((log) => (
            <SwipeableItem 
              key={log.id} 
              log={log} 
              caregiverName={getCaregiverName(log.caregiverId)} 
              onDelete={onDeleteLog} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default History;
