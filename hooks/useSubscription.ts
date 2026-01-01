import { useState, useEffect, useCallback } from 'react';
import {
  getCurrentSubscription,
  getUsageStats,
  Subscription,
  UsageData,
  UsageItem,
  SubscriptionFeatures,
  canAddResource,
  hasFeature,
  resourceDisplayNames,
  featureDisplayNames,
  PlanType,
} from '../services/subscription';

interface UseSubscriptionReturn {
  subscription: Subscription | null;
  usage: UsageData | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  canAdd: (resource: keyof UsageData['usage']) => boolean;
  getUsage: (resource: keyof UsageData['usage']) => UsageItem | null;
  hasFeature: (feature: keyof SubscriptionFeatures) => boolean;
  isAtLimit: (resource: keyof UsageData['usage']) => boolean;
  isNearLimit: (resource: keyof UsageData['usage']) => boolean;
  getUpgradeMessage: (resource: keyof UsageData['usage']) => string;
  plan: PlanType | null;
}

export function useSubscription(): UseSubscriptionReturn {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [subData, usageData] = await Promise.all([
        getCurrentSubscription(),
        getUsageStats(),
      ]);
      setSubscription(subData);
      setUsage(usageData);
    } catch (err) {
      console.error('Failed to fetch subscription:', err);
      setError('Failed to load subscription data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const canAdd = useCallback(
    (resource: keyof UsageData['usage']): boolean => {
      if (!usage) return true; // Optimistic: allow if not loaded
      const item = usage.usage[resource];
      return item ? canAddResource(item) : true;
    },
    [usage]
  );

  const getUsage = useCallback(
    (resource: keyof UsageData['usage']): UsageItem | null => {
      if (!usage) return null;
      return usage.usage[resource] || null;
    },
    [usage]
  );

  const checkHasFeature = useCallback(
    (feature: keyof SubscriptionFeatures): boolean => {
      if (!subscription) return false;
      return hasFeature(subscription.features, feature);
    },
    [subscription]
  );

  const isAtLimit = useCallback(
    (resource: keyof UsageData['usage']): boolean => {
      if (!usage) return false;
      const item = usage.usage[resource];
      return item ? !item.unlimited && item.percentUsed >= 100 : false;
    },
    [usage]
  );

  const isNearLimit = useCallback(
    (resource: keyof UsageData['usage']): boolean => {
      if (!usage) return false;
      const item = usage.usage[resource];
      return item ? !item.unlimited && item.percentUsed >= 80 && item.percentUsed < 100 : false;
    },
    [usage]
  );

  const getUpgradeMessage = useCallback(
    (resource: keyof UsageData['usage']): string => {
      if (!usage) return 'Upgrade to add more.';
      const item = usage.usage[resource];
      const name = resourceDisplayNames[resource] || resource;
      if (!item) return `Upgrade to add more ${name}.`;
      if (item.unlimited) return '';
      return `You've used ${item.current} of ${item.limit} ${name}. Upgrade to add more.`;
    },
    [usage]
  );

  return {
    subscription,
    usage,
    isLoading,
    error,
    refresh: fetchData,
    canAdd,
    getUsage,
    hasFeature: checkHasFeature,
    isAtLimit,
    isNearLimit,
    getUpgradeMessage,
    plan: subscription?.plan || null,
  };
}

// Hook for checking a specific feature
export function useFeatureGate(feature: keyof SubscriptionFeatures): {
  isLocked: boolean;
  isLoading: boolean;
  featureName: string;
} {
  const { hasFeature, isLoading } = useSubscription();

  return {
    isLocked: !hasFeature(feature),
    isLoading,
    featureName: featureDisplayNames[feature] || feature,
  };
}

// Hook for checking a specific resource limit
export function useResourceLimit(resource: keyof UsageData['usage']): {
  canAdd: boolean;
  isAtLimit: boolean;
  isNearLimit: boolean;
  usage: UsageItem | null;
  isLoading: boolean;
  upgradeMessage: string;
} {
  const { canAdd, isAtLimit, isNearLimit, getUsage, getUpgradeMessage, isLoading } = useSubscription();

  return {
    canAdd: canAdd(resource),
    isAtLimit: isAtLimit(resource),
    isNearLimit: isNearLimit(resource),
    usage: getUsage(resource),
    isLoading,
    upgradeMessage: getUpgradeMessage(resource),
  };
}

export default useSubscription;
