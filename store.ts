
import { useState, useEffect } from 'react';
import { 
  DialysisSession, WeightLog, FluidIntake, Medication, UserProfile, 
  DialysisType, VitalLog, SubscriptionPlan, SubscriptionStatus, BillingInterval,
  CustomReportConfig, MealLog, MoodLog
} from './types';

const STORAGE_KEY = 'renalcare_data';
const THEME_KEY = 'dialysis_theme';

const DEFAULT_PROFILE: UserProfile = {
  name: 'New Patient',
  email: '',
  timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  dailyFluidLimit: 1500,
  weightGoal: 75.0,
  preferredDialysisType: DialysisType.HOME_HD,
  dialysisMode: 'home',
  isOnDialysis: true,
  trackingPrefs: {
    weight: true,
    fluid: true,
    meds: true,
    symptoms: true,
    bp: true
  },
  isOnboarded: false,
  subscription: {
    plan: SubscriptionPlan.FREE,
    status: SubscriptionStatus.ACTIVE,
    billingInterval: BillingInterval.MONTH,
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    cancelAtPeriodEnd: false,
    maxSessions: 10,
    maxMedications: 5,
    maxReports: 1,
    autoRenew: true,
    emailReceipts: true,
    billingEmail: '',
    features: {
      advancedAnalytics: false,
      exportData: false,
      multipleProfiles: false,
      prioritySupport: false,
      customReminders: false,
      familySharing: false,
    }
  },
  settings: {
    notifications: {
      fluidReminders: true,
      weightReminders: true,
      medicationAlerts: true,
      sessionStartReminders: false
    },
    customReminders: {
      fluid: { enabled: true, frequencyHours: 4, startTime: '08:00' },
      weight: { enabled: true, frequencyHours: 24, startTime: '07:30' },
      medication: { enabled: true, frequencyHours: 6, startTime: '09:00' },
      sessionStart: { enabled: false, startTime: '08:00', days: ['Mon', 'Wed', 'Fri'] },
      sessionEnd: { enabled: false, startTime: '12:00', days: ['Mon', 'Wed', 'Fri'] }
    },
    units: 'metric',
    display: {
      compactMode: false,
      showAIInghts: true,
      theme: 'dark'
    },
    bpThresholds: {
      normalSys: 120,
      normalDia: 80,
      elevatedSys: 120,
      stage1Sys: 130,
      stage1Dia: 80,
      stage2Sys: 140,
      stage2Dia: 90
    }
  }
};

export function useStore() {
  const [sessions, setSessions] = useState<DialysisSession[]>([]);
  const [weights, setWeights] = useState<WeightLog[]>([]);
  const [fluids, setFluids] = useState<FluidIntake[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [vitals, setVitals] = useState<VitalLog[]>([]);
  const [meals, setMeals] = useState<MealLog[]>([]);
  const [moods, setMoods] = useState<MoodLog[]>([]);
  const [savedReports, setSavedReports] = useState<CustomReportConfig[]>([]);
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('lifeondialysis_auth') === 'true';
  });

  // Sync theme with HTML class
  useEffect(() => {
    const applyTheme = (theme: 'light' | 'dark') => {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      localStorage.setItem(THEME_KEY, theme);
    };

    applyTheme(profile.settings.display.theme);
  }, [profile.settings.display.theme]);

  useEffect(() => {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      setSessions(parsed.sessions || []);
      setWeights(parsed.weights || []);
      setFluids(parsed.fluids || []);
      setMedications(parsed.medications || []);
      setVitals(parsed.vitals || []);
      setMeals(parsed.meals || []);
      setMoods(parsed.moods || []);
      setSavedReports(parsed.savedReports || []);
      
      const savedTheme = (localStorage.getItem(THEME_KEY) as 'light' | 'dark') || 'dark';

      const mergedProfile = {
        ...DEFAULT_PROFILE,
        ...parsed.profile,
        subscription: {
            ...DEFAULT_PROFILE.subscription,
            ...parsed.profile?.subscription
        },
        settings: {
          ...DEFAULT_PROFILE.settings,
          ...parsed.profile?.settings,
          display: {
            ...DEFAULT_PROFILE.settings.display,
            ...parsed.profile?.settings?.display,
            theme: savedTheme
          },
          customReminders: {
            ...DEFAULT_PROFILE.settings.customReminders,
            ...parsed.profile?.settings?.customReminders
          },
          bpThresholds: {
            ...DEFAULT_PROFILE.settings.bpThresholds,
            ...parsed.profile?.settings?.bpThresholds
          }
        }
      };
      setProfile(mergedProfile);
    } else {
      setMedications([
        { id: '1', name: 'Phosphate Binder', dosage: '800mg', frequency: 'With meals', onDialysisDays: true, onNonDialysisDays: true },
        { id: '2', name: 'Vitamin D', dosage: '1mcg', frequency: 'Daily', onDialysisDays: true, onNonDialysisDays: true },
        { id: '3', name: 'Iron Supplement', dosage: '100mg', frequency: 'Mon/Wed/Fri', onDialysisDays: true, onNonDialysisDays: false },
      ]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ sessions, weights, fluids, medications, vitals, meals, moods, savedReports, profile }));
  }, [sessions, weights, fluids, medications, vitals, meals, moods, savedReports, profile]);

  const login = () => {
    setIsAuthenticated(true);
    localStorage.setItem('lifeondialysis_auth', 'true');
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('lifeondialysis_auth');
  };

  const setTheme = (theme: 'light' | 'dark') => {
    setProfile(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        display: {
          ...prev.settings.display,
          theme
        }
      }
    }));
  };

  const completeOnboarding = (data: Partial<UserProfile>) => {
    setProfile(prev => ({
      ...prev,
      ...data,
      isOnboarded: true
    }));
  };

  const addSession = (session: DialysisSession) => setSessions(prev => [session, ...prev]);
  const updateSession = (updated: DialysisSession) => setSessions(prev => prev.map(s => s.id === updated.id ? updated : s));
  const addWeight = (weight: WeightLog) => setWeights(prev => [weight, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  const addFluid = (fluid: FluidIntake) => setFluids(prev => [fluid, ...prev]);
  const clearDailyFluids = () => setFluids([]);
  const addMed = (med: Medication) => setMedications(prev => [...prev, med]);
  const addVital = (vital: VitalLog) => setVitals(prev => [vital, ...prev].sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime()));
  const addMeal = (meal: MealLog) => setMeals(prev => [meal, ...prev].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()));
  const removeMeal = (id: string) => setMeals(prev => prev.filter(m => m.id !== id));
  const addMood = (mood: MoodLog) => setMoods(prev => [mood, ...prev].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()));
  
  const addSavedReport = (report: CustomReportConfig) => setSavedReports(prev => [report, ...prev]);
  const removeSavedReport = (id: string) => setSavedReports(prev => prev.filter(r => r.id !== id));

  return {
    isAuthenticated, login, logout,
    sessions, addSession, updateSession,
    weights, addWeight,
    fluids, addFluid, clearDailyFluids,
    medications, addMed,
    vitals, addVital,
    meals, addMeal, removeMeal,
    moods, addMood,
    savedReports, addSavedReport, removeSavedReport,
    profile, setProfile, setTheme, completeOnboarding
  };
}
