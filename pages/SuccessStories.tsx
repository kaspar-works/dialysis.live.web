import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  getCommunityProfile,
  getSuccessStories,
  getFeaturedStories,
  SuccessStory,
  CommunityProfile,
  MilestoneType,
  MILESTONE_CONFIG,
} from '../services/community';
import CommunityNav from '../components/community/CommunityNav';
import StoryCard from '../components/community/StoryCard';

const SuccessStories: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<CommunityProfile | null>(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [stories, setStories] = useState<SuccessStory[]>([]);
  const [featuredStories, setFeaturedStories] = useState<SuccessStory[]>([]);
  const [pagination, setPagination] = useState({ total: 0, limit: 12, offset: 0 });
  const [milestoneFilter, setMilestoneFilter] = useState<MilestoneType | ''>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [milestoneFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [profileResult, storiesResult, featuredResult] = await Promise.all([
        getCommunityProfile(),
        getSuccessStories({
          milestoneType: milestoneFilter || undefined,
          limit: 12,
          offset: 0,
        }),
        getFeaturedStories(),
      ]);

      setProfile(profileResult.profile);
      setHasProfile(profileResult.hasProfile);
      setStories(storiesResult.stories);
      setPagination(storiesResult.pagination);
      setFeaturedStories(featuredResult);
    } catch (error) {
      console.error('Failed to load stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (stories.length >= pagination.total) return;

    try {
      const result = await getSuccessStories({
        milestoneType: milestoneFilter || undefined,
        limit: 12,
        offset: stories.length,
      });
      setStories([...stories, ...result.stories]);
      setPagination(result.pagination);
    } catch (error) {
      console.error('Failed to load more stories:', error);
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
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Success Stories</h2>
          <p className="text-slate-500 dark:text-slate-400">
            Inspiring journeys from our dialysis community
          </p>
        </div>
        {hasProfile && (
          <button
            onClick={() => navigate('/community/stories/submit')}
            className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
            </svg>
            Share Your Story
          </button>
        )}
      </div>

      <CommunityNav hasProfile={hasProfile} />

      {featuredStories.length > 0 && !milestoneFilter && (
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Featured Stories</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredStories.slice(0, 3).map((story) => (
              <StoryCard
                key={story._id}
                story={story}
                featured
                onClick={() => navigate(`/community/stories/${story.slug}`)}
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-slate-500 dark:text-slate-400 mr-2">Filter by milestone:</span>
        <button
          onClick={() => setMilestoneFilter('')}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            milestoneFilter === ''
              ? 'bg-sky-500 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          All
        </button>
        {(Object.keys(MILESTONE_CONFIG) as MilestoneType[]).map((type) => (
          <button
            key={type}
            onClick={() => setMilestoneFilter(type)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1 ${
              milestoneFilter === type
                ? 'text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
            style={milestoneFilter === type ? { backgroundColor: MILESTONE_CONFIG[type].color } : {}}
          >
            <span>{MILESTONE_CONFIG[type].icon}</span>
            <span className="hidden sm:inline">{MILESTONE_CONFIG[type].label}</span>
          </button>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {pagination.total} {pagination.total === 1 ? 'story' : 'stories'}
          </p>
        </div>

        {stories.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-white/5">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-4">
              <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
            </svg>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">No stories yet</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-4">Be the first to share your inspiring journey!</p>
            {hasProfile && (
              <button
                onClick={() => navigate('/community/stories/submit')}
                className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition-colors"
              >
                Share Your Story
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stories.map((story) => (
              <StoryCard
                key={story._id}
                story={story}
                onClick={() => navigate(`/community/stories/${story.slug}`)}
              />
            ))}
          </div>
        )}

        {stories.length < pagination.total && (
          <div className="text-center mt-8">
            <button
              onClick={loadMore}
              className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Load More Stories
            </button>
          </div>
        )}
      </div>

      {hasProfile && (
        <button
          onClick={() => navigate('/community/stories/submit')}
          className="w-full sm:hidden flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
          </svg>
          Share Your Story
        </button>
      )}
    </div>
  );
};

export default SuccessStories;
