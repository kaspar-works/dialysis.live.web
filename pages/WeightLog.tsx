import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { ICONS } from '../constants';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { createWeightLog, getWeightLogs, deleteWeightLog, deleteAllWeightLogs, analyzeWeightLogs, exportWeightLogs, WeightLog as WeightLogApi, WeightContext, WeightAnalysis } from '../services/weight';

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
  'morning': { label: 'Morning', icon: '🌅', color: 'amber' },
  'pre-dialysis': { label: 'Pre-Dialysis', icon: '🏥', color: 'sky' },
  'post-dialysis': { label: 'Post-Dialysis', icon: '✅', color: 'emerald' },
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
      setWeights(tableResponse.logs);
      setTotalItems(tableResponse.pagination.total);
      setCurrentPage(1);

      // Fetch more data for charts (last 100 entries)
      const chartResponse = await getWeightLogs({ limit: 100 });
      setAllWeights(chartResponse.logs);
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
      setWeights(response.logs);
      setTotalItems(response.pagination.total);
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
    } catch (err: any) {
      console.error('Failed to analyze weights:', err);
      setError(err.message || 'Failed to analyze weight data');
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
  const currentWeight = allWeights[0]?.weightKg || profile.weightGoal;
  const previousWeight = allWeights[1]?.weightKg || currentWeight;
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

      // Show success notification
      setSuccessMessage(`${context.icon} ${savedWeight.toFixed(1)} kg saved!`);

      // Auto-hide after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Failed to add weight:', err);
      setError('Failed to save weight');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Chart data
  const chartData = useMemo(() => {
    const days = parseInt(timeRange);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    return [...allWeights]
      .filter(w => new Date(w.loggedAt) >= cutoff)
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
    const postWeights = allWeights.filter(w => w.context === 'post_dialysis').slice(0, 5);
    if (postWeights.length < 3) return { status: 'Calibrating', color: 'slate', percent: 0 };

    const avg = postWeights.reduce((acc, w) => acc + w.weightKg, 0) / postWeights.length;
    const deviation = Math.abs(avg - profile.weightGoal);

    if (deviation <= 0.5) return { status: 'Excellent', color: 'emerald', percent: 95 };
    if (deviation <= 1.0) return { status: 'Good', color: 'sky', percent: 75 };
    if (deviation <= 1.5) return { status: 'Fair', color: 'amber', percent: 50 };
    return { status: 'Review Needed', color: 'rose', percent: 25 };
  }, [allWeights, profile.weightGoal]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-pink-500/20 border-t-pink-500 rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 text-sm font-medium">Loading weight data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24 px-4 animate-in fade-in duration-500">
      {/* Success Notification - Toast */}
      {successMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top fade-in duration-300">
          <div className="bg-emerald-500 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3">
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

      {/* Add Weight Card - Always Visible */}
      <div className="bg-gradient-to-br from-pink-500 to-rose-500 rounded-3xl p-6 shadow-xl">
        <form onSubmit={handleAdd}>
          {/* Top Row - Title & Context */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <ICONS.Scale className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-white font-bold text-lg">Log Weight</h2>
                <p className="text-white/60 text-xs">Target: {profile.weightGoal} kg</p>
              </div>
            </div>

            {/* Context Pills */}
            <div className="flex gap-1 bg-white/10 p-1 rounded-xl">
              {(['morning', 'pre-dialysis', 'post-dialysis'] as const).map((type) => {
                const config = contextConfig[type];
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setNewType(type)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      newType === type
                        ? 'bg-white text-pink-500 shadow'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {config.icon} {config.label.split('-')[0]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Weight Input - Large & Central */}
          <div className="bg-white/10 backdrop-blur rounded-2xl p-6 mb-4">
            <div className="flex items-center justify-center gap-4">
              {/* Decrease Buttons */}
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => setNewValue((prev) => (parseFloat(prev) - 1).toFixed(1))}
                  className="w-12 h-10 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-lg transition-all active:scale-95"
                >
                  -1
                </button>
                <button
                  type="button"
                  onClick={() => setNewValue((prev) => (parseFloat(prev) - 0.1).toFixed(1))}
                  className="w-12 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 font-bold text-sm transition-all active:scale-95"
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
                  className="w-36 bg-transparent text-6xl font-black text-white text-center outline-none"
                  style={{ caretColor: 'white' }}
                />
                <p className="text-white/50 text-sm font-medium mt-1">kilograms</p>
              </div>

              {/* Increase Buttons */}
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => setNewValue((prev) => (parseFloat(prev) + 1).toFixed(1))}
                  className="w-12 h-10 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-lg transition-all active:scale-95"
                >
                  +1
                </button>
                <button
                  type="button"
                  onClick={() => setNewValue((prev) => (parseFloat(prev) + 0.1).toFixed(1))}
                  className="w-12 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 font-bold text-sm transition-all active:scale-95"
                >
                  +0.1
                </button>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="flex justify-center gap-2 mt-4 pt-4 border-t border-white/10">
              {[profile.weightGoal - 1, profile.weightGoal, profile.weightGoal + 1, profile.weightGoal + 2].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setNewValue(preset.toFixed(1))}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    parseFloat(newValue) === preset
                      ? 'bg-white text-pink-500'
                      : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
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
            className="w-full py-4 rounded-2xl font-bold text-pink-500 bg-white hover:bg-white/90 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98]"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-pink-500/30 border-t-pink-500 rounded-full animate-spin" />
            ) : (
              <>
                <ICONS.Plus className="w-5 h-5" />
                Save Weight
              </>
            )}
          </button>
        </form>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Current Weight */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current</p>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{currentWeight.toFixed(1)}</p>
          <p className="text-xs text-slate-400">kg</p>
        </div>

        {/* Change */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Change</p>
          <p className={`text-3xl font-black mt-1 ${weightChange <= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)}
          </p>
          <p className="text-xs text-slate-400">vs last entry</p>
        </div>

        {/* From Target */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">From Target</p>
          <p className={`text-3xl font-black mt-1 ${Math.abs(targetDiff) <= 0.5 ? 'text-emerald-500' : Math.abs(targetDiff) <= 1.5 ? 'text-amber-500' : 'text-rose-500'}`}>
            {targetDiff > 0 ? '+' : ''}{targetDiff.toFixed(1)}
          </p>
          <p className="text-xs text-slate-400">kg from {profile.weightGoal}</p>
        </div>

        {/* Confidence */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dry Weight Accuracy</p>
          <p className={`text-2xl font-black mt-1 text-${confidence.color}-500`}>{confidence.status}</p>
          <div className="mt-2 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div className={`h-full bg-${confidence.color}-500 transition-all duration-500`} style={{ width: `${confidence.percent}%` }} />
          </div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">Weight Trend</h2>
            <p className="text-sm text-slate-400">Track your progress over time</p>
          </div>

          {/* Time Range Selector */}
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
            {[
              { id: '7', label: '7 Days' },
              { id: '30', label: '30 Days' },
              { id: '90', label: '90 Days' },
            ].map((range) => (
              <button
                key={range.id}
                onClick={() => setTimeRange(range.id as any)}
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

        {/* Chart */}
        <div className="h-[300px]">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  dy={10}
                />
                <YAxis
                  domain={[weightRange.min, weightRange.max]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    backgroundColor: '#1e293b',
                    color: '#fff',
                    fontSize: '12px',
                    padding: '12px',
                  }}
                  formatter={(value: number) => [`${value.toFixed(1)} kg`, 'Weight']}
                />
                <ReferenceLine
                  y={profile.weightGoal}
                  stroke="#10b981"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  label={{
                    value: `Target: ${profile.weightGoal}`,
                    position: 'right',
                    fill: '#10b981',
                    fontSize: 11,
                    fontWeight: 'bold',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="weight"
                  stroke="#ec4899"
                  strokeWidth={3}
                  fill="url(#weightGradient)"
                  dot={{ r: 4, fill: '#ec4899', strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: '#ec4899', strokeWidth: 2, stroke: '#fff' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <ICONS.Scale className="w-12 h-12 mb-3 opacity-30" />
              <p className="font-medium">No data for this period</p>
              <p className="text-sm">Log your weight to see trends</p>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-pink-500" />
            <span className="text-xs text-slate-500">Weight</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 bg-emerald-500" style={{ borderStyle: 'dashed' }} />
            <span className="text-xs text-slate-500">Target ({profile.weightGoal} kg)</span>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">History</h2>
              <p className="text-sm text-slate-400">{totalItems} total entries</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAnalyzeModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl text-xs font-bold transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                AI Analyze
              </button>
              <button
                onClick={() => setShowExportModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export
              </button>
              <button
                onClick={() => setShowDeleteAllModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition-all"
              >
                <ICONS.Trash className="w-4 h-4" />
                Delete All
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50">
                <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date & Time</th>
                <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Weight</th>
                <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Context</th>
                <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">vs Target</th>
                <th className="px-6 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {isTableLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-5 h-5 border-2 border-pink-500/30 border-t-pink-500 rounded-full animate-spin" />
                      <span className="text-slate-400 text-sm">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : weights.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <ICONS.Scale className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="text-slate-400">No weight entries yet</p>
                  </td>
                </tr>
              ) : (
                weights.map((weight) => {
                  const displayType = apiToType[weight.context] || weight.context;
                  const config = contextConfig[displayType as keyof typeof contextConfig];
                  const diff = weight.weightKg - profile.weightGoal;

                  return (
                    <tr key={weight._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900 dark:text-white">
                          {new Date(weight.loggedAt).toLocaleDateString(undefined, {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                        <p className="text-xs text-slate-400">
                          {new Date(weight.loggedAt).toLocaleTimeString(undefined, {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xl font-black text-slate-900 dark:text-white">
                          {weight.weightKg.toFixed(1)}
                        </span>
                        <span className="text-sm text-slate-400 ml-1">kg</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-${config?.color || 'slate'}-100 dark:bg-${config?.color || 'slate'}-500/20 text-${config?.color || 'slate'}-600 dark:text-${config?.color || 'slate'}-400`}>
                          <span>{config?.icon}</span>
                          {config?.label || displayType}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-bold ${Math.abs(diff) <= 0.5 ? 'text-emerald-500' : Math.abs(diff) <= 1.5 ? 'text-amber-500' : 'text-rose-500'}`}>
                          {diff > 0 ? '+' : ''}{diff.toFixed(1)} kg
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
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
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
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
                Previous
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
                        ? 'bg-pink-500 text-white'
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
              <div className="w-16 h-16 bg-rose-100 dark:bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
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
                className="flex-1 py-3 rounded-xl font-bold text-white bg-rose-500 hover:bg-rose-600 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
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
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                          analysisDays === days
                            ? 'bg-purple-500 text-white'
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
                  className="w-full py-4 rounded-xl font-bold text-white bg-purple-500 hover:bg-purple-600 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
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
                <div className="bg-purple-50 dark:bg-purple-500/10 rounded-2xl p-5 border border-purple-100 dark:border-purple-500/20">
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
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
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-2xl">📊</span>
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
                <div className="w-12 h-12 bg-sky-100 dark:bg-sky-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-2xl">{ }</span>
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
