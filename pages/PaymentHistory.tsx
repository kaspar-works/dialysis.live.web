import { useState, useEffect, useRef } from 'react';
import {
  getInvoices,
  getPayments,
  getUpcomingInvoice,
  getCurrentSubscription,
  Invoice,
  PaymentRecord,
  Subscription,
  formatCurrency,
  formatInvoiceDate,
  getPlanDisplayName,
} from '../services/subscription';

export default function PaymentHistory() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [upcomingInvoice, setUpcomingInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    async function fetchData() {
      try {
        const [sub, inv, pay, upcoming] = await Promise.all([
          getCurrentSubscription(),
          getInvoices(50),
          getPayments(50, 0),
          getUpcomingInvoice().catch(() => null),
        ]);
        setSubscription(sub);
        setInvoices(inv);
        setPayments(pay.payments);
        setUpcomingInvoice(upcoming);
      } catch (err: any) {
        setError(err.message || 'Failed to load payment history');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-red-500 text-lg font-medium">Something went wrong</p>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const hasNoHistory = invoices.length === 0 && payments.length === 0;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Payment History</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          View your invoices, payments, and billing details
        </p>
      </div>

      {/* Current Subscription Card */}
      {subscription && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
          <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
            Current Subscription
          </h2>
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                {getPlanDisplayName(subscription.plan)} Plan
              </p>
            </div>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                subscription.status === 'active'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : subscription.status === 'trialing'
                    ? 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400'
                    : subscription.status === 'past_due'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                      : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
              }`}
            >
              {subscription.status.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
            </span>
            {subscription.currentPeriodEnd && (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {subscription.cancelAtPeriodEnd ? 'Cancels' : 'Next billing'}:{' '}
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Upcoming Invoice Card */}
      {upcomingInvoice && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
          <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
            Upcoming Invoice
          </h2>
          <div className="flex flex-wrap items-center gap-4">
            <p className="text-lg font-bold text-slate-900 dark:text-white">
              {formatCurrency(upcomingInvoice.amount_due, upcomingInvoice.currency)}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Due{' '}
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {upcomingInvoice.due_date
                  ? formatInvoiceDate(upcomingInvoice.due_date)
                  : formatInvoiceDate(upcomingInvoice.period_end)}
              </span>
            </p>
            {upcomingInvoice.lines?.data?.map((line, i) => (
              <p key={i} className="text-sm text-slate-500 dark:text-slate-400">
                {line.description}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {hasNoHistory && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">No payment history yet</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            When you subscribe to a paid plan, your invoices and payments will appear here.
          </p>
        </div>
      )}

      {/* Invoices Table */}
      {invoices.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
          <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
            Invoices
          </h2>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-2 pr-4 font-medium text-slate-500 dark:text-slate-400">Date</th>
                  <th className="text-left py-2 pr-4 font-medium text-slate-500 dark:text-slate-400">Invoice #</th>
                  <th className="text-left py-2 pr-4 font-medium text-slate-500 dark:text-slate-400">Amount</th>
                  <th className="text-left py-2 pr-4 font-medium text-slate-500 dark:text-slate-400">Status</th>
                  <th className="text-right py-2 font-medium text-slate-500 dark:text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <td className="py-3 pr-4 text-slate-700 dark:text-slate-300">
                      {formatInvoiceDate(invoice.created)}
                    </td>
                    <td className="py-3 pr-4 text-slate-700 dark:text-slate-300 font-mono text-xs">
                      {invoice.number}
                    </td>
                    <td className="py-3 pr-4 font-medium text-slate-900 dark:text-white">
                      {formatCurrency(invoice.amount_due, invoice.currency)}
                    </td>
                    <td className="py-3 pr-4">
                      <InvoiceStatusBadge status={invoice.status} />
                    </td>
                    <td className="py-3 text-right space-x-3">
                      {invoice.invoice_pdf && (
                        <a
                          href={invoice.invoice_pdf}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sky-600 dark:text-sky-400 hover:underline text-xs font-medium"
                        >
                          Download PDF
                        </a>
                      )}
                      {invoice.hosted_invoice_url && (
                        <a
                          href={invoice.hosted_invoice_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sky-600 dark:text-sky-400 hover:underline text-xs font-medium"
                        >
                          View Online
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile list */}
          <div className="md:hidden space-y-3">
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="border border-slate-100 dark:border-slate-800 rounded-xl p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    {formatInvoiceDate(invoice.created)}
                  </span>
                  <InvoiceStatusBadge status={invoice.status} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-slate-500 dark:text-slate-400">{invoice.number}</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {formatCurrency(invoice.amount_due, invoice.currency)}
                  </span>
                </div>
                <div className="flex gap-3 pt-1">
                  {invoice.invoice_pdf && (
                    <a
                      href={invoice.invoice_pdf}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-600 dark:text-sky-400 hover:underline text-xs font-medium"
                    >
                      Download PDF
                    </a>
                  )}
                  {invoice.hosted_invoice_url && (
                    <a
                      href={invoice.hosted_invoice_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-600 dark:text-sky-400 hover:underline text-xs font-medium"
                    >
                      View Online
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment Records */}
      {payments.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
          <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
            Payment Records
          </h2>
          <div className="space-y-3">
            {payments.map((payment) => (
              <div
                key={payment._id}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 last:border-0 pb-3 last:pb-0"
              >
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {formatCurrency(payment.amount, payment.currency)}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {new Date(payment.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                  {payment.description && (
                    <p className="text-xs text-slate-400 dark:text-slate-500">{payment.description}</p>
                  )}
                </div>
                <PaymentStatusBadge status={payment.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function InvoiceStatusBadge({ status }: { status: Invoice['status'] }) {
  const styles: Record<Invoice['status'], string> = {
    paid: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    open: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    void: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    draft: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
    uncollectible: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function PaymentStatusBadge({ status }: { status: PaymentRecord['status'] }) {
  const styles: Record<PaymentRecord['status'], string> = {
    succeeded: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    failed: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400',
    refunded: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
