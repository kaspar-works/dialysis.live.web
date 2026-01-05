import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getSettings, UserSettings, defaultSettings } from '../services/settings';
import { useAuth } from './AuthContext';

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
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}
