import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import AlertModal, { AlertType, AlertOptions } from '../components/AlertModal';

interface AlertContextType {
  showAlert: (options: AlertOptions) => void;
  showSuccess: (title: string, message: string) => void;
  showError: (title: string, message: string) => void;
  showWarning: (title: string, message: string) => void;
  showInfo: (title: string, message: string) => void;
  showConfirm: (
    title: string,
    message: string,
    onConfirm: () => void | Promise<void>,
    options?: { confirmText?: string; cancelText?: string }
  ) => void;
  closeAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

interface AlertProviderProps {
  children: ReactNode;
}

export function AlertProvider({ children }: AlertProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [alertOptions, setAlertOptions] = useState<AlertOptions | null>(null);

  const showAlert = useCallback((options: AlertOptions) => {
    setAlertOptions(options);
    setIsOpen(true);
  }, []);

  const closeAlert = useCallback(() => {
    setIsOpen(false);
    // Clear options after animation
    setTimeout(() => setAlertOptions(null), 200);
  }, []);

  const showSuccess = useCallback((title: string, message: string) => {
    showAlert({ type: 'success', title, message });
  }, [showAlert]);

  const showError = useCallback((title: string, message: string) => {
    showAlert({ type: 'error', title, message });
  }, [showAlert]);

  const showWarning = useCallback((title: string, message: string) => {
    showAlert({ type: 'warning', title, message });
  }, [showAlert]);

  const showInfo = useCallback((title: string, message: string) => {
    showAlert({ type: 'info', title, message });
  }, [showAlert]);

  const showConfirm = useCallback((
    title: string,
    message: string,
    onConfirm: () => void | Promise<void>,
    options?: { confirmText?: string; cancelText?: string }
  ) => {
    showAlert({
      type: 'confirm',
      title,
      message,
      onConfirm,
      confirmText: options?.confirmText,
      cancelText: options?.cancelText,
    });
  }, [showAlert]);

  const value: AlertContextType = {
    showAlert,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirm,
    closeAlert,
  };

  return (
    <AlertContext.Provider value={value}>
      {children}
      <AlertModal
        isOpen={isOpen}
        options={alertOptions}
        onClose={closeAlert}
      />
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
}

export default AlertContext;
