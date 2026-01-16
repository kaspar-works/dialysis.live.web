import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  getCommunityProfile,
  getSuccessStory,
  likeSuccessStory,
  SuccessStory,
  CommunityProfile,
  MILESTONE_CONFIG,
} from '../services/community';
import CommunityNav from '../components/community/CommunityNav';
import DisplayNameBadge from '../components/community/DisplayNameBadge';

const SuccessStoryDetail: React.FC = () => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const [profile, setProfile] = useState<CommunityProfile | null>(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [story, setStory] = useState<SuccessStory | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    loadData();
  }, [slug]);

  const loadData = async () => {
    if (!slug) return;

    try {
      const [profileResult, storyResult] = await Promise.all([
        getCommunityProfile(),
        getSuccessStory(slug),
      ]);

      setProfile(profileResult.profile);
      setHasProfile(profileResult.hasProfile);
      setStory(storyResult);
    } catch (error) {
      console.error('Failed to load story:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!story || liked) return;

    try {
      await likeSuccessStory(story._id);
      setStory({ ...story, likeCount: story.likeCount + 1 });
      setLiked(true);
    } catch (error) {
      console.error('Failed to like story:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!story) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Story Not Found</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-4">The requested story does not exist or has been removed.</p>
        <button
          onClick={() => navigate('/community/stories')}
          className="text-sky-500 font-semibold hover:text-sky-600"
        >
          Back to Stories
        </button>
      </div>
    );
  }

  const author = typeof story.authorId === 'object' ? story.authorId as CommunityProfile : null;
  const milestoneConfig = story.milestoneType ? MILESTONE_CONFIG[story.milestoneType] : null;
  const publishedDate = story.publishedAt ? new Date(story.publishedAt) : new Date(story.createdAt);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/community/stories')}
          className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
          </svg>
        </button>
        <span className="text-sm text-sky-500 font-medium">Success Stories</span>
      </div>

      <CommunityNav hasProfile={hasProfile} />

      <article className="max-w-3xl mx-auto">
        {story.photoUrls.length > 0 && (
          <div className="relative rounded-2xl overflow-hidden mb-8">
            <img
              src={story.photoUrls[0]}
              alt={story.title}
              className="w-full h-64 md:h-96 object-cover"
            />
            {story.isFeatured && (
              <div className="absolute top-4 right-4">
                <span className="inline-flex items-center gap-1 text-sm font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-500/20 px-3 py-1.5 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
                  </svg>
                  Featured
                </span>
              </div>
            )}
          </div>
        )}

        <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-white/5 p-6 md:p-8">
          {milestoneConfig && (
            <div className="mb-4">
              <span
                className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1 rounded-full"
                style={{ backgroundColor: `${milestoneConfig.color}20`, color: milestoneConfig.color }}
              >
                <span>{milestoneConfig.icon}</span>
                {milestoneConfig.label}
              </span>
            </div>
          )}

          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white mb-6">
            {story.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 mb-8 pb-6 border-b border-slate-100 dark:border-white/5">
            {author && <DisplayNameBadge profile={author} size="lg" linkToProfile />}
            <div className="text-slate-400 dark:text-slate-500">|</div>
            <span className="text-slate-500 dark:text-slate-400">
              {publishedDate.toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
            {story.dialysisDuration && (
              <>
                <div className="text-slate-400 dark:text-slate-500">|</div>
                <span className="text-slate-500 dark:text-slate-400">
                  {story.dialysisDuration} on dialysis
                </span>
              </>
            )}
          </div>

          <div className="prose prose-lg prose-slate dark:prose-invert max-w-none mb-8">
            <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
              {story.content}
            </p>
          </div>

          {story.photoUrls.length > 1 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              {story.photoUrls.slice(1).map((url, idx) => (
                <img
                  key={idx}
                  src={url}
                  alt={`${story.title} - Photo ${idx + 2}`}
                  className="w-full h-32 md:h-40 object-cover rounded-xl"
                />
              ))}
            </div>
          )}

          {story.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {story.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="text-sm font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                  <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
                {story.viewCount} views
              </span>
            </div>

            <button
              onClick={handleLike}
              disabled={liked}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-colors ${
                liked
                  ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-500 cursor-default'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 hover:text-rose-500'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path d="M9.653 16.915l-.005-.003-.019-.01a20.759 20.759 0 01-1.162-.682 22.045 22.045 0 01-2.582-1.9C4.045 12.733 2 10.352 2 7.5a4.5 4.5 0 018-2.828A4.5 4.5 0 0118 7.5c0 2.852-2.044 5.233-3.885 6.82a22.049 22.049 0 01-3.744 2.582l-.019.01-.005.003h-.002a.739.739 0 01-.69.001l-.002-.001z" />
              </svg>
              <span>{story.likeCount} {liked ? 'Liked' : 'Like'}</span>
            </button>
          </div>
        </div>

        <div className="mt-8 bg-gradient-to-r from-emerald-500 to-sky-500 rounded-2xl p-6 text-white text-center">
          <h3 className="text-xl font-bold mb-2">Inspired by this story?</h3>
          <p className="text-white/80 mb-4">Share your own journey and inspire others in the community.</p>
          <button
            onClick={() => navigate('/community/stories/submit')}
            className="bg-white text-emerald-600 px-6 py-2.5 rounded-xl font-semibold hover:bg-emerald-50 transition-colors"
          >
            Share Your Story
          </button>
        </div>
      </article>
    </div>
  );
};

export default SuccessStoryDetail;
