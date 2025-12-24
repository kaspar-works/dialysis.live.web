
import React, { useState } from 'react';
import { useStore } from '../store';
import { ICONS } from '../constants';
import { Link } from 'react-router-dom';

const Settings: React.FC = () => {
  const { profile, setProfile } = useStore();
  const [localSettings, setLocalSettings] = useState(profile.settings);
  const [isSaved, setIsSaved] = useState(false);

  const sub = profile.subscription;

  const handleCustomReminderToggle = (key: keyof typeof localSettings.customReminders) => {
    setLocalSettings(prev => ({
      ...prev,
      customReminders: {
        ...prev.customReminders,
        [key]: {
          ...prev.customReminders[key],
          enabled: !prev.customReminders[key].enabled
        }
      }
    }));
  };

  const handleCustomReminderChange = (key: keyof typeof localSettings.customReminders, field: 'frequencyHours' | 'startTime', value: string | number) => {
    setLocalSettings(prev => ({
      ...prev,
      customReminders: {
        ...prev.customReminders,
        [key]: {
          ...prev.customReminders[key],
          [field]: field === 'frequencyHours' ? Number(value) : value
        }
      }
    }));
  };

  const handleBPThresholdChange = (key: keyof typeof localSettings.bpThresholds, value: string) => {
    const numValue = parseInt(value) || 0;
    setLocalSettings(prev => ({
      ...prev,
      bpThresholds: {
        ...prev.bpThresholds,
        [key]: numValue
      }
    }));
  };

  const handleUnitChange = (unit: 'metric' | 'imperial') => {
    setLocalSettings(prev => ({
      ...prev,
      units: unit
    }));
  };

  const saveSettings = () => {
    setProfile({
      ...profile,
      settings: localSettings
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 md:space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-32 transition-colors duration-500">
      {/* Header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="px-4 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg transition-colors">System Registry</span>
          </div>
          <h2 className="text-4xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tighter transition-colors">Settings</h2>
          <p className="text-slate-500 dark:text-slate-500 max-w-md font-medium text-lg transition-colors">Comprehensive control over your clinical workspace and access protocols.</p>
        </div>
        <button 
          onClick={saveSettings}
          className={`px-12 py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl transition-all flex items-center justify-center gap-4 ${isSaved ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-slate-950 dark:bg-white text-white dark:text-slate-950 hover:bg-sky-600 dark:hover:bg-sky-500 dark:hover:text-white transform active:scale-95'}`}
        >
          {isSaved ? (
             <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg> Synchronized</>
          ) : 'Authorize Changes'}
        </button>
      </section>

      <div className="grid grid-cols-1 gap-12 px-4">
        
        {/* NEW: Subscription & Account Section */}
        <section className="space-y-6">
           <div className="flex items-center gap-4 px-4">
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase tracking-[0.3em] text-xs">Account & Plan</h3>
              <div className="h-px flex-1 bg-slate-100 dark:bg-white/5"></div>
           </div>
           
           <div className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-[4rem] border border-slate-100 dark:border-white/5 shadow-xl flex flex-col md:flex-row items-center justify-between gap-10 transition-colors">
              <div className="flex items-center gap-8">
                 <div className="w-20 h-20 bg-slate-50 dark:bg-white/5 rounded-3xl flex items-center justify-center text-sky-500 border border-slate-100 dark:border-white/5 shadow-inner">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                 </div>
                 <div className="space-y-2">
                    <div className="flex items-center gap-3">
                       <h4 className="text-2xl font-black text-slate-900 dark:text-white">Plan: {sub.plan}</h4>
                       <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase tracking-widest rounded-lg border border-emerald-500/20">Active Pulse</span>
                    </div>
                    <p className="text-slate-400 dark:text-slate-600 text-sm font-medium">Your subscription renews on <span className="text-slate-900 dark:text-slate-300 font-bold">{new Date(sub.currentPeriodEnd || '').toLocaleDateString()}</span>.</p>
                 </div>
              </div>
              <Link 
                to="/subscription" 
                className="px-10 py-5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-[2rem] font-black text-[10px] uppercase tracking-widest hover:bg-sky-500 hover:text-white dark:hover:bg-sky-500 hover:border-sky-500 transition-all flex items-center gap-3 group"
              >
                 Manage Access
                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="group-hover:translate-x-1 transition-transform"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
           </div>
        </section>

        {/* Existing: Health Configuration Section */}
        <section className="space-y-6">
           <div className="flex items-center gap-4 px-4">
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase tracking-[0.3em] text-xs">Biometric Protocols</h3>
              <div className="h-px flex-1 bg-slate-100 dark:bg-white/5"></div>
           </div>
           
           <div className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-[4.5rem] border border-slate-100 dark:border-white/10 shadow-sm space-y-12 transition-colors">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                 <div className="space-y-6">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest ml-4 transition-colors">Temperature Scalar</label>
                    <div className="grid grid-cols-2 gap-4">
                       {[
                          { id: 'metric', label: 'Celsius (°C)', color: 'sky' },
                          { id: 'imperial', label: 'Fahrenheit (°F)', color: 'amber' }
                       ].map(unit => (
                          <button 
                            key={unit.id}
                            onClick={() => handleUnitChange(unit.id as any)}
                            className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-3 text-center ${localSettings.units === unit.id ? `border-${unit.color}-500 bg-${unit.color}-50/50 dark:bg-${unit.color}-500/10` : 'border-slate-50 dark:border-white/5 bg-slate-50 dark:bg-white/5'}`}
                          >
                             <span className={`text-[11px] font-black uppercase tracking-widest ${localSettings.units === unit.id ? `text-${unit.color}-600 dark:text-${unit.color}-400` : 'text-slate-400 dark:text-slate-600'}`}>{unit.label}</span>
                          </button>
                       ))}
                    </div>
                 </div>

                 <div className="space-y-6">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest ml-4 transition-colors">Pressure Safeguards</label>
                    <div className="p-8 bg-emerald-50/50 dark:bg-emerald-500/5 rounded-[3rem] border border-emerald-100 dark:border-emerald-500/10 space-y-6">
                       <div className="flex items-center gap-3">
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                          <span className="text-[10px] font-black text-emerald-900 dark:text-emerald-400 uppercase tracking-widest">Normal Threshold Matrix</span>
                       </div>
                       <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                             <span className="text-[9px] font-black text-emerald-600/40 uppercase tracking-widest block ml-2">Systolic Limit</span>
                             <input type="number" value={localSettings.bpThresholds.normalSys} onChange={e => handleBPThresholdChange('normalSys', e.target.value)} className="w-full bg-white dark:bg-slate-800 border-none rounded-2xl px-6 py-4 font-black text-xl text-slate-900 dark:text-white focus:ring-4 focus:ring-emerald-500/20 transition-all outline-none tabular-nums" />
                          </div>
                          <div className="space-y-2">
                             <span className="text-[9px] font-black text-emerald-600/40 uppercase tracking-widest block ml-2">Diastolic Limit</span>
                             <input type="number" value={localSettings.bpThresholds.normalDia} onChange={e => handleBPThresholdChange('normalDia', e.target.value)} className="w-full bg-white dark:bg-slate-800 border-none rounded-2xl px-6 py-4 font-black text-xl text-slate-900 dark:text-white focus:ring-4 focus:ring-emerald-500/20 transition-all outline-none tabular-nums" />
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </section>

        {/* Existing: Logic Section */}
        <section className="space-y-6">
           <div className="flex items-center gap-4 px-4">
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase tracking-[0.3em] text-xs">Alert Synchronization</h3>
              <div className="h-px flex-1 bg-slate-100 dark:bg-white/5"></div>
           </div>
           
           <div className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-[4.5rem] border border-slate-100 dark:border-white/10 shadow-sm space-y-8 transition-colors">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {[
                   { key: 'fluid', label: 'Hydration Node', icon: ICONS.Droplet, color: 'sky' },
                   { key: 'weight', label: 'Weight Registry', icon: ICONS.Scale, color: 'pink' },
                   { key: 'medication', label: 'Pharma Dosing', icon: ICONS.Pill, color: 'indigo' },
                 ].map((item) => (
                    <div key={item.key} className="p-8 bg-slate-50 dark:bg-white/5 rounded-[3.5rem] border border-transparent dark:border-white/5 flex flex-col justify-between min-h-[240px] group hover:bg-white dark:hover:bg-white/10 hover:shadow-xl transition-all duration-500">
                       <div className="flex justify-between items-start">
                          <div className={`w-14 h-14 bg-${item.color}-50 dark:bg-${item.color}-500/10 text-${item.color}-500 rounded-2xl flex items-center justify-center shadow-inner transition-transform group-hover:rotate-12`}>
                             <item.icon className="w-7 h-7" />
                          </div>
                          <button 
                            onClick={() => handleCustomReminderToggle(item.key as any)}
                            className={`relative w-12 h-6 rounded-full transition-all duration-500 flex items-center px-1 ${localSettings.customReminders[item.key as keyof typeof localSettings.customReminders].enabled ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'}`}
                          >
                             <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-all duration-500 transform ${localSettings.customReminders[item.key as keyof typeof localSettings.customReminders].enabled ? 'translate-x-6' : 'translate-x-0'}`} />
                          </button>
                       </div>
                       
                       <div className="space-y-1">
                          <h4 className="text-lg font-black text-slate-900 dark:text-white">{item.label}</h4>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Autonomous Sync Alerts</p>
                       </div>

                       <div className={`flex gap-3 pt-4 transition-all duration-500 ${localSettings.customReminders[item.key as keyof typeof localSettings.customReminders].enabled ? 'opacity-100' : 'opacity-20 pointer-events-none grayscale'}`}>
                          <input 
                            type="number" 
                            min="1"
                            value={localSettings.customReminders[item.key as keyof typeof localSettings.customReminders].frequencyHours}
                            onChange={(e) => handleCustomReminderChange(item.key as any, 'frequencyHours', e.target.value)}
                            className="w-1/2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/10 rounded-xl px-3 py-2 font-black text-slate-900 dark:text-white outline-none text-xs tabular-nums"
                          />
                          <input 
                            type="time" 
                            value={localSettings.customReminders[item.key as keyof typeof localSettings.customReminders].startTime}
                            onChange={(e) => handleCustomReminderChange(item.key as any, 'startTime', e.target.value)}
                            className="w-1/2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/10 rounded-xl px-3 py-2 font-black text-slate-900 dark:text-white outline-none text-[10px]"
                          />
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </section>
      </div>
    </div>
  );
};

export default Settings;
