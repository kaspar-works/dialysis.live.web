import { useState, useEffect, useRef } from 'react';
import {
  getPaymentMethods,
  removePaymentMethod,
  setDefaultPaymentMethod,
  createSetupIntent,
  PaymentMethod,
} from '../services/subscription';

export default function PaymentMethods() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [setupMessage, setSetupMessage] = useState('');
  const [setupLoading, setSetupLoading] = useState(false);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchMethods();
  }, []);

  async function fetchMethods() {
    try {
      setLoading(true);
      setError('');
      const data = await getPaymentMethods();
      setMethods(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  }

  async function handleSetDefault(id: string) {
    try {
      setActionLoading(id);
      setError('');
      await setDefaultPaymentMethod(id);
      await fetchMethods();
    } catch (err: any) {
      setError(err?.message || 'Failed to set default payment method');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRemove(id: string) {
    try {
      setActionLoading(id);
      setError('');
      setConfirmRemoveId(null);
      await removePaymentMethod(id);
      setMethods((prev) => prev.filter((m) => m.id !== id));
    } catch (err: any) {
      setError(err?.message || 'Failed to remove payment method');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleAddCard() {
    try {
      setSetupLoading(true);
      setSetupMessage('');
      setError('');
      const { clientSecret } = await createSetupIntent();
      setSetupMessage(
        `Setup intent created successfully. To complete adding your card, use the Stripe-hosted form with client secret: ${clientSecret.slice(0, 20)}...`
      );
    } catch (err: any) {
      setError(err?.message || 'Failed to create setup intent');
    } finally {
      setSetupLoading(false);
    }
  }

  function formatExp(expMonth: number, expYear: number): string {
    return `${expMonth.toString().padStart(2, '0')}/${expYear.toString().slice(-2)}`;
  }

  function getBrandColor(brand: string): string {
    const colors: Record<string, string> = {
      visa: 'bg-blue-600',
      mastercard: 'bg-orange-500',
      amex: 'bg-sky-600',
      discover: 'bg-amber-500',
    };
    return colors[brand.toLowerCase()] || 'bg-slate-600';
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Payment Methods
        </h1>
        <button
          onClick={handleAddCard}
          disabled={setupLoading}
          className="px-4 py-2 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors"
        >
          {setupLoading ? 'Creating...' : 'Add Card'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-2xl p-4">
          <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Setup Intent Message */}
      {setupMessage && (
        <div className="bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 rounded-2xl p-4 space-y-2">
          <p className="text-sky-800 dark:text-sky-300 text-sm font-medium">
            Setup Intent Created
          </p>
          <p className="text-sky-700 dark:text-sky-400 text-sm">
            {setupMessage}
          </p>
          <p className="text-sky-600 dark:text-sky-500 text-xs">
            After completing the Stripe-hosted form, refresh this page to see your new card.
          </p>
          <button
            onClick={() => {
              setSetupMessage('');
              fetchMethods();
            }}
            className="mt-2 px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white text-xs font-medium rounded-lg transition-colors"
          >
            Refresh Payment Methods
          </button>
        </div>
      )}

      {/* Payment Methods List */}
      {methods.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
          <div className="text-center py-8 space-y-3">
            <div className="text-4xl">
              <svg
                className="w-12 h-12 mx-auto text-slate-400 dark:text-slate-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
                />
              </svg>
            </div>
            <p className="text-slate-600 dark:text-slate-400 font-medium">
              No payment methods on file
            </p>
            <p className="text-slate-500 dark:text-slate-500 text-sm">
              Add a card to manage your subscription payments.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {methods.map((method) => (
            <div
              key={method.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4"
            >
              <div className="flex items-center justify-between gap-4">
                {/* Card Info */}
                <div className="flex items-center gap-3 min-w-0">
                  {/* Brand Badge */}
                  <span
                    className={`${getBrandColor(method.card?.brand || '')} text-white text-xs font-bold px-2.5 py-1 rounded-lg uppercase tracking-wide shrink-0`}
                  >
                    {method.card?.brand
                      ? method.card.brand.charAt(0).toUpperCase() +
                        method.card.brand.slice(1)
                      : method.type}
                  </span>

                  <div className="min-w-0">
                    <p className="text-slate-900 dark:text-white font-mono text-sm font-medium">
                      **** **** **** {method.card?.last4 || '----'}
                    </p>
                    {method.card && (
                      <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                        Expires {formatExp(method.card.exp_month, method.card.exp_year)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleSetDefault(method.id)}
                    disabled={actionLoading === method.id}
                    className="px-3 py-1.5 text-xs font-medium text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/30 border border-sky-200 dark:border-sky-800 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {actionLoading === method.id ? '...' : 'Set as Default'}
                  </button>

                  {confirmRemoveId === method.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleRemove(method.id)}
                        disabled={actionLoading === method.id}
                        className="px-3 py-1.5 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {actionLoading === method.id ? '...' : 'Confirm'}
                      </button>
                      <button
                        onClick={() => setConfirmRemoveId(null)}
                        className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmRemoveId(method.id)}
                      disabled={actionLoading === method.id}
                      className="px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg transition-colors disabled:opacity-50"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stripe Info */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
        <div className="flex items-start gap-3">
          <svg
            className="w-5 h-5 text-slate-400 dark:text-slate-500 mt-0.5 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
            />
          </svg>
          <div>
            <p className="text-slate-700 dark:text-slate-300 text-sm font-medium">
              Secure Payment Processing
            </p>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
              All payment information is securely processed and stored by Stripe.
              Your card details are never stored on our servers. Stripe is PCI DSS
              Level 1 certified, the highest level of security in the payments
              industry.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
