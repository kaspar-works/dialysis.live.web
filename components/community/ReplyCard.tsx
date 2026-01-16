import React from 'react';
import { ForumReply, CommunityProfile } from '../../services/community';
import DisplayNameBadge from './DisplayNameBadge';

interface ReplyCardProps {
  reply: ForumReply;
  isPostAuthor?: boolean;
  onMarkHelpful?: () => void;
  onAcceptAnswer?: () => void;
  canAcceptAnswer?: boolean;
  onReport?: () => void;
}

const ReplyCard: React.FC<ReplyCardProps> = ({
  reply,
  isPostAuthor = false,
  onMarkHelpful,
  onAcceptAnswer,
  canAcceptAnswer = false,
  onReport,
}) => {
  const author = typeof reply.authorId === 'object' ? reply.authorId as CommunityProfile : null;
  const createdAt = new Date(reply.createdAt);
  const timeAgo = getTimeAgo(createdAt);

  return (
    <div
      className={`rounded-xl border p-4 ${
        reply.isAcceptedAnswer
          ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30'
          : reply.isHCPResponse
          ? 'bg-sky-50 dark:bg-sky-500/10 border-sky-200 dark:border-sky-500/30'
          : 'bg-white dark:bg-slate-900/50 border-slate-100 dark:border-white/5'
      }`}
    >
      {reply.isAcceptedAnswer && (
        <div className="flex items-center gap-2 mb-3 text-emerald-600 dark:text-emerald-400">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
          </svg>
          <span className="font-semibold text-sm">Accepted Answer</span>
        </div>
      )}

      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {author && <DisplayNameBadge profile={author} size="sm" linkToProfile />}
          <span className="text-slate-300 dark:text-slate-600">·</span>
          <span className="text-sm text-slate-500 dark:text-slate-400">{timeAgo}</span>
          {reply.isEdited && (
            <>
              <span className="text-slate-300 dark:text-slate-600">·</span>
              <span className="text-xs text-slate-400 dark:text-slate-500 italic">edited</span>
            </>
          )}
        </div>

        {reply.isHCPResponse && !reply.isAcceptedAnswer && (
          <span className="text-xs font-semibold text-sky-600 dark:text-sky-400 bg-sky-100 dark:bg-sky-500/20 px-2 py-0.5 rounded-full">
            Healthcare Professional
          </span>
        )}
      </div>

      <div className="prose prose-slate dark:prose-invert prose-sm max-w-none mb-4">
        <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{reply.content}</p>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onMarkHelpful}
            className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M1 8.25a1.25 1.25 0 112.5 0v7.5a1.25 1.25 0 11-2.5 0v-7.5zM11 3V1.7c0-.268.14-.526.395-.607A2 2 0 0114 3c0 .995-.182 1.948-.514 2.826-.204.54.166 1.174.744 1.174h2.52c1.243 0 2.261 1.01 2.146 2.247a23.864 23.864 0 01-1.341 5.974C17.153 16.323 16.072 17 14.9 17h-3.192a3 3 0 01-1.341-.317l-2.734-1.366A3 3 0 006.292 15H5V8h1.292c.86 0 1.693-.292 2.36-.824l2.369-1.893A2.5 2.5 0 0011 3z" />
            </svg>
            <span>{reply.helpfulCount > 0 ? reply.helpfulCount : ''} Helpful</span>
          </button>

          {canAcceptAnswer && !reply.isAcceptedAnswer && (
            <button
              onClick={onAcceptAnswer}
              className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
              <span>Accept Answer</span>
            </button>
          )}
        </div>

        <button
          onClick={onReport}
          className="text-sm text-slate-400 hover:text-red-500 transition-colors"
        >
          Report
        </button>
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

export default ReplyCard;
