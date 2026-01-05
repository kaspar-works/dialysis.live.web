
import { authFetch } from './auth';

export interface UserProfile {
  id: string;
  email: string;
  authProvider: string;
  status: string;
  onboardingCompleted: boolean;
  createdAt: string;
}

export interface UserProfileData {
  fullName?: string;
  dialysisTypeDefault?: string;
  dialysisModeDefault?: string;
  dryWeightKg?: number;
}

export interface UserSettings {
  dailyFluidLimitMl?: number;
  fluidReminderEnabled: boolean;
  fluidReminderSchedule?: string[];
  dryWeightKg?: number;
  weightReminderEnabled: boolean;
  weightReminderTime?: string;
  typicalSessionMinutes?: number;
  safetyChecksEnabled: boolean;
}

export interface MeResponse {
  user: UserProfile;
  profile: UserProfileData | null;
  settings: UserSettings | null;
}

// Get current user info
export async function getMe(): Promise<MeResponse> {
  const result = await authFetch('/auth/me');
  return result.data;
}

// Get user settings
export async function getSettings(): Promise<UserSettings> {
  const result = await authFetch('/settings');
  return result.data.settings;
}

// Update user settings
export async function updateSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
  const result = await authFetch('/settings', {
    method: 'PATCH',
    body: JSON.stringify(settings),
  });
  return result.data.settings;
}
