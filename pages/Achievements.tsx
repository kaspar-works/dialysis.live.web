import React, { useState, useEffect, useRef } from 'react';
import { getAchievements, AchievementsResponse, Achievement } from '../services/dashboard';

const TIER_COLORS: Record<string, string> = {
  bronze: '#cd7f32',
  silver: '#94a3b8',
  gold: '#f59e0b',
  platinum: '#6366f1',
};

const ICON_MAP: Record<string, string> = {
  'drop.fill': '💧',
  'scalemass.fill': '⚖️',
  'flame.fill': '🔥',
  'pills.fill': '💊',
  'star.fill': '⭐',
};

const Achievements: React.FC = () => {
  const [data, setData] = useState<AchievementsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchData = async () => {
      try {
        const result = await getAchievements();
        setData(result);
      } catch (err) {
        setError('Failed to load achievements');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-sky-500/30 border-t-sky-500 rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 text-sm">Loading achievements...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-4">
          <p className="text-red-400">{error}</p>
          <button
            onClick={() => { hasFetched.current = false; setError(null); setIsLoading(true); }}
            className="px-4 py-2 bg-sky-500 text-white rounded-lg text-sm font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const earned = data?.achievements.filter(a => a.earned) || [];
  const inProgress = data?.achievements.filter(a => !a.earned) || [];
  const score = data?.recoveryScore ?? 0;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Recovery Score */}
      <div className="bg-white dark:bg-white/5 rounded-2xl p-6 sm:p-8 border border-slate-100 dark:border-white/10 shadow-sm">
        <div className="flex flex-col items-center text-center space-y-4">
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Recovery Score</p>

          {/* Score Ring */}
          <div className="relative w-28 h-28">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8"
                className="text-slate-100 dark:text-white/10" />
              <circle cx="50" cy="50" r="42" fill="none" strokeWidth="8" strokeLinecap="round"
                stroke={score >= 85 ? '#22c55e' : score >= 70 ? '#3b82f6' : score >= 50 ? '#f59e0b' : '#ef4444'}
                strokeDasharray={`${score * 2.64} 264`} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-slate-900 dark:text-white">{score}</span>
              <span className="text-xs text-slate-400 dark:text-slate-500">/100</span>
            </div>
          </div>

          <p className="text-sm text-slate-500 dark:text-slate-400">
            {score >= 85 ? 'Excellent recovery management!' :
             score >= 70 ? 'Good progress — keep it up!' :
             score >= 50 ? 'Room for improvement' :
             'Focus on hydration and weight goals'}
          </p>

          {/* Breakdown */}
          <div className="flex gap-6 sm:gap-10 pt-2">
            <div className="text-center">
              <span className="text-xl">💧</span>
              <p className="text-xs font-bold text-slate-900 dark:text-white mt-1">Hydration</p>
              <p className="text-[10px] text-slate-400">40%</p>
            </div>
            <div className="text-center">
              <span className="text-xl">⚖️</span>
              <p className="text-xs font-bold text-slate-900 dark:text-white mt-1">Weight</p>
              <p className="text-[10px] text-slate-400">35%</p>
            </div>
            <div className="text-center">
              <span className="text-xl">💊</span>
              <p className="text-xs font-bold text-slate-900 dark:text-white mt-1">Meds</p>
              <p className="text-[10px] text-slate-400">25%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Earned Badges */}
      {earned.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-black text-slate-900 dark:text-white">Earned Badges</h2>
          <div className="space-y-3">
            {earned.map(a => (
              <AchievementCard key={a.id} achievement={a} />
            ))}
          </div>
        </div>
      )}

      {/* In Progress */}
      {inProgress.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-black text-slate-900 dark:text-white">In Progress</h2>
          <div className="space-y-3">
            {inProgress.map(a => (
              <AchievementCard key={a.id} achievement={a} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const AchievementCard: React.FC<{ achievement: Achievement }> = ({ achievement }) => {
  const emoji = ICON_MAP[achievement.icon] || '🏆';
  const tierColor = achievement.tier ? TIER_COLORS[achievement.tier] || '#64748b' : '#64748b';

  return (
    <div className="bg-white dark:bg-white/5 rounded-xl p-4 sm:p-5 border border-slate-100 dark:border-white/10 shadow-sm flex items-start gap-4">
      {/* Icon */}
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-2xl"
        style={{ backgroundColor: achievement.earned ? `${tierColor}20` : 'rgba(148,163,184,0.1)' }}
      >
        {emoji}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-sm text-slate-900 dark:text-white">{achievement.name}</span>
          {achievement.earned && (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill={tierColor}>
              <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
          )}
          {achievement.tier && (
            <span
              className="text-[10px] font-bold uppercase px-2 py-0.5 rounded"
              style={{ color: tierColor, backgroundColor: `${tierColor}15` }}
            >
              {achievement.tier}
            </span>
          )}
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{achievement.description}</p>

        {!achievement.earned && (
          <div className="mt-2 space-y-1">
            <div className="w-full h-1.5 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-sky-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.round(achievement.progress * 100)}%` }}
              />
            </div>
            {achievement.currentValue != null && achievement.targetValue != null && (
              <p className="text-[10px] text-slate-400">{achievement.currentValue}/{achievement.targetValue}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Achievements;
