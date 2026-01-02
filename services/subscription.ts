import { authFetch } from './auth';

// Types
export type PlanType = 'free' | 'basic' | 'premium';
export type BillingInterval = 'month' | 'year';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing';

export interface SubscriptionFeatures {
  sessionHistory: boolean;
  basicVitalsMonitoring: boolean;
  medicationTracker: boolean;
  symptomsVitalsHub: boolean;
  aiHealthAnalysis: boolean;
  nutriScanAI: boolean;
  exportData: boolean;
  caregiverAccess: boolean;
  familyDashboard: boolean;
}

export interface Subscription {
  plan: PlanType;
  status: SubscriptionStatus;
  maxSessions: number | null;
  maxWeightLogs: number | null;
  maxFluidLogs: number | null;
  maxVitalRecords: number | null;
  maxSymptomLogs: number | null;
  maxMedications: number | null;
  maxMealLogs: number | null;
  maxReports: number | null;
  maxAIRequests: number | null;
  features: SubscriptionFeatures;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
}

export interface UsageItem {
  current: number;
  limit: number;
  unlimited: boolean;
  remaining: number;
  percentUsed: number;
}

export interface UsageData {
  plan: PlanType;
  features: SubscriptionFeatures;
  usage: {
    sessions: UsageItem;
    weightLogs: UsageItem;
    fluidLogs: UsageItem;
    vitalRecords: UsageItem;
    symptomLogs: UsageItem;
    medications: UsageItem;
    mealLogs: UsageItem;
    reports: UsageItem;
    aiRequests: UsageItem;
  };
}

export interface PlanInfo {
  id: PlanType;
  name: string;
  description: string;
  badge?: string | null;
  price: {
    monthly: number;
    yearly: number;
  };
  limits: {
    maxSessions: number | null;
    maxMedications: number | null;
    maxReports: number | null;
    maxAIRequests: number | null;
    maxProfiles?: number | null;
    maxCaregivers?: number | null;
    dataRetentionDays?: number | null;
    dataRetention?: string;
  };
  features: string[] | Record<string, boolean | string | number>; // Can be array or object from backend
  includes?: string[]; // Human-readable feature list
  highlighted?: boolean;
}

// Helper to check if a plan has a specific feature
export function planHasFeature(plan: PlanInfo, feature: string): boolean {
  // Handle both array format (from /plans/features) and object format (from /plans)
  if (Array.isArray(plan.features)) {
    return plan.features.includes(feature);
  }
  // Object format: check if the key exists and is truthy
  const featureValue = plan.features[feature];
  return featureValue === true || (typeof featureValue === 'string' && featureValue !== '');
}

export interface PlansResponse {
  plans: PlanInfo[];
  featureComparison?: Record<string, Record<PlanType, boolean | string | number>>;
  featureInfo?: Record<string, { name: string; description: string }>;
}

export interface SubscriptionError {
  code: 'SUB_001' | 'SUB_002' | 'SUB_003' | 'SUB_004';
  message: string;
  details?: {
    resource?: string;
    feature?: string;
    current?: number;
    limit?: number;
    plan?: PlanType;
    upgradeRequired?: boolean;
  };
}

// API Functions

/**
 * Get current user's subscription info
 * GET /api/v1/subscriptions/current
 */
export async function getCurrentSubscription(): Promise<Subscription> {
  const result = await authFetch('/subscriptions/current');
  return result.data.subscription;
}

/**
 * Get usage statistics for dashboard
 * GET /api/v1/subscriptions/usage
 */
export async function getUsageStats(): Promise<UsageData> {
  const result = await authFetch('/subscriptions/usage');
  return result.data;
}

/**
 * Get feature access info
 * GET /api/v1/subscriptions/features
 */
export async function getFeatureAccess(): Promise<SubscriptionFeatures> {
  const result = await authFetch('/subscriptions/features');
  return result.data.features;
}

/**
 * Get available plans
 * GET /api/v1/subscriptions/plans
 */
export async function getPlans(): Promise<PlanInfo[]> {
  const result = await authFetch('/subscriptions/plans');
  return result.data.plans;
}

/**
 * Get plans with feature comparison
 * GET /api/v1/subscriptions/plans/features
 */
export async function getPlansWithComparison(): Promise<PlansResponse> {
  const result = await authFetch('/subscriptions/plans/features');
  return result.data;
}

/**
 * Subscribe to a plan
 * POST /api/v1/subscriptions
 */
export async function subscribe(plan: PlanType, billingInterval: BillingInterval = 'month'): Promise<Subscription> {
  const result = await authFetch('/subscriptions', {
    method: 'POST',
    body: JSON.stringify({ plan, billingInterval }),
  });
  return result.data.subscription;
}

/**
 * Update/upgrade subscription
 * PATCH /api/v1/subscriptions
 */
export async function updateSubscription(
  plan: PlanType,
  paymentMethodId?: string,
  billingInterval?: BillingInterval
): Promise<Subscription> {
  const result = await authFetch('/subscriptions', {
    method: 'PATCH',
    body: JSON.stringify({ plan, paymentMethodId, billingInterval }),
  });
  return result.data.subscription;
}

/**
 * Cancel subscription
 * POST /api/v1/subscriptions/cancel
 */
export async function cancelSubscription(): Promise<void> {
  await authFetch('/subscriptions/cancel', {
    method: 'POST',
  });
}

// Helper Functions

/**
 * Check if user can add more of a resource
 */
export function canAddResource(usage: UsageItem): boolean {
  return usage.unlimited || usage.remaining > 0;
}

/**
 * Check if a feature is available
 */
export function hasFeature(features: SubscriptionFeatures, feature: keyof SubscriptionFeatures): boolean {
  return features[feature] === true;
}

/**
 * Get plan display name
 */
export function getPlanDisplayName(plan: PlanType): string {
  const names: Record<PlanType, string> = {
    free: 'Free',
    basic: 'Basic',
    premium: 'Premium',
  };
  return names[plan] || plan;
}

/**
 * Get plan color
 */
export function getPlanColor(plan: PlanType): string {
  const colors: Record<PlanType, string> = {
    free: 'slate',
    basic: 'sky',
    premium: 'emerald',
  };
  return colors[plan] || 'slate';
}

/**
 * Check if error is a subscription limit error
 */
export function isSubscriptionError(error: any): error is { error: SubscriptionError } {
  const code = error?.response?.data?.error?.code || error?.error?.code;
  return code && code.startsWith('SUB_');
}

/**
 * Get upgrade message for a resource
 */
export function getUpgradeMessage(resource: string, current: number, limit: number): string {
  return `You've used ${current} of ${limit} ${resource}. Upgrade to add more.`;
}

/**
 * Feature display names
 */
export const featureDisplayNames: Record<keyof SubscriptionFeatures, string> = {
  sessionHistory: 'Session History',
  basicVitalsMonitoring: 'Basic Vitals Monitoring',
  medicationTracker: 'Medication Tracker',
  symptomsVitalsHub: 'Symptoms & Vitals Hub',
  aiHealthAnalysis: 'AI Health Analysis',
  nutriScanAI: 'Nutri-Scan AI',
  exportData: 'Data Export (PDF/CSV)',
  caregiverAccess: 'Caregiver Access',
  familyDashboard: 'Family Dashboard',
};

/**
 * Resource display names
 */
export const resourceDisplayNames: Record<string, string> = {
  sessions: 'Dialysis Sessions',
  weightLogs: 'Weight Logs',
  fluidLogs: 'Fluid Logs',
  vitalRecords: 'Vital Records',
  symptomLogs: 'Symptom Logs',
  medications: 'Medications',
  mealLogs: 'Meal Logs',
  reports: 'Reports',
  aiRequests: 'AI Requests',
};

/**
 * Plan configuration - matches backend features.ts
 */
export interface PlanConfig {
  id: PlanType;
  name: string;
  description: string;
  price: { monthly: number; yearly: number };
  limits: {
    maxSessions: number | null;
    maxMedications: number | null;
    maxReports: number | null;
    maxAIRequests: number | null;
  };
  features: {
    aiHealthAnalysis: boolean;
    nutriScanAI: boolean;
    exportData: boolean;
    caregiverAccess: boolean;
  };
}

export const PLAN_CONFIGS: Record<PlanType, PlanConfig> = {
  free: {
    id: 'free',
    name: 'Free',
    description: 'Basic tracking to get started',
    price: { monthly: 0, yearly: 0 },
    limits: {
      maxSessions: 10,
      maxMedications: 5,
      maxReports: 1,
      maxAIRequests: 10,
    },
    features: {
      aiHealthAnalysis: false,
      nutriScanAI: false,
      exportData: false,
      caregiverAccess: false,
    },
  },
  basic: {
    id: 'basic',
    name: 'Basic',
    description: 'Enhanced tracking with AI features',
    price: { monthly: 9.99, yearly: 99.99 },
    limits: {
      maxSessions: 100,
      maxMedications: 20,
      maxReports: 10,
      maxAIRequests: 50,
    },
    features: {
      aiHealthAnalysis: true,
      nutriScanAI: true,
      exportData: true,
      caregiverAccess: false,
    },
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    description: 'Full features for serious health management',
    price: { monthly: 19.99, yearly: 199.99 },
    limits: {
      maxSessions: null,
      maxMedications: null,
      maxReports: null,
      maxAIRequests: null,
    },
    features: {
      aiHealthAnalysis: true,
      nutriScanAI: true,
      exportData: true,
      caregiverAccess: true,
    },
  },
};

/**
 * Check if a feature requires upgrade from current plan
 */
export function requiresUpgrade(currentPlan: PlanType, feature: keyof PlanConfig['features']): boolean {
  return !PLAN_CONFIGS[currentPlan].features[feature];
}

/**
 * Get minimum plan required for a feature
 */
export function getMinimumPlanForFeature(feature: keyof PlanConfig['features']): PlanType {
  if (PLAN_CONFIGS.free.features[feature]) return 'free';
  if (PLAN_CONFIGS.basic.features[feature]) return 'basic';
  return 'premium';
}

/**
 * Check if user has reached limit
 */
export function isAtLimit(usage: UsageItem): boolean {
  return !usage.unlimited && usage.remaining <= 0;
}

/**
 * Check if user is near limit (80%+)
 */
export function isNearLimit(usage: UsageItem): boolean {
  return !usage.unlimited && usage.percentUsed >= 80;
}
