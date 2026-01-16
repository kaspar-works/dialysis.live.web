import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  getCommunityProfile,
  createCommunityProfile,
  updateCommunityProfile,
  checkDisplayNameAvailability,
  CommunityProfile as CommunityProfileType,
} from '../services/community';
import CommunityNav from '../components/community/CommunityNav';
import HCPBadge from '../components/community/HCPBadge';

const CommunityProfile: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<CommunityProfileType | null>(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [nameChecking, setNameChecking] = useState(false);
  const [nameAvailable, setNameAvailable] = useState<boolean | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (displayName.length >= 3 && displayName !== profile?.displayName) {
      const timer = setTimeout(() => {
        checkName(displayName);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setNameAvailable(null);
      setNameError(null);
    }
  }, [displayName]);

  const loadProfile = async () => {
    try {
      const result = await getCommunityProfile();
      setProfile(result.profile);
      setHasProfile(result.hasProfile);
      if (result.profile) {
        setDisplayName(result.profile.displayName);
        setBio(result.profile.bio || '');
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkName = async (name: string) => {
    setNameChecking(true);
    try {
      const result = await checkDisplayNameAvailability(name);
      setNameAvailable(result.available);
      setNameError(result.reason || null);
    } catch (err) {
      setNameAvailable(null);
      setNameError('Failed to check availability');
    } finally {
      setNameChecking(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || displayName.length < 3) {
      setError('Display name must be at least 3 characters');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (hasProfile) {
        const updated = await updateCommunityProfile({
          displayName: displayName.trim(),
          bio: bio.trim() || undefined,
        });
        setProfile(updated);
      } else {
        const created = await createCommunityProfile({
          displayName: displayName.trim(),
          bio: bio.trim() || undefined,
        });
        setProfile(created);
        setHasProfile(true);
      }
      navigate('/community');
    } catch (err: any) {
      setError(err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-800 dark:text-white">
          {hasProfile ? 'My Profile' : 'Create Profile'}
        </h2>
        <p className="text-slate-500 dark:text-slate-400">
          {hasProfile ? 'Manage your community identity' : 'Set up your anonymous community identity'}
        </p>
      </div>

      {hasProfile && <CommunityNav hasProfile={hasProfile} />}

      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-white/5 p-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Display Name</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              This is your anonymous identity in the community. It will be visible on your posts and replies.
              Choose something unique that doesn't reveal your real identity.
            </p>

            <div className="relative">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g., DialysisWarrior42"
                minLength={3}
                maxLength={30}
                className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border rounded-xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 ${
                  nameError
                    ? 'border-red-300 dark:border-red-500/50 focus:ring-red-500'
                    : nameAvailable
                    ? 'border-emerald-300 dark:border-emerald-500/50 focus:ring-emerald-500'
                    : 'border-slate-200 dark:border-white/10 focus:ring-sky-500'
                }`}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {nameChecking && (
                  <div className="w-5 h-5 border-2 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" />
                )}
                {!nameChecking && nameAvailable === true && (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-emerald-500">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                  </svg>
                )}
                {!nameChecking && nameAvailable === false && (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-red-500">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </div>
            {nameError && (
              <p className="mt-2 text-sm text-red-500">{nameError}</p>
            )}
            {nameAvailable && (
              <p className="mt-2 text-sm text-emerald-500">This name is available!</p>
            )}
            <p className="mt-2 text-xs text-slate-400">3-30 characters, letters, numbers, and underscores only</p>
          </div>

          <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-white/5 p-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Bio (Optional)</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Tell the community a bit about yourself. This could include your dialysis journey,
              interests, or anything you'd like to share.
            </p>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Share a bit about your journey..."
              rows={4}
              maxLength={500}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
            />
            <p className="mt-2 text-xs text-slate-400">{bio.length}/500 characters</p>
          </div>

          {profile?.hcpVerified && profile.hcpBadgeType && (
            <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl border border-emerald-200 dark:border-emerald-500/30 p-6">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-bold text-emerald-800 dark:text-emerald-300">Verified Healthcare Professional</h3>
                <HCPBadge badgeType={profile.hcpBadgeType} />
              </div>
              <p className="text-sm text-emerald-700 dark:text-emerald-400">
                Your healthcare professional status has been verified. Your badge will appear
                next to your name on all posts and replies.
              </p>
            </div>
          )}

          {hasProfile && (
            <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-white/5 p-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Community Stats</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-sky-500">{profile?.totalPosts || 0}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">Posts</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-500">{profile?.totalReplies || 0}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">Replies</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-500">{profile?.totalHelpful || 0}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">Helpful</div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="flex gap-4">
            {hasProfile && (
              <button
                type="button"
                onClick={() => navigate('/community')}
                className="flex-1 px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={saving || (nameAvailable === false) || displayName.length < 3}
              className="flex-1 px-6 py-3 bg-sky-500 text-white rounded-xl font-semibold hover:bg-sky-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : hasProfile ? 'Save Changes' : 'Create Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CommunityProfile;
