import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getSettings, UserSettings, defaultSettings } from '../services/settings';
import { useAuth } from './AuthContext';
import {
  formatShortDate,
  formatFullDate,
  formatWeekday,
  formatFullWeekday,
  formatTime,
  formatDateTime,
  formatRelativeDate,
  formatWeekdayDate,
  formatISODate,
  getTodayDateString,
  isDateToday,
  DateInput,
} from '../utils/date';

// Unit conversion constants
const KG_TO_LB = 2.20462;
const ML_TO_OZ = 0.033814;

interface SettingsContextValue {
  settings: UserSettings;
  isLoading: boolean;
  refreshSettings: () => Promise<void>;

  // Weight conversion utilities
  weightUnit: 'kg' | 'lb';
  displayWeight: (kg: number | undefined | null) => string;
  formatWeight: (kg: number | undefined | null, showUnit?: boolean) => string;
  convertWeightToKg: (value: number) => number;
  convertWeightFromKg: (kg: number) => number;

  // Fluid conversion utilities
  fluidUnit: 'ml' | 'oz';
  displayFluid: (ml: number | undefined | null) => string;
  formatFluid: (ml: number | undefined | null, showUnit?: boolean) => string;
  convertFluidToMl: (value: number) => number;
  convertFluidFromMl: (ml: number) => number;

  // Date/timezone utilities
  timezone: string;
  displayShortDate: (date: DateInput) => string;
  displayFullDate: (date: DateInput) => string;
  displayWeekday: (date: DateInput) => string;
  displayFullWeekday: (date: DateInput) => string;
  displayTime: (date: DateInput) => string;
  displayDateTime: (date: DateInput) => string;
  displayRelativeDate: (date: DateInput) => string;
  displayWeekdayDate: (date: DateInput) => string;
  getTodayString: () => string;
  isToday: (date: DateInput) => boolean;
  getDateString: (date: DateInput) => string;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

interface SettingsProviderProps {
  children: React.ReactNode;
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const { isAuthenticated } = useAuth();
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSettings = useCallback(async () => {
    if (!isAuthenticated) {
      setSettings(defaultSettings);
      setIsLoading(false);
      return;
    }

    try {
      const data = await getSettings();
      setSettings(data);
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  // Weight conversion utilities
  const weightUnit = settings.weightUnit || 'kg';

  const convertWeightFromKg = useCallback((kg: number): number => {
    if (weightUnit === 'lb') {
      return kg * KG_TO_LB;
    }
    return kg;
  }, [weightUnit]);

  const convertWeightToKg = useCallback((value: number): number => {
    if (weightUnit === 'lb') {
      return value / KG_TO_LB;
    }
    return value;
  }, [weightUnit]);

  const displayWeight = useCallback((kg: number | undefined | null): string => {
    if (kg === undefined || kg === null) return '--';
    const converted = convertWeightFromKg(kg);
    return `${converted.toFixed(1)} ${weightUnit}`;
  }, [convertWeightFromKg, weightUnit]);

  const formatWeight = useCallback((kg: number | undefined | null, showUnit = true): string => {
    if (kg === undefined || kg === null) return '--';
    const converted = convertWeightFromKg(kg);
    return showUnit ? `${converted.toFixed(1)} ${weightUnit}` : converted.toFixed(1);
  }, [convertWeightFromKg, weightUnit]);

  // Fluid conversion utilities
  const fluidUnit = settings.fluidUnit || 'ml';

  const convertFluidFromMl = useCallback((ml: number): number => {
    if (fluidUnit === 'oz') {
      return ml * ML_TO_OZ;
    }
    return ml;
  }, [fluidUnit]);

  const convertFluidToMl = useCallback((value: number): number => {
    if (fluidUnit === 'oz') {
      return value / ML_TO_OZ;
    }
    return value;
  }, [fluidUnit]);

  const displayFluid = useCallback((ml: number | undefined | null): string => {
    if (ml === undefined || ml === null) return '--';
    const converted = convertFluidFromMl(ml);
    if (fluidUnit === 'oz') {
      return `${converted.toFixed(1)} oz`;
    }
    return `${Math.round(converted)} ml`;
  }, [convertFluidFromMl, fluidUnit]);

  const formatFluid = useCallback((ml: number | undefined | null, showUnit = true): string => {
    if (ml === undefined || ml === null) return '--';
    const converted = convertFluidFromMl(ml);
    if (fluidUnit === 'oz') {
      return showUnit ? `${converted.toFixed(1)} oz` : converted.toFixed(1);
    }
    return showUnit ? `${Math.round(converted)} ml` : String(Math.round(converted));
  }, [convertFluidFromMl, fluidUnit]);

  // Date/timezone utilities
  const timezone = settings.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

  const displayShortDate = useCallback((date: DateInput): string => {
    return formatShortDate(date, timezone);
  }, [timezone]);

  const displayFullDate = useCallback((date: DateInput): string => {
    return formatFullDate(date, timezone);
  }, [timezone]);

  const displayWeekday = useCallback((date: DateInput): string => {
    return formatWeekday(date, timezone);
  }, [timezone]);

  const displayFullWeekday = useCallback((date: DateInput): string => {
    return formatFullWeekday(date, timezone);
  }, [timezone]);

  const displayTime = useCallback((date: DateInput): string => {
    return formatTime(date, timezone);
  }, [timezone]);

  const displayDateTime = useCallback((date: DateInput): string => {
    return formatDateTime(date, timezone);
  }, [timezone]);

  const displayRelativeDate = useCallback((date: DateInput): string => {
    return formatRelativeDate(date, timezone);
  }, [timezone]);

  const displayWeekdayDate = useCallback((date: DateInput): string => {
    return formatWeekdayDate(date, timezone);
  }, [timezone]);

  const getTodayString = useCallback((): string => {
    return getTodayDateString(timezone);
  }, [timezone]);

  const isToday = useCallback((date: DateInput): boolean => {
    const dateStr = typeof date === 'string' ? date : date instanceof Date ? date.toISOString() : new Date(date).toISOString();
    return isDateToday(dateStr, timezone);
  }, [timezone]);

  const getDateString = useCallback((date: DateInput): string => {
    return formatISODate(date, timezone);
  }, [timezone]);

  const value: SettingsContextValue = {
    settings,
    isLoading,
    refreshSettings,
    weightUnit,
    displayWeight,
    formatWeight,
    convertWeightToKg,
    convertWeightFromKg,
    fluidUnit,
    displayFluid,
    formatFluid,
    convertFluidToMl,
    convertFluidFromMl,
    timezone,
    displayShortDate,
    displayFullDate,
    displayWeekday,
    displayFullWeekday,
    displayTime,
    displayDateTime,
    displayRelativeDate,
    displayWeekdayDate,
    getTodayString,
    isToday,
    getDateString,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}
