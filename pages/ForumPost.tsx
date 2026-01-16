import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  getCommunityProfile,
  getForumPost,
  createForumReply,
  markAsHelpful,
  acceptAnswer,
  ForumPost as ForumPostType,
  ForumReply,
  ForumCategory,
  CommunityProfile,
} from '../services/community';
import CommunityNav from '../components/community/CommunityNav';
import DisplayNameBadge from '../components/community/DisplayNameBadge';
import ReplyCard from '../components/community/ReplyCard';
import ReportModal from '../components/community/ReportModal';

const ForumPost: React.FC = () => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const [profile, setProfile] = useState<CommunityProfile | null>(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [post, setPost] = useState<ForumPostType | null>(null);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [loading, setLoading] = useState(true);

  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [reportModal, setReportModal] = useState<{
    isOpen: boolean;
    contentType: 'forum_post' | 'forum_reply';
    contentId: string;
  }>({ isOpen: false, contentType: 'forum_post', contentId: '' });

  useEffect(() => {
    loadData();
  }, [slug]);

  const loadData = async () => {
    if (!slug) return;

    try {
      const [profileResult, postResult] = await Promise.all([
        getCommunityProfile(),
        getForumPost(slug),
      ]);

      setProfile(profileResult.profile);
      setHasProfile(profileResult.hasProfile);
      setPost(postResult.post);
      setReplies(postResult.replies);
    } catch (error) {
      console.error('Failed to load post:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReply = async () => {
    if (!post || !replyContent.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const newReply = await createForumReply(post._id, { content: replyContent.trim() });
      setReplies([...replies, newReply]);
      setReplyContent('');
    } catch (err: any) {
      setError(err.message || 'Failed to post reply');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkHelpful = async (type: 'post' | 'reply', id: string) => {
    try {
      await markAsHelpful(type, id);
      if (type === 'post' && post) {
        setPost({ ...post, helpfulCount: post.helpfulCount + 1 });
      } else {
        setReplies(replies.map((r) =>
          r._id === id ? { ...r, helpfulCount: r.helpfulCount + 1 } : r
        ));
      }
    } catch (error) {
      console.error('Failed to mark as helpful:', error);
    }
  };

  const handleAcceptAnswer = async (replyId: string) => {
    try {
      await acceptAnswer(replyId);
      setReplies(replies.map((r) =>
        r._id === replyId ? { ...r, isAcceptedAnswer: true } : { ...r, isAcceptedAnswer: false }
      ));
    } catch (error) {
      console.error('Failed to accept answer:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Post Not Found</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-4">The requested post does not exist or has been removed.</p>
        <button
          onClick={() => navigate('/community/forums')}
          className="text-sky-500 font-semibold hover:text-sky-600"
        >
          Back to Forums
        </button>
      </div>
    );
  }

  const author = typeof post.authorId === 'object' ? post.authorId as CommunityProfile : null;
  const category = typeof post.categoryId === 'object' ? post.categoryId as ForumCategory : null;
  const isPostAuthor = profile && author && profile._id === author._id;

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
        {category && (
          <button
            onClick={() => navigate(`/community/forums/${category.slug}`)}
            className="text-sm text-sky-500 hover:text-sky-600 font-medium"
          >
            {category.name}
          </button>
        )}
      </div>

      <CommunityNav hasProfile={hasProfile} />

      <article className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-white/5 p-6">
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {post.isPinned && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-full">
              Pinned
            </span>
          )}
          {post.isLocked && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/50 px-2 py-0.5 rounded-full">
              Locked
            </span>
          )}
        </div>

        <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">{post.title}</h1>

        <div className="flex items-center gap-3 mb-6">
          {author && <DisplayNameBadge profile={author} linkToProfile />}
          <span className="text-slate-300 dark:text-slate-600">·</span>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {new Date(post.createdAt).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none mb-6">
          <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{post.content}</p>
        </div>

        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {post.tags.map((tag, idx) => (
              <span
                key={idx}
                className="text-sm font-medium text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-500/10 px-3 py-1 rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
              {post.viewCount} views
            </span>
            <span className="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M10 2c-2.236 0-4.43.18-6.57.524C1.993 2.755 1 4.014 1 5.426v5.148c0 1.413.993 2.67 2.43 2.902.848.137 1.705.248 2.57.331v3.443a.75.75 0 001.28.53l3.58-3.579a.78.78 0 01.527-.224 41.202 41.202 0 005.183-.5c1.437-.232 2.43-1.49 2.43-2.903V5.426c0-1.413-.993-2.67-2.43-2.902A41.289 41.289 0 0010 2z" clipRule="evenodd" />
              </svg>
              {post.replyCount} replies
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleMarkHelpful('post', post._id)}
              className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path d="M1 8.25a1.25 1.25 0 112.5 0v7.5a1.25 1.25 0 11-2.5 0v-7.5zM11 3V1.7c0-.268.14-.526.395-.607A2 2 0 0114 3c0 .995-.182 1.948-.514 2.826-.204.54.166 1.174.744 1.174h2.52c1.243 0 2.261 1.01 2.146 2.247a23.864 23.864 0 01-1.341 5.974C17.153 16.323 16.072 17 14.9 17h-3.192a3 3 0 01-1.341-.317l-2.734-1.366A3 3 0 006.292 15H5V8h1.292c.86 0 1.693-.292 2.36-.824l2.369-1.893A2.5 2.5 0 0011 3z" />
              </svg>
              <span>{post.helpfulCount} Helpful</span>
            </button>
            <button
              onClick={() => setReportModal({ isOpen: true, contentType: 'forum_post', contentId: post._id })}
              className="text-sm text-slate-400 hover:text-red-500 transition-colors"
            >
              Report
            </button>
          </div>
        </div>
      </article>

      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">
          {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
        </h2>

        {replies.length === 0 ? (
          <div className="text-center py-8 bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-white/5">
            <p className="text-slate-500 dark:text-slate-400">No replies yet. Be the first to respond!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {replies.map((reply) => (
              <ReplyCard
                key={reply._id}
                reply={reply}
                isPostAuthor={isPostAuthor}
                canAcceptAnswer={!!isPostAuthor && !post.isLocked}
                onMarkHelpful={() => handleMarkHelpful('reply', reply._id)}
                onAcceptAnswer={() => handleAcceptAnswer(reply._id)}
                onReport={() => setReportModal({ isOpen: true, contentType: 'forum_reply', contentId: reply._id })}
              />
            ))}
          </div>
        )}
      </div>

      {!post.isLocked && hasProfile && (
        <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-white/5 p-6">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Write a Reply</h3>
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Share your thoughts, experience, or advice..."
            rows={4}
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none mb-4"
          />

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={handleSubmitReply}
              disabled={submitting || !replyContent.trim()}
              className="px-6 py-2.5 bg-sky-500 text-white rounded-xl font-semibold hover:bg-sky-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Posting...' : 'Post Reply'}
            </button>
          </div>
        </div>
      )}

      {post.isLocked && (
        <div className="bg-slate-100 dark:bg-slate-800/50 rounded-2xl p-6 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-8 h-8 mx-auto text-slate-400 mb-2">
            <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
          </svg>
          <p className="text-slate-500 dark:text-slate-400">This thread has been locked and no longer accepts new replies.</p>
        </div>
      )}

      <ReportModal
        isOpen={reportModal.isOpen}
        onClose={() => setReportModal({ ...reportModal, isOpen: false })}
        contentType={reportModal.contentType}
        contentId={reportModal.contentId}
      />
    </div>
  );
};

export default ForumPost;
