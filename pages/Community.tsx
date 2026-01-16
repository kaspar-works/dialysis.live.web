import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  getCommunityProfile,
  getForumCategories,
  getFeaturedStories,
  ForumCategory,
  SuccessStory,
  CommunityProfile as CommunityProfileType,
} from '../services/community';
import CommunityNav from '../components/community/CommunityNav';
import StoryCard from '../components/community/StoryCard';

const Community: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<CommunityProfileType | null>(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [featuredStories, setFeaturedStories] = useState<SuccessStory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [profileResult, categoriesResult, storiesResult] = await Promise.all([
        getCommunityProfile(),
        getForumCategories(),
        getFeaturedStories(),
      ]);

      setProfile(profileResult.profile);
      setHasProfile(profileResult.hasProfile);
      setCategories(categoriesResult);
      setFeaturedStories(storiesResult);
    } catch (error) {
      console.error('Failed to load community data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!hasProfile) {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Community</h2>
          <p className="text-slate-500 dark:text-slate-400">Connect with fellow dialysis patients and healthcare professionals.</p>
        </div>

        <div className="bg-gradient-to-br from-sky-500 to-emerald-500 rounded-3xl p-8 text-white">
          <div className="max-w-2xl">
            <h3 className="text-2xl font-bold mb-4">Welcome to the Community</h3>
            <p className="text-white/80 mb-6">
              Join our supportive community of dialysis patients, caregivers, and healthcare professionals.
              Share your experiences, ask questions, and find inspiration from success stories.
            </p>
            <div className="flex flex-wrap gap-4 mb-8">
              <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M4.5 6.375a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0zM14.25 8.625a3.375 3.375 0 116.75 0 3.375 3.375 0 01-6.75 0zM1.5 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.75.75 0 01-.363.63 13.067 13.067 0 01-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 01-.364-.63l-.001-.122zM17.25 19.128l-.001.144a2.25 2.25 0 01-.233.96 10.088 10.088 0 005.06-1.01.75.75 0 00.42-.643 4.875 4.875 0 00-6.957-4.611 8.586 8.586 0 011.71 5.157v.003z" />
                </svg>
                Anonymous Support
              </div>
              <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                </svg>
                Verified HCPs
              </div>
              <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                </svg>
                Success Stories
              </div>
            </div>
            <button
              onClick={() => navigate('/community/my-profile')}
              className="bg-white text-sky-600 px-6 py-3 rounded-xl font-bold hover:bg-sky-50 transition-colors"
            >
              Create Your Profile
            </button>
          </div>
        </div>

        {featuredStories.length > 0 && (
          <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Featured Stories</h3>
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
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Community</h2>
        <p className="text-slate-500 dark:text-slate-400">
          Welcome back, <span className="font-semibold text-sky-500">{profile?.displayName}</span>
        </p>
      </div>

      <CommunityNav hasProfile={hasProfile} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">Forum Categories</h3>
              <button
                onClick={() => navigate('/community/forums')}
                className="text-sm text-sky-500 font-semibold hover:text-sky-600"
              >
                View All
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {categories.slice(0, 4).map((category) => (
                <button
                  key={category._id}
                  onClick={() => navigate(`/community/forums/${category.slug}`)}
                  className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-white/5 p-5 text-left hover:shadow-lg dark:hover:border-white/10 transition-all group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    {category.icon && (
                      <span className="text-2xl">{category.icon}</span>
                    )}
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.color || '#64748b' }}
                    />
                  </div>
                  <h4 className="font-bold text-slate-800 dark:text-white mb-1 group-hover:text-sky-500 transition-colors">
                    {category.name}
                  </h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                    {category.description}
                  </p>
                  <div className="mt-3 text-xs text-slate-400">
                    {category.postCount} posts
                    {category.isHCPOnly && (
                      <span className="ml-2 text-emerald-500 font-semibold">HCP Only</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {featuredStories.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">Featured Stories</h3>
                <button
                  onClick={() => navigate('/community/stories')}
                  className="text-sm text-sky-500 font-semibold hover:text-sky-600"
                >
                  View All
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {featuredStories.slice(0, 2).map((story) => (
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
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-white/5 p-5">
            <h4 className="font-bold text-slate-800 dark:text-white mb-4">Quick Actions</h4>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/community/forums')}
                className="w-full flex items-center gap-3 px-4 py-3 bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 rounded-xl font-medium hover:bg-sky-100 dark:hover:bg-sky-500/20 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M12 2.25c-2.429 0-4.817.178-7.152.521C2.87 3.061 1.5 4.795 1.5 6.741v6.018c0 1.946 1.37 3.68 3.348 3.97.877.129 1.761.218 2.652.27v4.251a.75.75 0 001.28.53l4.5-4.5a.75.75 0 01.53-.22h3.94c1.946 0 3.68-1.37 3.97-3.348.129-.877.218-1.761.27-2.652a.75.75 0 011.5.044 35.66 35.66 0 01-.274 2.704c-.37 2.51-2.506 4.502-5.058 4.772a35.33 35.33 0 01-2.658.27v2.376a2.25 2.25 0 01-3.843 1.591l-4.219-4.219c-.81-.042-1.614-.104-2.41-.188-2.552-.27-4.688-2.262-5.058-4.772A38.255 38.255 0 010 6.741C0 4.054 1.919 1.709 4.648 1.358 7.017 1.042 9.444.75 12 .75c2.556 0 4.983.292 7.352.608C22.08 1.71 24 4.054 24 6.741v6.018c0 .715-.103 1.405-.293 2.055a.75.75 0 11-1.436-.43c.143-.483.229-.99.229-1.625V6.741c0-1.946-1.37-3.68-3.348-3.97A35.755 35.755 0 0012 2.25z" clipRule="evenodd" />
                  <path d="M12 12.75a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V13.5a.75.75 0 01.75-.75zM12 9.75a.75.75 0 100-1.5.75.75 0 000 1.5z" />
                </svg>
                Start a Discussion
              </button>
              <button
                onClick={() => navigate('/community/stories/submit')}
                className="w-full flex items-center gap-3 px-4 py-3 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl font-medium hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                </svg>
                Share Your Story
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-5 text-white">
            <h4 className="font-bold mb-2">Are you a Healthcare Professional?</h4>
            <p className="text-sm text-white/80 mb-4">
              Get verified to help patients with your expertise.
            </p>
            <button
              onClick={() => navigate('/community/hcp-apply')}
              className="w-full bg-white text-amber-600 px-4 py-2.5 rounded-xl font-semibold hover:bg-amber-50 transition-colors"
            >
              Apply for Verification
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Community;
