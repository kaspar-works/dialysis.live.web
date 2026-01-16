import React from 'react';
import { ForumPost, CommunityProfile } from '../../services/community';
import DisplayNameBadge from './DisplayNameBadge';

interface PostCardProps {
  post: ForumPost;
  onClick?: () => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onClick }) => {
  const author = typeof post.authorId === 'object' ? post.authorId as CommunityProfile : null;
  const createdAt = new Date(post.createdAt);
  const timeAgo = getTimeAgo(createdAt);

  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-white/5 p-5 hover:shadow-lg dark:hover:border-white/10 transition-all cursor-pointer"
    >
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {post.isPinned && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                  <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
                </svg>
                Pinned
              </span>
            )}
            {post.isLocked && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/50 px-2 py-0.5 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                  <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                </svg>
                Locked
              </span>
            )}
          </div>

          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2 line-clamp-2 group-hover:text-sky-500 transition-colors">
            {post.title}
          </h3>

          <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
            {post.content.replace(/<[^>]*>/g, '').substring(0, 150)}...
          </p>

          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {post.tags.slice(0, 3).map((tag, idx) => (
                <span
                  key={idx}
                  className="text-xs font-medium text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-500/10 px-2 py-0.5 rounded-full"
                >
                  #{tag}
                </span>
              ))}
              {post.tags.length > 3 && (
                <span className="text-xs text-slate-400">+{post.tags.length - 3} more</span>
              )}
            </div>
          )}

          <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              {author && <DisplayNameBadge profile={author} size="sm" />}
              <span className="text-slate-300 dark:text-slate-600">·</span>
              <span>{timeAgo}</span>
            </div>

            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                  <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
                {post.viewCount}
              </span>
              <span className="flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M10 2c-2.236 0-4.43.18-6.57.524C1.993 2.755 1 4.014 1 5.426v5.148c0 1.413.993 2.67 2.43 2.902.848.137 1.705.248 2.57.331v3.443a.75.75 0 001.28.53l3.58-3.579a.78.78 0 01.527-.224 41.202 41.202 0 005.183-.5c1.437-.232 2.43-1.49 2.43-2.903V5.426c0-1.413-.993-2.67-2.43-2.902A41.289 41.289 0 0010 2z" clipRule="evenodd" />
                </svg>
                {post.replyCount}
              </span>
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path d="M1 8.25a1.25 1.25 0 112.5 0v7.5a1.25 1.25 0 11-2.5 0v-7.5zM11 3V1.7c0-.268.14-.526.395-.607A2 2 0 0114 3c0 .995-.182 1.948-.514 2.826-.204.54.166 1.174.744 1.174h2.52c1.243 0 2.261 1.01 2.146 2.247a23.864 23.864 0 01-1.341 5.974C17.153 16.323 16.072 17 14.9 17h-3.192a3 3 0 01-1.341-.317l-2.734-1.366A3 3 0 006.292 15H5V8h1.292c.86 0 1.693-.292 2.36-.824l2.369-1.893A2.5 2.5 0 0011 3z" />
                </svg>
                {post.helpfulCount}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default PostCard;
