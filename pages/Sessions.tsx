import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../store';
import { DialysisType, DialysisSession, SessionEvent, VitalType } from '../types';
import { ICONS, COLORS } from '../constants';
import { exportSessionsAsCSV } from '../services/export';

type SessionStage = 'IDLE' | 'SETUP' | 'ACTIVE' | 'FINISHING' | 'RESULT';

const Sessions: React.FC = () => {
  const { sessions, addSession, updateSession, profile, addVital, addWeight } = useStore();
  const [stage, setStage] = useState<SessionStage>('IDLE');
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [viewingReportId, setViewingReportId] = useState<string | null>(null);
  
  // Setup Form States
  const [sessionStartTime, setSessionStartTime] = useState<string>(new Date().toISOString().slice(0, 16));
  const [preWeight, setPreWeight] = useState<string>('76.5');
  const [targetUF, setTargetUF] = useState<string>('2500');
  const [preBP, setPreBP] = useState({ sys: 120, dia: 80 });
  const [preHR, setPreHR] = useState<string>('72');
  
  // Finish Form States
  const [postWeight, setPostWeight] = useState<string>('');
  const [fluidRemoved, setFluidRemoved] = useState<string>('2500');
  const [postBP, setPostBP] = useState({ sys: 118, dia: 78 });
  const [postHR, setPostHR] = useState<string>('74');
  const [notes, setNotes] = useState('');

  // Progress States
  const [elapsed, setElapsed] = useState('00:00:00');
  const [progressPercent, setProgressPercent] = useState(0);

  const activeSessionInStore = sessions.find(s => s.status === 'active');
  const completedSessions = useMemo(() => sessions.filter(s => s.status === 'completed'), [sessions]);

  const reportSession = useMemo(() => {
    return sessions.find(s => s.id === viewingReportId);
  }, [viewingReportId, sessions]);

  // Sync stage with active session if one exists and we are idle
  useEffect(() => {
    if (activeSessionInStore && stage === 'IDLE') {
      setStage('ACTIVE');
      setCurrentSessionId(activeSessionInStore.id);
      if (activeSessionInStore.targetFluidRemoval) setTargetUF(activeSessionInStore.targetFluidRemoval.toString());
      if (activeSessionInStore.preWeight) setPreWeight(activeSessionInStore.preWeight.toString());
    }
  }, [activeSessionInStore, stage]);

  const handleStartSetup = () => {
    setSessionStartTime(new Date().toISOString().slice(0, 16));
    setStage('SETUP');
  };

  const handleExport = () => {
    exportSessionsAsCSV(completedSessions);
  };

  const handleStartSession = () => {
    const sessionId = Date.now().toString();
    const startTimeIso = new Date(sessionStartTime).toISOString();
    
    const newSession: DialysisSession = {
      id: sessionId,
      type: profile.preferredDialysisType || DialysisType.HOME_HD,
      startTime: startTimeIso,
      plannedDuration: 240,
      targetFluidRemoval: parseFloat(targetUF),
      status: 'active',
      preWeight: parseFloat(preWeight),
      bloodPressure: preBP,
      symptoms: [],
      notes: '',
      events: []
    };

    // Log pre-session vitals
    addVital({ id: `pre-bp-${sessionId}`, loggedAt: startTimeIso, type: VitalType.BLOOD_PRESSURE, value1: preBP.sys, value2: preBP.dia, unit: 'mmHg', sessionId });
    addVital({ id: `pre-hr-${sessionId}`, loggedAt: startTimeIso, type: VitalType.HEART_RATE, value1: parseFloat(preHR), unit: 'bpm', sessionId });
    
    // Log pre-weight
    addWeight({ id: `pre-w-${sessionId}`, date: startTimeIso, value: parseFloat(preWeight), type: 'pre-dialysis' });

    addSession(newSession);
    setCurrentSessionId(sessionId);
    setStage('ACTIVE');
  };

  const handleFinishSetup = () => {
    setFluidRemoved(targetUF);
    setStage('FINISHING');
  };

  const handleCompleteSession = () => {
    const sid = currentSessionId || activeSessionInStore?.id;
    if (!sid) {
      console.error("No active session ID found to complete");
      return;
    }

    const session = sessions.find(s => s.id === sid);
    if (session) {
      const timestamp = new Date().toISOString();
      const finalPostWeight = parseFloat(postWeight) || (session.preWeight || 0) - (parseInt(fluidRemoved) / 1000);

      const updated: DialysisSession = {
        ...session,
        status: 'completed',
        endTime: timestamp,
        actualDuration: Math.floor((Date.now() - new Date(session.startTime).getTime()) / 60000),
        postWeight: finalPostWeight,
        fluidRemoved: parseInt(fluidRemoved) || 0,
        notes: notes,
      };

      // Archive post-vitals
      addVital({ id: `post-bp-${sid}`, loggedAt: timestamp, type: VitalType.BLOOD_PRESSURE, value1: postBP.sys, value2: postBP.dia, unit: 'mmHg', sessionId: sid });
      addVital({ id: `post-hr-${sid}`, loggedAt: timestamp, type: VitalType.HEART_RATE, value1: parseFloat(postHR) || 0, unit: 'bpm', sessionId: sid });
      
      // Archive post-weight to longitudinal tracker
      addWeight({ id: `post-w-${sid}`, date: timestamp, value: finalPostWeight, type: 'post-dialysis' });
      
      updateSession(updated);
      setStage('RESULT');
    }
  };

  const resetFlow = () => {
    setStage('IDLE');
    setViewingReportId(null);
    setCurrentSessionId(null);
    setNotes('');
    setPostWeight('');
  };

  useEffect(() => {
    if (stage !== 'ACTIVE' || !activeSessionInStore) return;
    const interval = setInterval(() => {
      const now = Date.now();
      const start = new Date(activeSessionInStore.startTime).getTime();
      const diff = now - start;
      const h = Math.floor(diff / 3600000).toString().padStart(2, '0');
      const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
      const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
      setElapsed(`${h}:${m}:${s}`);

      const totalMinutes = activeSessionInStore.plannedDuration || 240;
      const currentMinutes = diff / 60000;
      setProgressPercent(Math.min((currentMinutes / totalMinutes) * 100, 100));
    }, 1000);
    return () => clearInterval(interval);
  }, [stage, activeSessionInStore]);

  const PulsatingDot = () => (
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]"></span>
    </span>
  );

  return (
    <div className="space-y-8 md:space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 relative pb-24 transition-colors duration-500">
      
      {/* Detail Modal */}
      {viewingReportId && reportSession && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-2xl" onClick={resetFlow} />
           <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-[3rem] md:rounded-[4rem] shadow-4xl overflow-hidden relative z-10 flex flex-col h-full max-h-[85vh] border border-slate-100 dark:border-white/10">
              <header className="p-8 border-b border-slate-50 dark:border-white/5 flex items-center justify-between shrink-0">
                 <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-slate-900 dark:bg-white text-white dark:text-slate-950 rounded-[1.25rem] flex items-center justify-center shadow-xl">
                       <ICONS.Book className="w-7 h-7" />
                    </div>
                    <div>
                       <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">Cycle Detail</h3>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{new Date(reportSession.startTime).toLocaleDateString()} • {reportSession.type}</p>
                    </div>
                 </div>
                 <button onClick={resetFlow} className="w-12 h-12 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M18 6L6 18M6 6l12 12"/></svg>
                 </button>
              </header>
              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                       <h4 className="text-[10px] font-black text-sky-500 uppercase tracking-widest">Outcomes</h4>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/5">
                             <span className="text-[9px] font-black text-slate-400 uppercase">Fluid Removed</span>
                             <p className="text-3xl font-black text-sky-500">{reportSession.fluidRemoved}ml</p>
                          </div>
                          <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/5">
                             <span className="text-[9px] font-black text-slate-400 uppercase">Weight Δ</span>
                             <p className="text-3xl font-black text-pink-500">{( (reportSession.preWeight || 0) - (reportSession.postWeight || 0) ).toFixed(1)}kg</p>
                          </div>
                       </div>
                    </div>
                    <div className="space-y-6">
                       <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Biometrics</h4>
                       <div className="space-y-3">
                          <div className="flex justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
                             <span className="text-[10px] font-bold text-slate-400 uppercase">Pre Weight</span>
                             <span className="text-sm font-black text-slate-900 dark:text-white">{reportSession.preWeight}kg</span>
                          </div>
                          <div className="flex justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
                             <span className="text-[10px] font-bold text-slate-400 uppercase">Post Weight</span>
                             <span className="text-sm font-black text-slate-900 dark:text-white">{reportSession.postWeight}kg</span>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Header */}
      <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 px-2">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <span className="px-3 py-1 bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg">Treatment Hub</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">Cycles</h2>
          <p className="text-slate-400 dark:text-slate-500 font-medium text-base md:text-lg">Real-time telemetry and clinical archival for your dialysis sessions.</p>
        </div>
        
        {stage === 'IDLE' && (
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <button 
              onClick={handleExport}
              disabled={completedSessions.length === 0}
              className="group flex items-center justify-center gap-3 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 text-slate-900 dark:text-white px-8 py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-slate-100 dark:hover:bg-white/10 transition-all disabled:opacity-30"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
              Download Archive
            </button>
            <button 
              onClick={handleStartSetup}
              className="group flex items-center justify-center gap-3 bg-sky-500 text-white px-10 py-5 rounded-[2rem] font-black text-sm shadow-xl hover:bg-slate-900 dark:hover:bg-white dark:hover:text-slate-950 transition-all"
            >
              <ICONS.Plus className="w-5 h-5" />
              New Cycle
            </button>
          </div>
        )}
      </section>

      {/* Main Content Area */}
      <div className="space-y-8 md:space-y-12">
        
        {/* IDLE: Ledger View */}
        {stage === 'IDLE' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in fade-in duration-700">
             <div className="lg:col-span-8 space-y-10">
                <div className="flex justify-between items-end px-2">
                   <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Clinical Ledger</h3>
                   <span className="px-3 py-1 bg-slate-50 dark:bg-white/5 text-slate-400 dark:text-slate-600 rounded-lg text-[9px] font-black uppercase tracking-widest">{completedSessions.length} Cycles</span>
                </div>
                
                <div className="space-y-4">
                   {completedSessions.length > 0 ? completedSessions.map(session => (
                      <div key={session.id} onClick={() => setViewingReportId(session.id)} className="group bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-white/10 shadow-sm hover:shadow-2xl hover:border-sky-100 dark:hover:border-sky-500/30 transition-all duration-500 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-8 relative overflow-hidden">
                         <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-900 dark:bg-white group-hover:bg-sky-500 transition-colors"></div>
                         <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-slate-50 dark:bg-white/5 text-slate-400 rounded-2xl flex items-center justify-center group-hover:rotate-6 transition-all">
                               <ICONS.Book className="w-7 h-7" />
                            </div>
                            <div>
                               <span className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest block mb-1">{new Date(session.startTime).toLocaleDateString()}</span>
                               <h4 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{session.type}</h4>
                            </div>
                         </div>
                         <div className="flex flex-1 flex-wrap items-center justify-between md:justify-end gap-10">
                            <div className="text-right">
                               <span className="text-[9px] font-black text-slate-300 uppercase block mb-1">Removed</span>
                               <span className="text-lg font-bold text-sky-500">{session.fluidRemoved}ml</span>
                            </div>
                            <div className="text-right">
                               <span className="text-[9px] font-black text-slate-300 uppercase block mb-1">Weight Δ</span>
                               <span className="text-lg font-bold text-pink-600">{( (session.preWeight || 0) - (session.postWeight || 0) ).toFixed(1)}kg</span>
                            </div>
                            <div className="w-12 h-12 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center text-slate-300 group-hover:bg-slate-900 dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-slate-950 transition-all">
                               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="9 18 15 12 9 6"/></svg>
                            </div>
                         </div>
                      </div>
                   )) : (
                      <div className="py-32 bg-slate-50 dark:bg-white/5 rounded-[4rem] border-4 border-dashed border-slate-100 dark:border-white/5 flex flex-col items-center justify-center opacity-30 text-center gap-6">
                         <ICONS.Book className="w-16 h-16" />
                         <p className="text-xl font-black uppercase tracking-[0.2em]">Ledger Empty</p>
                         <button onClick={handleStartSetup} className="px-10 py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-950 rounded-2xl font-black text-xs uppercase tracking-widest">Start First Session</button>
                      </div>
                   )}
                </div>
             </div>
             <div className="lg:col-span-4">
                <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-xl relative overflow-hidden group">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full translate-x-1/2 -translate-y-1/2"></div>
                   <h4 className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-8">Performance</h4>
                   <p className="text-sm font-medium text-white/50 leading-relaxed italic">"Regular tracking of fluid removal precision is associated with better clinical outcomes."</p>
                </div>
             </div>
          </div>
        )}

        {/* SETUP: Configuration View */}
        {stage === 'SETUP' && (
          <div className="bg-white dark:bg-slate-900 p-8 md:p-16 rounded-[4rem] border border-slate-100 dark:border-white/10 shadow-2xl animate-in zoom-in-95 duration-500">
             <div className="mb-14">
                <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Cycle Setup</h3>
                <p className="text-slate-400 font-bold uppercase text-[9px] tracking-widest mt-1">Pre-treatment protocol</p>
             </div>
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="space-y-2">
                   <label className="text-[8px] font-black text-slate-400 uppercase ml-2">Pre-Weight (kg)</label>
                   <input type="number" step="0.1" value={preWeight} onChange={(e) => setPreWeight(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-2xl px-6 py-4 font-black text-2xl text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-sky-50" />
                </div>
                <div className="space-y-2">
                   <label className="text-[8px] font-black text-sky-500 uppercase ml-2">Target UF (ml)</label>
                   <input type="number" value={targetUF} onChange={(e) => setTargetUF(e.target.value)} className="w-full bg-sky-50 dark:bg-sky-500/10 border border-sky-100 dark:border-sky-500/20 rounded-2xl px-6 py-4 font-black text-2xl text-sky-600 dark:text-sky-400 outline-none" />
                </div>
                <div className="space-y-2">
                   <label className="text-[8px] font-black text-slate-400 uppercase ml-2">Timestamp</label>
                   <input type="datetime-local" value={sessionStartTime} onChange={(e) => setSessionStartTime(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-2xl px-6 py-4 font-bold text-slate-900 dark:text-white outline-none" />
                </div>
             </div>
             <div className="mt-12 flex flex-col sm:flex-row gap-4">
                <button onClick={resetFlow} className="flex-1 py-6 rounded-2xl font-black text-slate-400 uppercase tracking-widest hover:text-slate-600">Cancel</button>
                <button onClick={handleStartSession} className="flex-[3] py-6 bg-slate-900 dark:bg-white text-white dark:text-slate-950 rounded-2xl font-black text-base uppercase tracking-[0.4em] shadow-xl hover:bg-sky-600 transition-all">Authorize & Start</button>
             </div>
          </div>
        )}

        {/* ACTIVE: Live Telemetry View */}
        {stage === 'ACTIVE' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 animate-in fade-in slide-in-from-bottom-10 duration-1000">
             <div className="xl:col-span-8 bg-slate-950 p-6 md:p-14 rounded-3xl md:rounded-[4.5rem] text-white shadow-3xl relative overflow-hidden flex flex-col justify-between min-h-[500px] border border-white/5">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-sky-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                <header className="relative z-10 flex justify-between items-start">
                   <div className="space-y-2">
                      <div className="flex items-center gap-2">
                         <PulsatingDot />
                         <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">Treatment Active</span>
                      </div>
                      <h3 className="text-3xl md:text-5xl font-black tracking-tighter leading-none">{profile.preferredDialysisType}</h3>
                   </div>
                </header>
                <div className="relative z-10 flex-1 flex flex-col lg:row-row items-center justify-center gap-12 py-12">
                   <div className="text-center space-y-2">
                      <span className="text-7xl md:text-[9rem] font-black tabular-nums tracking-tighter">{elapsed}</span>
                      <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest">Elapsed Time</p>
                   </div>
                </div>
                <footer className="relative z-10 pt-8 border-t border-white/5 flex justify-center">
                   <button onClick={handleFinishSetup} className="px-16 py-6 bg-white text-slate-900 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl hover:bg-sky-50 transition-all">Conclude Cycle</button>
                </footer>
             </div>
          </div>
        )}

        {/* FINISHING: Outcome Verification */}
        {stage === 'FINISHING' && (
          <div className="bg-white dark:bg-slate-900 p-8 md:p-16 rounded-[4rem] border border-slate-100 dark:border-white/10 shadow-2xl animate-in zoom-in-95 duration-500">
             <div className="mb-10">
                <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Synchronize Stats</h3>
                <p className="text-slate-400 font-bold uppercase text-[9px] tracking-widest mt-1">Outcome verification</p>
             </div>
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="space-y-8">
                   <div className="p-8 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/5 space-y-6">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Clinical Results</h4>
                      <div className="space-y-4">
                         <div className="space-y-1">
                            <label className="text-[8px] font-black text-sky-500 uppercase ml-2">Actual Removal (ml)</label>
                            <input type="number" value={fluidRemoved} onChange={e => setFluidRemoved(e.target.value)} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 font-black text-slate-900 dark:text-white" />
                         </div>
                         <div className="space-y-1">
                            <label className="text-[8px] font-black text-pink-500 uppercase ml-2">Post Weight (kg)</label>
                            <input type="number" step="0.1" value={postWeight} onChange={e => setPostWeight(e.target.value)} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 font-black text-slate-900 dark:text-white" placeholder="Computed from UF if left blank" />
                         </div>
                      </div>
                   </div>
                </div>
                <div className="space-y-8">
                   <div className="p-8 bg-slate-900 rounded-3xl text-white space-y-6">
                      <h4 className="text-[10px] font-black text-sky-400 uppercase tracking-widest">Post-Vitals</h4>
                      <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-1">
                            <label className="text-[8px] font-black text-white/30 uppercase">BP Sys/Dia</label>
                            <div className="flex gap-2">
                               <input type="number" value={postBP.sys} onChange={e => setPostBP({...postBP, sys: parseInt(e.target.value)})} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white font-bold" />
                               <input type="number" value={postBP.dia} onChange={e => setPostBP({...postBP, dia: parseInt(e.target.value)})} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white font-bold" />
                            </div>
                         </div>
                         <div className="space-y-1">
                            <label className="text-[8px] font-black text-white/30 uppercase">Heart Rate</label>
                            <input type="number" value={postHR} onChange={e => setPostHR(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white font-bold" />
                         </div>
                      </div>
                      <div className="space-y-1">
                         <label className="text-[8px] font-black text-white/30 uppercase">Cycle Notes</label>
                         <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white font-medium text-xs h-20 resize-none" placeholder="How did you feel during treatment?" />
                      </div>
                   </div>
                </div>
             </div>
             <div className="mt-12 flex flex-col sm:flex-row gap-4">
                <button onClick={() => setStage('ACTIVE')} className="flex-1 py-6 rounded-2xl font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">Back</button>
                <button onClick={handleCompleteSession} className="flex-[3] py-6 bg-emerald-500 text-white rounded-2xl font-black text-base uppercase tracking-[0.4em] shadow-xl hover:bg-emerald-600 transition-all active:scale-95">Finalize & Save Cycle</button>
             </div>
          </div>
        )}

        {/* RESULT: Success Screen */}
        {stage === 'RESULT' && (
           <div className="bg-white dark:bg-slate-900 p-8 md:p-16 rounded-[4rem] border border-slate-100 dark:border-white/10 shadow-2xl text-center space-y-10 animate-in zoom-in-95 duration-700">
              <div className="w-24 h-24 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner border border-emerald-100 dark:border-emerald-500/20">
                 <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div className="space-y-4">
                 <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Success</h3>
                 <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">Your biometric data has been synchronized and archived in the Clinical Ledger.</p>
              </div>
              <button onClick={resetFlow} className="px-16 py-6 bg-slate-900 dark:bg-white text-white dark:text-slate-950 rounded-[2.5rem] font-black text-sm uppercase tracking-[0.4em] shadow-xl hover:bg-sky-600 transition-all">Return to Dashboard</button>
           </div>
        )}
      </div>
    </div>
  );
};

export default Sessions;
