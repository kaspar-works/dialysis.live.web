import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ICONS } from '../constants';
import {
  getCurrentSubscription,
  getUsageStats,
  getPlans,
  updateSubscription,
  Subscription as SubscriptionType,
  UsageData,
  PlanInfo,
  PlanType,
  UsageItem,
  getPlanDisplayName,
  featureDisplayNames,
  resourceDisplayNames,
  planHasFeature,
} from '../services/subscription';

const Subscription: React.FC = () => {
  const navigate = useNavigate();
  const [isYearly, setIsYearly] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionType | null>(null);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [plans, setPlans] = useState<PlanInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpgrading, setIsUpgrading] = useState<PlanType | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [subData, usageData, plansData] = await Promise.all([
        getCurrentSubscription(),
        getUsageStats(),
        getPlans(),
      ]);
      setSubscription(subData);
      setUsage(usageData);
      setPlans(plansData);
    } catch (err) {
      console.error('Failed to fetch subscription data:', err);
      setError('Failed to load subscription data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgrade = async (plan: PlanType) => {
    if (!subscription || subscription.plan === plan) return;

    setIsUpgrading(plan);
    try {
      const updated = await updateSubscription(plan);
      setSubscription(updated);
      // Refresh usage after plan change
      const newUsage = await getUsageStats();
      setUsage(newUsage);
    } catch (err) {
      console.error('Failed to upgrade:', err);
      setError('Failed to upgrade plan. Please try again.');
    } finally {
      setIsUpgrading(null);
    }
  };

  const getPlanIcon = (plan: PlanType) => {
    const icons: Record<PlanType, string> = {
      free: '🎯',
      basic: '⚡',
      premium: '✨',
    };
    return icons[plan];
  };

  const getPlanPrice = (plan: PlanInfo) => {
    return isYearly ? plan.price.yearly : plan.price.monthly;
  };

  const UsageBar: React.FC<{ label: string; usage: UsageItem }> = ({ label, usage }) => {
    if (usage.unlimited) {
      return (
        <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{label}</span>
          <span className="text-sm font-bold text-emerald-500">Unlimited</span>
        </div>
      );
    }

    const isNearLimit = usage.percentUsed >= 80;
    const isAtLimit = usage.percentUsed >= 100;

    return (
      <div className="py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{label}</span>
          <span className={`text-sm font-bold ${isAtLimit ? 'text-rose-500' : isNearLimit ? 'text-amber-500' : 'text-slate-900 dark:text-white'}`}>
            {usage.current} / {usage.limit}
          </span>
        </div>
        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isAtLimit ? 'bg-rose-500' : isNearLimit ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(usage.percentUsed, 100)}%` }}
          />
        </div>
        {isAtLimit && (
          <p className="text-xs text-rose-500 mt-1 font-medium">Limit reached - upgrade to add more</p>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 relative mx-auto">
            <div className="absolute inset-0 border-4 border-sky-500/20 rounded-full" />
            <div className="absolute inset-0 border-4 border-transparent border-t-sky-500 rounded-full animate-spin" />
          </div>
          <p className="text-slate-400 text-sm font-medium">Loading subscription...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-24 px-4 animate-in fade-in duration-500">
      {/* Error Display */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-center justify-between">
          <p className="text-rose-500 font-medium">{error}</p>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-600">
            <ICONS.X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Current Plan Card */}
      {subscription && (
        <div className="bg-gradient-to-br from-sky-500 via-blue-500 to-indigo-600 rounded-[2rem] p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-4xl">{getPlanIcon(subscription.plan)}</span>
                  <div>
                    <p className="text-white/60 text-sm font-medium">Current Plan</p>
                    <h2 className="text-3xl font-black">{getPlanDisplayName(subscription.plan)}</h2>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    subscription.status === 'active' ? 'bg-emerald-400/20 text-emerald-200' : 'bg-amber-400/20 text-amber-200'
                  }`}>
                    {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                  </span>
                </div>
              </div>

              {subscription.plan !== 'premium' && (
                <button
                  onClick={() => handleUpgrade('premium')}
                  disabled={isUpgrading !== null}
                  className="px-8 py-4 bg-white text-sky-600 rounded-2xl font-bold hover:scale-105 transition-transform disabled:opacity-50"
                >
                  {isUpgrading === 'premium' ? 'Upgrading...' : 'Upgrade to Premium'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Usage Stats */}
      {usage && (
        <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-8 border border-slate-100 dark:border-slate-700">
          <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6">Usage</h3>
          <div className="grid md:grid-cols-2 gap-x-8">
            <UsageBar label={resourceDisplayNames.sessions} usage={usage.usage.sessions} />
            <UsageBar label={resourceDisplayNames.weightLogs} usage={usage.usage.weightLogs} />
            <UsageBar label={resourceDisplayNames.fluidLogs} usage={usage.usage.fluidLogs} />
            <UsageBar label={resourceDisplayNames.vitalRecords} usage={usage.usage.vitalRecords} />
            <UsageBar label={resourceDisplayNames.symptomLogs} usage={usage.usage.symptomLogs} />
            <UsageBar label={resourceDisplayNames.medications} usage={usage.usage.medications} />
            <UsageBar label={resourceDisplayNames.mealLogs} usage={usage.usage.mealLogs} />
            <UsageBar label={resourceDisplayNames.aiRequests} usage={usage.usage.aiRequests} />
          </div>
        </div>
      )}

      {/* Features */}
      {subscription && (
        <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-8 border border-slate-100 dark:border-slate-700">
          <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6">Features</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(subscription.features).map(([key, enabled]) => (
              <div
                key={key}
                className={`flex items-center gap-3 p-4 rounded-xl ${
                  enabled ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-slate-50 dark:bg-slate-900'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  enabled ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                }`}>
                  {enabled ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  )}
                </div>
                <span className={`text-sm font-medium ${enabled ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400'}`}>
                  {featureDisplayNames[key as keyof typeof featureDisplayNames] || key}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Plans Header */}
      <div className="text-center space-y-4 pt-8">
        <h2 className="text-3xl font-black text-slate-900 dark:text-white">All Plans</h2>
        <p className="text-slate-500 dark:text-slate-400">Choose the plan that fits your needs</p>

        {/* Billing Toggle */}
        <div className="inline-flex items-center gap-4 p-2 bg-slate-100 dark:bg-slate-800 rounded-full">
          <button
            onClick={() => setIsYearly(false)}
            className={`px-6 py-3 rounded-full text-sm font-bold transition-all ${
              !isYearly ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow' : 'text-slate-500'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setIsYearly(true)}
            className={`px-6 py-3 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${
              isYearly ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow' : 'text-slate-500'
            }`}
          >
            Yearly
            <span className="px-2 py-0.5 bg-emerald-500 text-white text-xs rounded-full">-17%</span>
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => {
          const isCurrent = subscription?.plan === plan.id;
          const isPremium = plan.id === 'premium';

          return (
            <div
              key={plan.id}
              className={`relative rounded-3xl p-6 transition-all ${
                isPremium
                  ? 'bg-gradient-to-b from-emerald-500/10 to-emerald-500/5 border-2 border-emerald-500/50 dark:border-emerald-500/30'
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
              } ${isCurrent ? 'ring-2 ring-sky-500 ring-offset-2 dark:ring-offset-slate-900' : ''}`}
            >
              {isPremium && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-emerald-500 rounded-full text-xs font-bold text-white">
                  Popular
                </div>
              )}

              {isCurrent && (
                <div className="absolute -top-3 right-4 px-3 py-1 bg-sky-500 rounded-full text-xs font-bold text-white">
                  Current
                </div>
              )}

              <div className="text-center mb-6">
                <div className="text-3xl mb-2">{getPlanIcon(plan.id)}</div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{plan.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{plan.description}</p>
              </div>

              <div className="text-center mb-6">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-black text-slate-900 dark:text-white">
                    ${getPlanPrice(plan)}
                  </span>
                  {plan.price.monthly > 0 && (
                    <span className="text-slate-400 text-sm">/{isYearly ? 'yr' : 'mo'}</span>
                  )}
                </div>
              </div>

              <div className="space-y-3 mb-6 text-sm">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-slate-600 dark:text-slate-400">
                    {plan.limits.maxSessions === null ? 'Unlimited' : plan.limits.maxSessions} Sessions
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-slate-600 dark:text-slate-400">
                    {plan.limits.maxMedications === null ? 'Unlimited' : plan.limits.maxMedications} Medications
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {planHasFeature(plan, 'ai_chat') ? (
                    <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                  <span className={planHasFeature(plan, 'ai_chat') ? 'text-slate-600 dark:text-slate-400' : 'text-slate-400 line-through'}>
                    AI Features
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {planHasFeature(plan, 'export_data') ? (
                    <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                  <span className={planHasFeature(plan, 'export_data') ? 'text-slate-600 dark:text-slate-400' : 'text-slate-400 line-through'}>
                    Data Export
                  </span>
                </div>
              </div>

              <button
                onClick={() => handleUpgrade(plan.id)}
                disabled={isCurrent || isUpgrading !== null}
                className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
                  isCurrent
                    ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-default'
                    : isPremium
                    ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                    : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90'
                }`}
              >
                {isUpgrading === plan.id ? 'Processing...' : isCurrent ? 'Current Plan' : `Get ${plan.name}`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Subscription;
