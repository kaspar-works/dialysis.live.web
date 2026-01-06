import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { ICONS } from '../constants';
import { SymptomType } from '../types';
import { createSymptomLog, getSymptomLogs, getSymptomTypes, SymptomLog, SymptomTypeConfig } from '../services/symptoms';
import { SubscriptionLimitError } from '../services/auth';

// Color to gradient mapping
const colorToGradient: Record<string, string> = {
  '#f43f5e': 'from-rose-500 to-red-500',
  '#10b981': 'from-emerald-500 to-green-500',
  '#a855f7': 'from-purple-500 to-violet-500',
  '#f59e0b': 'from-amber-500 to-yellow-500',
  '#6366f1': 'from-indigo-500 to-blue-500',
  '#0ea5e9': 'from-sky-500 to-cyan-500',
  '#ec4899': 'from-pink-500 to-rose-500',
  '#ef4444': 'from-red-500 to-rose-600',
  '#8b5cf6': 'from-violet-500 to-purple-500',
  '#f97316': 'from-orange-500 to-amber-500',
  '#14b8a6': 'from-teal-500 to-emerald-500',
  '#7c3aed': 'from-violet-600 to-indigo-600',
  '#64748b': 'from-slate-500 to-gray-500',
};

// Helper to get gradient from color
const getGradient = (color: string): string => colorToGradient[color] || 'from-slate-500 to-gray-500';

const severityLabels = ['', 'Mild', 'Light', 'Moderate', 'Strong', 'Severe'];
const severityEmojis = ['', '😊', '😐', '😕', '😣', '😫'];

const Symptoms: React.FC = () => {
  const [symptoms, setSymptoms] = useState<SymptomLog[]>([]);
  const [symptomTypes, setSymptomTypes] = useState<SymptomTypeConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedSymptom, setSelectedSymptom] = useState<SymptomType | null>(null);
  const [severity, setSeverity] = useState(3);
  const [isLogging, setIsLogging] = useState(false);
  const [showAllSymptoms, setShowAllSymptoms] = useState(false);
  const [recentlyAdded, setRecentlyAdded] = useState<string | null>(null);
  const [limitError, setLimitError] = useState<{ message: string; limit?: number } | null>(null);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [logsResponse, typesResponse] = await Promise.all([
        getSymptomLogs({ limit: 100 }),
        getSymptomTypes(),
      ]);
      setSymptoms(logsResponse.logs);
      setSymptomTypes(typesResponse);
    } catch (err) {
      console.error('Failed to fetch symptoms:', err);
      setError('Failed to load symptoms');
    } finally {
      setIsLoading(false);
    }
  };

  // Create a config lookup from API data
  const symptomConfig = useMemo(() => {
    const config: Record<SymptomType, { label: string; icon: string; color: string; gradient: string }> = {} as any;
    symptomTypes.forEach(st => {
      config[st.type] = {
        label: st.label,
        icon: st.icon,
        color: st.color,
        gradient: getGradient(st.color),
      };
    });
    return config;
  }, [symptomTypes]);

  const handleQuickLog = async (type: SymptomType, sev: number) => {
    setIsLogging(true);
    try {
      const newSymptom = await createSymptomLog({
        symptomType: type,
        severity: sev,
        loggedAt: new Date().toISOString(),
      });
      setSymptoms(prev => [newSymptom, ...prev]);
      setRecentlyAdded(newSymptom._id);
      setTimeout(() => setRecentlyAdded(null), 3000);

      const config = symptomConfig[type];
      setSuccessMessage(`${config.icon} ${config.label} logged`);
      setTimeout(() => setSuccessMessage(null), 3000);

      setSelectedSymptom(null);
      setSeverity(3);
    } catch (err) {
      if (err instanceof SubscriptionLimitError) {
        setLimitError({ message: err.message, limit: err.limit });
        setSelectedSymptom(null);
      } else {
        console.error('Failed to log symptom:', err);
        setError('Failed to log symptom');
      }
    } finally {
      setIsLogging(false);
    }
  };

  // Today's symptoms
  const todaySymptoms = useMemo(() => {
    const today = new Date().toDateString();
    return symptoms.filter(s => new Date(s.loggedAt).toDateString() === today);
  }, [symptoms]);

  // Symptom counts
  const symptomCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    symptoms.forEach(s => {
      counts[s.symptomType] = (counts[s.symptomType] || 0) + 1;
    });
    return counts;
  }, [symptoms]);

  // Top symptoms (most logged)
  const topSymptoms = useMemo(() => {
    return Object.entries(symptomCounts)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 4)
      .map(([type]) => type as SymptomType);
  }, [symptomCounts]);

  // Weekly data for mini chart
  const weeklyData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const weekData = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toDateString();
      const daySymptoms = symptoms.filter(s => new Date(s.loggedAt).toDateString() === dateStr);
      const avgSeverity = daySymptoms.length > 0
        ? daySymptoms.reduce((sum, s) => sum + s.severity, 0) / daySymptoms.length
        : 0;

      weekData.push({
        day: days[date.getDay()],
        count: daySymptoms.length,
        avgSeverity: avgSeverity,
        isToday: i === 0,
      });
    }
    return weekData;
  }, [symptoms]);

  // Wellness score (inverse of symptoms)
  const wellnessScore = useMemo(() => {
    const todayAvgSeverity = todaySymptoms.length > 0
      ? todaySymptoms.reduce((sum, s) => sum + s.severity, 0) / todaySymptoms.length
      : 0;
    // Score from 100 (no symptoms) to 0 (severe symptoms)
    if (todaySymptoms.length === 0) return 100;
    return Math.max(0, Math.round(100 - (todayAvgSeverity * 15) - (todaySymptoms.length * 5)));
  }, [todaySymptoms]);

  // Group history by date
  const groupedHistory = useMemo(() => {
    const groups: Record<string, SymptomLog[]> = {};
    symptoms.slice(0, 50).forEach(s => {
      const date = new Date(s.loggedAt).toDateString();
      if (!groups[date]) groups[date] = [];
      groups[date].push(s);
    });
    return Object.entries(groups).slice(0, 7);
  }, [symptoms]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 relative mx-auto">
            <div className="absolute inset-0 border-4 border-violet-500/20 rounded-full" />
            <div className="absolute inset-0 border-4 border-transparent border-t-violet-500 rounded-full animate-spin" />
            <div className="absolute inset-3 bg-gradient-to-br from-violet-500 to-purple-500 rounded-full flex items-center justify-center text-xl">
              🩺
            </div>
          </div>
          <p className="text-slate-400 text-sm font-medium">Loading symptom data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24 px-4 animate-in fade-in duration-500">
      {/* CSS Animations */}
      <style>{`
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(139, 92, 246, 0.3); }
          50% { box-shadow: 0 0 40px rgba(139, 92, 246, 0.5); }
        }
        @keyframes bounce-in {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.05); }
          70% { transform: scale(0.9); }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
        .animate-bounce-in { animation: bounce-in 0.5s ease-out; }
        .recently-added { animation: highlight 2s ease-out; }
        @keyframes highlight {
          0% { background-color: rgba(139, 92, 246, 0.2); }
          100% { background-color: transparent; }
        }
      `}</style>

      {/* Success Toast */}
      {successMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top fade-in duration-300">
          <div className="bg-gradient-to-r from-violet-500 to-purple-500 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="font-bold">{successMessage}</span>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-center justify-between">
          <p className="text-rose-500 font-medium">{error}</p>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-600">
            <ICONS.X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Subscription Limit Banner */}
      {limitError && (
        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">⚠️</span>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-amber-700 dark:text-amber-400 text-lg">Plan Limit Reached</h3>
              <p className="text-amber-600 dark:text-amber-500 mt-1">{limitError.message}</p>
              <div className="flex items-center gap-3 mt-4">
                <Link
                  to="/pricing"
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold text-sm hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg shadow-amber-500/20"
                >
                  Upgrade Plan
                </Link>
                <button
                  onClick={() => setLimitError(null)}
                  className="px-4 py-2.5 text-amber-600 dark:text-amber-400 font-medium text-sm hover:bg-amber-500/10 rounded-xl transition-all"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hero Card */}
      <div className="bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-600 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Left: Wellness Ring */}
            <div className="relative">
              <div className="w-40 h-40 relative animate-pulse-glow rounded-full">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    fill="none"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="10"
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    fill="none"
                    stroke="white"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${wellnessScore * 4.4} 440`}
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                  <span className="text-4xl font-black">{wellnessScore}</span>
                  <span className="text-white/60 text-xs font-medium">Wellness</span>
                </div>
              </div>
            </div>

            {/* Right: Status & Quick Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-black text-white mb-2">
                {wellnessScore >= 80 ? 'Feeling Great!' :
                 wellnessScore >= 60 ? 'Doing Okay' :
                 wellnessScore >= 40 ? 'Not So Good' : 'Rough Day'}
              </h1>
              <p className="text-white/70 text-lg mb-6">
                {todaySymptoms.length === 0
                  ? 'No symptoms logged today'
                  : `${todaySymptoms.length} symptom${todaySymptoms.length > 1 ? 's' : ''} logged today`}
              </p>

              {/* Mini Week Chart */}
              <div className="flex items-end gap-2 justify-center md:justify-start">
                {weeklyData.map((day, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div
                      className={`w-8 rounded-t-lg transition-all ${day.isToday ? 'bg-white' : 'bg-white/30'}`}
                      style={{ height: `${Math.max(8, day.count * 12)}px` }}
                    />
                    <span className={`text-[10px] font-bold ${day.isToday ? 'text-white' : 'text-white/50'}`}>
                      {day.day}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Today's Pills */}
          {todaySymptoms.length > 0 && (
            <div className="mt-6 pt-6 border-t border-white/10">
              <p className="text-white/60 text-xs font-bold uppercase tracking-wider mb-3">Today's Symptoms</p>
              <div className="flex flex-wrap gap-2">
                {todaySymptoms.map(symptom => {
                  const config = symptomConfig[symptom.symptomType];
                  return (
                    <div
                      key={symptom._id}
                      className="bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2 flex items-center gap-2"
                    >
                      <span className="text-lg">{config?.icon}</span>
                      <span className="text-white text-sm font-bold">{config?.label}</span>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map(i => (
                          <div
                            key={i}
                            className={`w-1 h-3 rounded-full ${i <= symptom.severity ? 'bg-white' : 'bg-white/20'}`}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Severity Selector Modal */}
      {selectedSymptom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-8 max-w-md w-full shadow-2xl animate-bounce-in">
            <div className="text-center space-y-6">
              {/* Symptom Header */}
              <div className="flex items-center justify-center gap-3">
                <div
                  className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${symptomConfig[selectedSymptom].gradient} flex items-center justify-center text-3xl shadow-lg`}
                >
                  {symptomConfig[selectedSymptom].icon}
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                {symptomConfig[selectedSymptom].label}
              </h3>

              <p className="text-slate-400">How severe is it?</p>

              {/* Severity Display */}
              <div className="py-4">
                <div className="text-6xl mb-2">{severityEmojis[severity]}</div>
                <div
                  className="text-lg font-black"
                  style={{ color: symptomConfig[selectedSymptom].color }}
                >
                  {severityLabels[severity]}
                </div>
              </div>

              {/* Severity Slider */}
              <div className="space-y-4">
                <div className="flex justify-between gap-2">
                  {[1, 2, 3, 4, 5].map(level => (
                    <button
                      key={level}
                      onClick={() => setSeverity(level)}
                      className={`flex-1 h-16 rounded-xl font-black text-xl transition-all ${
                        severity === level
                          ? 'scale-110 shadow-xl text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                      }`}
                      style={{
                        backgroundColor: severity === level ? symptomConfig[selectedSymptom].color : undefined,
                      }}
                    >
                      {level}
                    </button>
                  ))}
                </div>

                {/* Severity bar */}
                <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${severity * 20}%`,
                      backgroundColor: symptomConfig[selectedSymptom].color,
                    }}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setSelectedSymptom(null)}
                  className="flex-1 py-4 bg-slate-100 dark:bg-slate-700 rounded-2xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleQuickLog(selectedSymptom, severity)}
                  disabled={isLogging}
                  className={`flex-1 py-4 rounded-2xl font-bold text-white transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg bg-gradient-to-r ${symptomConfig[selectedSymptom].gradient}`}
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
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Log Section */}
      {topSymptoms.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 border border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black text-slate-900 dark:text-white">Quick Log</h2>
            <span className="text-xs text-slate-400">Your most logged symptoms</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {topSymptoms.map(type => {
              const config = symptomConfig[type];
              return (
                <button
                  key={type}
                  onClick={() => setSelectedSymptom(type)}
                  className="flex items-center gap-3 px-5 py-3 bg-slate-50 dark:bg-slate-700/50 rounded-2xl hover:scale-105 hover:shadow-lg transition-all group"
                >
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center text-xl group-hover:scale-110 transition-transform shadow-lg`}
                  >
                    {config.icon}
                  </div>
                  <div className="text-left">
                    <span className="font-bold text-slate-700 dark:text-slate-200 block">{config.label}</span>
                    <span className="text-xs text-slate-400">{symptomCounts[type]}x logged</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* All Symptoms Grid */}
      <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 border border-slate-100 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-slate-900 dark:text-white">All Symptoms</h2>
          <button
            onClick={() => setShowAllSymptoms(!showAllSymptoms)}
            className="text-xs font-bold text-violet-500 hover:text-violet-600"
          >
            {showAllSymptoms ? 'Show Less' : 'Show All'}
          </button>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {(showAllSymptoms ? symptomTypes : symptomTypes.slice(0, 10)).map(st => {
            const config = symptomConfig[st.type];
            return (
              <button
                key={st.type}
                onClick={() => setSelectedSymptom(st.type)}
                className="group relative bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-4 hover:shadow-xl hover:scale-105 hover:-translate-y-1 transition-all duration-300"
              >
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br"
                  style={{
                    backgroundImage: `linear-gradient(to bottom right, ${st.color}15, ${st.color}05)`,
                  }}
                />
                <div className="relative text-center space-y-2">
                  <span className="text-3xl block group-hover:scale-125 transition-transform duration-300">
                    {st.icon}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    {st.label}
                  </span>
                </div>
                {symptomCounts[st.type] && (
                  <div
                    className={`absolute -top-2 -right-2 w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center shadow-lg bg-gradient-to-br ${config?.gradient || 'from-slate-500 to-gray-500'}`}
                  >
                    {symptomCounts[st.type]}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Logged */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 group hover:border-violet-200 dark:hover:border-violet-800 transition-all">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Logged</p>
            <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-lg">📊</span>
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white">{symptoms.length}</p>
          <p className="text-xs text-slate-400 mt-1">all time</p>
        </div>

        {/* Today */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 group hover:border-amber-200 dark:hover:border-amber-800 transition-all">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Today</p>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-lg">📅</span>
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white">{todaySymptoms.length}</p>
          <p className="text-xs text-slate-400 mt-1">symptoms</p>
        </div>

        {/* Avg Severity */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 group hover:border-rose-200 dark:hover:border-rose-800 transition-all">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Severity</p>
            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-lg">📈</span>
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white">
            {symptoms.length > 0
              ? (symptoms.reduce((sum, s) => sum + s.severity, 0) / symptoms.length).toFixed(1)
              : '—'}
          </p>
          <p className="text-xs text-slate-400 mt-1">out of 5</p>
        </div>

        {/* Types Tracked */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 group hover:border-emerald-200 dark:hover:border-emerald-800 transition-all">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Types</p>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-lg">🏷️</span>
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white">{Object.keys(symptomCounts).length}</p>
          <p className="text-xs text-slate-400 mt-1">different</p>
        </div>
      </div>

      {/* History Section */}
      <div className="bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Recent History</h2>
          <p className="text-sm text-slate-400">Your symptom log by day</p>
        </div>

        {groupedHistory.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {groupedHistory.map(([date, daySymptoms]) => {
              const isToday = date === new Date().toDateString();
              const dateLabel = isToday
                ? 'Today'
                : new Date(date).toLocaleDateString(undefined, {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric',
                  });

              return (
                <div key={date} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-sm font-bold ${isToday ? 'text-violet-500' : 'text-slate-500'}`}>
                      {dateLabel}
                    </span>
                    <span className="text-xs text-slate-400">{daySymptoms.length} logged</span>
                  </div>
                  <div className="space-y-2">
                    {daySymptoms.map(symptom => {
                      const config = symptomConfig[symptom.symptomType];
                      return (
                        <div
                          key={symptom._id}
                          className={`flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl transition-all ${
                            recentlyAdded === symptom._id ? 'recently-added' : ''
                          }`}
                        >
                          <div
                            className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config?.gradient} flex items-center justify-center text-lg shrink-0 shadow`}
                          >
                            {config?.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-900 dark:text-white text-sm">
                              {config?.label}
                            </p>
                            <p className="text-xs text-slate-400">
                              {new Date(symptom.loggedAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map(i => (
                                <div
                                  key={i}
                                  className="w-1.5 h-5 rounded-full transition-all"
                                  style={{
                                    backgroundColor: i <= symptom.severity ? config?.color : undefined,
                                  }}
                                />
                              ))}
                            </div>
                            <span
                              className="text-xs font-bold px-2 py-1 rounded-lg"
                              style={{
                                backgroundColor: `${config?.color}15`,
                                color: config?.color,
                              }}
                            >
                              {severityLabels[symptom.severity]}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-4 text-4xl">
              🌟
            </div>
            <p className="text-slate-500 font-medium">No symptoms logged yet</p>
            <p className="text-slate-400 text-sm">Tap any symptom above to start tracking</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Symptoms;
