
import { authFetch } from './auth';

export interface OnboardingStatus {
  onboardingCompleted: boolean;
  hasProfile: boolean;
  hasSettings: boolean;
  currentStep: number;
}

export interface OnboardingData {
  fullName: string;
  dialysisType: string;
  fluidLimitMl?: number;
  dryWeightKg?: number;
}

// Map frontend dialysis types to backend format
const dialysisTypeMap: Record<string, string> = {
  'Home HD': 'home_hd',
  'In-Center HD': 'in_center_hd',
  'PD (CAPD)': 'pd_capd',
  'PD (APD)': 'pd_apd',
  'Pre-Dialysis': 'pre_dialysis',
};

export async function getOnboardingStatus(): Promise<OnboardingStatus> {
  const result = await authFetch('/onboarding/status');
  return result.data;
}

export async function completeOnboarding(data: OnboardingData) {
  const backendData = {
    fullName: data.fullName,
    dialysisType: dialysisTypeMap[data.dialysisType] || 'home_hd',
    fluidLimitMl: data.fluidLimitMl,
    dryWeightKg: data.dryWeightKg,
  };

  const result = await authFetch('/onboarding/complete', {
    method: 'POST',
    body: JSON.stringify(backendData),
  });

  return result.data;
}

export async function updateIdentity(fullName: string) {
  const result = await authFetch('/onboarding/identity', {
    method: 'PUT',
    body: JSON.stringify({ fullName }),
  });
  return result.data;
}

export async function updateModality(dialysisType: string) {
  const backendType = dialysisTypeMap[dialysisType] || 'home_hd';
  const result = await authFetch('/onboarding/modality', {
    method: 'PUT',
    body: JSON.stringify({ dialysisType: backendType }),
  });
  return result.data;
}

export async function updateTargets(fluidLimitMl?: number, dryWeightKg?: number) {
  const result = await authFetch('/onboarding/targets', {
    method: 'PUT',
    body: JSON.stringify({ fluidLimitMl, dryWeightKg }),
  });
  return result.data;
}

export async function finalizeOnboarding() {
  const result = await authFetch('/onboarding/finalize', {
    method: 'POST',
  });
  return result.data;
}
