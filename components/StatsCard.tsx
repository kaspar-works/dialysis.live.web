
import React from 'react';

interface StatsCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isUp: boolean;
  };
  color?: string;
  status?: string;
  statusColor?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ 
  label, 
  value, 
  unit, 
  icon, 
  trend, 
  color = 'bg-sky-500',
  status,
  statusColor = 'text-emerald-500'
}) => {
  return (
    <div className="group bg-white dark:bg-slate-900/50 p-7 rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.02)] dark:shadow-none hover:shadow-[0_20px_50px_rgba(14,165,233,0.1)] dark:hover:border-white/10 hover:-translate-y-2 transition-all duration-500 flex flex-col justify-between">
      <div className="flex justify-between items-start mb-6">
        <div className={`${color} w-14 h-14 rounded-2xl text-white flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
          {icon}
        </div>
        <div className="flex flex-col items-end">
          {trend && (
            <span className={`text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest ${trend.isUp ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}`}>
              {trend.isUp ? '↑' : '↓'} {trend.value}%
            </span>
          )}
          {status && !trend && (
            <span className={`text-[9px] font-black uppercase tracking-[0.15em] ${statusColor} bg-slate-50 dark:bg-white/5 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-white/5`}>
              {status}
            </span>
          )}
        </div>
      </div>
      <div>
        <h3 className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2">{label}</h3>
        <div className="flex items-baseline gap-1.5">
          <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{value}</span>
          {unit && <span className="text-slate-300 dark:text-slate-600 text-xs font-black uppercase">{unit}</span>}
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
