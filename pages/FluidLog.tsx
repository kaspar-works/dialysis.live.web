
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useStore } from '../store';
import { ICONS } from '../constants';
import { createFluidLog, getTodayFluidIntake, getFluidLogs, deleteFluidLog, FluidLog as FluidLogType, FluidSource } from '../services/fluid';

const beverages: { name: string; source: FluidSource; icon: string; color: string; bg: string }[] = [
  { name: 'Water', source: 'water', icon: '💧', color: 'bg-sky-500', bg: 'bg-sky-500/20' },
  { name: 'Tea', source: 'tea', icon: '🍵', color: 'bg-emerald-500', bg: 'bg-emerald-500/20' },
  { name: 'Coffee', source: 'coffee', icon: '☕', color: 'bg-amber-600', bg: 'bg-amber-500/20' },
  { name: 'Juice', source: 'juice', icon: '🧃', color: 'bg-orange-500', bg: 'bg-orange-500/20' },
  { name: 'Soup', source: 'soup', icon: '🥣', color: 'bg-rose-500', bg: 'bg-rose-500/20' },
];

const FluidLog: React.FC = () => {
  const { profile } = useStore();
  const [selectedBeverage, setSelectedBeverage] = useState(beverages[0]);
  const [customAmount, setCustomAmount] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [logs, setLogs] = useState<FluidLogType[]>([]);
  const [totalToday, setTotalToday] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchFluidData();
  }, []);

  const fetchFluidData = async () => {
    setIsLoading(true);
    try {
      const [todayData, logsData] = await Promise.all([
        getTodayFluidIntake(),
        getFluidLogs({ limit: 100 })
      ]);
      setTotalToday(todayData.totalMl);
      setLogs(logsData.logs);
    } catch (err) {
      console.error('Failed to fetch fluid data:', err);
      setError('Failed to load data');
    } finally {
      setIsLoading(false);
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
        label: i === 0 ? 'Today' : i === 1 ? 'Yesterday' : date.toLocaleDateString('en', { weekday: 'short' }),
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
    } catch (err) {
      setError('Failed to add');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (logId: string) => {
    const log = logs.find(l => l._id === logId);
    if (!log) return;

    try {
      await deleteFluidLog(logId);
      setLogs(prev => prev.filter(l => l._id !== logId));
      if (log.loggedAt.startsWith(today)) {
        setTotalToday(prev => Math.max(prev - log.amountMl, 0));
      }
    } catch (err) {
      setError('Failed to delete');
    }
  };

  // SVG Area Chart Path
  const areaPath = useMemo(() => {
    const width = 100;
    const height = 100;
    const points = hourlyData.map((val, i) => ({
      x: (i / 23) * width,
      y: height - (val / maxHourly) * height * 0.85
    }));

    let path = `M 0 ${height}`;
    points.forEach((p, i) => {
      if (i === 0) {
        path += ` L ${p.x} ${p.y}`;
      } else {
        const prev = points[i - 1];
        const cpX = (prev.x + p.x) / 2;
        path += ` C ${cpX} ${prev.y}, ${cpX} ${p.y}, ${p.x} ${p.y}`;
      }
    });
    path += ` L ${width} ${height} Z`;
    return path;
  }, [hourlyData, maxHourly]);

  const linePath = useMemo(() => {
    const width = 100;
    const height = 100;
    const points = hourlyData.map((val, i) => ({
      x: (i / 23) * width,
      y: height - (val / maxHourly) * height * 0.85
    }));

    let path = '';
    points.forEach((p, i) => {
      if (i === 0) {
        path += `M ${p.x} ${p.y}`;
      } else {
        const prev = points[i - 1];
        const cpX = (prev.x + p.x) / 2;
        path += ` C ${cpX} ${prev.y}, ${cpX} ${p.y}, ${p.x} ${p.y}`;
      }
    });
    return path;
  }, [hourlyData, maxHourly]);

  if (isLoading) {
    return (
      <div className="w-full px-4 py-20 flex justify-center">
        <div className="w-10 h-10 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 pb-24 px-4 animate-in fade-in duration-500">

      {/* Header */}
      <header className="flex items-center justify-between pt-2">
        <div>
          <span className="text-sky-500 text-xs font-bold uppercase tracking-wider">Hydration</span>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Fluid Tracker</h1>
        </div>
      </header>

      {error && (
        <div className="bg-rose-500/10 text-rose-500 text-sm font-medium px-4 py-3 rounded-xl flex items-center justify-between">
          {error}
          <button onClick={() => setError(null)}><ICONS.X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column - Progress & Quick Add */}
        <div className="lg:col-span-1 space-y-6">

          {/* Progress Card */}
          <div className="bg-slate-900 rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-sky-500/20 rounded-full blur-3xl" />

            <div className="relative">
              <div className="flex items-center justify-center mb-4">
                <div className="relative">
                  <svg width="160" height="160" className="-rotate-90">
                    <circle cx="80" cy="80" r="70" stroke="rgba(255,255,255,0.1)" strokeWidth="10" fill="none" />
                    <circle
                      cx="80" cy="80" r="70"
                      stroke={isOverLimit ? '#F43F5E' : '#0EA5E9'}
                      strokeWidth="10"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={440}
                      strokeDashoffset={440 - (440 * Math.min(percent, 100)) / 100}
                      className="transition-all duration-700 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-white tabular-nums">{totalToday}</span>
                    <span className="text-white/40 text-xs font-medium">of {profile.dailyFluidLimit} ml</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <p className="text-white/40 text-[10px] font-medium uppercase tracking-wider">
                    {isOverLimit ? 'Over' : 'Left'}
                  </p>
                  <p className={`text-lg font-black tabular-nums ${isOverLimit ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {Math.abs(remaining)}
                  </p>
                </div>
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <p className="text-white/40 text-[10px] font-medium uppercase tracking-wider">Progress</p>
                  <p className="text-lg font-black text-white tabular-nums">{Math.round(percent)}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Beverage Selection */}
          <div className="flex flex-wrap gap-2">
            {beverages.map(bev => (
              <button
                key={bev.source}
                onClick={() => setSelectedBeverage(bev)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                  selectedBeverage.source === bev.source
                    ? `${bev.color} text-white shadow-lg`
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}
              >
                <span>{bev.icon}</span>
                <span>{bev.name}</span>
              </button>
            ))}
          </div>

          {/* Quick Add */}
          <div className="grid grid-cols-4 gap-2">
            {[100, 150, 200, 250, 300, 350, 400, 500].map(amount => (
              <button
                key={amount}
                onClick={() => handleAdd(amount)}
                disabled={isAdding}
                className="py-3 rounded-xl font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white hover:border-sky-400 hover:bg-sky-50 dark:hover:bg-sky-500/10 active:scale-95 transition-all disabled:opacity-50"
              >
                {amount}
              </button>
            ))}
          </div>

          {/* Custom Input */}
          <div className="flex gap-2">
            <input
              type="number"
              value={customAmount}
              onChange={e => setCustomAmount(e.target.value)}
              placeholder="Custom ml"
              className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-bold text-slate-900 dark:text-white outline-none focus:border-sky-400 transition-colors"
            />
            <button
              onClick={() => handleAdd(parseInt(customAmount) || 0)}
              disabled={!customAmount || isAdding}
              className="px-6 rounded-xl font-bold bg-sky-500 text-white hover:bg-sky-600 active:scale-95 transition-all disabled:opacity-50"
            >
              {isAdding ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Add'}
            </button>
          </div>
        </div>

        {/* Right Column - Charts */}
        <div className="lg:col-span-2 space-y-6">

          {/* Today's Hourly Chart */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Today's Intake</h3>
              <span className="text-xs text-slate-400">Hourly breakdown</span>
            </div>

            <div className="h-48 relative">
              {/* Grid lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className="border-t border-slate-100 dark:border-slate-700" />
                ))}
              </div>

              {/* Area Chart */}
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0EA5E9" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d={areaPath} fill="url(#areaGradient)" />
                <path d={linePath} fill="none" stroke="#0EA5E9" strokeWidth="0.5" strokeLinecap="round" />
              </svg>

              {/* Hour labels */}
              <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[10px] text-slate-400 transform translate-y-5">
                <span>12am</span>
                <span>6am</span>
                <span>12pm</span>
                <span>6pm</span>
                <span>Now</span>
              </div>
            </div>
          </div>

          {/* Weekly Bar Chart */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Last 7 Days</h3>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="w-2 h-2 bg-sky-500 rounded-full"></span>
                <span>Under limit</span>
                <span className="w-2 h-2 bg-rose-500 rounded-full ml-2"></span>
                <span>Over limit</span>
              </div>
            </div>

            <div className="h-48 flex items-end gap-3">
              {weeklyData.map((day, i) => {
                const heightPercent = maxWeekly > 0 ? (day.total / maxWeekly) * 100 : 0;
                const limitPercent = (profile.dailyFluidLimit / maxWeekly) * 100;
                const isToday = i === 6;
                const isOver = day.total > profile.dailyFluidLimit;

                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center h-full">
                    {/* Value label */}
                    <span className={`text-xs font-bold mb-2 tabular-nums ${isToday ? 'text-sky-500' : 'text-slate-400'}`}>
                      {day.total > 0 ? day.total : ''}
                    </span>

                    {/* Bar container */}
                    <div className="flex-1 w-full flex items-end justify-center relative">
                      {/* Limit line */}
                      <div
                        className="absolute left-0 right-0 border-t-2 border-dashed border-slate-300 dark:border-slate-600"
                        style={{ bottom: `${limitPercent}%` }}
                      />

                      {/* Bar */}
                      <div
                        className={`w-full max-w-[40px] rounded-t-lg transition-all duration-500 ${
                          isOver
                            ? 'bg-gradient-to-t from-rose-500 to-rose-400'
                            : isToday
                              ? 'bg-gradient-to-t from-sky-500 to-sky-400'
                              : 'bg-gradient-to-t from-slate-300 to-slate-200 dark:from-slate-600 dark:to-slate-500'
                        }`}
                        style={{ height: `${Math.max(heightPercent, 2)}%` }}
                      />
                    </div>

                    {/* Day label */}
                    <span className={`text-xs font-bold mt-2 ${isToday ? 'text-sky-500' : 'text-slate-400'}`}>
                      {day.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Today's Entries */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Today's Entries</h3>
              <span className="text-xs text-slate-400 tabular-nums">{todayLogs.length} items</span>
            </div>

            {todayLogs.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {todayLogs.map(log => {
                  const bev = beverages.find(b => b.source === log.source) || beverages[0];
                  return (
                    <div
                      key={log._id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 group hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <div className={`w-9 h-9 rounded-lg ${bev.color} flex items-center justify-center text-base`}>
                        {bev.icon}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-slate-900 dark:text-white text-sm">{bev.name}</p>
                        <p className="text-xs text-slate-400">
                          {new Date(log.loggedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <span className="font-black text-slate-900 dark:text-white tabular-nums">{log.amountMl}<span className="text-xs text-slate-400 ml-1">ml</span></span>
                      <button
                        onClick={() => handleDelete(log._id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition-all"
                      >
                        <ICONS.X className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center">
                <span className="text-3xl mb-2 block">💧</span>
                <p className="text-slate-400 font-medium">No entries yet today</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FluidLog;
