import React, { useEffect, useRef } from 'react';
import { useStore } from '../store';
import { useAuth } from '../contexts/AuthContext';
import { authFetch } from '../services/auth';

// Track if sync has already been done this session (prevents StrictMode double-call)
let hasSyncedThisSession = false;
let syncCompleteCallbacks: (() => void)[] = [];
let isSyncComplete = false;

// Reset sync flag (call this on logout)
export function resetProfileSync() {
  hasSyncedThisSession = false;
  isSyncComplete = false;
  syncCompleteCallbacks = [];
}

// Check if sync is complete
export function isProfileSyncComplete(): boolean {
  return isSyncComplete;
}

// Wait for sync to complete
export function onProfileSyncComplete(callback: () => void) {
  if (isSyncComplete) {
    callback();
  } else {
    syncCompleteCallbacks.push(callback);
  }
}

// Signal that sync is complete
function signalSyncComplete() {
  isSyncComplete = true;
  syncCompleteCallbacks.forEach(cb => cb());
  syncCompleteCallbacks = [];
}

// This component syncs the user profile from the API on app load
const ProfileSync: React.FC = () => {
  const { setProfile, profile } = useStore();
  const { isAuthenticated } = useAuth();
  const hasFetched = useRef(false);

  useEffect(() => {
    const syncProfile = async () => {
      // Prevent duplicate calls from StrictMode or re-renders
      if (hasFetched.current || hasSyncedThisSession) {
        return;
      }
      hasFetched.current = true;
      hasSyncedThisSession = true;

      // Only sync if user is authenticated
      if (!isAuthenticated) {
        signalSyncComplete();
        return;
      }

      try {
        // Use authFetch which automatically includes credentials
        const result = await authFetch('/auth/me');

        const userData = result.data;

        if (userData) {
          // Update profile with data from API
          const updates: Partial<typeof profile> = {};

          // Sync name from API profile
          if (userData.profile?.fullName) {
            updates.name = userData.profile.fullName;
          }

          // Sync email from user data
          if (userData.user?.email) {
            updates.email = userData.user.email;
          }

          // Sync settings
          if (userData.settings?.dailyFluidLimitMl) {
            updates.dailyFluidLimit = userData.settings.dailyFluidLimitMl;
          }
          if (userData.settings?.dryWeightKg) {
            updates.weightGoal = userData.settings.dryWeightKg;
          }

          // Sync onboarding status
          if (userData.user?.onboardingCompleted !== undefined) {
            updates.isOnboarded = userData.user.onboardingCompleted;
          }

          // Only update if we have changes
          if (Object.keys(updates).length > 0) {
            setProfile((prev: typeof profile) => ({
              ...prev,
              ...updates
            }));

            // Also update localStorage
            const storageData = localStorage.getItem('renalcare_data');
            const data = storageData ? JSON.parse(storageData) : {};
            data.profile = { ...data.profile, ...updates };
            localStorage.setItem('renalcare_data', JSON.stringify(data));
          }
        }
      } catch (error) {
        console.error('Failed to sync profile:', error);
      } finally {
        signalSyncComplete();
      }
    };

    syncProfile();
  }, [isAuthenticated]);

  return null;
};

export default ProfileSync;
