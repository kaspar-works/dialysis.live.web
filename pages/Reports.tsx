import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../store';
import { SubscriptionPlan, CustomReportConfig } from '../types';
import { Link } from 'react-router-dom';
import { exportDataAsJSON, exportAsPDF } from '../services/export';
import { ICONS } from '../constants';

const Reports: React.FC = () => {
  const { profile, sessions, weights, fluids, vitals, medications, moods, savedReports, addSavedReport, removeSavedReport } = useStore();
  
  // Builder States
  const [reportName, setReportName] = useState('');
  const [selectedDataPoints, setSelectedDataPoints] = useState<string[]>(['sessions', 'weights', 'wellness']);
  const [dateRange, setDateRange] = useState('30days');
  
  // UI Status
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [activeView, setActiveView] = useState<'builder' | 'saved'>('builder');
  const [pendingFormat, setPendingFormat] = useState<'json' | 'pdf'>('pdf');

  const sub = profile.subscription;
  const reportsUsed = savedReports.length; 
  const canGenerate = sub.maxReports === null || reportsUsed < sub.maxReports;

  const dataPointOptions = [
    { id: 'sessions', label: 'Treatment History', icon: ICONS.Activity, color: 'text-sky-500', records: sessions },
    { id: 'weights', label: 'Weight History', icon: ICONS.Scale, color: 'text-pink-600', records: weights },
    { id: 'fluids', label: 'Drink History', icon: ICONS.Droplet, color: 'text-sky-400', records: fluids },
    { id: 'vitals', label: 'Vital Signs', icon: ICONS.Vitals, color: 'text-orange-500', records: vitals },
    { id: 'meds', label: 'Medicine Tracker', icon: ICONS.Pill, color: 'text-indigo-500', records: medications },
    { id: 'wellness', label: 'Mental Wellness', icon: (props: any) => <span className="text-xl">🧠</span>, color: 'text-indigo-400', records: moods },
  ];

  const generationSteps = [
    "Checking sync status...",
    "Retrieving biometric nodes...",
    "Analyzing emotional trajectory...",
    "Finalizing clinical layout..."
  ];

  // Logic to calculate record counts for the preview
  const recordCounts = useMemo(() => {
    const now = new Date();
    const rangeInDays = parseInt(dateRange.replace('days', ''));
    const threshold = new Date(now.setDate(now.getDate() - rangeInDays)).getTime();

    const counts: Record<string, number> = {};
    
    counts.sessions = sessions.filter(s => new Date(s.startTime).getTime() > threshold).length;
    counts.weights = weights.filter(w => new Date(w.date).getTime() > threshold).length;
    counts.fluids = fluids.filter(f => new Date(f.time).getTime() > threshold).length;
    counts.vitals = vitals.filter(v => new Date(v.loggedAt).getTime() > threshold).length;
    counts.wellness = moods.filter(m => new Date(m.time).getTime() > threshold).length;
    counts.meds = medications.length; 

    return counts;
  }, [dateRange, sessions, weights, fluids, vitals, medications, moods]);

  const toggleDataPoint = (id: string) => {
    setSelectedDataPoints(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const triggerDownload = (format: 'json' | 'pdf', config?: Partial<CustomReportConfig>) => {
    const finalDataPoints = config?.dataPoints || selectedDataPoints;
    const finalRange = config?.dateRange || dateRange;

    const exportPayload: any = {
      profile,
      generatedAt: new Date().toISOString(),
      reportName: config?.name || reportName || 'My Health Report',
      dateRange: finalRange,
    };

    if (finalDataPoints.includes('sessions')) exportPayload.sessions = sessions;
    if (finalDataPoints.includes('weights')) exportPayload.weights = weights;
    if (finalDataPoints.includes('fluids')) exportPayload.fluids = fluids;
    if (finalDataPoints.includes('vitals')) exportPayload.vitals = vitals;
    if (finalDataPoints.includes('meds')) exportPayload.medications = medications;
    if (finalDataPoints.includes('wellness')) exportPayload.moods = moods;

    if (format === 'pdf') {
      exportAsPDF(exportPayload);
    } else {
      exportDataAsJSON(exportPayload, `my-health-report-${finalRange}`);
    }
  };

  const handleGenerate = (format: 'json' | 'pdf', config?: CustomReportConfig) => {
    if (!canGenerate) return;
    setIsGenerating(true);
    setGenerationStep(0);
    setPendingFormat(format);

    const interval = setInterval(() => {
      setGenerationStep(prev => {
        if (prev === generationSteps.length - 1) {
          clearInterval(interval);
          setTimeout(() => {
              setIsGenerating(false);
              triggerDownload(format, config);
          }, 800);
          return prev;
        }
        return prev + 1;
      });
    }, 800);
  };

  const handleSaveAndGenerate = (e: React.FormEvent, format: 'json' | 'pdf') => {
    e.preventDefault();
    const newConfig: CustomReportConfig = {
      id: Date.now().toString(),
      name: reportName || 'Health Report ' + new Date().toLocaleDateString(),
      dataPoints: selectedDataPoints,
      dateRange: dateRange,
      createdAt: new Date().toISOString()
    };
    addSavedReport(newConfig);
    handleGenerate(format, newConfig);
    setReportName('');
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-32 transition-colors duration-500">
      {/* Header Section */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-8 px-2">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
             <span className="px-4 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg shadow-slate-200 dark:shadow-none transition-colors">Audit Node</span>
          </div>
          <h2 className="text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-none transition-colors">Clinical Reports</h2>
          <p className="text-slate-500 dark:text-slate-500 max-w-md font-medium text-lg leading-relaxed transition-colors">Aggregate your clinical and emotional data into provider-ready layouts.</p>
        </div>

        <div className="flex bg-slate-50 dark:bg-white/5 p-1.5 rounded-[2rem] border border-slate-100 dark:border-white/10 shadow-inner shrink-0 h-fit transition-colors">
           <button 
            onClick={() => setActiveView('builder')}
            className={`px-10 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all duration-500 ${activeView === 'builder' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xl scale-105' : 'text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400'}`}
           >
              Make Report
           </button>
           <button 
            onClick={() => setActiveView('saved')}
            className={`px-10 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all duration-500 ${activeView === 'saved' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xl scale-105' : 'text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400'}`}
           >
              Saved
           </button>
        </div>
      </section>

      {activeView === 'builder' ? (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
          <div className="xl:col-span-8 bg-white dark:bg-slate-900 p-8 lg:p-12 rounded-[4rem] border border-slate-100 dark:border-white/10 shadow-sm transition-colors">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-10 transition-colors">Report Configuration</h3>
            <form onSubmit={(e) => handleSaveAndGenerate(e, 'pdf')} className="space-y-12">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest ml-4 transition-colors">Report Title</label>
                <input 
                  type="text" 
                  value={reportName} 
                  onChange={e => setReportName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-[2rem] px-8 py-5 font-black text-xl text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-sky-50 dark:focus:ring-sky-500/10 transition-all"
                  placeholder="e.g. June Monthly Summary"
                />
              </div>

              <div className="space-y-6">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest ml-4 transition-colors">Data Points to Include</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {dataPointOptions.map(opt => {
                    const isSelected = selectedDataPoints.includes(opt.id);
                    const Icon = opt.icon;
                    return (
                      <button 
                        key={opt.id} type="button" onClick={() => toggleDataPoint(opt.id)}
                        className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-3 text-center ${isSelected ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-500/10' : 'border-slate-50 dark:border-white/5 bg-slate-50 dark:bg-white/5'}`}
                      >
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isSelected ? 'bg-sky-500 text-white' : 'bg-white dark:bg-slate-800 text-slate-300 dark:text-slate-700'}`}>
                          {/* FIX: Simplified icon rendering as it is always a component/function */}
                          <Icon className="w-6 h-6" />
                        </div>
                        <span className={`text-[9px] font-black uppercase tracking-widest ${isSelected ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400 dark:text-slate-600'}`}>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-6">
                <button type="submit" className="flex-1 py-6 bg-slate-900 dark:bg-white text-white dark:text-slate-950 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-sky-600 dark:hover:bg-sky-400 transition-all">Generate PDF</button>
                <button type="button" onClick={(e) => handleSaveAndGenerate(e as any, 'json')} className="flex-1 py-6 bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-white/10 transition-all">Export JSON</button>
              </div>
            </form>
          </div>
          
          <div className="xl:col-span-4 bg-slate-950 p-10 rounded-[3.5rem] text-white shadow-xl relative overflow-hidden transition-colors">
            <h4 className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-10">Live Preview</h4>
            <div className="space-y-6">
               {selectedDataPoints.map(id => (
                  <div key={id} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                     <span className="text-[10px] font-black uppercase tracking-widest text-white/40">{id}</span>
                     <span className="text-sm font-black text-sky-400">{recordCounts[id] || 0} Records</span>
                  </div>
               ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {savedReports.map(report => (
             <div key={report.id} className="bg-white dark:bg-slate-900 p-8 rounded-[3.5rem] border border-slate-100 dark:border-white/10 shadow-sm transition-colors group">
                <h4 className="text-xl font-black text-slate-900 dark:text-white mb-2">{report.name}</h4>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Created {new Date(report.createdAt).toLocaleDateString()}</p>
                <div className="flex gap-4">
                   <button onClick={() => handleGenerate('pdf', report)} className="flex-1 py-4 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-sky-500 hover:text-white transition-all">PDF</button>
                   <button onClick={() => removeSavedReport(report.id)} className="p-4 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"/></svg>
                   </button>
                </div>
             </div>
           ))}
        </div>
      )}

      {isGenerating && (
        <div className="fixed inset-0 z-[200] bg-slate-950/90 backdrop-blur-2xl flex items-center justify-center p-8 text-center animate-in fade-in duration-500">
          <div className="space-y-10 max-w-sm">
             <div className="w-24 h-24 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin mx-auto"></div>
             <div className="space-y-4">
                <h3 className="text-3xl font-black text-white tracking-tight transition-colors">{generationSteps[generationStep]}</h3>
                <p className="text-[10px] font-black text-sky-400 uppercase tracking-[0.4em] animate-pulse">Synchronizing Clinical Archive</p>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;