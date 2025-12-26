import { useEffect } from 'react';
import { useStore } from '../store';
import { getMe } from '../services/user';
import { isAuthenticated as checkAuthToken } from '../services/auth';

// This component syncs the user profile from the API on app load
const ProfileSync: React.FC = () => {
  const { setProfile, profile } = useStore();

  useEffect(() => {
    const syncProfile = async () => {
      // Only sync if user has an auth token
      if (!checkAuthToken()) {
        return;
      }

      try {
        const userData = await getMe();

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
      }
    };

    syncProfile();
  }, []);

  return null;
};

export default ProfileSync;
