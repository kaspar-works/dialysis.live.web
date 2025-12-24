
import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store';
import { DialysisType } from '../types';
import { exportDataAsJSON } from '../services/export';
import { getMe, getSettings } from '../services/user';
import { getAuthToken } from '../services/auth';

const Profile: React.FC = () => {
  const { profile, setProfile, sessions, weights, fluids, vitals, medications } = useStore();
  const [formData, setFormData] = useState(profile);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiUser, setApiUser] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch user data from API on mount
  useEffect(() => {
    const fetchUserData = async () => {
      const token = getAuthToken();
      if (!token) return;

      setIsLoading(true);
      try {
        const userData = await getMe();
        setApiUser(userData);

        // Update local profile with API data
        if (userData.profile || userData.settings) {
          const updatedProfile = {
            ...profile,
            name: userData.profile?.fullName || profile.name,
            email: userData.user?.email || profile.email,
            dailyFluidLimit: userData.settings?.dailyFluidLimitMl || profile.dailyFluidLimit,
            weightGoal: userData.settings?.dryWeightKg || profile.weightGoal,
          };
          setFormData(updatedProfile);
        }
      } catch (err) {
        console.log('Failed to fetch user data from API:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const defaultAvatar = "https://ui-avatars.com/api/?name=" + encodeURIComponent(formData.name || profile.name) + "&background=0ea5e9&color=fff&size=128&bold=true";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Save to backend if authenticated
      const token = getAuthToken();
      if (token) {
        const { updateSettings } = await import('../services/user');
        await updateSettings({
          dailyFluidLimitMl: formData.dailyFluidLimit,
          dryWeightKg: formData.weightGoal,
        });
      }

      // Save to local state
      setProfile(formData);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
      // Still save locally even if API fails
      setProfile(formData);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setFormData({ ...formData, avatarUrl: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  const handleExport = () => {
    const fullData = {
      profile,
      sessions,
      weights,
      fluids,
      vitals,
      medications,
      exportedAt: new Date().toISOString()
    };
    exportDataAsJSON(fullData, `renal-archive-${profile.name.replace(/\s+/g, '-').toLowerCase()}`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
      {/* Header */}
      <section className="space-y-2">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-white text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] rounded-lg border border-slate-100 shadow-sm">Identity Management</span>
        </div>
        <h2 className="text-4xl font-black text-slate-900 tracking-tight">User Configuration</h2>
        <p className="text-slate-500 font-medium text-lg leading-relaxed">Customize your clinical targets and personal information.</p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Avatar Card */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm text-center space-y-6">
            <div className="relative inline-block group">
              <img 
                src={formData.avatarUrl || defaultAvatar} 
                className="w-32 h-32 rounded-[2.5rem] ring-8 ring-slate-50 shadow-xl mx-auto object-cover transition-all duration-300 group-hover:brightness-75" 
                alt="Profile"
              />
              <button 
                onClick={triggerUpload}
                className="absolute -bottom-2 -right-2 w-10 h-10 bg-sky-500 border-4 border-white rounded-2xl flex items-center justify-center text-white shadow-lg hover:bg-sky-600 transition-all active:scale-95"
                title="Upload Photo"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*"
              />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">{formData.name || profile.name}</h3>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">{formData.email || profile.email || 'No email'}</p>
              {apiUser?.user?.id && (
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">ID: {apiUser.user.id.slice(-8)}</p>
              )}
            </div>
            <div className="pt-4 flex flex-wrap gap-2 justify-center">
              {apiUser ? (
                <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-tight border border-emerald-100">Synced</span>
              ) : (
                <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-lg text-[9px] font-black uppercase tracking-tight border border-amber-100">Local Only</span>
              )}
              <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black uppercase tracking-tight border border-indigo-100">{formData.preferredDialysisType || 'Home HD'}</span>
            </div>
          </div>

          <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-xl">
            <h4 className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-6">Security & Privacy</h4>
            <div className="space-y-4">
              <button 
                onClick={handleExport}
                className="w-full text-left p-4 rounded-2xl bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition-colors flex justify-between items-center"
              >
                Export Health Data
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              </button>
              <button className="w-full text-left p-4 rounded-2xl bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition-colors flex justify-between items-center text-rose-400">
                Erase All Session Data
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
              </button>
            </div>
          </div>
        </div>

        {/* Form Area */}
        <div className="lg:col-span-8 bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm">
          {isLoading && (
              <div className="flex items-center gap-3 p-4 bg-sky-50 dark:bg-sky-500/10 rounded-2xl border border-sky-100 dark:border-sky-500/20 mb-6">
                <div className="w-5 h-5 border-2 border-sky-500/30 border-t-sky-500 rounded-full animate-spin"></div>
                <span className="text-sm font-bold text-sky-600 dark:text-sky-400">Loading profile data...</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest ml-1">Full Legal Name</label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-2xl px-6 py-4 font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-sky-50 dark:focus:ring-sky-500/10 focus:border-sky-500 transition-all outline-none"
                    placeholder="e.g. Alex Johnson"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    value={formData.email || ''}
                    readOnly
                    className="w-full bg-slate-100 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 rounded-2xl px-6 py-4 font-bold text-slate-500 dark:text-slate-400 outline-none cursor-not-allowed"
                    placeholder="Connected via auth"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fluid Intake Limit (ml)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={formData.dailyFluidLimit}
                    onChange={(e) => setFormData({...formData, dailyFluidLimit: parseInt(e.target.value)})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-900 focus:ring-4 focus:ring-sky-50 focus:border-sky-500 transition-all outline-none"
                    placeholder="1500"
                  />
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase">ml / Day</div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dry Weight Goal (kg)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    step="0.1"
                    value={formData.weightGoal}
                    onChange={(e) => setFormData({...formData, weightGoal: parseFloat(e.target.value)})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-900 focus:ring-4 focus:ring-sky-50 focus:border-sky-500 transition-all outline-none"
                    placeholder="75.0"
                  />
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase">Target kg</div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Primary Modality</label>
                <select 
                  value={formData.preferredDialysisType}
                  onChange={(e) => setFormData({...formData, preferredDialysisType: e.target.value as DialysisType})}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-900 focus:ring-4 focus:ring-sky-50 focus:border-sky-500 transition-all outline-none appearance-none cursor-pointer"
                >
                  <option value={DialysisType.HOME_HD}>{DialysisType.HOME_HD}</option>
                  <option value={DialysisType.IN_CENTER_HD}>{DialysisType.IN_CENTER_HD}</option>
                  <option value={DialysisType.CAPD}>{DialysisType.CAPD}</option>
                  <option value={DialysisType.APD}>{DialysisType.APD}</option>
                  <option value={DialysisType.PRE_DIALYSIS}>{DialysisType.PRE_DIALYSIS}</option>
                </select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dialysis Commencement Date</label>
                <input 
                  type="date" 
                  value={formData.dialysisStartDate ? formData.dialysisStartDate.split('T')[0] : ''}
                  onChange={(e) => setFormData({...formData, dialysisStartDate: e.target.value ? new Date(e.target.value).toISOString() : undefined})}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-900 focus:ring-4 focus:ring-sky-50 focus:border-sky-500 transition-all outline-none"
                />
              </div>
            </div>

            <div className="p-8 bg-sky-50 rounded-[2.5rem] border border-sky-100 flex items-start gap-6">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-sky-500 shadow-sm shrink-0 border border-sky-100">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              </div>
              <p className="text-xs font-semibold text-sky-800 leading-relaxed">
                Targets set here will propagate through the dashboard, fluid monitor, and weight tracking systems. Consult your nephrologist before adjusting clinical limits.
              </p>
            </div>

            <div className="flex items-center gap-6 pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-5 rounded-3xl font-black text-sm uppercase tracking-widest shadow-2xl hover:bg-sky-600 dark:hover:bg-sky-500 transition-all transform active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : isSaved ? (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg>
                    Settings Applied
                  </>
                ) : 'Save Configuration'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
