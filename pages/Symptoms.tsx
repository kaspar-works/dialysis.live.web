import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { ICONS } from '../constants';
import { SymptomType } from '../types';
import { createSymptomLog, getSymptomLogs, getSymptomTypes, SymptomLog, SymptomTypeConfig } from '../services/symptoms';
import { SubscriptionLimitError } from '../services/auth';
import { useSettings } from '../contexts/SettingsContext';

const severityLabels = ['', 'Mild', 'Light', 'Moderate', 'Strong', 'Severe'];

const Symptoms: React.FC = () => {
  const { displayShortDate, displayTime } = useSettings();
  const [symptoms, setSymptoms] = useState<SymptomLog[]>([]);
  const [symptomTypes, setSymptomTypes] = useState<SymptomTypeConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedSymptom, setSelectedSymptom] = useState<SymptomType | null>(null);
  const [severity, setSeverity] = useState<number | null>(null);
  const [isLogging, setIsLogging] = useState(false);
  const [showAllSymptoms, setShowAllSymptoms] = useState(false);
  const [recentlyAdded, setRecentlyAdded] = useState<string | null>(null);
  const [limitError, setLimitError] = useState<{ message: string; limit?: number } | null>(null);
  const hasFetched = useRef(false);
  const [severityError, setSeverityError] = useState<string>('');
  const [severityTouched, setSeverityTouched] = useState(false);

  const validateSeverity = (value: number | null): string => {
    if (value === null) return 'Please select a severity level';
    if (value < 1 || value > 5) return 'Severity must be between 1 and 5';
    return '';
  };

  const handleSeveritySelect = (level: number) => {
    setSeverity(level);
    setSeverityTouched(true);
    setSeverityError('');
  };

  const resetFormValidation = () => {
    setSeverity(null);
    setSeverityError('');
    setSeverityTouched(false);
  };

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

  const symptomConfig = useMemo(() => {
    const config: Record<SymptomType, { label: string; icon: string; color: string }> = {} as any;
    symptomTypes.forEach(st => {
      config[st.type] = { label: st.label, icon: st.icon, color: st.color };
    });
    return config;
  }, [symptomTypes]);

  const handleQuickLog = async (type: SymptomType) => {
    setSeverityTouched(true);
    const validationError = validateSeverity(severity);
    if (validationError) {
      setSeverityError(validationError);
      return;
    }
    setIsLogging(true);
    try {
      const newSymptom = await createSymptomLog({
        symptomType: type,
        severity: severity!,
        loggedAt: new Date().toISOString(),
      });
      setSymptoms(prev => [newSymptom, ...prev]);
      setRecentlyAdded(newSymptom._id);
      setTimeout(() => setRecentlyAdded(null), 3000);
      const config = symptomConfig[type];
      setSuccessMessage(`${config.icon} ${config.label} logged`);
      setTimeout(() => setSuccessMessage(null), 3000);
      setSelectedSymptom(null);
      resetFormValidation();
    } catch (err) {
      if (err instanceof SubscriptionLimitError) {
        setLimitError({ message: err.message, limit: err.limit });
        setSelectedSymptom(null);
        resetFormValidation();
      } else {
        console.error('Failed to log symptom:', err);
        setError('Failed to log symptom');
      }
    } finally {
      setIsLogging(false);
    }
  };

  const todaySymptoms = useMemo(() => {
    const today = new Date().toDateString();
    return symptoms.filter(s => new Date(s.loggedAt).toDateString() === today);
  }, [symptoms]);

  const symptomCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    symptoms.forEach(s => { counts[s.symptomType] = (counts[s.symptomType] || 0) + 1; });
    return counts;
  }, [symptoms]);

  const topSymptoms = useMemo(() => {
    return Object.entries(symptomCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([type]) => type as SymptomType);
  }, [symptomCounts]);

  const weeklyData = useMemo(() => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
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
        day: dayNames[date.getDay()],
        count: daySymptoms.length,
        avgSeverity,
        isToday: i === 0,
      });
    }
    return weekData;
  }, [symptoms]);

  const wellnessScore = useMemo(() => {
    const todayAvgSeverity = todaySymptoms.length > 0
      ? todaySymptoms.reduce((sum, s) => sum + s.severity, 0) / todaySymptoms.length
      : 0;
    if (todaySymptoms.length === 0) return 100;
    return Math.max(0, Math.round(100 - (todayAvgSeverity * 15) - (todaySymptoms.length * 5)));
  }, [todaySymptoms]);

  const groupedHistory = useMemo(() => {
    const groups: Record<string, SymptomLog[]> = {};
    symptoms.slice(0, 50).forEach(s => {
      const date = new Date(s.loggedAt).toDateString();
      if (!groups[date]) groups[date] = [];
      groups[date].push(s);
    });
    return Object.entries(groups).slice(0, 7);
  }, [symptoms]);

  const maxWeekCount = Math.max(1, ...weeklyData.map(d => d.count));

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
    <div className="max-w-4xl mx-auto space-y-5 pb-24 px-4 animate-in fade-in duration-500">
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

      {/* Error */}
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
              <h3 className="font-bold text-amber-400 text-lg">Plan Limit Reached</h3>
              <p className="text-amber-500 mt-1">{limitError.message}</p>
              <div className="flex items-center gap-3 mt-4">
                <Link
                  to="/pricing"
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold text-sm hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg shadow-amber-500/20"
                >
                  Upgrade Plan
                </Link>
                <button
                  onClick={() => setLimitError(null)}
                  className="px-4 py-2.5 text-amber-400 font-medium text-sm hover:bg-amber-500/10 rounded-xl transition-all"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ HERO CARD ═══════════ */}
      <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-700 rounded-[1.5rem] p-6 md:p-8 shadow-2xl shadow-purple-900/30 relative overflow-hidden">
        {/* Ambient blurs */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-6">
            {/* Wellness Ring */}
            <div className="flex-shrink-0">
              <div className="w-[88px] h-[88px] md:w-[100px] md:h-[100px] relative animate-pulse-glow rounded-full">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="7" />
                  <circle
                    cx="50" cy="50" r="42" fill="none" stroke="white" strokeWidth="7" strokeLinecap="round"
                    strokeDasharray={`${wellnessScore * 2.64} 264`}
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                  <span className="text-2xl md:text-3xl font-black leading-none">{wellnessScore}</span>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-white/50 mt-0.5">Wellness</span>
                </div>
              </div>
            </div>

            {/* Status text */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl md:text-3xl font-black text-white leading-tight">
                {wellnessScore >= 80 ? 'Feeling Great!' :
                 wellnessScore >= 60 ? 'Doing Okay' :
                 wellnessScore >= 40 ? 'Not So Good' : 'Rough Day'}
              </h1>
              <p className="text-white/60 text-sm mt-1">
                {todaySymptoms.length === 0
                  ? 'No symptoms logged today'
                  : `${todaySymptoms.length} symptom${todaySymptoms.length > 1 ? 's' : ''} logged today`}
              </p>
            </div>
          </div>

          {/* Mini Week Chart */}
          <div className="flex items-end gap-3 mt-6">
            {weeklyData.map((day, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
                <div
                  className={`w-full max-w-[28px] mx-auto rounded-full transition-all ${day.isToday ? 'bg-white' : 'bg-white/25'}`}
                  style={{
                    height: day.count > 0
                      ? `${Math.max(10, (day.count / maxWeekCount) * 36)}px`
                      : '6px',
                  }}
                />
                <span className={`text-[10px] font-bold ${day.isToday ? 'text-white' : 'text-white/40'}`}>
                  {day.day}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════ QUICK LOG ═══════════ */}
      {topSymptoms.length > 0 && (
        <div className="bg-white dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-100 dark:border-slate-700/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Quick Log</h2>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Your most logged symptoms</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {topSymptoms.map(type => {
              const config = symptomConfig[type];
              return (
                <button
                  key={type}
                  onClick={() => setSelectedSymptom(type)}
                  className="flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all group active:scale-[0.97]"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-200/50 dark:bg-slate-600/50 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                    {config.icon}
                  </div>
                  <div className="text-left">
                    <span className="font-bold text-sm text-slate-900 dark:text-white block">{config.label}</span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500">{symptomCounts[type]}x logged</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══════════ ALL SYMPTOMS GRID ═══════════ */}
      <div className="bg-white dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-100 dark:border-slate-700/50">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white">All Symptoms</h2>
          <button
            onClick={() => setShowAllSymptoms(!showAllSymptoms)}
            className="text-xs font-bold text-cyan-500 hover:text-cyan-400 uppercase tracking-wider transition-colors"
          >
            {showAllSymptoms ? 'Show Less' : 'Show All'}
          </button>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {(showAllSymptoms ? symptomTypes : symptomTypes.slice(0, 10)).map(st => {
            const count = symptomCounts[st.type] || 0;
            return (
              <button
                key={st.type}
                onClick={() => setSelectedSymptom(st.type)}
                className="group relative bg-slate-50 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-600/40 rounded-2xl p-4 hover:bg-slate-100 dark:hover:bg-slate-700/60 hover:border-slate-200 dark:hover:border-slate-500/50 transition-all active:scale-[0.96]"
              >
                <div className="text-center space-y-2.5">
                  <span className="text-3xl block group-hover:scale-110 transition-transform duration-200">
                    {st.icon}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    {st.label}
                  </span>
                </div>
                {count > 0 && (
                  <div
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center shadow-lg"
                    style={{ backgroundColor: st.color }}
                  >
                    {count}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══════════ STATS ROW ═══════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-100 dark:border-slate-700/50">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Logged</p>
            <div className="w-7 h-7 rounded-lg bg-violet-100 dark:bg-violet-500/15 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white">{symptoms.length}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">all time</p>
        </div>

        <div className="bg-white dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-100 dark:border-slate-700/50">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Today</p>
            <div className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-500/15 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white">{todaySymptoms.length}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">symptoms</p>
        </div>

        <div className="bg-white dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-100 dark:border-slate-700/50">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Avg Severity</p>
            <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white">
            {symptoms.length > 0
              ? (symptoms.reduce((sum, s) => sum + s.severity, 0) / symptoms.length).toFixed(1)
              : '—'}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">out of 5</p>
        </div>

        <div className="bg-white dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-100 dark:border-slate-700/50">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Types</p>
            <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white">{Object.keys(symptomCounts).length}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">different</p>
        </div>
      </div>

      {/* ═══════════ RECENT HISTORY ═══════════ */}
      <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/50 overflow-hidden">
        <div className="p-5 pb-4">
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Recent History</h2>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">Your symptom log by day</p>
        </div>

        {groupedHistory.length > 0 ? (
          <div>
            {groupedHistory.map(([date, daySymptoms]) => {
              const isToday = date === new Date().toDateString();
              const dateLabel = isToday ? 'Today' : displayShortDate(date);

              return (
                <div key={date}>
                  {/* Date header */}
                  <div className="flex items-center justify-between px-5 py-2.5 bg-slate-50 dark:bg-slate-900/50">
                    <span className={`text-xs font-bold ${isToday ? 'text-violet-500' : 'text-slate-500 dark:text-slate-400'}`}>
                      {dateLabel}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">{daySymptoms.length} logged</span>
                  </div>
                  {/* Symptom rows */}
                  <div className="px-4 pb-2 space-y-2">
                    {daySymptoms.map(symptom => {
                      const config = symptomConfig[symptom.symptomType];
                      const sevColor = symptom.severity >= 4 ? '#ef4444'
                        : symptom.severity >= 3 ? '#f59e0b'
                        : symptom.severity >= 2 ? '#84cc16'
                        : '#10b981';
                      return (
                        <div
                          key={symptom._id}
                          className={`flex items-center gap-4 p-3.5 bg-slate-50 dark:bg-slate-700/40 rounded-xl transition-all ${
                            recentlyAdded === symptom._id ? 'recently-added' : ''
                          }`}
                        >
                          <div className="w-10 h-10 rounded-full bg-slate-200/50 dark:bg-slate-600/40 flex items-center justify-center text-xl flex-shrink-0">
                            {config?.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-900 dark:text-white text-sm">{config?.label}</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500">{displayTime(symptom.loggedAt)}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <div className="flex gap-[2px]">
                              {[1, 2, 3, 4, 5].map(i => (
                                <div
                                  key={i}
                                  className="w-[3px] h-[16px] rounded-sm transition-all"
                                  style={{
                                    backgroundColor: i <= symptom.severity
                                      ? sevColor
                                      : 'rgb(100 116 139 / 0.2)',
                                  }}
                                />
                              ))}
                            </div>
                            <span
                              className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md"
                              style={{
                                backgroundColor: `${sevColor}18`,
                                color: sevColor,
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
            <p className="text-slate-500 dark:text-slate-400 font-medium">No symptoms logged yet</p>
            <p className="text-slate-400 dark:text-slate-500 text-sm">Tap any symptom above to start tracking</p>
          </div>
        )}
      </div>

      {/* ═══════════ DISCLAIMER ═══════════ */}
      <div className="bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/15 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <span className="text-lg flex-shrink-0 mt-0.5">⚠️</span>
          <div>
            <p className="text-sm font-bold text-amber-700 dark:text-amber-400">Important</p>
            <p className="text-xs text-amber-600/80 dark:text-amber-500/70 mt-1 leading-relaxed">
              This platform is intended for tracking and informational purposes only. It is not medical advice and should not be used as a substitute for professional clinical judgment. Always talk to your doctor or nephrologist for all medical decisions, diagnoses, or treatments.
            </p>
          </div>
        </div>
      </div>

      {/* ═══════════ SEVERITY MODAL ═══════════ */}
      {selectedSymptom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-8 max-w-md w-full shadow-2xl animate-bounce-in">
            <div className="text-center space-y-6">
              {/* Symptom Header */}
              <div className="flex items-center justify-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-700/60 flex items-center justify-center text-3xl shadow-sm">
                  {symptomConfig[selectedSymptom].icon}
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                {symptomConfig[selectedSymptom].label}
              </h3>

              <p className="text-slate-400 dark:text-slate-500">How severe is it? <span className="text-rose-500">*</span></p>

              {/* Severity Display */}
              <div className="py-2">
                {severity !== null ? (
                  <div
                    className="text-lg font-black"
                    style={{
                      color: severity >= 4 ? '#ef4444' : severity >= 3 ? '#f59e0b' : severity >= 2 ? '#84cc16' : '#10b981',
                    }}
                  >
                    {severityLabels[severity]}
                  </div>
                ) : (
                  <div className="text-lg font-black text-slate-300 dark:text-slate-600">Select below</div>
                )}
              </div>

              {/* Severity Buttons */}
              <div className="space-y-4">
                <div className="flex justify-between gap-2">
                  {[1, 2, 3, 4, 5].map(level => {
                    const btnColor = level >= 4 ? '#ef4444' : level >= 3 ? '#f59e0b' : level >= 2 ? '#84cc16' : '#10b981';
                    return (
                      <button
                        key={level}
                        onClick={() => handleSeveritySelect(level)}
                        className={`flex-1 h-14 rounded-xl font-black text-lg transition-all ${
                          severity === level
                            ? 'scale-105 shadow-xl text-white'
                            : severityError && severityTouched
                            ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-400 border border-rose-300 dark:border-rose-500/30'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600'
                        }`}
                        style={{
                          backgroundColor: severity === level ? btnColor : undefined,
                          boxShadow: severity === level ? `0 8px 24px ${btnColor}40` : undefined,
                        }}
                      >
                        {level}
                      </button>
                    );
                  })}
                </div>

                {/* Severity bar */}
                <div className={`h-1.5 rounded-full overflow-hidden ${
                  severityError && severityTouched ? 'bg-rose-100 dark:bg-rose-500/15' : 'bg-slate-100 dark:bg-slate-700'
                }`}>
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: severity !== null ? `${severity * 20}%` : '0%',
                      backgroundColor: severity !== null
                        ? (severity >= 4 ? '#ef4444' : severity >= 3 ? '#f59e0b' : severity >= 2 ? '#84cc16' : '#10b981')
                        : undefined,
                    }}
                  />
                </div>

                {severityError && severityTouched && (
                  <p className="text-sm text-rose-500 font-medium">{severityError}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => { setSelectedSymptom(null); resetFormValidation(); }}
                  className="flex-1 py-4 bg-slate-100 dark:bg-slate-700 rounded-2xl font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleQuickLog(selectedSymptom)}
                  disabled={isLogging || (severityError !== '' && severityTouched)}
                  className="flex-1 py-4 rounded-2xl font-bold text-white transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 bg-gradient-to-r from-violet-500 to-purple-500 shadow-lg shadow-violet-500/25"
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
    </div>
  );
};

export default Symptoms;
