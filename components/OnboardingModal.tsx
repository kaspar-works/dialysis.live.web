import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { useAuth } from '../contexts/AuthContext';
import { DialysisType } from '../types';
import Logo from './Logo';
import { completeOnboarding as completeOnboardingApi } from '../services/onboarding';
import { authFetch } from '../services/auth';

const OnboardingModal: React.FC = () => {
  const { profile, completeOnboarding } = useStore();
  const { isAuthenticated, user } = useAuth();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: profile.name || '',
    preferredDialysisType: profile.preferredDialysisType || DialysisType.HOME_HD,
    dailyFluidLimit: profile.dailyFluidLimit || 1500,
    weightGoal: profile.weightGoal || 75.0,
  });

  // Check API for onboarding status
  useEffect(() => {
    const checkOnboarding = async () => {
      // If not authenticated, skip showing the modal
      if (!isAuthenticated) {
        setIsOnboarded(true);
        setChecking(false);
        return;
      }

      // If we already have user info from AuthContext, use it
      if (user) {
        setIsOnboarded(user.onboardingCompleted === true);
        setChecking(false);
        return;
      }

      // Fallback: check via API
      try {
        const result = await authFetch('/auth/me');
        if (result.success !== false && result.data?.user) {
          setIsOnboarded(result.data.user.onboardingCompleted === true);
        }
      } catch (err) {
        console.error('Failed to check onboarding:', err);
        // If auth fails, don't show onboarding - let session expiry handle it
        setIsOnboarded(true);
      }
      setChecking(false);
    };

    checkOnboarding();
  }, [isAuthenticated, user]);

  // Wait while checking
  if (checking) return null;

  // Don't show if onboarded
  if (isOnboarded) return null;

  const totalSteps = 4;

  const nextStep = () => setStep(s => Math.min(s + 1, totalSteps));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const handleFinish = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Call API if authenticated
      if (isAuthenticated) {
        await completeOnboardingApi({
          fullName: formData.name,
          dialysisType: formData.preferredDialysisType,
          fluidLimitMl: formData.dailyFluidLimit,
          dryWeightKg: formData.weightGoal,
        });
      }

      // Update local state
      completeOnboarding(formData);
    } catch (err: any) {
      console.error('Onboarding error:', err);
      // Still complete locally even if API fails
      completeOnboarding(formData);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 md:p-10 animate-in fade-in duration-500 overflow-y-auto">
      <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-3xl" />

      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-[2.5rem] md:rounded-[4rem] shadow-4xl overflow-hidden relative z-10 flex flex-col md:flex-row min-h-[500px] md:min-h-[600px] border border-white/5 transition-all">

        {/* Progress Sidebar - Hidden on mobile for space */}
        <div className="hidden md:flex md:w-72 bg-slate-50 dark:bg-white/5 p-12 flex-col justify-between shrink-0 border-r border-slate-100 dark:border-white/5">
           <div className="space-y-12">
              <Logo className="w-12 h-12" />
              <div className="space-y-6">
                 {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center gap-4">
                       <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-all ${step === i ? 'bg-sky-500 text-white shadow-lg scale-110' : step > i ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-white/10 text-slate-400'}`}>
                          {step > i ? '✓' : i}
                       </div>
                       <span className={`text-[10px] font-black uppercase tracking-widest ${step === i ? 'text-slate-900 dark:text-white' : 'text-slate-300 dark:text-slate-700'}`}>
                          {i === 1 ? 'Identity' : i === 2 ? 'Modality' : i === 3 ? 'Targets' : 'Finalize'}
                       </span>
                    </div>
                 ))}
              </div>
           </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-8 sm:p-12 lg:p-20 flex flex-col justify-between relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>

           {/* Mobile header (only visible when sidebar is hidden) */}
           <div className="md:hidden flex items-center justify-between mb-8">
              <Logo className="w-8 h-8" />
              <div className="flex gap-1.5">
                 {[1,2,3,4].map(i => (
                    <div key={i} className={`h-1.5 w-6 rounded-full ${step === i ? 'bg-sky-500' : 'bg-slate-100 dark:bg-white/5'}`}></div>
                 ))}
              </div>
           </div>

           <div className="relative z-10 flex-1">
              {step === 1 && (
                <div className="space-y-8 md:space-y-10 animate-in slide-in-from-right-8 duration-500">
                   <div className="space-y-4">
                      <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">Who are you?</h2>
                      <p className="text-slate-500 dark:text-slate-400 text-base md:text-lg font-medium">Platform identity initialization.</p>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Full Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl md:rounded-[2rem] px-8 py-6 md:px-10 md:py-7 font-black text-xl md:text-2xl text-slate-900 dark:text-white outline-none focus:ring-8 focus:ring-sky-500/5 transition-all"
                        placeholder="e.g. Alex Johnson"
                        autoFocus
                      />
                   </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-8 md:space-y-10 animate-in slide-in-from-right-8 duration-500 overflow-y-auto max-h-[60vh] md:max-h-none pr-2 custom-scrollbar">
                   <div className="space-y-4">
                      <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">Modality.</h2>
                      <p className="text-slate-500 dark:text-slate-400 text-base md:text-lg font-medium">Select your primary dialysis protocol.</p>
                   </div>
                   <div className="grid grid-cols-1 gap-2 md:gap-3">
                      {Object.values(DialysisType).map((type) => (
                        <button
                          key={type}
                          onClick={() => setFormData({...formData, preferredDialysisType: type})}
                          className={`p-5 md:p-6 rounded-2xl md:rounded-3xl border-2 text-left transition-all flex items-center justify-between group ${formData.preferredDialysisType === type ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-500/10' : 'border-slate-50 dark:border-white/5 bg-slate-50 dark:bg-white/5'}`}
                        >
                           <span className={`text-[10px] md:text-xs font-black uppercase tracking-widest ${formData.preferredDialysisType === type ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400'}`}>{type}</span>
                           <div className={`w-3 h-3 rounded-full ${formData.preferredDialysisType === type ? 'bg-sky-500' : 'bg-slate-200 dark:bg-white/10'}`}></div>
                        </button>
                      ))}
                   </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-8 md:space-y-10 animate-in slide-in-from-right-8 duration-500">
                   <div className="space-y-4">
                      <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">Targets.</h2>
                      <p className="text-slate-500 dark:text-slate-400 text-base md:text-lg font-medium">Hydration and mass baselines.</p>
                   </div>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
                      <div className="space-y-4">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Fluid Limit (ml)</label>
                         <input
                           type="number"
                           value={formData.dailyFluidLimit}
                           onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, dailyFluidLimit: parseInt(e.target.value)})}
                           className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl md:rounded-[2rem] px-6 py-5 md:px-8 md:py-6 font-black text-xl md:text-2xl text-slate-900 dark:text-white outline-none text-center"
                         />
                      </div>
                      <div className="space-y-4">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Dry Weight (kg)</label>
                         <input
                           type="number"
                           step="0.1"
                           value={formData.weightGoal}
                           onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, weightGoal: parseFloat(e.target.value)})}
                           className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl md:rounded-[2rem] px-6 py-5 md:px-8 md:py-6 font-black text-xl md:text-2xl text-slate-900 dark:text-white outline-none text-center"
                         />
                      </div>
                   </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-8 md:space-y-10 animate-in zoom-in-95 duration-700 text-center flex flex-col items-center">
                   <div className="w-20 h-20 md:w-24 md:h-24 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 rounded-3xl md:rounded-[2.5rem] flex items-center justify-center shadow-inner border border-emerald-100 dark:border-emerald-500/20 mb-4 md:mb-8">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg>
                   </div>
                   <div className="space-y-4">
                      <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">Ready.</h2>
                      <p className="text-slate-500 dark:text-slate-400 text-base md:text-lg font-medium max-w-sm mx-auto">
                         Profile initialization complete. Launching clinical hub.
                      </p>
                   </div>
                </div>
              )}
           </div>

           <div className="relative z-10 pt-10 flex gap-4 md:gap-6">
              {step > 1 && step < 4 && (
                <button onClick={prevStep} className="px-6 md:px-10 py-5 md:py-6 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">Back</button>
              )}
              {step < 4 ? (
                <button
                  onClick={nextStep}
                  disabled={step === 1 && !formData.name}
                  className="flex-1 py-5 md:py-6 bg-slate-950 dark:bg-white text-white dark:text-slate-950 rounded-2xl md:rounded-[2rem] font-black text-xs md:text-sm uppercase tracking-[0.4em] shadow-2xl hover:bg-sky-600 transition-all disabled:opacity-30"
                >
                   Continue
                </button>
              ) : (
                <button
                  onClick={handleFinish}
                  disabled={isLoading}
                  className="w-full py-6 md:py-8 bg-emerald-500 text-white rounded-2xl md:rounded-[2.5rem] font-black text-sm md:text-base uppercase tracking-[0.5em] shadow-xl hover:bg-emerald-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Syncing...
                    </>
                  ) : 'Sync Platform'}
                </button>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;
