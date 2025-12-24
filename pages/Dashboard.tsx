
import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { ICONS } from '../constants';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Link, useNavigate } from 'react-router-dom';
import { MoodType, VitalType } from '../types';
import OnboardingModal from '../components/OnboardingModal';

const Dashboard: React.FC = () => {
  const { sessions, weights, fluids, profile, vitals, moods, addMood, addFluid } = useStore();
  const [insight, setInsight] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const navigate = useNavigate();
  
  const currentWeight = weights[0]?.value || profile.weightGoal;
  const todayFluid = fluids.reduce((acc, f) => acc + f.amount, 0);
  const fluidPercentage = Math.min(Math.round((todayFluid / profile.dailyFluidLimit) * 100), 100);
  const latestMood = moods[0]?.type || 'Standard';
  
  const latestBP = useMemo(() => vitals.find(v => v.type === VitalType.BLOOD_PRESSURE), [vitals]);

  const weightData = [...weights].reverse().slice(-7).map(w => ({
    date: new Date(w.date).toLocaleDateString(undefined, { weekday: 'short' }),
    weight: w.value
  }));

  const handleGenerateInsight = async () => {
    setIsGenerating(true);
   // const text = await generateHealthInsights(sessions, weights, fluids, moods, profile);
    //setInsight(null || null);
    setIsGenerating(false);
  };

  const stabilityScore = useMemo(() => {
    let score = 90;
    if (fluidPercentage > 100) score -= 15;
    if (latestMood === MoodType.UNWELL) score -= 10;
    return Math.max(score, 45);
  }, [fluidPercentage, latestMood]);

  const handleQuickFluid = (amount: number) => {
    addFluid({
      id: Date.now().toString(),
      time: new Date().toISOString(),
      amount,
      beverage: 'Water'
    });
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-8 md:space-y-12 animate-in fade-in duration-1000 pb-32 overflow-x-hidden">
      
      {!profile.isOnboarded && <OnboardingModal />}

      {/* Platform Hero: The Integrity Terminal */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 md:gap-10 px-2 sm:px-0">
        <section className="xl:col-span-9 relative p-8 md:p-14 lg:p-20 bg-slate-950 dark:bg-slate-900 rounded-[3rem] md:rounded-[5rem] text-white shadow-4xl overflow-hidden group border border-white/5 transition-all duration-700">
          <div className="absolute top-0 right-0 w-[400px] md:w-[800px] h-[400px] md:h-[800px] bg-gradient-to-br from-sky-500/20 via-pink-500/10 to-transparent rounded-full blur-[100px] md:blur-[140px] -translate-y-1/3 translate-x-1/4 pointer-events-none group-hover:scale-110 transition-transform duration-[10s]"></div>
          
          <div className="relative z-10 flex flex-col justify-between h-full gap-12 md:gap-20">
            <div className="flex flex-col lg:flex-row justify-between items-start gap-12">
              <div className="space-y-6 md:space-y-8">
                 <div className="flex items-center gap-4">
                    <span className="px-4 py-1.5 md:px-5 md:py-2 bg-white/5 text-emerald-400 text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] md:tracking-[0.4em] rounded-full border border-white/10 backdrop-blur-xl flex items-center gap-2 md:gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                      Integrity Node: 091-X
                    </span>
                 </div>
                 <h2 className="text-5xl sm:text-7xl lg:text-8xl xl:text-[9rem] font-black tracking-tighter leading-[0.8] md:leading-[0.75]">
                    System <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-white to-pink-500">Stable.</span>
                 </h2>
                 <p className="text-white/40 text-lg md:text-xl lg:text-2xl font-medium max-w-xl leading-relaxed">
                    Telemetry synchronized. Dry weight variance within <span className="text-emerald-400 font-black">0.2kg</span>. Fluid threshold approaching limit.
                 </p>
              </div>

              {/* Integrity Gauge */}
              <div className="relative w-40 h-40 md:w-56 md:h-56 flex items-center justify-center shrink-0 mx-auto lg:mx-0">
                 <svg className="w-full h-full -rotate-90">
                    <circle cx="50%" cy="50%" r="44%" stroke="rgba(255,255,255,0.03)" strokeWidth="12" fill="none" />
                    <circle 
                      cx="50%" cy="50%" r="44%" 
                      stroke="url(#integrityGrad)" 
                      strokeWidth="20" 
                      fill="none" 
                      strokeDasharray="276%" 
                      strokeDashoffset={`${276 - (276 * stabilityScore) / 100}%`} 
                      strokeLinecap="round" 
                      className="transition-all duration-[2s]"
                    />
                    <defs>
                      <linearGradient id="integrityGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#0EA5E9" />
                        <stop offset="100%" stopColor="#EC4899" />
                      </linearGradient>
                    </defs>
                 </svg>
                 <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl md:text-6xl font-black tabular-nums tracking-tighter">{stabilityScore}</span>
                    <span className="text-[8px] md:text-[10px] font-black text-white/20 uppercase tracking-[0.2em] md:tracking-[0.3em]">Stability</span>
                 </div>
              </div>
            </div>

            <footer className="flex flex-wrap gap-4 md:gap-6 items-center justify-center lg:justify-start">
               <button 
                onClick={handleGenerateInsight} disabled={isGenerating}
                className="w-full sm:w-auto px-10 py-6 md:px-14 md:py-8 bg-white text-slate-950 rounded-[2rem] md:rounded-[2.5rem] font-black text-xs md:text-sm uppercase tracking-[0.4em] shadow-3xl hover:bg-sky-400 hover:text-white transition-all active:scale-95 flex items-center justify-center gap-4 md:gap-6 group/btn"
               >
                {isGenerating ? (
                   <div className="w-5 h-5 border-4 border-slate-900/20 border-t-slate-900 rounded-full animate-spin"></div>
                ) : (
                   <><span className="text-xl md:text-2xl group-hover/btn:rotate-12 transition-transform duration-500">🧠</span> Core Analysis</>
                )}
               </button>
               <button onClick={() => navigate('/nutri-scan')} className="w-full sm:w-auto px-10 py-6 md:px-12 md:py-8 bg-white/5 border border-white/10 text-white rounded-[2rem] md:rounded-[2.5rem] font-black text-xs md:text-sm uppercase tracking-[0.4em] hover:bg-white/10 transition-all flex items-center justify-center gap-4 md:gap-5 group">
                  Optical Scan
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" className="group-hover:rotate-90 transition-transform duration-500"><circle cx="12" cy="12" r="10"/><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
               </button>
            </footer>
          </div>
        </section>

        <aside className="xl:col-span-3 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-6 md:gap-8">
           <div className="bg-white dark:bg-slate-900 p-8 md:p-10 rounded-[3rem] md:rounded-[4rem] border border-slate-100 dark:border-white/5 shadow-sm group overflow-hidden relative flex flex-col justify-between transition-all duration-500 hover:shadow-2xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-sky-50 dark:bg-sky-500/5 rounded-full translate-x-1/2 -translate-y-1/2 group-hover:scale-150 transition-transform duration-1000"></div>
              <div className="space-y-1 relative z-10">
                 <h4 className="text-[10px] font-black text-sky-500 uppercase tracking-[0.4em]">Rapid Sync</h4>
                 <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Fluid Entry</p>
              </div>
              <div className="grid grid-cols-2 gap-2 md:gap-3 relative z-10 my-6 md:my-8">
                 {[150, 250, 350, 500].map(v => (
                    <button key={v} onClick={() => handleQuickFluid(v)} className="p-4 md:p-5 bg-slate-50 dark:bg-white/5 rounded-2xl md:rounded-3xl text-[10px] md:text-[11px] font-black hover:bg-slate-950 hover:text-white dark:hover:bg-white dark:hover:text-slate-950 transition-all border border-transparent hover:border-sky-500/30">+{v}ml</button>
                 ))}
              </div>
              <Link to="/fluid" className="w-full py-4 bg-slate-950 dark:bg-white text-white dark:text-slate-950 rounded-2xl text-[9px] font-black uppercase tracking-widest text-center shadow-lg hover:bg-sky-500 dark:hover:bg-sky-400 transition-all">Registry Full Log</Link>
           </div>

           <div className="bg-slate-900 p-8 md:p-10 rounded-[3.5rem] text-white shadow-3xl relative overflow-hidden group border border-white/5">
              <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/10 rounded-full translate-x-1/2 -translate-y-1/2"></div>
              <div className="space-y-1">
                 <h4 className="text-[10px] font-black text-pink-400 uppercase tracking-[0.4em]">Next Cycle</h4>
                 <p className="text-2xl font-black text-white">Tomorrow</p>
              </div>
              <div className="mt-6 md:mt-8 flex items-center gap-4">
                 <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 group-hover:rotate-12 transition-transform">
                    <ICONS.Activity className="w-6 h-6 text-pink-500" />
                 </div>
                 <div>
                    <p className="text-lg font-bold">08:00 AM</p>
                    <p className="text-[9px] font-black uppercase text-white/30 tracking-widest">Home Hemodialysis</p>
                 </div>
              </div>
           </div>
        </aside>
      </div>

      {/* Intelligent Diagnostic Feed */}
      {insight && (
        <div className="mx-2 sm:mx-0 p-8 md:p-12 lg:p-16 bg-gradient-to-br from-indigo-600 via-sky-600 to-indigo-800 rounded-[3rem] md:rounded-[5rem] text-white shadow-4xl animate-in zoom-in-95 duration-1000 flex flex-col md:flex-row items-center gap-8 md:gap-12 relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-white/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none group-hover:scale-125 transition-transform duration-[8s]"></div>
           <div className="w-20 h-20 md:w-36 md:h-36 bg-white/10 backdrop-blur-2xl rounded-[2.5rem] md:rounded-[4rem] flex items-center justify-center text-4xl md:text-6xl shadow-2xl group-hover:rotate-12 transition-transform shrink-0 border border-white/20">
             ✨
           </div>
           <div className="flex-1 space-y-4 md:space-y-6 relative z-10 text-center md:text-left">
              <div className="flex items-center gap-6 justify-center md:justify-start">
                 <h4 className="text-[9px] md:text-[11px] font-black text-sky-200 uppercase tracking-[0.4em] md:tracking-[0.6em]">Intelligence Synthesis</h4>
                 <div className="h-px flex-1 bg-white/10 hidden md:block"></div>
              </div>
              <p className="text-xl md:text-3xl lg:text-5xl font-bold leading-tight italic tracking-tighter text-white">"{insight}"</p>
           </div>
           <button onClick={() => setInsight(null)} className="p-4 md:p-6 bg-white/10 hover:bg-rose-500 hover:text-white rounded-full transition-all relative z-10 shrink-0 border border-white/10 shadow-2xl group/close">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" className="group-hover/close:rotate-90 transition-transform"><path d="M18 6L6 18M6 6l12 12"/></svg>
           </button>
        </div>
      )}

      {/* Biometric Control Nodes */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 md:gap-8 px-2 sm:px-0">
        {/* Vitals Node */}
        <div className="bg-white dark:bg-slate-900 p-8 md:p-10 rounded-[3rem] md:rounded-[4.5rem] border border-slate-100 dark:border-white/10 shadow-sm group hover:shadow-2xl transition-all duration-700 flex flex-col justify-between min-h-[300px] md:min-h-[350px]">
           <div className="flex justify-between items-start">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-sky-50 dark:bg-sky-500/10 text-sky-500 rounded-2xl md:rounded-[1.5rem] flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                 <ICONS.Activity className="w-7 h-7 md:w-8 md:h-8" />
              </div>
              <span className="text-[8px] md:text-[9px] font-black px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full uppercase tracking-widest border border-emerald-500/10">Optimal</span>
           </div>
           <div className="space-y-4 md:space-y-6">
              <div className="space-y-1">
                 <h3 className="text-slate-400 dark:text-slate-500 text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em]">Pressure</h3>
                 <div className="flex items-baseline gap-2">
                    <span className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tighter tabular-nums">{latestBP ? `${latestBP.value1}/${latestBP.value2}` : '--'}</span>
                    <span className="text-xs font-bold text-slate-200 dark:text-slate-700 uppercase tracking-widest">mmHg</span>
                 </div>
              </div>
           </div>
        </div>

        {/* Volume Level Node */}
        <div className="bg-slate-950 dark:bg-slate-900 p-8 md:p-10 rounded-[3rem] md:rounded-[4.5rem] text-white shadow-3xl flex flex-col justify-between min-h-[300px] md:min-h-[350px] border border-white/5 relative overflow-hidden">
           <div className="flex justify-between items-center relative z-10">
              <h3 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Volume</h3>
              <span className={`text-[10px] font-black tracking-widest ${fluidPercentage > 90 ? 'text-rose-400' : 'text-sky-400'}`}>{fluidPercentage}%</span>
           </div>
           
           <div className="flex items-center gap-6 md:gap-8 relative z-10">
              <div className="flex-1 space-y-2">
                 <div className="flex items-baseline gap-2">
                    <span className="text-5xl md:text-7xl font-black tabular-nums">{todayFluid}</span>
                    <span className="text-lg font-bold text-white/20 uppercase">ml</span>
                 </div>
              </div>
              <div className="w-12 h-32 md:w-16 md:h-40 bg-white/5 rounded-2xl md:rounded-3xl border border-white/10 p-1 flex flex-col justify-end overflow-hidden">
                 <div 
                   className={`w-full rounded-xl md:rounded-2xl transition-all duration-[2s] ${fluidPercentage > 90 ? 'bg-rose-500' : 'bg-sky-500'}`}
                   style={{ height: `${fluidPercentage}%` }}
                 ></div>
              </div>
           </div>
        </div>

        {/* Weight Stability Node */}
        <div className="bg-white dark:bg-slate-900 p-8 md:p-10 rounded-[3rem] md:rounded-[4.5rem] border border-slate-100 dark:border-white/10 shadow-sm group hover:shadow-2xl transition-all duration-700 flex flex-col justify-between min-h-[300px] md:min-h-[350px]">
           <div className="flex justify-between items-start">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-pink-50 dark:bg-pink-500/10 text-pink-500 rounded-2xl md:rounded-[1.5rem] flex items-center justify-center shadow-inner group-hover:rotate-12 transition-transform">
                 <ICONS.Scale className="w-7 h-7 md:w-8 md:h-8" />
              </div>
              <span className="text-[10px] font-black text-slate-900 dark:text-white tabular-nums">-0.4 kg</span>
           </div>
           <div className="space-y-1">
              <h3 className="text-slate-400 dark:text-slate-500 text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em]">Mass</h3>
              <div className="flex items-baseline gap-2">
                 <span className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tighter tabular-nums">{currentWeight}</span>
                 <span className="text-lg font-bold text-slate-200 dark:text-slate-700 uppercase tracking-widest">kg</span>
              </div>
           </div>
        </div>

        {/* Adherence Node */}
        <div className="bg-slate-50 dark:bg-white/5 p-8 md:p-10 rounded-[3rem] md:rounded-[4.5rem] border border-slate-100 dark:border-white/5 flex flex-col justify-between min-h-[300px] md:min-h-[350px] transition-colors relative group">
           <div className="flex justify-between items-start">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl md:rounded-[1.5rem] flex items-center justify-center shadow-md group-hover:scale-110">
                 <ICONS.Pill className="w-7 h-7 md:w-8 md:h-8" />
              </div>
              <div className="w-3 h-3 md:w-4 md:h-4 rounded-full bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)] animate-pulse"></div>
           </div>
           <div className="space-y-4 md:space-y-6">
              <h3 className="text-slate-400 dark:text-slate-500 text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em]">Adherence</h3>
              <p className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">Dosing <br/> Node</p>
           </div>
        </div>
      </section>

      {/* Advanced Analytic Terminal */}
      <div className="mx-2 sm:mx-0 bg-white dark:bg-slate-900 p-6 md:p-12 lg:p-14 rounded-[3rem] md:rounded-[5rem] border border-slate-100 dark:border-white/10 shadow-sm flex flex-col min-h-[450px] md:min-h-[600px] transition-colors overflow-hidden relative">
           <div className="absolute top-0 right-0 w-40 md:w-80 h-40 md:h-80 bg-slate-50 dark:bg-white/5 rounded-full translate-x-1/2 -translate-y-1/2"></div>
           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12 md:mb-16 px-2 relative z-10">
              <div>
                 <h3 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">Mass Trajectory</h3>
                 <p className="text-[10px] md:text-[11px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.4em] mt-3 px-1">Inter-Dialytic Period Node</p>
              </div>
           </div>
           
           <div className="flex-1 w-full relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={weightData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                    <defs>
                       <linearGradient id="mainWeightGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#DB2777" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#DB2777" stopOpacity={0}/>
                       </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="16 16" vertical={false} stroke="currentColor" className="text-slate-100 dark:text-white/5" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} dy={15} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} domain={['dataMin - 0.5', 'dataMax + 0.5']} />
                    <Tooltip 
                      contentStyle={{borderRadius: '24px', border: 'none', backgroundColor: '#020617', color: '#fff', padding: '16px', fontWeight: 900, fontSize: '12px'}} 
                      cursor={{stroke: '#DB2777', strokeWidth: 2}}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="weight" 
                      stroke="#DB2777" 
                      // Fixed invalid JSX responsive prop attempt: removed md:strokeWidth={10}
                      strokeWidth={6} 
                      fillOpacity={1} 
                      fill="url(#mainWeightGrad)" 
                      // Fixed syntax error and invalid object structure in dot prop: removed md keys and double colon
                      dot={{r: 6, fill: '#fff', strokeWidth: 4, stroke: '#DB2777'}} 
                      animationDuration={3000}
                    />
                 </AreaChart>
              </ResponsiveContainer>
           </div>
      </div>

      <style>{`
        .shadow-4xl { box-shadow: 0 60px 150px -30px rgba(0,0,0,0.5); }
        .cubic-bezier { transition-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1); }
        .tabular-nums { font-variant-numeric: tabular-nums; }
      `}</style>
    </div>
  );
};

export default Dashboard;
