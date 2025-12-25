import React, { useState, useMemo, useEffect } from 'react';
import { ICONS } from '../constants';
import { SymptomType } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { createSymptomLog, getSymptomLogs, SymptomLog } from '../services/symptoms';
import { isAuthenticated } from '../services/auth';
import { useNavigate } from 'react-router-dom';

const symptomConfig: Record<SymptomType, { label: string; icon: string; color: string; gradient: string }> = {
  [SymptomType.CRAMPING]: {
    label: 'Cramping',
    icon: '💪',
    color: 'rose',
    gradient: 'from-rose-500 to-red-500',
  },
  [SymptomType.NAUSEA]: {
    label: 'Nausea',
    icon: '🤢',
    color: 'emerald',
    gradient: 'from-emerald-500 to-green-500',
  },
  [SymptomType.HEADACHE]: {
    label: 'Headache',
    icon: '🤕',
    color: 'purple',
    gradient: 'from-purple-500 to-violet-500',
  },
  [SymptomType.DIZZINESS]: {
    label: 'Dizziness',
    icon: '😵‍💫',
    color: 'amber',
    gradient: 'from-amber-500 to-orange-500',
  },
  [SymptomType.FATIGUE]: {
    label: 'Fatigue',
    icon: '😴',
    color: 'slate',
    gradient: 'from-slate-500 to-gray-500',
  },
  [SymptomType.SHORTNESS_OF_BREATH]: {
    label: 'Short of Breath',
    icon: '😮‍💨',
    color: 'sky',
    gradient: 'from-sky-500 to-blue-500',
  },
  [SymptomType.ITCHING]: {
    label: 'Itching',
    icon: '🫳',
    color: 'pink',
    gradient: 'from-pink-500 to-rose-500',
  },
  [SymptomType.CHEST_PAIN]: {
    label: 'Chest Pain',
    icon: '💔',
    color: 'red',
    gradient: 'from-red-500 to-rose-600',
  },
  [SymptomType.LOW_BP]: {
    label: 'Low BP',
    icon: '📉',
    color: 'indigo',
    gradient: 'from-indigo-500 to-purple-500',
  },
  [SymptomType.MUSCLE_WEAKNESS]: {
    label: 'Weakness',
    icon: '🦵',
    color: 'orange',
    gradient: 'from-orange-500 to-amber-500',
  },
  [SymptomType.RESTLESS_LEGS]: {
    label: 'Restless Legs',
    icon: '🦶',
    color: 'teal',
    gradient: 'from-teal-500 to-cyan-500',
  },
  [SymptomType.INSOMNIA]: {
    label: 'Insomnia',
    icon: '🌙',
    color: 'violet',
    gradient: 'from-violet-500 to-indigo-500',
  },
  [SymptomType.OTHER]: {
    label: 'Other',
    icon: '📝',
    color: 'gray',
    gradient: 'from-gray-500 to-slate-500',
  },
};

const severityLabels = ['', 'Mild', 'Low', 'Moderate', 'High', 'Severe'];
const severityColors = ['', 'emerald', 'lime', 'amber', 'orange', 'rose'];

const Symptoms: React.FC = () => {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<SymptomType>(SymptomType.CRAMPING);
  const [severity, setSeverity] = useState<number>(3);
  const [notes, setNotes] = useState<string>('');
  const [isLogging, setIsLogging] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [symptoms, setSymptoms] = useState<SymptomLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<SymptomType | 'all'>('all');

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    fetchSymptoms();
  }, [navigate]);

  const fetchSymptoms = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getSymptomLogs({ limit: 100 });
      setSymptoms(response.logs);
    } catch (err) {
      console.error('Failed to fetch symptoms:', err);
      setError('Failed to load symptoms');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSymptom = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLogging(true);
    setError(null);

    try {
      const newSymptom = await createSymptomLog({
        symptomType: selectedType,
        severity,
        loggedAt: new Date().toISOString(),
        notes: notes.trim() || undefined,
      });

      setSymptoms(prev => [newSymptom, ...prev]);
      setShowForm(false);
      setNotes('');
      setSeverity(3);
    } catch (err) {
      console.error('Failed to add symptom:', err);
      setError('Failed to add symptom');
    } finally {
      setIsLogging(false);
    }
  };

  const filteredSymptoms = useMemo(() => {
    if (filterType === 'all') return symptoms;
    return symptoms.filter(s => s.symptomType === filterType);
  }, [symptoms, filterType]);

  const symptomStats = useMemo(() => {
    const stats: Record<string, { count: number; avgSeverity: number }> = {};
    symptoms.forEach(s => {
      if (!stats[s.symptomType]) {
        stats[s.symptomType] = { count: 0, avgSeverity: 0 };
      }
      stats[s.symptomType].count++;
      stats[s.symptomType].avgSeverity += s.severity;
    });
    Object.keys(stats).forEach(key => {
      stats[key].avgSeverity = Math.round((stats[key].avgSeverity / stats[key].count) * 10) / 10;
    });
    return stats;
  }, [symptoms]);

  const chartData = useMemo(() => {
    return Object.entries(symptomStats)
      .map(([type, data]) => ({
        name: symptomConfig[type as SymptomType]?.label || type,
        count: data.count,
        severity: data.avgSeverity,
        type,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [symptomStats]);

  const recentSymptomTypes = useMemo(() => {
    const seen = new Set<SymptomType>();
    return symptoms.filter(s => {
      if (seen.has(s.symptomType)) return false;
      seen.add(s.symptomType);
      return true;
    }).slice(0, 4);
  }, [symptoms]);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500 pb-24 px-4">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <span className="px-3 py-1 bg-purple-500/10 text-purple-500 text-[10px] font-bold uppercase tracking-wider rounded-full">
            Tracking
          </span>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight mt-2">
            Symptoms
          </h1>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-lg ${
            showForm
              ? 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rotate-45'
              : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-purple-500 dark:hover:bg-purple-500 dark:hover:text-white'
          }`}
        >
          <ICONS.Plus className="w-6 h-6" />
        </button>
      </header>

      {/* Error Display */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-center justify-between">
          <p className="text-rose-500 font-medium">{error}</p>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-600">
            <ICONS.X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Add Symptom Form */}
      {showForm && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 animate-in slide-in-from-top duration-300 shadow-xl">
          <form onSubmit={handleAddSymptom} className="space-y-6">
            {/* Symptom Type Grid */}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 block">
                What are you experiencing?
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                {Object.entries(symptomConfig).map(([type, config]) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSelectedType(type as SymptomType)}
                    className={`p-3 rounded-2xl text-center transition-all ${
                      selectedType === type
                        ? `bg-gradient-to-br ${config.gradient} text-white shadow-lg scale-105`
                        : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    <span className="text-2xl block mb-1">{config.icon}</span>
                    <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wide line-clamp-1">
                      {config.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Severity Selector */}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 block">
                Severity Level
              </label>
              <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-6">
                <div className="flex items-center justify-between gap-2 mb-4">
                  {[1, 2, 3, 4, 5].map(level => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setSeverity(level)}
                      className={`flex-1 h-14 rounded-xl font-black text-lg transition-all ${
                        severity === level
                          ? `bg-${severityColors[level]}-500 text-white shadow-lg scale-110`
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-600'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-xs font-medium text-slate-400">
                  <span>Mild</span>
                  <span className="font-bold text-slate-600 dark:text-slate-300">
                    {severityLabels[severity]}
                  </span>
                  <span>Severe</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 block">
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Any additional details..."
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 resize-none h-20 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLogging}
              className={`w-full py-4 rounded-2xl font-bold text-white transition-all bg-gradient-to-r ${symptomConfig[selectedType].gradient} hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg`}
            >
              {isLogging ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <ICONS.Plus className="w-5 h-5" />
                  Log Symptom
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="py-12 text-center">
          <div className="w-8 h-8 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mx-auto" />
        </div>
      ) : (
        <>
          {/* Quick Stats */}
          {recentSymptomTypes.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {recentSymptomTypes.map(symptom => {
                const config = symptomConfig[symptom.symptomType];
                const stat = symptomStats[symptom.symptomType];
                return (
                  <div
                    key={symptom._id}
                    className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-100 dark:border-slate-700 hover:shadow-lg transition-all group"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-3xl group-hover:scale-110 transition-transform">
                        {config.icon}
                      </span>
                      <span className={`px-2 py-1 text-[9px] font-bold uppercase rounded-lg bg-${severityColors[Math.round(stat?.avgSeverity || 3)]}-100 dark:bg-${severityColors[Math.round(stat?.avgSeverity || 3)]}-500/20 text-${severityColors[Math.round(stat?.avgSeverity || 3)]}-600 dark:text-${severityColors[Math.round(stat?.avgSeverity || 3)]}-400`}>
                        {severityLabels[Math.round(stat?.avgSeverity || 3)]}
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs font-medium mb-1">{config.label}</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-slate-900 dark:text-white">
                        {stat?.count || 0}
                      </span>
                      <span className="text-xs text-slate-400">occurrences</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Chart */}
          {chartData.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    Symptom Frequency
                  </h3>
                  <p className="text-slate-400 text-sm">Most common symptoms</p>
                </div>
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical">
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                      width={80}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '12px',
                        border: 'none',
                        backgroundColor: '#1e293b',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                      formatter={(value: number) => [`${value} times`, 'Occurrences']}
                    />
                    <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={`url(#gradient-${entry.type})`}
                        />
                      ))}
                    </Bar>
                    <defs>
                      {chartData.map(entry => {
                        const config = symptomConfig[entry.type as SymptomType];
                        return (
                          <linearGradient key={entry.type} id={`gradient-${entry.type}`} x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor={getGradientColor(config.gradient, 'start')} />
                            <stop offset="100%" stopColor={getGradientColor(config.gradient, 'end')} />
                          </linearGradient>
                        );
                      })}
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                filterType === 'all'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              All
            </button>
            {Object.entries(symptomConfig).slice(0, 6).map(([type, config]) => (
              <button
                key={type}
                onClick={() => setFilterType(type as SymptomType)}
                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all flex items-center gap-2 ${
                  filterType === type
                    ? `bg-gradient-to-r ${config.gradient} text-white`
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>{config.icon}</span>
                {config.label}
              </button>
            ))}
          </div>

          {/* History */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">History</h3>
              <span className="text-sm text-slate-400">{filteredSymptoms.length} entries</span>
            </div>

            {filteredSymptoms.length > 0 ? (
              <div className="space-y-3">
                {filteredSymptoms.slice(0, 20).map(entry => {
                  const config = symptomConfig[entry.symptomType] || symptomConfig[SymptomType.OTHER];
                  return (
                    <div
                      key={entry._id}
                      className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 flex items-center gap-4 hover:shadow-md transition-all group"
                    >
                      <div
                        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center text-2xl shrink-0 group-hover:scale-110 transition-transform`}
                      >
                        {config.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-slate-900 dark:text-white">{config.label}</p>
                          <span
                            className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded bg-${severityColors[entry.severity]}-100 dark:bg-${severityColors[entry.severity]}-500/20 text-${severityColors[entry.severity]}-600 dark:text-${severityColors[entry.severity]}-400`}
                          >
                            {severityLabels[entry.severity]}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">
                          {new Date(entry.loggedAt).toLocaleDateString([], {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                        {entry.notes && (
                          <p className="text-xs text-slate-500 mt-1 line-clamp-1">{entry.notes}</p>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map(i => (
                            <div
                              key={i}
                              className={`w-2 h-6 rounded-full transition-all ${
                                i <= entry.severity
                                  ? `bg-${severityColors[entry.severity]}-500`
                                  : 'bg-slate-200 dark:bg-slate-700'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-16 text-center">
                <div className="text-6xl mb-4">🩺</div>
                <p className="text-slate-400 font-medium">No symptoms recorded yet</p>
                <p className="text-slate-400 text-sm">Tap + to log how you're feeling</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// Helper to extract colors from gradient classes
function getGradientColor(gradient: string, position: 'start' | 'end'): string {
  const colorMap: Record<string, string> = {
    'rose': '#f43f5e',
    'red': '#ef4444',
    'pink': '#ec4899',
    'emerald': '#10b981',
    'green': '#22c55e',
    'purple': '#a855f7',
    'violet': '#8b5cf6',
    'amber': '#f59e0b',
    'orange': '#f97316',
    'slate': '#64748b',
    'gray': '#6b7280',
    'sky': '#0ea5e9',
    'blue': '#3b82f6',
    'indigo': '#6366f1',
    'teal': '#14b8a6',
    'cyan': '#06b6d4',
  };

  const match = gradient.match(position === 'start' ? /from-(\w+)-500/ : /to-(\w+)-\d+/);
  if (match) {
    return colorMap[match[1]] || '#6b7280';
  }
  return '#6b7280';
}

export default Symptoms;
