import { authFetch } from './auth';

export interface UserSettings {
  _id?: string;
  userId?: string;

  // Dialysis Core
  dialysisType: 'HD' | 'PD';
  dialysisDays?: string[];
  dialysisStartTime?: string;
  typicalSessionMinutes?: number;
  accessType?: 'Fistula' | 'Graft' | 'Catheter';
  dialysisCenterName?: string;

  // Fluid Management
  dailyFluidLimitMl?: number;
  fluidReminderEnabled: boolean;
  fluidReminderSchedule?: string[];

  // Weight Management
  dryWeightKg?: number;
  weightReminderEnabled: boolean;
  weightReminderTime?: string;
  weightGainAlertKg?: number;

  // Vitals & Safety
  bpSystolicMax?: number;
  bpDiastolicMax?: number;
  bpAlertEnabled: boolean;
  safetyChecksEnabled: boolean;
  missedDialysisAlertEnabled: boolean;

  // Notifications
  dialysisReminderEnabled: boolean;
  medicationReminderEnabled: boolean;
  labReminderEnabled: boolean;

  // Emergency
  emergencyContactName?: string;
  emergencyContactPhone?: string;

  // Preferences
  weightUnit: 'kg' | 'lb';
  fluidUnit: 'ml' | 'oz';
  timezone: string;
  language: string;

  createdAt?: string;
  updatedAt?: string;
}

export const defaultSettings: UserSettings = {
  dialysisType: 'HD',
  dialysisDays: [],
  dialysisStartTime: '06:00',
  typicalSessionMinutes: 240,
  accessType: 'Fistula',
  dialysisCenterName: '',

  dailyFluidLimitMl: 1500,
  fluidReminderEnabled: false,
  fluidReminderSchedule: [],

  dryWeightKg: 70,
  weightReminderEnabled: false,
  weightReminderTime: '07:00',
  weightGainAlertKg: 2,

  bpSystolicMax: 140,
  bpDiastolicMax: 90,
  bpAlertEnabled: true,
  safetyChecksEnabled: true,
  missedDialysisAlertEnabled: true,

  dialysisReminderEnabled: true,
  medicationReminderEnabled: false,
  labReminderEnabled: true,

  emergencyContactName: '',
  emergencyContactPhone: '',

  weightUnit: 'kg',
  fluidUnit: 'ml',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  language: 'en',
};

export async function getSettings(): Promise<UserSettings> {
  try {
    const result = await authFetch('/settings');
    return { ...defaultSettings, ...result.data.settings };
  } catch (error) {
    // If it's a session expiration, the redirect is already happening - don't log
    if (error instanceof Error && error.message.includes('Session expired')) {
      return defaultSettings; // Return defaults while redirect happens
    }
    console.error('Failed to fetch settings:', error);
    return defaultSettings;
  }
}

export async function updateSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
  const result = await authFetch('/settings', {
    method: 'PATCH',
    body: JSON.stringify(settings),
  });
  return result.data.settings;
}
