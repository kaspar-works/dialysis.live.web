import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { ICONS } from '../constants';
import { Link, useNavigate } from 'react-router';
import { getSettings, updateSettings, UserSettings, defaultSettings } from '../services/settings';
import {
  getCurrentSubscription,
  updateSubscription,
  Subscription,
  PlanType,
  BillingInterval,
  PLAN_CONFIGS,
  getPlanDisplayName,
} from '../services/subscription';
import { deleteAccount } from '../services/auth';
import PaymentModal from '../components/PaymentModal';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const Settings: React.FC = () => {
  const { profile } = useStore();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [activeSection, setActiveSection] = useState<string>('dialysis');
  const hasFetched = useRef(false);

  // Plan upgrade state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeError, setUpgradeError] = useState<string | null>(null);

  // Delete account state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const [settingsData, subData] = await Promise.all([
        getSettings(),
        getCurrentSubscription(),
      ]);
      setSettings(settingsData);
      setSubscription(subData);
    } catch (err: any) {
      if (!err?.message?.includes('Session expired')) {
        console.error('Failed to load settings:', err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlanChange = (plan: PlanType) => {
    if (!subscription || subscription.plan === plan) return;
    if (subscription.plan === 'free' && plan !== 'free') {
      setSelectedPlan(plan);
      setShowPaymentModal(true);
      return;
    }
    handlePlanUpdate(plan);
  };

  const handlePlanUpdate = async (plan: PlanType, paymentMethodId?: string) => {
    setIsUpgrading(true);
    setUpgradeError(null);
    try {
      const updated = await updateSubscription(plan, paymentMethodId, 'month');
      setSubscription(updated);
      setShowPaymentModal(false);
      setSelectedPlan(null);
    } catch (err: any) {
      console.error('Failed to update plan:', err);
      setUpgradeError(err.message || 'Failed to update plan');
    } finally {
      setIsUpgrading(false);
    }
  };

  const handlePaymentSuccess = async (paymentMethodId: string) => {
    if (selectedPlan) {
      await handlePlanUpdate(selectedPlan, paymentMethodId);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteAccount();
      navigate('/logout');
    } catch (err: any) {
      console.error('Failed to delete account:', err);
      setDeleteError(err.message || 'Failed to delete account. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');
    try {
      const updated = await updateSettings(settings);
      setSettings(updated);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      console.error('Failed to save settings:', err);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = <K extends keyof UserSettings>(field: K, value: UserSettings[K]) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const toggleDay = (day: string) => {
    const days = settings.dialysisDays || [];
    if (days.includes(day)) {
      updateField('dialysisDays', days.filter(d => d !== day));
    } else {
      updateField('dialysisDays', [...days, day]);
    }
  };

  const sections = [
    { id: 'dialysis', label: 'Dialysis', icon: '💉', color: 'from-rose-500 to-pink-500' },
    { id: 'fluid', label: 'Fluid', icon: '💧', color: 'from-sky-500 to-cyan-500' },
    { id: 'weight', label: 'Weight', icon: '⚖️', color: 'from-emerald-500 to-green-500' },
    { id: 'vitals', label: 'Vitals', icon: '❤️', color: 'from-red-500 to-rose-500' },
    { id: 'alerts', label: 'Alerts', icon: '🔔', color: 'from-amber-500 to-yellow-500' },
    { id: 'emergency', label: 'Emergency', icon: '🚨', color: 'from-orange-500 to-red-500' },
    { id: 'preferences', label: 'Preferences', icon: '⚙️', color: 'from-violet-500 to-purple-500' },
  ];

  const activeConfig = sections.find(s => s.id === activeSection);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 relative mx-auto">
            <div className="absolute inset-0 border-4 border-sky-500/20 rounded-full" />
            <div className="absolute inset-0 border-4 border-transparent border-t-sky-500 rounded-full animate-spin" />
            <div className="absolute inset-3 bg-gradient-to-br from-sky-500 to-cyan-500 rounded-full flex items-center justify-center text-xl">
              ⚙️
            </div>
          </div>
          <p className="text-slate-400 text-sm font-medium">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-24 px-4 animate-in fade-in duration-500">
      {/* Success Toast */}
      {saveStatus === 'saved' && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top fade-in duration-300">
          <div className="bg-gradient-to-r from-emerald-500 to-green-500 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="font-bold">Settings saved!</span>
          </div>
        </div>
      )}

      {/* Hero Card */}
      <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-violet-500/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-500 flex items-center justify-center text-3xl shadow-lg shadow-sky-500/30">
                ⚙️
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-black text-white">Settings</h1>
                <p className="text-slate-400 mt-1">Manage your dialysis and health preferences</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden md:block">
                <p className="text-slate-400 text-xs font-medium">Welcome</p>
                <p className="text-white font-bold">{profile.name || 'User'}</p>
              </div>
              <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-3 bg-white text-slate-900 rounded-xl font-bold text-sm hover:bg-sky-100 transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg"
            >
              {isSaving ? (
                <div className="w-5 h-5 border-2 border-slate-400/30 border-t-slate-400 rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
              Save Changes
            </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
              <p className="text-slate-400 text-xs font-medium">Plan</p>
              <p className="text-white font-black text-lg capitalize">{subscription?.plan || 'Free'}</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
              <p className="text-slate-400 text-xs font-medium">Dialysis Days</p>
              <p className="text-white font-black text-lg">{settings.dialysisDays?.length || 0}/week</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
              <p className="text-slate-400 text-xs font-medium">Fluid Limit</p>
              <p className="text-white font-black text-lg">{settings.dailyFluidLimitMl || 0} ml</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
              <p className="text-slate-400 text-xs font-medium">Dry Weight</p>
              <p className="text-white font-black text-lg">{settings.dryWeightKg || '--'} kg</p>
            </div>
          </div>
        </div>
      </div>

      {/* Account Section - Plan Management */}
      {subscription && (
        <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 border border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${
                subscription.plan === 'premium'
                  ? 'bg-gradient-to-br from-amber-400 to-orange-500'
                  : subscription.plan === 'basic'
                  ? 'bg-gradient-to-br from-sky-400 to-blue-500'
                  : 'bg-slate-100 dark:bg-slate-700'
              }`}>
                {subscription.plan === 'premium' ? '👑' : subscription.plan === 'basic' ? '⚡' : '🎯'}
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white capitalize">
                  {getPlanDisplayName(subscription.plan)} Plan
                </h3>
                <p className="text-sm text-slate-400">
                  {subscription.status === 'active' ? 'Active' : subscription.status}
                </p>
              </div>
            </div>
            <Link
              to="/subscription"
              className="px-4 py-2 text-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 font-bold rounded-xl transition-all"
            >
              Manage Plan
            </Link>
          </div>

          {upgradeError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-xl mb-4">
              <p className="text-sm text-rose-600 dark:text-rose-400">{upgradeError}</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(['free', 'basic', 'premium'] as PlanType[]).map((plan) => {
              const config = PLAN_CONFIGS[plan];
              const isCurrent = subscription.plan === plan;
              return (
                <button
                  key={plan}
                  onClick={() => handlePlanChange(plan)}
                  disabled={isCurrent || isUpgrading}
                  className={`relative p-4 rounded-2xl border-2 text-left transition-all ${
                    isCurrent
                      ? 'border-sky-500 bg-sky-50 dark:bg-sky-500/10'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  } ${isUpgrading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isCurrent && (
                    <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-sky-500 text-white text-xs font-bold rounded-full">
                      Current
                    </span>
                  )}
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{plan === 'premium' ? '👑' : plan === 'basic' ? '⚡' : '🎯'}</span>
                    <span className="font-bold text-slate-900 dark:text-white capitalize">{config.name}</span>
                  </div>
                  <p className="text-lg font-black text-slate-900 dark:text-white">
                    ${config.price.monthly}<span className="text-sm font-normal text-slate-400">/mo</span>
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Section Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {sections.map(section => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`flex items-center gap-2 px-4 py-3 rounded-2xl font-bold text-sm whitespace-nowrap transition-all ${
              activeSection === section.id
                ? `bg-gradient-to-r ${section.color} text-white shadow-lg`
                : 'bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <span className="text-lg">{section.icon}</span>
            {section.label}
          </button>
        ))}
      </div>

      {/* Settings Sections */}
      <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 md:p-8 border border-slate-100 dark:border-slate-700">
        {/* Section Header */}
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100 dark:border-slate-700">
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${activeConfig?.color} flex items-center justify-center text-2xl shadow-lg`}>
            {activeConfig?.icon}
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">{activeConfig?.label} Settings</h3>
            <p className="text-sm text-slate-400">Configure your {activeConfig?.label.toLowerCase()} preferences</p>
          </div>
        </div>

        {/* Dialysis Settings */}
        {activeSection === 'dialysis' && (
          <div className="space-y-8">
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dialysis Type</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'HD', label: 'Hemodialysis', desc: 'In-center or home HD', icon: '💉' },
                  { id: 'PD', label: 'Peritoneal', desc: 'CAPD or APD', icon: '🩹' },
                ].map(type => (
                  <button
                    key={type.id}
                    onClick={() => updateField('dialysisType', type.id as 'HD' | 'PD')}
                    className={`p-4 rounded-2xl border-2 text-left transition-all flex items-start gap-3 ${
                      settings.dialysisType === type.id
                        ? 'border-sky-500 bg-sky-50 dark:bg-sky-500/10'
                        : 'border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600'
                    }`}
                  >
                    <span className="text-2xl">{type.icon}</span>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{type.label}</p>
                      <p className="text-xs text-slate-400">{type.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dialysis Days</label>
              <div className="flex flex-wrap gap-2">
                {DAYS.map(day => (
                  <button
                    key={day}
                    onClick={() => toggleDay(day)}
                    className={`w-14 h-14 rounded-2xl font-bold text-sm transition-all ${
                      settings.dialysisDays?.includes(day)
                        ? 'bg-gradient-to-br from-sky-500 to-cyan-500 text-white shadow-lg shadow-sky-500/30'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    {day.slice(0, 2)}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Start Time</label>
                <input
                  type="time"
                  value={settings.dialysisStartTime || ''}
                  onChange={e => updateField('dialysisStartTime', e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500/20"
                />
              </div>
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Duration (min)</label>
                <input
                  type="number"
                  value={settings.typicalSessionMinutes || ''}
                  onChange={e => updateField('typicalSessionMinutes', parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500/20"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Access Type</label>
              <div className="grid grid-cols-3 gap-3">
                {['Fistula', 'Graft', 'Catheter'].map(type => (
                  <button
                    key={type}
                    onClick={() => updateField('accessType', type as any)}
                    className={`p-4 rounded-xl font-bold text-sm transition-all ${
                      settings.accessType === type
                        ? 'bg-gradient-to-br from-sky-500 to-cyan-500 text-white shadow-lg'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dialysis Center</label>
              <input
                type="text"
                value={settings.dialysisCenterName || ''}
                onChange={e => updateField('dialysisCenterName', e.target.value)}
                placeholder="Enter center name"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-medium text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>
          </div>
        )}

        {/* Fluid Settings */}
        {activeSection === 'fluid' && (
          <div className="space-y-8">
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Daily Fluid Limit</label>
              <div className="relative">
                <input
                  type="number"
                  value={settings.dailyFluidLimitMl || ''}
                  onChange={e => updateField('dailyFluidLimitMl', parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-6 py-5 font-black text-3xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500/20"
                />
                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 font-bold">ml</span>
              </div>
              <p className="text-sm text-slate-400">Recommended: 1000-1500ml for most patients</p>
            </div>

            <div className="p-5 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-sky-500/10 flex items-center justify-center text-2xl">💧</div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">Fluid Reminders</p>
                  <p className="text-sm text-slate-400">Get notified to track your fluids</p>
                </div>
              </div>
              <button
                onClick={() => updateField('fluidReminderEnabled', !settings.fluidReminderEnabled)}
                className={`relative w-14 h-8 rounded-full transition-all ${
                  settings.fluidReminderEnabled ? 'bg-sky-500' : 'bg-slate-200 dark:bg-slate-700'
                }`}
              >
                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-all ${
                  settings.fluidReminderEnabled ? 'left-7' : 'left-1'
                }`} />
              </button>
            </div>
          </div>
        )}

        {/* Weight Settings */}
        {activeSection === 'weight' && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dry Weight</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={settings.dryWeightKg || ''}
                    onChange={e => updateField('dryWeightKg', parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-6 py-5 font-black text-3xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <span className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 font-bold">kg</span>
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Alert Threshold</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={settings.weightGainAlertKg || ''}
                    onChange={e => updateField('weightGainAlertKg', parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-6 py-5 font-black text-3xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                  <span className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 font-bold">kg</span>
                </div>
                <p className="text-xs text-slate-400">Alert if gain exceeds this</p>
              </div>
            </div>

            <div className="p-5 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-2xl">⚖️</div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">Weight Reminders</p>
                  <p className="text-sm text-slate-400">Daily reminder to log weight</p>
                </div>
              </div>
              <button
                onClick={() => updateField('weightReminderEnabled', !settings.weightReminderEnabled)}
                className={`relative w-14 h-8 rounded-full transition-all ${
                  settings.weightReminderEnabled ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'
                }`}
              >
                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-all ${
                  settings.weightReminderEnabled ? 'left-7' : 'left-1'
                }`} />
              </button>
            </div>

            {settings.weightReminderEnabled && (
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Reminder Time</label>
                <input
                  type="time"
                  value={settings.weightReminderTime || ''}
                  onChange={e => updateField('weightReminderTime', e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            )}
          </div>
        )}

        {/* Vitals Settings */}
        {activeSection === 'vitals' && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Max Systolic (mmHg)</label>
                <input
                  type="number"
                  value={settings.bpSystolicMax || ''}
                  onChange={e => updateField('bpSystolicMax', parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-bold text-2xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Max Diastolic (mmHg)</label>
                <input
                  type="number"
                  value={settings.bpDiastolicMax || ''}
                  onChange={e => updateField('bpDiastolicMax', parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-bold text-2xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>
            </div>

            <div className="space-y-3">
              {[
                { key: 'bpAlertEnabled', label: 'BP Alerts', desc: 'Alert when BP exceeds limits', icon: '🫀', color: 'rose' },
                { key: 'safetyChecksEnabled', label: 'Safety Checks', desc: 'Pre-dialysis safety reminders', icon: '🛡️', color: 'amber' },
                { key: 'missedDialysisAlertEnabled', label: 'Missed Session Alerts', desc: 'Alert for missed dialysis', icon: '⏰', color: 'orange' },
              ].map(item => (
                <div key={item.key} className="p-5 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-${item.color}-500/10 flex items-center justify-center text-2xl`}>
                      {item.icon}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{item.label}</p>
                      <p className="text-sm text-slate-400">{item.desc}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => updateField(item.key as keyof UserSettings, !settings[item.key as keyof UserSettings])}
                    className={`relative w-14 h-8 rounded-full transition-all ${
                      settings[item.key as keyof UserSettings] ? 'bg-rose-500' : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                  >
                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-all ${
                      settings[item.key as keyof UserSettings] ? 'left-7' : 'left-1'
                    }`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Alerts Settings */}
        {activeSection === 'alerts' && (
          <div className="space-y-3">
            {[
              { key: 'dialysisReminderEnabled', label: 'Dialysis Reminders', desc: 'Remind before sessions', icon: '💉', color: 'sky' },
              { key: 'medicationReminderEnabled', label: 'Medication Reminders', desc: 'Remind to take meds', icon: '💊', color: 'violet' },
              { key: 'labReminderEnabled', label: 'Lab Reminders', desc: 'Remind for lab work', icon: '🧪', color: 'emerald' },
            ].map(item => (
              <div key={item.key} className="p-5 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-${item.color}-500/10 flex items-center justify-center text-2xl`}>
                    {item.icon}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{item.label}</p>
                    <p className="text-sm text-slate-400">{item.desc}</p>
                  </div>
                </div>
                <button
                  onClick={() => updateField(item.key as keyof UserSettings, !settings[item.key as keyof UserSettings])}
                  className={`relative w-14 h-8 rounded-full transition-all ${
                    settings[item.key as keyof UserSettings] ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                >
                  <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-all ${
                    settings[item.key as keyof UserSettings] ? 'left-7' : 'left-1'
                  }`} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Emergency Settings */}
        {activeSection === 'emergency' && (
          <div className="space-y-8">
            <div className="p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-2xl flex items-start gap-3">
              <span className="text-2xl">🚨</span>
              <p className="text-sm text-rose-600 dark:text-rose-400">
                This contact will be notified in case of emergencies or critical alerts.
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contact Name</label>
              <input
                type="text"
                value={settings.emergencyContactName || ''}
                onChange={e => updateField('emergencyContactName', e.target.value)}
                placeholder="Enter name"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-medium text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-rose-500/20"
              />
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phone Number</label>
              <input
                type="tel"
                value={settings.emergencyContactPhone || ''}
                onChange={e => updateField('emergencyContactPhone', e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-medium text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-rose-500/20"
              />
            </div>
          </div>
        )}

        {/* Preferences Settings */}
        {activeSection === 'preferences' && (
          <div className="space-y-8">
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Weight Unit</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'kg', label: 'Kilograms', symbol: 'kg' },
                  { id: 'lb', label: 'Pounds', symbol: 'lb' },
                ].map(unit => (
                  <button
                    key={unit.id}
                    onClick={() => updateField('weightUnit', unit.id as 'kg' | 'lb')}
                    className={`p-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                      settings.weightUnit === unit.id
                        ? 'bg-gradient-to-br from-violet-500 to-purple-500 text-white shadow-lg'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <span className="text-2xl font-black">{unit.symbol}</span>
                    <span>{unit.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fluid Unit</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'ml', label: 'Milliliters', symbol: 'ml' },
                  { id: 'oz', label: 'Ounces', symbol: 'oz' },
                ].map(unit => (
                  <button
                    key={unit.id}
                    onClick={() => updateField('fluidUnit', unit.id as 'ml' | 'oz')}
                    className={`p-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                      settings.fluidUnit === unit.id
                        ? 'bg-gradient-to-br from-violet-500 to-purple-500 text-white shadow-lg'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <span className="text-2xl font-black">{unit.symbol}</span>
                    <span>{unit.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Timezone</label>
              <select
                value={settings.timezone}
                onChange={e => updateField('timezone', e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-violet-500/20"
              >
                <optgroup label="Common Timezones">
                  <option value="America/New_York">Eastern Time (ET)</option>
                  <option value="America/Chicago">Central Time (CT)</option>
                  <option value="America/Denver">Mountain Time (MT)</option>
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
                  <option value="America/Anchorage">Alaska Time (AKT)</option>
                  <option value="Pacific/Honolulu">Hawaii Time (HT)</option>
                  <option value="Europe/London">London (GMT/BST)</option>
                  <option value="Europe/Paris">Paris (CET)</option>
                  <option value="Europe/Berlin">Berlin (CET)</option>
                  <option value="Asia/Dubai">Dubai (GST)</option>
                  <option value="Asia/Kolkata">India (IST)</option>
                  <option value="Asia/Singapore">Singapore (SGT)</option>
                  <option value="Asia/Tokyo">Tokyo (JST)</option>
                  <option value="Australia/Sydney">Sydney (AEST)</option>
                  <option value="Pacific/Auckland">Auckland (NZST)</option>
                </optgroup>
                <optgroup label="All Timezones">
                  {Intl.supportedValuesOf('timeZone').map(tz => (
                    <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>
                  ))}
                </optgroup>
              </select>
              <p className="text-xs text-slate-400">
                Current: {settings.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone}
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Language</label>
              <select
                value={settings.language}
                onChange={e => updateField('language', e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-violet-500/20"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="zh">Chinese</option>
              </select>
            </div>

            {/* Danger Zone */}
            <div className="pt-8 mt-8 border-t border-slate-200 dark:border-slate-700">
              <h4 className="text-lg font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2 mb-4">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Danger Zone
              </h4>
              <div className="p-5 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-2xl">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">Delete Account</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Permanently delete your account and all data
                    </p>
                  </div>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded-xl transition-colors whitespace-nowrap"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {selectedPlan && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedPlan(null);
          }}
          selectedPlan={selectedPlan}
          isYearly={false}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-rose-600 dark:text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Delete Account</h3>
            </div>

            <div className="space-y-4">
              <p className="text-slate-600 dark:text-slate-300">
                This action is <span className="font-bold text-rose-600 dark:text-rose-400">permanent and irreversible</span>.
              </p>

              <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
                {['All dialysis sessions', 'Weight & fluid logs', 'Medications', 'Lab reports', 'Profile & settings'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    {item}
                  </li>
                ))}
              </ul>

              <div className="p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl">
                <p className="text-sm text-rose-600 dark:text-rose-400">
                  Type <span className="font-mono font-bold">DELETE</span> to confirm
                </p>
              </div>

              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-mono text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-rose-500/20"
                autoComplete="off"
              />

              {deleteError && <p className="text-sm text-rose-600 dark:text-rose-400">{deleteError}</p>}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                  setDeleteError(null);
                }}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE' || isDeleting}
                className="flex-1 px-4 py-3 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete Forever'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
