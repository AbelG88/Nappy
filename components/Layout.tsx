import React, { useState } from 'react';
import { LayoutDashboard, History, PieChart, Users, Settings, ChevronDown, Plus, Check } from 'lucide-react';
import { Profile } from '../types';
import Avatar from './Avatar';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  title: string;
  profiles: Profile[];
  activeProfileId: string;
  onSelectProfile: (id: string) => void;
  onAddProfile: () => void;
}

const Layout: React.FC<LayoutProps> = ({
  children, activeTab, setActiveTab, title, profiles, activeProfileId, onSelectProfile, onAddProfile,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const active = profiles.find(p => p.id === activeProfileId) ?? profiles[0];

  const tabs = [
    { id: 'track', label: 'Registro', icon: LayoutDashboard },
    { id: 'history', label: 'Historial', icon: History },
    { id: 'stats', label: 'Estadísticas', icon: PieChart },
    { id: 'caregivers', label: 'Cuidadores', icon: Users },
    { id: 'settings', label: 'Ajustes', icon: Settings },
  ];

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-white shadow-xl overflow-hidden relative">
      <header className="bg-blue-500 p-4 pt-8 text-white flex justify-between items-center shrink-0 relative z-40">
        <h1 className="text-xl font-bold tracking-tight">{title}</h1>
        <button
          onClick={() => setMenuOpen(o => !o)}
          className="bg-white/20 pl-1.5 pr-3 py-1 rounded-full text-sm font-bold flex items-center gap-2 active:bg-white/30 max-w-[55%]"
          aria-haspopup="true"
          aria-expanded={menuOpen}
        >
          {active && <Avatar sex={active.sex} size="sm" />}
          <span className="truncate">{active?.name ?? 'Nappy'}</span>
          <ChevronDown size={16} className={`shrink-0 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-4 top-[72px] z-50 w-64 bg-white text-slate-700 rounded-3xl shadow-2xl border border-slate-100 p-2 animate-in fade-in slide-in-from-top-2 duration-150">
              {profiles.map(p => (
                <button
                  key={p.id}
                  onClick={() => { onSelectProfile(p.id); setMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-2xl text-left ${
                    p.id === activeProfileId ? 'bg-blue-50' : 'active:bg-slate-50'
                  }`}
                >
                  <Avatar sex={p.sex} size="sm" />
                  <span className="flex-1 font-bold truncate">{p.name}</span>
                  {p.id === activeProfileId && <Check size={18} className="text-blue-500 shrink-0" />}
                </button>
              ))}
              <button
                onClick={() => { setMenuOpen(false); onAddProfile(); }}
                className="w-full flex items-center gap-3 p-2.5 rounded-2xl text-left text-blue-600 active:bg-blue-50 mt-1 border-t border-slate-100"
              >
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                  <Plus size={18} />
                </div>
                <span className="font-bold">Agregar peque</span>
              </button>
            </div>
          </>
        )}
      </header>

      <main className="flex-1 overflow-y-auto p-4 bg-slate-50 no-scrollbar pb-24">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-slate-200 flex justify-around items-center p-2 pb-6 shrink-0 z-30">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center p-2 transition-colors ${
              activeTab === tab.id ? 'text-blue-600' : 'text-slate-400'
            }`}
          >
            <tab.icon size={22} className={activeTab === tab.id ? 'animate-bounce' : ''} />
            <span className="text-[10px] font-semibold mt-1 uppercase tracking-wider">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Layout;
