import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  getForumCategories,
  getForumPosts,
  getForumPost,
  createForumPost,
  createForumReply,
  markAsHelpful,
  ForumCategory,
  ForumPost,
  ForumReply,
  CommunityProfile,
} from '../services/community';

// ========================
// Icons
// ========================

const SearchIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <circle cx="11" cy="11" r="8" />
    <path strokeLinecap="round" d="m21 21-4.35-4.35" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);

const ChatBubbleIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const ChevronDownIcon = ({ className }: { className?: string }) => (
  <svg className={className || "w-5 h-5"} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

const ThumbsUpIcon = ({ className }: { className?: string }) => (
  <svg className={className || "w-4 h-4"} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3" />
  </svg>
);

const XIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const EmptyIcon = () => (
  <svg className="w-16 h-16" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
  </svg>
);

// ========================
// Helpers
// ========================

const DEFAULT_CATEGORIES = [
  'Diet',
  'Medications',
  'Sessions',
  'Lifestyle',
  'Emotional Support',
  'Caregivers',
];

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function getCategoryColor(name: string): string {
  const colors: Record<string, string> = {
    diet: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    medications: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    sessions: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
    lifestyle: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    'emotional support': 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
    caregivers: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  };
  return colors[name.toLowerCase()] || 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
}

// ========================
// Component
// ========================

export default function Messages() {
  // Data
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [totalPosts, setTotalPosts] = useState(0);

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'activity'>('latest');

  // Expanded question
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<ForumReply[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(false);

  // Reply form
  const [replyContent, setReplyContent] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  // Ask question modal
  const [showAskModal, setShowAskModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [newCategoryId, setNewCategoryId] = useState('');
  const [submittingQuestion, setSubmittingQuestion] = useState(false);

  const hasFetched = useRef(false);

  // ========================
  // Data loading
  // ========================

  const loadPosts = useCallback(async (categoryId?: string | null, sort?: 'latest' | 'popular' | 'activity') => {
    try {
      setLoading(true);
      setError(null);
      const params: any = { limit: 20, sort: sort || sortBy };
      if (categoryId) params.categoryId = categoryId;
      const result = await getForumPosts(params);
      setPosts(result.posts);
      setTotalPosts(result.pagination.total);
    } catch (err: any) {
      setError(err.message || 'Failed to load questions');
    } finally {
      setLoading(false);
    }
  }, [sortBy]);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    (async () => {
      try {
        const [categoriesResult] = await Promise.all([
          getForumCategories(),
        ]);
        setCategories(categoriesResult);
      } catch {
        // Categories are non-critical
      }
      await loadPosts();
    })();
  }, [loadPosts]);

  const handleCategoryFilter = (categoryId: string | null) => {
    setSelectedCategoryId(categoryId);
    setExpandedPostId(null);
    loadPosts(categoryId, sortBy);
  };

  const handleSortChange = (sort: 'latest' | 'popular' | 'activity') => {
    setSortBy(sort);
    loadPosts(selectedCategoryId, sort);
  };

  // ========================
  // Expand / collapse question
  // ========================

  const handleToggleExpand = async (post: ForumPost) => {
    if (expandedPostId === post._id) {
      setExpandedPostId(null);
      setExpandedReplies([]);
      setReplyContent('');
      return;
    }

    setExpandedPostId(post._id);
    setLoadingReplies(true);
    try {
      const result = await getForumPost(post.slug);
      setExpandedReplies(result.replies);
    } catch {
      setExpandedReplies([]);
    } finally {
      setLoadingReplies(false);
    }
  };

  // ========================
  // Submit reply
  // ========================

  const handleSubmitReply = async (postId: string) => {
    if (!replyContent.trim() || submittingReply) return;
    try {
      setSubmittingReply(true);
      const reply = await createForumReply(postId, { content: replyContent.trim() });
      setExpandedReplies((prev) => [...prev, reply]);
      setReplyContent('');
      // Update reply count locally
      setPosts((prev) =>
        prev.map((p) => (p._id === postId ? { ...p, replyCount: p.replyCount + 1 } : p))
      );
    } catch (err: any) {
      setError(err.message || 'Failed to post answer');
    } finally {
      setSubmittingReply(false);
    }
  };

  // ========================
  // Mark helpful
  // ========================

  const handleMarkHelpful = async (type: 'post' | 'reply', id: string) => {
    try {
      await markAsHelpful(type, id);
      if (type === 'reply') {
        setExpandedReplies((prev) =>
          prev.map((r) => (r._id === id ? { ...r, helpfulCount: r.helpfulCount + 1 } : r))
        );
      } else {
        setPosts((prev) =>
          prev.map((p) => (p._id === id ? { ...p, helpfulCount: p.helpfulCount + 1 } : p))
        );
      }
    } catch {
      // Silently fail (user may have already marked)
    }
  };

  // ========================
  // Ask question
  // ========================

  const handleAskQuestion = async () => {
    if (!newTitle.trim() || !newBody.trim() || !newCategoryId || submittingQuestion) return;
    try {
      setSubmittingQuestion(true);
      setError(null);
      const post = await createForumPost({
        categoryId: newCategoryId,
        title: newTitle.trim(),
        content: newBody.trim(),
      });
      setPosts((prev) => [post, ...prev]);
      setTotalPosts((prev) => prev + 1);
      setNewTitle('');
      setNewBody('');
      setNewCategoryId('');
      setShowAskModal(false);
    } catch (err: any) {
      setError(err.message || 'Failed to post question');
    } finally {
      setSubmittingQuestion(false);
    }
  };

  // ========================
  // Search filtering (client-side on loaded posts)
  // ========================

  const filteredPosts = searchQuery.trim()
    ? posts.filter(
        (p) =>
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : posts;

  // ========================
  // Get category name helper
  // ========================

  const getCategoryName = (post: ForumPost): string => {
    if (typeof post.categoryId === 'object' && post.categoryId !== null) {
      return (post.categoryId as ForumCategory).name;
    }
    const cat = categories.find((c) => c._id === post.categoryId);
    return cat?.name || '';
  };

  const getAuthorName = (authorId: string | CommunityProfile): string => {
    if (typeof authorId === 'object' && authorId !== null) {
      return (authorId as CommunityProfile).displayName;
    }
    return 'Community Member';
  };

  // ========================
  // Render
  // ========================

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Community Q&A</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Ask questions, share experiences, and support fellow patients and caregivers.
          </p>
        </div>
        <button
          onClick={() => setShowAskModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm font-medium transition-colors"
        >
          <PlusIcon />
          Ask a Question
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 text-red-700 dark:text-red-400 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-2 underline hover:no-underline text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
            <SearchIcon />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm"
          />
        </div>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => handleSortChange(e.target.value as any)}
          className="px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 appearance-none cursor-pointer"
        >
          <option value="latest">Newest</option>
          <option value="popular">Most Popular</option>
          <option value="activity">Recent Activity</option>
        </select>
      </div>

      {/* Category filter chips */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleCategoryFilter(null)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            !selectedCategoryId
              ? 'bg-sky-600 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat._id}
            onClick={() => handleCategoryFilter(cat._id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              selectedCategoryId === cat._id
                ? 'bg-sky-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {cat.icon ? `${cat.icon} ` : ''}{cat.name}
          </button>
        ))}
      </div>

      {/* Questions feed */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" />
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-slate-300 dark:text-slate-600 mb-4">
            <EmptyIcon />
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            {searchQuery ? 'No questions match your search' : 'No questions yet'}
          </p>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">
            {searchQuery ? 'Try different keywords or browse all categories' : 'Be the first to ask a question!'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPosts.map((post) => {
            const isExpanded = expandedPostId === post._id;
            const categoryName = getCategoryName(post);
            const authorName = getAuthorName(post.authorId);

            return (
              <div
                key={post._id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-shadow hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-slate-900/50"
              >
                {/* Question card */}
                <button
                  onClick={() => handleToggleExpand(post)}
                  className="w-full text-left p-5"
                >
                  <div className="flex items-start gap-4">
                    {/* Answers count badge */}
                    <div className="flex-shrink-0 flex flex-col items-center w-14">
                      <div className={`text-lg font-bold ${post.replyCount > 0 ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400 dark:text-slate-500'}`}>
                        {post.replyCount}
                      </div>
                      <div className="text-xs text-slate-400 dark:text-slate-500">
                        {post.replyCount === 1 ? 'answer' : 'answers'}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 dark:text-white text-base mb-1.5 line-clamp-2">
                        {post.isPinned && (
                          <span className="text-amber-500 mr-1.5 text-sm">Pinned</span>
                        )}
                        {post.title}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
                        {post.content}
                      </p>

                      {/* Meta row */}
                      <div className="flex items-center flex-wrap gap-2">
                        {categoryName && (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(categoryName)}`}>
                            {categoryName}
                          </span>
                        )}
                        {post.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded-full text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                          >
                            {tag}
                          </span>
                        ))}
                        <span className="text-xs text-slate-400 dark:text-slate-500 ml-auto">
                          {authorName} &middot; {formatTimeAgo(post.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Expand indicator */}
                    <div className="flex-shrink-0 mt-1">
                      <ChevronDownIcon
                        className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    </div>
                  </div>
                </button>

                {/* Expanded answers section */}
                {isExpanded && (
                  <div className="border-t border-slate-200 dark:border-slate-800">
                    {/* Helpful count for the question */}
                    <div className="px-5 py-3 flex items-center gap-4 border-b border-slate-100 dark:border-slate-800/50">
                      <button
                        onClick={() => handleMarkHelpful('post', post._id)}
                        className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
                      >
                        <ThumbsUpIcon />
                        <span>{post.helpfulCount} helpful</span>
                      </button>
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        {post.viewCount} views
                      </span>
                    </div>

                    {/* Answers list */}
                    <div className="px-5 py-4 space-y-4">
                      <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <ChatBubbleIcon />
                        {post.replyCount} {post.replyCount === 1 ? 'Answer' : 'Answers'}
                      </h4>

                      {loadingReplies ? (
                        <div className="flex justify-center py-6">
                          <div className="w-6 h-6 border-2 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" />
                        </div>
                      ) : expandedReplies.length === 0 ? (
                        <p className="text-sm text-slate-400 dark:text-slate-500 py-3">
                          No answers yet. Be the first to help!
                        </p>
                      ) : (
                        expandedReplies.map((reply) => (
                          <div
                            key={reply._id}
                            className={`rounded-xl p-4 ${
                              reply.isAcceptedAnswer
                                ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800'
                                : 'bg-slate-50 dark:bg-slate-800/50'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                                    {getAuthorName(reply.authorId)}
                                  </span>
                                  {reply.isHCPResponse && (
                                    <span className="px-1.5 py-0.5 text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full">
                                      HCP
                                    </span>
                                  )}
                                  {reply.isAcceptedAnswer && (
                                    <span className="px-1.5 py-0.5 text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full">
                                      Accepted
                                    </span>
                                  )}
                                  <span className="text-xs text-slate-400 dark:text-slate-500">
                                    {formatTimeAgo(reply.createdAt)}
                                  </span>
                                </div>
                                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words">
                                  {reply.content}
                                </p>
                                <button
                                  onClick={() => handleMarkHelpful('reply', reply._id)}
                                  className="flex items-center gap-1 mt-2 text-xs text-slate-400 dark:text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
                                >
                                  <ThumbsUpIcon className="w-3.5 h-3.5" />
                                  <span>{reply.helpfulCount} helpful</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}

                      {/* Reply input */}
                      <div className="pt-2">
                        <textarea
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          placeholder="Write your answer..."
                          rows={3}
                          className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm resize-none"
                        />
                        <div className="flex justify-end mt-2">
                          <button
                            onClick={() => handleSubmitReply(post._id)}
                            disabled={submittingReply || !replyContent.trim()}
                            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 disabled:bg-sky-600/50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium transition-colors"
                          >
                            {submittingReply ? 'Posting...' : 'Post Answer'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Ask Question Modal */}
      {showAskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowAskModal(false)}
          />

          {/* Modal */}
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Ask a Question</h2>
              <button
                onClick={() => setShowAskModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <XIcon />
              </button>
            </div>

            {/* Modal body */}
            <div className="p-5 space-y-4">
              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Category
                </label>
                <select
                  value={newCategoryId}
                  onChange={(e) => setNewCategoryId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 appearance-none cursor-pointer"
                >
                  <option value="">Select a category...</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Question Title
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., How do you manage fluid intake on dialysis days?"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm"
                />
              </div>

              {/* Body */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Details
                </label>
                <textarea
                  value={newBody}
                  onChange={(e) => setNewBody(e.target.value)}
                  placeholder="Provide more context about your question..."
                  rows={5}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm resize-none"
                />
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setShowAskModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAskQuestion}
                disabled={submittingQuestion || !newTitle.trim() || !newBody.trim() || !newCategoryId}
                className="px-5 py-2 bg-sky-600 hover:bg-sky-700 disabled:bg-sky-600/50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium transition-colors"
              >
                {submittingQuestion ? 'Posting...' : 'Post Question'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
