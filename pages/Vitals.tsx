import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { VitalType, VitalLog } from '../types';
import { ICONS } from '../constants';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const Vitals: React.FC = () => {
  const { vitals, addVital, profile, sessions } = useStore();
  const [selectedType, setSelectedType] = useState<VitalType>(VitalType.BLOOD_PRESSURE);
  const [val1, setVal1] = useState<string>('120');
  const [val2, setVal2] = useState<string>('80');
  const [customUnit, setCustomUnit] = useState<string>('');
  const [loggedAt, setLoggedAt] = useState<string>(new Date().toISOString().slice(0, 16));
  const [notes, setNotes] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [isLogging, setIsLogging] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Visibility toggles for the chart
  const [visibleSeries, setVisibleSeries] = useState({
    bp: true, hr: true, temp: true, spo2: true
  });

  const defaultUnit = useMemo(() => {
    switch (selectedType) {
      case VitalType.BLOOD_PRESSURE: return 'mmHg';
      case VitalType.HEART_RATE: return 'bpm';
      case VitalType.TEMPERATURE: return profile.settings.units === 'metric' ? '°C' : '°F';
      case VitalType.SPO2: return '%';
      default: return '';
    }
  }, [selectedType, profile.settings.units]);

  const handleAddVital = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLogging(true);
    setTimeout(() => {
      addVital({
        id: Date.now().toString(),
        loggedAt: new Date(loggedAt).toISOString(),
        type: selectedType,
        value1: parseFloat(val1),
        value2: selectedType === VitalType.BLOOD_PRESSURE ? parseFloat(val2) : undefined,
        unit: customUnit || defaultUnit,
        notes: notes,
        sessionId: selectedSessionId || undefined
      });
      setNotes('');
      setCustomUnit('');
      setSelectedSessionId('');
      setLoggedAt(new Date().toISOString().slice(0, 16));
      setIsLogging(false);
    }, 600);
  };

  const getBPStatus = (sys: number, dia: number) => {
    const t = profile.settings.bpThresholds;
    if (sys >= t.stage2Sys || dia >= t.stage2Dia) return { label: 'Hypertension Stage 2', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-500/10', border: 'border-rose-200 dark:border-rose-500/30' };
    if (sys >= t.stage1Sys || dia >= t.stage1Dia) return { label: 'Hypertension Stage 1', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-500/10', border: 'border-orange-200 dark:border-orange-500/30' };
    if (sys >= t.elevatedSys) return { label: 'Elevated', color: 'text-amber-500 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-200 dark:border-amber-500/30' };
    return { label: 'Normal', color: 'text-emerald-500 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/30' };
  };

  /**
   * Refactored chart data to group multiple vital types by timestamp for simultaneous plotting
   */
  const chartData = useMemo(() => {
    const grouped = vitals.reduce((acc, v) => {
      const dateObj = new Date(v.loggedAt);
      const timeKey = dateObj.toLocaleString([], { 
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
      });
      
      if (!acc[timeKey]) {
        acc[timeKey] = { time: timeKey, timestamp: dateObj.getTime() };
      }
      
      if (v.type === VitalType.BLOOD_PRESSURE) {
        acc[timeKey].systolic = v.value1;
        acc[timeKey].diastolic = v.value2;
      } else if (v.type === VitalType.HEART_RATE) {
        acc[timeKey].heartRate = v.value1;
      } else if (v.type === VitalType.TEMPERATURE) {
        acc[timeKey].temp = v.value1;
      } else if (v.type === VitalType.SPO2) {
        acc[timeKey].spo2 = v.value1;
      }
      return acc;
    }, {} as Record<string, any>);

    return Object.values(grouped)
      .sort((a: any, b: any) => a.timestamp - b.timestamp)
      .slice(-20);
  }, [vitals]);

  const latestBP = useMemo(() => vitals.find(v => v.type === VitalType.BLOOD_PRESSURE), [vitals]);
  
  const latestVitals = useMemo(() => {
    const latest: Partial<Record<VitalType, VitalLog>> = {};
    vitals.forEach(v => { if (!latest[v.type]) latest[v.type] = v; });
    return latest;
  }, [vitals]);

  const mapCalculation = useMemo(() => {
    if (!latestBP || !latestBP.value2) return null;
    return Math.round(((2 * latestBP.value2) + latestBP.value1) / 3);
  }, [latestBP]);

  const toggleExpand = (id: string) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  // Improved BP Alert Dot
  const BPChartDot = (props: any) => {
    const { cx, cy, payload, dataKey } = props;
    if (!cx || !cy) return null;
    const t = profile.settings.bpThresholds;
    const val = payload[dataKey];
    let isAlert = false;
    
    if (dataKey === 'systolic') isAlert = val >= t.stage1Sys;
    else if (dataKey === 'diastolic') isAlert = val >= t.stage1Dia;

    return (
      <circle 
        cx={cx} cy={cy} r={isAlert ? 7 : 5} 
        fill={isAlert ? '#f43f5e' : (dataKey === 'systolic' ? '#0EA5E9' : '#38BDF8')} 
        stroke="white" strokeWidth={isAlert ? 3 : 2} 
        className={isAlert ? 'animate-pulse' : ''}
      />
    );
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20 transition-colors duration-500">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 px-2">
        <div className="space-y-2">
           <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-sky-100 dark:border-sky-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse"></span>
              Recent Health Checks
           </div>
           <h2 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tighter transition-colors">Vitals Hub</h2>
           <p className="text-slate-400 dark:text-slate-500 font-medium text-lg transition-colors">Comprehensive clinical telemetry and biometric tracking.</p>
        </div>
      </div>

      {/* Blood Pressure Analytics Hero */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-8 bg-slate-900 dark:bg-slate-900 p-10 lg:p-14 rounded-[4rem] text-white shadow-3xl relative overflow-hidden flex flex-col justify-between min-h-[400px] group transition-colors border border-white/5">
           <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:scale-110 transition-transform duration-[3s]"></div>
           
           <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
              <div className="space-y-6">
                 <div className="flex items-center gap-4">
                    <span className="px-4 py-1.5 bg-white/10 text-sky-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-white/10">Pressure Calibration</span>
                 </div>
                 <div className="space-y-1">
                    <h3 className="text-xl font-bold text-white/50 dark:text-slate-500 uppercase tracking-[0.3em]">Latest Reading</h3>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-6 mt-4">
                       <div className="flex items-baseline gap-4">
                          <span className="text-8xl font-black tracking-tighter tabular-nums text-white transition-all group-hover:text-sky-400">
                             {latestBP ? `${latestBP.value1}/${latestBP.value2}` : '--'}
                          </span>
                       </div>
                       <div className="flex flex-col gap-3">
                          <span className="text-2xl font-black text-white/20 uppercase tracking-widest">mmHg</span>
                          {latestBP && (
                             <span className={`px-5 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-3 border shadow-xl animate-in slide-in-from-left-4 duration-700 ${getBPStatus(latestBP.value1, latestBP.value2 || 0).bg} ${getBPStatus(latestBP.value1, latestBP.value2 || 0).color} ${getBPStatus(latestBP.value1, latestBP.value2 || 0).border}`}>
                                <div className="w-2 h-2 rounded-full bg-current animate-pulse"></div>
                                {getBPStatus(latestBP.value1, latestBP.value2 || 0).label}
                             </span>
                          )}
                       </div>
                    </div>
                 </div>
              </div>

              <div className="flex flex-col items-center gap-4">
                 <div className="w-32 h-32 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center shadow-2xl transition-transform hover:scale-105">
                    <span className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-1">MAP</span>
                    <span className="text-4xl font-black tabular-nums text-white">{mapCalculation || '--'}</span>
                    <span className="text-[8px] font-bold text-white/20 uppercase mt-1">Mean Arterial</span>
                 </div>
              </div>
           </div>

           <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-6 pt-12 border-t border-white/5">
              <div className="space-y-1">
                 <span className="text-[9px] font-black text-white/30 dark:text-slate-600 uppercase tracking-widest">Target Sys</span>
                 <p className="text-xl font-black text-white">{profile.settings.bpThresholds.normalSys} <span className="text-[10px] opacity-30 font-bold uppercase ml-1">mmHg</span></p>
              </div>
              <div className="space-y-1">
                 <span className="text-[9px] font-black text-white/30 dark:text-slate-600 uppercase tracking-widest">Target Dia</span>
                 <p className="text-xl font-black text-white">{profile.settings.bpThresholds.normalDia} <span className="text-[10px] opacity-30 font-bold uppercase ml-1">mmHg</span></p>
              </div>
              <div className="space-y-1">
                 <span className="text-[9px] font-black text-white/30 dark:text-slate-600 uppercase tracking-widest">Variation</span>
                 <p className="text-xl font-black text-white">{latestBP && latestBP.value2 ? (latestBP.value1 - latestBP.value2) : '--'} <span className="text-[10px] opacity-30 font-bold uppercase ml-1">mmHg</span></p>
              </div>
              <div className="space-y-1 text-right">
                 <span className="text-[9px] font-black text-sky-400 uppercase tracking-widest">Archived</span>
                 <p className="text-sm font-bold text-white/50">{latestBP ? new Date(latestBP.loggedAt).toLocaleDateString() : 'No Data'}</p>
              </div>
           </div>
        </div>

        <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-10 rounded-[4rem] border border-slate-100 dark:border-white/10 shadow-xl flex flex-col justify-between space-y-8 transition-colors">
           <div>
              <h4 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Protocol Reference</h4>
              <p className="text-slate-400 dark:text-slate-500 text-xs font-medium leading-relaxed italic transition-colors">"Configured thresholds derived from patient settings ensure clinical visibility into drift."</p>
           </div>
           
           <div className="space-y-4">
              {[
                { label: 'Normal', range: `<${profile.settings.bpThresholds.normalSys}/${profile.settings.bpThresholds.normalDia}`, color: 'bg-emerald-500' },
                { label: 'Elevated', range: `${profile.settings.bpThresholds.elevatedSys}+`, color: 'bg-amber-500' },
                { label: 'Stage 1', range: `${profile.settings.bpThresholds.stage1Sys}+`, color: 'bg-orange-400' },
                { label: 'Stage 2', range: `${profile.settings.bpThresholds.stage2Sys}+`, color: 'bg-rose-600' }
              ].map(zone => (
                <div key={zone.label} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 transition-all hover:bg-white dark:hover:bg-white/10 hover:border-sky-100 dark:hover:border-sky-500/30 group">
                   <div className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full ${zone.color} shadow-lg group-hover:scale-125 transition-transform`}></div>
                      <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">{zone.label}</span>
                   </div>
                   <span className="text-[10px] font-black text-slate-300 dark:text-slate-600 tabular-nums transition-colors">{zone.range}</span>
                </div>
              ))}
           </div>
        </div>
      </section>

      {/* Main Content Matrix */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        
        {/* Input Form Column */}
        <div className="xl:col-span-4 bg-white dark:bg-slate-900 p-8 lg:p-12 rounded-[4rem] border border-slate-100 dark:border-white/10 shadow-xl relative overflow-hidden flex flex-col transition-colors">
           <div className="absolute top-0 right-0 w-32 h-32 bg-sky-50 dark:bg-sky-500/5 rounded-full translate-x-1/2 -translate-y-1/2 opacity-50 transition-colors"></div>
           <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-10 transition-colors">Add Node Entry</h3>
           
           <form onSubmit={handleAddVital} className="space-y-8 flex-1">
              <div className="grid grid-cols-2 gap-2">
                 {[VitalType.BLOOD_PRESSURE, VitalType.HEART_RATE, VitalType.TEMPERATURE, VitalType.SPO2].map(type => (
                    <button 
                      key={type} type="button" onClick={() => { setSelectedType(type); setCustomUnit(''); }}
                      className={`px-4 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all border ${selectedType === type ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 border-slate-900 dark:border-white shadow-lg' : 'bg-slate-50 dark:bg-white/5 text-slate-400 dark:text-slate-500 border-transparent hover:border-slate-200 dark:hover:border-white/10'}`}
                    >
                       {type}
                    </button>
                 ))}
              </div>

              <div className="p-8 bg-slate-50 dark:bg-white/5 rounded-[3rem] border border-slate-100 dark:border-white/5 text-center space-y-4 shadow-inner transition-colors">
                 <div className="flex items-center justify-center gap-4">
                    <input 
                      type="number" step="0.1" value={val1} onChange={e => setVal1(e.target.value)}
                      className="w-24 bg-transparent text-5xl font-black text-slate-900 dark:text-white text-center outline-none tabular-nums" 
                    />
                    {selectedType === VitalType.BLOOD_PRESSURE && (
                       <><span className="text-4xl font-black text-slate-200 dark:text-slate-800">/</span><input type="number" step="0.1" value={val2} onChange={e => setVal2(e.target.value)} className="w-24 bg-transparent text-5xl font-black text-slate-900 dark:text-white text-center outline-none tabular-nums" /></>
                    )}
                 </div>
                 <p className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">Recorded Magnitude ({defaultUnit})</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest ml-4 transition-colors">Unit</label>
                  <input 
                    type="text" 
                    value={customUnit || defaultUnit} 
                    onChange={e => setCustomUnit(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/10 rounded-2xl px-5 py-4 font-black text-slate-900 dark:text-white text-xs focus:ring-4 focus:ring-sky-50 dark:focus:ring-sky-500/10 transition-all outline-none shadow-sm"
                    placeholder={defaultUnit}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest ml-4 transition-colors">Timestamp</label>
                  <input 
                    type="datetime-local" 
                    value={loggedAt}
                    onChange={e => setLoggedAt(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/10 rounded-2xl px-5 py-4 font-black text-slate-900 dark:text-white text-[10px] focus:ring-4 focus:ring-sky-50 dark:focus:ring-sky-500/10 transition-all outline-none shadow-sm"
                  />
                </div>
              </div>

              <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest ml-4 transition-colors">Treatment Sync</label>
                    <select 
                      value={selectedSessionId} onChange={e => setSelectedSessionId(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/10 rounded-2xl px-6 py-4 font-bold text-slate-900 dark:text-white text-xs focus:ring-4 focus:ring-sky-50 dark:focus:ring-sky-500/10 transition-all outline-none cursor-pointer shadow-sm appearance-none"
                    >
                       <option value="" className="dark:bg-slate-900">Standard Daily Check</option>
                       {sessions.slice(0, 10).map(s => <option key={s.id} value={s.id} className="dark:bg-slate-900">{new Date(s.startTime).toLocaleDateString()} • {s.type}</option>)}
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest ml-4 transition-colors">Session Annotations</label>
                    <textarea 
                      value={notes} onChange={e => setNotes(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/10 rounded-2xl px-6 py-4 font-bold text-slate-900 dark:text-white text-sm focus:ring-4 focus:ring-sky-50 dark:focus:ring-sky-500/10 transition-all outline-none resize-none h-24 shadow-sm placeholder:text-slate-300 dark:placeholder:text-slate-700"
                      placeholder="Specify inter-dialytic symptoms..."
                    />
                 </div>
              </div>

              <button 
                type="submit" disabled={isLogging}
                className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-950 py-6 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl hover:bg-sky-600 dark:hover:bg-sky-500 transition-all active:scale-95 flex items-center justify-center gap-4 disabled:opacity-50"
              >
                 {isLogging ? <div className="w-5 h-5 border-2 border-white/20 border-t-white dark:border-slate-900/20 dark:border-t-slate-900 rounded-full animate-spin"></div> : 'Authorize Data Entry'}
              </button>
           </form>
        </div>

        {/* Analytics & Visualization Column */}
        <div className="xl:col-span-8 space-y-10">
           {/* Quick Stats Grid */}
           <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {[
                { type: VitalType.BLOOD_PRESSURE, label: 'BP Registry', icon: ICONS.Activity, color: 'sky' },
                { type: VitalType.HEART_RATE, label: 'Pulse Node', icon: (props: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" {...props}><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>, color: 'pink' },
                { type: VitalType.TEMPERATURE, label: 'Thermic Node', icon: (props: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" {...props}><path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/></svg>, color: 'orange' },
                { type: VitalType.SPO2, label: 'O2 Node', icon: (props: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" {...props}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>, color: 'emerald' }
              ].map(item => {
                 const v = latestVitals[item.type];
                 return (
                    <div key={item.type} className="bg-white dark:bg-slate-900 p-6 lg:p-8 rounded-[3rem] border border-slate-100 dark:border-white/10 shadow-sm group hover:shadow-xl transition-all hover:-translate-y-1">
                       <div className={`w-12 h-12 bg-${item.color}-50 dark:bg-${item.color}-500/10 text-${item.color}-500 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 group-hover:rotate-6`}>
                          <item.icon className="w-6 h-6" />
                       </div>
                       <span className="block text-[8px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest mb-1">{item.label}</span>
                       <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight tabular-nums transition-colors">{v ? (item.type === VitalType.BLOOD_PRESSURE ? `${v.value1}/${v.value2}` : v.value1) : '--'}</span>
                          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-600 uppercase transition-colors">{v?.unit || (item.type === VitalType.BLOOD_PRESSURE ? 'mmHg' : '')}</span>
                       </div>
                    </div>
                 );
              })}
           </div>

           {/* Refactored Multi-Axis History Chart */}
           <div className="bg-white dark:bg-slate-900 p-8 lg:p-12 rounded-[4rem] border border-slate-100 dark:border-white/10 shadow-sm transition-colors duration-500 overflow-hidden relative">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12 px-2 relative z-10">
                 <div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight transition-colors">Biometric Trajectory</h3>
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] mt-1 transition-colors">Synchronized multi-series analysis</p>
                 </div>
                 
                 {/* Enhanced Series Toggles */}
                 <div className="flex flex-wrap gap-2">
                    {[
                      { key: 'bp', label: 'BP', color: '#0EA5E9' },
                      { key: 'hr', label: 'Pulse', color: '#F97316' },
                      { key: 'temp', label: 'Temp', color: '#EC4899' },
                      { key: 'spo2', label: 'O2', color: '#10B981' }
                    ].map(btn => (
                       <button 
                         key={btn.key} onClick={() => setVisibleSeries(prev => ({ ...prev, [btn.key]: !prev[btn.key as keyof typeof visibleSeries] }))}
                         className={`px-5 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all flex items-center gap-3 ${visibleSeries[btn.key as keyof typeof visibleSeries] ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 border-slate-900 dark:border-white shadow-xl scale-105' : 'bg-slate-50 dark:bg-white/5 text-slate-400 dark:text-slate-500 border-slate-100 dark:border-white/10 hover:border-slate-200'}`}
                       >
                          <div className={`w-2 h-2 rounded-full transition-colors`} style={{ backgroundColor: visibleSeries[btn.key as keyof typeof visibleSeries] ? btn.color : '#cbd5e1' }}></div>
                          {btn.label}
                       </button>
                    ))}
                 </div>
              </div>

              <div className="h-[450px] w-full relative z-10">
                 <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                       <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="currentColor" className="text-slate-100 dark:text-white/5" />
                       <XAxis 
                        dataKey="time" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} 
                        dy={15} 
                       />
                       
                       {/* Primary Y-Axis for BP & Heart Rate (Range 40-220) */}
                       <YAxis 
                         yAxisId="high"
                         axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} 
                         domain={[40, 'auto']} 
                       />
                       
                       {/* Secondary Y-Axis for Temperature & SpO2 (Range 0-105 or 30-105) */}
                       <YAxis 
                         yAxisId="low"
                         orientation="right"
                         axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} 
                         domain={[30, 105]}
                         hide={!visibleSeries.temp && !visibleSeries.spo2}
                       />

                       <Tooltip 
                        contentStyle={{borderRadius: '24px', border: 'none', backgroundColor: '#020617', color: '#fff', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)', padding: '20px', fontWeight: 900, fontSize: '11px'}} 
                        itemStyle={{ padding: '2px 0' }}
                       />
                       
                       {/* Blood Pressure Lines */}
                       {visibleSeries.bp && (
                         <>
                           <ReferenceLine yAxisId="high" y={profile.settings.bpThresholds.normalSys} stroke="#0EA5E9" strokeDasharray="5 5" opacity={0.2} label={{ value: 'Target Sys', position: 'right', fill: '#0EA5E9', fontSize: 8, fontWeight: 900 }} />
                           <Line 
                            yAxisId="high" name="Systolic" type="monotone" dataKey="systolic" 
                            stroke="#0EA5E9" strokeWidth={5} dot={<BPChartDot dataKey="systolic" />} connectNulls 
                           />
                           <Line 
                            yAxisId="high" name="Diastolic" type="monotone" dataKey="diastolic" 
                            stroke="#38BDF8" strokeWidth={5} dot={<BPChartDot dataKey="diastolic" />} connectNulls 
                           />
                         </>
                       )}
                       
                       {/* Heart Rate Line */}
                       {visibleSeries.hr && (
                         <Line 
                          yAxisId="high" name="Pulse" type="monotone" dataKey="heartRate" 
                          stroke="#F97316" strokeWidth={5} dot={{r: 6, fill: '#F97316', strokeWidth: 4, stroke: '#fff'}} connectNulls 
                         />
                       )}
                       
                       {/* Temperature Line (Secondary Axis) */}
                       {visibleSeries.temp && (
                         <Line 
                          yAxisId="low" name="Temp" type="monotone" dataKey="temp" 
                          stroke="#EC4899" strokeWidth={5} dot={{r: 6, fill: '#EC4899', strokeWidth: 4, stroke: '#fff'}} connectNulls 
                         />
                       )}
                       
                       {/* SpO2 Line (Secondary Axis) */}
                       {visibleSeries.spo2 && (
                         <Line 
                          yAxisId="low" name="O2" type="monotone" dataKey="spo2" 
                          stroke="#10B981" strokeWidth={5} dot={{r: 6, fill: '#10B981', strokeWidth: 4, stroke: '#fff'}} connectNulls 
                         />
                       )}
                    </LineChart>
                 </ResponsiveContainer>
              </div>
           </div>
        </div>
      </div>

      {/* History Log Ledger */}
      <section className="space-y-10 pt-10 px-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 px-2">
           <div className="space-y-1">
              <h3 className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight transition-colors">Archival Ledger</h3>
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.4em] transition-colors">Historical biometric node verification</p>
           </div>
           <div className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-950 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-3 transition-colors">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
             Stored Nodes: {vitals.length}
           </div>
        </div>
        
        <div className="space-y-4">
           {vitals.length > 0 ? vitals.slice(0, 30).map((entry) => {
              const isExpanded = expandedLogId === entry.id;
              const session = sessions.find(x => x.id === entry.sessionId);
              
              let displayValue = entry.type === VitalType.BLOOD_PRESSURE ? `${entry.value1}/${entry.value2}` : entry.value1;
              let statusLabel = null;
              let statusClasses = "";
              
              if (entry.type === VitalType.BLOOD_PRESSURE) {
                 const status = getBPStatus(entry.value1, entry.value2 || 0);
                 statusLabel = status.label;
                 statusClasses = `${status.bg} ${status.color} ${status.border}`;
              }

              const typeIcon = {
                [VitalType.BLOOD_PRESSURE]: <ICONS.Activity className="w-5 h-5" />,
                [VitalType.HEART_RATE]: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-5 h-5"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>,
                [VitalType.TEMPERATURE]: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-5 h-5"><path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/></svg>,
                [VitalType.SPO2]: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-5 h-5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
              }[entry.type] || <ICONS.Activity className="w-5 h-5" />;

              return (
                 <div 
                   key={entry.id} 
                   className={`group bg-white dark:bg-slate-900 rounded-[2.5rem] border transition-all duration-500 overflow-hidden ${isExpanded ? 'border-sky-500 shadow-2xl scale-[1.01]' : 'border-slate-100 dark:border-white/5 shadow-sm hover:shadow-xl hover:border-sky-100 dark:hover:border-sky-500/30'}`}
                 >
                    <div 
                      className={`p-6 lg:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 cursor-pointer transition-colors ${isExpanded ? 'bg-slate-50/50 dark:bg-white/5' : ''}`}
                      onClick={() => toggleExpand(entry.id)}
                    >
                       <div className="flex items-center gap-6">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-500 ${isExpanded ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 rotate-6' : 'bg-slate-50 dark:bg-white/10 text-slate-400 dark:text-slate-500 group-hover:bg-sky-50 dark:group-hover:bg-sky-500/10 group-hover:text-sky-500 group-hover:scale-110'}`}>
                             {typeIcon}
                          </div>
                          <div>
                             <span className="block text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest mb-1 transition-colors">
                                {new Date(entry.loggedAt).toLocaleDateString()} • {new Date(entry.loggedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                             </span>
                             <h4 className="text-lg font-black text-slate-900 dark:text-white tracking-tight transition-colors">{entry.type}</h4>
                          </div>
                       </div>

                       <div className="flex flex-1 items-center justify-between md:justify-end gap-10">
                          <div className="text-right">
                             <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter tabular-nums transition-colors">{displayValue}</span>
                                <span className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase transition-colors">{entry.unit}</span>
                             </div>
                             {statusLabel && (
                                <span className={`inline-block px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border mt-1 transition-all ${statusClasses}`}>
                                   {statusLabel}
                                </span>
                             )}
                          </div>
                          
                          <button 
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isExpanded ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 rotate-180' : 'bg-slate-50 dark:bg-white/5 text-slate-400 dark:text-slate-600 group-hover:bg-sky-50 dark:group-hover:bg-sky-500/10 group-hover:text-sky-600'}`}
                          >
                             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" className="w-5 h-5"><path d="M19 9l-7 7-7-7"/></svg>
                          </button>
                       </div>
                    </div>

                    {isExpanded && (
                       <div className="p-8 border-t border-slate-100 dark:border-white/10 bg-white dark:bg-slate-900 animate-in slide-in-from-top-4 duration-500 grid grid-cols-1 md:grid-cols-2 gap-8 transition-colors">
                          <div className="space-y-4">
                             <div className="flex items-center gap-3">
                                <span className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest transition-colors">Registry Notes</span>
                                <div className="h-px flex-1 bg-slate-50 dark:bg-white/5 transition-colors"></div>
                             </div>
                             <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/5 italic min-h-[100px] flex flex-col justify-center transition-colors">
                                <p className="text-sm font-bold text-slate-600 dark:text-slate-400 leading-relaxed transition-colors">
                                   {entry.notes ? `"${entry.notes}"` : "No inter-dialytic annotations provided."}
                                </p>
                             </div>
                          </div>
                          <div className="space-y-4">
                             <div className="flex items-center gap-3">
                                <span className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest transition-colors">Node Telemetry</span>
                                <div className="h-px flex-1 bg-slate-50 dark:bg-white/5 transition-colors"></div>
                             </div>
                             <div className="space-y-3">
                                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 transition-colors">
                                   <span className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest transition-colors">Entry Protocol</span>
                                   <span className="text-xs font-black text-slate-900 dark:text-slate-300">#{entry.id.slice(-8)}</span>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 transition-colors">
                                   <span className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest transition-colors">Dialysis Context</span>
                                   {session ? (
                                      <div className="flex items-center gap-2 text-sky-500">
                                         <div className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse"></div>
                                         <span className="text-xs font-black uppercase tracking-tight transition-colors">Cycle Active</span>
                                      </div>
                                   ) : (
                                      <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase transition-colors">Routine Check</span>
                                   )}
                                </div>
                                {session && (
                                   <div className="p-4 bg-sky-50/50 dark:bg-sky-500/10 rounded-2xl border border-sky-100 dark:border-sky-500/20 flex items-center justify-between transition-colors">
                                      <span className="text-[9px] font-black text-sky-600 dark:text-sky-400 uppercase tracking-widest transition-colors">Linked Cycle</span>
                                      <span className="text-xs font-bold text-sky-900 dark:text-sky-100 transition-colors">{new Date(session.startTime).toLocaleDateString()} • {session.type}</span>
                                   </div>
                                )}
                             </div>
                          </div>
                       </div>
                    )}
                 </div>
              );
           }) : (
              <div className="py-32 text-center flex flex-col items-center gap-6 opacity-20 transition-opacity">
                 <div className="w-24 h-24 bg-slate-50 dark:bg-white/5 rounded-[3rem] flex items-center justify-center border-4 border-dashed border-slate-200 dark:border-white/10 transition-colors">
                    <ICONS.Vitals className="w-12 h-12 dark:text-slate-400" />
                 </div>
                 <div className="space-y-1">
                    <p className="text-xl font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600">Registry Empty</p>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-300 dark:text-slate-700">Initialize node entry using the form.</p>
                 </div>
              </div>
           )}
        </div>
      </section>

      <style>{`
        .shadow-3xl { box-shadow: 0 40px 100px -20px rgba(0,0,0,0.25); }
        .shadow-4xl { box-shadow: 0 50px 120px -30px rgba(0,0,0,0.3); }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1e293b;
        }
      `}</style>
    </div>
  );
};

export default Vitals;