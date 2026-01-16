import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  getCommunityProfile,
  submitSuccessStory,
  CommunityProfile,
  MilestoneType,
  MILESTONE_CONFIG,
} from '../services/community';
import CommunityNav from '../components/community/CommunityNav';

const SubmitStory: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<CommunityProfile | null>(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [milestoneType, setMilestoneType] = useState<MilestoneType | ''>('');
  const [dialysisDuration, setDialysisDuration] = useState('');
  const [tags, setTags] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const result = await getCommunityProfile();
      setProfile(result.profile);
      setHasProfile(result.hasProfile);

      if (!result.hasProfile) {
        navigate('/community/my-profile');
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || title.length < 5) {
      setError('Title must be at least 5 characters');
      return;
    }
    if (!content.trim() || content.length < 100) {
      setError('Your story must be at least 100 characters');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const tagsArray = tags
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t.length > 0);

      await submitSuccessStory({
        title: title.trim(),
        content: content.trim(),
        milestoneType: milestoneType || undefined,
        dialysisDuration: dialysisDuration.trim() || undefined,
        tags: tagsArray.length > 0 ? tagsArray : undefined,
      });

      navigate('/community/stories', { state: { submitted: true } });
    } catch (err: any) {
      setError(err.message || 'Failed to submit story');
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

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
          </svg>
        </button>
        <div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Share Your Story</h2>
          <p className="text-slate-500 dark:text-slate-400">Inspire others with your dialysis journey</p>
        </div>
      </div>

      <CommunityNav hasProfile={hasProfile} />

      <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
        <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-white/5 p-6">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Story Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Give your story a meaningful title"
            maxLength={200}
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <p className="mt-2 text-xs text-slate-400">{title.length}/200 characters</p>
        </div>

        <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-white/5 p-6">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Milestone Type (Optional)
          </label>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            What kind of achievement or milestone is this story about?
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {(Object.keys(MILESTONE_CONFIG) as MilestoneType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setMilestoneType(milestoneType === type ? '' : type)}
                className={`p-3 rounded-xl text-left transition-colors border ${
                  milestoneType === type
                    ? 'border-sky-300 dark:border-sky-500/50 bg-sky-50 dark:bg-sky-500/10'
                    : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
                }`}
              >
                <span className="text-xl">{MILESTONE_CONFIG[type].icon}</span>
                <span className="block text-sm font-medium text-slate-800 dark:text-white mt-1">
                  {MILESTONE_CONFIG[type].label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-white/5 p-6">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Your Story *
          </label>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Share your journey, challenges, and triumphs. What has helped you? What would you like others to know?
          </p>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Tell your story... What has your journey been like? What challenges have you overcome? What advice would you give to others?"
            rows={12}
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
          />
          <p className="mt-2 text-xs text-slate-400">{content.length} characters (minimum 100)</p>
        </div>

        <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-white/5 p-6">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Time on Dialysis (Optional)
          </label>
          <input
            type="text"
            value={dialysisDuration}
            onChange={(e) => setDialysisDuration(e.target.value)}
            placeholder="e.g., 3 years, 18 months"
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-white/5 p-6">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Tags (Optional)
          </label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="e.g., hemodialysis, hope, family (comma separated)"
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <p className="mt-2 text-xs text-slate-400">Separate multiple tags with commas</p>
        </div>

        <div className="bg-sky-50 dark:bg-sky-500/10 rounded-2xl border border-sky-200 dark:border-sky-500/30 p-4">
          <div className="flex gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-sky-500 flex-shrink-0 mt-0.5">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-sm font-medium text-sky-800 dark:text-sky-300">Review Process</p>
              <p className="text-sm text-sky-700 dark:text-sky-400 mt-1">
                All stories are reviewed by our moderation team before being published.
                This usually takes 1-2 business days. You'll be notified once your story is live.
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
            onClick={() => navigate(-1)}
            className="flex-1 px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 px-6 py-3 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Submitting...' : 'Submit Story'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SubmitStory;
