
import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../store';
import { ICONS } from '../constants';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { createFluidLog, getTodayFluidIntake, getFluidLogs, deleteFluidLog, FluidLog as FluidLogType, FluidSource } from '../services/fluid';
import { getAuthToken } from '../services/auth';

// Map UI beverage names to API source types
const beverageToSource: Record<string, FluidSource> = {
  'Water': 'water',
  'Tea': 'tea',
  'Coffee': 'coffee',
  'Juice': 'juice',
  'Soup': 'soup',
  'Other': 'other',
};

const sourceToIcon: Record<FluidSource, string> = {
  'water': '💧',
  'tea': '🍵',
  'coffee': '☕',
  'juice': '🧃',
  'soup': '🥣',
  'other': '🥤',
};

const FluidLog: React.FC = () => {
  const { fluids, addFluid, clearDailyFluids, profile } = useStore();
  const [amount, setAmount] = useState('');
  const [beverage, setBeverage] = useState('Water');
  const [isAdding, setIsAdding] = useState(false);
  const [apiLogs, setApiLogs] = useState<FluidLogType[]>([]);
  const [apiTotalToday, setApiTotalToday] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Fetch fluid data from API on mount
  useEffect(() => {
    const fetchFluidData = async () => {
      const token = getAuthToken();
      if (!token) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      setIsAuthenticated(true);

      try {
        const [todayData, logsData] = await Promise.all([
          getTodayFluidIntake(),
          getFluidLogs({ limit: 50 })
        ]);

        setApiTotalToday(todayData.totalMl);
        setApiLogs(logsData.logs);
      } catch (err) {
        console.error('Failed to fetch fluid data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFluidData();
  }, []);

  // Use API total when authenticated, otherwise use local store
  const totalToday = useMemo(() => {
    if (isAuthenticated && apiTotalToday !== null) {
      return apiTotalToday;
    }
    const today = new Date().toISOString().split('T')[0];
    return fluids
      .filter(f => f.time.startsWith(today))
      .reduce((acc, f) => acc + f.amount, 0);
  }, [fluids, isAuthenticated, apiTotalToday]);

  const remaining = Math.max(profile.dailyFluidLimit - totalToday, 0);
  const percent = Math.min((totalToday / profile.dailyFluidLimit) * 100, 100);

  const beveragePresets = [
    { name: 'Water', icon: '💧', color: 'text-sky-500', bg: 'bg-sky-50 dark:bg-sky-500/10', border: 'border-sky-100 dark:border-sky-500/20' },
    { name: 'Tea', icon: '🍵', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-100 dark:border-emerald-500/20' },
    { name: 'Coffee', icon: '☕', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-100 dark:border-amber-500/20' },
    { name: 'Juice', icon: '🧃', color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-500/10', border: 'border-orange-100 dark:border-orange-500/20' },
    { name: 'Soup', icon: '🥣', color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-500/10', border: 'border-rose-100 dark:border-rose-500/20' },
  ];

  const handleAdd = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!amount || isAdding) return;

    setIsAdding(true);
    const amountMl = parseInt(amount);
    const source = beverageToSource[beverage] || 'other';

    try {
      if (isAuthenticated) {
        // Create via API
        const newLog = await createFluidLog({
          amountMl,
          source,
        });

        // Update local state with new log
        setApiLogs(prev => [newLog, ...prev]);
        setApiTotalToday(prev => (prev || 0) + amountMl);
      } else {
        // Fallback to local store
        addFluid({
          id: Date.now().toString(),
          time: new Date().toISOString(),
          amount: amountMl,
          beverage
        });
      }
      setAmount('');
    } catch (err) {
      console.error('Failed to add fluid log:', err);
      // Fallback to local store on error
      addFluid({
        id: Date.now().toString(),
        time: new Date().toISOString(),
        amount: amountMl,
        beverage
      });
    } finally {
      setIsAdding(false);
    }
  };

  const quickAdd = async (val: number, bev: string = 'Water') => {
    if (isAdding) return;
    setIsAdding(true);

    const source = beverageToSource[bev] || 'water';

    try {
      if (isAuthenticated) {
        // Create via API
        const newLog = await createFluidLog({
          amountMl: val,
          source,
        });

        // Update local state
        setApiLogs(prev => [newLog, ...prev]);
        setApiTotalToday(prev => (prev || 0) + val);
      } else {
        // Fallback to local store
        addFluid({
          id: Date.now().toString(),
          time: new Date().toISOString(),
          amount: val,
          beverage: bev
        });
      }
    } catch (err) {
      console.error('Failed to add quick fluid log:', err);
      // Fallback to local store on error
      addFluid({
        id: Date.now().toString(),
        time: new Date().toISOString(),
        amount: val,
        beverage: bev
      });
    } finally {
      setIsAdding(false);
    }
  };

  // Handle deleting a fluid log
  const handleDeleteLog = async (logId: string) => {
    if (!confirm('Delete this entry?')) return;

    try {
      if (isAuthenticated) {
        const logToDelete = apiLogs.find(l => l._id === logId);
        await deleteFluidLog(logId);

        // Update local state
        setApiLogs(prev => prev.filter(l => l._id !== logId));
        if (logToDelete) {
          // Check if log is from today
          const today = new Date().toISOString().split('T')[0];
          if (logToDelete.loggedAt.startsWith(today)) {
            setApiTotalToday(prev => Math.max((prev || 0) - logToDelete.amountMl, 0));
          }
        }
      }
    } catch (err) {
      console.error('Failed to delete fluid log:', err);
    }
  };

  const chartData = useMemo(() => {
    const dailyData: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dailyData[dateStr] = 0;
    }

    // Use API logs when authenticated, otherwise local store
    const logsToChart = isAuthenticated ? apiLogs : fluids;

    logsToChart.forEach(f => {
      const dateStr = isAuthenticated
        ? (f as FluidLogType).loggedAt.split('T')[0]
        : (f as { time: string }).time.split('T')[0];
      if (dailyData.hasOwnProperty(dateStr)) {
        dailyData[dateStr] += isAuthenticated
          ? (f as FluidLogType).amountMl
          : (f as { amount: number }).amount;
      }
    });
    return Object.entries(dailyData).map(([date, amount]) => ({
      date: new Date(date).toLocaleDateString(undefined, { weekday: 'short' }),
      amount
    }));
  }, [fluids, apiLogs, isAuthenticated]);

  // Get display logs (API or local)
  const displayLogs = useMemo(() => {
    if (isAuthenticated && apiLogs.length > 0) {
      return apiLogs.slice(0, 15).map(log => ({
        id: log._id,
        time: log.loggedAt,
        amount: log.amountMl,
        beverage: log.source.charAt(0).toUpperCase() + log.source.slice(1),
        source: log.source,
        isApi: true,
      }));
    }
    return fluids.slice(0, 15).map(f => ({
      id: f.id,
      time: f.time,
      amount: f.amount,
      beverage: f.beverage,
      source: beverageToSource[f.beverage] || 'other',
      isApi: false,
    }));
  }, [fluids, apiLogs, isAuthenticated]);

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-12 animate-in fade-in duration-1000 pb-32 overflow-x-hidden">
      
      <header className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end px-2 lg:px-4">
        <div className="lg:col-span-8 space-y-6">
           <div className="flex items-center gap-3">
              <span className="px-4 py-1.5 bg-sky-500 text-white text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] rounded-full shadow-lg shadow-sky-500/20">Hydration Node</span>
           </div>
           <h2 className="text-5xl sm:text-7xl lg:text-9xl font-black text-slate-900 dark:text-white tracking-tighter leading-[0.85] md:leading-[0.8]">Volume <br/> <span className="text-sky-500">Node.</span></h2>
           <p className="text-slate-400 dark:text-slate-500 max-w-xl font-medium text-lg lg:text-2xl leading-relaxed">Precision hydration management for clinical inter-dialytic balance.</p>
        </div>
        <div className="lg:col-span-4 flex lg:justify-end pb-4">
           <button 
             onClick={() => { if(confirm('Authorize Registry Reset?')) clearDailyFluids(); }}
             className="px-6 py-4 bg-slate-50 dark:bg-white/5 text-slate-400 dark:text-slate-600 rounded-xl md:rounded-2xl border border-slate-100 dark:border-white/5 font-black text-[9px] uppercase tracking-widest hover:text-rose-500 hover:border-rose-500 transition-all"
           >
             Reset Protocol
           </button>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 lg:gap-10 px-2 lg:px-4">
        <section className="xl:col-span-8 relative p-6 md:p-10 lg:p-14 bg-slate-950 dark:bg-slate-900 rounded-[3rem] md:rounded-[5rem] text-white shadow-4xl overflow-hidden group border border-white/5 transition-colors duration-500">
          <div className="absolute inset-0 opacity-10 pointer-events-none transition-all duration-[2s]" style={{ transform: `translateY(${100 - percent}%)` }}>
            <div className="absolute top-0 left-0 w-[200%] h-full bg-sky-500 animate-wave-slow opacity-30"></div>
          </div>
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center h-full gap-8 md:gap-10">
            <div className="space-y-10 md:space-y-12 flex-1">
               <div className="space-y-4">
                  <span className="text-[10px] md:text-[11px] font-black text-white/20 uppercase tracking-[0.3em]">Today's Node</span>
                  <div className="flex items-baseline gap-3 md:gap-4">
                     <span className="text-6xl sm:text-8xl md:text-[10rem] font-black tracking-tighter leading-none tabular-nums text-white transition-colors duration-500">{totalToday}</span>
                     <span className="text-xl md:text-3xl font-black text-white/20 uppercase tracking-widest">ml</span>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-6 pt-8 border-t border-white/5">
                  <div>
                     <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">Balance</p>
                     <p className={`text-2xl md:text-4xl font-black tabular-nums ${remaining < 200 ? 'text-rose-400' : 'text-white'}`}>{remaining}<span className="text-[10px] ml-1 opacity-30">ml</span></p>
                  </div>
                  <div>
                     <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">Limit</p>
                     <p className="text-2xl md:text-4xl font-black tabular-nums text-white">{profile.dailyFluidLimit}<span className="text-[10px] ml-1 opacity-30">ml</span></p>
                  </div>
               </div>
            </div>

            <div className="relative flex flex-col items-center justify-center flex-shrink min-w-0">
               <div className="relative w-40 h-40 md:w-56 lg:w-72 md:h-56 lg:h-72 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90">
                    <circle cx="50%" cy="50%" r="42%" stroke="rgba(255,255,255,0.03)" strokeWidth="24" fill="none" />
                    <circle 
                      cx="50%" cy="50%" r="42%" 
                      stroke={percent >= 100 ? '#F43F5E' : percent > 85 ? '#F97316' : '#0EA5E9'} 
                      strokeWidth="28" 
                      fill="none" 
                      strokeDasharray="264%" 
                      strokeDashoffset={`${264 - (264 * percent) / 100}%`} 
                      strokeLinecap="round" 
                      className="transition-all duration-[1.5s] ease-out" 
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                     <span className="text-4xl md:text-6xl font-black tracking-tighter tabular-nums">{Math.round(percent)}<span className="text-sm md:text-lg ml-0.5">%</span></span>
                     <span className="text-[8px] md:text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mt-1">Cap</span>
                  </div>
               </div>
            </div>
          </div>
        </section>

        <aside className="xl:col-span-4 space-y-8 lg:space-y-10">
           {/* Detailed Entry Form */}
           <div className="bg-white dark:bg-slate-900 p-8 md:p-10 rounded-[3rem] md:rounded-[4rem] border border-slate-100 dark:border-white/10 shadow-sm flex flex-col space-y-8">
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Manual Log</h3>
              
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest ml-4 transition-colors">Select Beverage</label>
                <div className="grid grid-cols-5 gap-2">
                   {beveragePresets.map(preset => (
                     <button 
                       key={preset.name}
                       onClick={() => setBeverage(preset.name)}
                       title={preset.name}
                       className={`flex flex-col items-center justify-center aspect-square rounded-2xl border-2 transition-all duration-300 ${beverage === preset.name ? 'border-sky-500 bg-sky-50 dark:bg-sky-500/10 shadow-lg scale-105' : 'border-transparent bg-slate-50 dark:bg-white/5 hover:bg-slate-100'}`}
                     >
                        <span className="text-2xl mb-1">{preset.icon}</span>
                        <span className={`text-[8px] font-black uppercase tracking-tighter ${beverage === preset.name ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400'}`}>{preset.name}</span>
                     </button>
                   ))}
                </div>
              </div>

              <form onSubmit={handleAdd} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest ml-4 transition-colors">Amount (ml)</label>
                  <div className="relative group">
                    <input 
                      type="number" 
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      placeholder="250"
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-3xl px-8 py-5 font-black text-2xl text-slate-900 dark:text-white outline-none focus:ring-8 focus:ring-sky-500/5 dark:focus:ring-sky-500/10 transition-all placeholder:text-slate-200 dark:placeholder:text-slate-700"
                    />
                    <div className="absolute right-8 top-1/2 -translate-y-1/2 text-xs font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">ml</div>
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={!amount || isAdding}
                  className="w-full py-6 bg-slate-950 dark:bg-white text-white dark:text-slate-950 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl hover:bg-sky-600 dark:hover:bg-sky-500 dark:hover:text-white transition-all transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                >
                   {isAdding ? <div className="w-5 h-5 border-2 border-white/20 border-t-white dark:border-slate-900/20 dark:border-t-slate-900 rounded-full animate-spin"></div> : (
                     <>
                        <ICONS.Plus className="w-5 h-5" />
                        Save Entry
                     </>
                   )}
                </button>
              </form>
           </div>

           {/* Rapid Sync Options */}
           <div className="bg-white dark:bg-slate-900 p-8 md:p-10 rounded-[3rem] md:rounded-[4rem] border border-slate-100 dark:border-white/10 shadow-sm flex flex-col">
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-8">Rapid Sync</h3>
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                 {[150, 250, 350, 500].map(val => (
                    <button 
                      key={val} 
                      onClick={() => quickAdd(val)}
                      disabled={isAdding}
                      className="group p-5 md:p-6 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl md:rounded-[2.5rem] hover:bg-slate-950 dark:hover:bg-white transition-all duration-500 flex flex-col items-center justify-center gap-1"
                    >
                       <span className="text-xl md:text-2xl font-black text-slate-950 dark:text-white group-hover:text-white dark:group-hover:text-slate-950 transition-colors">+{val}</span>
                       <span className="text-[8px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest">ml</span>
                    </button>
                 ))}
              </div>
           </div>
        </aside>
      </div>

      {/* History Ledger Section */}
      <section className="px-2 lg:px-4 space-y-8">
        <div className="flex justify-between items-end px-4">
           <div>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Cycle History</h3>
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest mt-1">Registry of all hydration nodes</p>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {isLoading ? (
             <div className="col-span-full py-20 text-center flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin"></div>
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Loading...</p>
             </div>
           ) : displayLogs.length > 0 ? displayLogs.map(f => {
              const preset = beveragePresets.find(p => p.name === f.beverage) || beveragePresets[0];
              return (
                 <div key={f.id} className="group p-8 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-white/10 shadow-sm hover:shadow-xl transition-all duration-500 flex items-center justify-between relative">
                    <div className="flex items-center gap-6">
                       <div className={`w-14 h-14 ${preset.bg} ${preset.color} rounded-2xl flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform`}>
                          {preset.icon}
                       </div>
                       <div>
                          <span className="block text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest mb-1">{new Date(f.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <h4 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{f.beverage}</h4>
                       </div>
                    </div>
                    <div className="flex items-center gap-4">
                       <div className="text-right">
                          <span className="text-3xl font-black text-slate-900 dark:text-white tabular-nums">{f.amount}</span>
                          <span className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest ml-1">ml</span>
                       </div>
                       {f.isApi && (
                         <button
                           onClick={() => handleDeleteLog(f.id)}
                           className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-rose-500 transition-all"
                           title="Delete entry"
                         >
                           <ICONS.X className="w-5 h-5" />
                         </button>
                       )}
                    </div>
                 </div>
              );
           }) : (
             <div className="col-span-full py-20 text-center opacity-20 flex flex-col items-center gap-4">
                <ICONS.Droplet className="w-12 h-12" />
                <p className="text-xl font-black uppercase tracking-[0.2em]">No registry entries</p>
             </div>
           )}
        </div>
      </section>

      <style>{`
        @keyframes wave-slow {
          0% { transform: translateX(-50%) rotate(0deg); }
          50% { transform: translateX(-20%) rotate(180deg); }
          100% { transform: translateX(-50%) rotate(360deg); }
        }
        .animate-wave-slow {
          animation: wave-slow 20s infinite linear;
          transform-origin: 50% 50%;
        }
        .shadow-4xl { box-shadow: 0 60px 150px -30px rgba(0,0,0,0.5); }
        .tabular-nums { font-variant-numeric: tabular-nums; }
      `}</style>
    </div>
  );
};

export default FluidLog;
