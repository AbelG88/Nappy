
import React, { useMemo } from 'react';
import { BathroomLog } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { TrendingUp, Award, Target } from 'lucide-react';

interface StatisticsProps {
  logs: BathroomLog[];
}

const Statistics: React.FC<StatisticsProps> = ({ logs }) => {
  const stats = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toLocaleDateString('es-ES', { weekday: 'short' });
    }).reverse();

    const dailyData = last7Days.map(day => ({
      name: day,
      success: 0,
      total: 0
    }));

    logs.forEach(log => {
      const logDay = new Date(log.timestamp).toLocaleDateString('es-ES', { weekday: 'short' });
      const dayIndex = dailyData.findIndex(d => d.name === logDay);
      if (dayIndex !== -1) {
        dailyData[dayIndex].total += 1;
        if (log.success) dailyData[dayIndex].success += 1;
      }
    });

    const successCount = logs.filter(l => l.success).length;
    const totalCount = logs.length;
    const successRate = totalCount > 0 ? Math.round((successCount / totalCount) * 100) : 0;

    const pieData = [
      { name: 'Exitosos', value: successCount, color: '#10b981' },
      { name: 'Intentos', value: totalCount - successCount, color: '#f43f5e' }
    ];

    return { dailyData, successRate, totalCount, successCount, pieData };
  }, [logs]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center mb-2">
             <TrendingUp className="text-green-500" />
          </div>
          <span className="text-2xl font-black text-slate-800">{stats.successRate}%</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Efectividad</span>
        </div>
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-2">
             <Target className="text-blue-500" />
          </div>
          <span className="text-2xl font-black text-slate-800">{stats.totalCount}</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Intentos Totales</span>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6">Procesos últimos 7 días</h3>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.dailyData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }} />
              <YAxis hide />
              <Tooltip 
                cursor={{ fill: 'transparent' }}
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="success" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-6">
        <div className="h-32 w-32 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={stats.pieData}
                cx="50%"
                cy="50%"
                innerRadius={30}
                outerRadius={45}
                paddingAngle={5}
                dataKey="value"
              >
                {stats.pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-3">
           <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Balance</h3>
           <div className="flex items-center gap-2">
             <div className="w-3 h-3 rounded-full bg-green-500" />
             <span className="text-xs font-bold text-slate-700">Logrados: {stats.successCount}</span>
           </div>
           <div className="flex items-center gap-2">
             <div className="w-3 h-3 rounded-full bg-rose-500" />
             <span className="text-xs font-bold text-slate-700">No Logrados: {stats.totalCount - stats.successCount}</span>
           </div>
        </div>
      </div>

      {stats.successRate >= 80 && (
        <div className="bg-indigo-600 p-6 rounded-3xl text-white shadow-lg flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-2xl">
            <Award size={32} />
          </div>
          <div>
            <h4 className="font-bold text-lg">¡Vas por excelente camino!</h4>
            <p className="text-indigo-100 text-xs">Tu pequeño está dominando el baño.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Statistics;
