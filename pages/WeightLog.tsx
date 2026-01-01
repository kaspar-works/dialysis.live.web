import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store';
import { ICONS } from '../constants';
import { createWeightLog, getWeightLogs, deleteWeightLog, deleteAllWeightLogs, analyzeWeightLogs, exportWeightLogs, WeightLog as WeightLogApi, WeightContext, WeightAnalysis } from '../services/weight';
import { SubscriptionLimitError } from '../services/auth';

// Map frontend display types to backend API values
const typeToApi: Record<string, WeightContext> = {
  'morning': 'morning',
  'pre-dialysis': 'pre_dialysis',
  'post-dialysis': 'post_dialysis',
};

// Map backend API values to frontend display types
const apiToType: Record<WeightContext, string> = {
  'morning': 'morning',
  'pre_dialysis': 'pre-dialysis',
  'post_dialysis': 'post-dialysis',
};

const contextConfig = {
  'morning': { label: 'Morning', icon: '🌅', color: 'amber', gradient: 'from-amber-400 to-orange-500' },
  'pre-dialysis': { label: 'Pre-Dialysis', icon: '🏥', color: 'sky', gradient: 'from-sky-400 to-blue-500' },
  'post-dialysis': { label: 'Post-Dialysis', icon: '✅', color: 'emerald', gradient: 'from-emerald-400 to-teal-500' },
};

const ITEMS_PER_PAGE = 10;

const WeightLog: React.FC = () => {
  const { profile } = useStore();
  const [weights, setWeights] = useState<WeightLogApi[]>([]);
  const [newValue, setNewValue] = useState(profile.weightGoal?.toString() || '75.0');
  const [newType, setNewType] = useState<'morning' | 'pre-dialysis' | 'post-dialysis'>('morning');
  const [timeRange, setTimeRange] = useState<'7' | '30' | '90'>('30');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [limitError, setLimitError] = useState<{ message: string; limit?: number } | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // All weights for charts (fetched separately)
  const [allWeights, setAllWeights] = useState<WeightLogApi[]>([]);
  const hasFetched = useRef(false);

  // New feature states
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [showAnalyzeModal, setShowAnalyzeModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<WeightAnalysis | null>(null);
  const [analysisDays, setAnalysisDays] = useState('30');

  // UI state
  const [showAllEntries, setShowAllEntries] = useState(false);
  const [recentlyAdded, setRecentlyAdded] = useState<string | null>(null);

  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch paginated data for table
      const tableResponse = await getWeightLogs({ limit: ITEMS_PER_PAGE, offset: 0 });
      setWeights(tableResponse.logs || []);
      setTotalItems(tableResponse.pagination?.total || 0);
      setCurrentPage(1);

      // Fetch more data for charts (last 100 entries)
      const chartResponse = await getWeightLogs({ limit: 100 });
      setAllWeights(chartResponse.logs || []);
    } catch (err) {
      console.error('Failed to fetch weights:', err);
      setError('Failed to load weight data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTablePage = async (page: number) => {
    setIsTableLoading(true);
    try {
      const offset = (page - 1) * ITEMS_PER_PAGE;
      const response = await getWeightLogs({ limit: ITEMS_PER_PAGE, offset });
      setWeights(response.logs || []);
      setTotalItems(response.pagination?.total || 0);
      setCurrentPage(page);
    } catch (err) {
      console.error('Failed to fetch weights:', err);
      setError('Failed to load weight data');
    } finally {
      setIsTableLoading(false);
    }
  };

  const handleDeleteWeight = async (logId: string) => {
    if (deletingId) return;
    setDeletingId(logId);
    try {
      await deleteWeightLog(logId);
      await fetchAllData();
    } catch (err) {
      console.error('Failed to delete weight:', err);
      setError('Failed to delete weight entry');
    } finally {
      setDeletingId(null);
    }
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    fetchTablePage(page);
  };

  // Delete all weights
  const handleDeleteAll = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteAllWeightLogs();
      setSuccessMessage(`Deleted ${result.deletedCount} weight entries`);
      setTimeout(() => setSuccessMessage(null), 3000);
      setShowDeleteAllModal(false);
      await fetchAllData();
    } catch (err) {
      console.error('Failed to delete all weights:', err);
      setError('Failed to delete weight entries');
    } finally {
      setIsDeleting(false);
    }
  };

  // Analyze weights with AI
  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setAnalysisResult(null);
    try {
      const result = await analyzeWeightLogs(parseInt(analysisDays));
      setAnalysisResult(result);
    } catch (err: unknown) {
      console.error('Failed to analyze weights:', err);
      const message = err instanceof Error ? err.message : 'Failed to analyze weight data';
      setError(message);
      setShowAnalyzeModal(false);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Export weights
  const handleExport = async (format: 'json' | 'csv') => {
    setIsExporting(true);
    try {
      const blob = await exportWeightLogs({ format });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `weight-logs-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setShowExportModal(false);
      setSuccessMessage(`Exported as ${format.toUpperCase()}`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Failed to export weights:', err);
      setError('Failed to export weight data');
    } finally {
      setIsExporting(false);
    }
  };

  // Stats calculations
  const safeWeights = allWeights && Array.isArray(allWeights) ? allWeights : [];
  const currentWeight = safeWeights[0]?.weightKg || profile.weightGoal;
  const previousWeight = safeWeights[1]?.weightKg || currentWeight;
  const weightChange = currentWeight - previousWeight;
  const targetDiff = currentWeight - profile.weightGoal;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newValue || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const savedWeight = parseFloat(newValue);
      const context = contextConfig[newType];
      await createWeightLog({
        weightKg: savedWeight,
        context: typeToApi[newType],
        loggedAt: new Date().toISOString(),
      });
      await fetchAllData();

      // Highlight recently added
      if (allWeights[0]?._id) {
        setRecentlyAdded(allWeights[0]._id);
        setTimeout(() => setRecentlyAdded(null), 3000);
      }

      // Show success notification
      setSuccessMessage(`${context.icon} ${savedWeight.toFixed(1)} kg saved!`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      if (err instanceof SubscriptionLimitError) {
        setLimitError({ message: err.message, limit: err.limit });
      } else {
        console.error('Failed to add weight:', err);
        setError('Failed to save weight');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Chart data
  const chartData = useMemo(() => {
    if (!allWeights || !Array.isArray(allWeights) || allWeights.length === 0) {
      return [];
    }

    const days = parseInt(timeRange);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    return [...allWeights]
      .filter(w => w && new Date(w.loggedAt) >= cutoff)
      .reverse()
      .map(w => ({
        date: new Date(w.loggedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        weight: w.weightKg,
        context: apiToType[w.context],
      }));
  }, [allWeights, timeRange]);

  // Weight range for chart
  const weightRange = useMemo(() => {
    if (chartData.length === 0) return { min: 70, max: 80 };
    const values = chartData.map(d => d.weight);
    const min = Math.min(...values, profile.weightGoal);
    const max = Math.max(...values, profile.weightGoal);
    const padding = (max - min) * 0.2 || 2;
    return { min: Math.floor(min - padding), max: Math.ceil(max + padding) };
  }, [chartData, profile.weightGoal]);

  // Confidence calculation
  const confidence = useMemo(() => {
    if (!allWeights || !Array.isArray(allWeights)) {
      return { status: 'Calibrating', color: 'slate', percent: 0 };
    }
    const postWeights = allWeights.filter(w => w && w.context === 'post_dialysis').slice(0, 5);
    if (postWeights.length < 3) return { status: 'Calibrating', color: 'slate', percent: 0 };

    const avg = postWeights.reduce((acc, w) => acc + w.weightKg, 0) / postWeights.length;
    const deviation = Math.abs(avg - profile.weightGoal);

    if (deviation <= 0.5) return { status: 'Excellent', color: 'emerald', percent: 95 };
    if (deviation <= 1.0) return { status: 'Good', color: 'sky', percent: 75 };
    if (deviation <= 1.5) return { status: 'Fair', color: 'amber', percent: 50 };
    return { status: 'Review Needed', color: 'rose', percent: 25 };
  }, [allWeights, profile.weightGoal]);

  // Context breakdown for today
  const todayBreakdown = useMemo(() => {
    if (!allWeights || !Array.isArray(allWeights)) return [];
    const today = new Date().toDateString();
    return allWeights.filter(w => w && new Date(w.loggedAt).toDateString() === today);
  }, [allWeights]);

  // Weekly trend
  const weeklyTrend = useMemo(() => {
    if (!allWeights || !Array.isArray(allWeights)) return 0;
    const last7 = allWeights.slice(0, 7);
    if (last7.length < 2) return 0;
    const oldest = last7[last7.length - 1]?.weightKg || 0;
    const newest = last7[0]?.weightKg || 0;
    return newest - oldest;
  }, [allWeights]);

  // Progress toward target (as percentage, capped)
  const progressPercent = useMemo(() => {
    const diff = Math.abs(targetDiff);
    const maxDiff = 5; // 5kg max deviation shown
    return Math.max(0, Math.min(100, ((maxDiff - diff) / maxDiff) * 100));
  }, [targetDiff]);

  // SVG chart generation
  const svgChartPath = useMemo(() => {
    if (chartData.length < 2) return { line: '', area: '', points: [] };

    const width = 600;
    const height = 200;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const range = weightRange.max - weightRange.min;
    const xStep = chartWidth / (chartData.length - 1);

    const points = chartData.map((d, i) => ({
      x: padding + i * xStep,
      y: padding + chartHeight - ((d.weight - weightRange.min) / range) * chartHeight,
      value: d.weight,
      date: d.date,
    }));

    const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const area = `${line} L ${points[points.length - 1].x} ${height - padding} L ${padding} ${height - padding} Z`;

    return { line, area, points };
  }, [chartData, weightRange]);

  // Target line Y position
  const targetY = useMemo(() => {
    const height = 200;
    const padding = 40;
    const chartHeight = height - padding * 2;
    const range = weightRange.max - weightRange.min;
    return padding + chartHeight - ((profile.weightGoal - weightRange.min) / range) * chartHeight;
  }, [weightRange, profile.weightGoal]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 relative mx-auto">
            <div className="absolute inset-0 border-4 border-rose-500/20 rounded-full" />
            <div className="absolute inset-0 border-4 border-transparent border-t-rose-500 rounded-full animate-spin" />
            <div className="absolute inset-3 bg-gradient-to-br from-rose-500 to-pink-500 rounded-full flex items-center justify-center">
              <ICONS.Scale className="w-4 h-4 text-white" />
            </div>
          </div>
          <p className="text-slate-400 text-sm font-medium">Loading weight data...</p>
        </div>
      </div>
    );
  }

  const currentConfig = contextConfig[newType];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24 px-4 animate-in fade-in duration-500">
      {/* CSS Animations */}
      <style>{`
        @keyframes pulse-ring {
          0% { transform: scale(0.95); opacity: 1; }
          50% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(0.95); opacity: 1; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .animate-pulse-ring { animation: pulse-ring 2s ease-in-out infinite; }
        .animate-float { animation: float 3s ease-in-out infinite; }
        .recently-added { animation: highlight 2s ease-out; }
        @keyframes highlight {
          0% { background-color: rgb(236, 72, 153, 0.2); }
          100% { background-color: transparent; }
        }
      `}</style>

      {/* Success Toast */}
      {successMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top fade-in duration-300">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3">
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
      <div className="bg-gradient-to-br from-rose-500 via-pink-500 to-fuchsia-600 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-8">
            {/* Left: Progress Ring */}
            <div className="relative">
              <div className="w-48 h-48 relative animate-pulse-ring">
                {/* Outer glow */}
                <div className="absolute inset-0 bg-white/20 rounded-full blur-xl" />

                {/* Background ring */}
                <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
                  <circle
                    cx="100"
                    cy="100"
                    r="85"
                    fill="none"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="12"
                  />
                  {/* Progress arc */}
                  <circle
                    cx="100"
                    cy="100"
                    r="85"
                    fill="none"
                    stroke="white"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={`${progressPercent * 5.34} 534`}
                    className="transition-all duration-1000"
                  />
                </svg>

                {/* Center content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                  <div className="animate-float">
                    <span className="text-5xl font-black">{currentWeight.toFixed(1)}</span>
                  </div>
                  <span className="text-white/60 text-sm font-medium mt-1">kg</span>
                  <div className={`mt-2 px-3 py-1 rounded-full text-xs font-bold ${
                    Math.abs(targetDiff) <= 0.5 ? 'bg-emerald-400/30 text-emerald-100' :
                    Math.abs(targetDiff) <= 1.5 ? 'bg-amber-400/30 text-amber-100' :
                    'bg-rose-400/30 text-rose-100'
                  }`}>
                    {targetDiff > 0 ? '+' : ''}{targetDiff.toFixed(1)} from target
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Input Form */}
            <div className="flex-1 w-full">
              <form onSubmit={handleAdd} className="space-y-6">
                {/* Context Pills */}
                <div className="flex flex-wrap gap-2">
                  {(['morning', 'pre-dialysis', 'post-dialysis'] as const).map((type) => {
                    const config = contextConfig[type];
                    const isActive = newType === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setNewType(type)}
                        className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                          isActive
                            ? 'bg-white text-pink-600 shadow-lg scale-105'
                            : 'bg-white/15 text-white/80 hover:bg-white/25 hover:text-white'
                        }`}
                      >
                        <span className="text-lg">{config.icon}</span>
                        {config.label}
                      </button>
                    );
                  })}
                </div>

                {/* Weight Input Section */}
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                  <div className="flex items-center justify-center gap-6">
                    {/* Decrease Buttons */}
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => setNewValue((prev) => (parseFloat(prev) - 1).toFixed(1))}
                        className="w-14 h-12 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-lg transition-all active:scale-95 shadow-lg"
                      >
                        -1
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewValue((prev) => (parseFloat(prev) - 0.1).toFixed(1))}
                        className="w-14 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white/70 font-bold text-sm transition-all active:scale-95"
                      >
                        -0.1
                      </button>
                    </div>

                    {/* Main Input */}
                    <div className="text-center">
                      <input
                        type="number"
                        step="0.1"
                        value={newValue}
                        onChange={(e) => setNewValue(e.target.value)}
                        className="w-40 bg-transparent text-6xl font-black text-white text-center outline-none"
                        style={{ caretColor: 'white' }}
                      />
                      <p className="text-white/50 text-sm font-medium mt-1">kilograms</p>
                    </div>

                    {/* Increase Buttons */}
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => setNewValue((prev) => (parseFloat(prev) + 1).toFixed(1))}
                        className="w-14 h-12 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-lg transition-all active:scale-95 shadow-lg"
                      >
                        +1
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewValue((prev) => (parseFloat(prev) + 0.1).toFixed(1))}
                        className="w-14 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white/70 font-bold text-sm transition-all active:scale-95"
                      >
                        +0.1
                      </button>
                    </div>
                  </div>

                  {/* Quick Presets */}
                  <div className="flex justify-center flex-wrap gap-2 mt-4 pt-4 border-t border-white/10">
                    {[profile.weightGoal - 1, profile.weightGoal - 0.5, profile.weightGoal, profile.weightGoal + 0.5, profile.weightGoal + 1].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setNewValue(preset.toFixed(1))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          parseFloat(newValue) === preset
                            ? 'bg-white text-pink-500 shadow'
                            : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
                        }`}
                      >
                        {preset.toFixed(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || !newValue}
                  className="w-full py-4 rounded-2xl font-bold bg-white text-pink-600 hover:bg-white/90 disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl transition-all active:scale-[0.98]"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-pink-500/30 border-t-pink-500 rounded-full animate-spin" />
                  ) : (
                    <>
                      <span className="text-lg">{currentConfig.icon}</span>
                      Log {currentConfig.label} Weight
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Today's entries breakdown */}
          {todayBreakdown.length > 0 && (
            <div className="mt-6 pt-6 border-t border-white/10">
              <p className="text-white/60 text-xs font-bold uppercase tracking-wider mb-3">Today's Readings</p>
              <div className="flex flex-wrap gap-2">
                {todayBreakdown.map((entry) => {
                  const displayType = apiToType[entry.context] || entry.context;
                  const config = contextConfig[displayType as keyof typeof contextConfig];
                  return (
                    <div
                      key={entry._id}
                      className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 flex items-center gap-2"
                    >
                      <span>{config?.icon}</span>
                      <span className="text-white font-bold">{entry.weightKg.toFixed(1)} kg</span>
                      <span className="text-white/40 text-xs">
                        {new Date(entry.loggedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Current Weight */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 group hover:border-pink-200 dark:hover:border-pink-800 transition-all">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current</p>
            <div className="w-8 h-8 rounded-lg bg-pink-50 dark:bg-pink-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ICONS.Scale className="w-4 h-4 text-pink-500" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white">{currentWeight.toFixed(1)}</p>
          <p className="text-xs text-slate-400 mt-1">kilograms</p>
        </div>

        {/* Change */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 group hover:border-emerald-200 dark:hover:border-emerald-800 transition-all">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Change</p>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform ${
              weightChange <= 0 ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-rose-50 dark:bg-rose-500/10'
            }`}>
              <svg className={`w-4 h-4 ${weightChange <= 0 ? 'text-emerald-500 rotate-180' : 'text-rose-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </div>
          </div>
          <p className={`text-3xl font-black ${weightChange <= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)}
          </p>
          <p className="text-xs text-slate-400 mt-1">vs last entry</p>
        </div>

        {/* Weekly Trend */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 group hover:border-sky-200 dark:hover:border-sky-800 transition-all">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">7-Day Trend</p>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform ${
              weeklyTrend <= 0 ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-amber-50 dark:bg-amber-500/10'
            }`}>
              <svg className="w-4 h-4 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
            </div>
          </div>
          <p className={`text-3xl font-black ${weeklyTrend <= 0 ? 'text-emerald-500' : 'text-amber-500'}`}>
            {weeklyTrend > 0 ? '+' : ''}{weeklyTrend.toFixed(1)}
          </p>
          <p className="text-xs text-slate-400 mt-1">past 7 days</p>
        </div>

        {/* Confidence */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 group hover:border-purple-200 dark:hover:border-purple-800 transition-all">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Accuracy</p>
            <div className={`w-8 h-8 rounded-lg bg-${confidence.color}-50 dark:bg-${confidence.color}-500/10 flex items-center justify-center group-hover:scale-110 transition-transform`}>
              <svg className={`w-4 h-4 text-${confidence.color}-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className={`text-2xl font-black text-${confidence.color}-500`}>{confidence.status}</p>
          <div className="mt-2 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                confidence.color === 'emerald' ? 'bg-emerald-500' :
                confidence.color === 'sky' ? 'bg-sky-500' :
                confidence.color === 'amber' ? 'bg-amber-500' :
                confidence.color === 'rose' ? 'bg-rose-500' : 'bg-slate-500'
              }`}
              style={{ width: `${confidence.percent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 border border-slate-100 dark:border-slate-700 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">Weight Trend</h2>
            <p className="text-sm text-slate-400">Track your progress toward dry weight</p>
          </div>

          {/* Time Range Pills */}
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
            {[
              { id: '7', label: '7D' },
              { id: '30', label: '30D' },
              { id: '90', label: '90D' },
            ].map((range) => (
              <button
                key={range.id}
                onClick={() => setTimeRange(range.id as '7' | '30' | '90')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  timeRange === range.id
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom SVG Chart */}
        <div className="h-[280px] relative">
          {chartData.length > 1 ? (
            <svg viewBox="0 0 600 200" className="w-full h-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id="weightAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ec4899" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#ec4899" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="weightLineGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#f472b6" />
                  <stop offset="50%" stopColor="#ec4899" />
                  <stop offset="100%" stopColor="#db2777" />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              {[0, 1, 2, 3, 4].map((i) => (
                <line
                  key={i}
                  x1="40"
                  y1={40 + i * 30}
                  x2="560"
                  y2={40 + i * 30}
                  stroke="currentColor"
                  strokeOpacity="0.05"
                  className="text-slate-900 dark:text-white"
                />
              ))}

              {/* Target line */}
              <line
                x1="40"
                y1={targetY}
                x2="560"
                y2={targetY}
                stroke="#10b981"
                strokeWidth="2"
                strokeDasharray="8 4"
              />
              <text x="565" y={targetY + 4} fill="#10b981" fontSize="10" fontWeight="bold">
                {profile.weightGoal}
              </text>

              {/* Area */}
              <path
                d={svgChartPath.area}
                fill="url(#weightAreaGradient)"
              />

              {/* Line */}
              <path
                d={svgChartPath.line}
                fill="none"
                stroke="url(#weightLineGradient)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data points */}
              {svgChartPath.points.map((point, i) => (
                <g key={i} className="group">
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="5"
                    fill="#ec4899"
                    stroke="white"
                    strokeWidth="2"
                    className="drop-shadow-sm"
                  />
                  {/* Hover tooltip */}
                  <g className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ pointerEvents: 'none' }}>
                    <rect
                      x={point.x - 30}
                      y={point.y - 35}
                      width="60"
                      height="24"
                      rx="6"
                      fill="#1e293b"
                    />
                    <text
                      x={point.x}
                      y={point.y - 18}
                      textAnchor="middle"
                      fill="white"
                      fontSize="11"
                      fontWeight="bold"
                    >
                      {point.value.toFixed(1)} kg
                    </text>
                  </g>
                </g>
              ))}

              {/* Y-axis labels */}
              <text x="35" y="45" textAnchor="end" fill="#94a3b8" fontSize="10">{weightRange.max}</text>
              <text x="35" y="165" textAnchor="end" fill="#94a3b8" fontSize="10">{weightRange.min}</text>
            </svg>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center mb-4">
                <ICONS.Scale className="w-8 h-8 opacity-30" />
              </div>
              <p className="font-medium">Not enough data</p>
              <p className="text-sm">Log at least 2 weights to see trends</p>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-pink-400 to-pink-600" />
            <span className="text-xs text-slate-500">Your Weight</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 bg-emerald-500" style={{ borderStyle: 'dashed', borderWidth: '1px', borderColor: '#10b981' }} />
            <span className="text-xs text-slate-500">Target ({profile.weightGoal} kg)</span>
          </div>
        </div>
      </div>

      {/* History Section */}
      <div className="bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">History</h2>
              <p className="text-sm text-slate-400">{totalItems} total entries</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowAnalyzeModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-purple-500/20"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                AI Analyze
              </button>
              <button
                onClick={() => setShowExportModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-500/20"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export
              </button>
              <button
                onClick={() => setShowDeleteAllModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-500 hover:text-rose-500 rounded-xl text-xs font-bold transition-all"
              >
                <ICONS.Trash className="w-4 h-4" />
                Clear All
              </button>
            </div>
          </div>
        </div>

        {/* Entries List */}
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {isTableLoading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-2 border-pink-500/30 border-t-pink-500 rounded-full animate-spin mx-auto mb-3" />
              <span className="text-slate-400 text-sm">Loading...</span>
            </div>
          ) : weights.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ICONS.Scale className="w-8 h-8 text-slate-300 dark:text-slate-600" />
              </div>
              <p className="text-slate-400 font-medium">No weight entries yet</p>
              <p className="text-sm text-slate-400">Start logging to track your progress</p>
            </div>
          ) : (
            <>
              {(showAllEntries ? weights : weights.slice(0, 5)).map((weight) => {
                const displayType = apiToType[weight.context] || weight.context;
                const config = contextConfig[displayType as keyof typeof contextConfig];
                const diff = weight.weightKg - profile.weightGoal;

                return (
                  <div
                    key={weight._id}
                    className={`p-4 sm:p-5 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all group ${
                      recentlyAdded === weight._id ? 'recently-added' : ''
                    }`}
                  >
                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${config?.gradient || 'from-slate-400 to-slate-500'} flex items-center justify-center text-white text-xl shrink-0`}>
                      {config?.icon || '⚖️'}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl font-black text-slate-900 dark:text-white">
                          {weight.weightKg.toFixed(1)}
                        </span>
                        <span className="text-sm text-slate-400">kg</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          Math.abs(diff) <= 0.5 ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' :
                          Math.abs(diff) <= 1.5 ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400' :
                          'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400'
                        }`}>
                          {diff > 0 ? '+' : ''}{diff.toFixed(1)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span>{config?.label || displayType}</span>
                        <span>•</span>
                        <span>
                          {new Date(weight.loggedAt).toLocaleDateString(undefined, {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                        <span>
                          {new Date(weight.loggedAt).toLocaleTimeString(undefined, {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Delete */}
                    <button
                      onClick={() => handleDeleteWeight(weight._id)}
                      disabled={deletingId === weight._id}
                      className="p-2 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                    >
                      {deletingId === weight._id ? (
                        <div className="w-4 h-4 border-2 border-rose-500/30 border-t-rose-500 rounded-full animate-spin" />
                      ) : (
                        <ICONS.Trash className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                );
              })}

              {/* View All Toggle */}
              {weights.length > 5 && (
                <div className="p-4 text-center">
                  <button
                    onClick={() => setShowAllEntries(!showAllEntries)}
                    className="text-sm font-bold text-pink-500 hover:text-pink-600 transition-colors"
                  >
                    {showAllEntries ? 'Show Less' : `View All (${weights.length})`}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || isTableLoading}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Prev
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let page: number;
                if (totalPages <= 5) {
                  page = i + 1;
                } else if (currentPage <= 3) {
                  page = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  page = totalPages - 4 + i;
                } else {
                  page = currentPage - 2 + i;
                }
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    disabled={isTableLoading}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                      currentPage === page
                        ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow'
                        : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || isTableLoading}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete All Modal */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-rose-100 dark:bg-rose-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ICONS.Trash className="w-8 h-8 text-rose-500" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">Delete All Weights?</h3>
              <p className="text-slate-500 dark:text-slate-400 mt-2">
                This will permanently delete all {totalItems} weight entries. This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteAllModal(false)}
                className="flex-1 py-3 rounded-xl font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAll}
                disabled={isDeleting}
                className="flex-1 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 disabled:opacity-50 flex items-center justify-center gap-2 transition-all shadow-lg shadow-rose-500/20"
              >
                {isDeleting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Delete All'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Analyze Modal */}
      {showAnalyzeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 max-w-2xl w-full shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">AI Weight Analysis</h3>
                <p className="text-sm text-slate-400">Get insights from your weight data</p>
              </div>
              <button
                onClick={() => { setShowAnalyzeModal(false); setAnalysisResult(null); }}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
              >
                <ICONS.X className="w-5 h-5" />
              </button>
            </div>

            {!analysisResult ? (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Analysis Period</label>
                  <div className="flex gap-2">
                    {['7', '30', '60', '90'].map((days) => (
                      <button
                        key={days}
                        onClick={() => setAnalysisDays(days)}
                        className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                          analysisDays === days
                            ? 'bg-gradient-to-r from-purple-500 to-violet-500 text-white shadow-lg'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                        }`}
                      >
                        {days} Days
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 disabled:opacity-50 flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-500/20"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      Analyze with AI
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Statistics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4">
                    <p className="text-xs text-slate-400">Average</p>
                    <p className="text-xl font-black text-slate-900 dark:text-white">{analysisResult.statistics.averageWeight} kg</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4">
                    <p className="text-xs text-slate-400">Min/Max</p>
                    <p className="text-xl font-black text-slate-900 dark:text-white">{analysisResult.statistics.minWeight}-{analysisResult.statistics.maxWeight}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4">
                    <p className="text-xs text-slate-400">Change</p>
                    <p className={`text-xl font-black ${analysisResult.statistics.weightChange <= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {analysisResult.statistics.weightChange > 0 ? '+' : ''}{analysisResult.statistics.weightChange} kg
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4">
                    <p className="text-xs text-slate-400">Entries</p>
                    <p className="text-xl font-black text-slate-900 dark:text-white">{analysisResult.statistics.totalEntries}</p>
                  </div>
                </div>

                {/* AI Analysis */}
                <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-500/10 dark:to-violet-500/10 rounded-2xl p-5 border border-purple-100 dark:border-purple-500/20">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-violet-500 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <span className="font-bold text-purple-700 dark:text-purple-300">AI Insights</span>
                  </div>
                  <div className="text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">
                    {analysisResult.analysis}
                  </div>
                </div>

                {/* Disclaimer */}
                <div className="text-xs text-slate-400 bg-slate-50 dark:bg-slate-900 rounded-xl p-3">
                  {analysisResult.disclaimer}
                </div>

                <button
                  onClick={() => setAnalysisResult(null)}
                  className="w-full py-3 rounded-xl font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
                >
                  Analyze Again
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Export Weight Data</h3>
                <p className="text-sm text-slate-400">Download your weight logs</p>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
              >
                <ICONS.X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => handleExport('csv')}
                disabled={isExporting}
                className="w-full p-4 rounded-2xl border-2 border-slate-100 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-all flex items-center gap-4 group"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-emerald-500/20">
                  <span className="text-xl text-white">📊</span>
                </div>
                <div className="text-left flex-1">
                  <p className="font-bold text-slate-900 dark:text-white">CSV Format</p>
                  <p className="text-xs text-slate-400">Spreadsheet compatible</p>
                </div>
                {isExporting && (
                  <div className="w-5 h-5 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                )}
              </button>

              <button
                onClick={() => handleExport('json')}
                disabled={isExporting}
                className="w-full p-4 rounded-2xl border-2 border-slate-100 dark:border-slate-700 hover:border-sky-500 dark:hover:border-sky-500 hover:bg-sky-50 dark:hover:bg-sky-500/10 transition-all flex items-center gap-4 group"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-sky-400 to-blue-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-sky-500/20">
                  <span className="text-xl text-white">{ }</span>
                </div>
                <div className="text-left flex-1">
                  <p className="font-bold text-slate-900 dark:text-white">JSON Format</p>
                  <p className="text-xs text-slate-400">Developer friendly</p>
                </div>
                {isExporting && (
                  <div className="w-5 h-5 border-2 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeightLog;
