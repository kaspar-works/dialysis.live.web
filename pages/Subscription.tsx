import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  PLAN_CONFIGS,
} from '../services/subscription';

const Subscription: React.FC = () => {
  const [isYearly, setIsYearly] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionType | null>(null);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [plans, setPlans] = useState<PlanInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpgrading, setIsUpgrading] = useState<PlanType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'plans'>('overview');

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
    const icons: Record<PlanType, string> = { free: '🎯', basic: '⚡', premium: '👑' };
    return icons[plan] || '📦';
  };

  const getPlanGradient = (plan: PlanType) => {
    const gradients: Record<PlanType, string> = {
      free: 'from-slate-500 to-slate-600',
      basic: 'from-sky-500 to-blue-600',
      premium: 'from-amber-500 via-orange-500 to-rose-500',
    };
    return gradients[plan] || 'from-slate-500 to-slate-600';
  };

  const UsageCard: React.FC<{ label: string; usage: UsageItem; icon: React.ReactNode }> = ({ label, usage, icon }) => {
    const isUnlimited = usage.unlimited;
    const isNearLimit = !isUnlimited && usage.percentUsed >= 80;
    const isAtLimit = !isUnlimited && usage.percentUsed >= 100;

    return (
      <div className={`relative p-4 rounded-2xl border transition-all ${
        isAtLimit
          ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30'
          : isNearLimit
          ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30'
          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
      }`}>
        <div className="flex items-start justify-between mb-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            isAtLimit ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-600' :
            isNearLimit ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600' :
            'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
          }`}>
            {icon}
          </div>
          {isUnlimited && (
            <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-full">
              Unlimited
            </span>
          )}
        </div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{label}</p>
        {isUnlimited ? (
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">∞</p>
        ) : (
          <>
            <p className={`text-2xl font-black ${
              isAtLimit ? 'text-rose-600' : isNearLimit ? 'text-amber-600' : 'text-slate-900 dark:text-white'
            }`}>
              {usage.current}<span className="text-sm font-medium text-slate-400">/{usage.limit}</span>
            </p>
            <div className="mt-3 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isAtLimit ? 'bg-rose-500' : isNearLimit ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(usage.percentUsed, 100)}%` }}
              />
            </div>
          </>
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
    <div className="max-w-5xl mx-auto pb-24 px-4 animate-in fade-in duration-500">
      {/* Error Display */}
      {error && (
        <div className="mb-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-center justify-between">
          <p className="text-rose-500 font-medium">{error}</p>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-600">
            <ICONS.X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Hero Section */}
      {subscription && (
        <div className={`relative rounded-[2rem] p-8 md:p-10 mb-8 overflow-hidden bg-gradient-to-br ${getPlanGradient(subscription.plan)}`}>
          {/* Background decoration */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-black/10 rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-4xl">
                  {getPlanIcon(subscription.plan)}
                </div>
                <div>
                  <p className="text-white/70 text-sm font-medium mb-1">Your Plan</p>
                  <h1 className="text-4xl md:text-5xl font-black text-white">{getPlanDisplayName(subscription.plan)}</h1>
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${
                      subscription.status === 'active'
                        ? 'bg-white/20 text-white'
                        : 'bg-amber-400/30 text-amber-100'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${subscription.status === 'active' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                      {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                {subscription.plan !== 'premium' && (
                  <button
                    onClick={() => setActiveTab('plans')}
                    className="px-6 py-3 bg-white text-slate-900 rounded-xl font-bold hover:bg-white/90 transition-all shadow-lg"
                  >
                    Upgrade Plan
                  </button>
                )}
                <Link
                  to="/pricing"
                  className="px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl font-bold hover:bg-white/30 transition-all text-center"
                >
                  Compare Plans
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 mb-8 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'overview'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('plans')}
          className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'plans'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Change Plan
        </button>
      </div>

      {activeTab === 'overview' ? (
        <div className="space-y-8">
          {/* Usage Stats */}
          {usage && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Usage This Month</h2>
                <span className="text-sm text-slate-500">Resets monthly</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <UsageCard
                  label="Sessions"
                  usage={usage.usage.sessions}
                  icon={<ICONS.Activity className="w-5 h-5" />}
                />
                <UsageCard
                  label="Medications"
                  usage={usage.usage.medications}
                  icon={<ICONS.Heart className="w-5 h-5" />}
                />
                <UsageCard
                  label="AI Requests"
                  usage={usage.usage.aiRequests}
                  icon={<ICONS.Zap className="w-5 h-5" />}
                />
                <UsageCard
                  label="Meal Logs"
                  usage={usage.usage.mealLogs}
                  icon={<ICONS.Calendar className="w-5 h-5" />}
                />
              </div>
            </div>
          )}

          {/* Features Grid */}
          {subscription && (
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Your Features</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {/* AI Features */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-500/20 rounded-xl flex items-center justify-center">
                      <ICONS.Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white">AI Features</h3>
                  </div>
                  <div className="space-y-3">
                    {[
                      { name: 'AI Health Chat', enabled: subscription.features.aiHealthAnalysis },
                      { name: 'Nutri-Scan AI', enabled: subscription.features.nutriScanAI },
                    ].map((feature) => (
                      <div key={feature.name} className="flex items-center justify-between">
                        <span className="text-sm text-slate-600 dark:text-slate-400">{feature.name}</span>
                        {feature.enabled ? (
                          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            Active
                          </span>
                        ) : (
                          <span className="text-sm text-slate-400">Upgrade required</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Export & Reports */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-sky-100 dark:bg-sky-500/20 rounded-xl flex items-center justify-center">
                      <ICONS.BarChart className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white">Reports & Export</h3>
                  </div>
                  <div className="space-y-3">
                    {[
                      { name: 'Data Export (CSV/PDF)', enabled: subscription.features.exportData },
                      { name: 'Session History', enabled: subscription.features.sessionHistory },
                    ].map((feature) => (
                      <div key={feature.name} className="flex items-center justify-between">
                        <span className="text-sm text-slate-600 dark:text-slate-400">{feature.name}</span>
                        {feature.enabled ? (
                          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            Active
                          </span>
                        ) : (
                          <span className="text-sm text-slate-400">Upgrade required</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Premium Features */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-amber-100 dark:bg-amber-500/20 rounded-xl flex items-center justify-center">
                      <span className="text-lg">👑</span>
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white">Premium Features</h3>
                  </div>
                  <div className="space-y-3">
                    {[
                      { name: 'Caregiver Access', enabled: subscription.features.caregiverAccess },
                      { name: 'Family Dashboard', enabled: subscription.features.familyDashboard },
                    ].map((feature) => (
                      <div key={feature.name} className="flex items-center justify-between">
                        <span className="text-sm text-slate-600 dark:text-slate-400">{feature.name}</span>
                        {feature.enabled ? (
                          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            Active
                          </span>
                        ) : (
                          <span className="text-sm text-slate-400">Premium only</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                  <h3 className="font-bold text-slate-900 dark:text-white mb-4">Quick Actions</h3>
                  <div className="space-y-2">
                    <Link
                      to="/settings"
                      className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      <ICONS.Settings className="w-5 h-5 text-slate-500" />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Account Settings</span>
                    </Link>
                    <Link
                      to="/reports"
                      className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      <ICONS.BarChart className="w-5 h-5 text-slate-500" />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">View Reports</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {/* Billing Toggle */}
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                onClick={() => setIsYearly(false)}
                className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  !isYearly ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setIsYearly(true)}
                className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                  isYearly ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'
                }`}
              >
                Yearly
                <span className="px-2 py-0.5 bg-emerald-500 text-white text-xs font-bold rounded-full">Save 17%</span>
              </button>
            </div>
          </div>

          {/* Plans Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const isCurrent = subscription?.plan === plan.id;
              const isHighlighted = plan.highlighted || plan.id === 'premium';
              const price = isYearly ? plan.price.yearly : plan.price.monthly;

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-3xl transition-all ${
                    isHighlighted
                      ? 'bg-gradient-to-b from-amber-500/5 via-orange-500/5 to-rose-500/5 border-2 border-amber-500/30 shadow-xl shadow-amber-500/10'
                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
                  } ${isCurrent ? 'ring-2 ring-sky-500 ring-offset-2 dark:ring-offset-slate-900' : ''}`}
                >
                  {isHighlighted && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full text-xs font-bold text-white shadow-lg">
                      Most Popular
                    </div>
                  )}

                  {isCurrent && (
                    <div className="absolute -top-4 right-4 px-3 py-1.5 bg-sky-500 rounded-full text-xs font-bold text-white shadow-lg">
                      Current
                    </div>
                  )}

                  <div className="p-6 pt-8">
                    {/* Plan Header */}
                    <div className="text-center mb-6">
                      <div className="w-14 h-14 mx-auto mb-3 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center text-2xl">
                        {getPlanIcon(plan.id)}
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">{plan.name}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{plan.description}</p>
                    </div>

                    {/* Price */}
                    <div className="text-center mb-6">
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-5xl font-black text-slate-900 dark:text-white">
                          ${price}
                        </span>
                        {price > 0 && (
                          <span className="text-slate-400 text-sm font-medium">/{isYearly ? 'year' : 'month'}</span>
                        )}
                      </div>
                      {isYearly && price > 0 && (
                        <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium mt-1">
                          ${(price / 12).toFixed(2)}/mo billed annually
                        </p>
                      )}
                    </div>

                    {/* Features */}
                    <div className="space-y-3 mb-6">
                      {(plan.includes || []).slice(0, 6).map((item: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-3">
                          <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <svg className="w-3 h-3 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <span className="text-sm text-slate-600 dark:text-slate-400">{item}</span>
                        </div>
                      ))}
                    </div>

                    {/* CTA Button */}
                    <button
                      onClick={() => handleUpgrade(plan.id)}
                      disabled={isCurrent || isUpgrading !== null}
                      className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all ${
                        isCurrent
                          ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-default'
                          : isHighlighted
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-500/25'
                          : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90'
                      }`}
                    >
                      {isUpgrading === plan.id ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Processing...
                        </span>
                      ) : isCurrent ? (
                        'Current Plan'
                      ) : plan.price.monthly === 0 ? (
                        'Downgrade'
                      ) : (
                        `Upgrade to ${plan.name}`
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* FAQ Section */}
          <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 text-center">Common Questions</h2>
            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Can I cancel anytime?</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period.</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">What happens to my data?</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Your data is always yours. Even if you downgrade, your historical data is preserved based on your plan's retention limits.</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">How do upgrades work?</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">When you upgrade, you get immediate access to new features. We prorate the cost based on your remaining billing period.</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Is my payment secure?</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">We use Stripe for payment processing - the same secure platform used by millions of businesses worldwide.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Subscription;
