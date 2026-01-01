import { authFetch, isAuthenticated } from './auth';

export interface UserProfile {
  _id?: string;
  userId?: string;
  fullName: string;
  photoUrl?: string;
  dob?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  dialysisModeDefault?: 'in_center' | 'home';
  dialysisTypeDefault?: 'in_center_hd' | 'home_hd' | 'pd_capd' | 'pd_apd' | 'pre_dialysis';
  timezone?: string;
  units?: 'metric' | 'imperial';
  dryWeightKg?: number;
  heightCm?: number;
  dialysisStartDate?: string;
  clinicName?: string;
  nephrologistName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserData {
  user: {
    id: string;
    email: string;
    authProvider: string;
    status: string;
    onboardingCompleted: boolean;
  };
  profile: UserProfile | null;
}

// Fetch current user profile from API
export async function getCurrentUser(): Promise<UserData | null> {
  if (!isAuthenticated()) {
    return null;
  }

  try {
    const result = await authFetch('/auth/me');
    return result.data;
  } catch (error) {
    console.error('Failed to fetch current user:', error);
    return null;
  }
}

// Update user profile
export async function updateProfile(data: Partial<UserProfile>): Promise<UserProfile> {
  const result = await authFetch('/profiles', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return result.data.profile;
}

// Get profile by ID
export async function getProfile(): Promise<UserProfile | null> {
  try {
    const result = await authFetch('/profiles');
    return result.data?.profile || null;
  } catch (error) {
    console.error('Failed to fetch profile:', error);
    return null;
  }
}
