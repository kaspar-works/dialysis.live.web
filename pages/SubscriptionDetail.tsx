
import React, { useState } from 'react';
import { useStore } from '../store';
import { SubscriptionPlan, SubscriptionStatus } from '../types';
import { Link } from 'react-router';

const SubscriptionDetail: React.FC = () => {
  const { profile, setProfile, sessions, medications } = useStore();
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const sub = profile.subscription;

  const daysRemaining = sub.currentPeriodEnd 
    ? Math.ceil((new Date(sub.currentPeriodEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const handleUpdatePreference = (key: 'autoRenew' | 'emailReceipts', val: boolean) => {
    setIsSyncing(true);
    setTimeout(() => {
       setProfile({
         ...profile,
         subscription: {
           ...sub,
           [key]: val
         }
       });
       setIsSyncing(false);
    }, 500);
  };

  const handleConfirmCancel = () => {
    setIsProcessing(true);
    // Simulate API call
    setTimeout(() => {
      setProfile({
        ...profile,
        subscription: {
          ...profile.subscription,
          status: SubscriptionStatus.CANCELED,
          cancelAtPeriodEnd: true,
          autoRenew: false
        }
      });
      setIsProcessing(false);
      setIsCancelModalOpen(false);
    }, 1500);
  };

  const usageMetrics = [
    { 
      label: 'Sessions Archived', 
      current: sessions.length, 
      max: sub.maxSessions, 
      color: 'bg-sky-500' 
    },
    { 
      label: 'Active Medications', 
      current: medications.length, 
      max: sub.maxMedications, 
      color: 'bg-indigo-500' 
    },
    { 
      label: 'Clinical Reports', 
      current: 0, 
      max: sub.maxReports, 
      color: 'bg-emerald-500' 
    }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 transition-colors duration-500 pb-40 px-4">
      
      {/* Visual Hub Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
         <div className="space-y-4">
            <div className="flex items-center gap-3">
               <span className="px-4 py-1.5 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg shadow-emerald-500/20">Access Protocol</span>
            </div>
            <h2 className="text-5xl lg:text-7xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">Billing Center</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-xl font-medium text-lg lg:text-xl">Governance for your clinical tier and inter-dialytic telemetry storage.</p>
         </div>
         <div className="flex gap-4 w-full md:w-auto">
            <Link to="/subscription/pricing" className="flex-1 md:flex-none px-12 py-5 bg-slate-950 dark:bg-white text-white dark:text-slate-950 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl transform active:scale-95 transition-all text-center">Change Tier</Link>
         </div>
      </header>

      {/* Hero Management Card */}
      <section className="relative p-10 lg:p-16 bg-slate-900 rounded-[4rem] text-white shadow-3xl overflow-hidden border border-white/5 transition-colors duration-500">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-[140px] -translate-y-1/2 translate-x-1/2 pointer-events-none animate-pulse"></div>
        
        <div className="relative flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="space-y-8 flex-1">
            <div className="flex flex-wrap items-center gap-4">
              <span className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-white/10 backdrop-blur-md ${sub.status === SubscriptionStatus.ACTIVE ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                {sub.status === SubscriptionStatus.ACTIVE ? '● Verified Access' : '● Canceled'}
              </span>
              <span className="text-white/30 text-[10px] font-black uppercase tracking-[0.3em]">
                {sub.status === SubscriptionStatus.ACTIVE ? `Next Cycle Sync in ${daysRemaining} days` : 'Terminal access at period end'}
              </span>
            </div>
            <div>
              <h2 className="text-6xl font-black tracking-tighter text-white transition-colors">{sub.plan} Plan</h2>
              <p className="text-sky-300/60 font-bold text-xs uppercase tracking-[0.4em] mt-3">Integrated Dialysis Workspace v2.0</p>
            </div>
          </div>

          <div className="w-full md:w-80 p-8 bg-white/5 rounded-[3rem] border border-white/10 backdrop-blur-xl space-y-6">
             <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Clinical Sync ID</span>
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
             </div>
             <p className="text-2xl font-black tabular-nums tracking-widest">RC-{sub.stripeSubscriptionId?.slice(-8).toUpperCase() || 'FREE-NODE'}</p>
             <div className="h-px bg-white/5 w-full"></div>
             <div className="flex justify-between items-center text-[9px] font-black text-sky-400 uppercase tracking-[0.2em]">
                <span>Status: Clinical High</span>
                <span>Interval: {sub.billingInterval}ly</span>
             </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        {/* Settings & Preferences */}
        <div className="xl:col-span-7 space-y-10">
           
           {/* Billing Preferences */}
           <section className="bg-white dark:bg-slate-900 p-10 lg:p-14 rounded-[4.5rem] border border-slate-100 dark:border-white/5 shadow-xl space-y-12 transition-colors">
              <div>
                 <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Billing Protocols</h3>
                 <p className="text-slate-400 dark:text-slate-600 text-xs font-black uppercase tracking-widest mt-2">Manage renewals and synchronized notifications</p>
              </div>

              <div className="space-y-6">
                 {[
                    { id: 'autoRenew', label: 'Intelligent Auto-Renew', desc: 'Maintain uninterrupted inter-dialytic data storage.', enabled: sub.autoRenew },
                    { id: 'emailReceipts', label: 'Synchronized Receipts', desc: 'Archive monthly billing logs to your primary registry.', enabled: sub.emailReceipts },
                 ].map((pref) => (
                    <div key={pref.id} className="flex items-center justify-between p-8 bg-slate-50 dark:bg-white/5 rounded-[3rem] border border-transparent hover:border-sky-500/20 transition-all duration-500 group">
                       <div className="space-y-1.5 flex-1 pr-6">
                          <h4 className="text-lg font-black text-slate-900 dark:text-white group-hover:text-sky-600 transition-colors">{pref.label}</h4>
                          <p className="text-sm font-medium text-slate-400 dark:text-slate-600 leading-relaxed">{pref.desc}</p>
                       </div>
                       <button 
                         onClick={() => handleUpdatePreference(pref.id as any, !pref.enabled)}
                         disabled={isSyncing}
                         className={`relative w-16 h-8 rounded-full transition-all duration-700 flex items-center px-1.5 ${pref.enabled ? 'bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'bg-slate-200 dark:bg-slate-800'}`}
                       >
                          <div className={`w-5 h-5 bg-white rounded-full shadow-lg transition-all duration-700 transform ${pref.enabled ? 'translate-x-8' : 'translate-x-0'} ${isSyncing ? 'scale-75 animate-pulse' : ''}`} />
                       </button>
                    </div>
                 ))}
              </div>

              <div className="space-y-4 pt-6">
                 <label className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest ml-6">Primary Billing Node</label>
                 <div className="relative group">
                    <input 
                      type="email" 
                      value={sub.billingEmail || profile.email}
                      onChange={(e) => setProfile({...profile, subscription: {...sub, billingEmail: e.target.value}})}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-[2.5rem] px-10 py-7 font-black text-xl text-slate-900 dark:text-white outline-none focus:ring-8 focus:ring-sky-500/5 dark:focus:ring-sky-500/10 transition-all shadow-inner"
                      placeholder="Enter billing email..."
                    />
                    <div className="absolute right-8 top-1/2 -translate-y-1/2">
                       <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-slate-200 dark:text-slate-700 group-focus-within:text-sky-500 transition-colors"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
                    </div>
                 </div>
              </div>
           </section>

           {/* Security Compliance Card */}
           <div className="bg-slate-950 p-10 lg:p-14 rounded-[4.5rem] text-white shadow-3xl relative overflow-hidden group border border-white/5">
              <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full translate-x-1/2 -translate-y-1/2 group-hover:scale-150 transition-transform duration-[4s]"></div>
              <div className="relative z-10 flex gap-10 items-center">
                 <div className="w-20 h-20 bg-white/5 rounded-[2rem] flex items-center justify-center border border-white/10 shrink-0 shadow-2xl">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                 </div>
                 <div className="space-y-2">
                    <h4 className="text-2xl font-black text-white">Clinical Compliance</h4>
                    <p className="text-white/40 font-medium text-lg leading-relaxed italic">"Integrated workspace synchronized with 256-bit AES encryption protocols for patient data security."</p>
                 </div>
              </div>
           </div>
        </div>

        {/* Resource Telemetry */}
        <div className="xl:col-span-5 space-y-10">
          <div className="bg-white dark:bg-slate-900 p-12 rounded-[4.5rem] border border-slate-100 dark:border-white/5 shadow-sm space-y-12 transition-colors duration-500">
            <div className="flex justify-between items-center">
               <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Resource Telemetry</h3>
               <span className="text-[10px] font-black text-sky-500 uppercase tracking-widest px-3 py-1 bg-sky-500/10 rounded-lg">Real-time</span>
            </div>
            
            <div className="space-y-10">
              {usageMetrics.map((metric) => {
                const percentage = metric.max ? Math.min((metric.current / metric.max) * 100, 100) : 100;
                return (
                  <div key={metric.label} className="space-y-4">
                    <div className="flex justify-between items-end px-2">
                      <span className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] transition-colors">{metric.label}</span>
                      <span className="text-sm font-black text-slate-900 dark:text-slate-300 transition-colors">
                        {metric.current} <span className="text-slate-300 dark:text-slate-700 text-[10px] font-bold">/ {metric.max ?? '∞'} Node</span>
                      </span>
                    </div>
                    <div className="h-4 bg-slate-50 dark:bg-white/5 rounded-full border border-slate-100 dark:border-white/5 overflow-hidden transition-colors relative">
                      <div 
                        className={`h-full ${metric.color} transition-all duration-[1.5s] cubic-bezier(0.34, 1.56, 0.64, 1) shadow-[0_0_15px_rgba(0,0,0,0.1)]`} 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-8 border-t border-slate-50 dark:border-white/5 space-y-4">
               <div className="flex items-center gap-4 p-5 bg-sky-50/50 dark:bg-sky-500/5 rounded-3xl border border-sky-100 dark:border-sky-500/10">
                  <div className="w-10 h-10 bg-sky-500 text-white rounded-xl flex items-center justify-center shadow-lg shrink-0">
                     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <p className="text-[11px] font-bold text-sky-900 dark:text-sky-400 uppercase tracking-widest leading-tight">Priority Treatment Archive Sync Active</p>
               </div>
            </div>
          </div>

          <footer className="flex flex-col gap-6 items-center pt-10">
             {sub.status !== SubscriptionStatus.CANCELED && sub.plan !== SubscriptionPlan.FREE && (
                <button 
                  onClick={() => setIsCancelModalOpen(true)}
                  className="text-[11px] font-black text-rose-500 uppercase tracking-[0.4em] hover:text-rose-700 transition-all border-b-2 border-transparent hover:border-rose-700 pb-2 active:scale-95"
                >
                  Deauthorize Plan
                </button>
             )}
             <p className="text-[9px] font-black text-slate-300 dark:text-slate-800 uppercase tracking-[0.2em] italic text-center">Platform ID: DC-NODE-00-{sub.stripeSubscriptionId?.slice(-4) || 'FREE'}</p>
          </footer>
        </div>
      </div>

      {/* CANCELLATION MODAL */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-in fade-in duration-500">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-2xl" onClick={() => !isProcessing && setIsCancelModalOpen(false)} />
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[4rem] shadow-4xl overflow-hidden relative z-10 animate-in zoom-in-95 slide-in-from-bottom-12 duration-700 border border-white/5 transition-colors">
             <div className="p-12 lg:p-16 space-y-12">
                <div className="w-28 h-28 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-[3rem] flex items-center justify-center mx-auto shadow-inner ring-[16px] ring-rose-50/30 dark:ring-rose-500/5 transition-all">
                   <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                </div>
                
                <div className="text-center space-y-6">
                   <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">Deauthorize <br/> {sub.plan} Plan?</h3>
                   <p className="text-slate-500 dark:text-slate-400 text-lg font-medium leading-relaxed">
                      Losing access to clinical telemetry sync and advanced vision biometrics. Terminal access granted until <span className="text-slate-900 dark:text-white font-black underline decoration-rose-500/30">{new Date(sub.currentPeriodEnd || '').toLocaleDateString()}</span>.
                   </p>
                </div>

                <div className="bg-slate-50 dark:bg-white/5 p-10 rounded-[3.5rem] border border-slate-100 dark:border-white/5 space-y-6 transition-colors">
                   <p className="text-[11px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.3em] text-center">Clinical Record Impact</p>
                   <div className="grid grid-cols-1 gap-5">
                      {[
                        'Loss of Advanced AI Nutritional Insights',
                        'Restricted Vitals Archival (max 30 nodes)',
                        'Deactivation of Priority Clinical PDF Support',
                        'Removal of 24/7 Priority Dosing Node Access'
                      ].map((loss, idx) => (
                        <div key={idx} className="flex items-start gap-4 text-sm font-bold text-slate-600 dark:text-slate-400 leading-tight">
                           <div className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 shrink-0 shadow-[0_0_10px_rgba(244,63,94,0.4)]"></div>
                           {loss}
                        </div>
                      ))}
                   </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-5">
                   <button 
                     onClick={() => !isProcessing && setIsCancelModalOpen(false)}
                     className="flex-1 py-6 rounded-3xl font-black text-xs uppercase tracking-widest text-slate-400 dark:text-slate-600 hover:text-slate-900 dark:hover:text-white transition-colors"
                   >
                      Keep Registry
                   </button>
                   <button 
                     onClick={handleConfirmCancel}
                     disabled={isProcessing}
                     className="flex-[2] py-6 bg-rose-500 text-white rounded-3xl font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-rose-500/20 hover:bg-rose-600 transition-all active:scale-95 flex items-center justify-center gap-4"
                   >
                      {isProcessing ? (
                         <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                      ) : 'Confirm Deauth'}
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}

      <style>{`
        .shadow-4xl { box-shadow: 0 80px 180px -40px rgba(0,0,0,0.5); }
        .cubic-bezier { transition-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1); }
      `}</style>
    </div>
  );
};

export default SubscriptionDetail;
