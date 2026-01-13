
import React from 'react';
import { LayoutDashboard, History, PieChart, Users, Settings } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  title: string;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, title }) => {
  const tabs = [
    { id: 'track', label: 'Registro', icon: LayoutDashboard },
    { id: 'history', label: 'Historial', icon: History },
    { id: 'stats', label: 'Estadísticas', icon: PieChart },
    { id: 'caregivers', label: 'Cuidadores', icon: Users },
    { id: 'settings', label: 'Ajustes', icon: Settings },
  ];

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-white shadow-xl overflow-hidden relative">
      <header className="bg-blue-500 p-4 pt-8 text-white flex justify-between items-center shrink-0">
        <h1 className="text-xl font-bold tracking-tight">{title}</h1>
        <div className="bg-white/20 px-3 py-1 rounded-full text-xs font-medium">
          Nappy 🚽
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 bg-slate-50 no-scrollbar pb-24">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-slate-200 flex justify-around items-center p-2 pb-6 shrink-0 z-50">
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