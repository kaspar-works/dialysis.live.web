import React, { useState, useEffect } from 'react';
import { ICONS } from '../constants';
import {
  getCurrentSubscription,
  getUsageStats,
  getPlans,
  updateSubscription,
  getPaymentMethods,
  removePaymentMethod,
  getInvoices,
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

// Payment features are temporarily disabled
const PAYMENT_DISABLED = true;

const Subscription: React.FC = () => {
  const [isYearly, setIsYearly] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionType | null>(null);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [plans, setPlans] = useState<PlanInfo[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpgrading, setIsUpgrading] = useState<PlanType | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState<PlanType | null>(null);
  const [showInvoices, setShowInvoices] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [subData, usageData, plansData, paymentMethodsData, invoicesData] = await Promise.all([
        getCurrentSubscription(),
        getUsageStats(),
        getPlans(),
        getPaymentMethods().catch(() => []),
        getInvoices(10).catch(() => []),
      ]);
      setSubscription(subData);
      setUsage(usageData);
      setPlans(plansData);
      setPaymentMethods(paymentMethodsData);
      setInvoices(invoicesData);
    } catch (err) {
      console.error('Failed to fetch subscription data:', err);
      setError('Failed to load billing data');
    } finally {
      setIsLoading(false);
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
    if (!confirm('Cancel your subscription? You\'ll keep access until the billing period ends.')) return;
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
    if (PAYMENT_DISABLED) {
      setError('Payment features are currently under construction. Only the free version is available for now.');
      return;
    }
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
      await fetchData();
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
      await updateSubscription(selectedPlanForPayment, paymentMethodId, billingInterval);
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

  const UsageBar: React.FC<{ item: UsageItem; label: string; icon: React.ReactNode }> = ({ item, label, icon }) => {
    const percent = item.unlimited ? 0 : Math.min(item.percentUsed, 100);
    const isNearLimit = !item.unlimited && item.percentUsed >= 80;
    const isAtLimit = !item.unlimited && item.percentUsed >= 100;

    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center text-slate-500">
              {icon}
            </div>
            <span className="font-semibold text-slate-900 dark:text-white">{label}</span>
          </div>
          <span className={`text-lg font-bold ${isAtLimit ? 'text-rose-500' : isNearLimit ? 'text-amber-500' : 'text-slate-900 dark:text-white'}`}>
            {item.unlimited ? '∞' : `${item.current}/${item.limit}`}
          </span>
        </div>
        {!item.unlimited && (
          <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${isAtLimit ? 'bg-rose-500' : isNearLimit ? 'bg-amber-500' : 'bg-sky-500'}`}
              style={{ width: `${percent}%` }}
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
          <div className="w-12 h-12 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 text-sm">Loading billing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-24 px-4">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Billing</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Manage your subscription and payments</p>
      </div>

      {/* Payment Disabled Banner */}
      {PAYMENT_DISABLED && (
        <div className="mb-8 relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 p-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">🔧</span>
            </div>
            <div>
              <h3 className="font-bold text-amber-700 dark:text-amber-400 mb-1">Payment Feature Under Construction</h3>
              <p className="text-amber-600 dark:text-amber-500 text-sm">
                The payment feature is currently being developed. Only the free version is available for now.
                All premium features will be unlocked once payments are enabled. Thank you for your patience!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-8 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-2xl p-4 flex items-center justify-between">
          <p className="text-rose-700 dark:text-rose-400 font-medium">{error}</p>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-600 p-1">
            <ICONS.X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Current Plan Hero */}
      {subscription && (
        <div className="mb-10 relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 p-8 text-white">
          <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-violet-500/10 rounded-full blur-3xl" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center text-3xl">
                {getPlanIcon(subscription.plan)}
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-2xl font-black">{getPlanDisplayName(subscription.plan)} Plan</h2>
                  {subscription.status === 'active' && !subscription.cancelAtPeriodEnd && (
                    <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-bold">Active</span>
                  )}
                  {subscription.cancelAtPeriodEnd && (
                    <span className="px-2.5 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs font-bold">Canceling</span>
                  )}
                </div>
                {subscription.currentPeriodEnd && subscription.plan !== 'free' && (
                  <p className="text-white/60 text-sm">
                    {subscription.cancelAtPeriodEnd
                      ? `Access until ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                      : `Renews ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                    }
                  </p>
                )}
                {subscription.plan === 'free' && (
                  <p className="text-white/60 text-sm">Upgrade for unlimited tracking and AI features</p>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              {subscription.cancelAtPeriodEnd ? (
                <button
                  onClick={handleReactivate}
                  disabled={isProcessing}
                  className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-bold transition-all disabled:opacity-50"
                >
                  Reactivate
                </button>
              ) : subscription.plan !== 'free' && (
                <button
                  onClick={handleCancelSubscription}
                  disabled={isProcessing}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white/80 rounded-xl font-medium transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Usage Stats */}
      {usage && (
        <div className="mb-10">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">This Month's Usage</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <UsageBar item={usage.usage.sessions} label="Sessions" icon={<ICONS.Activity className="w-5 h-5" />} />
            <UsageBar item={usage.usage.medications} label="Medications" icon={<ICONS.Pill className="w-5 h-5" />} />
            <UsageBar item={usage.usage.aiRequests} label="AI Requests" icon={<ICONS.Zap className="w-5 h-5" />} />
            <UsageBar item={usage.usage.mealLogs} label="Meal Logs" icon={<ICONS.Camera className="w-5 h-5" />} />
          </div>
        </div>
      )}

      {/* Plans Section */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Plans</h3>
          <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              onClick={() => setIsYearly(false)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${!isYearly ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${isYearly ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'}`}
            >
              Yearly <span className="px-1.5 py-0.5 bg-emerald-500 text-white text-xs font-bold rounded">-17%</span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {plans.map((plan) => {
            const isCurrent = subscription?.plan === plan.id;
            const isPremium = plan.id === 'premium';
            const price = isYearly ? plan.price.yearly : plan.price.monthly;

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl p-6 transition-all ${
                  isPremium
                    ? 'bg-gradient-to-b from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-2 border-amber-300 dark:border-amber-600'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
                } ${isCurrent ? 'ring-2 ring-sky-500 ring-offset-2 dark:ring-offset-slate-900' : ''}`}
              >
                {isPremium && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full text-xs font-bold text-white">
                    Best Value
                  </div>
                )}

                <div className="text-center mb-5">
                  <div className="text-3xl mb-2">{getPlanIcon(plan.id)}</div>
                  <h4 className="text-xl font-bold text-slate-900 dark:text-white">{plan.name}</h4>
                  <p className="text-sm text-slate-500 mt-1">{plan.description}</p>
                </div>

                <div className="text-center mb-5">
                  <span className="text-4xl font-black text-slate-900 dark:text-white">${price}</span>
                  {price > 0 && <span className="text-slate-400">/{isYearly ? 'yr' : 'mo'}</span>}
                </div>

                <div className="space-y-2.5 mb-5">
                  {(plan.includes || []).slice(0, 6).map((item: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-slate-600 dark:text-slate-400">{item}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={isCurrent || isUpgrading !== null}
                  className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
                    isCurrent
                      ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-default'
                      : isPremium
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600'
                      : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90'
                  }`}
                >
                  {isUpgrading === plan.id ? 'Processing...' : isCurrent ? 'Current Plan' : price === 0 ? 'Downgrade' : 'Upgrade'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment Methods */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Payment Method</h3>
          {paymentMethods.length > 0 && (
            <button
              onClick={() => setShowPaymentModal(true)}
              className="text-sm font-medium text-sky-600 hover:text-sky-700"
            >
              + Add Card
            </button>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          {paymentMethods.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center mx-auto mb-3">
                <ICONS.CreditCard className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-slate-500 mb-4">No payment method on file</p>
              {subscription?.plan === 'free' && (
                <p className="text-sm text-slate-400">Add a card when upgrading to a paid plan</p>
              )}
            </div>
          ) : (
            paymentMethods.map((pm) => (
              <div key={pm.id} className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-8 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                    <span className="text-xs font-bold text-slate-500 uppercase">{pm.card?.brand}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">•••• •••• •••• {pm.card?.last4}</p>
                    <p className="text-sm text-slate-400">Expires {pm.card?.exp_month}/{pm.card?.exp_year}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemovePayment(pm.id)}
                  disabled={isProcessing}
                  className="text-sm text-rose-500 hover:text-rose-600 font-medium disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Billing History */}
      <div>
        <button
          onClick={() => setShowInvoices(!showInvoices)}
          className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white mb-4"
        >
          Billing History
          <svg className={`w-5 h-5 transition-transform ${showInvoices ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showInvoices && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            {invoices.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-slate-500">No invoices yet</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {invoices.map((invoice) => (
                  <div key={invoice.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                        <ICONS.FileText className="w-5 h-5 text-slate-400" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{invoice.number || 'Invoice'}</p>
                        <p className="text-sm text-slate-500">{formatInvoiceDate(invoice.created)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        invoice.status === 'paid' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {invoice.status}
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {formatCurrency(invoice.amount_paid || invoice.amount_due, invoice.currency)}
                      </span>
                      {invoice.invoice_pdf && (
                        <a href={invoice.invoice_pdf} target="_blank" rel="noopener noreferrer" className="p-2 text-slate-400 hover:text-sky-500">
                          <ICONS.Download className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

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
