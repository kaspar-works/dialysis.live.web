import React, { useState } from 'react';
import Logo from './Logo';

interface ConsentModalProps {
  visible: boolean;
  onAccept: () => Promise<void>;
  onCancel: () => void;
}

const ConsentModal: React.FC<ConsentModalProps> = ({ visible, onAccept, onCancel }) => {
  const [isChecked, setIsChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!visible) return null;

  const handleAccept = async () => {
    if (!isChecked) return;
    setIsSubmitting(true);
    try {
      await onAccept();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 md:p-10 animate-in fade-in duration-500 overflow-y-auto">
      <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-3xl" />

      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2rem] md:rounded-[3rem] shadow-4xl overflow-hidden relative z-10 border border-white/5 transition-all">
        {/* Header */}
        <div className="bg-slate-50 dark:bg-white/5 p-8 md:p-10 border-b border-slate-100 dark:border-white/5">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center">
              <svg className="w-8 h-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Before You Continue</h2>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 md:p-10 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {/* Main Description */}
          <p className="text-slate-600 dark:text-slate-300 text-base leading-relaxed">
            dialysis.live is designed to help you track and understand your health data—including
            vitals, weight, hydration, and dialysis sessions—in one place.
          </p>

          {/* Disclaimer Box */}
          <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <svg className="w-5 h-5 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-bold text-amber-800 dark:text-amber-400">Important Notice</span>
            </div>
            <div className="text-amber-900 dark:text-amber-200 text-sm leading-relaxed space-y-3">
              <p>
                This app is for <strong>informational and tracking purposes only</strong>.
              </p>
              <p>
                It does not provide medical advice, diagnoses, or treatment recommendations.
              </p>
              <p>
                The information shown in this app should <strong>never replace</strong> professional
                medical advice, clinical judgment, or guidance from your doctor or care team.
              </p>
            </div>
          </div>

          {/* Important Clarification */}
          <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <svg className="w-6 h-6 text-rose-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-rose-900 dark:text-rose-200 text-sm font-medium leading-relaxed">
                Always consult your nephrologist, physician, or healthcare provider for medical decisions,
                emergencies, or treatment changes.
              </p>
            </div>
          </div>

          {/* Checkbox */}
          <label className="flex items-start gap-4 cursor-pointer group">
            <div className="relative mt-1">
              <input
                type="checkbox"
                checked={isChecked}
                onChange={(e) => setIsChecked(e.target.checked)}
                className="sr-only peer"
              />
              <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                isChecked
                  ? 'bg-indigo-500 border-indigo-500'
                  : 'border-slate-300 dark:border-slate-600 group-hover:border-indigo-400'
              }`}>
                {isChecked && (
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
            <span className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
              I understand that dialysis.live is a health-tracking tool only and not a medical or
              diagnostic service. I agree to use this app for personal tracking and awareness purposes.
            </span>
          </label>
        </div>

        {/* Buttons */}
        <div className="p-6 md:p-8 bg-slate-50 dark:bg-white/5 border-t border-slate-100 dark:border-white/5 flex gap-4">
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 px-6 py-4 rounded-xl font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleAccept}
            disabled={!isChecked || isSubmitting}
            className={`flex-[2] px-6 py-4 rounded-xl font-bold text-white flex items-center justify-center gap-3 transition-all ${
              isChecked && !isSubmitting
                ? 'bg-indigo-500 hover:bg-indigo-600 shadow-lg'
                : 'bg-slate-400 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Accept & Continue</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConsentModal;
