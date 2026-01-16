import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  getCommunityProfile,
  getForumCategory,
  ForumCategory as ForumCategoryType,
  ForumPost,
  CommunityProfile,
} from '../services/community';
import CommunityNav from '../components/community/CommunityNav';
import PostCard from '../components/community/PostCard';

const ForumCategory: React.FC = () => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const [profile, setProfile] = useState<CommunityProfile | null>(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [category, setCategory] = useState<ForumCategoryType | null>(null);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [pagination, setPagination] = useState({ total: 0, limit: 20, offset: 0 });
  const [sort, setSort] = useState<'latest' | 'activity' | 'popular'>('latest');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [slug, sort]);

  const loadData = async () => {
    if (!slug) return;

    try {
      const [profileResult, categoryResult] = await Promise.all([
        getCommunityProfile(),
        getForumCategory(slug, { limit: 20, offset: 0, sort }),
      ]);

      setProfile(profileResult.profile);
      setHasProfile(profileResult.hasProfile);
      setCategory(categoryResult.category);
      setPosts(categoryResult.posts);
      setPagination(categoryResult.pagination);
    } catch (error) {
      console.error('Failed to load category:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!slug || posts.length >= pagination.total) return;

    try {
      const result = await getForumCategory(slug, {
        limit: 20,
        offset: posts.length,
        sort,
      });
      setPosts([...posts, ...result.posts]);
      setPagination(result.pagination);
    } catch (error) {
      console.error('Failed to load more posts:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Category Not Found</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-4">The requested category does not exist.</p>
        <button
          onClick={() => navigate('/community/forums')}
          className="text-sky-500 font-semibold hover:text-sky-600"
        >
          Back to Forums
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/community/forums')}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
            </svg>
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-3xl font-bold text-slate-800 dark:text-white">{category.name}</h2>
              {category.isHCPOnly && (
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-full">
                  HCP Replies Only
                </span>
              )}
            </div>
            <p className="text-slate-500 dark:text-slate-400">{category.description}</p>
          </div>
        </div>
        <button
          onClick={() => navigate(`/community/forums/new-post?category=${category._id}`)}
          className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-sky-500 text-white rounded-xl font-semibold hover:bg-sky-600 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
          </svg>
          New Post
        </button>
      </div>

      <CommunityNav hasProfile={hasProfile} />

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {pagination.total} {pagination.total === 1 ? 'post' : 'posts'}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500 dark:text-slate-400">Sort by:</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as 'latest' | 'activity' | 'popular')}
            className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="latest">Latest</option>
            <option value="activity">Recent Activity</option>
            <option value="popular">Most Popular</option>
          </select>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-white/5">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-4">
            <path fillRule="evenodd" d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 01-3.476.383.39.39 0 00-.297.17l-2.755 4.133a.75.75 0 01-1.248 0l-2.755-4.133a.39.39 0 00-.297-.17 48.9 48.9 0 01-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97z" clipRule="evenodd" />
          </svg>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">No posts yet</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-4">Be the first to start a discussion in this category!</p>
          <button
            onClick={() => navigate(`/community/forums/new-post?category=${category._id}`)}
            className="px-4 py-2 bg-sky-500 text-white rounded-xl font-semibold hover:bg-sky-600 transition-colors"
          >
            Create First Post
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              onClick={() => navigate(`/community/forums/post/${post.slug}`)}
            />
          ))}

          {posts.length < pagination.total && (
            <button
              onClick={loadMore}
              className="w-full py-3 text-sky-500 font-semibold hover:text-sky-600 transition-colors"
            >
              Load More
            </button>
          )}
        </div>
      )}

      <button
        onClick={() => navigate(`/community/forums/new-post?category=${category._id}`)}
        className="w-full sm:hidden flex items-center justify-center gap-2 px-4 py-3 bg-sky-500 text-white rounded-xl font-semibold hover:bg-sky-600 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
          <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
        </svg>
        Create New Post
      </button>
    </div>
  );
};

export default ForumCategory;
