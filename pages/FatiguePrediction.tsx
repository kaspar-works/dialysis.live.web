import React, { useState, useEffect, useRef } from 'react';
import { authFetch } from '../services/auth';
import { getInsights, MEDICAL_DISCLAIMER } from '../services/ai';

// Local interfaces

interface FatigueLog {
  _id: string;
  energyLevel: number;
  notes: string;
  createdAt: string;
}

interface FatigueFactors {
  sleepQuality: number;
  hydrationStatus: number;
  hoursSinceDialysis: number;
  medicationAdherence: number;
  recentExercise: number;
}

interface FatiguePrediction {
  currentLevel: number;
  factors: FatigueFactors;
  weeklyTrend: { day: string; level: number }[];
}

// Mock/fallback data

const MOCK_PREDICTION: FatiguePrediction = {
  currentLevel: 5,
  factors: {
    sleepQuality: 6,
    hydrationStatus: 7,
    hoursSinceDialysis: 18,
    medicationAdherence: 9,
    recentExercise: 4,
  },
  weeklyTrend: [
    { day: 'Mon', level: 6 },
    { day: 'Tue', level: 4 },
    { day: 'Wed', level: 7 },
    { day: 'Thu', level: 5 },
    { day: 'Fri', level: 3 },
    { day: 'Sat', level: 6 },
    { day: 'Sun', level: 5 },
  ],
};

const MOCK_LOGS: FatigueLog[] = [
  { _id: '1', energyLevel: 6, notes: 'Felt decent after morning walk', createdAt: new Date(Date.now() - 86400000).toISOString() },
  { _id: '2', energyLevel: 3, notes: 'Very tired after dialysis session', createdAt: new Date(Date.now() - 172800000).toISOString() },
  { _id: '3', energyLevel: 7, notes: 'Good rest day, slept well', createdAt: new Date(Date.now() - 259200000).toISOString() },
];

// Helpers

function getFatigueColor(level: number): string {
  if (level <= 3) return 'text-emerald-500';
  if (level <= 5) return 'text-amber-500';
  if (level <= 7) return 'text-orange-500';
  return 'text-red-500';
}

function getFatigueLabel(level: number): string {
  if (level <= 2) return 'Minimal';
  if (level <= 4) return 'Mild';
  if (level <= 6) return 'Moderate';
  if (level <= 8) return 'High';
  return 'Severe';
}

function getBarColor(level: number): string {
  if (level <= 3) return 'bg-emerald-500';
  if (level <= 5) return 'bg-amber-500';
  if (level <= 7) return 'bg-orange-500';
  return 'bg-red-500';
}

function getFactorBarColor(score: number, inverted = false): string {
  const effective = inverted ? 10 - score : score;
  if (effective >= 7) return 'bg-emerald-500';
  if (effective >= 5) return 'bg-amber-500';
  return 'bg-red-500';
}

function getRingStroke(level: number): string {
  if (level <= 3) return '#10b981';
  if (level <= 5) return '#f59e0b';
  if (level <= 7) return '#f97316';
  return '#ef4444';
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function FatiguePrediction() {
  const [isLoading, setIsLoading] = useState(true);
  const [prediction, setPrediction] = useState<FatiguePrediction | null>(null);
  const [logs, setLogs] = useState<FatigueLog[]>([]);
  const [aiRecommendations, setAiRecommendations] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [energyLevel, setEnergyLevel] = useState(5);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    async function fetchData() {
      setIsLoading(true);
      try {
        const [predictionRes, logsRes] = await Promise.all([
          authFetch('/fatigue-prediction').catch(() => null),
          authFetch('/fatigue-logs').catch(() => null),
        ]);

        if (predictionRes?.data) {
          setPrediction(predictionRes.data);
        } else {
          setPrediction(MOCK_PREDICTION);
        }

        if (logsRes?.data && Array.isArray(logsRes.data)) {
          setLogs(logsRes.data);
        } else {
          setLogs(MOCK_LOGS);
        }
      } catch {
        setPrediction(MOCK_PREDICTION);
        setLogs(MOCK_LOGS);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  const fetchInsights = async () => {
    setAiLoading(true);
    try {
      const insights = await getInsights();
      setAiRecommendations(insights.response);
    } catch {
      setAiRecommendations(
        'Based on your recent data, consider prioritizing rest on dialysis days, staying hydrated between sessions, and maintaining a consistent sleep schedule. Light activity like walking can help manage fatigue levels over time.'
      );
    } finally {
      setAiLoading(false);
    }
  };

  const handleLogSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    setSubmitSuccess(false);

    try {
      const result = await authFetch('/fatigue-logs', {
        method: 'POST',
        body: JSON.stringify({ energyLevel, notes }),
      });

      if (result?.data) {
        setLogs((prev) => [result.data, ...prev]);
      } else {
        setLogs((prev) => [
          {
            _id: Date.now().toString(),
            energyLevel,
            notes,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
      }

      setSubmitSuccess(true);
      setNotes('');
      setEnergyLevel(5);
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch {
      setError('Failed to save fatigue log. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  const current = prediction ?? MOCK_PREDICTION;
  const circumference = 2 * Math.PI * 54;
  const gaugeOffset = circumference - (current.currentLevel / 10) * circumference;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            Fatigue Prediction
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            AI-powered fatigue analysis and energy tracking
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20 rounded-full text-xs font-semibold text-violet-600 dark:text-violet-400">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
          </svg>
          AI Premium
        </span>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-red-600 dark:text-red-400 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 ml-4">&times;</button>
        </div>
      )}

      {/* Current Fatigue Level + Factors Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Circular Gauge */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col items-center justify-center">
          <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Current Fatigue Level</h2>
          <div className="relative w-36 h-36">
            <svg className="w-36 h-36 -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeWidth="8" className="text-slate-200 dark:text-slate-800" />
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke={getRingStroke(current.currentLevel)}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={gaugeOffset}
                style={{ transition: 'stroke-dashoffset 0.6s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-4xl font-bold ${getFatigueColor(current.currentLevel)}`}>
                {current.currentLevel}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">/10</span>
            </div>
          </div>
          <p className={`mt-3 text-sm font-semibold ${getFatigueColor(current.currentLevel)}`}>
            {getFatigueLabel(current.currentLevel)} Fatigue
          </p>
        </div>

        {/* Fatigue Factors */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
          <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Contributing Factors</h2>
          <div className="space-y-4">
            {/* Sleep Quality */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">&#x1F4A4;</span>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Sleep Quality</span>
                </div>
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">{current.factors.sleepQuality}/10</span>
              </div>
              <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${getFactorBarColor(current.factors.sleepQuality)}`} style={{ width: `${current.factors.sleepQuality * 10}%`, transition: 'width 0.5s ease' }} />
              </div>
            </div>

            {/* Hydration Status */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">&#x1F4A7;</span>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Hydration Status</span>
                </div>
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">{current.factors.hydrationStatus}/10</span>
              </div>
              <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${getFactorBarColor(current.factors.hydrationStatus)}`} style={{ width: `${current.factors.hydrationStatus * 10}%`, transition: 'width 0.5s ease' }} />
              </div>
            </div>

            {/* Last Dialysis Session */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">&#x23F1;</span>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Last Dialysis Session</span>
                </div>
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">{current.factors.hoursSinceDialysis}h ago</span>
              </div>
              <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${current.factors.hoursSinceDialysis <= 12 ? 'bg-amber-500' : current.factors.hoursSinceDialysis <= 24 ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${Math.min((current.factors.hoursSinceDialysis / 48) * 100, 100)}%`, transition: 'width 0.5s ease' }} />
              </div>
            </div>

            {/* Medication Adherence */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">&#x1F48A;</span>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Medication Adherence</span>
                </div>
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">{current.factors.medicationAdherence}/10</span>
              </div>
              <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${getFactorBarColor(current.factors.medicationAdherence)}`} style={{ width: `${current.factors.medicationAdherence * 10}%`, transition: 'width 0.5s ease' }} />
              </div>
            </div>

            {/* Recent Exercise */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">&#x1F3C3;</span>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Recent Exercise</span>
                </div>
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">{current.factors.recentExercise}/10</span>
              </div>
              <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${getFactorBarColor(current.factors.recentExercise)}`} style={{ width: `${current.factors.recentExercise * 10}%`, transition: 'width 0.5s ease' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Trend */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
        <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Weekly Fatigue Trend</h2>
        <div className="flex items-end gap-2 h-40">
          {current.weeklyTrend.map((entry) => (
            <div key={entry.day} className="flex-1 flex flex-col items-center gap-1">
              <span className={`text-xs font-bold ${getFatigueColor(entry.level)}`}>{entry.level}</span>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-t-lg overflow-hidden" style={{ height: '120px' }}>
                <div
                  className={`w-full rounded-t-lg ${getBarColor(entry.level)}`}
                  style={{
                    height: `${(entry.level / 10) * 100}%`,
                    marginTop: `${100 - (entry.level / 10) * 100}%`,
                    transition: 'height 0.4s ease, margin-top 0.4s ease',
                  }}
                />
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{entry.day}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between mt-3 text-xs text-slate-400 dark:text-slate-500">
          <span>Lower is better</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> 1-3</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> 4-5</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500" /> 6-7</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> 8-10</span>
          </div>
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <svg className="w-4 h-4 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
            AI Recommendations
          </h2>
          {!aiRecommendations && !aiLoading && (
            <button
              onClick={fetchInsights}
              className="px-4 py-1.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-lg text-xs font-medium hover:opacity-90 transition-opacity"
            >
              Get Insights
            </button>
          )}
        </div>
        {aiLoading && (
          <div className="flex items-center gap-3 py-6">
            <div className="w-5 h-5 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
            <span className="text-sm text-slate-500 dark:text-slate-400">Generating personalized recommendations...</span>
          </div>
        )}
        {aiRecommendations && (
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
            {aiRecommendations}
          </p>
        )}
        {!aiRecommendations && !aiLoading && (
          <p className="text-sm text-slate-400 dark:text-slate-500 py-4">
            Click "Get Insights" to receive AI-powered recommendations based on your fatigue patterns and health data.
          </p>
        )}
      </div>

      {/* Log How You Feel + Recent Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Entry */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
          <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Log How You Feel</h2>

          <div className="mb-4">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
              Energy Level: <span className={`font-bold ${getFatigueColor(energyLevel)}`}>{energyLevel}/10</span>
            </label>
            <input
              type="range"
              min={1}
              max={10}
              value={energyLevel}
              onChange={(e) => setEnergyLevel(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer accent-violet-500"
            />
            <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500 mt-1">
              <span>Very Low</span>
              <span>Very High</span>
            </div>
          </div>

          <div className="mb-4">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How are you feeling? Any specific fatigue triggers today?"
              className="w-full h-24 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
            />
          </div>

          <button
            onClick={handleLogSubmit}
            disabled={isSubmitting}
            className="w-full py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              'Save Entry'
            )}
          </button>

          {submitSuccess && (
            <p className="text-sm text-emerald-500 mt-2 text-center font-medium">Entry saved successfully!</p>
          )}
        </div>

        {/* Recent Logs */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
          <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Recent Fatigue Logs</h2>
          {logs.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-slate-400 dark:text-slate-500">No fatigue logs yet. Start by logging how you feel.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {logs.map((log) => (
                <div
                  key={log._id}
                  className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl"
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold flex-shrink-0 ${
                    log.energyLevel <= 3
                      ? 'bg-red-500/10 text-red-500'
                      : log.energyLevel <= 5
                        ? 'bg-amber-500/10 text-amber-500'
                        : log.energyLevel <= 7
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : 'bg-emerald-500/10 text-emerald-600'
                  }`}>
                    {log.energyLevel}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Energy: {log.energyLevel}/10
                      </span>
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        {formatDate(log.createdAt)}
                      </span>
                    </div>
                    {log.notes && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">{log.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Medical Disclaimer */}
      <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <p className="text-xs text-slate-400 dark:text-slate-500 italic leading-relaxed">
            {MEDICAL_DISCLAIMER}
          </p>
        </div>
      </div>
    </div>
  );
}
