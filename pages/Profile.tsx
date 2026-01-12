
import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { useAlert } from '../contexts/AlertContext';
import { DialysisType } from '../types';
import { ICONS } from '../constants';
import { exportDataAsJSON } from '../services/export';
import { getMe, updateSettings as updateUserSettings } from '../services/user';
import { logout } from '../services/auth';

type TabType = 'personal' | 'clinical' | 'account';

const Profile: React.FC = () => {
  const { showConfirm } = useAlert();
  const { profile, setProfile, sessions, weights, fluids, vitals, medications } = useStore();
  const { isAuthenticated } = useAuth();
  const { weightUnit, fluidUnit, convertWeightToKg, convertWeightFromKg, convertFluidToMl, convertFluidFromMl } = useSettings();
  const [formData, setFormData] = useState(profile);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [apiUser, setApiUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<TabType>('personal');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasFetched = useRef(false);

  // Convert values to display units
  const [displayFluidLimit, setDisplayFluidLimit] = useState('');
  const [displayWeightGoal, setDisplayWeightGoal] = useState('');

  // Validation state
  const [fluidLimitError, setFluidLimitError] = useState('');
  const [weightGoalError, setWeightGoalError] = useState('');
  const [fluidLimitTouched, setFluidLimitTouched] = useState(false);
  const [weightGoalTouched, setWeightGoalTouched] = useState(false);

  // Validate fluid limit
  const validateFluidLimit = (value: string): string => {
    if (!value || value.trim() === '') {
      return ''; // Optional field
    }
    const inputValue = parseFloat(value);
    if (isNaN(inputValue)) {
      return 'Enter a valid number';
    }
    const fluidMl = convertFluidToMl(inputValue);
    if (fluidMl < 500 || fluidMl > 5000) {
      const minDisplay = Math.round(convertFluidFromMl(500));
      const maxDisplay = Math.round(convertFluidFromMl(5000));
      return `Must be ${minDisplay}-${maxDisplay} ${fluidUnit}`;
    }
    return '';
  };

  // Validate dry weight goal
  const validateWeightGoal = (value: string): string => {
    if (!value || value.trim() === '') {
      return ''; // Optional field
    }
    const inputValue = parseFloat(value);
    if (isNaN(inputValue)) {
      return 'Enter a valid number';
    }
    const weightKg = convertWeightToKg(inputValue);
    if (weightKg < 20 || weightKg > 300) {
      const minDisplay = convertWeightFromKg(20);
      const maxDisplay = convertWeightFromKg(300);
      return `Must be ${minDisplay.toFixed(0)}-${maxDisplay.toFixed(0)} ${weightUnit}`;
    }
    return '';
  };

  // Handle fluid limit change
  const handleFluidLimitChange = (value: string) => {
    setDisplayFluidLimit(value);
    if (fluidLimitTouched) {
      setFluidLimitError(validateFluidLimit(value));
    }
  };

  // Handle weight goal change
  const handleWeightGoalChange = (value: string) => {
    setDisplayWeightGoal(value);
    if (weightGoalTouched) {
      setWeightGoalError(validateWeightGoal(value));
    }
  };

  // Check if clinical form has errors
  const hasClinicalErrors = (fluidLimitError !== '' && fluidLimitTouched) || (weightGoalError !== '' && weightGoalTouched);

  useEffect(() => {
    if (formData.dailyFluidLimit) {
      const converted = convertFluidFromMl(formData.dailyFluidLimit);
      setDisplayFluidLimit(fluidUnit === 'oz' ? converted.toFixed(0) : String(Math.round(converted)));
    }
    if (formData.weightGoal) {
      const converted = convertWeightFromKg(formData.weightGoal);
      setDisplayWeightGoal(converted.toFixed(1));
    }
  }, [formData.dailyFluidLimit, formData.weightGoal, fluidUnit, weightUnit, convertFluidFromMl, convertWeightFromKg]);

  // Fetch user data from API on mount
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchUserData = async () => {
      if (!isAuthenticated) return;

      setIsLoading(true);
      try {
        const userData = await getMe();
        setApiUser(userData);

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
  }, [isAuthenticated]);

  const defaultAvatar = "https://ui-avatars.com/api/?name=" + encodeURIComponent(formData.name || profile.name) + "&background=8b5cf6&color=fff&size=128&bold=true";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark fields as touched and validate (only for clinical tab)
    if (activeTab === 'clinical') {
      setFluidLimitTouched(true);
      setWeightGoalTouched(true);

      const fluidError = validateFluidLimit(displayFluidLimit);
      const weightError = validateWeightGoal(displayWeightGoal);

      setFluidLimitError(fluidError);
      setWeightGoalError(weightError);

      if (fluidError || weightError) {
        return;
      }
    }

    setIsSaving(true);

    try {
      // Convert display values back to storage units
      const fluidLimitMl = Math.round(convertFluidToMl(parseFloat(displayFluidLimit) || 0));
      const weightGoalKg = convertWeightToKg(parseFloat(displayWeightGoal) || 0);

      const updatedFormData = {
        ...formData,
        dailyFluidLimit: fluidLimitMl,
        weightGoal: weightGoalKg,
      };

      if (isAuthenticated) {
        await updateUserSettings({
          dailyFluidLimitMl: fluidLimitMl,
          dryWeightKg: weightGoalKg,
        });
      }

      setProfile(updatedFormData);
      setFormData(updatedFormData);
      setIsSaved(true);
      // Clear validation state on success
      setFluidLimitError('');
      setWeightGoalError('');
      setFluidLimitTouched(false);
      setWeightGoalTouched(false);
      setNotification({ message: 'Profile saved successfully', type: 'success' });
      setTimeout(() => {
        setIsSaved(false);
        setNotification(null);
      }, 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
      setNotification({ message: 'Failed to save. Please try again.', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setIsSaving(false);
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
    exportDataAsJSON(fullData, `dialysis-data-${profile.name.replace(/\s+/g, '-').toLowerCase()}`);
    setNotification({ message: 'Data exported successfully', type: 'success' });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleLogout = () => {
    showConfirm(
      'Sign Out',
      'Are you sure you want to sign out of your account?',
      () => {
        logout();
      },
      { confirmText: 'Sign Out', cancelText: 'Cancel' }
    );
  };

  const tabs = [
    { id: 'personal' as TabType, label: 'Personal', icon: '👤' },
    { id: 'clinical' as TabType, label: 'Clinical', icon: '🏥' },
    { id: 'account' as TabType, label: 'Account', icon: '🔐' },
  ];

  // Calculate account stats
  const accountAge = apiUser?.user?.createdAt
    ? Math.floor((Date.now() - new Date(apiUser.user.createdAt).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  if (isLoading) {
    return (
      <div className="w-full px-4 py-20 flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 relative">
          <div className="absolute inset-0 border-4 border-purple-500/20 rounded-full" />
          <div className="absolute inset-0 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <span className="absolute inset-0 flex items-center justify-center text-2xl">👤</span>
        </div>
        <p className="text-slate-400 font-medium">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-24 px-4 animate-in fade-in duration-500">
      {/* Header */}
      <header className="flex items-center justify-between pt-2">
        <div>
          <span className="px-3 py-1 bg-purple-500/10 text-purple-500 text-[10px] font-bold uppercase tracking-wider rounded-full">
            Settings
          </span>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight mt-2">
            Profile
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage your account and preferences
          </p>
        </div>
      </header>

      {/* Profile Hero Card */}
      <div className="relative bg-gradient-to-br from-slate-900 via-purple-900/50 to-slate-900 rounded-[2rem] p-6 md:p-8 overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-violet-500/20 rounded-full blur-3xl" />

        <div className="relative flex flex-col md:flex-row items-center gap-6">
          {/* Avatar */}
          <div className="relative group">
            <div className="w-28 h-28 rounded-3xl ring-4 ring-white/10 overflow-hidden">
              <img
                src={formData.avatarUrl || defaultAvatar}
                className="w-full h-full object-cover transition-all duration-300 group-hover:scale-110"
                alt="Profile"
              />
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-2 -right-2 w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center text-white shadow-lg hover:bg-purple-600 transition-all hover:scale-105 active:scale-95"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*"
            />
          </div>

          {/* User Info */}
          <div className="text-center md:text-left flex-1">
            <h2 className="text-2xl font-black text-white">{formData.name || 'User'}</h2>
            <p className="text-white/60 text-sm mt-1">{formData.email || 'No email connected'}</p>

            <div className="flex flex-wrap gap-2 mt-4 justify-center md:justify-start">
              {apiUser ? (
                <span className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  Synced
                </span>
              ) : (
                <span className="px-3 py-1.5 bg-amber-500/20 text-amber-400 rounded-lg text-xs font-bold">
                  Local Only
                </span>
              )}
              <span className="px-3 py-1.5 bg-purple-500/20 text-purple-400 rounded-lg text-xs font-bold">
                {formData.preferredDialysisType || 'Home HD'}
              </span>
              {apiUser?.user?.id && (
                <span className="px-3 py-1.5 bg-white/5 text-white/40 rounded-lg text-xs font-bold">
                  ID: {apiUser.user.id.slice(-8)}
                </span>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex gap-3">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center min-w-[80px]">
              <p className="text-2xl font-black text-white">{sessions?.length || 0}</p>
              <p className="text-white/40 text-[10px] font-bold uppercase">Sessions</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center min-w-[80px]">
              <p className="text-2xl font-black text-white">{accountAge}</p>
              <p className="text-white/40 text-[10px] font-bold uppercase">Days</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-2xl">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all ${
              activeTab === tab.id
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <span>{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <form onSubmit={handleSubmit}>
        {/* Personal Tab */}
        {activeTab === 'personal' && (
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-700 space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center">
                <span className="text-2xl">👤</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Personal Information</h3>
                <p className="text-slate-400 text-sm">Your basic profile details</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3.5 font-semibold text-slate-900 dark:text-white outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-500/10 transition-all"
                  placeholder="Enter your name"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Email Address</label>
                <input
                  type="email"
                  value={formData.email || ''}
                  readOnly
                  className="w-full bg-slate-100 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3.5 font-semibold text-slate-500 dark:text-slate-400 outline-none cursor-not-allowed"
                  placeholder="Connected via auth"
                />
                <p className="text-xs text-slate-400 mt-1.5">Email is managed by your authentication provider</p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Primary Dialysis Type</label>
                <div className="relative">
                  <select
                    value={formData.preferredDialysisType}
                    onChange={(e) => setFormData({...formData, preferredDialysisType: e.target.value as DialysisType})}
                    className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3.5 font-semibold text-slate-900 dark:text-white outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-500/10 transition-all appearance-none cursor-pointer"
                  >
                    <option value={DialysisType.HOME_HD}>Home HD</option>
                    <option value={DialysisType.IN_CENTER_HD}>In-Center HD</option>
                    <option value={DialysisType.CAPD}>CAPD</option>
                    <option value={DialysisType.APD}>APD</option>
                    <option value={DialysisType.PRE_DIALYSIS}>Pre-Dialysis</option>
                  </select>
                  <ICONS.ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Dialysis Start Date</label>
                <input
                  type="date"
                  value={formData.dialysisStartDate ? formData.dialysisStartDate.split('T')[0] : ''}
                  onChange={(e) => setFormData({...formData, dialysisStartDate: e.target.value ? new Date(e.target.value).toISOString() : undefined})}
                  className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3.5 font-semibold text-slate-900 dark:text-white outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-500/10 transition-all"
                />
              </div>
            </div>
          </div>
        )}

        {/* Clinical Tab */}
        {activeTab === 'clinical' && (
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-700 space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-sky-500/10 rounded-2xl flex items-center justify-center">
                <span className="text-2xl">🏥</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Clinical Targets</h3>
                <p className="text-slate-400 text-sm">Your health goals and limits</p>
              </div>
            </div>

            {/* Current Values Display */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gradient-to-br from-sky-500/10 to-cyan-500/10 border border-sky-500/20 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">💧</span>
                  <span className="text-xs font-bold text-sky-500 uppercase">Daily Fluid Limit</span>
                </div>
                <p className="text-3xl font-black text-slate-900 dark:text-white">
                  {displayFluidLimit || '--'}
                  <span className="text-lg text-slate-400 ml-1">{fluidUnit}</span>
                </p>
              </div>
              <div className="bg-gradient-to-br from-purple-500/10 to-violet-500/10 border border-purple-500/20 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">⚖️</span>
                  <span className="text-xs font-bold text-purple-500 uppercase">Dry Weight Goal</span>
                </div>
                <p className="text-3xl font-black text-slate-900 dark:text-white">
                  {displayWeightGoal || '--'}
                  <span className="text-lg text-slate-400 ml-1">{weightUnit}</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                  Daily Fluid Limit ({fluidUnit})
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={displayFluidLimit}
                    onChange={(e) => handleFluidLimitChange(e.target.value)}
                    onBlur={() => {
                      setFluidLimitTouched(true);
                      setFluidLimitError(validateFluidLimit(displayFluidLimit));
                    }}
                    className={`w-full rounded-xl px-4 py-3.5 font-semibold text-slate-900 dark:text-white outline-none transition-all ${
                      fluidLimitError && fluidLimitTouched
                        ? 'bg-rose-50 dark:bg-rose-500/10 border-2 border-rose-400 dark:border-rose-500'
                        : 'bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 focus:border-sky-400 focus:ring-4 focus:ring-sky-500/10'
                    }`}
                    placeholder={fluidUnit === 'oz' ? 'e.g. 50' : 'e.g. 1500'}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">{fluidUnit}/day</span>
                </div>
                {fluidLimitError && fluidLimitTouched ? (
                  <p className="text-xs text-rose-500 mt-1.5">{fluidLimitError}</p>
                ) : (
                  <p className="text-xs text-slate-400 mt-1.5">Maximum daily fluid intake recommended by your care team</p>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                  Dry Weight Goal ({weightUnit})
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={displayWeightGoal}
                    onChange={(e) => handleWeightGoalChange(e.target.value)}
                    onBlur={() => {
                      setWeightGoalTouched(true);
                      setWeightGoalError(validateWeightGoal(displayWeightGoal));
                    }}
                    className={`w-full rounded-xl px-4 py-3.5 font-semibold text-slate-900 dark:text-white outline-none transition-all ${
                      weightGoalError && weightGoalTouched
                        ? 'bg-rose-50 dark:bg-rose-500/10 border-2 border-rose-400 dark:border-rose-500'
                        : 'bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 focus:border-purple-400 focus:ring-4 focus:ring-purple-500/10'
                    }`}
                    placeholder={weightUnit === 'lb' ? 'e.g. 165' : 'e.g. 75'}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">target</span>
                </div>
                {weightGoalError && weightGoalTouched ? (
                  <p className="text-xs text-rose-500 mt-1.5">{weightGoalError}</p>
                ) : (
                  <p className="text-xs text-slate-400 mt-1.5">Your target weight after dialysis sessions</p>
                )}
              </div>
            </div>

            {/* Info Banner */}
            <div className="flex items-start gap-4 p-5 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
              <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-xl">⚠️</span>
              </div>
              <div>
                <p className="text-sm font-bold text-amber-700 dark:text-amber-400">Important Notice</p>
                <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
                  These clinical targets affect calculations throughout the app. Always consult your nephrologist before adjusting these values.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Account Tab */}
        {activeTab === 'account' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Data Management */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
                  <span className="text-2xl">📦</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Data Management</h3>
                  <p className="text-slate-400 text-sm">Export or manage your health data</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={handleExport}
                  className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-2xl hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                      <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-slate-900 dark:text-white">Export All Data</p>
                      <p className="text-xs text-slate-400">Download as JSON file</p>
                    </div>
                  </div>
                  <ICONS.ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                </button>

                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-2xl hover:border-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-rose-500/10 rounded-xl flex items-center justify-center group-hover:bg-rose-500/20 transition-colors">
                      <svg className="w-6 h-6 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-rose-600 dark:text-rose-400">Delete Local Data</p>
                      <p className="text-xs text-slate-400">Clear session cache</p>
                    </div>
                  </div>
                  <ICONS.ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-rose-500 transition-colors" />
                </button>
              </div>
            </div>

            {/* Account Actions */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-slate-500/10 rounded-2xl flex items-center justify-center">
                  <span className="text-2xl">🔐</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Account</h3>
                  <p className="text-slate-400 text-sm">Manage your authentication</p>
                </div>
              </div>

              {apiUser ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-2xl">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">Account Status</p>
                        <p className="text-xs text-emerald-500 font-semibold">Connected & Synced</p>
                      </div>
                    </div>
                    <span className="px-3 py-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg text-xs font-bold">Active</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center justify-between p-5 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-2xl hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-rose-500/20 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-rose-600 dark:text-rose-400">Sign Out</p>
                        <p className="text-xs text-rose-500/70">Log out of your account</p>
                      </div>
                    </div>
                    <ICONS.ChevronRight className="w-5 h-5 text-rose-400" />
                  </button>
                </div>
              ) : (
                <div className="p-5 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
                      <span className="text-2xl">⚠️</span>
                    </div>
                    <div>
                      <p className="font-bold text-amber-700 dark:text-amber-400">Local Mode Only</p>
                      <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
                        Your data is stored locally. Sign in to sync across devices.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Save Button - Only show for personal and clinical tabs */}
        {(activeTab === 'personal' || activeTab === 'clinical') && (
          <div className="pt-6">
            <button
              type="submit"
              disabled={isSaving || (activeTab === 'clinical' && hasClinicalErrors)}
              className={`w-full py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3 ${
                isSaved
                  ? 'bg-emerald-500 text-white'
                  : activeTab === 'clinical' && hasClinicalErrors
                    ? 'bg-slate-400 text-white cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-500 to-violet-500 text-white hover:from-purple-600 hover:to-violet-600 shadow-lg shadow-purple-500/20'
              } disabled:opacity-50`}
            >
              {isSaving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : isSaved ? (
                <>
                  <ICONS.Check className="w-5 h-5" />
                  Saved Successfully
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        )}
      </form>

      {/* Success Notification */}
      {notification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top fade-in duration-300">
          <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl shadow-lg ${
            notification.type === 'success'
              ? 'bg-emerald-500 text-white'
              : 'bg-rose-500 text-white'
          }`}>
            {notification.type === 'success' ? (
              <ICONS.Check className="w-5 h-5" />
            ) : (
              <ICONS.X className="w-5 h-5" />
            )}
            <span className="font-bold">{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="ml-2 p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <ICONS.X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setShowDeleteModal(false)}
          />
          <div className="relative bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 sm:max-w-sm w-full shadow-2xl animate-in slide-in-from-bottom sm:zoom-in-95 fade-in duration-200">
            {/* Mobile drag indicator */}
            <div className="w-10 h-1 bg-slate-300 dark:bg-slate-600 rounded-full mx-auto mb-4 sm:hidden" />

            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-rose-500/10 rounded-xl sm:rounded-2xl flex items-center justify-center text-2xl sm:text-3xl mx-auto mb-3 sm:mb-4">
                🗑️
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-1.5 sm:mb-2">
                Delete Local Data?
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mb-5 sm:mb-6 px-2 sm:px-0">
                This will clear all locally cached session data. Your cloud data will remain intact.
              </p>
              <div className="flex flex-col-reverse sm:flex-row gap-2.5 sm:gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2.5 sm:py-3 rounded-xl font-bold text-sm sm:text-base text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors active:scale-[0.98]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    localStorage.clear();
                    setShowDeleteModal(false);
                    setNotification({ message: 'Local data cleared', type: 'success' });
                    setTimeout(() => setNotification(null), 3000);
                  }}
                  className="flex-1 px-4 py-2.5 sm:py-3 rounded-xl font-bold text-sm sm:text-base text-white bg-rose-500 hover:bg-rose-600 transition-colors active:scale-[0.98]"
                >
                  Delete
                </button>
              </div>
            </div>

            {/* Safe area spacing for mobile */}
            <div className="h-2 sm:h-0" />
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
