import React, { useEffect, useRef } from 'react';
import { useStore } from '../store';
import { getAuthToken } from '../services/auth';

const API_BASE_URL = 'https://api.dialysis.live/api/v1';

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
  const hasFetched = useRef(false);

  useEffect(() => {
    const syncProfile = async () => {
      // Prevent duplicate calls from StrictMode or re-renders
      if (hasFetched.current || hasSyncedThisSession) {
        return;
      }
      hasFetched.current = true;
      hasSyncedThisSession = true;

      // Only sync if user has an auth token
      const token = getAuthToken();
      if (!token) {
        signalSyncComplete();
        return;
      }

      try {
        // Make a direct fetch call to avoid authFetch redirect behavior
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        // If unauthorized, try with refresh token or just skip silently
        if (response.status === 401 || response.status === 403) {
          console.log('ProfileSync: Token may be expired, skipping sync');
          return;
        }

        if (!response.ok) {
          console.log('ProfileSync: API returned error, skipping sync');
          return;
        }

        const result = await response.json();
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
  }, []);

  return null;
};

export default ProfileSync;
