import React, { useEffect, useCallback } from 'react';
import { ICONS } from '../constants';

export type AlertType = 'success' | 'error' | 'warning' | 'info' | 'confirm';

export interface AlertOptions {
  type: AlertType;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
}

interface AlertModalProps {
  isOpen: boolean;
  options: AlertOptions | null;
  onClose: () => void;
}

const AlertModal: React.FC<AlertModalProps> = ({ isOpen, options, onClose }) => {
  const handleConfirm = useCallback(async () => {
    if (options?.onConfirm) {
      await options.onConfirm();
    }
    onClose();
  }, [options, onClose]);

  const handleCancel = useCallback(() => {
    if (options?.onCancel) {
      options.onCancel();
    }
    onClose();
  }, [options, onClose]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleCancel();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, handleCancel]);

  if (!isOpen || !options) return null;

  const { type, title, message, confirmText, cancelText } = options;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      case 'warning':
        return (
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        );
      case 'info':
        return (
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-sky-100 dark:bg-sky-500/20 flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'confirm':
        return (
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  const getButtonStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-emerald-500 hover:bg-emerald-600 text-white';
      case 'error':
        return 'bg-rose-500 hover:bg-rose-600 text-white';
      case 'warning':
        return 'bg-amber-500 hover:bg-amber-600 text-white';
      case 'info':
        return 'bg-sky-500 hover:bg-sky-600 text-white';
      case 'confirm':
        return 'bg-indigo-500 hover:bg-indigo-600 text-white';
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleCancel}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-md p-5 sm:p-8 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={handleCancel}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          <ICONS.X className="w-4 h-4" />
        </button>

        {/* Mobile drag indicator */}
        <div className="w-10 h-1 bg-slate-300 dark:bg-slate-600 rounded-full mx-auto mb-4 sm:hidden" />

        {/* Icon */}
        {getIcon()}

        {/* Content */}
        <div className="text-center mb-5 sm:mb-6">
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-1.5 sm:mb-2">
            {title}
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm leading-relaxed px-2 sm:px-0">
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className={`flex gap-2.5 sm:gap-3 ${type === 'confirm' ? 'flex-col-reverse sm:flex-row' : 'flex-col'}`}>
          {type === 'confirm' && (
            <button
              onClick={handleCancel}
              className="flex-1 px-4 sm:px-5 py-2.5 sm:py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold text-sm sm:text-base hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors active:scale-[0.98]"
            >
              {cancelText || 'Cancel'}
            </button>
          )}
          <button
            onClick={handleConfirm}
            className={`flex-1 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl font-semibold text-sm sm:text-base transition-colors active:scale-[0.98] ${getButtonStyles()}`}
          >
            {confirmText || (type === 'confirm' ? 'Confirm' : 'OK')}
          </button>
        </div>

        {/* Safe area spacing for mobile */}
        <div className="h-2 sm:h-0" />
      </div>
    </div>
  );
};

export default AlertModal;
