import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { ICONS, COLORS } from '../constants';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const WeightLog: React.FC = () => {
  const { weights, addWeight, profile, sessions } = useStore();
  const [newValue, setNewValue] = useState('75.0');
  const [newType, setNewType] = useState<'morning' | 'pre-dialysis' | 'post-dialysis'>('morning');
  const [timeRange, setTimeRange] = useState<'10' | '30' | '180'>('10');

  const currentWeight = weights[0]?.value || profile.weightGoal;
  const previousWeight = weights[1]?.value || currentWeight;
  const weightDiff = currentWeight - previousWeight;
  
  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newValue) return;
    addWeight({
      id: Date.now().toString(),
      date: new Date().toISOString(),
      value: parseFloat(newValue),
      type: newType
    });
  };

  const chartData = useMemo(() => {
    const days = parseInt(timeRange);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    return [...weights]
      .filter(w => new Date(w.date) >= cutoff)
      .reverse()
      .map(w => ({
        date: new Date(w.date).toLocaleDateString(undefined, { 
          month: 'short', 
          day: 'numeric'
        }),
        value: w.value,
        type: w.type
      }));
  }, [weights, timeRange]);

  // NEW: Specialized 7-Day Weekly Velocity Data
  const weeklyData = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);

    return [...weights]
      .filter(w => new Date(w.date) >= cutoff)
      .reverse()
      .map(w => ({
        date: new Date(w.date).toLocaleDateString(undefined, { weekday: 'short' }),
        weight: w.value
      }));
  }, [weights]);

  const goalProgress = Math.min(Math.max(((profile.weightGoal - 10) / (currentWeight - 10)) * 100, 0), 100);

  // DRY WEIGHT CONFIDENCE LOGIC
  const confidenceData = useMemo(() => {
    const postWeights = weights
      .filter(w => w.type === 'post-dialysis')
      .slice(0, 5);
    
    if (postWeights.length < 3) return { status: 'Calibrating', level: 'Pending Data', color: 'text-slate-400', bg: 'bg-slate-50 dark:bg-white/5', icon: '⏳', desc: 'Add 3+ post-dialysis weights to initialize meter.' };

    const avg = postWeights.reduce((acc, w) => acc + w.value, 0) / postWeights.length;
    const deviation = Math.abs(avg - profile.weightGoal);

    if (deviation <= 0.5) {
      return { 
        status: 'Stable', 
        level: 'Clinical High', 
        color: 'text-emerald-500', 
        bg: 'bg-emerald-50/50 dark:bg-emerald-500/10',
        border: 'border-emerald-100 dark:border-emerald-500/20', 
        icon: '✅', 
        desc: 'Weight targets are being met with high longitudinal precision.' 
      };
    } else if (deviation <= 1.2) {
      return { 
        status: 'Needs Review', 
        level: 'Moderate Drift', 
        color: 'text-amber-500', 
        bg: 'bg-amber-50/50 dark:bg-amber-500/10',
        border: 'border-amber-100 dark:border-amber-500/20', 
        icon: '🟡', 
        desc: 'Average post-weight varies from target. Consult your clinic.' 
      };
    } else {
      return { 
        status: 'Likely Off', 
        level: 'Significant Variance', 
        color: 'text-rose-500', 
        bg: 'bg-rose-50/50 dark:bg-rose-500/10',
        border: 'border-rose-100 dark:border-rose-500/20', 
        icon: '🔴', 
        desc: 'Significant clinical drift detected. Urgent review suggested.' 
      };
    }
  }, [weights, profile.weightGoal]);

  return (
    <div className="space-y-8 md:space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20 transition-colors duration-500">
      {/* Header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div className="space-y-2 text-left">
          <div className="flex items-center gap-3">
             <span className="px-3 py-1 bg-white dark:bg-white/5 text-slate-500 dark:text-slate-400 text-[9px] font-black uppercase tracking-widest rounded-lg border border-slate-100 dark:border-white/10 shadow-sm transition-colors">Biometric Analytics</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Weight Analysis</h2>
          <p className="text-slate-500 dark:text-slate-500 max-w-md font-medium text-base md:text-lg">Monitor dry weight accuracy and inter-dialytic variation.</p>
        </div>

        <div className="bg-white dark:bg-slate-900 px-6 md:px-8 py-4 md:py-5 rounded-2xl md:rounded-[1.5rem] border border-slate-100 dark:border-white/10 shadow-sm flex items-center gap-4 md:gap-5 transition-colors">
           <div className="w-10 h-10 md:w-12 md:h-12 bg-pink-50 dark:bg-pink-500/10 text-pink-500 rounded-xl md:rounded-2xl flex items-center justify-center transition-colors">
              <ICONS.Scale className="w-5 h-5 md:w-6 md:h-6" />
           </div>
           <div>
              <p className="text-[8px] md:text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest transition-colors">Dry Weight</p>
              <p className="text-lg md:text-xl font-black text-slate-900 dark:text-white transition-colors">{profile.weightGoal} <span className="text-[10px] opacity-30 font-bold uppercase">kg</span></p>
           </div>
        </div>
      </section>

      {/* Stats Summary Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
        <div className={`p-8 md:p-10 rounded-[3.5rem] border transition-all duration-700 flex flex-col justify-between group overflow-hidden relative ${confidenceData.bg} ${confidenceData.border || 'border-slate-100 dark:border-white/5'}`}>
           <div className="absolute top-[-20px] right-[-20px] text-6xl opacity-10 group-hover:scale-125 transition-transform duration-700">{confidenceData.icon}</div>
           <div>
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Clinical Confidence</p>
              <h4 className={`text-3xl font-black tracking-tight ${confidenceData.color}`}>{confidenceData.status}</h4>
              <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 mt-2 uppercase tracking-tighter">{confidenceData.level}</p>
           </div>
           <p className="text-xs font-bold text-slate-600 dark:text-slate-300 leading-relaxed mt-4 italic transition-colors">
              "{confidenceData.desc}"
           </p>
        </div>

        <div className="bg-slate-900 dark:bg-slate-900 p-8 md:p-10 rounded-3xl md:rounded-[3.5rem] text-white shadow-xl relative overflow-hidden group border border-white/5 transition-colors">
           <p className="text-[9px] md:text-[10px] font-black text-orange-400 uppercase tracking-widest mb-4 transition-colors">Current weight</p>
           <div className="flex items-baseline gap-2">
              <span className="text-5xl md:text-6xl font-black tabular-nums transition-colors">{currentWeight}</span>
              <span className="text-lg md:text-xl font-bold opacity-30 uppercase transition-colors">kg</span>
           </div>
           <div className="mt-6 flex items-center gap-3">
              <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${weightDiff <= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-pink-500/20 text-pink-400'}`}>
                {weightDiff > 0 ? '↑' : '↓'} {Math.abs(weightDiff).toFixed(1)} kg
              </span>
           </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 md:p-10 rounded-3xl md:rounded-[3.5rem] border border-slate-100 dark:border-white/10 shadow-sm flex flex-col justify-between transition-colors">
           <div className="flex justify-between items-start mb-6 md:mb-8">
              <div>
                 <h4 className="font-black text-slate-900 dark:text-white uppercase text-[10px] md:text-xs tracking-widest mb-1 px-1 transition-colors">Longitudinal Accuracy</h4>
                 <p className="text-slate-400 dark:text-slate-600 text-xs md:text-sm font-medium px-1 transition-colors">Proximity to Dry Target</p>
              </div>
           </div>
           <div className="space-y-6">
              <div className="h-4 bg-slate-50 dark:bg-white/5 rounded-full border border-slate-100 dark:border-white/5 overflow-hidden p-1 relative transition-colors">
                 <div 
                   className="h-full bg-gradient-to-r from-orange-400 via-pink-500 to-sky-500 rounded-full transition-all duration-1000 shadow-lg" 
                   style={{ width: `${goalProgress}%` }}
                 ></div>
              </div>
              <div className="flex justify-between px-2">
                 <span className="text-[8px] md:text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest transition-colors">Calibrated</span>
                 <span className="text-[8px] md:text-[10px] font-black text-sky-400 dark:text-sky-500 uppercase tracking-widest transition-colors">{currentWeight} kg</span>
              </div>
           </div>
        </div>
      </section>

      {/* Inputs & Trends Section */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 md:gap-10">
        <div className="xl:col-span-4 space-y-8">
          {/* Record Input Card */}
          <div className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-3xl md:rounded-[4rem] border border-slate-100 dark:border-white/10 shadow-sm transition-colors">
             <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-8 transition-colors">Record Weight</h3>
             <form onSubmit={handleAdd} className="space-y-8 md:space-y-10">
                <div className="p-8 md:p-10 bg-slate-50 dark:bg-white/5 rounded-3xl md:rounded-[3rem] border border-slate-100 dark:border-white/10 text-center transition-colors">
                   <div className="flex items-center justify-center gap-4 md:gap-6">
                      <button type="button" onClick={() => setNewValue((prev) => (parseFloat(prev) - 0.1).toFixed(1))} className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/10 text-slate-300 dark:text-slate-600 font-black text-2xl shadow-sm transition-all hover:text-sky-500 focus:outline-none">-</button>
                      <input type="number" step="0.1" value={newValue} onChange={(e) => setNewValue(e.target.value)} className="w-24 md:w-32 bg-transparent text-4xl md:text-5xl font-black text-slate-900 dark:text-white outline-none text-center tabular-nums transition-colors" />
                      <button type="button" onClick={() => setNewValue((prev) => (parseFloat(prev) + 0.1).toFixed(1))} className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/10 text-slate-300 dark:text-slate-600 font-black text-2xl shadow-sm transition-all hover:text-sky-500 focus:outline-none">+</button>
                   </div>
                   <p className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 dark:text-slate-600 mt-4 tracking-widest transition-colors">recorded mass (kg)</p>
                </div>

                <div className="grid grid-cols-1 gap-2">
                   {(['morning', 'pre-dialysis', 'post-dialysis'] as const).map((type) => (
                      <button key={type} type="button" onClick={() => setNewType(type)} className={`p-4 md:p-5 rounded-xl md:rounded-2xl text-left border transition-all flex items-center justify-between group ${newType === type ? 'bg-slate-900 dark:bg-white border-slate-900 dark:border-white text-white dark:text-slate-950 shadow-lg' : 'bg-white dark:bg-slate-800/50 border-slate-100 dark:border-white/10 text-slate-500 dark:text-slate-500 hover:border-pink-200 dark:hover:border-pink-500/50'}`}>
                         <span className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest ${newType === type ? 'text-white dark:text-slate-950' : 'text-slate-500'}`}>{type.replace('-', ' ')}</span>
                         <ICONS.Scale className={`w-4 h-4 transition-colors ${newType === type ? 'text-pink-400' : 'text-slate-200 dark:text-slate-800'}`} />
                      </button>
                   ))}
                </div>

                <button type="submit" className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-950 py-5 md:py-6 rounded-2xl md:rounded-[2.5rem] font-black text-xs md:text-sm uppercase tracking-widest shadow-xl hover:bg-pink-600 dark:hover:bg-pink-500 dark:hover:text-white transition-all active:scale-95 transition-colors">Commit to Ledger</button>
             </form>
          </div>

          {/* NEW: Weekly Velocity Node (LineChart) */}
          <div className="bg-slate-950 dark:bg-slate-900 p-8 rounded-[3.5rem] text-white shadow-2xl border border-white/5 overflow-hidden group">
            <div className="flex justify-between items-center mb-6">
               <h4 className="text-[10px] font-black text-sky-400 uppercase tracking-[0.4em]">Velocity Node</h4>
               <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">7-Day Precision</span>
            </div>
            <div className="h-[150px] w-full">
              {weeklyData.length >= 2 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="10 10" vertical={false} stroke="rgba(255,255,255,0.03)" />
                    <XAxis dataKey="date" hide />
                    <YAxis hide domain={['dataMin - 0.5', 'dataMax + 0.5']} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', backgroundColor: '#020617', color: '#fff', fontSize: '10px', fontWeight: 900 }} 
                      itemStyle={{ color: '#0EA5E9' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="weight" 
                      stroke="#0EA5E9" 
                      strokeWidth={4} 
                      dot={{ r: 4, fill: '#0EA5E9', strokeWidth: 0 }} 
                      activeDot={{ r: 6, strokeWidth: 0 }}
                      animationDuration={2000}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-[10px] font-black text-white/10 uppercase tracking-widest">Awaiting Calibration</div>
              )}
            </div>
          </div>
        </div>

        <div className="xl:col-span-8 bg-white dark:bg-slate-900 p-8 md:p-12 rounded-3xl md:rounded-[4rem] border border-slate-100 dark:border-white/10 shadow-sm flex flex-col min-h-[400px] transition-colors">
           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8 md:mb-12 px-2">
              <div>
                 <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight transition-colors">Biometric Trends</h3>
                 <p className="text-[9px] md:text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest mt-1 transition-colors">Weight stability trajectory</p>
              </div>
              
              <div className="flex bg-slate-50 dark:bg-white/5 p-1 rounded-xl md:rounded-2xl border border-slate-100 dark:border-white/5 transition-colors">
                {[
                  { id: '10', label: '10D' },
                  { id: '30', label: '30D' },
                  { id: '180', label: '6M' }
                ].map(range => (
                  <button 
                    key={range.id}
                    onClick={() => setTimeRange(range.id as any)}
                    className={`px-4 md:px-6 py-2 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${timeRange === range.id ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-md scale-105' : 'text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400'}`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
           </div>

           <div className="flex-1 w-full h-[300px] md:h-auto">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="weightBrand" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#EC4899" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#EC4899" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="currentColor" className="text-slate-100 dark:text-white/5" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 9, fontWeight: 900}} dy={15} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 9, fontWeight: 900}} domain={['dataMin - 1', 'dataMax + 1']} />
                      <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', backgroundColor: '#020617', color: '#fff', boxShadow: '0 25px 50px -12px rgba(236,72,153,0.15)', padding: '12px', fontWeight: 900, fontSize: '10px' }} />
                      <Area type="monotone" dataKey="value" stroke="#EC4899" strokeWidth={5} fillOpacity={1} fill="url(#weightBrand)" dot={chartData.length < 20 ? { r: 5, fill: '#fff', strokeWidth: 3, stroke: '#EC4899' } : false} activeDot={{ r: 8, fill: '#EC4899', strokeWidth: 0 }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center opacity-20 text-center space-y-4 transition-opacity">
                  <ICONS.Scale className="w-12 h-12 dark:text-slate-400" />
                  <p className="text-xs font-black uppercase tracking-widest dark:text-slate-600">Not enough data points</p>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default WeightLog;
