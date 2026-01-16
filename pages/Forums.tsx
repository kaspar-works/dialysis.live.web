import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  getCommunityProfile,
  getForumCategories,
  getForumPosts,
  ForumCategory,
  ForumPost,
  CommunityProfile,
} from '../services/community';
import CommunityNav from '../components/community/CommunityNav';
import PostCard from '../components/community/PostCard';

const Forums: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<CommunityProfile | null>(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [recentPosts, setRecentPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [profileResult, categoriesResult, postsResult] = await Promise.all([
        getCommunityProfile(),
        getForumCategories(),
        getForumPosts({ limit: 5, sort: 'latest' }),
      ]);

      setProfile(profileResult.profile);
      setHasProfile(profileResult.hasProfile);
      setCategories(categoriesResult);
      setRecentPosts(postsResult.posts);
    } catch (error) {
      console.error('Failed to load forums data:', error);
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
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Forums</h2>
          <p className="text-slate-500 dark:text-slate-400">
            Please create a community profile to access the forums.
          </p>
        </div>
        <button
          onClick={() => navigate('/community/my-profile')}
          className="px-6 py-3 bg-sky-500 text-white rounded-xl font-semibold hover:bg-sky-600 transition-colors"
        >
          Create Profile
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Forums</h2>
          <p className="text-slate-500 dark:text-slate-400">
            Connect with the community, ask questions, and share your experiences.
          </p>
        </div>
        <button
          onClick={() => navigate('/community/forums/new-post')}
          className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-sky-500 text-white rounded-xl font-semibold hover:bg-sky-600 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
          </svg>
          New Post
        </button>
      </div>

      <CommunityNav hasProfile={hasProfile} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Categories</h3>
          <div className="space-y-3">
            {categories.map((category) => (
              <button
                key={category._id}
                onClick={() => navigate(`/community/forums/${category.slug}`)}
                className="w-full bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-white/5 p-5 text-left hover:shadow-lg dark:hover:border-white/10 transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                    style={{ backgroundColor: `${category.color || '#64748b'}20` }}
                  >
                    {category.icon || '💬'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-slate-800 dark:text-white group-hover:text-sky-500 transition-colors">
                        {category.name}
                      </h4>
                      {category.isHCPOnly && (
                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full">
                          HCP Only
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                      {category.description}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                      <span>{category.postCount} posts</span>
                      {category.lastPostAt && (
                        <span>
                          Last post: {new Date(category.lastPostAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-slate-400 group-hover:text-sky-500 transition-colors">
                    <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Recent Discussions</h3>
          <div className="space-y-3">
            {recentPosts.map((post) => (
              <div
                key={post._id}
                onClick={() => navigate(`/community/forums/post/${post.slug}`)}
                className="bg-white dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-white/5 p-4 hover:shadow-lg dark:hover:border-white/10 transition-all cursor-pointer"
              >
                <h4 className="font-semibold text-slate-800 dark:text-white text-sm line-clamp-2 mb-2">
                  {post.title}
                </h4>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span>{post.replyCount} replies</span>
                  <span>·</span>
                  <span>{new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => navigate('/community/forums/new-post')}
            className="w-full mt-4 flex sm:hidden items-center justify-center gap-2 px-4 py-3 bg-sky-500 text-white rounded-xl font-semibold hover:bg-sky-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
            </svg>
            Create New Post
          </button>
        </div>
      </div>
    </div>
  );
};

export default Forums;
