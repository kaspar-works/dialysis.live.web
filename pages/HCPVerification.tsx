import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  getCommunityProfile,
  getHCPVerificationStatus,
  submitHCPVerification,
  CommunityProfile,
  HCPBadgeType,
  HCPVerificationRequest,
  HCP_BADGE_CONFIG,
} from '../services/community';
import CommunityNav from '../components/community/CommunityNav';
import HCPBadge from '../components/community/HCPBadge';

const HCPVerification: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<CommunityProfile | null>(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<{
    hasProfile: boolean;
    isVerified: boolean;
    badgeType?: HCPBadgeType;
    verifiedAt?: string;
    request?: HCPVerificationRequest | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const [fullName, setFullName] = useState('');
  const [professionalTitle, setProfessionalTitle] = useState('');
  const [badgeType, setBadgeType] = useState<HCPBadgeType | ''>('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseState, setLicenseState] = useState('');
  const [employer, setEmployer] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [profileResult, statusResult] = await Promise.all([
        getCommunityProfile(),
        getHCPVerificationStatus(),
      ]);

      setProfile(profileResult.profile);
      setHasProfile(profileResult.hasProfile);
      setVerificationStatus(statusResult);

      if (!profileResult.hasProfile) {
        navigate('/community/my-profile');
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      setError('Full name is required');
      return;
    }
    if (!professionalTitle.trim()) {
      setError('Professional title is required');
      return;
    }
    if (!badgeType) {
      setError('Please select your profession type');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const request = await submitHCPVerification({
        fullName: fullName.trim(),
        professionalTitle: professionalTitle.trim(),
        badgeType,
        licenseNumber: licenseNumber.trim() || undefined,
        licenseState: licenseState.trim() || undefined,
        employer: employer.trim() || undefined,
        specialization: specialization.trim() || undefined,
        yearsExperience: yearsExperience ? parseInt(yearsExperience, 10) : undefined,
        additionalNotes: additionalNotes.trim() || undefined,
      });

      setVerificationStatus({
        hasProfile: true,
        isVerified: false,
        request,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to submit verification request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Already verified
  if (verificationStatus?.isVerified && verificationStatus.badgeType) {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white">HCP Verification</h2>
          <p className="text-slate-500 dark:text-slate-400">Your healthcare professional status</p>
        </div>

        <CommunityNav hasProfile={hasProfile} />

        <div className="max-w-2xl">
          <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl border border-emerald-200 dark:border-emerald-500/30 p-8 text-center">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-emerald-600 dark:text-emerald-400">
                <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-emerald-800 dark:text-emerald-300 mb-2">
              You're Verified!
            </h3>
            <div className="flex justify-center mb-4">
              <HCPBadge badgeType={verificationStatus.badgeType} size="lg" />
            </div>
            <p className="text-emerald-700 dark:text-emerald-400 mb-4">
              Your healthcare professional credentials have been verified.
              Your badge appears next to your name on all posts and replies.
            </p>
            {verificationStatus.verifiedAt && (
              <p className="text-sm text-emerald-600 dark:text-emerald-500">
                Verified on {new Date(verificationStatus.verifiedAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Pending request
  if (verificationStatus?.request && verificationStatus.request.status === 'pending') {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white">HCP Verification</h2>
          <p className="text-slate-500 dark:text-slate-400">Your healthcare professional status</p>
        </div>

        <CommunityNav hasProfile={hasProfile} />

        <div className="max-w-2xl">
          <div className="bg-amber-50 dark:bg-amber-500/10 rounded-2xl border border-amber-200 dark:border-amber-500/30 p-8 text-center">
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-amber-600 dark:text-amber-400">
                <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-amber-800 dark:text-amber-300 mb-2">
              Verification Pending
            </h3>
            <p className="text-amber-700 dark:text-amber-400 mb-4">
              Your verification request is being reviewed by our team.
              This typically takes 1-3 business days.
            </p>
            <p className="text-sm text-amber-600 dark:text-amber-500">
              Submitted on {new Date(verificationStatus.request.createdAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Rejected request
  if (verificationStatus?.request && verificationStatus.request.status === 'rejected') {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white">HCP Verification</h2>
          <p className="text-slate-500 dark:text-slate-400">Your healthcare professional status</p>
        </div>

        <CommunityNav hasProfile={hasProfile} />

        <div className="max-w-2xl">
          <div className="bg-red-50 dark:bg-red-500/10 rounded-2xl border border-red-200 dark:border-red-500/30 p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-red-600 dark:text-red-400">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-red-800 dark:text-red-300">
                Verification Not Approved
              </h3>
            </div>
            {verificationStatus.request.rejectionReason && (
              <p className="text-red-700 dark:text-red-400 mb-4">
                {verificationStatus.request.rejectionReason}
              </p>
            )}
            <p className="text-sm text-red-600 dark:text-red-500">
              If you believe this was an error or have additional documentation,
              you may submit a new verification request below.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // New application form
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-800 dark:text-white">HCP Verification</h2>
        <p className="text-slate-500 dark:text-slate-400">Apply for healthcare professional verification</p>
      </div>

      <CommunityNav hasProfile={hasProfile} />

      <div className="max-w-2xl">
        <div className="bg-gradient-to-r from-emerald-500 to-sky-500 rounded-2xl p-6 text-white mb-8">
          <h3 className="text-lg font-bold mb-2">Why Get Verified?</h3>
          <p className="text-white/80 mb-4">
            Verified healthcare professionals receive a badge next to their name,
            helping patients identify trusted medical advice from credentialed experts.
          </p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(HCP_BADGE_CONFIG) as HCPBadgeType[]).slice(0, 4).map((type) => (
              <HCPBadge key={type} badgeType={type} size="sm" />
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-white/5 p-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Personal Information</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your legal name"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Professional Title *
                </label>
                <input
                  type="text"
                  value={professionalTitle}
                  onChange={(e) => setProfessionalTitle(e.target.value)}
                  placeholder="e.g., MD, RN, PharmD, RD"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-white/5 p-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Profession Type *</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {(Object.keys(HCP_BADGE_CONFIG) as HCPBadgeType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setBadgeType(type)}
                  className={`p-3 rounded-xl text-left transition-colors border ${
                    badgeType === type
                      ? 'border-sky-300 dark:border-sky-500/50 bg-sky-50 dark:bg-sky-500/10'
                      : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
                  }`}
                >
                  <HCPBadge badgeType={type} size="sm" showLabel={false} />
                  <span className="block text-sm font-medium text-slate-800 dark:text-white mt-2">
                    {HCP_BADGE_CONFIG[type].label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-white/5 p-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Credentials (Optional but Recommended)</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  License Number
                </label>
                <input
                  type="text"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  placeholder="Your professional license #"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  License State/Region
                </label>
                <input
                  type="text"
                  value={licenseState}
                  onChange={(e) => setLicenseState(e.target.value)}
                  placeholder="e.g., California, NY"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Current Employer
                </label>
                <input
                  type="text"
                  value={employer}
                  onChange={(e) => setEmployer(e.target.value)}
                  placeholder="Hospital, clinic, or practice"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Specialization
                </label>
                <input
                  type="text"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  placeholder="e.g., Nephrology, Dialysis"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Years of Experience
                </label>
                <input
                  type="number"
                  value={yearsExperience}
                  onChange={(e) => setYearsExperience(e.target.value)}
                  placeholder="Years in practice"
                  min="0"
                  max="100"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-white/5 p-6">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Additional Notes (Optional)
            </label>
            <textarea
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="Any additional information that may help verify your credentials..."
              rows={4}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
            />
          </div>

          <div className="bg-amber-50 dark:bg-amber-500/10 rounded-2xl border border-amber-200 dark:border-amber-500/30 p-4">
            <div className="flex gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5">
                <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Privacy Notice</p>
                <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                  Your personal information is kept confidential and only used for verification purposes.
                  Only your display name and HCP badge are visible to other users.
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate('/community')}
              className="flex-1 px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit for Verification'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HCPVerification;
