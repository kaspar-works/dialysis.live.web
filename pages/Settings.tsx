import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { ICONS } from '../constants';
import { Link } from 'react-router-dom';
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
import PaymentModal from '../components/PaymentModal';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const Settings: React.FC = () => {
  const { profile } = useStore();
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
      // Don't log session expiration errors - redirect is already happening
      if (!err?.message?.includes('Session expired')) {
        console.error('Failed to load settings:', err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlanChange = (plan: PlanType) => {
    if (!subscription || subscription.plan === plan) return;

    // If upgrading from free to paid, show payment modal
    if (subscription.plan === 'free' && plan !== 'free') {
      setSelectedPlan(plan);
      setShowPaymentModal(true);
      return;
    }

    // For downgrades or changes between paid plans
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
    { id: 'dialysis', label: 'Dialysis', icon: '💉' },
    { id: 'fluid', label: 'Fluid', icon: '💧' },
    { id: 'weight', label: 'Weight', icon: '⚖️' },
    { id: 'vitals', label: 'Vitals', icon: '❤️' },
    { id: 'alerts', label: 'Alerts', icon: '🔔' },
    { id: 'emergency', label: 'Emergency', icon: '🚨' },
    { id: 'preferences', label: 'Preferences', icon: '⚙️' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-32 px-4">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            Settings
          </h1>
          <p className="text-slate-400 mt-2">Manage your dialysis and health preferences</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`px-8 py-4 rounded-2xl font-bold text-sm uppercase tracking-wider transition-all flex items-center gap-3 ${
            saveStatus === 'saved'
              ? 'bg-emerald-500 text-white'
              : saveStatus === 'error'
              ? 'bg-rose-500 text-white'
              : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-sky-600 dark:hover:bg-sky-500 dark:hover:text-white'
          }`}
        >
          {isSaving ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : saveStatus === 'saved' ? (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Saved
            </>
          ) : (
            'Save Changes'
          )}
        </button>
      </header>

      {/* Account Section - Plan Management */}
      {subscription && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 space-y-6">
          {/* Current Plan Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${
                subscription.plan === 'premium'
                  ? 'bg-gradient-to-br from-amber-400 to-orange-500'
                  : subscription.plan === 'basic'
                  ? 'bg-gradient-to-br from-sky-400 to-blue-500'
                  : 'bg-slate-100 dark:bg-slate-700'
              }`}>
                {subscription.plan === 'premium' ? '👑' : subscription.plan === 'basic' ? '⚡' : '🎯'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white capitalize">
                    {getPlanDisplayName(subscription.plan)} Plan
                  </h3>
                  <span className={`px-2 py-0.5 text-xs font-bold rounded-lg ${
                    subscription.status === 'active'
                      ? 'bg-emerald-500/10 text-emerald-500'
                      : 'bg-amber-500/10 text-amber-500'
                  }`}>
                    {subscription.status === 'active' ? 'Active' : subscription.status}
                  </span>
                </div>
                <p className="text-sm text-slate-400">
                  {subscription.currentPeriodEnd
                    ? `Renews ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                    : subscription.plan === 'free' ? 'Free forever' : 'N/A'}
                </p>
              </div>
            </div>
            <Link
              to="/subscription"
              className="px-4 py-2 text-sm text-sky-500 hover:text-sky-600 font-semibold"
            >
              View Details →
            </Link>
          </div>

          {/* Plan Selector */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Change Plan</label>

            {upgradeError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-xl">
                <p className="text-sm text-rose-600 dark:text-rose-400">{upgradeError}</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(['free', 'basic', 'premium'] as PlanType[]).map((plan) => {
                const config = PLAN_CONFIGS[plan];
                const isCurrent = subscription.plan === plan;
                const isDowngrade =
                  (subscription.plan === 'premium' && plan !== 'premium') ||
                  (subscription.plan === 'basic' && plan === 'free');

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
                      <span className="text-lg">
                        {plan === 'premium' ? '👑' : plan === 'basic' ? '⚡' : '🎯'}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white capitalize">{config.name}</span>
                    </div>
                    <p className="text-sm text-slate-500 mb-2">{config.description}</p>
                    <p className="text-lg font-black text-slate-900 dark:text-white">
                      ${config.price.monthly}
                      <span className="text-sm font-normal text-slate-400">/mo</span>
                    </p>
                    {!isCurrent && (
                      <p className="text-xs text-sky-500 font-semibold mt-2">
                        {isDowngrade ? 'Downgrade' : 'Upgrade'} →
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Section Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {sections.map(section => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
              activeSection === section.id
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <span>{section.icon}</span>
            {section.label}
          </button>
        ))}
      </div>

      {/* Settings Sections */}
      <div className="space-y-6">
        {/* Dialysis Settings */}
        {activeSection === 'dialysis' && (
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-700 space-y-8">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <span className="text-2xl">💉</span> Dialysis Settings
            </h3>

            {/* Dialysis Type */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dialysis Type</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'HD', label: 'Hemodialysis', desc: 'In-center or home HD' },
                  { id: 'PD', label: 'Peritoneal', desc: 'CAPD or APD' },
                ].map(type => (
                  <button
                    key={type.id}
                    onClick={() => updateField('dialysisType', type.id as 'HD' | 'PD')}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${
                      settings.dialysisType === type.id
                        ? 'border-sky-500 bg-sky-50 dark:bg-sky-500/10'
                        : 'border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600'
                    }`}
                  >
                    <p className="font-bold text-slate-900 dark:text-white">{type.label}</p>
                    <p className="text-xs text-slate-400">{type.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Dialysis Days */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dialysis Days</label>
              <div className="flex flex-wrap gap-2">
                {DAYS.map(day => (
                  <button
                    key={day}
                    onClick={() => toggleDay(day)}
                    className={`w-12 h-12 rounded-xl font-bold text-sm transition-all ${
                      settings.dialysisDays?.includes(day)
                        ? 'bg-sky-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    {day.slice(0, 2)}
                  </button>
                ))}
              </div>
            </div>

            {/* Time & Duration */}
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

            {/* Access Type */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Access Type</label>
              <div className="grid grid-cols-3 gap-3">
                {['Fistula', 'Graft', 'Catheter'].map(type => (
                  <button
                    key={type}
                    onClick={() => updateField('accessType', type as any)}
                    className={`p-3 rounded-xl font-bold text-sm transition-all ${
                      settings.accessType === type
                        ? 'bg-sky-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Center Name */}
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
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-700 space-y-8">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <span className="text-2xl">💧</span> Fluid Management
            </h3>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Daily Fluid Limit (ml)</label>
              <input
                type="number"
                value={settings.dailyFluidLimitMl || ''}
                onChange={e => updateField('dailyFluidLimitMl', parseInt(e.target.value) || 0)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-bold text-2xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500/20"
              />
              <p className="text-sm text-slate-400">Recommended: 1000-1500ml for most patients</p>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl">
              <div>
                <p className="font-bold text-slate-900 dark:text-white">Fluid Reminders</p>
                <p className="text-sm text-slate-400">Get notified to track your fluids</p>
              </div>
              <button
                onClick={() => updateField('fluidReminderEnabled', !settings.fluidReminderEnabled)}
                className={`relative w-14 h-8 rounded-full transition-all ${
                  settings.fluidReminderEnabled ? 'bg-sky-500' : 'bg-slate-200 dark:bg-slate-700'
                }`}
              >
                <div
                  className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-all ${
                    settings.fluidReminderEnabled ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>
        )}

        {/* Weight Settings */}
        {activeSection === 'weight' && (
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-700 space-y-8">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <span className="text-2xl">⚖️</span> Weight Management
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dry Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={settings.dryWeightKg || ''}
                  onChange={e => updateField('dryWeightKg', parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-bold text-2xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500/20"
                />
              </div>
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Alert Threshold (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={settings.weightGainAlertKg || ''}
                  onChange={e => updateField('weightGainAlertKg', parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-bold text-2xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500/20"
                />
                <p className="text-xs text-slate-400">Alert if gain exceeds this</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl">
              <div>
                <p className="font-bold text-slate-900 dark:text-white">Weight Reminders</p>
                <p className="text-sm text-slate-400">Daily reminder to log weight</p>
              </div>
              <button
                onClick={() => updateField('weightReminderEnabled', !settings.weightReminderEnabled)}
                className={`relative w-14 h-8 rounded-full transition-all ${
                  settings.weightReminderEnabled ? 'bg-sky-500' : 'bg-slate-200 dark:bg-slate-700'
                }`}
              >
                <div
                  className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-all ${
                    settings.weightReminderEnabled ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {settings.weightReminderEnabled && (
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Reminder Time</label>
                <input
                  type="time"
                  value={settings.weightReminderTime || ''}
                  onChange={e => updateField('weightReminderTime', e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500/20"
                />
              </div>
            )}
          </div>
        )}

        {/* Vitals Settings */}
        {activeSection === 'vitals' && (
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-700 space-y-8">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <span className="text-2xl">❤️</span> Vitals & Safety
            </h3>

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
                { key: 'bpAlertEnabled', label: 'BP Alerts', desc: 'Alert when BP exceeds limits' },
                { key: 'safetyChecksEnabled', label: 'Safety Checks', desc: 'Pre-dialysis safety reminders' },
                { key: 'missedDialysisAlertEnabled', label: 'Missed Session Alerts', desc: 'Alert for missed dialysis' },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{item.label}</p>
                    <p className="text-sm text-slate-400">{item.desc}</p>
                  </div>
                  <button
                    onClick={() => updateField(item.key as keyof UserSettings, !settings[item.key as keyof UserSettings])}
                    className={`relative w-14 h-8 rounded-full transition-all ${
                      settings[item.key as keyof UserSettings] ? 'bg-rose-500' : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-all ${
                        settings[item.key as keyof UserSettings] ? 'left-7' : 'left-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Alerts Settings */}
        {activeSection === 'alerts' && (
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-700 space-y-8">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <span className="text-2xl">🔔</span> Notifications
            </h3>

            <div className="space-y-3">
              {[
                { key: 'dialysisReminderEnabled', label: 'Dialysis Reminders', desc: 'Remind before sessions', icon: '💉' },
                { key: 'medicationReminderEnabled', label: 'Medication Reminders', desc: 'Remind to take meds', icon: '💊' },
                { key: 'labReminderEnabled', label: 'Lab Reminders', desc: 'Remind for lab work', icon: '🧪' },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">{item.icon}</span>
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
                    <div
                      className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-all ${
                        settings[item.key as keyof UserSettings] ? 'left-7' : 'left-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Emergency Settings */}
        {activeSection === 'emergency' && (
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-700 space-y-8">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <span className="text-2xl">🚨</span> Emergency Contact
            </h3>

            <div className="p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-2xl">
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
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-700 space-y-8">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <span className="text-2xl">⚙️</span> Preferences
            </h3>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Weight Unit</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'kg', label: 'Kilograms (kg)' },
                  { id: 'lb', label: 'Pounds (lb)' },
                ].map(unit => (
                  <button
                    key={unit.id}
                    onClick={() => updateField('weightUnit', unit.id as 'kg' | 'lb')}
                    className={`p-4 rounded-xl font-bold transition-all ${
                      settings.weightUnit === unit.id
                        ? 'bg-sky-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {unit.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fluid Unit</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'ml', label: 'Milliliters (ml)' },
                  { id: 'oz', label: 'Ounces (oz)' },
                ].map(unit => (
                  <button
                    key={unit.id}
                    onClick={() => updateField('fluidUnit', unit.id as 'ml' | 'oz')}
                    className={`p-4 rounded-xl font-bold transition-all ${
                      settings.fluidUnit === unit.id
                        ? 'bg-sky-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {unit.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Timezone</label>
              <select
                value={settings.timezone}
                onChange={e => updateField('timezone', e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500/20"
              >
                {Intl.supportedValuesOf('timeZone').slice(0, 50).map(tz => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Language</label>
              <select
                value={settings.language}
                onChange={e => updateField('language', e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500/20"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="zh">Chinese</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Payment Modal for Upgrades */}
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
    </div>
  );
};

export default Settings;
