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

// ============ PAYMENT METHODS ============

export interface PaymentMethod {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
  created: number;
}

/**
 * Get setup intent for adding new payment method
 * POST /api/v1/subscriptions/setup-intent
 */
export async function createSetupIntent(): Promise<{ clientSecret: string; publishableKey: string }> {
  const result = await authFetch('/subscriptions/setup-intent', {
    method: 'POST',
  });
  return result.data;
}

/**
 * List payment methods
 * GET /api/v1/subscriptions/payment-methods
 */
export async function getPaymentMethods(): Promise<PaymentMethod[]> {
  const result = await authFetch('/subscriptions/payment-methods');
  return result.data.paymentMethods || [];
}

/**
 * Remove a payment method
 * DELETE /api/v1/subscriptions/payment-methods/:id
 */
export async function removePaymentMethod(paymentMethodId: string): Promise<void> {
  await authFetch(`/subscriptions/payment-methods/${paymentMethodId}`, {
    method: 'DELETE',
  });
}

/**
 * Set default payment method for subscription
 * POST /api/v1/subscriptions/payment-methods/default
 */
export async function setDefaultPaymentMethod(paymentMethodId: string): Promise<void> {
  await authFetch('/subscriptions/payment-methods/default', {
    method: 'POST',
    body: JSON.stringify({ paymentMethodId }),
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
  };
}

export const PLAN_CONFIGS: Record<PlanType, PlanConfig> = {
  free: {
    id: 'free',
    name: 'Free',
    description: 'Limited tracking to get started',
    price: { monthly: 0, yearly: 0 },
    limits: {
      maxSessions: 5,
      maxMedications: 5,
      maxReports: 0,
      maxAIRequests: 0,
    },
    features: {
      aiHealthAnalysis: false,
      nutriScanAI: false,
      exportData: false,
    },
  },
  basic: {
    id: 'basic',
    name: 'Basic',
    description: 'Unlimited tracking for all health data',
    price: { monthly: 4.99, yearly: 49.99 },
    limits: {
      maxSessions: null,
      maxMedications: null,
      maxReports: 0,
      maxAIRequests: 0,
    },
    features: {
      aiHealthAnalysis: false,
      nutriScanAI: false,
      exportData: false,
    },
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    description: 'Full features with AI & exports',
    price: { monthly: 9.99, yearly: 99.99 },
    limits: {
      maxSessions: null,
      maxMedications: null,
      maxReports: null,
      maxAIRequests: 30,
    },
    features: {
      aiHealthAnalysis: true,
      nutriScanAI: true,
      exportData: true,
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

// ============ INVOICES & BILLING HISTORY ============

export interface Invoice {
  id: string;
  number: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  amount_due: number;
  amount_paid: number;
  currency: string;
  created: number;
  due_date: number | null;
  period_start: number;
  period_end: number;
  hosted_invoice_url: string | null;
  invoice_pdf: string | null;
  lines?: {
    data: Array<{
      description: string;
      amount: number;
      period: { start: number; end: number };
    }>;
  };
}

export interface PaymentRecord {
  _id: string;
  userId: string;
  stripePaymentIntentId: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'pending' | 'failed' | 'refunded';
  description?: string;
  metadata?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get upcoming invoice preview
 * GET /api/v1/subscriptions/invoice/upcoming
 */
export async function getUpcomingInvoice(): Promise<Invoice | null> {
  const result = await authFetch('/subscriptions/invoice/upcoming');
  return result.data.invoice;
}

/**
 * List past invoices
 * GET /api/v1/subscriptions/invoices
 */
export async function getInvoices(limit: number = 10): Promise<Invoice[]> {
  const result = await authFetch(`/subscriptions/invoices?limit=${limit}`);
  return result.data.invoices || [];
}

/**
 * List payment history
 * GET /api/v1/subscriptions/payments
 */
export async function getPayments(limit: number = 20, offset: number = 0): Promise<{
  payments: PaymentRecord[];
  pagination: { total: number; limit: number; offset: number };
}> {
  const result = await authFetch(`/subscriptions/payments?limit=${limit}&offset=${offset}`);
  return result.data;
}

/**
 * Cancel subscription
 * POST /api/v1/subscriptions/cancel
 */
export async function cancelSubscription(immediate: boolean = false): Promise<void> {
  await authFetch('/subscriptions/cancel', {
    method: 'POST',
    body: JSON.stringify({ immediate }),
  });
}

/**
 * Reactivate canceled subscription
 * POST /api/v1/subscriptions/reactivate
 */
export async function reactivateSubscription(): Promise<Subscription> {
  const result = await authFetch('/subscriptions/reactivate', {
    method: 'POST',
  });
  return result.data.subscription;
}

/**
 * Format currency amount (from cents)
 */
export function formatCurrency(amount: number, currency: string = 'usd'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

/**
 * Format date from timestamp
 */
export function formatInvoiceDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
