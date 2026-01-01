import React from 'react';
import { Link } from 'react-router-dom';
import { ICONS } from '../constants';
import { resourceDisplayNames, featureDisplayNames } from '../services/subscription';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'limit' | 'feature';
  resource?: string;
  feature?: string;
  current?: number;
  limit?: number;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  type,
  resource,
  feature,
  current,
  limit,
}) => {
  if (!isOpen) return null;

  const resourceName = resource ? resourceDisplayNames[resource] || resource : '';
  const featureName = feature ? featureDisplayNames[feature as keyof typeof featureDisplayNames] || feature : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
        >
          <ICONS.X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl flex items-center justify-center mb-4 shadow-lg shadow-orange-500/20">
            {type === 'limit' ? (
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            ) : (
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            )}
          </div>

          <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
            {type === 'limit' ? 'Limit Reached' : 'Premium Feature'}
          </h3>

          {type === 'limit' ? (
            <p className="text-slate-500 dark:text-slate-400">
              You've used <span className="font-bold text-slate-900 dark:text-white">{current}</span> of{' '}
              <span className="font-bold text-slate-900 dark:text-white">{limit}</span> {resourceName.toLowerCase()}.
              Upgrade to add unlimited.
            </p>
          ) : (
            <p className="text-slate-500 dark:text-slate-400">
              <span className="font-bold text-slate-900 dark:text-white">{featureName}</span> is a premium feature.
              Upgrade to unlock it.
            </p>
          )}
        </div>

        {/* Benefits */}
        <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-5 mb-6">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Premium includes</p>
          <div className="space-y-2">
            {[
              'Unlimited Sessions & Logs',
              'AI Health Analysis',
              'Nutri-Scan AI',
              'Data Export (PDF/CSV)',
            ].map((benefit, i) => (
              <div key={i} className="flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Price */}
        <div className="text-center mb-6">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-4xl font-black text-slate-900 dark:text-white">$9.99</span>
            <span className="text-slate-400">/month</span>
          </div>
          <p className="text-sm text-slate-400 mt-1">or $99.99/year (save 17%)</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-4 rounded-2xl font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
          >
            Maybe Later
          </button>
          <Link
            to="/subscription"
            className="flex-1 py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-center shadow-lg shadow-emerald-500/20 transition-all"
          >
            Upgrade Now
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;
