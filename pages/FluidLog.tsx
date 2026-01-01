import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store';
import { ICONS } from '../constants';
import { createFluidLog, getTodayFluidIntake, getFluidLogs, deleteFluidLog, FluidLog as FluidLogType, FluidSource, FluidPagination } from '../services/fluid';
import { SubscriptionLimitError } from '../services/auth';

const beverages: { name: string; source: FluidSource; icon: string; color: string; gradient: string }[] = [
  { name: 'Water', source: 'water', icon: '💧', color: 'sky', gradient: 'from-sky-400 to-cyan-500' },
  { name: 'Tea', source: 'tea', icon: '🍵', color: 'emerald', gradient: 'from-emerald-400 to-teal-500' },
  { name: 'Coffee', source: 'coffee', icon: '☕', color: 'amber', gradient: 'from-amber-500 to-orange-600' },
  { name: 'Juice', source: 'juice', icon: '🧃', color: 'orange', gradient: 'from-orange-400 to-rose-500' },
  { name: 'Soup', source: 'soup', icon: '🥣', color: 'rose', gradient: 'from-rose-400 to-pink-500' },
];

const quickAmounts = [100, 150, 200, 250, 300, 500];

const FluidLog: React.FC = () => {
  const { profile } = useStore();
  const [selectedBeverage, setSelectedBeverage] = useState(beverages[0]);
  const [customAmount, setCustomAmount] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [logs, setLogs] = useState<FluidLogType[]>([]);
  const [totalToday, setTotalToday] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentlyAdded, setRecentlyAdded] = useState<string | null>(null);
  const [deleteModalLog, setDeleteModalLog] = useState<FluidLogType | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [pagination, setPagination] = useState<FluidPagination | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [limitError, setLimitError] = useState<{ message: string; limit?: number } | null>(null);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchFluidData();
  }, []);

  const LOGS_PER_PAGE = 10;

  const fetchFluidData = async () => {
    setIsLoading(true);
    try {
      const [todayData, logsData] = await Promise.all([
        getTodayFluidIntake(),
        getFluidLogs({ limit: LOGS_PER_PAGE })
      ]);
      setTotalToday(todayData.totalMl);
      setLogs(logsData.logs);
      setPagination(logsData.pagination);
    } catch (err: any) {
      if (!err?.message?.includes('Session expired')) {
        console.error('Failed to fetch fluid data:', err);
        setError('Failed to load data');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoreLogs = async () => {
    if (!pagination?.hasNext || isLoadingMore) return;

    setIsLoadingMore(true);
    try {
      const logsData = await getFluidLogs({
        limit: LOGS_PER_PAGE,
        offset: pagination.offset + LOGS_PER_PAGE
      });
      setLogs(prev => [...prev, ...logsData.logs]);
      setPagination(logsData.pagination);
    } catch (err) {
      setError('Failed to load more');
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Calculate weekly data for chart
  const weeklyData = useMemo(() => {
    const days: { date: string; label: string; shortLabel: string; total: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayLogs = logs.filter(l => l.loggedAt.startsWith(dateStr));
      const total = dayLogs.reduce((sum, l) => sum + l.amountMl, 0);
      days.push({
        date: dateStr,
        label: i === 0 ? 'Today' : i === 1 ? 'Yday' : date.toLocaleDateString('en', { weekday: 'short' }),
        shortLabel: date.toLocaleDateString('en', { weekday: 'short' }).charAt(0),
        total
      });
    }
    return days;
  }, [logs]);

  // Hourly breakdown for today
  const hourlyData = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayLogs = logs.filter(l => l.loggedAt.startsWith(today));
    const hours: number[] = Array(24).fill(0);
    todayLogs.forEach(log => {
      const hour = new Date(log.loggedAt).getHours();
      hours[hour] += log.amountMl;
    });
    return hours;
  }, [logs]);

  // Beverage breakdown for today
  const beverageBreakdown = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayLogs = logs.filter(l => l.loggedAt.startsWith(today));
    return beverages.map(bev => ({
      ...bev,
      total: todayLogs.filter(l => l.source === bev.source).reduce((sum, l) => sum + l.amountMl, 0),
    }));
  }, [logs]);

  const maxHourly = Math.max(...hourlyData, 100);
  const maxWeekly = Math.max(...weeklyData.map(d => d.total), profile.dailyFluidLimit);
  const percent = Math.min((totalToday / profile.dailyFluidLimit) * 100, 100);
  const isOverLimit = totalToday > profile.dailyFluidLimit;
  const remaining = profile.dailyFluidLimit - totalToday;

  const today = new Date().toISOString().split('T')[0];
  const todayLogs = logs.filter(l => l.loggedAt.startsWith(today));

  const handleAdd = async (amount: number) => {
    if (isAdding || amount <= 0) return;
    setIsAdding(true);
    setError(null);

    try {
      const newLog = await createFluidLog({ amountMl: amount, source: selectedBeverage.source });
      setLogs(prev => [newLog, ...prev]);
      setTotalToday(prev => prev + amount);
      setCustomAmount('');
      setRecentlyAdded(newLog._id);
      setTimeout(() => setRecentlyAdded(null), 2000);
    } catch (err) {
      if (err instanceof SubscriptionLimitError) {
        setLimitError({ message: err.message, limit: err.limit });
      } else {
        setError('Failed to add');
      }
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteClick = (log: FluidLogType) => {
    setDeleteModalLog(log);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModalLog) return;

    const bevName = beverages.find(b => b.source === deleteModalLog.source)?.name || 'Fluid';
    const amount = deleteModalLog.amountMl;

    setIsDeleting(true);
    try {
      await deleteFluidLog(deleteModalLog._id);
      setLogs(prev => prev.filter(l => l._id !== deleteModalLog._id));
      if (deleteModalLog.loggedAt.startsWith(today)) {
        setTotalToday(prev => Math.max(prev - deleteModalLog.amountMl, 0));
      }
      setDeleteModalLog(null);
      setNotification({ message: `${bevName} entry (${amount} ml) deleted`, type: 'success' });
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      setError('Failed to delete');
    } finally {
      setIsDeleting(false);
    }
  };

  // SVG paths for hourly chart
  const { areaPath, linePath } = useMemo(() => {
    const width = 100;
    const height = 100;
    const points = hourlyData.map((val, i) => ({
      x: (i / 23) * width,
      y: height - (val / maxHourly) * height * 0.85
    }));

    let area = `M 0 ${height}`;
    let line = '';
    points.forEach((p, i) => {
      if (i === 0) {
        area += ` L ${p.x} ${p.y}`;
        line += `M ${p.x} ${p.y}`;
      } else {
        const prev = points[i - 1];
        const cpX = (prev.x + p.x) / 2;
        area += ` C ${cpX} ${prev.y}, ${cpX} ${p.y}, ${p.x} ${p.y}`;
        line += ` C ${cpX} ${prev.y}, ${cpX} ${p.y}, ${p.x} ${p.y}`;
      }
    });
    area += ` L ${width} ${height} Z`;
    return { areaPath: area, linePath: line };
  }, [hourlyData, maxHourly]);

  if (isLoading) {
    return (
      <div className="w-full px-4 py-20 flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 relative">
          <div className="absolute inset-0 border-4 border-sky-500/20 rounded-full" />
          <div className="absolute inset-0 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <span className="absolute inset-0 flex items-center justify-center text-2xl">💧</span>
        </div>
        <p className="text-slate-400 font-medium">Loading hydration data...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 pb-24 px-4 animate-in fade-in duration-500">

      {/* Header */}
      <header className="flex items-center justify-between pt-2">
        <div>
          <span className="px-3 py-1 bg-sky-500/10 text-sky-500 text-[10px] font-bold uppercase tracking-wider rounded-full">
            Hydration
          </span>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight mt-2">
            Fluid Tracker
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {todayLogs.length} entries today
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Daily Limit</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
            {profile.dailyFluidLimit}<span className="text-sm text-slate-400 ml-1">ml</span>
          </p>
        </div>
      </header>

      {/* Error */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm font-medium px-4 py-3 rounded-2xl flex items-center justify-between animate-in slide-in-from-top">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="hover:bg-rose-500/10 p-1 rounded-lg transition-colors">
            <ICONS.X className="w-4 h-4" />
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

      {/* Hero Progress Card */}
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-[2rem] p-6 md:p-8 overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl" />

        {/* Wave animation at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-24 overflow-hidden opacity-30">
          <svg className="absolute bottom-0 w-[200%] animate-wave" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M0,60 C150,120 350,0 600,60 C850,120 1050,0 1200,60 L1200,120 L0,120 Z" fill="url(#waveGradient)" />
            <defs>
              <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0EA5E9" />
                <stop offset="50%" stopColor="#06B6D4" />
                <stop offset="100%" stopColor="#0EA5E9" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="relative grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Progress Ring */}
          <div className="flex justify-center">
            <div className="relative">
              <svg width="200" height="200" className="-rotate-90">
                {/* Background track */}
                <circle cx="100" cy="100" r="85" stroke="rgba(255,255,255,0.05)" strokeWidth="12" fill="none" />
                {/* Progress arc */}
                <circle
                  cx="100" cy="100" r="85"
                  stroke={isOverLimit ? 'url(#overGradient)' : 'url(#progressGradient)'}
                  strokeWidth="12"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={534}
                  strokeDashoffset={534 - (534 * Math.min(percent, 100)) / 100}
                  className="transition-all duration-1000 ease-out"
                />
                <defs>
                  <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0EA5E9" />
                    <stop offset="100%" stopColor="#06B6D4" />
                  </linearGradient>
                  <linearGradient id="overGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#F43F5E" />
                    <stop offset="100%" stopColor="#E11D48" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Center content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl mb-1">💧</span>
                <span className="text-4xl font-black text-white tabular-nums">{totalToday}</span>
                <span className="text-white/40 text-sm font-medium">of {profile.dailyFluidLimit} ml</span>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="space-y-4">
            {/* Main stat */}
            <div className={`p-5 rounded-2xl ${isOverLimit ? 'bg-rose-500/10 border border-rose-500/20' : 'bg-white/5 border border-white/10'}`}>
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-1">
                {isOverLimit ? 'Over Limit By' : 'Remaining'}
              </p>
              <p className={`text-3xl font-black tabular-nums ${isOverLimit ? 'text-rose-400' : 'text-emerald-400'}`}>
                {Math.abs(remaining)}<span className="text-lg ml-1">ml</span>
              </p>
            </div>

            {/* Sub stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider">Progress</p>
                <p className="text-2xl font-black text-white tabular-nums mt-1">{Math.round(percent)}%</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider">Entries</p>
                <p className="text-2xl font-black text-white tabular-nums mt-1">{todayLogs.length}</p>
              </div>
            </div>

            {/* Beverage breakdown mini */}
            <div className="flex gap-2">
              {beverageBreakdown.filter(b => b.total > 0).map(bev => (
                <div key={bev.source} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-full">
                  <span className="text-sm">{bev.icon}</span>
                  <span className="text-xs font-bold text-white tabular-nums">{bev.total}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Add Section */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Quick Add</h3>

        {/* Beverage Selection */}
        <div className="flex flex-wrap gap-2 mb-5">
          {beverages.map(bev => (
            <button
              key={bev.source}
              onClick={() => setSelectedBeverage(bev)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                selectedBeverage.source === bev.source
                  ? `bg-gradient-to-r ${bev.gradient} text-white shadow-lg scale-105`
                  : 'bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <span className="text-lg">{bev.icon}</span>
              <span>{bev.name}</span>
            </button>
          ))}
        </div>

        {/* Amount buttons */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4">
          {quickAmounts.map(amount => (
            <button
              key={amount}
              onClick={() => handleAdd(amount)}
              disabled={isAdding}
              className={`relative py-4 rounded-xl font-black text-lg transition-all overflow-hidden group
                bg-slate-50 dark:bg-slate-700/50 text-slate-700 dark:text-white
                hover:bg-gradient-to-r hover:${selectedBeverage.gradient} hover:text-white
                active:scale-95 disabled:opacity-50 border border-slate-200 dark:border-slate-600
                hover:border-transparent hover:shadow-lg`}
            >
              <span className="relative z-10">{amount}</span>
              <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-bold text-slate-400 group-hover:text-white/70">ml</span>
            </button>
          ))}
        </div>

        {/* Custom Input */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <input
              type="number"
              value={customAmount}
              onChange={e => setCustomAmount(e.target.value)}
              placeholder="Custom amount"
              className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl px-5 py-4 font-bold text-lg text-slate-900 dark:text-white outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-500/10 transition-all"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">ml</span>
          </div>
          <button
            onClick={() => handleAdd(parseInt(customAmount) || 0)}
            disabled={!customAmount || isAdding}
            className={`px-8 rounded-xl font-black text-white transition-all bg-gradient-to-r ${selectedBeverage.gradient} hover:shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100`}
          >
            {isAdding ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <ICONS.Plus className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Hourly Chart */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Today's Pattern</h3>
              <p className="text-slate-400 text-sm">Hourly intake distribution</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-sky-500 tabular-nums">{totalToday}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total ml</p>
            </div>
          </div>

          <div className="h-40 relative">
            {/* Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className="border-t border-slate-100 dark:border-slate-700/50" />
              ))}
            </div>

            {/* Area Chart */}
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
              <defs>
                <linearGradient id="hourlyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0EA5E9" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={areaPath} fill="url(#hourlyGradient)" />
              <path d={linePath} fill="none" stroke="#0EA5E9" strokeWidth="0.8" strokeLinecap="round" />
            </svg>

            {/* Hour labels */}
            <div className="absolute -bottom-6 left-0 right-0 flex justify-between text-[10px] font-bold text-slate-400">
              <span>12am</span>
              <span>6am</span>
              <span>12pm</span>
              <span>6pm</span>
              <span>Now</span>
            </div>
          </div>
        </div>

        {/* Weekly Chart */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Weekly Overview</h3>
              <p className="text-slate-400 text-sm">Last 7 days comparison</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-sky-500 rounded-full"></span>
                Under
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-rose-500 rounded-full"></span>
                Over
              </span>
            </div>
          </div>

          <div className="h-40 flex items-end gap-2">
            {weeklyData.map((day, i) => {
              const heightPercent = maxWeekly > 0 ? (day.total / maxWeekly) * 100 : 0;
              const isToday = i === 6;
              const isOver = day.total > profile.dailyFluidLimit;

              return (
                <div key={day.date} className="flex-1 flex flex-col items-center h-full group">
                  {/* Value on hover */}
                  <div className="flex-1 w-full flex flex-col items-center justify-end">
                    <span className={`text-[10px] font-bold mb-1 opacity-0 group-hover:opacity-100 transition-opacity tabular-nums ${
                      isToday ? 'text-sky-500' : 'text-slate-400'
                    }`}>
                      {day.total || 0}
                    </span>

                    {/* Bar */}
                    <div
                      className={`w-full max-w-[32px] rounded-t-lg transition-all duration-500 ${
                        isOver
                          ? 'bg-gradient-to-t from-rose-500 to-rose-400'
                          : isToday
                            ? 'bg-gradient-to-t from-sky-500 to-cyan-400'
                            : 'bg-gradient-to-t from-slate-200 to-slate-100 dark:from-slate-600 dark:to-slate-500'
                      }`}
                      style={{ height: `${Math.max(heightPercent, 4)}%` }}
                    />
                  </div>

                  {/* Day label */}
                  <span className={`text-[10px] font-bold mt-2 ${isToday ? 'text-sky-500' : 'text-slate-400'}`}>
                    {day.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Limit line indicator */}
          <div className="mt-2 pt-2 border-t border-dashed border-slate-200 dark:border-slate-700">
            <p className="text-[10px] font-bold text-slate-400 text-center">
              Daily limit: {profile.dailyFluidLimit} ml
            </p>
          </div>
        </div>
      </div>

      {/* Recent Entries */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Entries</h3>
            <p className="text-slate-400 text-sm">
              {pagination ? `${logs.length} of ${pagination.total} entries` : `${logs.length} entries`}
            </p>
          </div>
        </div>

        {logs.length > 0 ? (
          <div className="space-y-2">
            {logs.map((log, index) => {
              const bev = beverages.find(b => b.source === log.source) || beverages[0];
              const isNew = recentlyAdded === log._id;

              return (
                <div
                  key={log._id}
                  className={`flex items-center gap-4 p-4 rounded-2xl transition-all group ${
                    isNew
                      ? 'bg-sky-500/10 border border-sky-500/20 animate-in slide-in-from-top'
                      : 'bg-slate-50 dark:bg-slate-700/30 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${bev.gradient} flex items-center justify-center text-xl shadow-lg`}>
                    {bev.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 dark:text-white">{bev.name}</p>
                    <p className="text-sm text-slate-400">
                      {log.loggedAt.startsWith(today)
                        ? new Date(log.loggedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : new Date(log.loggedAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                      }
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-black text-slate-900 dark:text-white tabular-nums">
                      {log.amountMl}
                    </span>
                    <span className="text-sm text-slate-400 ml-1">ml</span>
                  </div>
                  <button
                    onClick={() => handleDeleteClick(log)}
                    className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                  >
                    <ICONS.X className="w-5 h-5" />
                  </button>
                </div>
              );
            })}

            {/* Load More Button */}
            {pagination?.hasNext && (
              <button
                onClick={loadMoreLogs}
                disabled={isLoadingMore}
                className="w-full mt-4 py-3 rounded-xl font-bold text-sky-500 bg-sky-500/10 hover:bg-sky-500/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoadingMore ? (
                  <>
                    <div className="w-5 h-5 border-2 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    Load more ({pagination.total - logs.length} remaining)
                  </>
                )}
              </button>
            )}
          </div>
        ) : (
          <div className="py-12 text-center">
            <div className="w-20 h-20 bg-sky-500/10 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-4">
              💧
            </div>
            <p className="text-slate-600 dark:text-slate-300 font-bold text-lg">No entries yet</p>
            <p className="text-slate-400 text-sm mt-1">Start tracking your fluid intake above</p>
          </div>
        )}
      </div>

      {/* Wave animation styles */}
      <style>{`
        @keyframes wave {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-wave {
          animation: wave 8s linear infinite;
        }
      `}</style>

      {/* Success Notification */}
      {notification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top fade-in duration-300">
          <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl shadow-lg ${
            notification.type === 'success'
              ? 'bg-emerald-500 text-white'
              : 'bg-rose-500 text-white'
          }`}>
            {notification.type === 'success' ? (
              <ICONS.Check className="w-5 h-5" />
            ) : (
              <ICONS.X className="w-5 h-5" />
            )}
            <span className="font-bold">{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="ml-2 p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <ICONS.X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => !isDeleting && setDeleteModalLog(null)}
          />
          <div className="relative bg-white dark:bg-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 fade-in duration-200">
            <div className="text-center">
              <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
                <ICONS.X className="w-8 h-8 text-rose-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                Delete Entry
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6">
                Are you sure you want to delete this {beverages.find(b => b.source === deleteModalLog.source)?.name.toLowerCase() || 'fluid'} entry of <span className="font-bold text-slate-900 dark:text-white">{deleteModalLog.amountMl} ml</span>?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteModalLog(null)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 rounded-xl font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-rose-500 hover:bg-rose-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Delete'
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

export default FluidLog;
