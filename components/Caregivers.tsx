
import React, { useState } from 'react';
import { Caregiver } from '../types';
import { Plus, User, Edit2, Trash2, X, Check } from 'lucide-react';

interface CaregiversProps {
  caregivers: Caregiver[];
  onAdd: (name: string, role: string) => void;
  onUpdate: (id: string, name: string, role: string) => void;
  onDelete: (id: string) => void;
}

const Caregivers: React.FC<CaregiversProps> = ({ caregivers, onAdd, onUpdate, onDelete }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');

  const handleAdd = () => {
    if (name) {
      onAdd(name, role);
      setName('');
      setRole('');
      setIsAdding(false);
    }
  };

  const startEdit = (c: Caregiver) => {
    setEditingId(c.id);
    setName(c.name);
    setRole(c.role);
  };

  const handleUpdate = () => {
    if (editingId && name) {
      onUpdate(editingId, name, role);
      setEditingId(null);
      setName('');
      setRole('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center px-1 mb-4">
        <h2 className="text-lg font-bold text-slate-700">Cuidadores</h2>
        <button
          onClick={() => setIsAdding(true)}
          className="p-2 bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-200"
        >
          <Plus size={20} />
        </button>
      </div>

      {(isAdding || editingId) && (
        <div className="bg-white p-5 rounded-3xl shadow-md border border-blue-100 animate-in fade-in slide-in-from-top-4">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">
            {editingId ? 'Editar Cuidador' : 'Nuevo Cuidador'}
          </h3>
          <div className="space-y-4">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre (ej: Abuela Rosa)"
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-700 focus:ring-2 focus:ring-blue-500"
            />
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Rol (ej: Familiar, Niñera)"
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-700 focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => { setIsAdding(false); setEditingId(null); }}
                className="flex-1 bg-slate-100 text-slate-600 font-bold py-3 rounded-2xl"
              >
                Cancelar
              </button>
              <button
                onClick={editingId ? handleUpdate : handleAdd}
                className="flex-2 bg-blue-500 text-white font-bold py-3 px-8 rounded-2xl flex items-center justify-center gap-2"
              >
                <Check size={18} />
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {caregivers.map((c) => (
          <div key={c.id} className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 shrink-0">
               <User size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-800 truncate">{c.name}</p>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{c.role || 'Sin rol'}</p>
            </div>
            <div className="flex gap-1">
              <button 
                onClick={() => startEdit(c)}
                className="p-2 text-slate-400 hover:text-blue-500"
              >
                <Edit2 size={18} />
              </button>
              {caregivers.length > 1 && (
                <button 
                  onClick={() => onDelete(c.id)}
                  className="p-2 text-slate-400 hover:text-rose-500"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Caregivers;
