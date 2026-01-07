import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { useStore } from '../store';
import { ICONS } from '../constants';
import { useSettings } from '../contexts/SettingsContext';
import { createWeightLog, getWeightLogs, deleteWeightLog, deleteAllWeightLogs, analyzeWeightLogs, exportWeightLogs, WeightLog as WeightLogApi, WeightContext, WeightAnalysis } from '../services/weight';
import { SubscriptionLimitError } from '../services/auth';

const typeToApi: Record<string, WeightContext> = {
  'morning': 'morning',
  'pre-dialysis': 'pre_dialysis',
  'post-dialysis': 'post_dialysis',
};

const apiToType: Record<WeightContext, string> = {
  'morning': 'morning',
  'pre_dialysis': 'pre-dialysis',
  'post_dialysis': 'post-dialysis',
};

const contextConfig = {
  'morning': { label: 'Morning', icon: '🌅', color: 'amber', bg: 'bg-amber-500' },
  'pre-dialysis': { label: 'Pre-Dialysis', icon: '🏥', color: 'sky', bg: 'bg-sky-500' },
  'post-dialysis': { label: 'Post-Dialysis', icon: '✅', color: 'emerald', bg: 'bg-emerald-500' },
};

const ITEMS_PER_PAGE = 10;

const WeightLog: React.FC = () => {
  const { profile } = useStore();
  const { weightUnit, displayWeight, formatWeight, convertWeightFromKg, convertWeightToKg, displayShortDate, displayWeekdayDate, displayTime } = useSettings();
  const [weights, setWeights] = useState<WeightLogApi[]>([]);
  const [newValue, setNewValue] = useState(() => {
    const goalKg = profile.weightGoal || 75.0;
    return weightUnit === 'lb' ? (goalKg * 2.20462).toFixed(1) : goalKg.toString();
  });
  const [newType, setNewType] = useState<'morning' | 'pre-dialysis' | 'post-dialysis'>('morning');
  const [timeRange, setTimeRange] = useState<'7' | '30' | '90'>('30');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [limitError, setLimitError] = useState<{ message: string; limit?: number } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [allWeights, setAllWeights] = useState<WeightLogApi[]>([]);
  const hasFetched = useRef(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [showAnalyzeModal, setShowAnalyzeModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<WeightAnalysis | null>(null);
  const [analysisDays, setAnalysisDays] = useState('30');
  const [activeTab, setActiveTab] = useState<'overview' | 'history'>('overview');

  // Validation state
  const [weightError, setWeightError] = useState('');
  const [weightTouched, setWeightTouched] = useState(false);

  // Validate weight field
  const validateWeight = (value: string): string => {
    if (!value || value.trim() === '') {
      return 'Weight is required';
    }
    const inputValue = parseFloat(value);
    if (isNaN(inputValue)) {
      return 'Enter a valid number';
    }
    const weightKg = convertWeightToKg(inputValue);
    const minKg = 20, maxKg = 300;
    if (weightKg < minKg || weightKg > maxKg) {
      const minDisplay = convertWeightFromKg(minKg);
      const maxDisplay = convertWeightFromKg(maxKg);
      return `Must be ${minDisplay.toFixed(0)}-${maxDisplay.toFixed(0)} ${weightUnit}`;
    }
    return '';
  };

  // Handle weight input change
  const handleWeightChange = (value: string) => {
    setNewValue(value);
    if (weightTouched) {
      setWeightError(validateWeight(value));
    }
  };

  // Handle weight input blur
  const handleWeightBlur = () => {
    setWeightTouched(true);
    setWeightError(validateWeight(newValue));
  };

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
      const [tableResponse, chartResponse] = await Promise.all([
        getWeightLogs({ limit: ITEMS_PER_PAGE, offset: 0 }),
        getWeightLogs({ limit: 100 }),
      ]);
      setWeights(tableResponse.logs || []);
      setTotalItems(tableResponse.pagination?.total || 0);
      setCurrentPage(1);
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
      setError('Failed to delete weight entry');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteAll = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteAllWeightLogs();
      setSuccessMessage(`Deleted ${result.deletedCount} entries`);
      setTimeout(() => setSuccessMessage(null), 3000);
      setShowDeleteAllModal(false);
      await fetchAllData();
    } catch (err) {
      setError('Failed to delete weight entries');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setAnalysisResult(null);
    try {
      const result = await analyzeWeightLogs(parseInt(analysisDays));
      setAnalysisResult(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to analyze weight data';
      setError(message);
      setShowAnalyzeModal(false);
    } finally {
      setIsAnalyzing(false);
    }
  };

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
      setError('Failed to export weight data');
    } finally {
      setIsExporting(false);
    }
  };

  const safeWeights = allWeights && Array.isArray(allWeights) ? allWeights : [];
  const currentWeightKg = safeWeights[0]?.weightKg || profile.weightGoal;
  const currentWeight = convertWeightFromKg(currentWeightKg);
  const previousWeightKg = safeWeights[1]?.weightKg || currentWeightKg;
  const weightChange = convertWeightFromKg(currentWeightKg - previousWeightKg);
  const targetDiff = currentWeight - convertWeightFromKg(profile.weightGoal);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError(null);
    setSuccessMessage(null);

    // Mark field as touched and validate
    setWeightTouched(true);
    const validationError = validateWeight(newValue);
    setWeightError(validationError);

    if (validationError) {
      return;
    }

    const inputValue = parseFloat(newValue);
    const weightKg = convertWeightToKg(inputValue);

    setIsSubmitting(true);
    try {
      await createWeightLog({
        weightKg: weightKg,
        context: typeToApi[newType],
        loggedAt: new Date().toISOString(),
      });
      await fetchAllData();
      setSuccessMessage(`${contextConfig[newType].icon} ${inputValue.toFixed(1)} ${weightUnit} logged!`);
      // Clear validation state on success
      setWeightError('');
      setWeightTouched(false);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      if (err instanceof SubscriptionLimitError) {
        setLimitError({ message: err.message, limit: err.limit });
      } else {
        setError('Failed to save weight');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const chartData = useMemo(() => {
    if (!allWeights?.length) return [];
    const days = parseInt(timeRange);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return [...allWeights]
      .filter(w => w && new Date(w.loggedAt) >= cutoff)
      .reverse()
      .map(w => ({
        date: displayShortDate(w.loggedAt),
        weight: convertWeightFromKg(w.weightKg),
        context: apiToType[w.context],
      }));
  }, [allWeights, timeRange, convertWeightFromKg]);

  const targetWeight = convertWeightFromKg(profile.weightGoal);

  const weightRange = useMemo(() => {
    if (chartData.length === 0) return { min: convertWeightFromKg(70), max: convertWeightFromKg(80) };
    const values = chartData.map(d => d.weight);
    const min = Math.min(...values, targetWeight);
    const max = Math.max(...values, targetWeight);
    const padding = (max - min) * 0.2 || 2;
    return { min: Math.floor(min - padding), max: Math.ceil(max + padding) };
  }, [chartData, targetWeight, convertWeightFromKg]);

  const weeklyTrend = useMemo(() => {
    if (!allWeights?.length || allWeights.length < 2) return 0;
    const last7 = allWeights.slice(0, 7);
    const diffKg = (last7[0]?.weightKg || 0) - (last7[last7.length - 1]?.weightKg || 0);
    return convertWeightFromKg(Math.abs(diffKg)) * (diffKg >= 0 ? 1 : -1);
  }, [allWeights, convertWeightFromKg]);

  const avgWeight = useMemo(() => {
    if (!chartData.length) return 0;
    return chartData.reduce((acc, d) => acc + d.weight, 0) / chartData.length;
  }, [chartData]);

  const svgChartPath = useMemo(() => {
    if (chartData.length < 2) return { line: '', area: '', points: [] };
    const width = 600, height = 200, padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    const range = weightRange.max - weightRange.min;
    const xStep = chartWidth / (chartData.length - 1);

    const points = chartData.map((d, i) => ({
      x: padding + i * xStep,
      y: padding + chartHeight - ((d.weight - weightRange.min) / range) * chartHeight,
      value: d.weight,
      date: d.date,
      context: d.context,
    }));

    const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const area = `${line} L ${points[points.length - 1].x} ${height - padding} L ${padding} ${height - padding} Z`;
    return { line, area, points };
  }, [chartData, weightRange]);

  const targetY = useMemo(() => {
    const height = 200, padding = 40;
    const chartHeight = height - padding * 2;
    const range = weightRange.max - weightRange.min;
    return padding + chartHeight - ((profile.weightGoal - weightRange.min) / range) * chartHeight;
  }, [weightRange, profile.weightGoal]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-pink-500/20 border-t-pink-500 rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 text-sm">Loading weight data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24 px-4 animate-in fade-in duration-500">
      {/* Success Toast */}
      {successMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top duration-300">
          <div className="bg-emerald-500 text-white px-6 py-3 rounded-xl shadow-xl flex items-center gap-2">
            <ICONS.Check className="w-5 h-5" />
            <span className="font-bold">{successMessage}</span>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl p-4 flex items-center justify-between">
          <p className="text-rose-600 dark:text-rose-400 font-medium">{error}</p>
          <button onClick={() => setError(null)} className="text-rose-500 p-1"><ICONS.X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Limit Banner */}
      {limitError && (
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-4 flex items-center gap-4">
          <span className="text-2xl">⚠️</span>
          <div className="flex-1">
            <p className="font-bold text-amber-700 dark:text-amber-400">Plan Limit Reached</p>
            <p className="text-amber-600 dark:text-amber-500 text-sm">{limitError.message}</p>
          </div>
          <Link to="/pricing" className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-bold">Upgrade</Link>
        </div>
      )}

      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <span className="text-pink-500 text-xs font-bold uppercase tracking-wider">Tracking</span>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Weight Log</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">{totalItems} entries</span>
          <button onClick={fetchAllData} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700">
            <ICONS.RefreshCw className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </header>

      {/* Quick Add Card */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <form onSubmit={handleAdd} className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-end gap-6">
            {/* Weight Input */}
            <div className="flex-1">
              <label className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3 block">
                Log Weight ({weightUnit}) <span className="text-rose-400">*</span>
              </label>
              <div className="flex items-center gap-4">
                <button type="button" onClick={() => {
                  const newVal = (parseFloat(newValue) - 0.5).toFixed(1);
                  handleWeightChange(newVal);
                }}
                  className="w-12 h-12 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-lg transition-all">-</button>
                <div className="flex-1 text-center">
                  <input
                    type="number"
                    step="0.1"
                    value={newValue}
                    onChange={(e) => handleWeightChange(e.target.value)}
                    onBlur={handleWeightBlur}
                    className={`w-full bg-transparent text-5xl font-black text-center outline-none transition-colors ${
                      weightError && weightTouched ? 'text-rose-400' : 'text-white'
                    }`}
                  />
                  <p className={`text-xs mt-1 ${weightError && weightTouched ? 'text-rose-400' : 'text-white/30'}`}>
                    {weightError && weightTouched ? weightError : weightUnit}
                  </p>
                </div>
                <button type="button" onClick={() => {
                  const newVal = (parseFloat(newValue) + 0.5).toFixed(1);
                  handleWeightChange(newVal);
                }}
                  className="w-12 h-12 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-lg transition-all">+</button>
              </div>
            </div>

            {/* Context Selection */}
            <div className="lg:w-72">
              <label className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3 block">Context</label>
              <div className="flex gap-2">
                {(['morning', 'pre-dialysis', 'post-dialysis'] as const).map((type) => {
                  const cfg = contextConfig[type];
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setNewType(type)}
                      className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex flex-col items-center gap-1 ${
                        newType === type ? 'bg-white text-slate-900' : 'bg-white/10 text-white/60 hover:bg-white/20'
                      }`}
                    >
                      <span className="text-lg">{cfg.icon}</span>
                      <span className="text-[10px]">{cfg.label.split('-')[0]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting || (weightError !== '' && weightTouched)}
              className={`lg:w-40 py-4 rounded-xl font-bold text-white disabled:opacity-50 flex items-center justify-center gap-2 transition-all ${
                weightError && weightTouched ? 'bg-slate-500 cursor-not-allowed' : 'bg-pink-500 hover:bg-pink-600'
              }`}
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <ICONS.Plus className="w-5 h-5" />
                  Log
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Current</span>
            <div className="w-8 h-8 rounded-lg bg-pink-100 dark:bg-pink-500/10 flex items-center justify-center">
              <ICONS.Scale className="w-4 h-4 text-pink-500" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white">{currentWeight.toFixed(1)}</p>
          <p className="text-xs text-slate-400">{weightUnit}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase">vs Target</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              Math.abs(targetDiff) <= (weightUnit === 'lb' ? 1.1 : 0.5) ? 'bg-emerald-100 dark:bg-emerald-500/10' : 'bg-amber-100 dark:bg-amber-500/10'
            }`}>
              <span className="text-sm">{Math.abs(targetDiff) <= (weightUnit === 'lb' ? 1.1 : 0.5) ? '🎯' : '📊'}</span>
            </div>
          </div>
          <p className={`text-3xl font-black ${Math.abs(targetDiff) <= (weightUnit === 'lb' ? 1.1 : 0.5) ? 'text-emerald-500' : targetDiff > 0 ? 'text-amber-500' : 'text-sky-500'}`}>
            {targetDiff > 0 ? '+' : ''}{targetDiff.toFixed(1)}
          </p>
          <p className="text-xs text-slate-400">from {targetWeight.toFixed(1)} {weightUnit}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase">7-Day Change</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              weeklyTrend <= 0 ? 'bg-emerald-100 dark:bg-emerald-500/10' : 'bg-rose-100 dark:bg-rose-500/10'
            }`}>
              <svg className={`w-4 h-4 ${weeklyTrend <= 0 ? 'text-emerald-500' : 'text-rose-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d={weeklyTrend <= 0 ? "M19 14l-7 7m0 0l-7-7m7 7V3" : "M5 10l7-7m0 0l7 7m-7-7v18"} />
              </svg>
            </div>
          </div>
          <p className={`text-3xl font-black ${weeklyTrend <= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            {weeklyTrend > 0 ? '+' : ''}{weeklyTrend.toFixed(1)}
          </p>
          <p className="text-xs text-slate-400">{weightUnit} this week</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Average</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-500/10 flex items-center justify-center">
              <ICONS.BarChart className="w-4 h-4 text-indigo-500" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white">{avgWeight.toFixed(1)}</p>
          <p className="text-xs text-slate-400">last {timeRange} days</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
        {[
          { id: 'overview', label: 'Trend Chart' },
          { id: 'history', label: 'History' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'overview' | 'history')}
            className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Chart Tab */}
      {activeTab === 'overview' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Weight Trend</h2>
              <p className="text-sm text-slate-400">Track progress toward your dry weight</p>
            </div>
            <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
              {['7', '30', '90'].map((r) => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r as '7' | '30' | '90')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    timeRange === r ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'
                  }`}
                >
                  {r}D
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            <div className="h-[280px] relative">
              {chartData.length > 1 ? (
                <svg viewBox="0 0 600 200" className="w-full h-full" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ec4899" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#ec4899" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {/* Grid */}
                  {[0, 1, 2, 3].map((i) => (
                    <line key={i} x1="40" y1={40 + i * 40} x2="560" y2={40 + i * 40} stroke="currentColor" strokeOpacity="0.05" className="text-slate-900 dark:text-white" />
                  ))}

                  {/* Target line */}
                  <line x1="40" y1={targetY} x2="560" y2={targetY} stroke="#10b981" strokeWidth="2" strokeDasharray="6 4" />
                  <text x="565" y={targetY + 4} fill="#10b981" fontSize="10" fontWeight="bold">{profile.weightGoal}</text>

                  {/* Area & Line */}
                  <path d={svgChartPath.area} fill="url(#areaGrad)" />
                  <path d={svgChartPath.line} fill="none" stroke="#ec4899" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                  {/* Points */}
                  {svgChartPath.points.map((p, i) => (
                    <g key={i}>
                      <circle cx={p.x} cy={p.y} r="6" fill="white" stroke="#ec4899" strokeWidth="3" />
                    </g>
                  ))}

                  {/* Y Labels */}
                  <text x="35" y="45" textAnchor="end" fill="#94a3b8" fontSize="10">{weightRange.max}</text>
                  <text x="35" y="165" textAnchor="end" fill="#94a3b8" fontSize="10">{weightRange.min}</text>
                </svg>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <ICONS.Scale className="w-12 h-12 opacity-20 mb-4" />
                  <p className="font-medium">Not enough data</p>
                  <p className="text-sm">Log at least 2 weights to see trends</p>
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-pink-500" />
                <span className="text-xs text-slate-500">Your Weight</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-0.5 border-t-2 border-dashed border-emerald-500" />
                <span className="text-xs text-slate-500">Target ({targetWeight.toFixed(1)} {weightUnit})</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Weight History</h2>
              <p className="text-sm text-slate-400">{totalItems} total entries</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setShowAnalyzeModal(true)} className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl text-xs font-bold transition-all">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                AI Analyze
              </button>
              <button onClick={() => setShowExportModal(true)} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all">
                <ICONS.Download className="w-4 h-4" />
                Export
              </button>
              <button onClick={() => setShowDeleteAllModal(true)} className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-500 hover:text-rose-500 rounded-xl text-xs font-bold transition-all">
                <ICONS.Trash className="w-4 h-4" />
                Clear
              </button>
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {isTableLoading ? (
              <div className="p-12 text-center">
                <div className="w-8 h-8 border-2 border-pink-500/30 border-t-pink-500 rounded-full animate-spin mx-auto" />
              </div>
            ) : weights.length === 0 ? (
              <div className="p-12 text-center">
                <ICONS.Scale className="w-12 h-12 text-slate-200 dark:text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 font-medium">No weight entries yet</p>
              </div>
            ) : (
              weights.map((w) => {
                const displayType = apiToType[w.context] || w.context;
                const cfg = contextConfig[displayType as keyof typeof contextConfig];
                const displayedWeight = convertWeightFromKg(w.weightKg);
                const diff = displayedWeight - targetWeight;
                const thresholdSmall = weightUnit === 'lb' ? 1.1 : 0.5;
                const thresholdMed = weightUnit === 'lb' ? 3.3 : 1.5;

                return (
                  <div key={w._id} className="p-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all group">
                    <div className={`w-10 h-10 rounded-xl ${cfg?.bg || 'bg-slate-400'} flex items-center justify-center text-white text-lg`}>
                      {cfg?.icon || '⚖️'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-black text-slate-900 dark:text-white">{displayedWeight.toFixed(1)}</span>
                        <span className="text-sm text-slate-400">{weightUnit}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          Math.abs(diff) <= thresholdSmall ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600' :
                          Math.abs(diff) <= thresholdMed ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600' :
                          'bg-rose-100 dark:bg-rose-500/20 text-rose-600'
                        }`}>
                          {diff > 0 ? '+' : ''}{diff.toFixed(1)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        {cfg?.label} • {displayWeekdayDate(w.loggedAt)} {displayTime(w.loggedAt)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteWeight(w._id)}
                      disabled={deletingId === w._id}
                      className="p-2 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100"
                    >
                      {deletingId === w._id ? <div className="w-4 h-4 border-2 border-rose-500/30 border-t-rose-500 rounded-full animate-spin" /> : <ICONS.Trash className="w-4 h-4" />}
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <p className="text-xs text-slate-400">Page {currentPage} of {totalPages}</p>
              <div className="flex items-center gap-1">
                <button onClick={() => fetchTablePage(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30">Prev</button>
                <button onClick={() => fetchTablePage(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30">Next</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete All Modal */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-rose-100 dark:bg-rose-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ICONS.Trash className="w-7 h-7 text-rose-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Delete All Weights?</h3>
              <p className="text-slate-500 mt-2">This will permanently delete {totalItems} entries.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteAllModal(false)} className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600">Cancel</button>
              <button onClick={handleDeleteAll} disabled={isDeleting} className="flex-1 py-3 rounded-xl font-bold text-white bg-rose-500 hover:bg-rose-600 disabled:opacity-50 flex items-center justify-center gap-2">
                {isDeleting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Delete All'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Analyze Modal */}
      {showAnalyzeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">AI Weight Analysis</h3>
                <p className="text-sm text-slate-400">Get insights from your data</p>
              </div>
              <button onClick={() => { setShowAnalyzeModal(false); setAnalysisResult(null); }} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">
                <ICONS.X className="w-5 h-5" />
              </button>
            </div>

            {!analysisResult ? (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Analysis Period</label>
                  <div className="flex gap-2">
                    {['7', '30', '60', '90'].map((d) => (
                      <button key={d} onClick={() => setAnalysisDays(d)} className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${analysisDays === d ? 'bg-purple-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                        {d} Days
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={handleAnalyze} disabled={isAnalyzing} className="w-full py-4 rounded-xl font-bold text-white bg-purple-500 hover:bg-purple-600 disabled:opacity-50 flex items-center justify-center gap-2">
                  {isAnalyzing ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Analyzing...</> : 'Analyze with AI'}
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4">
                    <p className="text-xs text-slate-400">Average</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-white">{convertWeightFromKg(analysisResult.statistics.averageWeight).toFixed(1)} {weightUnit}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4">
                    <p className="text-xs text-slate-400">Range</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-white">{convertWeightFromKg(analysisResult.statistics.minWeight).toFixed(1)}-{convertWeightFromKg(analysisResult.statistics.maxWeight).toFixed(1)}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4">
                    <p className="text-xs text-slate-400">Change</p>
                    <p className={`text-xl font-bold ${analysisResult.statistics.weightChange <= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {analysisResult.statistics.weightChange > 0 ? '+' : ''}{convertWeightFromKg(analysisResult.statistics.weightChange).toFixed(1)} {weightUnit}
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4">
                    <p className="text-xs text-slate-400">Entries</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-white">{analysisResult.statistics.totalEntries}</p>
                  </div>
                </div>

                <div className="bg-purple-50 dark:bg-purple-500/10 rounded-xl p-5 border border-purple-100 dark:border-purple-500/20">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                    </div>
                    <span className="font-bold text-purple-700 dark:text-purple-300">AI Insights</span>
                  </div>
                  <div className="text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">{analysisResult.analysis}</div>
                </div>

                <p className="text-xs text-slate-400 bg-slate-50 dark:bg-slate-900 rounded-xl p-3">{analysisResult.disclaimer}</p>
                <button onClick={() => setAnalysisResult(null)} className="w-full py-3 rounded-xl font-bold text-slate-600 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600">Analyze Again</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Export Data</h3>
              <button onClick={() => setShowExportModal(false)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">
                <ICONS.X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <button onClick={() => handleExport('csv')} disabled={isExporting} className="w-full p-4 rounded-xl border-2 border-slate-100 dark:border-slate-700 hover:border-emerald-500 transition-all flex items-center gap-4 group">
                <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center text-white text-xl group-hover:scale-110 transition-transform">📊</div>
                <div className="text-left flex-1">
                  <p className="font-bold text-slate-900 dark:text-white">CSV Format</p>
                  <p className="text-xs text-slate-400">Spreadsheet compatible</p>
                </div>
              </button>
              <button onClick={() => handleExport('json')} disabled={isExporting} className="w-full p-4 rounded-xl border-2 border-slate-100 dark:border-slate-700 hover:border-sky-500 transition-all flex items-center gap-4 group">
                <div className="w-12 h-12 bg-sky-500 rounded-xl flex items-center justify-center text-white text-xl group-hover:scale-110 transition-transform">{ }</div>
                <div className="text-left flex-1">
                  <p className="font-bold text-slate-900 dark:text-white">JSON Format</p>
                  <p className="text-xs text-slate-400">Developer friendly</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeightLog;
