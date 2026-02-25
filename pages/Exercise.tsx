import React, { useState, useEffect, useRef } from 'react';
import { getExerciseStats, getExerciseLogs, createExerciseLog, deleteExerciseLog, ExerciseStats, ExerciseLog, ExerciseType } from '../services/exercise';

const EXERCISE_TYPES: { value: ExerciseType; label: string; icon: string }[] = [
  { value: 'walking', label: 'Walking', icon: '🚶' },
  { value: 'running', label: 'Running', icon: '🏃' },
  { value: 'cycling', label: 'Cycling', icon: '🚴' },
  { value: 'swimming', label: 'Swimming', icon: '🏊' },
  { value: 'other', label: 'Other', icon: '💪' },
];

export default function Exercise() {
  const [stats, setStats] = useState<ExerciseStats | null>(null);
  const [logs, setLogs] = useState<ExerciseLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    exerciseType: 'walking' as ExerciseType,
    durationMinutes: 30,
    steps: '',
    activeCalories: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsData, logsData] = await Promise.all([
        getExerciseStats().catch(() => null),
        getExerciseLogs({ limit: 20 }).catch(() => ({ logs: [], pagination: { total: 0, limit: 20, offset: 0 } })),
      ]);
      if (statsData) setStats(statsData);
      setLogs(logsData.logs);
    } catch (err) {
      console.error('Failed to load exercise data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createExerciseLog({
        exerciseType: formData.exerciseType,
        durationMinutes: formData.durationMinutes,
        steps: formData.steps ? parseInt(formData.steps) : undefined,
        activeCalories: formData.activeCalories ? parseFloat(formData.activeCalories) : undefined,
        notes: formData.notes || undefined,
      });
      setShowForm(false);
      setFormData({ exerciseType: 'walking', durationMinutes: 30, steps: '', activeCalories: '', notes: '' });
      hasFetched.current = false;
      setIsLoading(true);
      hasFetched.current = true;
      await loadData();
    } catch (err) {
      console.error('Failed to create exercise log:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (logId: string) => {
    if (!confirm('Delete this exercise log?')) return;
    try {
      await deleteExerciseLog(logId);
      setLogs(prev => prev.filter(l => l._id !== logId));
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  const maxSteps = Math.max(1, ...(stats?.history?.map(d => d.steps) || [1]));

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Exercise</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Track your physical activity</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl transition-colors"
        >
          {showForm ? 'Cancel' : '+ Log Exercise'}
        </button>
      </div>

      {/* Manual Entry Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-5 space-y-4 border border-slate-200 dark:border-slate-800">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Type</label>
              <select
                value={formData.exerciseType}
                onChange={e => setFormData(p => ({ ...p, exerciseType: e.target.value as ExerciseType }))}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
              >
                {EXERCISE_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Duration (min)</label>
              <input
                type="number"
                min="1"
                value={formData.durationMinutes}
                onChange={e => setFormData(p => ({ ...p, durationMinutes: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Steps (optional)</label>
              <input
                type="number"
                min="0"
                value={formData.steps}
                onChange={e => setFormData(p => ({ ...p, steps: e.target.value }))}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Calories (optional)</label>
              <input
                type="number"
                min="0"
                value={formData.activeCalories}
                onChange={e => setFormData(p => ({ ...p, activeCalories: e.target.value }))}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                placeholder="0"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Notes (optional)</label>
            <input
              type="text"
              value={formData.notes}
              onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
              placeholder="How did it go?"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors"
          >
            {isSubmitting ? 'Saving...' : 'Save Exercise'}
          </button>
        </form>
      )}

      {/* Today's Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Steps', value: stats?.todaySteps?.toLocaleString() || '0', icon: '🚶', color: 'emerald' },
          { label: 'Active Min', value: String(stats?.todayActiveMinutes || 0), icon: '⏱', color: 'amber' },
          { label: 'Calories', value: String(stats?.todayCalories || 0), icon: '🔥', color: 'red' },
        ].map(s => (
          <div key={s.label} className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 text-center border border-slate-200 dark:border-slate-800">
            <span className="text-xl">{s.icon}</span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{s.value}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Weekly averages */}
      <div className="flex items-center gap-6 text-xs text-slate-500 dark:text-slate-400">
        <span>Weekly avg: <strong className="text-slate-700 dark:text-slate-300">{stats?.weeklyAvgSteps?.toLocaleString() || 0}</strong> steps/day</span>
        <span>Weekly avg: <strong className="text-slate-700 dark:text-slate-300">{stats?.weeklyAvgActiveMinutes || 0}</strong> min/day</span>
      </div>

      {/* Weekly Bar Chart */}
      {stats?.history && stats.history.length > 0 && (
        <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800">
          <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">This Week</h3>
          <div className="flex items-end gap-2 h-32">
            {[...stats.history].reverse().map(day => (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{day.steps.toLocaleString()}</div>
                <div
                  className="w-full bg-emerald-500 rounded-t-md min-h-[4px] transition-all"
                  style={{ height: `${Math.max(4, (day.steps / maxSteps) * 100)}%` }}
                />
                <div className="text-[10px] text-slate-400 dark:text-slate-500">
                  {new Date(day.date + 'T00:00:00').toLocaleDateString('en', { weekday: 'short' })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Logs */}
      {logs.length > 0 && (
        <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800">
          <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Recent Workouts</h3>
          <div className="space-y-3">
            {logs.map(log => {
              const typeInfo = EXERCISE_TYPES.find(t => t.value === log.exerciseType) || EXERCISE_TYPES[4];
              return (
                <div key={log._id} className="flex items-center gap-3 py-2 border-b border-slate-200 dark:border-slate-800 last:border-0">
                  <span className="text-xl">{typeInfo.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-900 dark:text-white">{typeInfo.label}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {Math.round(log.durationMinutes)} min
                      {log.steps ? ` · ${log.steps.toLocaleString()} steps` : ''}
                      {log.activeCalories ? ` · ${Math.round(log.activeCalories)} kcal` : ''}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {new Date(log.loggedAt).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                    </div>
                    {log.source === 'apple_watch' && (
                      <span className="text-[10px] text-emerald-500 font-medium">Watch</span>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(log._id)}
                    className="text-slate-400 hover:text-red-500 transition-colors p-1"
                    title="Delete"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {logs.length === 0 && !stats?.todaySteps && (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">🏃</div>
          <p className="text-slate-500 dark:text-slate-400 text-sm">No exercise data yet. Log a workout or sync from Apple Watch.</p>
        </div>
      )}
    </div>
  );
}
