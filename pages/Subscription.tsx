import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ICONS } from '../constants';
import {
  getCurrentSubscription,
  getUsageStats,
  getPlans,
  updateSubscription,
  getPaymentMethods,
  setDefaultPaymentMethod,
  removePaymentMethod,
  getInvoices,
  getUpcomingInvoice,
  cancelSubscription,
  reactivateSubscription,
  formatCurrency,
  formatInvoiceDate,
  Subscription as SubscriptionType,
  UsageData,
  PlanInfo,
  PlanType,
  UsageItem,
  PaymentMethod,
  Invoice,
  getPlanDisplayName,
  BillingInterval,
} from '../services/subscription';
import PaymentModal from '../components/PaymentModal';

type TabType = 'overview' | 'billing' | 'plans';

const Subscription: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isYearly, setIsYearly] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionType | null>(null);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [plans, setPlans] = useState<PlanInfo[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [upcomingInvoice, setUpcomingInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpgrading, setIsUpgrading] = useState<PlanType | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState<PlanType | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [subData, usageData, plansData, paymentMethodsData, invoicesData, upcomingData] = await Promise.all([
        getCurrentSubscription(),
        getUsageStats(),
        getPlans(),
        getPaymentMethods().catch(() => []),
        getInvoices(10).catch(() => []),
        getUpcomingInvoice().catch(() => null),
      ]);
      setSubscription(subData);
      setUsage(usageData);
      setPlans(plansData);
      setPaymentMethods(paymentMethodsData);
      setInvoices(invoicesData);
      setUpcomingInvoice(upcomingData);
    } catch (err) {
      console.error('Failed to fetch subscription data:', err);
      setError('Failed to load billing data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetDefaultPayment = async (paymentMethodId: string) => {
    if (!confirm('Set this card as your default payment method?')) return;
    setIsProcessing(true);
    try {
      await setDefaultPaymentMethod(paymentMethodId);
      const updatedMethods = await getPaymentMethods();
      setPaymentMethods(updatedMethods);
    } catch (err: any) {
      setError(err.message || 'Failed to update payment method');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemovePayment = async (paymentMethodId: string) => {
    if (!confirm('Remove this payment method?')) return;
    setIsProcessing(true);
    try {
      await removePaymentMethod(paymentMethodId);
      setPaymentMethods(paymentMethods.filter(pm => pm.id !== paymentMethodId));
    } catch (err: any) {
      setError(err.message || 'Failed to remove payment method');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will retain access until the end of your current billing period.')) return;
    setIsProcessing(true);
    try {
      await cancelSubscription(false);
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to cancel subscription');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReactivate = async () => {
    setIsProcessing(true);
    try {
      await reactivateSubscription();
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to reactivate subscription');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpgrade = async (plan: PlanType) => {
    if (!subscription || subscription.plan === plan) return;

    if (subscription.plan === 'free' && plan !== 'free') {
      setSelectedPlanForPayment(plan);
      setShowPaymentModal(true);
      return;
    }

    setIsUpgrading(plan);
    try {
      const updated = await updateSubscription(plan);
      setSubscription(updated);
      const newUsage = await getUsageStats();
      setUsage(newUsage);
    } catch (err: any) {
      setError(err.message || 'Failed to change plan');
    } finally {
      setIsUpgrading(null);
    }
  };

  const handlePaymentSuccess = async (paymentMethodId: string) => {
    if (!selectedPlanForPayment) return;
    setShowPaymentModal(false);
    setIsUpgrading(selectedPlanForPayment);
    try {
      const billingInterval: BillingInterval = isYearly ? 'year' : 'month';
      const updated = await updateSubscription(selectedPlanForPayment, paymentMethodId, billingInterval);
      setSubscription(updated);
      await fetchData();
      setSelectedPlanForPayment(null);
    } catch (err: any) {
      setError(err.message || 'Failed to upgrade plan');
    } finally {
      setIsUpgrading(null);
    }
  };

  const getPlanIcon = (plan: PlanType) => {
    const icons: Record<PlanType, string> = { free: '🎯', basic: '⚡', premium: '👑' };
    return icons[plan] || '📦';
  };

  const getPlanColor = (plan: PlanType) => {
    const colors: Record<PlanType, { bg: string; text: string; border: string }> = {
      free: { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-400', border: 'border-slate-200 dark:border-slate-700' },
      basic: { bg: 'bg-sky-50 dark:bg-sky-900/20', text: 'text-sky-600 dark:text-sky-400', border: 'border-sky-200 dark:border-sky-800' },
      premium: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800' },
    };
    return colors[plan] || colors.free;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400';
      case 'canceled': return 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400';
      case 'past_due': return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-400';
    }
  };

  const getInvoiceStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400';
      case 'open': return 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-400';
      case 'void': case 'uncollectible': return 'bg-slate-100 text-slate-500 dark:bg-slate-500/20 dark:text-slate-400';
      default: return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400';
    }
  };

  const UsageBar: React.FC<{ item: UsageItem; label: string }> = ({ item, label }) => {
    const isNearLimit = !item.unlimited && item.percentUsed >= 80;
    const isAtLimit = !item.unlimited && item.percentUsed >= 100;

    return (
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-slate-600 dark:text-slate-400">{label}</span>
          <span className={`font-medium ${isAtLimit ? 'text-rose-600' : isNearLimit ? 'text-amber-600' : 'text-slate-900 dark:text-white'}`}>
            {item.unlimited ? '∞' : `${item.current}/${item.limit}`}
          </span>
        </div>
        {!item.unlimited && (
          <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${isAtLimit ? 'bg-rose-500' : isNearLimit ? 'bg-amber-500' : 'bg-emerald-500'}`}
              style={{ width: `${Math.min(item.percentUsed, 100)}%` }}
            />
          </div>
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
          <p className="text-slate-400 text-sm font-medium">Loading billing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-24 px-4 animate-in fade-in duration-500">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">Billing Center</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your subscription, payment methods, and billing history</p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-100 dark:bg-rose-500/20 rounded-xl flex items-center justify-center">
              <ICONS.AlertCircle className="w-5 h-5 text-rose-600" />
            </div>
            <p className="text-rose-700 dark:text-rose-400 font-medium">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-600 p-2">
            <ICONS.X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Current Plan Card */}
      {subscription && (
        <div className={`rounded-2xl p-6 mb-8 border ${getPlanColor(subscription.plan).border} ${getPlanColor(subscription.plan).bg}`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-2xl shadow-sm">
                {getPlanIcon(subscription.plan)}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white">{getPlanDisplayName(subscription.plan)}</h2>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getStatusColor(subscription.status)}`}>
                    {subscription.status === 'active' && subscription.cancelAtPeriodEnd ? 'Canceling' : subscription.status}
                  </span>
                </div>
                {subscription.currentPeriodEnd && subscription.plan !== 'free' && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {subscription.cancelAtPeriodEnd
                      ? `Access until ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                      : `Renews ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                    }
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {subscription.plan !== 'premium' && (
                <button
                  onClick={() => setActiveTab('plans')}
                  className="px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-semibold hover:opacity-90 transition-all"
                >
                  Upgrade
                </button>
              )}
              {subscription.plan !== 'free' && !subscription.cancelAtPeriodEnd && (
                <button
                  onClick={handleCancelSubscription}
                  disabled={isProcessing}
                  className="px-5 py-2.5 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 font-medium transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              )}
              {subscription.cancelAtPeriodEnd && (
                <button
                  onClick={handleReactivate}
                  disabled={isProcessing}
                  className="px-5 py-2.5 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition-all disabled:opacity-50"
                >
                  Reactivate
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 mb-8 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
        {(['overview', 'billing', 'plans'] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all capitalize ${
              activeTab === tab
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {tab === 'plans' ? 'Change Plan' : tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Usage Stats */}
          {usage && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Usage This Month</h3>
                <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full">Resets monthly</span>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <UsageBar item={usage.usage.sessions} label="Dialysis Sessions" />
                <UsageBar item={usage.usage.medications} label="Medications" />
                <UsageBar item={usage.usage.aiRequests} label="AI Requests" />
                <UsageBar item={usage.usage.mealLogs} label="Meal Logs" />
              </div>
            </div>
          )}

          {/* Payment Methods */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Payment Methods</h3>
            </div>
            {paymentMethods.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-14 h-14 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <ICONS.CreditCard className="w-7 h-7 text-slate-400" />
                </div>
                <p className="text-slate-500 dark:text-slate-400 mb-4">No payment methods on file</p>
                {subscription?.plan !== 'free' && (
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="px-4 py-2 bg-sky-500 text-white rounded-lg font-medium hover:bg-sky-600 transition-colors"
                  >
                    Add Payment Method
                  </button>
                )}
              </div>
            ) : (
              <div>
                {paymentMethods.map((pm, index) => (
                  <div key={pm.id} className="p-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-700 last:border-0">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center">
                        <ICONS.CreditCard className="w-6 h-6 text-slate-500" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 dark:text-white capitalize">{pm.card?.brand}</span>
                          <span className="text-slate-500">•••• {pm.card?.last4}</span>
                          {index === 0 && (
                            <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-full">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-400">Expires {String(pm.card?.exp_month).padStart(2, '0')}/{pm.card?.exp_year}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {index !== 0 && (
                        <button
                          onClick={() => handleSetDefaultPayment(pm.id)}
                          disabled={isProcessing}
                          className="px-3 py-1.5 text-sm font-medium text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-500/10 rounded-lg transition-colors disabled:opacity-50"
                        >
                          Set Default
                        </button>
                      )}
                      <button
                        onClick={() => handleRemovePayment(pm.id)}
                        disabled={isProcessing}
                        className="px-3 py-1.5 text-sm font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                <div className="p-4 bg-slate-50 dark:bg-slate-900/50">
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="flex items-center gap-2 text-sm font-medium text-sky-600 hover:text-sky-700 transition-colors"
                  >
                    <ICONS.Plus className="w-4 h-4" />
                    Add New Card
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="grid md:grid-cols-3 gap-4">
            <Link
              to="/settings"
              className="flex items-center gap-4 p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-sky-300 dark:hover:border-sky-700 transition-colors group"
            >
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center group-hover:bg-sky-100 dark:group-hover:bg-sky-900/30 transition-colors">
                <ICONS.Settings className="w-6 h-6 text-slate-500 group-hover:text-sky-600" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white">Account Settings</h4>
                <p className="text-sm text-slate-500">Manage your profile</p>
              </div>
            </Link>
            <Link
              to="/reports"
              className="flex items-center gap-4 p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-sky-300 dark:hover:border-sky-700 transition-colors group"
            >
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center group-hover:bg-sky-100 dark:group-hover:bg-sky-900/30 transition-colors">
                <ICONS.BarChart className="w-6 h-6 text-slate-500 group-hover:text-sky-600" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white">Health Reports</h4>
                <p className="text-sm text-slate-500">Generate PDF reports</p>
              </div>
            </Link>
            <Link
              to="/pricing"
              className="flex items-center gap-4 p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-sky-300 dark:hover:border-sky-700 transition-colors group"
            >
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center group-hover:bg-sky-100 dark:group-hover:bg-sky-900/30 transition-colors">
                <ICONS.Zap className="w-6 h-6 text-slate-500 group-hover:text-sky-600" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white">Compare Plans</h4>
                <p className="text-sm text-slate-500">See all features</p>
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* Billing Tab */}
      {activeTab === 'billing' && (
        <div className="space-y-8">
          {/* Upcoming Invoice */}
          {upcomingInvoice && (
            <div className="bg-sky-50 dark:bg-sky-900/20 rounded-2xl p-6 border border-sky-200 dark:border-sky-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-sky-100 dark:bg-sky-800/50 rounded-xl flex items-center justify-center">
                    <ICONS.Calendar className="w-6 h-6 text-sky-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">Next Payment</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Due {formatInvoiceDate(upcomingInvoice.period_end)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-slate-900 dark:text-white">
                    {formatCurrency(upcomingInvoice.amount_due, upcomingInvoice.currency)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Invoice History */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Invoice History</h3>
            </div>
            {invoices.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-14 h-14 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <ICONS.FileText className="w-7 h-7 text-slate-400" />
                </div>
                <p className="text-slate-500 dark:text-slate-400">No invoices yet</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {invoices.map((invoice) => (
                  <div key={invoice.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                        <ICONS.FileText className="w-5 h-5 text-slate-500" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{invoice.number || 'Invoice'}</p>
                        <p className="text-sm text-slate-500">{formatInvoiceDate(invoice.created)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${getInvoiceStatusColor(invoice.status)}`}>
                        {invoice.status}
                      </span>
                      <p className="font-semibold text-slate-900 dark:text-white min-w-[80px] text-right">
                        {formatCurrency(invoice.amount_paid || invoice.amount_due, invoice.currency)}
                      </p>
                      {invoice.hosted_invoice_url && (
                        <a
                          href={invoice.hosted_invoice_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-slate-400 hover:text-sky-600 transition-colors"
                        >
                          <ICONS.ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      {invoice.invoice_pdf && (
                        <a
                          href={invoice.invoice_pdf}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-slate-400 hover:text-sky-600 transition-colors"
                        >
                          <ICONS.Download className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Billing Info */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-xl flex items-center justify-center flex-shrink-0">
                <ICONS.Shield className="w-5 h-5 text-slate-500" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white mb-1">Secure Payments</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  All payments are processed securely through Stripe. We never store your full card details on our servers.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Plans Tab */}
      {activeTab === 'plans' && (
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
                  className={`relative rounded-2xl transition-all ${
                    isHighlighted
                      ? 'bg-gradient-to-b from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border-2 border-amber-300 dark:border-amber-700 shadow-lg'
                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
                  } ${isCurrent ? 'ring-2 ring-sky-500 ring-offset-2 dark:ring-offset-slate-900' : ''}`}
                >
                  {isHighlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full text-xs font-bold text-white">
                      Most Popular
                    </div>
                  )}

                  {isCurrent && (
                    <div className="absolute -top-3 right-4 px-3 py-1 bg-sky-500 rounded-full text-xs font-bold text-white">
                      Current
                    </div>
                  )}

                  <div className="p-6 pt-8">
                    <div className="text-center mb-6">
                      <div className="w-12 h-12 mx-auto mb-3 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center text-2xl">
                        {getPlanIcon(plan.id)}
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">{plan.name}</h3>
                      <p className="text-sm text-slate-500 mt-1">{plan.description}</p>
                    </div>

                    <div className="text-center mb-6">
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-4xl font-black text-slate-900 dark:text-white">${price}</span>
                        {price > 0 && <span className="text-slate-400 text-sm">/{isYearly ? 'year' : 'month'}</span>}
                      </div>
                      {isYearly && price > 0 && (
                        <p className="text-sm text-emerald-600 font-medium mt-1">${(price / 12).toFixed(2)}/mo</p>
                      )}
                    </div>

                    <div className="space-y-3 mb-6">
                      {(plan.includes || []).slice(0, 5).map((item: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-3">
                          <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <svg className="w-3 h-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <span className="text-sm text-slate-600 dark:text-slate-400">{item}</span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => handleUpgrade(plan.id)}
                      disabled={isCurrent || isUpgrading !== null}
                      className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
                        isCurrent
                          ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-default'
                          : isHighlighted
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 shadow-lg'
                          : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90'
                      }`}
                    >
                      {isUpgrading === plan.id ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
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
        </div>
      )}

      {/* Payment Modal */}
      {selectedPlanForPayment && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedPlanForPayment(null);
          }}
          selectedPlan={selectedPlanForPayment}
          isYearly={isYearly}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};

export default Subscription;
